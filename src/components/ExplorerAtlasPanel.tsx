import { useEffect, useState } from 'react';
import { AlertCircle, ArrowLeft, Globe2, Loader2, LockKeyhole, MapPin } from 'lucide-react';
import type { JournalEntry, UserProfile } from '../types';
import { fetchExplorerPins } from '../utils/firestore';
import { EntryCard } from './EntryCard';
import { GlobeView } from './GlobeView';

interface ExplorerAtlasPanelProps {
  explorer: UserProfile | null;
  onClose: () => void;
  previewEntries?: JournalEntry[];
}

export function ExplorerAtlasPanel({ explorer, onClose, previewEntries }: ExplorerAtlasPanelProps) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const explorerUid = explorer?.uid;

  useEffect(() => {
    if (!explorerUid) {
      setEntries([]);
      setSelectedEntry(null);
      setError('');
      setIsLoading(false);
      return;
    }

    if (previewEntries) {
      setEntries(
        previewEntries.filter((entry) => (
          entry.visibility === 'public'
          && (entry.authorId === explorerUid || entry.acceptedCollaboratorIds?.includes(explorerUid))
        )),
      );
      setSelectedEntry(null);
      setError('');
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setEntries([]);
    setSelectedEntry(null);
    setError('');
    setIsLoading(true);

    const loadExplorerPins = async () => {
      try {
        const publicPins = await fetchExplorerPins(explorerUid);
        if (!cancelled) setEntries(publicPins);
      } catch (caught) {
        console.error('Failed to load explorer Atlas:', caught);
        if (!cancelled) {
          setError('We could not load this explorer’s public memories right now.');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void loadExplorerPins();

    return () => {
      cancelled = true;
    };
  }, [explorerUid, reloadKey, previewEntries]);

  useEffect(() => {
    if (!explorer) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [explorer, onClose]);

  if (!explorer) return null;

  const displayName = explorer.displayName || explorer.username || 'Explorer';
  const initial = displayName.charAt(0).toUpperCase();
  const memoryLabel = `${entries.length} public ${entries.length === 1 ? 'memory' : 'memories'}`;

  return (
    <section
      className="explorer-atlas-dialog fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="explorer-atlas-title"
    >
      <div className="explorer-atlas-stage">
        {!isLoading && !error && entries.length > 0 && (
          <GlobeView
            entries={entries}
            selectedEntry={selectedEntry}
            onSelectEntry={setSelectedEntry}
            initialFocusEntry={entries[0]}
          />
        )}

        {isLoading && (
          <div className="explorer-atlas-state is-loading" role="status" aria-live="polite">
            <Loader2 size={28} className="animate-spin" aria-hidden="true" />
            <strong>Opening {displayName}’s Atlas</strong>
            <span>Loading memories they have chosen to share publicly.</span>
          </div>
        )}

        {!isLoading && error && (
          <div className="explorer-atlas-state is-error" role="alert">
            <AlertCircle size={28} aria-hidden="true" />
            <strong>Atlas unavailable</strong>
            <span>{error}</span>
            <button type="button" className="glass-btn" onClick={() => setReloadKey((key) => key + 1)}>
              Try again
            </button>
          </div>
        )}

        {!isLoading && !error && entries.length === 0 && (
          <div className="explorer-atlas-state is-empty" role="status">
            <MapPin size={28} aria-hidden="true" />
            <strong>No public memories yet</strong>
            <span>
              {explorer.isPrivate
                ? `${displayName} keeps a private profile and has not shared any Atlas pins publicly.`
                : `${displayName} has not shared any Atlas pins publicly yet.`}
            </span>
          </div>
        )}
      </div>

      <header className="glass-panel explorer-atlas-toolbar">
        <button
          type="button"
          className="glass-btn explorer-atlas-back"
          onClick={onClose}
          aria-label="Return to your Atlas"
        >
          <ArrowLeft size={18} aria-hidden="true" />
          Back
        </button>

        <div className="explorer-atlas-identity">
          {explorer.photoURL ? (
            <img
              className="explorer-atlas-avatar"
              src={explorer.photoURL}
              alt={`${displayName} profile`}
            />
          ) : (
            <div className="explorer-atlas-avatar is-placeholder" aria-hidden="true">
              {initial}
            </div>
          )}
          <div>
          <span className="explorer-atlas-kicker">Explorer Atlas</span>
          <h2 id="explorer-atlas-title">{displayName}’s public world</h2>
            <span>@{explorer.username}{previewEntries ? ' · presentation sample' : ''}</span>
          </div>
        </div>

        <div className="explorer-atlas-summary" aria-label="Explorer Atlas summary">
          <span className="explorer-atlas-stat">
            <Globe2 size={14} aria-hidden="true" />
            {isLoading ? 'Loading public memories' : memoryLabel}
          </span>
          <span className={`explorer-atlas-privacy ${explorer.isPrivate ? 'is-private' : 'is-public'}`}>
            {explorer.isPrivate ? (
              <LockKeyhole size={14} aria-hidden="true" />
            ) : (
              <Globe2 size={14} aria-hidden="true" />
            )}
            {explorer.isPrivate ? 'Private profile' : 'Public profile'}
          </span>
        </div>
      </header>

      {selectedEntry && (
        <div className="explorer-atlas-detail">
          <EntryCard
            entry={selectedEntry}
            onClose={() => setSelectedEntry(null)}
            onDelete={() => undefined}
            onEdit={() => undefined}
            canManage={false}
          />
        </div>
      )}
    </section>
  );
}
