import React from 'react';
import { ArrowRight, Cloud, Compass, MapPin, Play, Sparkles, Users } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onPreviewDemo: () => void;
}

const KYOTO_MEMORY_IMAGE =
  'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=900&auto=format&fit=crop';

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onPreviewDemo }) => {
  return (
    <div className="landing-shell">
      <div className="landing-sign-in">
        <button
          type="button"
          onClick={onGetStarted}
          className="glass-btn landing-sign-in-button"
        >
          Sign in
        </button>
      </div>

      <main className="landing-stage">
        <section className="landing-hero" aria-labelledby="landing-title">
          <div className="landing-hero-copy fade-in">
            <div className="landing-brand" aria-label="GeoJournal">
              <Compass size={19} aria-hidden="true" />
              <span>GeoJournal</span>
            </div>

            <p className="landing-eyebrow">
              <span className="landing-eyebrow-mark" aria-hidden="true" />
              Your living 3D memory atlas
            </p>

            <h1 id="landing-title" className="landing-title">
              The world you travelled.
              <span className="landing-title-accent"> The story only you can tell.</span>
            </h1>

            <p className="landing-copy">
              Turn meaningful places, photographs, and journal notes into a personal globe you can
              revisit for years—and let Nexus connect the memories behind every journey.
            </p>

            <div className="landing-hero-actions">
              <button
                type="button"
                onClick={onGetStarted}
                className="glass-btn landing-primary-action"
              >
                Open your Atlas <ArrowRight size={18} aria-hidden="true" />
              </button>
              <button type="button" onClick={onPreviewDemo} className="glass-btn landing-demo-action">
                <Play size={16} aria-hidden="true" /> Preview demo
              </button>
              <span className="landing-privacy-note">Private by default · Yours to share</span>
            </div>

            <div className="landing-capabilities" aria-label="GeoJournal highlights">
              {['Memory pins', 'Semantic search', 'Nexus AI', 'Travel heatmaps'].map((capability) => (
                <span key={capability}>
                  <i aria-hidden="true" /> {capability}
                </span>
              ))}
            </div>
          </div>

          <div
            className="landing-atlas-preview fade-in"
            aria-label="Preview of a memory pinned to the GeoJournal globe"
          >
            <div className="landing-atlas-ambient" aria-hidden="true" />
            <div className="landing-atlas-orbit landing-atlas-orbit-outer" aria-hidden="true" />
            <div className="landing-atlas-orbit landing-atlas-orbit-inner" aria-hidden="true" />

            <div className="landing-atlas-globe" aria-hidden="true">
              <div className="landing-atlas-grid" />
              <div className="landing-atlas-land landing-atlas-land-one" />
              <div className="landing-atlas-land landing-atlas-land-two" />
              <div className="landing-atlas-route" />
              <div className="landing-atlas-pin">
                <span className="landing-atlas-pin-ring" />
                <span className="landing-atlas-pin-core" />
              </div>
            </div>

            <div className="landing-atlas-caption">
              <Sparkles size={14} aria-hidden="true" />
              <span>24 memories connected across 8 countries</span>
            </div>

            <article className="landing-memory-card">
              <div className="landing-memory-image-wrap">
                <img
                  className="landing-memory-image"
                  src={KYOTO_MEMORY_IMAGE}
                  alt="Autumn leaves surrounding a traditional street in Kyoto"
                />
                <span className="landing-memory-date">Oct 18, 2025</span>
              </div>
              <div className="landing-memory-content">
                <div className="landing-memory-location">
                  <MapPin size={13} aria-hidden="true" />
                  Kyoto, Japan
                </div>
                <h2>Autumn in Kyoto</h2>
                <p>Crimson maples, quiet lanes, and a morning I still think about.</p>
                <div className="landing-memory-signal">
                  <Sparkles size={13} aria-hidden="true" />
                  Nexus remembers why this place mattered
                </div>
              </div>
            </article>
          </div>
        </section>

        <section className="landing-features" aria-label="GeoJournal capabilities">
          <FeatureCard
            modifier="atlas"
            icon={<Compass size={23} aria-hidden="true" />}
            title="A globe made of moments"
            description="Pin photographs and stories to the exact places that shaped your journey."
          />
          <FeatureCard
            modifier="community"
            icon={<Users size={23} aria-hidden="true" />}
            title="Share with intention"
            description="Keep memories private, invite close friends, or publish selected discoveries."
          />
          <FeatureCard
            modifier="inbox"
            icon={<Cloud size={23} aria-hidden="true" />}
            title="Bring your history home"
            description="Review Timeline and Instagram suggestions before they enter your private Atlas."
          />
        </section>
      </main>
    </div>
  );
};

const FeatureCard = ({
  icon,
  title,
  description,
  modifier,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  modifier: 'atlas' | 'community' | 'inbox';
}) => (
  <article className={`glass-panel landing-feature-card landing-feature-card-${modifier}`}>
    <div className="landing-feature-icon">{icon}</div>
    <div className="landing-feature-copy">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  </article>
);
