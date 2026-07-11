import React from 'react';
import { X, Trash2, Calendar, MapPin, ExternalLink, Edit2, Image as ImageIcon } from 'lucide-react';
import type { JournalEntry } from '../types';

interface EntryCardProps {
  entry: JournalEntry | null;
  onClose: () => void;
  onDelete: (id: string) => void;
  onEdit: () => void;
}

export const EntryCard: React.FC<EntryCardProps> = ({
  entry,
  onClose,
  onDelete,
  onEdit,
}) => {
  if (!entry) return null;

  // Format date nicely
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this memory? This action cannot be undone.')) {
      onDelete(entry.id);
    }
  };

  return (
    <div
      className="glass-panel fade-in"
      style={{
        position: 'absolute',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - 48px)',
        maxWidth: '450px',
        zIndex: 10,
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header Photo Carousel / Placeholder */}
      <div style={{ position: 'relative', width: '100%', height: '190px', backgroundColor: 'var(--space-deep)' }}>
        {entry.photos && entry.photos.length > 0 ? (
          <div
            style={{
              display: 'flex',
              overflowX: 'auto',
              width: '100%',
              height: '100%',
              scrollSnapType: 'x mandatory',
              scrollbarWidth: 'none', // Firefox hide scrollbar
            }}
            className="photos-carousel"
          >
            {entry.photos.map((photoUrl, idx) => (
              <div
                key={idx}
                style={{
                  minWidth: '100%',
                  height: '100%',
                  scrollSnapAlign: 'start',
                  position: 'relative',
                }}
              >
                <img
                  src={photoUrl}
                  alt={`${entry.title} - Photo ${idx + 1}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                
                {/* Image counter indicator */}
                {entry.photos.length > 1 && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '12px',
                      right: '12px',
                      background: 'rgba(7, 9, 19, 0.8)',
                      backdropFilter: 'blur(4px)',
                      padding: '3px 9px',
                      borderRadius: '10px',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      color: 'var(--accent-cyan)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    {idx + 1} / {entry.photos.length}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* Empty placeholder styling */
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'radial-gradient(circle, rgba(16, 24, 48, 0.6) 0%, rgba(7, 9, 19, 0.9) 100%)',
              color: 'var(--text-muted)',
              gap: '8px',
            }}
          >
            <ImageIcon size={28} style={{ opacity: 0.4 }} />
            <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>No photos uploaded</span>
          </div>
        )}

        {/* Close button overlay */}
        <button
          onClick={onClose}
          className="glass-btn"
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            borderRadius: '50%',
            padding: '6px',
            background: 'rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            zIndex: 5,
          }}
          aria-label="Close details"
        >
          <X size={16} />
        </button>

        {/* Location badge overlay */}
        <div
          style={{
            position: 'absolute',
            bottom: '12px',
            left: '12px',
            background: 'rgba(7, 9, 19, 0.75)',
            backdropFilter: 'blur(8px)',
            borderRadius: '6px',
            padding: '4px 10px',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            zIndex: 5,
          }}
        >
          <MapPin size={12} style={{ color: 'var(--accent-cyan)' }} />
          <span style={{ fontWeight: 500 }}>{entry.locationName}</span>
        </div>
      </div>

      {/* Card Info Content */}
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Date and Coordinates */}
        <div className="flex items-center justify-between" style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
          <div className="flex items-center gap-1">
            <Calendar size={12} />
            <span>{formatDate(entry.date)}</span>
          </div>
          <div style={{ fontFamily: 'monospace', opacity: 0.8 }}>
            {entry.lat.toFixed(4)}°, {entry.lng.toFixed(4)}°
          </div>
        </div>

        {/* Title */}
        <h3
          style={{
            fontFamily: 'Outfit, sans-serif',
            fontSize: '1.25rem',
            fontWeight: 700,
            color: '#fff',
            lineHeight: 1.3,
          }}
        >
          {entry.title}
        </h3>

        {/* Action Links Row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${entry.lat},${entry.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="glass-panel-interactive flex"
            style={{
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              color: 'var(--accent-cyan)',
              textDecoration: 'none',
              background: 'rgba(0, 240, 255, 0.05)',
              border: '1px solid rgba(0, 240, 255, 0.15)',
              fontWeight: 500,
            }}
          >
            <span>Explore on Google Maps</span>
            <ExternalLink size={12} />
          </a>

          {entry.googlePhotosUrl && (
            <a
              href={entry.googlePhotosUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-panel-interactive flex"
              style={{
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                color: 'var(--accent-cyan)',
                textDecoration: 'none',
                background: 'rgba(0, 240, 255, 0.05)',
                border: '1px solid rgba(0, 240, 255, 0.15)',
                fontWeight: 500,
              }}
            >
              <span>Google Photos Album</span>
              <ExternalLink size={12} />
            </a>
          )}
        </div>

        {/* Body Text */}
        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: '0.92rem',
            lineHeight: 1.5,
            whiteSpace: 'pre-wrap',
            maxHeight: '100px',
            overflowY: 'auto',
            paddingRight: '4px',
          }}
        >
          {entry.body}
        </p>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '12px' }}>
          <button
            onClick={onEdit}
            className="glass-btn"
            style={{
              padding: '6px 12px',
              fontSize: '0.8rem',
              color: 'var(--accent-cyan)',
              borderColor: 'rgba(0, 240, 255, 0.2)',
              gap: '4px',
            }}
          >
            <Edit2 size={12} />
            Edit Entry
          </button>
          <button
            onClick={handleDelete}
            className="glass-btn"
            style={{
              padding: '6px 12px',
              fontSize: '0.8rem',
              color: '#ef4444',
              borderColor: 'rgba(239, 68, 68, 0.2)',
              gap: '4px',
            }}
          >
            <Trash2 size={12} />
            Delete Entry
          </button>
        </div>
      </div>
    </div>
  );
};
