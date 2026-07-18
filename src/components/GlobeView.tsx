import { useEffect, useRef, useState, useMemo } from 'react';
import Globe from 'react-globe.gl';
import type { GlobeMethods } from 'react-globe.gl';
import { Flame, MapPin } from 'lucide-react';
import type { JournalEntry, UserProfile } from '../types';

interface GlobeViewProps {
  entries: JournalEntry[];
  selectedEntry: JournalEntry | null;
  onSelectEntry: (entry: JournalEntry | null) => void;
  filteredIds?: string[] | null;
  isHeatmapMode?: boolean;
  initialFocusEntry?: JournalEntry | null;
  currentUserId?: string;
  authorProfiles?: Record<string, UserProfile>;
  showOwnershipLegend?: boolean;
}

export function GlobeView({
  entries,
  selectedEntry,
  onSelectEntry,
  filteredIds = null,
  isHeatmapMode = false,
  initialFocusEntry = null,
  currentUserId,
  authorProfiles = {},
  showOwnershipLegend = false,
}: GlobeViewProps) {
  const globeRef = useRef<GlobeMethods>(null as unknown as GlobeMethods);
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  const containerRef = useRef<HTMLDivElement>(null);
  const matchingCount = filteredIds === null
    ? entries.length
    : entries.filter((entry) => filteredIds.includes(entry.id)).length;

  const configureGlobeQuality = () => {
    if (!globeRef.current) return;

    const renderer = globeRef.current.renderer();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const controls = globeRef.current.controls();
    controls.enableDamping = true;
    controls.dampingFactor = 0.075;
    controls.rotateSpeed = 0.55;
    controls.zoomSpeed = 0.72;

    if (initialFocusEntry) {
      controls.autoRotate = false;
      globeRef.current.pointOfView({
        lat: initialFocusEntry.lat,
        lng: initialFocusEntry.lng,
        altitude: 0.72,
      }, 700);
    }
  };

  const activateEntry = (entry: JournalEntry) => {
    if (globeRef.current) globeRef.current.controls().autoRotate = false;
    onSelectEntry(entry);
  };

  // Resize listener
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };
    window.addEventListener('resize', handleResize);
    setTimeout(handleResize, 100);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Format data for the globe
  const pinsData = useMemo(() => {
    return entries.map(entry => {
      const isFilteredOut = filteredIds !== null && !filteredIds.includes(entry.id);
      const isOwn = !currentUserId || entry.authorId === currentUserId;
      const author = entry.authorId ? authorProfiles[entry.authorId] : undefined;
      const authorLabel = isOwn ? 'You' : (author?.displayName || author?.username || 'Explorer');
      return {
        lat: entry.lat,
        lng: entry.lng,
        title: entry.title,
        color: isOwn ? '#72d6c2' : '#a99af4',
        size: selectedEntry?.id === entry.id ? 1.5 : 1,
        id: entry.id,
        isFilteredOut,
        isOwn,
        authorLabel,
        entry
      };
    });
  }, [entries, selectedEntry, filteredIds, currentUserId, authorProfiles]);

  // Focus on selected entry
  useEffect(() => {
    if (selectedEntry && globeRef.current) {
      globeRef.current.pointOfView({
        lat: selectedEntry.lat,
        lng: selectedEntry.lng,
        altitude: 0.5
      }, 1000); // 1s animation
    }
  }, [selectedEntry]);

  // If filteredIds changes, find the first match and focus it
  useEffect(() => {
    if (filteredIds && filteredIds.length > 0 && globeRef.current) {
      const firstMatch = entries.find(e => e.id === filteredIds[0]);
      if (firstMatch) {
        globeRef.current.pointOfView({
          lat: firstMatch.lat,
          lng: firstMatch.lng,
          altitude: 0.8
        }, 1500);
      }
    }
  }, [filteredIds, entries]);

  useEffect(() => {
    if (!isHeatmapMode || entries.length === 0 || !globeRef.current) return;
    const firstMemory = entries[0];
    globeRef.current.controls().autoRotate = false;
    globeRef.current.pointOfView({
      lat: firstMemory.lat,
      lng: firstMemory.lng,
      altitude: 1.35,
    }, 900);
  }, [isHeatmapMode, entries]);

  // Initial animation
  useEffect(() => {
    if (globeRef.current) {
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      globeRef.current.controls().autoRotate = !reduceMotion;
      globeRef.current.controls().autoRotateSpeed = 0.5;
    }
  }, []);

  // Stop auto-rotate when user interacts
  useEffect(() => {
    if (globeRef.current) {
      const controls = globeRef.current.controls();
      const stopRotation = () => {
        controls.autoRotate = false;
      };
      controls.addEventListener('start', stopRotation);
      return () => controls.removeEventListener('start', stopRotation);
    }
  }, []);

  return (
    <div ref={containerRef} className="globe-stage" style={{ cursor: 'grab' }}>
      <Globe
        ref={globeRef}
        width={dimensions.width}
        height={dimensions.height}
        rendererConfig={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        globeCurvatureResolution={2}
        onGlobeReady={configureGlobeQuality}
        // Switch to dark topology for heatmap, else use satellite tiles
        globeImageUrl={isHeatmapMode ? "//unpkg.com/three-globe/example/img/earth-dark.jpg" : null}
        bumpImageUrl={null}
        globeTileEngineUrl={isHeatmapMode ? undefined : (x, y, level) => `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${level}/${y}/${x}`}
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        
        // Render Heatmap Rings or Standard HTML Pins
        ringsData={isHeatmapMode ? pinsData : []}
        ringColor={(d: any) => (t: number) => d.isFilteredOut
          ? `rgba(148, 163, 184, ${0.12 * (1 - t)})`
          : `rgba(244, 63, 94, ${0.86 * (1 - t)})`}
        ringMaxRadius={(d: any) => d.isFilteredOut ? 0.9 : 3}
        ringPropagationSpeed={(d: any) => d.isFilteredOut ? 0.7 : 2}
        ringRepeatPeriod={(d: any) => d.isFilteredOut ? 2200 : 850}

        // Small interactive cores keep heatmap memories selectable.
        pointsData={isHeatmapMode ? pinsData : []}
        pointColor={(d: any) => d.isFilteredOut ? '#64748b' : d.color}
        pointAltitude={0.012}
        pointRadius={(d: any) => d.isFilteredOut ? 0.055 : (selectedEntry?.id === d.id ? 0.2 : 0.14)}
        pointResolution={12}
        pointLabel={(d: any) => `${d.authorLabel} · ${d.title}`}
        onPointClick={(d: any) => activateEntry(d.entry)}
        pointsTransitionDuration={350}

        htmlElementsData={isHeatmapMode ? [] : pinsData}
        htmlElement={(d: any) => {
          const el = document.createElement('div');
          el.className = [
            'globe-pin-node',
            d.isFilteredOut ? 'is-filtered-out' : '',
            selectedEntry?.id === d.id ? 'is-selected' : '',
            d.isOwn ? 'is-own-pin' : 'is-friend-pin',
          ].filter(Boolean).join(' ');
          el.tabIndex = 0;
          el.setAttribute('role', 'button');
          el.setAttribute('aria-label', `Open memory: ${d.title}`);

          const tooltip = document.createElement('div');
          tooltip.className = 'pin-tooltip';
          tooltip.textContent = `${d.authorLabel} · ${d.title}`;

          const dot = document.createElement('div');
          dot.className = 'pin-dot';
          dot.style.backgroundColor = d.isFilteredOut ? '#64748b' : d.color;
          dot.style.boxShadow = d.isFilteredOut
            ? '0 0 10px rgba(255,255,255,0.08)'
            : d.isOwn
              ? '0 0 18px rgba(114, 214, 194, 0.65)'
              : '0 0 18px rgba(169, 154, 244, 0.68)';

          const core = document.createElement('div');
          core.className = 'pin-dot-core';
          dot.appendChild(core);
          el.append(tooltip, dot);

          el.style.pointerEvents = 'auto';
          el.onclick = () => activateEntry(d.entry);
          el.onkeydown = (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              activateEntry(d.entry);
            }
          };
          
          return el;
        }}
        htmlTransitionDuration={500}
        
        atmosphereColor={isHeatmapMode ? "#ff9e77" : "#72d6c2"}
        atmosphereAltitude={0.12}
      />

      {isHeatmapMode && entries.length > 0 && (
        <div className="globe-mode-hud" role="status" aria-live="polite">
          <Flame size={14} color="#fb7185" aria-hidden="true" />
          <strong>Personal travel density</strong>
          <span>
            {filteredIds === null
              ? `${entries.length} active ${entries.length === 1 ? 'memory' : 'memories'}`
              : matchingCount > 0
                ? `${matchingCount} search ${matchingCount === 1 ? 'match' : 'matches'} highlighted`
                : 'No search matches — hotspots are dimmed'}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.42)' }}>· Click a core to open</span>
        </div>
      )}

      {showOwnershipLegend && entries.length > 0 && (
        <div className="globe-ownership-legend" role="status" aria-label="Atlas pin colours">
          <span><i className="is-own" /> Your memories</span>
          <span><i className="is-friend" /> Explorer Circle</span>
          <small>{entries.length} visible pins</small>
        </div>
      )}

      {entries.length === 0 && (
        <div className="globe-empty-state">
          <MapPin size={20} color="#60a5fa" style={{ marginBottom: '7px' }} aria-hidden="true" />
          <strong>Your Atlas is ready</strong>
          Use the + button to capture a first place and bring this globe to life.
        </div>
      )}
    </div>
  );
}
