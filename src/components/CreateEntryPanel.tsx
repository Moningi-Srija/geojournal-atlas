import React, { useState, useRef, useEffect } from 'react';
import { X, Navigation, Image as ImageIcon, Loader2, Save, Mic } from 'lucide-react';
import type { JournalEntry } from '../types';
import { parseGoogleMapsUrl } from '../utils/mapParser';

interface CreateEntryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: Omit<JournalEntry, 'id' | 'date'> & { id?: string; date?: number }) => void;
  editingEntry?: JournalEntry | null;
}

export const CreateEntryPanel: React.FC<CreateEntryPanelProps> = ({
  isOpen,
  onClose,
  onSave,
  editingEntry = null,
}) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [locationName, setLocationName] = useState('');
  const [lat, setLat] = useState<number | ''>('');
  const [lng, setLng] = useState<number | ''>('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [googlePhotosUrl, setGooglePhotosUrl] = useState('');
  const [isDetecting, setIsDetecting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [mapsUrl, setMapsUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
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
        } catch (e) {}
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
        } else {
          setTitle('');
          setBody('');
          setLocationName('');
          setLat('');
          setLng('');
          setPhotos([]);
          setGooglePhotosUrl('');
        }
        setError('');
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen, editingEntry]);

  // Image compression and Canvas conversion
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setError('');
    if (photos.length + files.length > 5) {
      setError('You can upload a maximum of 5 photos per entry.');
      return;
    }

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 500;
          const MAX_HEIGHT = 500;
          let width = img.width;
          let height = img.height;

          // Resize proportional bounds
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            setPhotos((prev) => [...prev, event.target?.result as string]);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          // Compress quality to 0.70 to save footprint in localStorage
          const dataUrl = canvas.toDataURL('image/jpeg', 0.70);
          setPhotos((prev) => [...prev, dataUrl]);
        };
        img.onerror = () => {
          setError('Error loading image. Please try another file.');
        };
      };
      reader.onerror = () => {
        setError('Error reading file.');
      };
    });
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
            const country = addr.country || '';
            
            const displayParts = [];
            if (city) displayParts.push(city);
            else if (state) displayParts.push(state);
            if (country) displayParts.push(country);

            setLocationName(displayParts.join(', ') || data.name || 'Unknown Location');
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

  const handleSubmit = (e: React.FormEvent) => {
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

    setIsSubmitting(true);
    
    // Slight artificial timeout to feel premium and showcase saving animation
    setTimeout(() => {
      onSave({
        title: title.trim(),
        body: body.trim(),
        locationName: locationName.trim(),
        lat: Number(lat),
        lng: Number(lng),
        photos,
        googlePhotosUrl: googlePhotosUrl.trim() || undefined,
      });
      setIsSubmitting(false);
      onClose();
    }, 600);
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

        {/* Photos (Optional, Max 5) */}
        <div className="flex flex-col gap-2">
          <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
            Journal Photos (Optional, Max 5)
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

            {photos.length < 5 && (
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
