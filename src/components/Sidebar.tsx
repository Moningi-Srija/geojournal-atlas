import React, { useState } from 'react';
import { Search, Compass, MapPin, ChevronLeft, ChevronRight, BookOpen, BarChart3 } from 'lucide-react';
import type { JournalEntry } from '../types';

interface SidebarProps {
  entries: JournalEntry[];
  selectedEntry: JournalEntry | null;
  onSelectEntry: (entry: JournalEntry | null) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  entries,
  selectedEntry,
  onSelectEntry,
  isOpen,
  onToggle,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'journal' | 'analytics'>('journal');
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

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={onToggle}
        className="glass-panel"
        style={{
          position: 'absolute',
          top: '100px',
          left: isOpen ? '380px' : '24px',
          zIndex: 15,
          padding: '12px',
          borderRadius: '12px',
          cursor: 'pointer',
          color: '#fff',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        aria-label={isOpen ? "Collapse Sidebar" : "Expand Sidebar"}
      >
        {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
      </button>

      {/* Sidebar container */}
      <div
        className="glass-panel"
        style={{
          position: 'absolute',
          top: '100px',
          bottom: '24px',
          left: isOpen ? '24px' : '-360px',
          width: '340px',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
        }}
      >
        {/* Sidebar Header */}
        <div
          style={{
            padding: '24px 20px 16px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div
              style={{
                backgroundColor: 'rgba(0, 136, 255, 0.15)',
                color: 'var(--accent-cyan)',
                padding: '8px',
                borderRadius: '10px',
              }}
            >
              <Compass size={20} className="animate-spin" style={{ animationDuration: '20s' }} />
            </div>
            <div>
              <h1
                style={{
                  fontFamily: 'Outfit, sans-serif',
                  fontWeight: 700,
                  fontSize: '1.25rem',
                  letterSpacing: '-0.02em',
                }}
              >
                Memory Atlas
              </h1>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                {entries.length} {entries.length === 1 ? 'memory' : 'memories'} captured
              </p>
            </div>
          </div>

          {/* Navigation Tab Selector */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', background: 'rgba(255, 255, 255, 0.02)', padding: '4px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <button
              type="button"
              onClick={() => setActiveTab('journal')}
              style={{
                flex: 1,
                padding: '6px',
                fontSize: '0.8rem',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontFamily: 'Outfit, sans-serif',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                color: activeTab === 'journal' ? '#fff' : 'var(--text-secondary)',
                background: activeTab === 'journal' ? 'rgba(0, 136, 255, 0.2)' : 'transparent',
                transition: 'all 0.2s ease',
              }}
            >
              <BookOpen size={12} />
              Journal
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('analytics')}
              style={{
                flex: 1,
                padding: '6px',
                fontSize: '0.8rem',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontFamily: 'Outfit, sans-serif',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                color: activeTab === 'analytics' ? '#fff' : 'var(--text-secondary)',
                background: activeTab === 'analytics' ? 'rgba(0, 136, 255, 0.2)' : 'transparent',
                transition: 'all 0.2s ease',
              }}
            >
              <BarChart3 size={12} />
              Analytics
            </button>
          </div>

          {/* Search bar (only for Journal tab) */}
          {activeTab === 'journal' && (
            <div className="relative">
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              />
              <input
                type="text"
                className="glass-input w-full"
                placeholder="Search memories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '36px', width: '100%' }}
              />
            </div>
          )}
        </div>

        {/* Entries list or Country Analytics */}
        <div
          className="overflow-y-auto"
          style={{
            flex: 1,
            padding: '16px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          {activeTab === 'journal' ? (
            filteredEntries.length > 0 ? (
              filteredEntries.map((entry) => {
                const isSelected = selectedEntry?.id === entry.id;
                return (
                  <div
                    key={entry.id}
                    onClick={() => onSelectEntry(entry)}
                    className={`glass-panel-interactive`}
                    style={{
                      padding: '12px',
                      borderRadius: '12px',
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'center',
                      background: isSelected ? 'rgba(0, 136, 255, 0.1)' : 'rgba(255,255,255,0.02)',
                      borderColor: isSelected ? 'var(--accent-blue)' : 'rgba(255,255,255,0.06)',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer',
                    }}
                  >
                    {/* Small circular photo thumbnail */}
                    <img
                      src={(entry.photos && entry.photos.length > 0) ? entry.photos[0] : 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=150&auto=format&fit=crop'}
                      alt={entry.title}
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: isSelected ? '2px solid var(--accent-cyan)' : '2px solid rgba(255, 255, 255, 0.2)',
                        boxShadow: isSelected ? '0 0 10px rgba(0, 240, 255, 0.4)' : 'none',
                      }}
                    />

                    {/* Text details */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4
                        style={{
                          fontFamily: 'Outfit, sans-serif',
                          fontWeight: 600,
                          fontSize: '0.92rem',
                          color: isSelected ? 'var(--accent-cyan)' : '#fff',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          marginBottom: '2px',
                        }}
                      >
                        {entry.title}
                      </h4>
                      <div className="flex items-center gap-1" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        <MapPin size={10} style={{ color: 'var(--accent-cyan)' }} />
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {entry.locationName}
                        </span>
                      </div>
                    </div>

                    {/* Date marker */}
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', alignSelf: 'flex-start' }}>
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
                  <BookOpen size={24} />
                </div>
                <p style={{ fontSize: '0.85rem' }}>
                  {searchQuery ? 'No matching memories found.' : 'No memories captured yet.'}
                </p>
                {!searchQuery && (
                  <p style={{ fontSize: '0.75rem', maxWidth: '200px' }}>
                    Click the float button in the bottom right corner to add a pin on the globe!
                  </p>
                )}
              </div>
            )
          ) : (
            /* Analytics Tab contents */
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
          )}
        </div>
      </div>
    </>
  );
};
