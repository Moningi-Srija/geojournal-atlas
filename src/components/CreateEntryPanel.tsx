import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Navigation,
  Image as ImageIcon,
  Loader2,
  Save,
  Mic,
  Search,
  UserPlus,
  Users,
  Lock,
  Globe2,
  Check,
  Clock,
} from 'lucide-react';
import type {
  JournalEntry,
  EntryCategory,
  MemoryCollaborator,
  UserProfile,
} from '../types';
import { parseGoogleMapsUrl } from '../utils/mapParser';
import { searchUsers } from '../utils/firestore';
import { useAuth } from './AuthContext';

interface CreateEntryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: Omit<JournalEntry, 'id' | 'date'> & { id?: string; date?: number }) => Promise<void>;
  editingEntry?: JournalEntry | null;
}

const MAX_PHOTOS = 3;
const MAX_SOURCE_PHOTO_BYTES = 15 * 1024 * 1024;
const MAX_INLINE_PHOTO_CHARS = 700_000;
const MAX_INLINE_PHOTO_CHARS_EACH = 220_000;

const compressPhotoForLegacyStorage = (file: File): Promise<string> => new Promise((resolve, reject) => {
  if (!file.type.startsWith('image/')) {
    reject(new Error(`${file.name} is not a supported image.`));
    return;
  }
  if (file.size > MAX_SOURCE_PHOTO_BYTES) {
    reject(new Error(`${file.name} is larger than 15 MB.`));
    return;
  }

  const reader = new FileReader();
  reader.onerror = () => reject(new Error(`Could not read ${file.name}.`));
  reader.onload = () => {
    const image = new Image();
    image.onerror = () => reject(new Error(`Could not open ${file.name}.`));
    image.onload = () => {
      const maximumDimension = 500;
      const scale = Math.min(1, maximumDimension / Math.max(image.width, image.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext('2d');
      if (!context) {
        reject(new Error('This browser could not prepare the photo.'));
        return;
      }

      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.68);
      if (dataUrl.length > MAX_INLINE_PHOTO_CHARS_EACH) {
        reject(new Error(`${file.name} is still too detailed after compression. Try a smaller photo.`));
        return;
      }
      resolve(dataUrl);
    };
    image.src = reader.result as string;
  };
  reader.readAsDataURL(file);
});

export const CreateEntryPanel: React.FC<CreateEntryPanelProps> = ({
  isOpen,
  onClose,
  onSave,
  editingEntry = null,
}) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [locationName, setLocationName] = useState('');
  const [lat, setLat] = useState<number | ''>('');
  const [lng, setLng] = useState<number | ''>('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [googlePhotosUrl, setGooglePhotosUrl] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('private');
  const [category, setCategory] = useState<EntryCategory>('general');
  const [country, setCountry] = useState('');
  const [isDetecting, setIsDetecting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [mapsUrl, setMapsUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const [collaborators, setCollaborators] = useState<MemoryCollaborator[]>([]);
  const [collaboratorQuery, setCollaboratorQuery] = useState('');
  const [collaboratorResults, setCollaboratorResults] = useState<UserProfile[]>([]);
  const [isSearchingCollaborators, setIsSearchingCollaborators] = useState(false);
  const [collaboratorError, setCollaboratorError] = useState('');
  const recognitionRef = useRef<any>(null);

  // Initialize Web Speech API for voice dictation
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSpeechSupported(true);
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setBody((prev) => prev + (prev.endsWith(' ') || prev === '' ? '' : ' ') + finalTranscript);
        }
      };

      rec.onerror = (e: any) => {
        console.error('Speech recognition error:', e);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, []);

  // Handle open/close state using native Dialog APIs and populate on edit
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
        
        // Populate if editing, otherwise reset
        if (editingEntry) {
          setTitle(editingEntry.title);
          setBody(editingEntry.body);
          setLocationName(editingEntry.locationName);
          setLat(editingEntry.lat);
          setLng(editingEntry.lng);
          setPhotos([...(editingEntry.photos || [])]);
          setGooglePhotosUrl(editingEntry.googlePhotosUrl || '');
          setVisibility(editingEntry.visibility === 'public' ? 'public' : 'private');
          setCategory(editingEntry.category || 'general');
          setCountry(editingEntry.country || '');
          setCollaborators([...(editingEntry.collaborators || [])]);
        } else {
          setTitle('');
          setBody('');
          setLocationName('');
          setLat('');
          setLng('');
          setPhotos([]);
          setGooglePhotosUrl('');
          setVisibility('private');
          setCategory('general');
          setCountry('');
          setCollaborators([]);
        }
        setCollaboratorQuery('');
        setCollaboratorResults([]);
        setCollaboratorError('');
        setError('');
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen, editingEntry]);

  // Temporary V1 compatibility path. New media will move to Firebase Storage;
  // until billing is enabled, keep inline Firestore images below the 1 MiB limit.
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setError('');
    if (photos.length + files.length > MAX_PHOTOS) {
      setError(`You can add up to ${MAX_PHOTOS} photos to a memory in this release.`);
      e.target.value = '';
      return;
    }

    try {
      const compressedPhotos = await Promise.all(Array.from(files).map(compressPhotoForLegacyStorage));
      const nextPhotos = [...photos, ...compressedPhotos];
      const inlineCharacterCount = nextPhotos
        .filter((photo) => photo.startsWith('data:'))
        .reduce((total, photo) => total + photo.length, 0);
      if (inlineCharacterCount > MAX_INLINE_PHOTO_CHARS) {
        setError('These photos are too large together. Remove one or choose smaller files.');
        return;
      }
      setPhotos(nextPhotos);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not prepare these photos.');
    } finally {
      e.target.value = '';
    }
  };

  const handleDeletePhoto = (indexToDelete: number) => {
    setPhotos((prev) => prev.filter((_, idx) => idx !== indexToDelete));
  };

  // Browser Geolocation auto-detection + Nominatim reverse geocoding
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setIsDetecting(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLat(Number(latitude.toFixed(6)));
        setLng(Number(longitude.toFixed(6)));
        setIsDetecting(false);

        try {
          // Attempt reverse geocoding to retrieve city, country
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await response.json();
          if (data && data.address) {
            const addr = data.address;
            const city = addr.city || addr.town || addr.village || addr.suburb || '';
            const state = addr.state || '';
            const countryName = addr.country || '';
            
            const displayParts = [];
            if (city) displayParts.push(city);
            else if (state) displayParts.push(state);
            if (countryName) displayParts.push(countryName);

            setLocationName(displayParts.join(', ') || data.name || 'Unknown Location');
            setCountry(countryName);
          }
        } catch (geocodeErr) {
          console.warn('Reverse geocoding failed, falling back to empty location name:', geocodeErr);
        }
      },
      (geoErr) => {
        setIsDetecting(false);
        switch (geoErr.code) {
          case geoErr.PERMISSION_DENIED:
            setError('Location permission denied. Please enter coordinates manually.');
            break;
          case geoErr.POSITION_UNAVAILABLE:
            setError('Location details unavailable. Please enter coordinates manually.');
            break;
          case geoErr.TIMEOUT:
            setError('Location request timed out. Please try again or enter manually.');
            break;
          default:
            setError('Unable to detect location. Please enter coordinates manually.');
        }
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  const handleImportMapsUrl = async () => {
    if (!mapsUrl.trim()) return;
    setIsImporting(true);
    setError('');
    try {
      const data = await parseGoogleMapsUrl(mapsUrl);
      if (data.locationName) {
        setLocationName(data.locationName);
      }
      if (data.lat !== null && data.lng !== null) {
        setLat(Number(data.lat.toFixed(6)));
        setLng(Number(data.lng.toFixed(6)));
        setError('');
      } else {
        setError('Location name imported! Note: Google blocks bot unshortening (maps.app.goo.gl) in production. To auto-import coordinates, copy the long expanded URL from your browser address bar instead, or enter coordinates manually.');
      }
      setMapsUrl('');
    } catch (err: any) {
      setError(err.message || 'Failed to parse Google Maps URL. Please check the URL format.');
    } finally {
      setIsImporting(false);
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setError('Voice dictation is not supported by your browser (please try Google Chrome or Safari).');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        setError('');
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err: any) {
        console.error('Speech recognition start failed:', err);
        setError('Microphone access denied or error starting voice dictation.');
      }
    }
  };

  const handleCollaboratorSearch = async () => {
    const query = collaboratorQuery.trim();
    if (!query) {
      setCollaboratorResults([]);
      setCollaboratorError('');
      return;
    }

    setIsSearchingCollaborators(true);
    setCollaboratorError('');
    try {
      const results = await searchUsers(query);
      const selectedIds = new Set(collaborators.map((collaborator) => collaborator.uid));
      setCollaboratorResults(
        results.filter((profile) => profile.uid !== user?.uid && !selectedIds.has(profile.uid)),
      );
    } catch (searchError) {
      console.error('Could not search co-travelers:', searchError);
      setCollaboratorError(
        searchError instanceof Error
          ? searchError.message
          : 'Co-traveler search is unavailable right now.',
      );
    } finally {
      setIsSearchingCollaborators(false);
    }
  };

  const handleAddCollaborator = (profile: UserProfile) => {
    const collaborator: MemoryCollaborator = {
      uid: profile.uid,
      username: profile.username,
      displayName: profile.displayName || profile.username,
      ...(profile.photoURL ? { photoURL: profile.photoURL } : {}),
      status: 'pending',
      invitedAt: Date.now(),
    };
    setCollaborators((current) => [...current, collaborator]);
    setCollaboratorResults((current) => current.filter((result) => result.uid !== profile.uid));
    setCollaboratorQuery('');
  };

  const handleRemoveCollaborator = (uid: string) => {
    setCollaborators((current) => current.filter((collaborator) => collaborator.uid !== uid));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return setError('Please enter a title.');
    if (!body.trim()) return setError('Please write something in your journal.');
    if (!locationName.trim()) return setError('Please enter a location name.');
    if (lat === '' || isNaN(Number(lat)) || lat < -90 || lat > 90) {
      return setError('Please enter a valid latitude (-90 to 90).');
    }
    if (lng === '' || isNaN(Number(lng)) || lng < -180 || lng > 180) {
      return setError('Please enter a valid longitude (-180 to 180).');
    }
    const inlinePhotoCharacters = photos
      .filter((photo) => photo.startsWith('data:'))
      .reduce((total, photo) => total + photo.length, 0);
    if (photos.length > MAX_PHOTOS || inlinePhotoCharacters > MAX_INLINE_PHOTO_CHARS) {
      return setError(`Keep this memory to ${MAX_PHOTOS} compressed photos. Larger media support is coming after Storage setup.`);
    }

    setIsSubmitting(true);
    setError('');

    try {
      let detectedCountry = country;
      if (!detectedCountry) {
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`);
          const data = await response.json();
          if (data && data.address && data.address.country) {
            detectedCountry = data.address.country;
          }
        } catch {
          console.warn('Silent reverse geocode failed on submit');
        }
      }

      const trimmedGooglePhotosUrl = googlePhotosUrl.trim();
      const entryData: Omit<JournalEntry, 'id' | 'date'> & { id?: string; date?: number } = {
        ...(editingEntry ? { id: editingEntry.id, date: editingEntry.date } : {}),
        title: title.trim(),
        body: body.trim(),
        locationName: locationName.trim(),
        lat: Number(lat),
        lng: Number(lng),
        photos,
        ...(trimmedGooglePhotosUrl
          ? { googlePhotosUrl: trimmedGooglePhotosUrl }
          : editingEntry?.googlePhotosUrl
            ? { googlePhotosUrl: '' }
            : {}),
        visibility,
        category,
        ...(detectedCountry ? { country: detectedCountry } : {}),
        collaborators,
      };

      await onSave(entryData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save this memory. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) {
      const rect = dialogRef.current.getBoundingClientRect();
      const isInside =
        rect.top <= e.clientY &&
        e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX &&
        e.clientX <= rect.left + rect.width;
      if (!isInside) {
        onClose();
      }
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      onClose={onClose}
      className="glass-panel"
      style={{
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '24px',
        color: '#fff',
        overflowY: 'auto',
      }}
    >
      <div className="flex items-center justify-between w-full mb-6">
        <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '1.4rem' }}>
          {editingEntry ? 'Edit Memory' : 'Capture New Memory'}
        </h2>
        <button
          onClick={onClose}
          className="glass-btn"
          style={{ padding: '8px', borderRadius: '50%' }}
          aria-label="Close dialog"
        >
          <X size={18} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div
            className="fade-in"
            style={{
              padding: '10px 14px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              color: '#fca5a5',
              fontSize: '0.88rem',
            }}
          >
            {error}
          </div>
        )}

        {/* Photos (temporary inline-storage guard; Firebase Storage migration is planned) */}
        <div className="flex flex-col gap-2">
          <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
            Journal Photos (Optional, Max {MAX_PHOTOS})
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
            {photos.map((url, idx) => (
              <div
                key={idx}
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  position: 'relative',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                }}
              >
                <img src={url} alt={`Upload preview ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button
                  type="button"
                  onClick={() => handleDeletePhoto(idx)}
                  className="glass-btn"
                  style={{
                    position: 'absolute',
                    top: '2px',
                    right: '2px',
                    padding: '2px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(239, 68, 68, 0.8)',
                    borderColor: 'transparent',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2,
                  }}
                  aria-label={`Remove photo ${idx + 1}`}
                >
                  <X size={10} />
                </button>
              </div>
            ))}

            {photos.length < MAX_PHOTOS && (
              <label
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '8px',
                  border: '2px dashed rgba(255, 255, 255, 0.15)',
                  background: 'rgba(255, 255, 255, 0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  transition: 'all 0.2s ease',
                }}
                className="glass-panel-interactive"
              >
                <ImageIcon size={20} style={{ color: 'var(--accent-cyan)' }} />
                <span style={{ fontSize: '0.65rem', marginTop: '4px', textAlign: 'center' }}>
                  + Photo
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  style={{ display: 'none' }}
                />
              </label>
            )}
          </div>
        </div>

        {/* Google Photos Album Link */}
        <div className="flex flex-col gap-1">
          <label htmlFor="googlePhotosUrl" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Google Photos Album Link (Optional)
          </label>
          <input
            id="googlePhotosUrl"
            type="url"
            className="glass-input"
            placeholder="https://photos.app.goo.gl/..."
            value={googlePhotosUrl}
            onChange={(e) => setGooglePhotosUrl(e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        {/* Title */}
        <div className="flex flex-col gap-1">
          <label htmlFor="title" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Title
          </label>
          <input
            id="title"
            type="text"
            className="glass-input"
            placeholder="e.g. Sunrise over Mount Fuji"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isSubmitting}
            required
          />
        </div>

        {/* Location Name */}
        <div className="flex flex-col gap-1">
          <label htmlFor="location" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Location Name
          </label>
          <input
            id="location"
            type="text"
            className="glass-input"
            placeholder="e.g. Mount Fuji, Japan"
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            disabled={isSubmitting}
            required
          />
        </div>

        {/* Coordinates & Google Maps Link Import */}
        <div className="flex flex-col gap-3" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '12px' }}>
          <div className="flex items-center justify-between">
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              Location Details & Coordinates
            </label>
            <button
              type="button"
              onClick={handleDetectLocation}
              disabled={isDetecting || isSubmitting || isImporting}
              className="glass-btn"
              style={{
                padding: '4px 10px',
                fontSize: '0.8rem',
                gap: '4px',
                borderColor: 'var(--accent-blue)',
                color: 'var(--accent-cyan)',
              }}
            >
              {isDetecting ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  Locating...
                </>
              ) : (
                <>
                  <Navigation size={12} />
                  GPS Detect
                </>
              )}
            </button>
          </div>

          {/* Link import section */}
          <div className="flex flex-col gap-1">
            <div className="flex gap-2">
              <input
                type="url"
                className="glass-input"
                style={{ flex: 1, padding: '8px 12px', fontSize: '0.82rem' }}
                placeholder="Paste Google Maps URL (long or maps.app.goo.gl/...)"
                value={mapsUrl}
                onChange={(e) => setMapsUrl(e.target.value)}
                disabled={isSubmitting || isImporting}
              />
              <button
                type="button"
                onClick={handleImportMapsUrl}
                disabled={!mapsUrl.trim() || isSubmitting || isImporting}
                className="glass-btn"
                style={{
                  padding: '8px 12px',
                  fontSize: '0.82rem',
                  borderColor: 'var(--accent-cyan)',
                  backgroundColor: 'rgba(0, 240, 255, 0.05)',
                  minWidth: '70px',
                }}
              >
                {isImporting ? <Loader2 size={14} className="animate-spin" /> : 'Import'}
              </button>
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Pasting a Google Maps link will automatically import location name and coordinates
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="flex flex-col gap-1">
              <input
                type="number"
                step="any"
                className="glass-input"
                placeholder="Latitude (-90 to 90)"
                value={lat}
                onChange={(e) => setLat(e.target.value !== '' ? Number(e.target.value) : '')}
                disabled={isSubmitting}
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <input
                type="number"
                step="any"
                className="glass-input"
                placeholder="Longitude (-180 to 180)"
                value={lng}
                onChange={(e) => setLng(e.target.value !== '' ? Number(e.target.value) : '')}
                disabled={isSubmitting}
                required
              />
            </div>
          </div>
        </div>

        {/* Visibility is a deliberate audience choice, not a buried setting. */}
        <fieldset className="collab-visibility-fieldset" disabled={isSubmitting}>
          <legend>Who can see this memory?</legend>
          <div className="collab-visibility-grid">
            <label className={`collab-visibility-card collab-private ${visibility === 'private' ? 'collab-selected' : ''}`}>
              <input
                className="collab-visibility-radio"
                type="radio"
                name="memory-visibility"
                value="private"
                checked={visibility === 'private'}
                onChange={() => setVisibility('private')}
              />
              <Lock size={18} aria-hidden="true" />
              <span><strong>Private</strong><small>Only you and accepted co-travelers</small></span>
            </label>
            <label className={`collab-visibility-card collab-public ${visibility === 'public' ? 'collab-selected' : ''}`}>
              <input
                className="collab-visibility-radio"
                type="radio"
                name="memory-visibility"
                value="public"
                checked={visibility === 'public'}
                onChange={() => setVisibility('public')}
              />
              <Globe2 size={18} aria-hidden="true" />
              <span><strong>Public</strong><small>Visible in the explorer community</small></span>
            </label>
          </div>
        </fieldset>

        {/* Co-travelers */}
        <section className="collab-picker" aria-labelledby="collab-picker-title">
          <div className="collab-picker-heading">
            <span className="collab-picker-icon"><Users size={17} aria-hidden="true" /></span>
            <span>
              <strong id="collab-picker-title">Add co-travelers</strong>
              <small>They can show this same memory on their Atlas after accepting.</small>
            </span>
          </div>

          <div className="collab-search-row">
            <div className="collab-search-input-wrap">
              <Search size={15} aria-hidden="true" />
              <input
                type="search"
                className="glass-input"
                value={collaboratorQuery}
                onChange={(event) => setCollaboratorQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    void handleCollaboratorSearch();
                  }
                }}
                placeholder="Search by username"
                aria-label="Search users to add as co-travelers"
                disabled={isSubmitting || isSearchingCollaborators}
              />
            </div>
            <button
              type="button"
              className="glass-btn collab-search-button"
              onClick={() => void handleCollaboratorSearch()}
              disabled={isSubmitting || isSearchingCollaborators || !collaboratorQuery.trim()}
              aria-label="Search for co-travelers"
            >
              {isSearchingCollaborators ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
              <span>Search</span>
            </button>
          </div>

          {collaboratorError && <p className="collab-inline-error" role="alert">{collaboratorError}</p>}

          {collaboratorResults.length > 0 && (
            <div className="collab-search-results" aria-label="Co-traveler search results">
              {collaboratorResults.map((result) => (
                <div className="collab-user-row" key={result.uid}>
                  {result.photoURL ? (
                    <img src={result.photoURL} alt="" />
                  ) : (
                    <span className="collab-avatar-fallback" aria-hidden="true">
                      {(result.displayName || result.username || '?').charAt(0).toUpperCase()}
                    </span>
                  )}
                  <span className="collab-user-copy">
                    <strong>{result.displayName || result.username}</strong>
                    <small>@{result.username}</small>
                  </span>
                  <button
                    type="button"
                    className="glass-btn collab-add-button"
                    onClick={() => handleAddCollaborator(result)}
                    aria-label={`Add ${result.displayName || result.username} as a co-traveler`}
                  >
                    <UserPlus size={14} /> Add
                  </button>
                </div>
              ))}
            </div>
          )}

          {collaboratorQuery.trim() && !isSearchingCollaborators && collaboratorResults.length === 0 && !collaboratorError && (
            <p className="collab-search-hint">Press Search to find an existing GeoJournal username.</p>
          )}

          {collaborators.length > 0 && (
            <div className="collab-selected-list" aria-label="Selected co-travelers">
              {collaborators.map((collaborator) => (
                <div className="collab-selected-user" key={collaborator.uid}>
                  <span className="collab-status-icon" aria-hidden="true">
                    {collaborator.status === 'accepted' ? <Check size={13} /> : <Clock size={13} />}
                  </span>
                  <span>
                    <strong>{collaborator.displayName || collaborator.username}</strong>
                    <small>
                      @{collaborator.username} · {collaborator.status === 'accepted' ? 'Accepted' : collaborator.status === 'declined' ? 'Declined' : 'Pending acceptance'}
                    </small>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCollaborator(collaborator.uid)}
                    aria-label={`Remove ${collaborator.displayName || collaborator.username} from this memory`}
                    disabled={isSubmitting}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Settings Grid */}
        <div>
          {/* The card selector above owns visibility; keep the legacy control out of the layout. */}
          <div className="collab-legacy-visibility" aria-hidden="true">
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              Visibility
            </label>
            <select 
              value={visibility} 
              onChange={(e) => setVisibility(e.target.value as any)}
              className="glass-input" 
              style={{ padding: '10px 12px', appearance: 'none', backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23FFFFFF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right .7rem top 50%', backgroundSize: '.65rem auto' }}
            >
              <option value="private" style={{ color: '#000' }}>🔒 Private</option>
              <option value="public" style={{ color: '#000' }}>🌍 Public</option>
            </select>
          </div>

          {/* Category */}
          <div className="flex flex-col gap-1">
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              Category
            </label>
            <select 
              value={category} 
              onChange={(e) => setCategory(e.target.value as EntryCategory)}
              className="glass-input" 
              style={{ padding: '10px 12px', appearance: 'none', backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23FFFFFF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right .7rem top 50%', backgroundSize: '.65rem auto' }}
            >
              <option value="general" style={{ color: '#000' }}>📌 General</option>
              <option value="trek" style={{ color: '#000' }}>⛰️ Trek</option>
              <option value="beach" style={{ color: '#000' }}>🌴 Beach</option>
              <option value="city" style={{ color: '#000' }}>🏙️ City</option>
              <option value="nature" style={{ color: '#000' }}>🏕️ Nature</option>
              <option value="food" style={{ color: '#000' }}>🍽️ Food</option>
            </select>
          </div>
        </div>

        {/* Journal text */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label htmlFor="body" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              Journal Entry
            </label>
            {isSpeechSupported ? (
              <button
                type="button"
                onClick={toggleListening}
                className="glass-btn"
                style={{
                  padding: '4px 10px',
                  fontSize: '0.8rem',
                  gap: '4px',
                  borderColor: isListening ? '#ef4444' : 'var(--glass-border)',
                  color: isListening ? '#f87171' : 'var(--text-secondary)',
                  boxShadow: isListening ? '0 0 10px rgba(239, 68, 68, 0.4)' : 'none',
                }}
              >
                {isListening ? (
                  <>
                    <span style={{
                      display: 'inline-block',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: '#ef4444',
                      marginRight: '2px',
                      boxShadow: '0 0 8px #ef4444'
                    }}></span>
                    Listening (Click to Stop)
                  </>
                ) : (
                  <>
                    <Mic size={12} />
                    Voice Dictate
                  </>
                )}
              </button>
            ) : (
              <span
                style={{
                  fontSize: '0.72rem',
                  color: 'var(--text-muted)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  opacity: 0.65
                }}
                title="Use Google Chrome, Safari, or Microsoft Edge for voice dictation"
              >
                <Mic size={10} />
                Dictate (Chrome/Safari only)
              </span>
            )}
          </div>
          <textarea
            id="body"
            className="glass-input"
            rows={4}
            placeholder="Write your memory details here..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            disabled={isSubmitting}
            style={{ resize: 'vertical', minHeight: '80px' }}
            required
          />
        </div>

        {/* Save Button */}
        <button
          type="submit"
          className="glass-btn glass-btn-primary"
          style={{ width: '100%', marginTop: '8px', padding: '12px' }}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              {editingEntry ? 'Saving Changes...' : 'Saving Memory...'}
            </>
          ) : (
            <>
              <Save size={16} />
              {editingEntry ? 'Save Changes' : 'Save Memory'}
            </>
          )}
        </button>
      </form>
    </dialog>
  );
};
