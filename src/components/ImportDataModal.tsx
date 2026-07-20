import React, { useState, useRef } from 'react';
import {
  AlertCircle,
  Camera,
  Check,
  CheckCircle2,
  ExternalLink,
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
import {
  dedupeImportCandidates,
  extractGoogleTimelineRecords,
  extractInstagramRecords,
  normaliseInstagramPost,
  normaliseTakeoutLocation,
  type ParsedImportCandidate,
  type TakeoutRecord,
} from '../utils/importParsers';
import type { JournalEntry } from '../types';

type CandidateDecision = 'pending' | 'accepted' | 'rejected';

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
  const [duplicateCount, setDuplicateCount] = useState(0);

  if (!isOpen) return null;

  const resetState = () => {
    setParsedLocations([]);
    setDecisions({});
    setError('');
    setSuccess('');
    setProgress(0);
    setCompletedCount(0);
    setInvalidCount(0);
    setDuplicateCount(0);
  };

  const closeAndReset = () => {
    resetState();
    onClose();
  };

  const processGoogleFiles = async (files: File[]) => {
    resetState();
    setLoading(true);

    try {
      const locations: TakeoutRecord[] = [];
      for (const file of files) {
        const text = await file.text();
        let data: unknown;
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error(`${file.name} is not readable JSON. Upload extracted Timeline JSON, not a ZIP, TGZ, or encrypted backup.`);
        }

        const extracted = extractGoogleTimelineRecords(data);
        if (!Array.isArray(extracted) || extracted.length === 0) {
          throw new Error(`${file.name} does not contain a supported Timeline structure. Try the current device export or an extracted legacy Records.json file.`);
        }
        locations.push(...extracted);
      }

      const normalised = locations
        .map((location, index) =>
          location && typeof location === 'object'
            ? normaliseTakeoutLocation(location as TakeoutRecord, index)
            : null,
        )
        .filter((location): location is ParsedImportCandidate => location !== null);
      const parsed = dedupeImportCandidates(normalised).sort((a, b) => b.date - a.date);

      if (parsed.length === 0) {
        throw new Error('Timeline data was recognized, but no records had both a usable date and valid coordinates.');
      }

      setInvalidCount(locations.length - normalised.length);
      setDuplicateCount(normalised.length - parsed.length);
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
    const files = Array.from(event.target.files ?? []);
    if (files.length > 0) void processGoogleFiles(files);
  };

  const loadDemoSample = () => {
    resetState();
    const deviceRecords = extractGoogleTimelineRecords(DEMO_DEVICE_TIMELINE) ?? [];
    const normalised = [...deviceRecords, ...DEMO_TAKEOUT_RECORDS]
      .map((record, index) => normaliseTakeoutLocation(record, index))
      .filter((location): location is ParsedImportCandidate => location !== null);
    const parsed = dedupeImportCandidates(normalised).sort((a, b) => b.date - a.date);
    setParsedLocations(parsed);
    setDecisions({});
  };

  const processInstagramFiles = async (files: File[]) => {
    resetState();
    setLoading(true);

    try {
      const records: TakeoutRecord[] = [];
      for (const file of files) {
        const text = await file.text();
        let data: unknown;
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error(`${file.name} is not readable JSON. Export Instagram information as JSON and extract the ZIP first.`);
        }

        const extracted = extractInstagramRecords(data);
        if (!extracted || extracted.length === 0) {
          throw new Error(`${file.name} does not contain recognized Instagram posts or reels.`);
        }
        records.push(...extracted);
      }

      const normalised = records
        .map((record, index) =>
          record && typeof record === 'object'
            ? normaliseInstagramPost(record as TakeoutRecord, index)
            : null,
        )
        .filter((location): location is ParsedImportCandidate => location !== null);
      const parsed = dedupeImportCandidates(normalised).sort((a, b) => b.date - a.date);

      if (parsed.length === 0) {
        throw new Error('Posts were found, but Meta did not include usable coordinates and dates in this JSON. Instagram does not guarantee coordinates for visible place tags.');
      }

      setInvalidCount(records.length - normalised.length);
      setDuplicateCount(normalised.length - parsed.length);
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
    const files = Array.from(event.target.files ?? []);
    if (files.length > 0) void processInstagramFiles(files);
  };

  const loadInstagramDemoSample = () => {
    resetState();
    const normalised = DEMO_INSTAGRAM_POSTS
      .map((record, index) => normaliseInstagramPost(record, index))
      .filter((location): location is ParsedImportCandidate => location !== null);
    const parsed = dedupeImportCandidates(normalised).sort((a, b) => b.date - a.date);
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
    <div className="import-overlay" onClick={closeAndReset}>
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
          <button className="import-close" type="button" onClick={closeAndReset} aria-label="Close memory import">
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
            <>
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
                  const files = Array.from(event.dataTransfer.files ?? []);
                  if (files.length > 0) void processGoogleFiles(files);
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
                  accept=".json,application/json"
                  multiple
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                />
                <div className="import-source-heading">
                  <span className="import-source-icon"><Map size={21} aria-hidden="true" /></span>
                  <span className="import-source-tag">Timeline export</span>
                </div>
                <h3>Google Timeline</h3>
                <p>Upload the current device Timeline JSON. Extracted legacy Records.json is supported too.</p>
                <span className="import-source-upload"><UploadCloud size={15} aria-hidden="true" /> Choose JSON file(s)</span>
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
                  const files = Array.from(event.dataTransfer.files ?? []);
                  if (files.length > 0) void processInstagramFiles(files);
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
                  multiple
                  ref={instagramFileInputRef}
                  onChange={handleInstagramFileUpload}
                />
                <div className="import-source-heading">
                  <span className="import-source-icon"><Camera size={21} aria-hidden="true" /></span>
                  <span className="import-source-tag">Posts export</span>
                </div>
                <h3>Instagram geotags</h3>
                <p>Extract the Meta ZIP, then upload posts or reels JSON. We map items only when coordinates and dates exist.</p>
                <span className="import-source-upload"><UploadCloud size={15} aria-hidden="true" /> Choose JSON file(s)</span>
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
                <span className="import-source-roadmap">ZIP import + missing-location review planned next</span>
              </div>
            </div>
            <div className="import-export-help" aria-label="Official export instructions">
              <details>
                <summary>How to export Google Timeline</summary>
                <div>
                  <p><strong>Android:</strong> Settings → Location → Location services → Timeline → Export Timeline data.</p>
                  <p><strong>iPhone/iPad:</strong> Google Maps → profile → Settings → Location &amp; Privacy → Export Timeline data → Save to Files.</p>
                  <a href="https://support.google.com/maps/answer/6258979" target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}>
                    Official Google guide <ExternalLink size={12} aria-hidden="true" />
                  </a>
                </div>
              </details>
              <details>
                <summary>How to export Instagram</summary>
                <div>
                  <p>Instagram Settings → Accounts Center → Your information and permissions → Export your information → Create export.</p>
                  <p>Choose the profile, Export to device, posts/reels, All time, and JSON. Download and extract the ZIP before choosing a JSON file here.</p>
                  <a href="https://www.facebook.com/help/instagram/181231772500920" target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}>
                    Official Meta guide <ExternalLink size={12} aria-hidden="true" />
                  </a>
                </div>
              </details>
            </div>
            </>
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
                {invalidCount > 0 && `${invalidCount} records without both a usable date and coordinates were skipped. `}
                {duplicateCount > 0 && `${duplicateCount} duplicate ${duplicateCount === 1 ? 'suggestion was' : 'suggestions were'} merged. `}
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
                    closeAndReset();
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
