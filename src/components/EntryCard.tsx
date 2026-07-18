import React from 'react';
import { X, Trash2, Calendar, MapPin, ExternalLink, Edit2, Image as ImageIcon } from 'lucide-react';
import type { JournalEntry, UserProfile } from '../types';

interface EntryCardProps {
  entry: JournalEntry | null;
  onClose: () => void;
  onDelete: (id: string) => void;
  onEdit: () => void;
  canManage: boolean;
  author?: UserProfile | null;
  isOwn?: boolean;
}

export const EntryCard: React.FC<EntryCardProps> = ({
  entry,
  onClose,
  onDelete,
  onEdit,
  canManage,
  author = null,
  isOwn = false,
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

  const visibilityLabel = entry.visibility
    ? {
        private: 'Private',
        close_friends: 'Close friends',
        public: 'Public',
      }[entry.visibility]
    : null;

  return (
    <div className="glass-panel fade-in memory-detail-card">
      {/* Header Photo Carousel / Placeholder */}
      <div className="memory-detail-media">
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
          <div className="memory-detail-empty">
            <ImageIcon size={28} style={{ opacity: 0.4 }} />
            <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>No photos uploaded</span>
          </div>
        )}

        {/* Close button overlay */}
        <button
          onClick={onClose}
          className="glass-btn memory-detail-close"
          aria-label="Close details"
        >
          <X size={16} />
        </button>

        {/* Location badge overlay */}
        <div className="memory-detail-location">
          <MapPin size={12} />
          <span>{entry.locationName}</span>
        </div>
      </div>

      {/* Card Info Content */}
      <div className="memory-detail-body">
        {/* Date and Coordinates */}
        <div className="memory-detail-meta">
          <div className="memory-detail-meta-primary">
            <span className="memory-detail-date">
              <Calendar size={12} />
              {formatDate(entry.date)}
            </span>
            {visibilityLabel && (
              <span className={`memory-detail-visibility is-${entry.visibility}`}>
                {visibilityLabel}
              </span>
            )}
          </div>
          <div className="memory-detail-coordinates">
            {entry.lat.toFixed(4)}°, {entry.lng.toFixed(4)}°
          </div>
        </div>

        {author && (
          <div className={`memory-detail-author ${isOwn ? 'is-own' : 'is-friend'}`}>
            {author.photoURL ? (
              <img src={author.photoURL} alt="" />
            ) : (
              <span aria-hidden="true">{(author.displayName || author.username).charAt(0).toUpperCase()}</span>
            )}
            <div>
              <small>{isOwn ? 'Your memory' : 'Explorer Circle memory'}</small>
              <strong>{isOwn ? 'You' : author.displayName} <em>@{author.username}</em></strong>
            </div>
          </div>
        )}

        {/* Title */}
        <h3 className="memory-detail-title">
          {entry.title}
        </h3>

        {/* Action Links Row */}
        <div className="memory-detail-actions">
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${entry.lat},${entry.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="glass-panel-interactive memory-detail-link"
          >
            <span>Explore on Google Maps</span>
            <ExternalLink size={12} />
          </a>

          {entry.googlePhotosUrl && (
            <a
              href={entry.googlePhotosUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-panel-interactive memory-detail-link"
            >
              <span>Google Photos Album</span>
              <ExternalLink size={12} />
            </a>
          )}
        </div>

        {/* Body Text */}
        <p className="memory-detail-copy">
          {entry.body}
        </p>

        {/* Footer Actions */}
        {canManage && (
          <div className="memory-detail-footer">
            <button
              onClick={onEdit}
              className="glass-btn is-edit"
            >
              <Edit2 size={12} />
              Edit Entry
            </button>
            <button
              onClick={handleDelete}
              className="glass-btn is-delete"
            >
              <Trash2 size={12} />
              Delete Entry
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
