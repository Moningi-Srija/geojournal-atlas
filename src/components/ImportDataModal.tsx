import React, { useState, useRef } from 'react';
import {
  AlertCircle,
  Camera,
  Check,
  CheckCircle2,
  Inbox,
  Loader2,
  LockKeyhole,
  Map,
  RotateCcw,
  ShieldCheck,
  UploadCloud,
  X,
  XCircle,
} from 'lucide-react';
import { useAuth } from './AuthContext';
import { importPinsInBatches } from '../utils/firestore';
import type { EntryCategory, JournalEntry } from '../types';

type ImportSource = 'google-timeline' | 'instagram';
type CandidateDecision = 'pending' | 'accepted' | 'rejected';

interface ParsedImportCandidate {
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

type TakeoutRecord = Record<string, unknown>;

const PREVIEW_LIMIT = 200;
const DEMO_TAKEOUT_RECORDS: TakeoutRecord[] = [
  { latitude: 35.6764, longitude: 139.65, timestamp: '2025-04-02T08:15:00Z', locationName: 'Tokyo', country: 'Japan', category: 'city' },
  { latitude: -8.4095, longitude: 115.1889, timestamp: '2024-12-20T07:00:00Z', locationName: 'Ubud, Bali', country: 'Indonesia', category: 'nature' },
  { latitude: 40.758, longitude: -73.9855, timestamp: '2024-09-05T18:45:00Z', locationName: 'Times Square', country: 'United States', category: 'city' },
  { latitude: 27.9881, longitude: 86.925, timestamp: '2024-05-11T05:20:00Z', locationName: 'Everest Base Camp Trail', country: 'Nepal', category: 'trek' },
  { latitude: -33.8568, longitude: 151.2153, timestamp: '2024-02-19T12:10:00Z', locationName: 'Sydney Harbour', country: 'Australia', category: 'culture' },
  { latitude: 20.2114, longitude: 85.5023, timestamp: '2023-11-08T09:40:00Z', locationName: 'Odisha Coast', country: 'India', category: 'beach' },
  { latitude: 41.0082, longitude: 28.9784, timestamp: '2023-07-26T16:30:00Z', locationName: 'Istanbul Spice Market', country: 'Türkiye', category: 'food' },
];
const DEMO_DEVICE_TIMELINE = {
  semanticSegments: [
    {
      startTime: '2025-10-18T08:30:00+09:00',
      endTime: '2025-10-18T10:15:00+09:00',
      visit: {
        topCandidate: {
          semanticType: 'historic district',
          placeLocation: { latLng: 'geo:35.0037,135.7788' },
          placeName: 'Gion, Kyoto',
        },
      },
    },
    {
      startTime: '2025-06-14T16:20:00+02:00',
      endTime: '2025-06-14T19:05:00+02:00',
      visit: {
        topCandidate: {
          semanticType: 'landmark',
          placeLocation: { latLng: 'geo:48.8584,2.2945' },
          placeName: 'Eiffel Tower, Paris',
        },
      },
    },
    {
      startTime: '2025-01-18T05:15:00+05:30',
      endTime: '2025-01-18T07:40:00+05:30',
      timelinePath: [
        { point: 'geo:13.3575,77.6802', time: '2025-01-18T05:20:00+05:30' },
        { point: 'geo:13.3702,77.6835', time: '2025-01-18T06:10:00+05:30' },
      ],
    },
  ],
};
const DEMO_INSTAGRAM_POSTS: TakeoutRecord[] = [
  { id: 'ig_kyoto', caption: 'Quiet lanes, tiny coffee shops, and one perfect rainy morning.', timestamp: '2025-04-03T07:45:00Z', location: { name: 'Gion, Kyoto', latitude: 35.0037, longitude: 135.7788, country: 'Japan' }, category: 'culture', media_url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=500&auto=format&fit=crop' },
  { id: 'ig_nandi', caption: 'Sunrise ride above the clouds. Worth every early alarm.', timestamp: '2025-01-18T01:20:00Z', location: { name: 'Nandi Hills', latitude: 13.3702, longitude: 77.6835, country: 'India' }, category: 'nature', media_url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=500&auto=format&fit=crop' },
  { id: 'ig_paris', caption: 'Walked until sunset and found the best croissant by accident.', timestamp: '2024-09-16T17:10:00Z', location: { name: 'Montmartre, Paris', latitude: 48.8867, longitude: 2.3431, country: 'France' }, category: 'food', media_url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=500&auto=format&fit=crop' },
  { id: 'ig_bali', caption: 'Rice terraces, temple bells, and a much slower pace.', timestamp: '2024-05-24T08:05:00Z', location: { name: 'Tegallalang, Bali', latitude: -8.4312, longitude: 115.2793, country: 'Indonesia' }, category: 'nature', media_url: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=500&auto=format&fit=crop' },
  { id: 'ig_goa', caption: 'Golden hour, salt in the air, no plans after sunset.', timestamp: '2023-12-29T12:25:00Z', location: { name: 'Palolem Beach, Goa', latitude: 15.0099, longitude: 74.0232, country: 'India' }, category: 'beach', media_url: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?q=80&w=500&auto=format&fit=crop' },
];
const VALID_CATEGORIES = new Set<EntryCategory>([
  'trek', 'beach', 'city', 'nature', 'food', 'culture', 'general',
]);

const finiteNumber = (value: unknown) => {
  const parsed = typeof value === 'string' ? Number(value) : value;
  return typeof parsed === 'number' && Number.isFinite(parsed) ? parsed : null;
};

const stringValue = (...values: unknown[]) =>
  values.find((value) => typeof value === 'string' && value.trim())?.toString().trim() ?? '';

const parseGeoPoint = (value: unknown) => {
  if (typeof value !== 'string') return null;
  const match = value.match(/(?:geo:)?\s*(-?\d+(?:\.\d+)?)\s*°?\s*,\s*(-?\d+(?:\.\d+)?)\s*°?/i);
  if (!match) return null;
  const lat = Number(match[1]);
  const lng = Number(match[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return null;
  }
  return { lat, lng };
};

const recordFromGeoPoint = (
  point: unknown,
  base: TakeoutRecord,
): TakeoutRecord | null => {
  const coordinates = parseGeoPoint(point);
  return coordinates ? { ...base, latitude: coordinates.lat, longitude: coordinates.lng } : null;
};

const extractGoogleTimelineRecords = (data: unknown): TakeoutRecord[] | undefined => {
  if (Array.isArray(data)) {
    return data.filter((item): item is TakeoutRecord => Boolean(item && typeof item === 'object'));
  }
  if (!data || typeof data !== 'object') return undefined;

  const container = data as Record<string, unknown>;
  if (Array.isArray(container.locations)) {
    return container.locations.filter(
      (item): item is TakeoutRecord => Boolean(item && typeof item === 'object'),
    );
  }

  if (Array.isArray(container.semanticSegments)) {
    return container.semanticSegments.flatMap((rawSegment) => {
      if (!rawSegment || typeof rawSegment !== 'object') return [];
      const segment = rawSegment as TakeoutRecord;
      const base: TakeoutRecord = {
        startTime: segment.startTime,
        timestamp: segment.startTime,
        activity: segment.activity,
      };
      const visit = segment.visit && typeof segment.visit === 'object'
        ? segment.visit as TakeoutRecord
        : {};
      const candidate = visit.topCandidate && typeof visit.topCandidate === 'object'
        ? visit.topCandidate as TakeoutRecord
        : {};
      const placeLocation = candidate.placeLocation && typeof candidate.placeLocation === 'object'
        ? candidate.placeLocation as TakeoutRecord
        : {};
      const visitPoint = stringValue(
        placeLocation.latLng,
        candidate.placeLocation,
        visit.location,
      );
      const visitRecord = recordFromGeoPoint(visitPoint, {
        ...base,
        locationName: stringValue(candidate.placeName, candidate.name, visit.placeName),
        semanticType: stringValue(candidate.semanticType, visit.semanticType),
        placeId: stringValue(candidate.placeId, visit.placeId),
      });
      if (visitRecord) return [visitRecord];

      const timelinePath = Array.isArray(segment.timelinePath)
        ? segment.timelinePath.filter(
            (item): item is TakeoutRecord => Boolean(item && typeof item === 'object'),
          )
        : [];
      if (timelinePath.length > 0) {
        const indexes = [...new Set([0, Math.floor(timelinePath.length / 2), timelinePath.length - 1])];
        return indexes
          .map((index) => {
            const pathPoint = timelinePath[index];
            return recordFromGeoPoint(pathPoint.point, {
              ...base,
              timestamp: pathPoint.time ?? segment.startTime,
              locationName: 'Timeline route point',
              semanticType: 'route',
            });
          })
          .filter((record): record is TakeoutRecord => record !== null);
      }

      const activity = segment.activity && typeof segment.activity === 'object'
        ? segment.activity as TakeoutRecord
        : {};
      return [
        recordFromGeoPoint(activity.start, { ...base, locationName: 'Trip start' }),
        recordFromGeoPoint(activity.end, { ...base, timestamp: segment.endTime, locationName: 'Trip end' }),
      ].filter((record): record is TakeoutRecord => record !== null);
    });
  }

  if (Array.isArray(container.timelineObjects)) {
    return container.timelineObjects.flatMap((rawObject) => {
      if (!rawObject || typeof rawObject !== 'object') return [];
      const timelineObject = rawObject as TakeoutRecord;
      const placeVisit = timelineObject.placeVisit && typeof timelineObject.placeVisit === 'object'
        ? timelineObject.placeVisit as TakeoutRecord
        : {};
      const location = placeVisit.location && typeof placeVisit.location === 'object'
        ? placeVisit.location as TakeoutRecord
        : {};
      if (Object.keys(location).length > 0) {
        return [{
          ...location,
          startTime: placeVisit.duration && typeof placeVisit.duration === 'object'
            ? (placeVisit.duration as TakeoutRecord).startTimestamp
            : undefined,
          locationName: stringValue(location.name, location.address),
        }];
      }

      const activitySegment = timelineObject.activitySegment && typeof timelineObject.activitySegment === 'object'
        ? timelineObject.activitySegment as TakeoutRecord
        : {};
      const startLocation = activitySegment.startLocation && typeof activitySegment.startLocation === 'object'
        ? activitySegment.startLocation as TakeoutRecord
        : {};
      const endLocation = activitySegment.endLocation && typeof activitySegment.endLocation === 'object'
        ? activitySegment.endLocation as TakeoutRecord
        : {};
      return [startLocation, endLocation]
        .filter((record) => Object.keys(record).length > 0)
        .map((record, index) => ({
          ...record,
          locationName: index === 0 ? 'Trip start' : 'Trip end',
        }));
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

const parseTimestamp = (record: TakeoutRecord) => {
  const millis = finiteNumber(record.timestampMs ?? record.startTimestampMs);
  if (millis !== null) return millis;
  const iso = stringValue(record.timestamp, record.startTime);
  const parsed = iso ? Date.parse(iso) : NaN;
  return Number.isFinite(parsed) ? parsed : Date.now();
};

const normaliseTakeoutLocation = (
  record: TakeoutRecord,
  index: number,
): ParsedImportCandidate | null => {
  const nestedLocation =
    record.location && typeof record.location === 'object'
      ? record.location as TakeoutRecord
      : {};
  const latitudeE7 = finiteNumber(record.latitudeE7 ?? nestedLocation.latitudeE7);
  const longitudeE7 = finiteNumber(record.longitudeE7 ?? nestedLocation.longitudeE7);
  const lat = latitudeE7 !== null
    ? latitudeE7 / 1e7
    : finiteNumber(record.latitude ?? record.lat ?? nestedLocation.latitude);
  const lng = longitudeE7 !== null
    ? longitudeE7 / 1e7
    : finiteNumber(record.longitude ?? record.lng ?? nestedLocation.longitude);

  if (lat === null || lng === null || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return null;
  }

  const date = parseTimestamp(record);
  const address = stringValue(record.address, nestedLocation.address);
  const explicitName = stringValue(
    record.locationName,
    record.name,
    record.placeName,
    nestedLocation.name,
  );
  const locationName = explicitName || address || `Timeline point · ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  const explicitCountry = stringValue(
    record.country,
    record.countryCode,
    nestedLocation.country,
    nestedLocation.countryCode,
  );
  const addressCountry = address.includes(',') ? address.split(',').at(-1)?.trim() ?? '' : '';
  const country = explicitCountry || (/^[\p{L} .'-]{2,56}$/u.test(addressCountry) ? addressCountry : '');
  const sourceLat = Math.round((lat + 90) * 1e7);
  const sourceLng = Math.round((lng + 180) * 1e7);

  return {
    id: `takeout_${Math.round(date)}_${sourceLat}_${sourceLng}_${index}`,
    source: 'google-timeline',
    lat,
    lng,
    date,
    locationName,
    category: inferCategory(record, locationName),
    country: country || undefined,
    accuracy: finiteNumber(record.accuracy) ?? undefined,
  };
};

const normaliseInstagramPost = (
  record: TakeoutRecord,
  index: number,
): ParsedImportCandidate | null => {
  const firstMedia = Array.isArray(record.media) && record.media[0] && typeof record.media[0] === 'object'
    ? record.media[0] as TakeoutRecord
    : record.media && typeof record.media === 'object'
      ? record.media as TakeoutRecord
      : {};
  const location = record.location && typeof record.location === 'object'
    ? record.location as TakeoutRecord
    : firstMedia.location && typeof firstMedia.location === 'object'
      ? firstMedia.location as TakeoutRecord
      : record.place && typeof record.place === 'object'
        ? record.place as TakeoutRecord
        : {};
  const coordinates = location.coordinates && typeof location.coordinates === 'object'
    ? location.coordinates as TakeoutRecord
    : {};
  const lat = finiteNumber(
    record.latitude ?? record.lat ?? location.latitude ?? location.lat ?? coordinates.latitude ?? coordinates.lat,
  );
  const lng = finiteNumber(
    record.longitude ?? record.lng ?? location.longitude ?? location.lng ?? coordinates.longitude ?? coordinates.lng,
  );

  if (lat === null || lng === null || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return null;
  }

  const rawCreatedAt = finiteNumber(record.creation_timestamp ?? firstMedia.creation_timestamp);
  const date = rawCreatedAt !== null
    ? rawCreatedAt < 1e12 ? rawCreatedAt * 1000 : rawCreatedAt
    : parseTimestamp({
        ...record,
        timestamp: record.timestamp ?? firstMedia.timestamp,
      });
  const caption = stringValue(
    record.caption,
    record.title,
    record.description,
    firstMedia.caption,
    firstMedia.title,
  );
  const locationName = stringValue(
    record.locationName,
    record.placeName,
    location.name,
    location.title,
    firstMedia.locationName,
  ) || `Instagram geotag · ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  const country = stringValue(record.country, location.country, location.countryCode);
  const mediaUrl = stringValue(
    record.media_url,
    record.thumbnail_url,
    firstMedia.media_url,
    firstMedia.thumbnail_url,
    firstMedia.uri,
  );
  const safeMediaUrl = /^(https?:\/\/|data:image\/)/i.test(mediaUrl) ? mediaUrl : '';
  const sourceUrl = stringValue(record.permalink, record.url, firstMedia.permalink);
  const explicitId = stringValue(record.id, firstMedia.id, record.shortcode);
  const title = caption.split(/[.!?\n]/)[0]?.trim().slice(0, 72) || locationName;

  return {
    id: `instagram_${explicitId || `${Math.round(date)}_${index}`}`,
    source: 'instagram',
    lat,
    lng,
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

const extractInstagramRecords = (data: unknown): unknown[] | undefined => {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== 'object') return undefined;

  const container = data as Record<string, unknown>;
  return [container.posts, container.media, container.items, container.content, container.your_posts]
    .find((value): value is unknown[] => Array.isArray(value));
};

interface ImportDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void | Promise<void>;
  demoMode?: boolean;
  demoAuthorId?: string;
  onDemoImport?: (entries: JournalEntry[]) => void | Promise<void>;
}

export const ImportDataModal: React.FC<ImportDataModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
  demoMode = false,
  demoAuthorId = 'demo-explorer',
  onDemoImport,
}) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const instagramFileInputRef = useRef<HTMLInputElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Import candidates stay local until the user explicitly accepts them.
  const [parsedLocations, setParsedLocations] = useState<ParsedImportCandidate[]>([]);
  const [decisions, setDecisions] = useState<Record<string, CandidateDecision>>({});
  const [completedCount, setCompletedCount] = useState(0);
  const [invalidCount, setInvalidCount] = useState(0);

  if (!isOpen) return null;

  const resetState = () => {
    setParsedLocations([]);
    setDecisions({});
    setError('');
    setSuccess('');
    setProgress(0);
    setCompletedCount(0);
    setInvalidCount(0);
  };

  const processFile = async (file: File) => {
    resetState();
    setLoading(true);

    try {
      const text = await file.text();
      let data: unknown;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('Invalid JSON file. Please upload your Google Takeout Records.json file.');
      }

      const locations = extractGoogleTimelineRecords(data);
      if (!Array.isArray(locations) || locations.length === 0) {
        throw new Error('No supported Google Timeline records were found. Try location-history.json, Timeline.json, or the older Records.json export.');
      }

      const parsed = locations
        .map((location, index) =>
          location && typeof location === 'object'
            ? normaliseTakeoutLocation(location as TakeoutRecord, index)
            : null,
        )
        .filter((location): location is ParsedImportCandidate => location !== null)
        .sort((a, b) => b.date - a.date);

      if (parsed.length === 0) {
        throw new Error('No valid coordinates were found in this location history file.');
      }

      setInvalidCount(locations.length - parsed.length);
      setParsedLocations(parsed);
      setDecisions({});
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to process file.');
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) void processFile(file);
  };

  const loadDemoSample = () => {
    resetState();
    const deviceRecords = extractGoogleTimelineRecords(DEMO_DEVICE_TIMELINE) ?? [];
    const parsed = [...deviceRecords, ...DEMO_TAKEOUT_RECORDS]
      .map((record, index) => normaliseTakeoutLocation(record, index))
      .filter((location): location is ParsedImportCandidate => location !== null)
      .sort((a, b) => b.date - a.date);
    setParsedLocations(parsed);
    setDecisions({});
  };

  const processInstagramFile = async (file: File) => {
    resetState();
    setLoading(true);

    try {
      const text = await file.text();
      let data: unknown;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('Invalid JSON file. Export your Instagram information in JSON format.');
      }

      const records = extractInstagramRecords(data);
      if (!records || records.length === 0) {
        throw new Error('No Instagram post records were found in this JSON file.');
      }

      const parsed = records
        .map((record, index) =>
          record && typeof record === 'object'
            ? normaliseInstagramPost(record as TakeoutRecord, index)
            : null,
        )
        .filter((location): location is ParsedImportCandidate => location !== null)
        .sort((a, b) => b.date - a.date);

      if (parsed.length === 0) {
        throw new Error('No posts with usable geotag coordinates were found. Posts without locations were skipped.');
      }

      setInvalidCount(records.length - parsed.length);
      setParsedLocations(parsed);
      setDecisions({});
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to process Instagram export.');
    } finally {
      setLoading(false);
      if (instagramFileInputRef.current) instagramFileInputRef.current.value = '';
    }
  };

  const handleInstagramFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) void processInstagramFile(file);
  };

  const loadInstagramDemoSample = () => {
    resetState();
    const parsed = DEMO_INSTAGRAM_POSTS
      .map((record, index) => normaliseInstagramPost(record, index))
      .filter((location): location is ParsedImportCandidate => location !== null)
      .sort((a, b) => b.date - a.date);
    setParsedLocations(parsed);
    setDecisions({});
  };

  const setCandidateDecision = (candidateId: string, decision: CandidateDecision) => {
    setDecisions((current) => ({ ...current, [candidateId]: decision }));
  };

  const acceptAll = () => {
    setDecisions(Object.fromEntries(parsedLocations.map((candidate) => [candidate.id, 'accepted'])));
  };

  const rejectRemaining = () => {
    setDecisions((current) => Object.fromEntries(
      parsedLocations.map((candidate) => [
        candidate.id,
        current[candidate.id] === 'accepted' ? 'accepted' : 'rejected',
      ]),
    ));
  };

  const acceptedCandidates = parsedLocations.filter((candidate) => decisions[candidate.id] === 'accepted');
  const acceptedCount = acceptedCandidates.length;
  const rejectedCount = parsedLocations.filter((candidate) => decisions[candidate.id] === 'rejected').length;
  const pendingCount = parsedLocations.length - acceptedCount - rejectedCount;
  const currentSourceLabel = parsedLocations[0]?.source === 'instagram' ? 'Instagram' : 'Google Timeline';

  const handleImportSelected = async () => {
    if (!user && !demoMode) {
      setError('Sign in before importing memories into your private Atlas.');
      return;
    }
    if (acceptedCount === 0) return;

    setLoading(true);
    setProgress(0);
    setError('');

    try {
      const importedAt = Date.now();
      const authorId = demoMode ? demoAuthorId : user!.uid;
      const entries: JournalEntry[] = acceptedCandidates.map((location) => ({
          id: `${authorId}_${location.id}`,
          authorId,
          title: location.title || location.locationName,
          body: location.source === 'instagram'
            ? location.caption || 'Imported from an Instagram geotag.'
            : location.accuracy
              ? `Imported from Google Timeline · accuracy ${Math.round(location.accuracy)} m.`
              : 'Imported from Google Timeline.',
          photos: location.mediaUrl ? [location.mediaUrl] : [],
          locationName: location.locationName,
          lat: location.lat,
          lng: location.lng,
          date: location.date,
          visibility: 'private',
          category: location.category,
          ...(location.country ? { country: location.country } : {}),
          importSource: location.source,
          importedAt,
          ...(location.sourceUrl ? { sourceUrl: location.sourceUrl } : {}),
        }));

      let importedCount: number;
      if (demoMode) {
        await onDemoImport?.(entries);
        importedCount = entries.length;
        setCompletedCount(importedCount);
        setProgress(100);
      } else {
        importedCount = await importPinsInBatches(entries, (nextProgress) => {
          setCompletedCount(nextProgress.completed);
          setProgress(nextProgress.percent);
        });
        try {
          await onImportComplete();
        } catch (callbackError) {
          console.warn('Import completed, but the Atlas refresh callback failed.', callbackError);
        }
      }
      setSuccess(`Imported ${importedCount} accepted ${importedCount === 1 ? 'memory' : 'memories'} into your private Atlas.`);
      setLoading(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to import locations.');
      setLoading(false);
    }
  };

  const activeStep = success ? 3 : parsedLocations.length > 0 ? 2 : 1;

  return (
    <div className="import-overlay" onClick={onClose}>
      <section
        className="import-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="import-header">
          <div className="import-header-icon" aria-hidden="true">
            <Inbox size={20} />
          </div>
          <div className="import-header-copy">
            <span className="import-kicker">Memory inbox</span>
            <h2 id="import-title">Bring your travel history home.</h2>
            <p>
              {parsedLocations.length > 0
                ? 'Review every suggestion before it becomes a private memory.'
                : 'Choose an export. GeoJournal will prepare suggestions, never publish them automatically.'}
            </p>
          </div>
          <button className="import-close" type="button" onClick={onClose} aria-label="Close memory import">
            <X size={19} aria-hidden="true" />
          </button>
        </header>

        <ol className="import-steps" aria-label={`Import step ${activeStep} of 3`}>
          {['Choose source', 'Review suggestions', 'Add to Atlas'].map((label, index) => {
            const stepNumber = index + 1;
            const stateClass = stepNumber < activeStep
              ? 'import-step-complete'
              : stepNumber === activeStep
                ? 'import-step-active'
                : 'import-step-pending';
            return (
              <li className={`import-step ${stateClass}`} key={label}>
                <span className="import-step-number">
                  {stepNumber < activeStep ? <Check size={12} aria-hidden="true" /> : stepNumber}
                </span>
                <span className="import-step-label">{label}</span>
              </li>
            );
          })}
        </ol>

        <div className="import-consent-note">
          <ShieldCheck size={17} aria-hidden="true" />
          <p>
            <strong>You stay in control.</strong> Files are read only to prepare suggestions. Pending
            and rejected rows stay out; accepted rows are saved as private memories.
          </p>
        </div>

        {error && (
          <div className="import-alert import-alert-error" role="alert">
            <AlertCircle size={16} aria-hidden="true" /> <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="import-alert import-alert-success" role="status">
            <CheckCircle2 size={16} aria-hidden="true" /> <span>{success}</span>
          </div>
        )}

        {parsedLocations.length === 0 ? (
          loading ? (
            <div className="import-parsing" role="status">
              <Loader2 size={28} className="import-spinner" aria-hidden="true" />
              <div>
                <strong>Reading your export…</strong>
                <span>Finding places with usable dates and coordinates.</span>
              </div>
            </div>
          ) : (
            <div className="import-source-grid">
              <div
                className={`import-source-card import-source-timeline ${isHovering ? 'import-source-hovering' : ''}`}
                role="button"
                tabIndex={0}
                aria-label="Upload a Google Timeline JSON export"
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsHovering(true);
                }}
                onDragLeave={() => setIsHovering(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setIsHovering(false);
                  const file = event.dataTransfer.files?.[0];
                  if (file) void processFile(file);
                }}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(event) => {
                  if ((event.key === 'Enter' || event.key === ' ') && event.target === event.currentTarget) {
                    event.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
              >
                <input
                  className="import-file-input"
                  type="file"
                  accept=".json"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                />
                <div className="import-source-heading">
                  <span className="import-source-icon"><Map size={21} aria-hidden="true" /></span>
                  <span className="import-source-tag">Timeline export</span>
                </div>
                <h3>Google Timeline</h3>
                <p>Drop location-history.json, Timeline.json, or the older Records.json export.</p>
                <span className="import-source-upload"><UploadCloud size={15} aria-hidden="true" /> Choose JSON file</span>
                <button
                  type="button"
                  className="import-demo-button"
                  onClick={(event) => {
                    event.stopPropagation();
                    loadDemoSample();
                  }}
                >
                  Use demo Timeline sample
                </button>
              </div>

              <div
                className="import-source-card import-source-instagram"
                role="button"
                tabIndex={0}
                aria-label="Upload an Instagram posts JSON export"
                onClick={() => instagramFileInputRef.current?.click()}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  const file = event.dataTransfer.files?.[0];
                  if (file) void processInstagramFile(file);
                }}
                onKeyDown={(event) => {
                  if ((event.key === 'Enter' || event.key === ' ') && event.target === event.currentTarget) {
                    event.preventDefault();
                    instagramFileInputRef.current?.click();
                  }
                }}
              >
                <input
                  className="import-file-input"
                  type="file"
                  accept=".json,application/json"
                  ref={instagramFileInputRef}
                  onChange={handleInstagramFileUpload}
                />
                <div className="import-source-heading">
                  <span className="import-source-icon"><Camera size={21} aria-hidden="true" /></span>
                  <span className="import-source-tag">Posts export</span>
                </div>
                <h3>Instagram geotags</h3>
                <p>Upload posts JSON from Accounts Center. Only posts with usable geotags are suggested.</p>
                <span className="import-source-upload"><UploadCloud size={15} aria-hidden="true" /> Choose JSON file</span>
                <button
                  type="button"
                  className="import-demo-button"
                  onClick={(event) => {
                    event.stopPropagation();
                    loadInstagramDemoSample();
                  }}
                >
                  Use demo Instagram sample
                </button>
                <span className="import-source-roadmap">Direct account connection planned for V2</span>
              </div>
            </div>
          )
        ) : (
          <div className="import-review">
            <div className="import-review-header">
              <div className="import-review-title">
                <span className="import-kicker">{currentSourceLabel} · review inbox</span>
                <h3>{parsedLocations.length} suggested {parsedLocations.length === 1 ? 'memory' : 'memories'}</h3>
                <p>Accept only the moments you want. Pending suggestions are never imported.</p>
              </div>
              <div className="import-statuses" aria-label="Review status counts">
                <span className="import-status import-status-pending"><i />{pendingCount} pending</span>
                <span className="import-status import-status-accepted"><i />{acceptedCount} accepted</span>
                <span className="import-status import-status-rejected"><i />{rejectedCount} rejected</span>
              </div>
            </div>

            <div className="import-review-toolbar">
              <div className="import-bulk-actions">
                <button type="button" className="import-utility-button import-utility-accept" onClick={acceptAll} disabled={loading}>
                  <Check size={14} aria-hidden="true" /> Accept all
                </button>
                <button type="button" className="import-utility-button import-utility-reject" onClick={rejectRemaining} disabled={loading || pendingCount === 0}>
                  <XCircle size={14} aria-hidden="true" /> Reject remaining
                </button>
                <button type="button" className="import-utility-button" onClick={() => setDecisions({})} disabled={loading || (acceptedCount === 0 && rejectedCount === 0)}>
                  <RotateCcw size={14} aria-hidden="true" /> Reset
                </button>
              </div>
              <p className="import-review-note">
                {invalidCount > 0 && `${invalidCount} records without usable coordinates were skipped. `}
                {parsedLocations.length > PREVIEW_LIMIT
                  ? `Showing the newest ${PREVIEW_LIMIT}; bulk actions apply to all ${parsedLocations.length}.`
                  : 'Every usable suggestion is shown below.'}
              </p>
            </div>

            <div className="import-candidate-list">
              {parsedLocations.slice(0, PREVIEW_LIMIT).map((loc) => {
                const decision = decisions[loc.id] ?? 'pending';
                const lat = loc.lat.toFixed(4);
                const lng = loc.lng.toFixed(4);
                const date = new Date(loc.date).toLocaleDateString();
                const isInstagram = loc.source === 'instagram';

                return (
                  <article className={`import-candidate import-candidate-${decision}`} key={loc.id}>
                    <div className={`import-candidate-media ${isInstagram ? 'import-candidate-instagram' : 'import-candidate-timeline'}`}>
                      {loc.mediaUrl
                        ? <img src={loc.mediaUrl} alt="" />
                        : isInstagram
                          ? <Camera size={18} aria-hidden="true" />
                          : <Map size={18} aria-hidden="true" />}
                    </div>
                    <div className="import-candidate-copy">
                      <div className="import-candidate-labels">
                        <span className="import-candidate-source">{isInstagram ? 'Instagram' : 'Timeline'}</span>
                        {decision !== 'pending' && <span className={`import-candidate-decision import-candidate-decision-${decision}`}>{decision}</span>}
                      </div>
                      <h4>{loc.locationName}</h4>
                      {loc.caption && <p className="import-candidate-caption" title={loc.caption}>{loc.caption}</p>}
                      <p className="import-candidate-meta">{date}{loc.country ? ` · ${loc.country}` : ''} · {lat}, {lng}</p>
                    </div>
                    <div className="import-candidate-actions">
                      <button
                        type="button"
                        className={`import-decision-button import-decision-accept ${decision === 'accepted' ? 'import-decision-selected' : ''}`}
                        aria-label={`Accept ${loc.locationName}`}
                        title="Accept suggestion"
                        onClick={() => setCandidateDecision(loc.id, 'accepted')}
                        disabled={loading}
                      >
                        <Check size={16} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className={`import-decision-button import-decision-reject ${decision === 'rejected' ? 'import-decision-selected' : ''}`}
                        aria-label={`Reject ${loc.locationName}`}
                        title="Reject suggestion"
                        onClick={() => setCandidateDecision(loc.id, 'rejected')}
                        disabled={loading}
                      >
                        <X size={16} aria-hidden="true" />
                      </button>
                      {decision !== 'pending' && (
                        <button
                          type="button"
                          className="import-decision-button import-decision-undo"
                          aria-label={`Undo decision for ${loc.locationName}`}
                          title="Return to pending"
                          onClick={() => setCandidateDecision(loc.id, 'pending')}
                          disabled={loading}
                        >
                          <RotateCcw size={14} aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>

            {loading && (
              <div className="import-progress" role="status" aria-live="polite">
                <div className="import-progress-copy">
                  <span>Adding accepted memories to your private Atlas</span>
                  <strong>{completedCount} / {acceptedCount}</strong>
                </div>
                <div className="import-progress-track">
                  <div className="import-progress-bar" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}

            <footer className="import-footer">
              {success ? (
                <button
                  type="button"
                  className="import-primary-button"
                  onClick={() => {
                    onClose();
                    resetState();
                  }}
                >
                  <CheckCircle2 size={16} aria-hidden="true" /> Done
                </button>
              ) : (
                <>
                  <button type="button" className="import-secondary-button" onClick={resetState} disabled={loading}>
                    Back to sources
                  </button>
                  <button
                    type="button"
                    className="import-primary-button"
                    onClick={handleImportSelected}
                    disabled={loading || acceptedCount === 0}
                  >
                    {loading ? (
                      <>
                        <Loader2 size={16} className="import-spinner" aria-hidden="true" />
                        Importing {progress}%
                      </>
                    ) : (
                      <>
                        <LockKeyhole size={15} aria-hidden="true" />
                        Import {acceptedCount} accepted {acceptedCount === 1 ? 'memory' : 'memories'}
                      </>
                    )}
                  </button>
                </>
              )}
            </footer>
          </div>
        )}
      </section>
    </div>
  );
};
