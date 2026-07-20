import { useMemo, useState, type CSSProperties } from 'react';
import {
  Check,
  Clipboard,
  Compass,
  Image as ImageIcon,
  LockKeyhole,
  MapPin,
  Sparkles,
  X,
} from 'lucide-react';
import type { JournalEntry, UserProfile } from '../types';

interface AtlasPersonaModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  entries: JournalEntry[];
}

type PersonaStyle = {
  id: 'neon' | 'editorial' | 'dreamscape';
  name: string;
  eyebrow: string;
  description: string;
  palette: [string, string, string];
  direction: string;
};

const PERSONA_STYLES: PersonaStyle[] = [
  {
    id: 'neon',
    name: 'Neon cartography',
    eyebrow: 'Futuristic',
    description: 'Electric contour lines, night-sky depth and expedition glow.',
    palette: ['#73e6d2', '#7c6cff', '#ff9f70'],
    direction: 'cinematic neon cartography, luminous route lines, dimensional midnight atmosphere',
  },
  {
    id: 'editorial',
    name: 'Passport editorial',
    eyebrow: 'Tactile',
    description: 'Layered paper, arrival stamps and a polished travel-magazine feel.',
    palette: ['#f2c879', '#df7863', '#7bb6a9'],
    direction: 'premium travel editorial collage, tactile paper grain, subtle passport stamps, elegant warm light',
  },
  {
    id: 'dreamscape',
    name: 'Dreamscape atlas',
    eyebrow: 'Whimsical',
    description: 'Soft horizons, surreal landmarks and a memory-like sense of wonder.',
    palette: ['#8ed8ff', '#d5a7ff', '#ffb9d3'],
    direction: 'luminous dreamscape, floating geographic fragments, soft aurora haze, poetic memory-world atmosphere',
  },
];

const CATEGORY_PERSONAS: Record<string, { archetype: string; essence: string }> = {
  trek: { archetype: 'Trail Cartographer', essence: 'high paths and earned horizons' },
  nature: { archetype: 'Wild-World Listener', essence: 'quiet landscapes and living detail' },
  beach: { archetype: 'Tide Chaser', essence: 'open water and sunlit detours' },
  food: { archetype: 'Flavor Wayfinder', essence: 'local tables and sensory discoveries' },
  culture: { archetype: 'Story Collector', essence: 'heritage, craft and human connection' },
  city: { archetype: 'City-Light Navigator', essence: 'street rhythm and after-dark skylines' },
  general: { archetype: 'Atlas Storyteller', essence: 'places remembered through personal detail' },
};

const MOTIF_RULES = [
  { pattern: /hike|hiking|trek|trail|mountain|summit|rockies/i, label: 'highland trails' },
  { pattern: /coffee|cafe|latte|espresso/i, label: 'slow coffee stops' },
  { pattern: /temple|heritage|historic|museum|culture|traditional/i, label: 'living heritage' },
  { pattern: /beach|sea|ocean|island|coast|river/i, label: 'waterfront light' },
  { pattern: /sunset|evening|night|stars|skyline/i, label: 'golden-hour skies' },
  { pattern: /food|restaurant|market|dinner|lunch|breakfast/i, label: 'local flavors' },
  { pattern: /forest|garden|park|nature|leaves/i, label: 'botanical detail' },
];

const inferCountry = (entry: JournalEntry) => {
  if (entry.country?.trim()) return entry.country.trim();
  const locationParts = entry.locationName.split(',').map((part) => part.trim()).filter(Boolean);
  return locationParts.at(-1) || entry.locationName;
};

export const AtlasPersonaModal = ({
  isOpen,
  onClose,
  profile,
  entries,
}: AtlasPersonaModalProps) => {
  const [selectedStyleId, setSelectedStyleId] = useState<PersonaStyle['id']>('neon');
  const [copied, setCopied] = useState(false);

  const persona = useMemo(() => {
    const categoryCounts = entries.reduce<Record<string, number>>((counts, entry) => {
      const category = entry.category || 'general';
      counts[category] = (counts[category] || 0) + 1;
      return counts;
    }, {});
    const leadingCategory = Object.entries(categoryCounts)
      .sort(([, countA], [, countB]) => countB - countA)[0]?.[0] || 'general';
    const identity = CATEGORY_PERSONAS[leadingCategory] || CATEGORY_PERSONAS.general;
    const countries = [...new Set(entries.map(inferCountry).filter(Boolean))];
    const corpus = entries.map((entry) => `${entry.title} ${entry.body} ${entry.locationName}`).join(' ');
    const motifs = MOTIF_RULES.filter((rule) => rule.pattern.test(corpus)).map((rule) => rule.label).slice(0, 3);
    const photoCount = entries.reduce((total, entry) => total + (entry.photos?.length || 0) + (entry.googlePhotosUrl ? 1 : 0), 0);

    return {
      ...identity,
      countries,
      motifs: motifs.length ? motifs : ['unexpected detours', 'place-based stories'],
      photoCount,
    };
  }, [entries]);

  if (!isOpen) return null;

  const selectedStyle = PERSONA_STYLES.find((style) => style.id === selectedStyleId) || PERSONA_STYLES[0];
  const placeSummary = persona.countries.length
    ? persona.countries.slice(0, 4).join(', ')
    : 'the places still waiting to be pinned';
  const story = `${profile.displayName} is the ${persona.archetype} — drawn to ${persona.essence}. Their Atlas connects ${placeSummary} through ${persona.motifs.join(', ')}.`;
  const prompt = `Create a square travel-persona portrait for ${profile.displayName}, known as “The ${persona.archetype}.” Visual direction: ${selectedStyle.direction}. Build the world from this real travel history: ${placeSummary}. Recurring memory motifs: ${persona.motifs.join(', ')}. Express curiosity, warmth and motion; keep the composition sophisticated, joyful and highly legible at profile-picture size. No words, logos or watermarks.`;

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const previewStyle = {
    '--persona-primary': selectedStyle.palette[0],
    '--persona-secondary': selectedStyle.palette[1],
    '--persona-tertiary': selectedStyle.palette[2],
  } as CSSProperties;

  return (
    <div className="persona-modal-layer" role="presentation">
      <button type="button" className="persona-modal-backdrop" onClick={onClose} aria-label="Close Atlas Persona" />
      <section className="persona-modal" role="dialog" aria-modal="true" aria-labelledby="persona-modal-title">
        <header className="persona-modal-header">
          <div className="persona-modal-title-wrap">
            <span className="persona-title-icon"><Sparkles size={18} /></span>
            <div>
              <span className="persona-kicker">Travel-history identity</span>
              <h2 id="persona-modal-title">Atlas Persona</h2>
            </div>
          </div>
          <div className="persona-header-actions">
            <span className="persona-preview-badge">Local concept studio</span>
            <button type="button" className="persona-close" onClick={onClose} aria-label="Close Atlas Persona">
              <X size={18} />
            </button>
          </div>
        </header>

        <div className="persona-modal-body">
          <div className="persona-visual-column">
            <div className={`persona-portrait persona-portrait-${selectedStyle.id}`} style={previewStyle}>
              <span className="persona-orbit persona-orbit-one" aria-hidden="true" />
              <span className="persona-orbit persona-orbit-two" aria-hidden="true" />
              <span className="persona-map-dot persona-map-dot-one" aria-hidden="true" />
              <span className="persona-map-dot persona-map-dot-two" aria-hidden="true" />
              <span className="persona-map-dot persona-map-dot-three" aria-hidden="true" />
              <div className="persona-avatar-shell">
                {profile.photoURL ? (
                  <img src={profile.photoURL} alt={`${profile.displayName}'s current Atlas avatar`} />
                ) : (
                  <span>{profile.displayName.trim().charAt(0).toUpperCase() || <Compass size={38} />}</span>
                )}
              </div>
              <div className="persona-nameplate">
                <span>Your travel archetype</span>
                <strong>{persona.archetype}</strong>
              </div>
            </div>

            <div className="persona-signal-row" aria-label="Persona travel signals">
              <span><MapPin size={13} /> {persona.countries.length || 0} countries</span>
              <span><ImageIcon size={13} /> {persona.photoCount} photos</span>
              <span><Compass size={13} /> {entries.length} memories</span>
            </div>

            <div className="persona-story-card">
              <span className="persona-story-label">Your Atlas says</span>
              <p>{story}</p>
              <div className="persona-motif-list">
                {persona.motifs.map((motif) => <span key={motif}>{motif}</span>)}
              </div>
            </div>
          </div>

          <div className="persona-controls-column">
            <div className="persona-section-heading">
              <span>01</span>
              <div>
                <h3>Choose your visual world</h3>
                <p>The concept remixes instantly around the places and stories already in your Atlas.</p>
              </div>
            </div>

            <div className="persona-style-grid">
              {PERSONA_STYLES.map((style) => (
                <button
                  key={style.id}
                  type="button"
                  className={selectedStyle.id === style.id ? 'is-selected' : ''}
                  onClick={() => setSelectedStyleId(style.id)}
                  aria-pressed={selectedStyle.id === style.id}
                  style={{
                    '--style-a': style.palette[0],
                    '--style-b': style.palette[1],
                    '--style-c': style.palette[2],
                  } as CSSProperties}
                >
                  <span className="persona-style-swatch" aria-hidden="true">
                    <i /><i /><i />
                  </span>
                  <small>{style.eyebrow}</small>
                  <strong>{style.name}</strong>
                  <span>{style.description}</span>
                  {selectedStyle.id === style.id && <Check size={15} className="persona-style-check" />}
                </button>
              ))}
            </div>

            <div className="persona-section-heading persona-brief-heading">
              <span>02</span>
              <div>
                <h3>Your portable art brief</h3>
                <p>Built locally from your memories, ready to use with any creative tool you prefer.</p>
              </div>
            </div>

            <div className="persona-prompt-card">
              <p>{prompt}</p>
              <button type="button" onClick={() => void copyPrompt()} className={copied ? 'is-copied' : ''}>
                {copied ? <Check size={15} /> : <Clipboard size={15} />}
                {copied ? 'Brief copied' : 'Copy persona brief'}
              </button>
            </div>

            <div className="persona-honesty-note">
              <LockKeyhole size={15} />
              <p><strong>Private concept mode:</strong> the brief is created on this device. GeoJournal does not upload your memories or replace your photo.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
