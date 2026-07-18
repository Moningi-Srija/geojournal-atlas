import React, { useState } from 'react';
import { Search, SearchX, MapPin, MapPinned, ChevronLeft, ChevronRight, BookOpen, BarChart3, Upload, Star, Sparkles } from 'lucide-react';
import type { JournalEntry, UserProfile } from '../types';
import { getBadgeDefinition } from '../utils/badges';

interface SidebarProps {
  entries: JournalEntry[];
  selectedEntry: JournalEntry | null;
  onSelectEntry: (entry: JournalEntry | null) => void;
  isOpen: boolean;
  onToggle: () => void;
  onOpenImport?: () => void;
  onOpenPro?: () => void;
  profile?: UserProfile | null;
  onOpenProfile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  entries,
  selectedEntry,
  onSelectEntry,
  isOpen,
  onToggle,
  onOpenImport,
  onOpenPro,
  profile,
  onOpenProfile,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'journal' | 'analytics' | 'rediscover'>('journal');
  const [expandedCountries, setExpandedCountries] = useState<{ [key: string]: boolean }>({});

  const getCountryFlagEmoji = (countryName: string): string => {
    const c = countryName.toLowerCase().trim();
    if (c.includes('japan')) return '🇯🇵';
    if (c.includes('france')) return '🇫🇷';
    if (c.includes('usa') || c.includes('united states') || c.includes('america')) return '🇺🇸';
    if (c.includes('india')) return '🇮🇳';
    if (c.includes('uk') || c.includes('united kingdom') || c.includes('britain')) return '🇬🇧';
    if (c.includes('germany')) return '🇩🇪';
    if (c.includes('italy')) return '🇮🇹';
    if (c.includes('spain')) return '🇪🇸';
    if (c.includes('canada')) return '🇨🇦';
    if (c.includes('australia')) return '🇦🇺';
    if (c.includes('brazil')) return '🇧🇷';
    if (c.includes('china')) return '🇨🇳';
    if (c.includes('switzerland')) return '🇨🇭';
    if (c.includes('singapore')) return '🇸🇬';
    return '🌐';
  };

  // Group entries by country name parsed from locationName
  const countryGroups = entries.reduce((groups: { [key: string]: JournalEntry[] }, entry) => {
    const locationStr = entry.locationName || '';
    const parts = locationStr.split(',');
    const country = parts[parts.length - 1]?.trim() || 'Unknown';
    if (!groups[country]) {
      groups[country] = [];
    }
    groups[country].push(entry);
    return groups;
  }, {});

  // Sort country list desc by quantity of memories
  const sortedCountries = Object.entries(countryGroups).sort(
    (a, b) => b[1].length - a[1].length
  );

  const toggleCountry = (country: string) => {
    setExpandedCountries((prev) => ({
      ...prev,
      [country]: !prev[country],
    }));
  };

  // Filter entries based on search query
  const filteredEntries = entries.filter((entry) => {
    const query = searchQuery.toLowerCase();
    const title = entry.title || '';
    const loc = entry.locationName || '';
    const body = entry.body || '';
    return (
      title.toLowerCase().includes(query) ||
      loc.toLowerCase().includes(query) ||
      body.toLowerCase().includes(query)
    );
  });

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const today = new Date();
  const currentMonthName = today.toLocaleDateString('en-US', { month: 'long' });
  const datedEntries = entries
    .filter((entry) => Number.isFinite(entry.date) && entry.date < today.getTime())
    .sort((first, second) => second.date - first.date);
  const usedRediscoverIds = new Set<string>();
  const claimRediscoverEntries = (matches: JournalEntry[]) => matches.filter((entry) => {
    if (usedRediscoverIds.has(entry.id)) return false;
    usedRediscoverIds.add(entry.id);
    return true;
  });
  const onThisDayEntries = claimRediscoverEntries(datedEntries.filter((entry) => {
    const date = new Date(entry.date);
    return date.getFullYear() < today.getFullYear()
      && date.getMonth() === today.getMonth()
      && date.getDate() === today.getDate();
  }));
  const pastMonthEntries = claimRediscoverEntries(datedEntries.filter((entry) => {
    const date = new Date(entry.date);
    return date.getFullYear() < today.getFullYear() && date.getMonth() === today.getMonth();
  }));
  const yearAgoEntries = claimRediscoverEntries(datedEntries.filter((entry) => {
    const date = new Date(entry.date);
    const monthDistance = (today.getFullYear() - date.getFullYear()) * 12
      + today.getMonth()
      - date.getMonth();
    return monthDistance >= 11 && monthDistance <= 13;
  }));
  const anniversarySections = [
    {
      id: 'on-this-day',
      title: 'On this day',
      subtitle: `From ${today.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} in years past`,
      entries: onThisDayEntries,
    },
    {
      id: 'past-months',
      title: `Past ${currentMonthName}s`,
      subtitle: `More moments from ${currentMonthName} in earlier years`,
      entries: pastMonthEntries,
    },
    {
      id: 'a-year-ago',
      title: 'A year ago',
      subtitle: 'Memories from roughly 11–13 months ago',
      entries: yearAgoEntries,
    },
  ].filter((section) => section.entries.length > 0);
  const rediscoverSections = anniversarySections.length > 0
    ? anniversarySections
    : entries.length > 0
      ? [{
          id: 'from-your-atlas',
          title: 'From your Atlas',
          subtitle: 'No exact anniversary today — a recent selection from your real memories',
          entries: [...entries].sort((first, second) => second.date - first.date).slice(0, 8),
        }]
      : [];

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={onToggle}
        className={`glass-panel atlas-sidebar-toggle ${isOpen ? 'is-open' : 'is-closed'}`}
        aria-label={isOpen ? "Collapse Sidebar" : "Expand Sidebar"}
      >
        {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
      </button>

      {/* Sidebar container */}
      <div
        className={`glass-panel atlas-sidebar ${isOpen ? 'is-open' : 'is-closed'}`}
      >
        {/* Sidebar Header */}
        <div className="sidebar-head">
          <div className="sidebar-title-row">
            <div>
              <span className="sidebar-kicker">
                Personal atlas · {entries.length} {entries.length === 1 ? 'memory' : 'memories'}
              </span>
              <h1>Your memories</h1>
              <p>
                {entries.length === 0
                  ? 'Your next story starts somewhere on the map.'
                  : 'A living collection of places and moments worth returning to.'}
              </p>
            </div>
            <div className="sidebar-actions">
              {onOpenImport && (
                <button
                  onClick={onOpenImport}
                  className="glass-btn hover-glow sidebar-action is-sync"
                  title="Import travel history"
                >
                  <Upload size={14} /> Sync
                </button>
              )}
              {onOpenPro && (
                <button
                  onClick={onOpenPro}
                  className="glass-btn hover-glow sidebar-action is-pro"
                  title="Preview GeoJournal Pro"
                >
                  <Star size={14} fill="#fbbf24" /> Pro
                </button>
              )}
            </div>
          </div>

          {/* Navigation Tab Selector */}
          <div className="sidebar-segments">
            <button
              type="button"
              onClick={() => setActiveTab('journal')}
              aria-pressed={activeTab === 'journal'}
              className={activeTab === 'journal' ? 'is-active' : ''}
            >
              <BookOpen size={12} />
              Journal
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('analytics')}
              aria-pressed={activeTab === 'analytics'}
              className={activeTab === 'analytics' ? 'is-active' : ''}
            >
              <BarChart3 size={12} />
              Insights
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('rediscover')}
              aria-pressed={activeTab === 'rediscover'}
              className={activeTab === 'rediscover' ? 'is-active' : ''}
            >
              <Sparkles size={12} />
              Rediscover
            </button>
          </div>

          {/* Search bar (only for Journal tab) */}
          {activeTab === 'journal' && (
            <div className="sidebar-search">
              <Search size={16} />
              <input
                type="text"
                className="glass-input"
                placeholder="Search memories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search journal memories"
              />
            </div>
          )}
        </div>

        {/* Entries list or Country Analytics */}
        <div className="sidebar-content">
          {activeTab === 'journal' ? (
            filteredEntries.length > 0 ? (
              filteredEntries.map((entry) => {
                const isSelected = selectedEntry?.id === entry.id;
                return (
                  <div
                    key={entry.id}
                    onClick={() => onSelectEntry(entry)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        onSelectEntry(entry);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isSelected}
                    className={`glass-panel-interactive memory-list-item ${isSelected ? 'is-selected' : ''}`}
                  >
                    {/* Editorial travel thumbnail */}
                    <img
                      src={(entry.photos && entry.photos.length > 0) ? entry.photos[0] : 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=150&auto=format&fit=crop'}
                      alt={entry.title}
                      className="memory-thumb"
                    />

                    {/* Text details */}
                    <div className="memory-copy">
                      <h4>
                        {entry.title}
                      </h4>
                      <div className="memory-location">
                        <MapPin size={11} />
                        <span>
                          {entry.locationName}
                        </span>
                      </div>
                    </div>

                    {/* Date marker */}
                    <span className="memory-date">
                      {formatDate(entry.date)}
                    </span>
                  </div>
                );
              })
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '220px',
                  textAlign: 'center',
                  color: 'var(--text-secondary)',
                  padding: '24px 20px',
                  gap: '12px',
                  background: 'linear-gradient(160deg, rgba(59,130,246,0.07), rgba(139,92,246,0.035))',
                  border: '1px solid rgba(96,165,250,0.12)',
                  borderRadius: '16px',
                }}
              >
                <div
                  style={{
                    backgroundColor: searchQuery ? 'rgba(139,92,246,0.1)' : 'rgba(59,130,246,0.1)',
                    padding: '16px',
                    borderRadius: '50%',
                    border: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  {searchQuery ? <SearchX size={24} color="#c4b5fd" /> : <MapPinned size={24} color="#60a5fa" />}
                </div>
                <strong style={{ color: '#fff', fontFamily: 'Outfit, sans-serif', fontSize: '0.94rem' }}>
                  {searchQuery ? 'No memories match' : 'Your Atlas is ready'}
                </strong>
                <p style={{ fontSize: '0.76rem', maxWidth: '220px', lineHeight: 1.55 }}>
                  {searchQuery ? `Try a broader place, title, or journal keyword.` : 'Use the blue + button to capture your first place and bring the globe to life.'}
                </p>
                {searchQuery && (
                  <button type="button" onClick={() => setSearchQuery('')} className="glass-btn" style={{ padding: '6px 11px', fontSize: '0.72rem' }}>
                    Clear search
                  </button>
                )}
              </div>
            )
          ) : activeTab === 'analytics' ? (
            /* Insights Tab contents */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h3 style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px', fontWeight: 600 }}>
                Memories Grouped By Country
              </h3>
              
              {sortedCountries.length > 0 ? (
                sortedCountries.map(([country, countryEntries]) => {
                  const isExpanded = !!expandedCountries[country];
                  return (
                    <div
                      key={country}
                      style={{
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {/* Country Header Row */}
                      <div
                        onClick={() => toggleCountry(country)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            toggleCountry(country);
                          }
                        }}
                        role="button"
                        tabIndex={0}
                        aria-expanded={isExpanded}
                        style={{
                          padding: '12px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          background: isExpanded ? 'rgba(0, 136, 255, 0.06)' : 'transparent',
                          transition: 'background 0.2s ease',
                        }}
                        className="glass-panel-interactive"
                      >
                        <div className="flex items-center gap-2" style={{ minWidth: 0 }}>
                          <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>
                            {getCountryFlagEmoji(country)}
                          </span>
                          <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {country}
                          </span>
                        </div>
                        <span
                          style={{
                            backgroundColor: 'rgba(0, 136, 255, 0.15)',
                            color: 'var(--accent-cyan)',
                            padding: '2px 8px',
                            borderRadius: '10px',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            flexShrink: 0,
                          }}
                        >
                          {countryEntries.length} {countryEntries.length === 1 ? 'pin' : 'pins'}
                        </span>
                      </div>

                      {/* Expanded Entries sublist */}
                      {isExpanded && (
                        <div
                          style={{
                            padding: '8px',
                            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px',
                            background: 'rgba(0, 0, 0, 0.15)',
                          }}
                        >
                          {countryEntries.map((entry) => {
                            const isSelected = selectedEntry?.id === entry.id;
                            return (
                              <div
                                key={entry.id}
                                onClick={() => onSelectEntry(entry)}
                                style={{
                                  padding: '8px 10px',
                                  borderRadius: '8px',
                                  fontSize: '0.8rem',
                                  color: isSelected ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                                  background: isSelected ? 'rgba(0, 136, 255, 0.1)' : 'rgba(255, 255, 255, 0.01)',
                                  border: `1px solid ${isSelected ? 'var(--accent-blue)' : 'rgba(255, 255, 255, 0.04)'}`,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  minWidth: 0,
                                }}
                                className="glass-panel-interactive"
                              >
                                <img
                                  src={entry.photos && entry.photos.length > 0 ? entry.photos[0] : 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=150'}
                                  alt=""
                                  style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }}
                                />
                                <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', flex: 1 }}>
                                  {entry.title}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '200px',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    padding: '20px',
                    gap: '12px',
                  }}
                >
                  <div
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                      padding: '16px',
                      borderRadius: '50%',
                      border: '1px solid rgba(255,255,255,0.05)',
                    }}
                  >
                    <BarChart3 size={24} />
                  </div>
                  <p style={{ fontSize: '0.85rem' }}>No countries mapped yet.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="rediscover-feed">
              <div className="rediscover-hero">
                <div className="rediscover-hero-icon" aria-hidden="true">
                  <Sparkles size={18} />
                </div>
                <div>
                  <span className="rediscover-kicker">
                    {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </span>
                  <h3>Rediscover your world</h3>
                  <p>
                    {anniversarySections.length > 0
                      ? 'True date matches from journeys already saved in your Atlas.'
                      : entries.length > 0
                        ? 'No exact anniversary today, so here is a small selection from your Atlas.'
                        : 'Save real travel memories and they will return here at meaningful moments.'}
                  </p>
                </div>
              </div>

              {rediscoverSections.length > 0 ? (
                rediscoverSections.map((section) => (
                  <section className="rediscover-section" key={section.id} aria-labelledby={`rediscover-${section.id}`}>
                    <div className="rediscover-section-head">
                      <div>
                        <h4 id={`rediscover-${section.id}`}>{section.title}</h4>
                        <p>{section.subtitle}</p>
                      </div>
                      <span className="rediscover-count">
                        {section.entries.length} {section.entries.length === 1 ? 'memory' : 'memories'}
                      </span>
                    </div>

                    <div className="rediscover-list">
                      {section.entries.map((entry, index) => {
                        const isSelected = selectedEntry?.id === entry.id;
                        return (
                          <div
                            key={entry.id}
                            onClick={() => onSelectEntry(entry)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                onSelectEntry(entry);
                              }
                            }}
                            role="button"
                            tabIndex={0}
                            aria-pressed={isSelected}
                            className={`glass-panel-interactive memory-list-item rediscover-card ${index === 0 ? 'is-featured' : ''} ${isSelected ? 'is-selected' : ''}`}
                          >
                            <img
                              src={entry.photos && entry.photos.length > 0
                                ? entry.photos[0]
                                : 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=240&auto=format&fit=crop'}
                              alt={entry.title}
                              className="memory-thumb"
                            />
                            <div className="memory-copy">
                              <h4>{entry.title}</h4>
                              <div className="memory-location">
                                <MapPin size={11} />
                                <span>{entry.locationName}</span>
                              </div>
                            </div>
                            <time className="memory-date" dateTime={new Date(entry.date).toISOString()}>
                              {formatDate(entry.date)}
                            </time>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                ))
              ) : (
                <div className="rediscover-empty">
                  <MapPinned size={25} aria-hidden="true" />
                  <strong>Nothing to rediscover yet</strong>
                  <p>This space only reflects memories you have actually added to your Atlas.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Profile Section at Bottom */}
        {profile && (
          <div
            onClick={onOpenProfile}
            onKeyDown={(event) => {
              if ((event.key === 'Enter' || event.key === ' ') && onOpenProfile) {
                event.preventDefault();
                onOpenProfile();
              }
            }}
            role="button"
            tabIndex={0}
            className="sidebar-profile hover:bg-white/5 transition-colors"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img
                src={profile.photoURL || 'https://api.dicebear.com/7.x/adventurer/svg?seed=Jack'}
                style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid var(--accent-cyan)' }}
                alt="Profile"
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <h4 style={{ margin: 0, color: 'white', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {profile.displayName || 'Explorer'}
                </h4>
                <p style={{ margin: 0, color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>View Profile</p>
              </div>
            </div>

            {/* Display up to 4 earned badges */}
            {profile.badges && profile.badges.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {profile.badges.slice(0, 4).map(b => {
                  const bd = getBadgeDefinition(b.id);
                  return (
                    <div key={b.id} title={bd.name} style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${bd.color}40` }}>
                      <bd.icon size={14} color={bd.color} />
                    </div>
                  );
                })}
                {profile.badges.length > 4 && (
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid rgba(255,255,255,0.1)`, fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>
                    +{profile.badges.length - 4}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};
