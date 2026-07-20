import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  Compass,
  MapPin,
  Route,
  Sparkles,
  Telescope,
  Users,
  X,
} from 'lucide-react';
import type { JournalEntry } from '../types';

interface InspirationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  entries: JournalEntry[];
  onOpenMemory: (entry: JournalEntry) => void;
}

type Mood = 'all' | 'nature' | 'food' | 'city' | 'slow';
type DiscoveryTab = 'inspiration' | 'expeditions';

interface MoodOption {
  id: Mood;
  label: string;
}

interface AtlasMatch {
  label: string;
  explanation: string;
}

const MOOD_OPTIONS: MoodOption[] = [
  { id: 'all', label: 'All' },
  { id: 'nature', label: 'Nature' },
  { id: 'food', label: 'Food' },
  { id: 'city', label: 'City' },
  { id: 'slow', label: 'Slow travel' },
];

const DISCOVERY_TABS: { id: DiscoveryTab; label: string }[] = [
  { id: 'inspiration', label: 'Inspiration' },
  { id: 'expeditions', label: 'Expeditions' },
];

const entryText = (entry: JournalEntry) =>
  `${entry.category ?? ''} ${entry.title} ${entry.locationName} ${entry.body}`.toLowerCase();

const matchesMood = (entry: JournalEntry, mood: Mood) => {
  if (mood === 'all') return true;

  const text = entryText(entry);
  if (mood === 'nature') {
    return ['nature', 'trek', 'beach'].includes(entry.category ?? '') ||
      /trail|mountain|forest|coast|ocean|garden|lake|river|wildlife|sunrise|sunset/.test(text);
  }
  if (mood === 'food') {
    return entry.category === 'food' ||
      /food|cafe|café|coffee|market|restaurant|bakery|dinner|lunch|breakfast|taste/.test(text);
  }
  if (mood === 'city') {
    return ['city', 'culture'].includes(entry.category ?? '') ||
      /city|street|architecture|museum|gallery|neighbou?rhood|skyline|historic/.test(text);
  }

  return /slow|quiet|unhurried|wander|stroll|local|hidden|morning|lane|village|cafe|café|market/.test(text);
};

const deriveAtlasMatch = (entry: JournalEntry): AtlasMatch => {
  const text = entryText(entry);

  if (/quiet|slow|unhurried|wander|stroll|lane|village/.test(text)) {
    return {
      label: 'An unhurried travel signal',
      explanation: 'The journal lingers on pace, atmosphere, and small details instead of a checklist of attractions.',
    };
  }
  if (entry.category === 'food' || /cafe|café|coffee|market|restaurant|bakery|taste/.test(text)) {
    return {
      label: 'A place remembered through taste',
      explanation: 'The memory uses food and local gathering places as its way into the destination.',
    };
  }
  if (['nature', 'trek', 'beach'].includes(entry.category ?? '') ||
      /trail|mountain|forest|coast|ocean|lake|river/.test(text)) {
    return {
      label: 'A restorative landscape signal',
      explanation: 'The strongest details are tied to movement, open space, and the feeling of being outdoors.',
    };
  }
  if (['city', 'culture'].includes(entry.category ?? '') ||
      /street|architecture|museum|gallery|skyline|historic/.test(text)) {
    return {
      label: 'A culture-through-place signal',
      explanation: 'The memory notices how streets, buildings, and local history shape the character of a city.',
    };
  }

  return {
    label: 'A detail-rich memory signal',
    explanation: 'The journal captures a specific feeling and place, making it useful inspiration for your own Atlas.',
  };
};

const formatDate = (timestamp: number) =>
  new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

export const InspirationPanel: React.FC<InspirationPanelProps> = ({
  isOpen,
  onClose,
  entries,
  onOpenMemory,
}) => {
  const [activeTab, setActiveTab] = useState<DiscoveryTab>('inspiration');
  const [activeMood, setActiveMood] = useState<Mood>('all');

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const publicEntries = useMemo(
    () => entries.filter((entry) => entry.visibility === 'public' || entry.visibility === undefined),
    [entries],
  );

  const filteredEntries = useMemo(
    () => publicEntries.filter((entry) => matchesMood(entry, activeMood)),
    [activeMood, publicEntries],
  );

  if (!isOpen) return null;

  const featuredEntry = filteredEntries[0] ?? null;
  const atlasMatch = featuredEntry ? deriveAtlasMatch(featuredEntry) : null;

  const openMemory = (entry: JournalEntry) => {
    onOpenMemory(entry);
    onClose();
  };

  const selectTab = (tab: DiscoveryTab) => {
    setActiveTab(tab);
  };

  return (
    <div className="inspiration-overlay" onMouseDown={onClose}>
      <section
        className="inspiration-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="inspiration-discovery-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="inspiration-header">
          <div className="inspiration-brand">
            <Compass size={18} aria-hidden="true" />
            <span>GeoJournal Discovery</span>
          </div>
          <button className="inspiration-close" type="button" onClick={onClose} aria-label="Close Discovery">
            <X size={19} aria-hidden="true" />
          </button>
        </header>

        <div className="inspiration-scroll">
          <nav className="inspiration-tabs" aria-label="Discovery sections">
            {DISCOVERY_TABS.map((tab) => {
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  className={`inspiration-tab ${isSelected ? 'inspiration-tab-selected' : ''}`}
                  type="button"
                  onClick={() => selectTab(tab.id)}
                  aria-pressed={isSelected}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {activeTab === 'inspiration' && (
            <>
          <section className="inspiration-hero">
            <div className="inspiration-hero-copy">
              <span className="inspiration-eyebrow">
                <Sparkles size={14} aria-hidden="true" />
                Stories worth following
              </span>
              <h1 id="inspiration-discovery-title">Borrow a feeling, not an itinerary.</h1>
              <p>
                Explore places through moments other travelers chose to remember—then open the ones
                that feel at home in your own Atlas.
              </p>
            </div>

            <div className="inspiration-hero-visual" aria-hidden="true">
              <div className="inspiration-hero-orbit inspiration-hero-orbit-outer" />
              <div className="inspiration-hero-orbit inspiration-hero-orbit-inner" />
              <div className="inspiration-hero-globe">
                <span className="inspiration-hero-route" />
                <span className="inspiration-hero-pin inspiration-hero-pin-one" />
                <span className="inspiration-hero-pin inspiration-hero-pin-two" />
              </div>
              <span className="inspiration-hero-label">Shared memories · human stories</span>
            </div>
          </section>

          <nav className="inspiration-filters" aria-label="Filter inspiration by mood">
            {MOOD_OPTIONS.map((mood) => {
              const isSelected = activeMood === mood.id;
              return (
                <button
                  key={mood.id}
                  className={`inspiration-filter ${isSelected ? 'inspiration-filter-selected' : ''}`}
                  type="button"
                  onClick={() => setActiveMood(mood.id)}
                  aria-pressed={isSelected}
                >
                  {mood.label}
                </button>
              );
            })}
          </nav>

          {featuredEntry && atlasMatch ? (
            <>
              <aside className="inspiration-atlas-fit" aria-labelledby="inspiration-atlas-fit-title">
                <div className="inspiration-atlas-fit-icon">
                  <Sparkles size={18} aria-hidden="true" />
                </div>
                <div className="inspiration-atlas-fit-copy">
                  <span className="inspiration-atlas-fit-kicker">Why it may fit your Atlas</span>
                  <h2 id="inspiration-atlas-fit-title">{atlasMatch.label}</h2>
                  <p>
                    <strong>{featuredEntry.title}</strong> stands out because {atlasMatch.explanation.toLowerCase()}
                    {' '}If that is a feeling you save, this shared memory is worth opening.
                  </p>
                </div>
                <button
                  className="inspiration-atlas-fit-action"
                  type="button"
                  onClick={() => openMemory(featuredEntry)}
                >
                  Open memory <ArrowUpRight size={16} aria-hidden="true" />
                </button>
              </aside>

              <div className="inspiration-section-heading">
                <div>
                  <span className="inspiration-section-kicker">Community Atlas</span>
                  <h2>{activeMood === 'all' ? 'Memories with a point of view' : `${MOOD_OPTIONS.find((mood) => mood.id === activeMood)?.label} memories`}</h2>
                </div>
                <span className="inspiration-result-count">
                  {filteredEntries.length} {filteredEntries.length === 1 ? 'story' : 'stories'}
                </span>
              </div>

              <div className="inspiration-grid">
                {filteredEntries.map((entry) => {
                  const photo = entry.photos?.[0];
                  return (
                    <article className="inspiration-card" key={entry.id}>
                      <button
                        className="inspiration-card-open"
                        type="button"
                        onClick={() => openMemory(entry)}
                        aria-label={`Open ${entry.title}`}
                      >
                        <div className={`inspiration-card-media ${photo ? 'inspiration-card-has-photo' : 'inspiration-card-no-photo'}`}>
                          {photo ? (
                            <img src={photo} alt="" />
                          ) : (
                            <span className="inspiration-card-placeholder" aria-hidden="true">
                              <Compass size={28} />
                            </span>
                          )}
                          <span className="inspiration-card-date">{formatDate(entry.date)}</span>
                        </div>

                        <div className="inspiration-card-body">
                          <div className="inspiration-card-location">
                            <MapPin size={13} aria-hidden="true" />
                            <span>{entry.locationName}</span>
                          </div>
                          <h3>{entry.title}</h3>
                          <p>{entry.body}</p>
                          <div className="inspiration-card-footer">
                            <span className="inspiration-card-category">{entry.category ?? 'memory'}</span>
                            <span className="inspiration-card-cta">
                              Read memory <ArrowUpRight size={14} aria-hidden="true" />
                            </span>
                          </div>
                        </div>
                      </button>
                    </article>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="inspiration-empty" role="status">
              <div className="inspiration-empty-icon">
                <Telescope size={27} aria-hidden="true" />
              </div>
              <span className="inspiration-empty-kicker">A quiet corner of the map</span>
              <h2>No shared {activeMood === 'all' ? '' : `${MOOD_OPTIONS.find((mood) => mood.id === activeMood)?.label.toLowerCase()} `}memories yet.</h2>
              <p>
                Try another mood, or return when explorers have published more stories to the Community Atlas.
              </p>
              {activeMood !== 'all' ? (
                <button className="inspiration-empty-action" type="button" onClick={() => setActiveMood('all')}>
                  Show all memories
                </button>
              ) : (
                <button className="inspiration-empty-action" type="button" onClick={onClose}>
                  Return to your Atlas
                </button>
              )}
            </div>
          )}
            </>
          )}

          {activeTab === 'expeditions' && (
            <section className="inspiration-discovery-view">
              <div className="inspiration-discovery-intro">
                <div className="inspiration-discovery-copy">
                  <span className="inspiration-eyebrow">
                    <Route size={14} aria-hidden="true" />
                    Expeditions · coming soon
                  </span>
                  <h1 id="inspiration-discovery-title">Shared journeys deserve a thoughtful launch.</h1>
                  <p>
                    GeoJournal is preparing a trusted way to discover and join small-group journeys.
                    There are no expedition listings, reservations, or payments in this version.
                  </p>
                </div>
              </div>

              <aside className="inspiration-promotion-note">
                <Compass size={18} aria-hidden="true" />
                <p>
                  <strong>For now, Discovery stays focused on real public memories.</strong> Expeditions
                  will open only after host verification, safety expectations, transparent itineraries,
                  and reliable booking support are ready.
                </p>
              </aside>

              <div className="inspiration-empty" role="status">
                <div className="inspiration-empty-icon">
                  <Users size={27} aria-hidden="true" />
                </div>
                <span className="inspiration-empty-kicker">On the roadmap</span>
                <h2>Expeditions are not open yet.</h2>
                <p>
                  We are designing verified hosts, clear group sizes, complete route details, and
                  traveler protections before anyone can list or book a journey.
                </p>
                <button
                  className="inspiration-empty-action"
                  type="button"
                  onClick={() => selectTab('inspiration')}
                >
                  Explore community stories
                </button>
              </div>
            </section>
          )}

        </div>
      </section>
    </div>
  );
};
