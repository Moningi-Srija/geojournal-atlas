import { useState, useEffect, useRef } from 'react';
import { Plus, Compass, User as UserIcon, LogOut, Users } from 'lucide-react';
import type { JournalEntry } from './types';
import { GlobeView } from './components/GlobeView';
import { Sidebar } from './components/Sidebar';
import { CreateEntryPanel } from './components/CreateEntryPanel';
import { EntryCard } from './components/EntryCard';
import { AuthModal } from './components/AuthModal';
import { SocialPanel } from './components/SocialPanel';
import { LandingPage } from './components/LandingPage';
import { ProfilePanel } from './components/ProfilePanel';
import { useAuth } from './components/AuthContext';
import { db } from './firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { fetchPins, savePin, deletePin as deletePinFirestore } from './utils/firestore';

// Default initial entries to populate on first load so the app looks stunning immediately
const INITIAL_ENTRIES: JournalEntry[] = [
  {
    id: 'kyoto-1',
    title: 'Autumn in Kyoto',
    body: 'Walking through the historic streets of Gion. The maple leaves have turned a brilliant shade of crimson, contrasting beautifully with the dark wood of the traditional machiya townhouses.',
    photos: [
      'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?q=80&w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=500&auto=format&fit=crop'
    ],
    locationName: 'Kyoto, Japan',
    lat: 35.0116,
    lng: 135.7681,
    date: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days ago
  },
  {
    id: 'paris-1',
    title: 'Seine River Cruise',
    body: 'Watched the sunset behind the Eiffel Tower from the deck of a boat on the Seine. The Eiffel Tower began its sparkling light show just as the stars started appearing in the night sky.',
    photos: [
      'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1499856871958-5b9647a64db0?q=80&w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1509067186863-8e4ad9e289bf?q=80&w=500&auto=format&fit=crop'
    ],
    locationName: 'Paris, France',
    lat: 48.8566,
    lng: 2.3522,
    date: Date.now() - 15 * 24 * 60 * 60 * 1000, // 15 days ago
  },
  {
    id: 'nyc-1',
    title: 'Manhattan Skyline View',
    body: 'Looked out over the city from DUMBO in Brooklyn. The Brooklyn Bridge framed the skyscrapers of Lower Manhattan perfectly as the evening lights flickered on.',
    photos: [
      'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?q=80&w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1485738422979-f5c462d49f74?q=80&w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1518391846015-55a9cc003b25?q=80&w=500&auto=format&fit=crop'
    ],
    locationName: 'New York, USA',
    lat: 40.7128,
    lng: -74.0060,
    date: Date.now() - 5 * 24 * 60 * 60 * 1000, // 5 days ago
  }
];

function App() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  
  const { user, profile, logout } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSocialOpen, setIsSocialOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showOnlyMine, setShowOnlyMine] = useState(false);

  const globeRef = useRef<any>(null);

  // Fetch entries from Firestore
  useEffect(() => {
    const loadPins = async () => {
      try {
        const cloudPins = await fetchPins(user?.uid, showOnlyMine);
        // If not logged in and no pins, fall back to initial stunning entries just for demo
        if (!user && cloudPins.length === 0) {
          setEntries(INITIAL_ENTRIES);
        } else {
          setEntries(cloudPins);
        }
      } catch (err) {
        console.error('Failed to load pins from cloud:', err);
      }
    };
    loadPins();
  }, [user?.uid, showOnlyMine]);

  const handleSaveEntry = async (newEntryData: Omit<JournalEntry, 'id' | 'date'> & { id?: string; date?: number }) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    const entryDataWithAuthor = {
      ...newEntryData,
      authorId: user.uid,
    };

    let savedEntry: JournalEntry;

    if (entryDataWithAuthor.id) {
      // Editing existing entry
      savedEntry = {
        ...entryDataWithAuthor,
        id: entryDataWithAuthor.id,
        date: entryDataWithAuthor.date || Date.now(),
      } as JournalEntry;
    } else {
      // Creating new entry
      savedEntry = {
        ...entryDataWithAuthor,
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
        date: Date.now(),
      } as JournalEntry;
    }

    try {
      await savePin(savedEntry);
      
      // Update local UI state
      setEntries((prev) => {
        const exists = prev.find((e) => e.id === savedEntry.id);
        if (exists) {
          return prev.map((e) => (e.id === savedEntry.id ? savedEntry : e));
        }
        return [savedEntry, ...prev];
      });
      setSelectedEntry(savedEntry);
    } catch (err) {
      console.error('Failed to save pin to cloud:', err);
      alert('Failed to save to cloud.');
    }
  };

  const handleCloseCreatePanel = () => {
    setIsCreateOpen(false);
    setEditingEntry(null);
  };

  const handleUpdateAvatar = async (url: string) => {
    if (!user || !profile) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { photoURL: url });
      // The profile state will automatically update via the snapshot listener in AuthContext
    } catch (err) {
      console.error('Failed to update avatar', err);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (!user) return;
    try {
      await deletePinFirestore(id);
      setEntries((prev) => prev.filter((entry) => entry.id !== id));
      if (selectedEntry?.id === id) {
        setSelectedEntry(null);
      }
    } catch (err) {
      console.error('Failed to delete from cloud:', err);
    }
  };

  return (
    <div className="relative w-full h-full" style={{ backgroundColor: '#030308', overflow: 'hidden' }}>
      
      {/* 1. Header Navigation Bar */}
      <header
        className="glass-panel"
        style={{
          position: 'absolute',
          top: '24px',
          left: '24px',
          right: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 24px',
          zIndex: 10,
          borderRadius: '100px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center' }}>
            <Compass size={24} style={{ animation: 'spin 15s linear infinite' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span
              style={{
                fontFamily: 'Outfit, sans-serif',
                fontWeight: 800,
                fontSize: '1.2rem',
                letterSpacing: '0.05em',
                background: 'linear-gradient(to right, #ffffff, var(--accent-cyan))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              GeoJournal
            </span>
            <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              3D Memory Atlas
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {user && (
            <div className="flex items-center gap-2 bg-white/5 p-1 rounded-lg border border-white/10 animate-in fade-in slide-in-from-right-4 duration-500">
              <button 
                onClick={() => setIsSocialOpen(true)}
                className="text-xs px-3 py-1.5 rounded-md font-medium transition-colors text-white/50 hover:text-white flex items-center gap-1"
                title="Social Network"
              >
                <Users size={14} /> Social
              </button>
              <div className="w-px h-4 bg-white/10 mx-1"></div>
              <button 
                onClick={() => setShowOnlyMine(false)}
                className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${!showOnlyMine ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white'}`}
              >
                Feed
              </button>
              <button 
                onClick={() => setShowOnlyMine(true)}
                className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${showOnlyMine ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white'}`}
              >
                My Pins
              </button>
            </div>
          )}

          {/* Auth Section */}
          <div className="flex items-center gap-3 ml-4 pl-4 border-l border-white/10">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end">
                  <span className="text-sm font-medium text-white">{profile?.displayName || 'Explorer'}</span>
                  <span className="text-xs text-white/50">@{profile?.username}</span>
                </div>
                {profile?.photoURL ? (
                  <img onClick={() => setIsProfileOpen(true)} src={profile.photoURL} alt="Profile" className="w-8 h-8 rounded-full border border-white/20 cursor-pointer hover:border-white transition-colors" />
                ) : (
                  <div onClick={() => setIsProfileOpen(true)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/20 cursor-pointer hover:border-white transition-colors">
                    <UserIcon size={16} className="text-white/70" />
                  </div>
                )}
                <button onClick={logout} className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all" title="Logout">
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setIsAuthModalOpen(true)}
                className="glass-btn text-sm py-1.5 px-4 font-medium bg-white/5 hover:bg-white/10"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 2. Main 3D Globe Canvas view */}
      <main className="w-full h-full">
        <GlobeView
          entries={entries}
          selectedEntry={selectedEntry}
          onSelectEntry={setSelectedEntry}
          globeRef={globeRef}
        />
      </main>

      {!user && (
        <LandingPage onGetStarted={() => setIsAuthModalOpen(true)} />
      )}

      {user && (
        <>
          {/* 3. Left drawer entries list sidebar */}
          <Sidebar
        entries={entries}
        selectedEntry={selectedEntry}
        onSelectEntry={setSelectedEntry}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* 4. selected memory popup details card */}
      <EntryCard
        entry={selectedEntry}
        onClose={() => setSelectedEntry(null)}
        onDelete={handleDeleteEntry}
        onEdit={() => {
          if (selectedEntry) {
            setEditingEntry(selectedEntry);
            setIsCreateOpen(true);
          }
        }}
      />

      {/* 5. Floating action "+" button to trigger capture form */}
      <button
        onClick={() => {
          if (!user) {
            setIsAuthModalOpen(true);
            return;
          }
          setIsCreateOpen(true);
        }}
        className="glass-btn glass-btn-primary"
        style={{
          position: 'absolute',
          bottom: '24px',
          right: '24px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          padding: 0,
          zIndex: 10,
          boxShadow: '0 0 20px rgba(0, 136, 255, 0.4)',
        }}
        aria-label="Add new memory"
      >
        <Plus size={24} />
      </button>

      {/* 6. Form panel modal for creating entry */}
      <CreateEntryPanel
        isOpen={isCreateOpen}
        onClose={handleCloseCreatePanel}
        onSave={handleSaveEntry}
        editingEntry={editingEntry}
      />

      {/* 8. Social Panel */}
      <SocialPanel isOpen={isSocialOpen} onClose={() => setIsSocialOpen(false)} />
        </>
      )}

      {/* 7. Auth Modal */}
      {isAuthModalOpen && <AuthModal onClose={() => setIsAuthModalOpen(false)} />}
      
      {/* 9. Profile Panel */}
      {user && profile && (
        <ProfilePanel 
          isOpen={isProfileOpen} 
          onClose={() => setIsProfileOpen(false)} 
          profile={profile}
          onUpdateAvatar={handleUpdateAvatar}
        />
      )}

    </div>
  );
}

export default App;
