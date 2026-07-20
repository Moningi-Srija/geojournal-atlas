import test from 'node:test';
import assert from 'node:assert/strict';

import {
  dedupeImportCandidates,
  extractGoogleTimelineRecords,
  extractInstagramRecords,
  normaliseInstagramPost,
  normaliseTakeoutLocation,
  type ParsedImportCandidate,
} from '../src/utils/importParsers.ts';

test('extracts and normalises legacy Google locations', () => {
  const records = extractGoogleTimelineRecords({
    locations: [
      {
        latitudeE7: 190760000,
        longitudeE7: 728770000,
        timestampMs: '1714564800000',
        accuracy: 12,
      },
    ],
  });

  assert.equal(records?.length, 1);
  const candidate = normaliseTakeoutLocation(records![0]);
  assert.ok(candidate);
  assert.equal(candidate.lat, 19.076);
  assert.equal(candidate.lng, 72.877);
  assert.equal(candidate.date, 1_714_564_800_000);
  assert.equal(candidate.accuracy, 12);
});

test('extracts visits and samples long Google semantic segment paths', () => {
  const records = extractGoogleTimelineRecords({
    semanticSegments: [
      {
        startTime: '2026-01-02T08:00:00Z',
        visit: {
          topCandidate: {
            placeName: 'Gion, Kyoto',
            semanticType: 'historic district',
            placeLocation: { latLng: 'geo:35.0037,135.7788' },
          },
        },
      },
      {
        startTime: '2026-01-03T08:00:00Z',
        timelinePath: [
          { point: 'geo:13.3575,77.6802', time: '2026-01-03T08:10:00Z' },
          { point: 'geo:13.3702,77.6835', time: '2026-01-03T08:20:00Z' },
          { point: 'geo:13.3800,77.6900', time: '2026-01-03T08:30:00Z' },
          { point: 'geo:13.3900,77.7000', time: '2026-01-03T08:40:00Z' },
        ],
      },
    ],
  });

  assert.equal(records?.length, 4);
  const candidates = records!.map((record) => normaliseTakeoutLocation(record));
  assert.ok(candidates.every(Boolean));
  assert.equal(candidates[0]?.locationName, 'Gion, Kyoto');
  assert.equal(candidates[3]?.date, Date.parse('2026-01-03T08:40:00Z'));
});

test('preserves legacy activity segment start and end duration timestamps', () => {
  const records = extractGoogleTimelineRecords({
    timelineObjects: [
      {
        placeVisit: {
          location: {
            latitudeE7: 488584000,
            longitudeE7: 22945000,
            name: 'Eiffel Tower',
          },
          duration: {
            startTimestamp: '2026-04-01T09:00:00Z',
            endTimestamp: '2026-04-01T10:00:00Z',
          },
        },
      },
      {
        activitySegment: {
          activityType: 'WALKING',
          startLocation: { latitudeE7: 488584000, longitudeE7: 22945000 },
          endLocation: { latitudeE7: 488606000, longitudeE7: 23375000 },
          duration: {
            startTimestamp: '2026-04-01T10:15:00Z',
            endTimestamp: '2026-04-01T11:30:00Z',
          },
        },
      },
    ],
  });

  assert.equal(records?.length, 3);
  const candidates = records!.map((record) => normaliseTakeoutLocation(record));
  assert.equal(candidates[0]?.date, Date.parse('2026-04-01T09:00:00Z'));
  assert.equal(candidates[1]?.date, Date.parse('2026-04-01T10:15:00Z'));
  assert.equal(candidates[2]?.date, Date.parse('2026-04-01T11:30:00Z'));
  assert.equal(candidates[1]?.locationName, 'Trip start');
  assert.equal(candidates[2]?.locationName, 'Trip end');
});

test('rejects Google records with missing or invalid dates and out-of-range coordinates', () => {
  assert.equal(normaliseTakeoutLocation({ latitude: 12, longitude: 77 }), null);
  assert.equal(
    normaliseTakeoutLocation({ latitude: 12, longitude: 77, timestamp: 'not-a-date' }),
    null,
  );
  assert.equal(
    normaliseTakeoutLocation({ latitude: 91, longitude: 77, timestamp: '2026-01-01' }),
    null,
  );
});

test('Google candidate IDs are stable regardless of their array index', () => {
  const record = {
    latitude: 35.0037,
    longitude: 135.7788,
    timestamp: '2026-01-02T08:00:00Z',
    locationName: 'Gion, Kyoto',
  };
  const first = normaliseTakeoutLocation(record, 0);
  const reordered = normaliseTakeoutLocation(record, 912);

  assert.ok(first && reordered);
  assert.equal(first.id, reordered.id);
});

test('unwraps every supported Instagram export container', () => {
  const keys = [
    'posts',
    'media',
    'items',
    'content',
    'your_posts',
    'ig_reels_media',
    'photos',
    'videos',
  ];
  for (const key of keys) {
    const records = extractInstagramRecords({
      [key]: [{ latitude: 12.9, longitude: 77.6, creation_timestamp: 1_700_000_000 }],
    });
    assert.equal(records?.length, 1, `wrapper ${key}`);
  }
});

test('emits one Instagram record per media item while retaining parent fields', () => {
  const records = extractInstagramRecords([
    {
      id: 'carousel_42',
      caption: 'A two-photo post',
      location: { name: 'Bengaluru', latitude: 12.9716, longitude: 77.5946 },
      creation_timestamp: 1_700_000_000,
      media: [
        { uri: 'media/posts/one.jpg' },
        { uri: 'media/posts/two.jpg', creation_timestamp: 1_700_000_100 },
      ],
    },
  ]);

  assert.equal(records?.length, 2);
  assert.equal(records?.[0].caption, 'A two-photo post');
  assert.deepEqual(records?.[1].location, {
    name: 'Bengaluru',
    latitude: 12.9716,
    longitude: 77.5946,
  });
  const candidates = records!.map((record) => normaliseInstagramPost(record));
  assert.ok(candidates.every(Boolean));
  assert.notEqual(candidates[0]?.id, candidates[1]?.id);
});

test('merges Instagram photo EXIF entries to recover coordinates and capture time', () => {
  const record = {
    uri: 'media/posts/mountain.jpg',
    title: 'Sunrise hike',
    media_metadata: {
      photo_metadata: {
        exif_data: [
          { latitude: '27.9881', taken_timestamp: 1_714_800_000 },
          { longitude: '86.9250' },
        ],
      },
    },
  };

  const candidate = normaliseInstagramPost(record);
  assert.ok(candidate);
  assert.equal(candidate.lat, 27.9881);
  assert.equal(candidate.lng, 86.925);
  assert.equal(candidate.date, 1_714_800_000_000);
  assert.equal(candidate.title, 'Sunrise hike');
});

test('supports Instagram video EXIF and explicit tagged-place coordinates take priority', () => {
  const candidate = normaliseInstagramPost({
    creation_timestamp: 1_714_800_000_000,
    location: {
      name: 'Bondi Beach',
      coordinates: [151.2743, -33.8908],
      country: 'Australia',
    },
    media_metadata: {
      video_metadata: {
        exif_data: [{ latitude: 1, longitude: 2 }],
      },
    },
  });

  assert.ok(candidate);
  assert.equal(candidate.lat, -33.8908);
  assert.equal(candidate.lng, 151.2743);
  assert.equal(candidate.locationName, 'Bondi Beach');
  assert.equal(candidate.country, 'Australia');
});

test('supports Instagram taken_at and ISO timestamps, and rejects missing dates', () => {
  const takenAt = normaliseInstagramPost({
    latitude: 48.8566,
    longitude: 2.3522,
    taken_at: 1_714_800_000,
  });
  const iso = normaliseInstagramPost({
    latitude: 48.8566,
    longitude: 2.3522,
    timestamp: '2026-02-03T04:05:06Z',
  });
  const missing = normaliseInstagramPost({ latitude: 48.8566, longitude: 2.3522 });

  assert.equal(takenAt?.date, 1_714_800_000_000);
  assert.equal(iso?.date, Date.parse('2026-02-03T04:05:06Z'));
  assert.equal(missing, null);
});

test('Instagram IDs are stable regardless of array index', () => {
  const record = {
    id: 'post_123',
    latitude: 35.0037,
    longitude: 135.7788,
    creation_timestamp: 1_700_000_000,
    title: 'Kyoto lanes',
  };
  const first = normaliseInstagramPost(record, 1);
  const reordered = normaliseInstagramPost(record, 500);

  assert.ok(first && reordered);
  assert.equal(first.id, reordered.id);
});

test('deduplicates source/date/rounded-coordinate/location matches in first-seen order', () => {
  const base: ParsedImportCandidate = {
    id: 'first',
    source: 'instagram',
    lat: 12.9716001,
    lng: 77.5946001,
    date: 1_700_000_000_000,
    locationName: ' Bengaluru ',
    category: 'city',
  };
  const candidates: ParsedImportCandidate[] = [
    base,
    {
      ...base,
      id: 'duplicate',
      lat: 12.97160009,
      lng: 77.59460009,
      locationName: 'bengaluru',
    },
    { ...base, id: 'other-source', source: 'google-timeline' },
    { ...base, id: 'other-place', locationName: 'Mysuru' },
  ];

  assert.deepEqual(
    dedupeImportCandidates(candidates).map((candidate) => candidate.id),
    ['first', 'other-source', 'other-place'],
  );
});
