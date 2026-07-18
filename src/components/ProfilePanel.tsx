import React, { useState } from 'react';
import { X, Award, Check, Edit2, Lock, Palette, Sparkles, Trophy } from 'lucide-react';
import type { UserProfile, JournalEntry } from '../types';
import {
  BADGE_DEFINITIONS,
  getBadgeDefinition,
  getBadgeProgress,
  getDistinctCountries,
  getEarnedBadgeIds,
} from '../utils/badges';
import { useAuth } from './AuthContext';
import { AtlasPersonaModal } from './AtlasPersonaModal';

interface ProfilePanelProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile | null;
  entries: JournalEntry[]; // Added for progress calculation
  demoMode?: boolean;
}

const PRESET_AVATARS = [
  'Felix', 'Mimi', 'Bandit', 'Leo', 'Kitty', 'Jack', 'Cleo', 'Buster', 'Sam', 'Molly'
].map(seed => `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}`);

type AtlasTheme = 'midnight' | 'aurora' | 'ember';

const ATLAS_THEMES: Array<{ id: AtlasTheme; name: string; description: string; swatches: string[] }> = [
  { id: 'midnight', name: 'Midnight', description: 'Deep ocean cartography', swatches: ['#72d6c2', '#ffb66e', '#0d151d'] },
  { id: 'aurora', name: 'Aurora', description: 'Cool northern light', swatches: ['#77c7ff', '#ff9fcf', '#10192b'] },
  { id: 'ember', name: 'Ember', description: 'Warm expedition glow', swatches: ['#f2ca7a', '#ff8566', '#21140f'] },
];

export const ProfilePanel: React.FC<ProfilePanelProps> = ({ isOpen, onClose, profile, entries, demoMode = false }) => {
  const { updateProfile } = useAuth();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [isPersonaOpen, setIsPersonaOpen] = useState(false);
  const [atlasTheme, setAtlasTheme] = useState<AtlasTheme>(() => {
    const stored = localStorage.getItem('geojournal_atlas_theme');
    return stored === 'aurora' || stored === 'ember' ? stored : 'midnight';
  });

  if (!isOpen || !profile) return null;

  const ownedEntries = entries.filter((entry) => (
    entry.authorId === profile.uid
    || entry.acceptedCollaboratorIds?.includes(profile.uid)
  ));
  const calculatedBadgeIds = getEarnedBadgeIds(ownedEntries);
  const persistedLegacyBadgeIds = profile.badges
    ?.map((badge) => badge.id)
    .filter((id) => !BADGE_DEFINITIONS[id] && !id.startsWith('country_')) ?? [];
  const userBadgeIds = [...new Set([
    ...persistedLegacyBadgeIds,
    ...calculatedBadgeIds,
  ])];
  const allBadges = Object.values(BADGE_DEFINITIONS);
  const earnedBadges = userBadgeIds.map(getBadgeDefinition);
  const earnedAchievementBadges = earnedBadges.filter((badge) => badge.category === 'achievement');
  const passportBadges = earnedBadges.filter((badge) => badge.category === 'country');
  const unearnedBadges = allBadges.filter((badge) => !userBadgeIds.includes(badge.id));
  const countriesVisited = getDistinctCountries(ownedEntries).length;
  const photoCount = ownedEntries.reduce(
    (total, entry) => total + (entry.photos?.length ?? 0) + (entry.googlePhotosUrl ? 1 : 0),
    0,
  );

  const handleSaveProfile = async () => {
    try {
      await updateProfile({
        displayName: editDisplayName || profile.displayName,
        username: editUsername || profile.username,
        photoURL: avatarUrl.trim()
      });
      setIsEditingProfile(false);
    } catch (err) {
      console.error("Failed to update profile", err);
    }
  };

  const chooseTheme = (theme: AtlasTheme) => {
    setAtlasTheme(theme);
    localStorage.setItem('geojournal_atlas_theme', theme);
    document.documentElement.dataset.atlasTheme = theme;
  };

  return (
    <>
      <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000 }} />
      <div className="side-panel profile-panel glass-panel slide-in-right" style={{ zIndex: 1001, backgroundColor: 'rgba(10, 15, 25, 0.95)' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Trophy size={20} color="var(--accent-purple)" />
            Explorer Profile
          </h2>
          <button type="button" onClick={onClose} aria-label="Close explorer profile" className="p-2 text-white/50 hover:text-white rounded-full transition-colors bg-transparent border-none cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '32px' }}>

          {/* Avatar Section */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div style={{ position: 'relative' }}>
              {profile.photoURL ? (
                <img src={profile.photoURL} alt="Avatar" style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--accent-cyan)', boxShadow: '0 0 30px rgba(0, 240, 255, 0.4)' }} />
              ) : (
                <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid rgba(255,255,255,0.2)' }}>
                  <Award size={48} color="rgba(255,255,255,0.5)" />
                </div>
              )}
              {!demoMode && (
                <button
                  type="button"
                  aria-label={isEditingProfile ? 'Close profile editor' : 'Edit profile'}
                  onClick={() => { setIsEditingProfile(!isEditingProfile); setEditDisplayName(profile.displayName); setEditUsername(profile.username); setAvatarUrl(profile.photoURL || ''); }}
                  style={{ position: 'absolute', bottom: 0, right: 0, background: 'var(--accent-blue)', color: 'white', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,136,255,0.6)' }}
                >
                  <Edit2 size={16} />
                </button>
              )}
            </div>

            {!isEditingProfile ? (
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ margin: 0, color: 'white', fontSize: '1.5rem', fontWeight: 'bold' }}>{profile.displayName}</h3>
                <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: '1rem' }}>@{profile.username}</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <input
                  type="text"
                  placeholder="Display Name"
                  value={editDisplayName}
                  onChange={e => setEditDisplayName(e.target.value)}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none' }}
                />
                <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}>
                  <span style={{ padding: '12px 0 12px 16px', color: 'rgba(255,255,255,0.5)' }}>@</span>
                  <input
                    type="text"
                    placeholder="username"
                    value={editUsername}
                    onChange={e => setEditUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    style={{ flex: 1, padding: '12px 16px 12px 4px', background: 'transparent', border: 'none', color: 'white', outline: 'none' }}
                  />
                </div>

                <p style={{ margin: '8px 0 4px 0', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>Choose an Avatar</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                  {PRESET_AVATARS.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      onClick={() => setAvatarUrl(url)}
                      style={{
                        width: '100%',
                        aspectRatio: '1',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        border: avatarUrl === url ? '2px solid var(--accent-cyan)' : '2px solid transparent',
                        opacity: avatarUrl === url ? 1 : 0.6,
                        transition: 'all 0.2s',
                        background: 'rgba(255,255,255,0.05)'
                      }}
                    />
                  ))}
                </div>

                <input
                  type="text"
                  placeholder="Or paste custom image URL"
                  value={avatarUrl}
                  onChange={e => setAvatarUrl(e.target.value)}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none', marginTop: '8px' }}
                />
                <button onClick={handleSaveProfile} className="glass-btn glass-btn-primary" style={{ marginTop: '8px', padding: '12px' }}>
                  Save Profile
                </button>
              </div>
            )}
          </div>

          <section className="persona-launch-card" aria-labelledby="persona-launch-title">
            <div className="persona-launch-visual" aria-hidden="true">
              <span className="persona-launch-ring" />
              {profile.photoURL ? (
                <img src={profile.photoURL} alt="" />
              ) : (
                <span>{profile.displayName.trim().charAt(0).toUpperCase() || 'A'}</span>
              )}
              <Sparkles size={15} />
            </div>
            <div className="persona-launch-copy">
              <span>Personalized by your journeys</span>
              <h4 id="persona-launch-title">Meet your Atlas Persona</h4>
              <p>Turn the places, moods and motifs in your memories into a one-of-one travel identity.</p>
            </div>
            <button type="button" onClick={() => setIsPersonaOpen(true)}>
              Open studio <Sparkles size={14} />
            </button>
          </section>

          <section className="profile-theme-studio" aria-labelledby="atlas-theme-title">
            <div className="profile-theme-heading">
              <span><Palette size={16} /></span>
              <div>
                <h4 id="atlas-theme-title">Atlas atmosphere</h4>
                <p>Change the mood without moving the controls.</p>
              </div>
            </div>
            <div className="profile-theme-options">
              {ATLAS_THEMES.map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => chooseTheme(theme.id)}
                  className={atlasTheme === theme.id ? 'is-selected' : ''}
                  aria-pressed={atlasTheme === theme.id}
                >
                  <span className="profile-theme-swatches" aria-hidden="true">
                    {theme.swatches.map((color) => <i key={color} style={{ background: color }} />)}
                  </span>
                  <strong>{theme.name}</strong>
                  <small>{theme.description}</small>
                  {atlasTheme === theme.id && <Check size={14} className="profile-theme-check" />}
                </button>
              ))}
            </div>
          </section>

          {/* Trophy Case */}
          <div>
            <h4 style={{ margin: '0 0 16px 0', color: 'rgba(255,255,255,0.7)', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Trophy size={16} /> Trophy Case
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
              {[
                { label: 'Memories', value: ownedEntries.length },
                { label: 'Countries', value: countriesVisited },
                { label: 'Photos', value: photoCount },
              ].map((stat) => (
                <div key={stat.label} style={{ padding: '12px 8px', borderRadius: '12px', textAlign: 'center', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ color: 'white', fontSize: '1.25rem', fontWeight: 700 }}>{stat.value}</div>
                  <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{stat.label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
              {/* Earned Badges */}
              {earnedAchievementBadges.map(badge => (
                <div key={badge.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: `1px solid ${badge.color}40`, boxShadow: `inset 0 0 20px ${badge.color}10` }}>
                  <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${badge.color}`, boxShadow: `0 0 15px ${badge.color}40`, flexShrink: 0 }}>
                    <badge.icon size={28} color={badge.color} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h5 style={{ margin: '0 0 4px 0', color: badge.color, fontSize: '1.1rem', fontWeight: 'bold' }}>{badge.name}</h5>
                    <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', lineHeight: 1.4 }}>{badge.description}</p>
                  </div>
                </div>
              ))}

              {/* Unearned Badges with Progression */}
              {unearnedBadges.map(badge => {
                const progress = getBadgeProgress(badge, ownedEntries);

                return (
                  <div key={badge.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: 'rgba(0,0,0,0.4)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>
                      <Lock size={24} color="rgba(255,255,255,0.3)" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '8px' }}>
                        <div>
                          <h5 style={{ margin: '0 0 4px 0', color: 'rgba(255,255,255,0.6)', fontSize: '1rem', fontWeight: '600' }}>{badge.name}</h5>
                          <p style={{ margin: 0, color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', lineHeight: 1.4 }}>{badge.description}</p>
                        </div>
                        <span style={{ fontSize: '0.8rem', color: badge.color, fontWeight: 'bold' }}>
                          {progress.current} / {progress.target}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${progress.percent}%`,
                            height: '100%',
                            background: badge.color,
                            boxShadow: `0 0 10px ${badge.color}`,
                            transition: 'width 1s ease-out'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {passportBadges.length > 0 && (
              <div style={{ marginTop: '24px' }}>
                <h5 style={{ margin: '0 0 12px', color: 'rgba(255,255,255,0.55)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Passport stamps</h5>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {passportBadges.map((badge) => (
                    <div key={badge.id} title={badge.description} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '999px', background: `${badge.color}12`, border: `1px solid ${badge.color}55`, color: badge.color, fontSize: '0.8rem', fontWeight: 600 }}>
                      <badge.icon size={15} /> {badge.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
      <AtlasPersonaModal
        isOpen={isPersonaOpen}
        onClose={() => setIsPersonaOpen(false)}
        profile={profile}
        entries={ownedEntries}
      />
    </>
  );
};
