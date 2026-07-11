import { useState, useEffect, useRef } from 'react';
import { Plus, Compass, AlertCircle } from 'lucide-react';
import type { JournalEntry } from './types';
import { GlobeView } from './components/GlobeView';
import { Sidebar } from './components/Sidebar';
import { CreateEntryPanel } from './components/CreateEntryPanel';
import { EntryCard } from './components/EntryCard';

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
  const [quotaWarning, setQuotaWarning] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  
  const globeRef = useRef<any>(null);

  // Load entries on mount
  useEffect(() => {
    const saved = localStorage.getItem('geojournal_entries');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Schema Migration: convert legacy 'photo' string property to the new 'photos' array property
        const migrated = Array.isArray(parsed) 
          ? parsed.map((entry: any) => {
              if (entry.photo && (!entry.photos || entry.photos.length === 0)) {
                const { photo, ...rest } = entry;
                return { ...rest, photos: [photo] };
              }
              if (!entry.photos) {
                return { ...entry, photos: [] };
              }
              
              // Upgrade default entries to include multiple photos if they only have one
              if (entry.id === 'kyoto-1' && entry.photos.length === 1) {
                return { ...entry, photos: INITIAL_ENTRIES[0].photos };
              }
              if (entry.id === 'paris-1' && entry.photos.length === 1) {
                return { ...entry, photos: INITIAL_ENTRIES[1].photos };
              }
              if (entry.id === 'nyc-1' && entry.photos.length === 1) {
                return { ...entry, photos: INITIAL_ENTRIES[2].photos };
              }

              return entry;
            })
          : INITIAL_ENTRIES;
        setEntries(migrated);
      } catch (err) {
        console.error('Failed to parse saved entries:', err);
        setEntries(INITIAL_ENTRIES);
      }
    } else {
      // First time user: save defaults
      setEntries(INITIAL_ENTRIES);
      localStorage.setItem('geojournal_entries', JSON.stringify(INITIAL_ENTRIES));
    }
  }, []);

  // Check LocalStorage footprint when entries update
  useEffect(() => {
    if (entries.length === 0) return;
    try {
      const serialized = JSON.stringify(entries);
      localStorage.setItem('geojournal_entries', serialized);
      
      // LocalStorage max is ~5MB. If serialized string exceeds 4MB, warn the user.
      const sizeInMB = (serialized.length * 2) / 1024 / 1024; // UTF-16 strings use 2 bytes per character
      if (sizeInMB > 4.0) {
        setQuotaWarning(true);
      } else {
        setQuotaWarning(false);
      }
    } catch (err) {
      console.error('Storage full or unavailable:', err);
      alert('Local storage is full. Please delete some memories to save new ones.');
    }
  }, [entries]);

  const handleSaveEntry = (newEntryData: Omit<JournalEntry, 'id' | 'date'> & { id?: string; date?: number }) => {
    if (newEntryData.id) {
      // Editing existing entry
      const updatedEntry: JournalEntry = {
        ...newEntryData,
        id: newEntryData.id,
        date: newEntryData.date || Date.now(),
      } as JournalEntry;

      setEntries((prev) =>
        prev.map((entry) => (entry.id === newEntryData.id ? updatedEntry : entry))
      );

      // Update selected card details too
      setSelectedEntry(updatedEntry);
    } else {
      // Creating new entry
      const newEntry: JournalEntry = {
        ...newEntryData,
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
        date: Date.now(),
      } as JournalEntry;

      setEntries((prev) => [newEntry, ...prev]);
      setSelectedEntry(newEntry);
    }
  };

  const handleCloseCreatePanel = () => {
    setIsCreateOpen(false);
    setEditingEntry(null);
  };

  const handleDeleteEntry = (id: string) => {
    setEntries((prev) => prev.filter((entry) => entry.id !== id));
    if (selectedEntry?.id === id) {
      setSelectedEntry(null);
    }
  };

  return (
    <div className="relative w-full h-full" style={{ backgroundColor: '#030308', overflow: 'hidden' }}>
      
      {/* 1. Header Navigation Bar */}
      <header
        className="glass-panel"
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          zIndex: 10,
          padding: '12px 24px',
          borderRadius: '14px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
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
      </header>

      {/* LocalStorage Quota warning */}
      {quotaWarning && (
        <div
          className="glass-panel fade-in"
          style={{
            position: 'absolute',
            top: '90px',
            right: '20px',
            zIndex: 10,
            padding: '10px 16px',
            maxWidth: '280px',
            backgroundColor: 'rgba(245, 158, 11, 0.15)',
            borderColor: 'rgba(245, 158, 11, 0.3)',
            display: 'flex',
            gap: '8px',
            fontSize: '0.78rem',
            color: '#fde047',
          }}
        >
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          <span>Storage quota almost full. Consider deleting older memories to preserve space.</span>
        </div>
      )}

      {/* 2. Main 3D Globe Canvas view */}
      <main className="w-full h-full">
        <GlobeView
          entries={entries}
          selectedEntry={selectedEntry}
          onSelectEntry={setSelectedEntry}
          globeRef={globeRef}
        />
      </main>

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
        onClick={() => setIsCreateOpen(true)}
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
    </div>
  );
}

export default App;
