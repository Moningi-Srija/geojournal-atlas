import React, { useState, useEffect } from 'react';
import { X, Search, UserPlus, Check, Star, Users } from 'lucide-react';
import { useAuth } from './AuthContext';
import { 
  searchUsers, 
  sendFollowRequest, 
  getFollowing, 
  getFollowers, 
  toggleCloseFriend,
  acceptFollowRequest
} from '../utils/firestore';
import type { UserProfile } from '../types';

interface SocialPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SocialPanel: React.FC<SocialPanelProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'search' | 'following' | 'followers'>('search');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const [following, setFollowing] = useState<any[]>([]);
  const [followers, setFollowers] = useState<any[]>([]);
  const [isLoadingLists, setIsLoadingLists] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      loadSocialLists();
    }
  }, [isOpen, user]);

  const loadSocialLists = async () => {
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
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
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
    if (!user) return;
    try {
      await acceptFollowRequest(user.uid, followerUid);
      await loadSocialLists();
    } catch (err) {
      console.error(err);
    }
  };

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
            <h2 style={{ fontWeight: 600, fontSize: '1.125rem', color: 'white', margin: 0 }}>Social Network</h2>
            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', margin: 0 }}>Connect with explorers</p>
          </div>
        </div>
        <button onClick={onClose} style={{ padding: '8px', color: 'rgba(255,255,255,0.5)', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: '50%' }}>
          <X size={20} />
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', padding: '8px', backgroundColor: 'rgba(255,255,255,0.05)' }}>
        <button 
          onClick={() => setActiveTab('search')}
          style={{ flex: 1, padding: '8px 0', fontSize: '0.875rem', fontWeight: 500, borderRadius: '8px', border: 'none', cursor: 'pointer', transition: 'all 0.2s', backgroundColor: activeTab === 'search' ? 'rgba(255,255,255,0.1)' : 'transparent', color: activeTab === 'search' ? 'white' : 'rgba(255,255,255,0.5)' }}
        >
          Search
        </button>
        <button 
          onClick={() => setActiveTab('following')}
          style={{ flex: 1, padding: '8px 0', fontSize: '0.875rem', fontWeight: 500, borderRadius: '8px', border: 'none', cursor: 'pointer', transition: 'all 0.2s', backgroundColor: activeTab === 'following' ? 'rgba(255,255,255,0.1)' : 'transparent', color: activeTab === 'following' ? 'white' : 'rgba(255,255,255,0.5)' }}
        >
          Following
        </button>
        <button 
          onClick={() => setActiveTab('followers')}
          style={{ flex: 1, padding: '8px 0', fontSize: '0.875rem', fontWeight: 500, borderRadius: '8px', border: 'none', cursor: 'pointer', transition: 'all 0.2s', backgroundColor: activeTab === 'followers' ? 'rgba(255,255,255,0.1)' : 'transparent', color: activeTab === 'followers' ? 'white' : 'rgba(255,255,255,0.5)' }}
        >
          Followers
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
                onChange={(e) => setSearchQuery(e.target.value)}
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
                {searchResults.map(u => {
                  const isFollowing = following.some(f => f.uid === u.uid);
                  return (
                    <div key={u.uid} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
              <div key={f.uid} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
              <div key={f.uid} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
            ))}
            {followers.length === 0 && !isLoadingLists && (
              <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'rgba(255,255,255,0.4)', marginTop: '16px' }}>No followers yet.</p>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
