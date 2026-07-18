import React, { useCallback, useState, useEffect, useRef } from 'react';
import { X, Search, UserPlus, Check, Star, Users, Globe2, MapPin, Clock, XCircle } from 'lucide-react';
import { useAuth } from './AuthContext';
import { 
  searchUsers, 
  sendFollowRequest, 
  getFollowing, 
  getFollowers, 
  toggleCloseFriend,
  acceptFollowRequest,
  getMemoryInvites,
  respondToMemoryInvite,
} from '../utils/firestore';
import type { MemoryInviteDetails, UserProfile } from '../types';

interface SocialPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenExplorer?: (profile: UserProfile) => void;
  demoMode?: boolean;
  demoExplorers?: UserProfile[];
  onDemoInviteAccepted?: (pinId: string) => void;
}

export const SocialPanel: React.FC<SocialPanelProps> = ({
  isOpen,
  onClose,
  onOpenExplorer,
  demoMode = false,
  demoExplorers = [],
  onDemoInviteAccepted,
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'search' | 'following' | 'followers' | 'shared'>('search');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const [following, setFollowing] = useState<any[]>([]);
  const [followers, setFollowers] = useState<any[]>([]);
  const [isLoadingLists, setIsLoadingLists] = useState(false);
  const [memoryInvites, setMemoryInvites] = useState<MemoryInviteDetails[]>([]);
  const [isLoadingInvites, setIsLoadingInvites] = useState(false);
  const [inviteActionId, setInviteActionId] = useState('');
  const [inviteError, setInviteError] = useState('');
  const demoSocialInitialized = useRef(false);

  const loadSocialLists = useCallback(async () => {
    if (!user) return;
    setIsLoadingLists(true);
    try {
      const [followingData, followersData] = await Promise.all([
        getFollowing(user.uid),
        getFollowers(user.uid)
      ]);
      setFollowing(followingData);
      setFollowers(followersData);
    } catch (err) {
      console.error("Failed to load social lists:", err);
    } finally {
      setIsLoadingLists(false);
    }
  }, [user]);

  const loadMemoryInvites = useCallback(async () => {
    if (!user) return;
    setIsLoadingInvites(true);
    setInviteError('');
    try {
      setMemoryInvites(await getMemoryInvites(user.uid));
    } catch (err) {
      console.error('Failed to load shared-trip invites:', err);
      setInviteError(
        err instanceof Error ? err.message : 'Shared-trip invitations could not be loaded.',
      );
    } finally {
      setIsLoadingInvites(false);
    }
  }, [user]);

  useEffect(() => {
    if (!isOpen) return;

    if (demoMode) {
      if (demoSocialInitialized.current) return;
      const [primaryExplorer, secondaryExplorer, thirdExplorer, fourthExplorer, fifthExplorer, sixthExplorer] = demoExplorers;
      setFollowing(demoExplorers.slice(0, 4).map((explorer) => ({
        ...explorer,
        relationship: { status: 'following', isCloseFriend: explorer.uid === primaryExplorer?.uid },
      })));
      setFollowers([
        secondaryExplorer && {
          ...secondaryExplorer,
          relationship: { status: 'following' },
        },
        fourthExplorer && {
          ...fourthExplorer,
          relationship: { status: 'following' },
        },
        fifthExplorer && {
          ...fifthExplorer,
          relationship: { status: 'following' },
        },
        sixthExplorer && {
          ...sixthExplorer,
          relationship: { status: 'requested' },
        },
      ].filter(Boolean));
      setSearchResults(demoExplorers);
      setMemoryInvites([
        primaryExplorer && {
          id: 'demo-coorg-invite',
          pinId: 'demo-coorg-shared',
          inviterId: primaryExplorer.uid,
          inviteeId: 'demo-srija',
          status: 'pending',
          memoryTitle: 'Monsoon trails in Coorg',
          locationName: 'Madikeri, Karnataka',
          invitedAt: Date.now() - 42 * 60 * 1000,
          inviter: primaryExplorer,
        },
        secondaryExplorer && {
          id: 'demo-lisbon-invite',
          pinId: 'demo-lisbon-shared',
          inviterId: secondaryExplorer.uid,
          inviteeId: 'demo-srija',
          status: 'accepted',
          memoryTitle: 'Lisbon night-train reunion',
          locationName: 'Lisbon, Portugal',
          invitedAt: Date.now() - 52 * 24 * 60 * 60 * 1000,
          respondedAt: Date.now() - 51 * 24 * 60 * 60 * 1000,
          inviter: secondaryExplorer,
        },
        thirdExplorer && {
          id: 'demo-meghalaya-invite',
          pinId: 'demo-meghalaya-shared',
          inviterId: thirdExplorer.uid,
          inviteeId: 'demo-srija',
          status: 'pending',
          memoryTitle: 'Cloud roads in Meghalaya',
          locationName: 'Cherrapunji, Meghalaya',
          invitedAt: Date.now() - 3 * 60 * 60 * 1000,
          inviter: thirdExplorer,
        },
      ].filter(Boolean) as MemoryInviteDetails[]);
      setActiveTab('following');
      setInviteError('');
      setIsLoadingInvites(false);
      setIsLoadingLists(false);
      demoSocialInitialized.current = true;
      return;
    }

    demoSocialInitialized.current = false;

    if (user) {
      void loadSocialLists();
      void loadMemoryInvites();
    }
  }, [isOpen, user, loadSocialLists, loadMemoryInvites, demoMode, demoExplorers]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    if (demoMode) {
      const query = searchQuery.trim().toLowerCase();
      setSearchResults(demoExplorers.filter((explorer) => (
        explorer.displayName.toLowerCase().includes(query)
        || explorer.username.toLowerCase().includes(query)
        || explorer.bio.toLowerCase().includes(query)
      )));
      return;
    }
    setIsSearching(true);
    try {
      const results = await searchUsers(searchQuery);
      // Filter out self
      setSearchResults(results.filter(r => r.uid !== user?.uid));
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleFollow = async (targetUid: string) => {
    if (demoMode) {
      const target = demoExplorers.find((explorer) => explorer.uid === targetUid);
      if (!target) return;
      setFollowing((current) => current.some((explorer) => explorer.uid === targetUid)
        ? current
        : [...current, { ...target, relationship: { status: 'following', isCloseFriend: false } }]);
      return;
    }
    if (!user) return;
    try {
      await sendFollowRequest(user.uid, targetUid);
      // Refresh to update UI
      await loadSocialLists();
      alert("Follow request sent!");
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleCloseFriend = async (followingUid: string, currentStatus: boolean) => {
    if (demoMode) {
      setFollowing(prev => prev.map(f => f.uid === followingUid
        ? { ...f, relationship: { ...f.relationship, isCloseFriend: !currentStatus } }
        : f));
      return;
    }
    if (!user) return;
    try {
      await toggleCloseFriend(user.uid, followingUid, !currentStatus);
      // Update local state instantly
      setFollowing(prev => prev.map(f => {
        if (f.uid === followingUid) {
          return { ...f, relationship: { ...f.relationship, isCloseFriend: !currentStatus } };
        }
        return f;
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAcceptRequest = async (followerUid: string) => {
    if (demoMode) {
      setFollowers((current) => current.map((follower) => follower.uid === followerUid
        ? { ...follower, relationship: { ...follower.relationship, status: 'following' } }
        : follower));
      return;
    }
    if (!user) return;
    try {
      await acceptFollowRequest(user.uid, followerUid);
      await loadSocialLists();
    } catch (err) {
      console.error(err);
    }
  };

  const handleInviteResponse = async (
    invite: MemoryInviteDetails,
    response: 'accepted' | 'declined',
  ) => {
    if ((!user && !demoMode) || inviteActionId) return;
    setInviteActionId(invite.id);
    setInviteError('');
    if (demoMode) {
      setMemoryInvites((current) => current.map((candidate) => candidate.id === invite.id
        ? { ...candidate, status: response, respondedAt: Date.now() }
        : candidate));
      if (response === 'accepted') onDemoInviteAccepted?.(invite.pinId);
      setInviteActionId('');
      return;
    }
    try {
      await respondToMemoryInvite(user!.uid, invite.id, response);
      setMemoryInvites((current) => current.map((candidate) => candidate.id === invite.id
        ? { ...candidate, status: response, respondedAt: Date.now() }
        : candidate));
    } catch (err) {
      console.error('Failed to respond to shared-trip invite:', err);
      setInviteError(
        err instanceof Error ? err.message : 'Your invitation response could not be saved.',
      );
    } finally {
      setInviteActionId('');
    }
  };

  const handleExplorerKeyDown = (
    event: React.KeyboardEvent<HTMLDivElement>,
    profile: UserProfile,
  ) => {
    if (!onOpenExplorer || (event.key !== 'Enter' && event.key !== ' ')) return;
    event.preventDefault();
    event.stopPropagation();
    onOpenExplorer(profile);
  };

  const handleAtlasAction = (
    event: React.MouseEvent<HTMLButtonElement>,
    profile: UserProfile,
  ) => {
    event.stopPropagation();
    onOpenExplorer?.(profile);
  };

  const pendingInviteCount = memoryInvites.filter((invite) => invite.status === 'pending').length;

  if (!isOpen) return null;

  return (
    <div className="glass-panel side-panel slide-in-right">
      
      {/* Header */}
      <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa' }}>
            <Users size={20} />
          </div>
          <div>
            <h2 style={{ fontWeight: 600, fontSize: '1.125rem', color: 'white', margin: 0 }}>Explorer Circle</h2>
            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', margin: 0 }}>People, public worlds and shared trips</p>
            {demoMode && <span className="collab-community-demo-label">Presentation community</span>}
          </div>
        </div>
        <button type="button" onClick={onClose} aria-label="Close explorer network" style={{ padding: '8px', color: 'rgba(255,255,255,0.5)', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: '50%' }}>
          <X size={20} />
        </button>
      </div>

      {/* Tabs */}
      <div className="collab-social-tabs" role="tablist" aria-label="Social network sections" style={{ display: 'flex', padding: '8px', backgroundColor: 'rgba(255,255,255,0.05)' }}>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'search'}
          onClick={() => setActiveTab('search')}
          style={{ flex: 1, padding: '8px 0', fontSize: '0.875rem', fontWeight: 500, borderRadius: '8px', border: 'none', cursor: 'pointer', transition: 'all 0.2s', backgroundColor: activeTab === 'search' ? 'rgba(255,255,255,0.1)' : 'transparent', color: activeTab === 'search' ? 'white' : 'rgba(255,255,255,0.5)' }}
        >
          Search
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'following'}
          onClick={() => setActiveTab('following')}
          style={{ flex: 1, padding: '8px 0', fontSize: '0.875rem', fontWeight: 500, borderRadius: '8px', border: 'none', cursor: 'pointer', transition: 'all 0.2s', backgroundColor: activeTab === 'following' ? 'rgba(255,255,255,0.1)' : 'transparent', color: activeTab === 'following' ? 'white' : 'rgba(255,255,255,0.5)' }}
        >
          Following
          {following.length > 0 && <span className="collab-tab-count is-neutral">{following.length}</span>}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'followers'}
          onClick={() => setActiveTab('followers')}
          style={{ flex: 1, padding: '8px 0', fontSize: '0.875rem', fontWeight: 500, borderRadius: '8px', border: 'none', cursor: 'pointer', transition: 'all 0.2s', backgroundColor: activeTab === 'followers' ? 'rgba(255,255,255,0.1)' : 'transparent', color: activeTab === 'followers' ? 'white' : 'rgba(255,255,255,0.5)' }}
        >
          Followers
          {followers.length > 0 && <span className="collab-tab-count is-neutral">{followers.length}</span>}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'shared'}
          onClick={() => setActiveTab('shared')}
          style={{ flex: 1, padding: '8px 0', fontSize: '0.875rem', fontWeight: 500, borderRadius: '8px', border: 'none', cursor: 'pointer', transition: 'all 0.2s', backgroundColor: activeTab === 'shared' ? 'rgba(255,255,255,0.1)' : 'transparent', color: activeTab === 'shared' ? 'white' : 'rgba(255,255,255,0.5)' }}
          aria-label={`Shared trips${pendingInviteCount ? `, ${pendingInviteCount} pending` : ''}`}
        >
          Shared trips
          {memoryInvites.length > 0 && <span className="collab-tab-count">{memoryInvites.length}</span>}
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* SEARCH TAB */}
        {activeTab === 'search' && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <form onSubmit={handleSearch} style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search usernames..."
                value={searchQuery}
                onChange={(e) => {
                  const nextQuery = e.target.value;
                  setSearchQuery(nextQuery);
                  if (demoMode && !nextQuery.trim()) setSearchResults(demoExplorers);
                }}
                className="glass-input"
                style={{ width: '100%', paddingLeft: '40px', padding: '10px 10px 10px 40px', fontSize: '0.875rem' }}
              />
              <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} size={16} />
              <button type="submit" style={{ display: 'none' }}></button>
            </form>

            {isSearching ? (
              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem', marginTop: '16px' }}>Searching...</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                {demoMode && !searchQuery && (
                  <div className="collab-community-heading">
                    <strong>Suggested explorers</strong>
                    <span>Open any profile to see their public globe.</span>
                  </div>
                )}
                {searchResults.map(u => {
                  const isFollowing = following.some(f => f.uid === u.uid);
                  return (
                    <div className="collab-explorer-row" key={u.uid} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div
                        className="explorer-identity"
                        onClick={() => onOpenExplorer?.(u)}
                        onKeyDown={(event) => handleExplorerKeyDown(event, u)}
                        role={onOpenExplorer ? 'button' : undefined}
                        tabIndex={onOpenExplorer ? 0 : undefined}
                        aria-label={onOpenExplorer ? `View ${u.displayName || u.username}'s Atlas` : undefined}
                        style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
                      >
                        {u.photoURL ? (
                          <img src={u.photoURL} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{u.username.charAt(0).toUpperCase()}</span>
                          </div>
                        )}
                        <div>
                          <p style={{ fontWeight: 500, fontSize: '0.875rem', color: 'white', margin: 0 }}>{u.displayName}</p>
                          <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', margin: 0 }}>@{u.username}</p>
                        </div>
                      </div>
                      <div className="collab-explorer-actions" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {onOpenExplorer && (
                          <button
                            type="button"
                            onClick={(event) => handleAtlasAction(event, u)}
                            className="glass-btn explorer-atlas-action"
                            style={{ padding: '6px 9px', fontSize: '0.72rem' }}
                            aria-label={`View ${u.displayName || u.username}'s Atlas`}
                          >
                            <Globe2 size={13} /> View Atlas
                          </button>
                        )}
                        {isFollowing ? (
                          <button disabled className="glass-btn" style={{ padding: '6px 12px', fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', borderColor: 'rgba(255,255,255,0.1)' }}>
                            <Check size={14} /> Following
                          </button>
                        ) : (
                          <button onClick={() => handleFollow(u.uid)} className="glass-btn glass-btn-primary" style={{ padding: '6px 12px', fontSize: '0.75rem', color: 'white' }}>
                            <UserPlus size={14} /> Follow
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
                {searchResults.length === 0 && searchQuery && !isSearching && (
                  <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'rgba(255,255,255,0.4)', marginTop: '16px' }}>No users found.</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* FOLLOWING TAB */}
        {activeTab === 'following' && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {isLoadingLists ? <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'rgba(255,255,255,0.4)' }}>Loading...</p> : null}
            {following.map(f => (
              <div className="collab-explorer-row" key={f.uid} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div
                  className="explorer-identity"
                  onClick={() => onOpenExplorer?.(f as UserProfile)}
                  onKeyDown={(event) => handleExplorerKeyDown(event, f as UserProfile)}
                  role={onOpenExplorer ? 'button' : undefined}
                  tabIndex={onOpenExplorer ? 0 : undefined}
                  aria-label={onOpenExplorer ? `View ${f.displayName || f.username}'s Atlas` : undefined}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
                >
                   {f.photoURL ? (
                    <img src={f.photoURL} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{f.username.charAt(0).toUpperCase()}</span>
                    </div>
                  )}
                  <div>
                    <p style={{ fontWeight: 500, fontSize: '0.875rem', color: 'white', margin: 0 }}>{f.displayName}</p>
                    <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', margin: 0 }}>@{f.username}</p>
                    {f.relationship?.status === 'requested' && (
                      <p style={{ fontSize: '0.625rem', color: '#facc15', margin: 0 }}>Request Pending</p>
                    )}
                  </div>
                </div>
                
                <div className="collab-explorer-actions" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {onOpenExplorer && (
                    <button
                      type="button"
                      onClick={(event) => handleAtlasAction(event, f as UserProfile)}
                      className="glass-btn explorer-atlas-action"
                      style={{ padding: '6px 9px', fontSize: '0.72rem' }}
                      aria-label={`View ${f.displayName || f.username}'s Atlas`}
                    >
                      <Globe2 size={13} /> View Atlas
                    </button>
                  )}
                  {f.relationship?.status === 'following' && (
                    <button
                      onClick={() => handleToggleCloseFriend(f.uid, f.relationship?.isCloseFriend)}
                      style={{ padding: '8px', borderRadius: '50%', transition: 'all 0.2s', border: 'none', cursor: 'pointer', backgroundColor: f.relationship?.isCloseFriend ? 'rgba(250,204,21,0.1)' : 'transparent', color: f.relationship?.isCloseFriend ? '#facc15' : 'rgba(255,255,255,0.3)' }}
                      title={f.relationship?.isCloseFriend ? "Remove from Close Friends" : "Add to Close Friends"}
                    >
                      <Star size={18} fill={f.relationship?.isCloseFriend ? 'currentColor' : 'none'} />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {following.length === 0 && !isLoadingLists && (
              <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'rgba(255,255,255,0.4)', marginTop: '16px' }}>You aren't following anyone yet.</p>
            )}
          </div>
        )}

        {/* FOLLOWERS TAB */}
        {activeTab === 'followers' && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {isLoadingLists ? <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'rgba(255,255,255,0.4)' }}>Loading...</p> : null}
            {followers.map(f => (
              <div className="collab-explorer-row" key={f.uid} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div
                  className="explorer-identity"
                  onClick={() => onOpenExplorer?.(f as UserProfile)}
                  onKeyDown={(event) => handleExplorerKeyDown(event, f as UserProfile)}
                  role={onOpenExplorer ? 'button' : undefined}
                  tabIndex={onOpenExplorer ? 0 : undefined}
                  aria-label={onOpenExplorer ? `View ${f.displayName || f.username}'s Atlas` : undefined}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
                >
                  {f.photoURL ? (
                    <img src={f.photoURL} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{f.username.charAt(0).toUpperCase()}</span>
                    </div>
                  )}
                  <div>
                    <p style={{ fontWeight: 500, fontSize: '0.875rem', color: 'white', margin: 0 }}>{f.displayName}</p>
                    <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', margin: 0 }}>@{f.username}</p>
                  </div>
                </div>
                
                <div className="collab-explorer-actions" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {onOpenExplorer && (
                    <button
                      type="button"
                      onClick={(event) => handleAtlasAction(event, f as UserProfile)}
                      className="glass-btn explorer-atlas-action"
                      style={{ padding: '6px 9px', fontSize: '0.72rem' }}
                      aria-label={`View ${f.displayName || f.username}'s Atlas`}
                    >
                      <Globe2 size={13} /> View Atlas
                    </button>
                  )}
                  {f.relationship?.status === 'requested' ? (
                    <button
                      onClick={() => handleAcceptRequest(f.uid)}
                      className="glass-btn"
                      style={{ fontSize: '0.75rem', padding: '4px 12px', color: '#4ade80', borderColor: 'rgba(74,222,128,0.3)', backgroundColor: 'transparent' }}
                    >
                      Accept
                    </button>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>Following you</span>
                  )}
                </div>
              </div>
            ))}
            {followers.length === 0 && !isLoadingLists && (
              <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'rgba(255,255,255,0.4)', marginTop: '16px' }}>No followers yet.</p>
            )}
          </div>
        )}

        {/* SHARED TRIPS / INVITES TAB */}
        {activeTab === 'shared' && (
          <div className="fade-in collab-invite-panel">
            <div className="collab-invite-intro">
              <span><Users size={18} aria-hidden="true" /></span>
              <div>
                <h3>Shared trip memories</h3>
                <p>Accept an invite to show the same memory on your Atlas—no duplicate post is created.</p>
                {demoMode && <span className="collab-demo-label">Presentation sample · try it</span>}
              </div>
            </div>

            {inviteError && (
              <div className="collab-invite-error" role="alert">
                <strong>Shared trips are unavailable</strong>
                <span>{inviteError}</span>
                <button type="button" onClick={() => void loadMemoryInvites()}>Try again</button>
              </div>
            )}

            {isLoadingInvites ? (
              <p className="collab-invite-loading" role="status">Loading shared trips…</p>
            ) : (
              <div className="collab-invite-list">
                {memoryInvites.map((invite) => {
                  const inviterName = invite.inviter?.displayName || invite.inviter?.username || 'A fellow explorer';
                  const isActing = inviteActionId === invite.id;
                  return (
                    <article className={`collab-invite-card collab-invite-${invite.status}`} key={invite.id}>
                      <div className="collab-invite-topline">
                        {invite.inviter?.photoURL ? (
                          <img src={invite.inviter.photoURL} alt="" />
                        ) : (
                          <span className="collab-avatar-fallback" aria-hidden="true">
                            {inviterName.charAt(0).toUpperCase()}
                          </span>
                        )}
                        <div>
                          <strong>{inviterName}</strong>
                          <span>invited you as a co-traveler</span>
                        </div>
                        <span className="collab-invite-date">
                          {new Date(invite.invitedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </div>

                      <div className="collab-invite-memory">
                        <strong>{invite.memoryTitle}</strong>
                        <span><MapPin size={13} aria-hidden="true" /> {invite.locationName}</span>
                      </div>

                      {invite.status === 'pending' ? (
                        <>
                          <div className="collab-pending-label"><Clock size={13} /> Pending acceptance</div>
                          <div className="collab-invite-actions">
                            <button
                              type="button"
                              className="collab-decline-button"
                              onClick={() => void handleInviteResponse(invite, 'declined')}
                              disabled={Boolean(inviteActionId)}
                              aria-label={`Decline shared memory ${invite.memoryTitle}`}
                            >
                              <XCircle size={15} /> Decline
                            </button>
                            <button
                              type="button"
                              className="collab-accept-button"
                              onClick={() => void handleInviteResponse(invite, 'accepted')}
                              disabled={Boolean(inviteActionId)}
                              aria-label={`Accept shared memory ${invite.memoryTitle}`}
                            >
                              {isActing ? <Clock size={15} /> : <Check size={15} />}
                              {isActing ? 'Saving…' : 'Accept & show on Atlas'}
                            </button>
                          </div>
                        </>
                      ) : invite.status === 'accepted' ? (
                        <div className="collab-response-label collab-response-accepted">
                          <Check size={14} /> Accepted · visible on your Atlas
                        </div>
                      ) : (
                        <div className="collab-response-label collab-response-declined">
                          <X size={14} /> Declined
                        </div>
                      )}
                    </article>
                  );
                })}

                {memoryInvites.length === 0 && !inviteError && (
                  <div className="collab-invite-empty">
                    <Users size={26} aria-hidden="true" />
                    <strong>No shared-trip invites yet</strong>
                    <span>When a friend tags you in a memory, it will appear here.</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
