import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  CalendarDays,
  CircleDollarSign,
  Compass,
  MapPin,
  Megaphone,
  Route,
  ShieldCheck,
  ShoppingBag,
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
type DiscoveryTab = 'inspiration' | 'expeditions' | 'market';

interface MoodOption {
  id: Mood;
  label: string;
}

interface NexusSignal {
  label: string;
  explanation: string;
}

interface ExpeditionPreview {
  id: string;
  title: string;
  summary: string;
  host: string;
  route: string;
  dates: string;
  seats: string;
  budget: string;
  trustMarkers: string[];
  promoted?: boolean;
}

interface MarketPreview {
  id: string;
  title: string;
  description: string;
  creator: string;
  type: string;
  price: string;
  status: 'Dodo Test Mode' | 'Dodo checkout planned' | 'Preview';
  checkoutUrl?: string;
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
  { id: 'market', label: 'Atlas Market' },
];

const EXPEDITION_PREVIEWS: ExpeditionPreview[] = [
  {
    id: 'western-ghats-preview',
    title: 'Monsoon Trails of the Western Ghats',
    summary: 'A small-group trekking concept shaped around misty ridgelines, homestays, and a deliberately gentle pace.',
    host: 'Aarav M. · preview host',
    route: 'Bengaluru → Chikmagalur → Kudremukh',
    dates: 'Aug 22–25, 2026 · preview dates',
    seats: '6 planned seats',
    budget: '₹18k–₹24k estimated',
    trustMarkers: ['Host identity check planned', 'Route safety review planned'],
    promoted: true,
  },
  {
    id: 'kerala-food-preview',
    title: 'Coastal Food Stories: Kochi to Alleppey',
    summary: 'A creator-led route concept connecting markets, family kitchens, ferry rides, and one slow night on the backwaters.',
    host: 'Maya J. · preview host',
    route: 'Fort Kochi → Kumbalangi → Alleppey',
    dates: 'Nov 7–10, 2026 · preview dates',
    seats: '8 planned seats',
    budget: '₹14k–₹20k estimated',
    trustMarkers: ['Local-host review planned', 'Clear cancellation terms planned'],
  },
];

const MARKET_PREVIEWS: MarketPreview[] = [
  {
    id: 'quiet-kyoto-itinerary',
    title: '48 Hours in Kyoto’s Quiet Lanes',
    description: 'A downloadable, unhurried itinerary focused on neighborhood walks, early temples, and independent cafés.',
    creator: 'Mika T. · preview creator',
    type: 'Digital itinerary',
    price: '$12 preview price',
    status: 'Dodo Test Mode',
    checkoutUrl: 'https://test.checkout.dodopayments.com/buy/pdt_0NjRHDYgh1JvodFVdL2u5?quantity=1',
  },
  {
    id: 'bangalore-trek-pack',
    title: 'Bangalore Weekend Trek Route Pack',
    description: 'A creator-curated set of route notes, packing prompts, and map references for three nearby day treks.',
    creator: 'Trail Notes · preview creator',
    type: 'Route pack',
    price: '₹499 preview price',
    status: 'Preview',
  },
  {
    id: 'old-kochi-food-walk',
    title: 'Old Kochi Food Walk with a Local',
    description: 'A proposed locally hosted experience built around spice stories, small eateries, and market conversations.',
    creator: 'Maya J. · preview creator',
    type: 'Locally hosted package',
    price: '₹2,800/person preview price',
    status: 'Dodo checkout planned',
  },
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

const deriveNexusSignal = (entry: JournalEntry): NexusSignal => {
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
  const [previewNotice, setPreviewNotice] = useState('');

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
  const nexusSignal = featuredEntry ? deriveNexusSignal(featuredEntry) : null;

  const openMemory = (entry: JournalEntry) => {
    onOpenMemory(entry);
    onClose();
  };

  const selectTab = (tab: DiscoveryTab) => {
    setActiveTab(tab);
    setPreviewNotice('');
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

          {featuredEntry && nexusSignal ? (
            <>
              <aside className="inspiration-nexus" aria-labelledby="inspiration-nexus-title">
                <div className="inspiration-nexus-icon">
                  <Sparkles size={18} aria-hidden="true" />
                </div>
                <div className="inspiration-nexus-copy">
                  <span className="inspiration-nexus-kicker">Nexus · Why it fits your Atlas</span>
                  <h2 id="inspiration-nexus-title">{nexusSignal.label}</h2>
                  <p>
                    <strong>{featuredEntry.title}</strong> stands out because {nexusSignal.explanation.toLowerCase()}
                    {' '}If that is a feeling you save, this shared memory is worth opening.
                  </p>
                </div>
                <button
                  className="inspiration-nexus-action"
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
                    <Users size={14} aria-hidden="true" />
                    Creator expeditions · presentation preview
                  </span>
                  <h1 id="inspiration-discovery-title">Go farther with someone who knows the story.</h1>
                  <p>
                    Expeditions are a proposed small-group format where trusted creators can turn
                    their routes and local knowledge into hosted journeys. Dates, seats, and budgets
                    below are illustrative—not live inventory.
                  </p>
                </div>
                <button
                  className="inspiration-listing-action"
                  type="button"
                  onClick={() => setPreviewNotice('Creator expedition listings are a presentation preview. No trip was submitted or published.')}
                >
                  List an expedition <span className="inspiration-preview-badge">Preview</span>
                </button>
              </div>

              <aside className="inspiration-promotion-note">
                <Megaphone size={18} aria-hidden="true" />
                <p>
                  <strong>Native, clearly labeled promotion.</strong> Sponsored creator routes or
                  pins may appear inside Discovery and the Atlas, always marked <em>Promoted</em> so
                  travelers can distinguish paid placement from organic memories.
                </p>
              </aside>

              {previewNotice && (
                <div className="inspiration-preview-notice" role="status">
                  <Sparkles size={15} aria-hidden="true" /> {previewNotice}
                </div>
              )}

              <div className="inspiration-section-heading">
                <div>
                  <span className="inspiration-section-kicker">Expedition concepts</span>
                  <h2>Small groups, specific points of view</h2>
                </div>
                <span className="inspiration-result-count">2 previews</span>
              </div>

              <div className="inspiration-expedition-grid">
                {EXPEDITION_PREVIEWS.map((expedition) => (
                  <article
                    className={`inspiration-expedition-card ${
                      expedition.promoted ? 'inspiration-expedition-promoted' : ''
                    }`}
                    key={expedition.id}
                  >
                    <header className="inspiration-expedition-header">
                      <span className="inspiration-expedition-type">
                        <Route size={14} aria-hidden="true" /> Group-trip preview
                      </span>
                      {expedition.promoted && (
                        <span className="inspiration-promoted-badge">
                          <Megaphone size={12} aria-hidden="true" /> Promoted
                        </span>
                      )}
                    </header>

                    <div className="inspiration-expedition-copy">
                      <h2>{expedition.title}</h2>
                      <p>{expedition.summary}</p>
                    </div>

                    <div className="inspiration-expedition-host">
                      <Users size={16} aria-hidden="true" />
                      <span>Hosted by {expedition.host}</span>
                    </div>

                    <dl className="inspiration-expedition-details">
                      <div className="inspiration-expedition-detail">
                        <dt><MapPin size={14} aria-hidden="true" /> Route</dt>
                        <dd>{expedition.route}</dd>
                      </div>
                      <div className="inspiration-expedition-detail">
                        <dt><CalendarDays size={14} aria-hidden="true" /> Dates</dt>
                        <dd>{expedition.dates}</dd>
                      </div>
                      <div className="inspiration-expedition-detail">
                        <dt><Users size={14} aria-hidden="true" /> Group</dt>
                        <dd>{expedition.seats}</dd>
                      </div>
                      <div className="inspiration-expedition-detail">
                        <dt><CircleDollarSign size={14} aria-hidden="true" /> Budget band</dt>
                        <dd>{expedition.budget}</dd>
                      </div>
                    </dl>

                    <ul className="inspiration-trust-list" aria-label="Planned trust features">
                      {expedition.trustMarkers.map((marker) => (
                        <li key={marker}>
                          <ShieldCheck size={14} aria-hidden="true" /> {marker}
                        </li>
                      ))}
                    </ul>

                    <footer className="inspiration-expedition-footer">
                      <span>Concept only · no reservation created</span>
                      <button
                        type="button"
                        onClick={() => setPreviewNotice(`${expedition.title} is a presentation concept. Dates, seats, and pricing are not bookable.`)}
                      >
                        View preview <ArrowUpRight size={14} aria-hidden="true" />
                      </button>
                    </footer>
                  </article>
                ))}
              </div>
            </section>
          )}

          {activeTab === 'market' && (
            <section className="inspiration-discovery-view">
              <div className="inspiration-discovery-intro">
                <div className="inspiration-discovery-copy">
                  <span className="inspiration-eyebrow">
                    <ShoppingBag size={14} aria-hidden="true" />
                    Creator marketplace · presentation preview
                  </span>
                  <h1 id="inspiration-discovery-title">Take a creator’s Atlas with you.</h1>
                  <p>
                    Atlas Market is a proposed storefront for digital guides, route packs, and
                    locally hosted experiences. The Kyoto guide below opens a Dodo-hosted Test Mode
                    checkout; every other listing, fulfilment flow, and creator payout remains a preview.
                  </p>
                </div>
                <button
                  className="inspiration-listing-action"
                  type="button"
                  onClick={() => setPreviewNotice('Creator storefront tools are a presentation preview. No product was listed or charged.')}
                >
                  Sell with Atlas <span className="inspiration-preview-badge">Preview</span>
                </button>
              </div>

              <aside className="inspiration-promotion-note">
                <Megaphone size={18} aria-hidden="true" />
                <p>
                  <strong>Promotions stay native and transparent.</strong> A sponsored product may
                  extend into a related route or Atlas pin, but every paid placement is visibly
                  labeled <em>Promoted</em> rather than presented as an organic recommendation.
                </p>
              </aside>

              {previewNotice && (
                <div className="inspiration-preview-notice" role="status">
                  <Sparkles size={15} aria-hidden="true" /> {previewNotice}
                </div>
              )}

              <div className="inspiration-section-heading">
                <div>
                  <span className="inspiration-section-kicker">Atlas Market concepts</span>
                  <h2>Useful travel knowledge, packaged with care</h2>
                </div>
                <span className="inspiration-result-count">3 previews</span>
              </div>

              <div className="inspiration-market-grid">
                {MARKET_PREVIEWS.map((product) => (
                  <article className="inspiration-market-card" key={product.id}>
                    <div className="inspiration-market-art" aria-hidden="true">
                      <ShoppingBag size={25} />
                      <span>{product.type}</span>
                    </div>
                    <div className="inspiration-market-body">
                      <span className="inspiration-market-type">{product.type}</span>
                      <h2>{product.title}</h2>
                      <p>{product.description}</p>
                      <div className="inspiration-market-creator">
                        <ShoppingBag size={14} aria-hidden="true" /> {product.creator}
                      </div>
                      <div className="inspiration-market-price-row">
                        <strong>{product.price}</strong>
                        <span className="inspiration-market-status">{product.status}</span>
                      </div>
                    </div>
                    <footer className="inspiration-market-footer">
                      <button
                        type="button"
                        onClick={() => {
                          if (product.checkoutUrl) {
                            window.open(product.checkoutUrl, '_blank', 'noopener,noreferrer');
                            setPreviewNotice(`${product.title} opened in Dodo Test Mode. No real charge is possible, and fulfilment is not yet connected.`);
                            return;
                          }
                          setPreviewNotice(`${product.title} is a marketplace preview. No payment was initiated or collected.`);
                        }}
                      >
                        {product.checkoutUrl ? 'Try test checkout' : 'Preview product'} <ArrowUpRight size={14} aria-hidden="true" />
                      </button>
                    </footer>
                  </article>
                ))}
              </div>

              <div className="inspiration-checkout-note">
                <CircleDollarSign size={17} aria-hidden="true" />
                <span>Kyoto uses a Dodo-hosted Test Mode checkout—no real charge. Entitlements and creator payouts are not yet connected.</span>
              </div>
            </section>
          )}
        </div>
      </section>
    </div>
  );
};
