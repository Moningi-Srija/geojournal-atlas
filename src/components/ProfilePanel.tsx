import React, { useState } from 'react';
import { X, Award, Edit2, Check, Lock, Trophy } from 'lucide-react';
import type { UserProfile } from '../types';
import { BADGE_DEFINITIONS, getBadgeDefinition } from '../utils/badges';

interface ProfilePanelProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile | null;
  onUpdateAvatar: (url: string) => Promise<void>;
}

export const ProfilePanel: React.FC<ProfilePanelProps> = ({ isOpen, onClose, profile, onUpdateAvatar }) => {
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');

  if (!isOpen || !profile) return null;

  const userBadgeIds = profile.badges?.map(b => b.id) || [];
  const allBadges = Object.values(BADGE_DEFINITIONS);
  
  // Combine earned badges (which might include dynamic country ones) with static unearned badges
  const earnedBadges = profile.badges?.map(b => getBadgeDefinition(b.id)) || [];
  const unearnedBadges = allBadges.filter(b => !userBadgeIds.includes(b.id));

  const handleSaveAvatar = async () => {
    if (avatarUrl.trim()) {
      await onUpdateAvatar(avatarUrl.trim());
      setIsEditingAvatar(false);
    }
  };

  return (
    <>
      <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000 }} />
      <div className="side-panel glass-panel slide-in-right" style={{ zIndex: 1001, width: '400px', backgroundColor: 'rgba(10, 15, 25, 0.95)' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Trophy size={20} color="var(--accent-purple)" />
            Explorer Profile
          </h2>
          <button onClick={onClose} className="p-2 text-white/50 hover:text-white rounded-full transition-colors bg-transparent border-none cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Avatar Section */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div style={{ position: 'relative' }}>
              {profile.photoURL ? (
                <img src={profile.photoURL} alt="Avatar" style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent-cyan)', boxShadow: '0 0 20px rgba(0, 240, 255, 0.3)' }} />
              ) : (
                <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(255,255,255,0.2)' }}>
                  <Award size={40} color="rgba(255,255,255,0.5)" />
                </div>
              )}
              <button 
                onClick={() => { setIsEditingAvatar(true); setAvatarUrl(profile.photoURL || ''); }}
                style={{ position: 'absolute', bottom: 0, right: 0, background: 'var(--accent-blue)', color: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.5)' }}
              >
                <Edit2 size={14} />
              </button>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ margin: 0, color: 'white', fontSize: '1.25rem' }}>{profile.displayName}</h3>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>@{profile.username}</p>
            </div>

            {isEditingAvatar && (
              <div style={{ display: 'flex', gap: '8px', width: '100%', marginTop: '8px' }}>
                <input
                  type="text"
                  placeholder="Paste Image URL..."
                  value={avatarUrl}
                  onChange={e => setAvatarUrl(e.target.value)}
                  style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none' }}
                />
                <button onClick={handleSaveAvatar} className="glass-btn" style={{ padding: '0 16px', background: 'var(--accent-blue)' }}>
                  <Check size={16} color="white" />
                </button>
              </div>
            )}
          </div>

          {/* Trophy Case */}
          <div>
            <h4 style={{ margin: '0 0 16px 0', color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Trophy Case</h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              {earnedBadges.map(badge => (
                <div key={badge.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', textAlign: 'center' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${badge.color}`, boxShadow: `0 0 15px ${badge.color}40` }}>
                    <badge.icon size={28} color={badge.color} />
                  </div>
                  <span style={{ color: 'white', fontSize: '0.75rem', fontWeight: 600 }}>{badge.name}</span>
                </div>
              ))}

              {unearnedBadges.map(badge => (
                <div key={badge.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', textAlign: 'center', opacity: 0.3 }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(255,255,255,0.1)' }}>
                    <Lock size={24} color="rgba(255,255,255,0.5)" />
                  </div>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>{badge.name}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </>
  );
};
