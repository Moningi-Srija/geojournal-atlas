import React from 'react';
import { Compass, Users, Cloud, ArrowRight, Camera, Map, MapPin, Tent, Plane, Luggage, Navigation, Image } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      zIndex: 10,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at top right, rgba(139, 92, 246, 0.15) 0%, transparent 50%), radial-gradient(circle at bottom left, rgba(0, 240, 255, 0.15) 0%, transparent 50%), radial-gradient(circle at center, transparent 0%, rgba(5, 5, 12, 0.9) 100%)',
      backdropFilter: 'blur(3px)',
      padding: '24px',
      overflowY: 'auto'
    }}>
      
      <FloatingIcons />

      {/* Hero Content */}
      <div className="fade-in" style={{
        textAlign: 'center',
        maxWidth: '800px',
        marginBottom: '64px',
        marginTop: '64px'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 24px',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '50px',
          border: '1px solid rgba(255,255,255,0.1)',
          marginBottom: '32px'
        }}>
          <Compass size={24} color="#60a5fa" />
          <span style={{ fontSize: '1.25rem', fontWeight: 600, color: 'white', letterSpacing: '0.05em' }}>
            GeoJournal
          </span>
        </div>

        <h1 style={{
          fontSize: '4.5rem',
          fontWeight: 800,
          lineHeight: 1.1,
          color: 'white',
          marginBottom: '24px',
          textShadow: '0 0 40px rgba(96, 165, 250, 0.5)'
        }}>
          Map Your Life's <br />
          <span style={{ 
            background: 'linear-gradient(135deg, #60a5fa 0%, #a855f7 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            3D Journey
          </span>
        </h1>
        
        <p style={{
          fontSize: '1.25rem',
          color: 'rgba(255,255,255,0.6)',
          maxWidth: '600px',
          margin: '0 auto 48px auto',
          lineHeight: 1.6
        }}>
          Pin your favorite places, capture unforgettable memories, and share your adventures with a close-knit circle of friends on a stunning interactive 3D globe.
        </p>

        <button 
          onClick={onGetStarted}
          className="glass-btn"
          style={{
            background: 'linear-gradient(135deg, #00f0ff 0%, #0088ff 50%, #8b5cf6 100%)',
            color: 'white',
            border: 'none',
            fontSize: '1.125rem',
            padding: '16px 40px',
            borderRadius: '50px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: '0 10px 30px rgba(0, 136, 255, 0.4)',
            transition: 'all 0.3s ease',
            fontWeight: 600
          }}
        >
          Start Exploring <ArrowRight size={20} />
        </button>
      </div>

      {/* Features Grid */}
      <div className="fade-in" style={{
        display: 'flex',
        gap: '24px',
        maxWidth: '1200px',
        width: '100%',
        flexWrap: 'wrap',
        justifyContent: 'center',
        paddingBottom: '64px'
      }}>
        <FeatureCard 
          icon={<Compass size={32} color="#60a5fa" />}
          title="Interactive Atlas"
          description="Explore your world in 3D. Drop pins, write journal entries, and visualize your entire journey exactly where it happened."
        />
        <FeatureCard 
          icon={<Users size={32} color="#a855f7" />}
          title="Social Network"
          description="Connect with fellow explorers. Follow their journeys or share your private pins exclusively with your Close Friends list."
        />
        <FeatureCard 
          icon={<Cloud size={32} color="#34d399" />}
          title="Cloud Synced"
          description="Your memories are securely backed up in real-time. Access your GeoJournal instantly from any device, anywhere."
        />
      </div>
      
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <div className="glass-panel" style={{
    flex: '1 1 300px',
    maxWidth: '350px',
    padding: '32px',
    borderRadius: '24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '16px',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    cursor: 'default',
    backgroundColor: 'rgba(10, 15, 25, 0.85)'
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.transform = 'translateY(-5px)';
    e.currentTarget.style.boxShadow = '0 10px 40px rgba(0,0,0,0.5)';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.transform = 'translateY(0)';
    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)';
  }}
  >
    <div style={{
      width: '64px',
      height: '64px',
      borderRadius: '16px',
      background: 'rgba(255,255,255,0.05)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '1px solid rgba(255,255,255,0.1)'
    }}>
      {icon}
    </div>
    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'white', margin: 0 }}>{title}</h3>
    <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.6, fontSize: '0.9375rem' }}>{description}</p>
  </div>
);

const FloatingIcons = () => {
  const icons = [
    { Icon: Camera, size: 40, left: '10%', animationDuration: '15s', delay: '-5s', color: 'rgba(96, 165, 250, 0.3)' },
    { Icon: Map, size: 48, left: '25%', animationDuration: '22s', delay: '-12s', color: 'rgba(168, 85, 247, 0.3)' },
    { Icon: Tent, size: 56, left: '40%', animationDuration: '18s', delay: '-2s', color: 'rgba(52, 211, 153, 0.3)' },
    { Icon: Plane, size: 44, left: '55%', animationDuration: '20s', delay: '-18s', color: 'rgba(250, 204, 21, 0.3)' },
    { Icon: Luggage, size: 40, left: '70%', animationDuration: '25s', delay: '-8s', color: 'rgba(96, 165, 250, 0.3)' },
    { Icon: Navigation, size: 50, left: '85%', animationDuration: '19s', delay: '-15s', color: 'rgba(168, 85, 247, 0.3)' },
    { Icon: MapPin, size: 36, left: '15%', animationDuration: '24s', delay: '-20s', color: 'rgba(244, 63, 94, 0.3)' },
    { Icon: Compass, size: 42, left: '90%', animationDuration: '21s', delay: '-4s', color: 'rgba(52, 211, 153, 0.3)' },
    { Icon: Image, size: 40, left: '50%', animationDuration: '26s', delay: '-11s', color: 'rgba(250, 204, 21, 0.3)' },
  ];

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      overflow: 'hidden',
      pointerEvents: 'none',
      zIndex: -1
    }}>
      {icons.map((item, index) => {
        const { Icon } = item;
        return (
          <div key={index} style={{
            position: 'absolute',
            left: item.left,
            top: '-20%',
            opacity: 0,
            animation: `fallDown ${item.animationDuration} linear ${item.delay} infinite`,
            color: item.color
          }}>
            <Icon size={item.size} strokeWidth={1} />
          </div>
        );
      })}
    </div>
  );
};
