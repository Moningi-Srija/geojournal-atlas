import type { EntryCategory } from '../types';

export type ImportSource = 'google-timeline' | 'instagram';

export interface ParsedImportCandidate {
  id: string;
  source: ImportSource;
  lat: number;
  lng: number;
  date: number;
  locationName: string;
  category: EntryCategory;
  country?: string;
  accuracy?: number;
  title?: string;
  caption?: string;
  mediaUrl?: string;
  sourceUrl?: string;
}

export type TakeoutRecord = Record<string, unknown>;

const VALID_CATEGORIES = new Set<EntryCategory>([
  'trek',
  'beach',
  'city',
  'nature',
  'food',
  'culture',
  'general',
]);

const INSTAGRAM_WRAPPER_KEYS = [
  'posts',
  'media',
  'items',
  'content',
  'your_posts',
  'ig_reels_media',
  'photos',
  'videos',
] as const;

const isRecord = (value: unknown): value is TakeoutRecord =>
  Boolean(value && typeof value === 'object' && !Array.isArray(value));

const finiteNumber = (value: unknown): number | null => {
  if (typeof value === 'string' && value.trim() === '') return null;
  const parsed = typeof value === 'string' ? Number(value) : value;
  return typeof parsed === 'number' && Number.isFinite(parsed) ? parsed : null;
};

const stringValue = (...values: unknown[]): string =>
  values.find((value) => typeof value === 'string' && value.trim())?.toString().trim() ?? '';

const parseGeoPoint = (value: unknown): { lat: number; lng: number } | null => {
  if (typeof value !== 'string') return null;
  const match = value.match(
    /(?:geo:)?\s*(-?\d+(?:\.\d+)?)\s*°?\s*,\s*(-?\d+(?:\.\d+)?)\s*°?/i,
  );
  if (!match) return null;
  const lat = Number(match[1]);
  const lng = Number(match[2]);
  return coordinatesAreValid(lat, lng) ? { lat, lng } : null;
};

const coordinatesAreValid = (lat: number | null, lng: number | null): lat is number =>
  lat !== null &&
  lng !== null &&
  Number.isFinite(lat) &&
  Number.isFinite(lng) &&
  lat >= -90 &&
  lat <= 90 &&
  lng >= -180 &&
  lng <= 180;

const coordinatesFromRecord = (
  record: TakeoutRecord,
): { lat: number; lng: number } | null => {
  const latitudeE7 = finiteNumber(record.latitudeE7);
  const longitudeE7 = finiteNumber(record.longitudeE7);
  const lat = latitudeE7 !== null
    ? latitudeE7 / 1e7
    : finiteNumber(record.latitude ?? record.lat);
  const lng = longitudeE7 !== null
    ? longitudeE7 / 1e7
    : finiteNumber(record.longitude ?? record.lng ?? record.lon);
  if (coordinatesAreValid(lat, lng)) return { lat, lng: lng as number };

  const geoPoint = parseGeoPoint(record.latLng ?? record.point ?? record.geo);
  if (geoPoint) return geoPoint;

  if (Array.isArray(record.coordinates) && record.coordinates.length >= 2) {
    // GeoJSON and Meta place payloads conventionally encode [longitude, latitude].
    const arrayLng = finiteNumber(record.coordinates[0]);
    const arrayLat = finiteNumber(record.coordinates[1]);
    if (coordinatesAreValid(arrayLat, arrayLng)) {
      return { lat: arrayLat, lng: arrayLng as number };
    }
  }

  return null;
};

const recordFromLocation = (
  value: unknown,
  base: TakeoutRecord,
): TakeoutRecord | null => {
  const stringPoint = parseGeoPoint(value);
  if (stringPoint) {
    return { ...base, latitude: stringPoint.lat, longitude: stringPoint.lng };
  }
  if (!isRecord(value)) return null;

  const point = coordinatesFromRecord(value);
  if (!point) return null;
  return {
    ...value,
    ...base,
    latitude: point.lat,
    longitude: point.lng,
  };
};

const durationTimes = (
  value: unknown,
): { startTimestamp?: unknown; endTimestamp?: unknown } => {
  if (!isRecord(value)) return {};
  return {
    startTimestamp: value.startTimestamp ?? value.startTime ?? value.startTimestampMs,
    endTimestamp: value.endTimestamp ?? value.endTime ?? value.endTimestampMs,
  };
};

/**
 * Extracts coordinate-bearing records from both current on-device Timeline exports
 * and the two legacy Google Takeout families. The returned records intentionally
 * retain their source timestamps so normalization can reject incomplete points.
 */
export const extractGoogleTimelineRecords = (
  data: unknown,
): TakeoutRecord[] | undefined => {
  if (Array.isArray(data)) return data.filter(isRecord);
  if (!isRecord(data)) return undefined;

  if (Array.isArray(data.locations)) {
    return data.locations.filter(isRecord);
  }

  if (Array.isArray(data.semanticSegments)) {
    return data.semanticSegments.filter(isRecord).flatMap((segment) => {
      const base: TakeoutRecord = {
        activity: segment.activity,
        startTime: segment.startTime,
        endTime: segment.endTime,
      };

      const visit = isRecord(segment.visit) ? segment.visit : {};
      const candidate = isRecord(visit.topCandidate) ? visit.topCandidate : {};
      const placeLocation = isRecord(candidate.placeLocation)
        ? candidate.placeLocation
        : candidate.placeLocation;
      const visitRecord = recordFromLocation(placeLocation ?? visit.location, {
        ...base,
        timestamp: segment.startTime,
        locationName: stringValue(candidate.placeName, candidate.name, visit.placeName),
        semanticType: stringValue(candidate.semanticType, visit.semanticType),
        placeId: stringValue(candidate.placeId, visit.placeId),
      });
      if (visitRecord) return [visitRecord];

      if (Array.isArray(segment.timelinePath)) {
        const pathPoints = segment.timelinePath.filter(isRecord);
        const sampleIndexes = [...new Set([
          0,
          Math.floor((pathPoints.length - 1) / 2),
          pathPoints.length - 1,
        ])].filter((index) => index >= 0 && index < pathPoints.length);
        // A Timeline path can contain hundreds of raw samples. GeoJournal stores
        // memories rather than GPS traces, so keep representative start/mid/end
        // suggestions instead of flooding the review inbox with every reading.
        const pathRecords = sampleIndexes.flatMap((index) => {
          const pathPoint = pathPoints[index];
          const record = recordFromLocation(pathPoint.point ?? pathPoint.location, {
            ...base,
            timestamp: pathPoint.time ?? pathPoint.timestamp ?? segment.startTime,
            locationName: stringValue(pathPoint.name) || 'Timeline route point',
            semanticType: 'route',
          });
          return record ? [record] : [];
        });
        if (pathRecords.length > 0) return pathRecords;
      }

      const activity = isRecord(segment.activity) ? segment.activity : {};
      const start = recordFromLocation(activity.start ?? activity.startLocation, {
        ...base,
        timestamp: segment.startTime,
        locationName: 'Trip start',
      });
      const end = recordFromLocation(activity.end ?? activity.endLocation, {
        ...base,
        timestamp: segment.endTime,
        locationName: 'Trip end',
      });
      return [start, end].filter((record): record is TakeoutRecord => record !== null);
    });
  }

  if (Array.isArray(data.timelineObjects)) {
    return data.timelineObjects.filter(isRecord).flatMap((timelineObject) => {
      const placeVisit = isRecord(timelineObject.placeVisit)
        ? timelineObject.placeVisit
        : {};
      const visitDuration = durationTimes(placeVisit.duration);
      if (isRecord(placeVisit.location)) {
        const placeRecord = recordFromLocation(placeVisit.location, {
          timestamp: visitDuration.startTimestamp,
          startTime: visitDuration.startTimestamp,
          endTime: visitDuration.endTimestamp,
          locationName: stringValue(placeVisit.location.name, placeVisit.location.address),
        });
        if (placeRecord) return [placeRecord];
      }

      const activitySegment = isRecord(timelineObject.activitySegment)
        ? timelineObject.activitySegment
        : {};
      const activityDuration = durationTimes(activitySegment.duration);
      const start = recordFromLocation(activitySegment.startLocation, {
        timestamp: activityDuration.startTimestamp,
        startTime: activityDuration.startTimestamp,
        endTime: activityDuration.endTimestamp,
        activity: activitySegment.activityType,
        locationName: 'Trip start',
      });
      const end = recordFromLocation(activitySegment.endLocation, {
        timestamp: activityDuration.endTimestamp,
        startTime: activityDuration.startTimestamp,
        endTime: activityDuration.endTimestamp,
        activity: activitySegment.activityType,
        locationName: 'Trip end',
      });
      return [start, end].filter((record): record is TakeoutRecord => record !== null);
    });
  }

  return undefined;
};

const inferCategory = (record: TakeoutRecord, locationName: string): EntryCategory => {
  const explicit = stringValue(record.category).toLowerCase() as EntryCategory;
  if (VALID_CATEGORIES.has(explicit)) return explicit;

  const activityText = JSON.stringify(record.activity ?? '').toLowerCase();
  const text = `${locationName} ${stringValue(record.semanticType)} ${activityText}`.toLowerCase();
  if (/beach|ocean|sea|coast|shore/.test(text)) return 'beach';
  if (/trek|hike|trail|mountain|climb|walking|running/.test(text)) return 'trek';
  if (/forest|park|nature|camp|wildlife|lake|waterfall/.test(text)) return 'nature';
  if (/restaurant|cafe|food|bakery|dinner|lunch/.test(text)) return 'food';
  if (/museum|temple|church|monument|heritage|gallery|culture/.test(text)) return 'culture';
  if (/city|town|airport|station|downtown|urban/.test(text)) return 'city';
  return 'general';
};

const timestampFromValue = (value: unknown): number | null => {
  const numeric = finiteNumber(value);
  if (numeric !== null) {
    const millis = Math.abs(numeric) < 1e11 ? numeric * 1000 : numeric;
    return Number.isFinite(millis) && Math.abs(millis) <= 8.64e15 ? millis : null;
  }
  if (typeof value !== 'string' || !value.trim()) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const timestampFromRecord = (
  record: TakeoutRecord,
  keys: readonly string[],
): number | null => {
  for (const key of keys) {
    const parsed = timestampFromValue(record[key]);
    if (parsed !== null) return parsed;
  }
  return null;
};

const hashFingerprint = (value: string): string => {
  // Two seeded FNV-1a passes keep IDs compact while making accidental collisions unlikely.
  let first = 0x811c9dc5;
  let second = 0x9e3779b9;
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    first = Math.imul(first ^ code, 0x01000193) >>> 0;
    second = Math.imul(second ^ code, 0x85ebca6b) >>> 0;
  }
  return `${first.toString(36)}${second.toString(36)}`;
};

const stableCandidateId = (
  prefix: 'takeout' | 'instagram',
  record: TakeoutRecord,
  fields: {
    lat: number;
    lng: number;
    date: number;
    locationName: string;
    mediaIdentity?: string;
  },
): string => {
  const explicitIdentity = [
    record.id,
    record.placeId,
    record.shortcode,
    record.uri,
    record.permalink,
    record.url,
    fields.mediaIdentity,
  ]
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .map((value) => value.trim())
    .join('|');
  const fingerprint = [
    prefix,
    explicitIdentity,
    Math.round(fields.date),
    fields.lat.toFixed(7),
    fields.lng.toFixed(7),
    fields.locationName.trim().toLowerCase(),
  ].join('|');
  return `${prefix}_${hashFingerprint(fingerprint)}`;
};

export const normaliseTakeoutLocation = (
  record: TakeoutRecord,
  _index?: number,
): ParsedImportCandidate | null => {
  const nestedLocation = isRecord(record.location) ? record.location : {};
  const coordinates = coordinatesFromRecord(record) ?? coordinatesFromRecord(nestedLocation);
  if (!coordinates) return null;

  const date = timestampFromRecord(record, [
    'timestampMs',
    'startTimestampMs',
    'timestamp',
    'startTime',
    'startTimestamp',
    'time',
  ]);
  if (date === null) return null;

  const address = stringValue(record.address, nestedLocation.address);
  const explicitName = stringValue(
    record.locationName,
    record.name,
    record.placeName,
    nestedLocation.name,
  );
  const locationName =
    explicitName || address || `Timeline point · ${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}`;
  const explicitCountry = stringValue(
    record.country,
    record.countryCode,
    nestedLocation.country,
    nestedLocation.countryCode,
  );
  const addressCountry = address.includes(',') ? address.split(',').at(-1)?.trim() ?? '' : '';
  const country = explicitCountry || (/^[\p{L} .'-]{2,56}$/u.test(addressCountry) ? addressCountry : '');

  return {
    id: stableCandidateId('takeout', record, {
      lat: coordinates.lat,
      lng: coordinates.lng,
      date,
      locationName,
    }),
    source: 'google-timeline',
    lat: coordinates.lat,
    lng: coordinates.lng,
    date,
    locationName,
    category: inferCategory(record, locationName),
    country: country || undefined,
    accuracy: finiteNumber(record.accuracy ?? nestedLocation.accuracy) ?? undefined,
  };
};

const mergeObjectEntries = (value: unknown): TakeoutRecord => {
  if (isRecord(value)) return value;
  if (!Array.isArray(value)) return {};
  return value.filter(isRecord).reduce<TakeoutRecord>(
    (merged, entry) => ({ ...merged, ...entry }),
    {},
  );
};

const exifDataFromRecord = (record: TakeoutRecord): TakeoutRecord => {
  const mediaMetadata = isRecord(record.media_metadata) ? record.media_metadata : {};
  const photoMetadata = isRecord(mediaMetadata.photo_metadata)
    ? mediaMetadata.photo_metadata
    : isRecord(record.photo_metadata)
      ? record.photo_metadata
      : {};
  const videoMetadata = isRecord(mediaMetadata.video_metadata)
    ? mediaMetadata.video_metadata
    : isRecord(record.video_metadata)
      ? record.video_metadata
      : {};
  return {
    ...mergeObjectEntries(record.exif_data),
    ...mergeObjectEntries(photoMetadata.exif_data),
    ...mergeObjectEntries(videoMetadata.exif_data),
  };
};

const instagramCoordinates = (
  record: TakeoutRecord,
  location: TakeoutRecord,
  exif: TakeoutRecord,
): { lat: number; lng: number } | null => {
  // Prefer an explicit post/place geotag, then fall back to embedded media EXIF.
  const explicit = coordinatesFromRecord(record) ?? coordinatesFromRecord(location);
  if (explicit) return explicit;

  const nestedCoordinates = isRecord(location.coordinates)
    ? coordinatesFromRecord(location.coordinates)
    : Array.isArray(location.coordinates)
      ? coordinatesFromRecord({ coordinates: location.coordinates })
      : null;
  return nestedCoordinates ?? coordinatesFromRecord(exif);
};

const instagramDate = (
  record: TakeoutRecord,
  exif: TakeoutRecord,
): number | null =>
  timestampFromRecord(record, [
    'creation_timestamp',
    'taken_at',
    'timestamp',
    'created_at',
    'date',
  ]) ??
  timestampFromRecord(exif, [
    'taken_timestamp',
    'creation_timestamp',
    'taken_at',
    'timestamp',
    'date_time_original',
  ]);

export const normaliseInstagramPost = (
  record: TakeoutRecord,
  _index?: number,
): ParsedImportCandidate | null => {
  const location = isRecord(record.location)
    ? record.location
    : isRecord(record.place)
      ? record.place
      : isRecord(record.location_data)
        ? record.location_data
        : {};
  const exif = exifDataFromRecord(record);
  const coordinates = instagramCoordinates(record, location, exif);
  if (!coordinates) return null;

  const date = instagramDate(record, exif);
  if (date === null) return null;

  const caption = stringValue(
    record.caption,
    record.title,
    record.description,
    record.text,
  );
  const locationName = stringValue(
    record.locationName,
    record.placeName,
    location.name,
    location.title,
    location.address,
    exif.location,
  ) || `Instagram geotag · ${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}`;
  const country = stringValue(
    record.country,
    location.country,
    location.countryCode,
    exif.country,
  );
  const mediaUrl = stringValue(
    record.media_url,
    record.thumbnail_url,
    record.display_url,
    record.uri,
  );
  const safeMediaUrl = /^(https?:\/\/|data:image\/)/i.test(mediaUrl) ? mediaUrl : '';
  const sourceUrl = stringValue(record.permalink, record.url, record.link);
  const title = caption.split(/[.!?\n]/)[0]?.trim().slice(0, 72) || locationName;

  return {
    id: stableCandidateId('instagram', record, {
      lat: coordinates.lat,
      lng: coordinates.lng,
      date,
      locationName,
      mediaIdentity: mediaUrl,
    }),
    source: 'instagram',
    lat: coordinates.lat,
    lng: coordinates.lng,
    date,
    locationName,
    category: inferCategory(record, `${locationName} ${caption}`),
    country: country || undefined,
    title,
    caption: caption || undefined,
    mediaUrl: safeMediaUrl || undefined,
    sourceUrl: /^https?:\/\//i.test(sourceUrl) ? sourceUrl : undefined,
  };
};

const expandInstagramMedia = (record: TakeoutRecord): TakeoutRecord[] => {
  if (!Array.isArray(record.media)) return [record];
  const mediaItems = record.media.filter(isRecord);
  if (mediaItems.length === 0) return [record];

  const { media: _media, ...parent } = record;
  return mediaItems.flatMap((mediaItem) => {
    const merged = { ...parent, ...mediaItem };
    return Array.isArray(mediaItem.media) ? expandInstagramMedia(merged) : [merged];
  });
};

/**
 * Unwraps Meta export containers and returns one record per media item. Parent
 * post fields (caption, place, timestamp) are retained on every child item.
 */
export const extractInstagramRecords = (
  data: unknown,
): TakeoutRecord[] | undefined => {
  if (Array.isArray(data)) {
    return data.filter(isRecord).flatMap(expandInstagramMedia);
  }
  if (!isRecord(data)) return undefined;

  const wrappedArrays = INSTAGRAM_WRAPPER_KEYS.flatMap((key) =>
    Array.isArray(data[key]) ? (data[key] as unknown[]).filter(isRecord) : [],
  );
  if (wrappedArrays.length === 0) return undefined;
  return wrappedArrays.flatMap(expandInstagramMedia);
};

/** Removes normalized import duplicates while preserving first-seen order. */
export const dedupeImportCandidates = (
  candidates: ParsedImportCandidate[],
): ParsedImportCandidate[] => {
  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    const key = [
      candidate.source,
      Math.round(candidate.date),
      candidate.lat.toFixed(6),
      candidate.lng.toFixed(6),
      candidate.locationName.trim().toLowerCase(),
    ].join('|');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};
