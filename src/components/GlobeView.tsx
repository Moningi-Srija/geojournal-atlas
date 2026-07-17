import { useEffect, useRef, useState, useMemo } from 'react';
import Globe from 'react-globe.gl';
import type { GlobeMethods } from 'react-globe.gl';
import type { JournalEntry } from '../types';

interface GlobeViewProps {
  entries: JournalEntry[];
  selectedEntry: JournalEntry | null;
  onSelectEntry: (entry: JournalEntry | null) => void;
}

export function GlobeView({ entries, selectedEntry, onSelectEntry }: GlobeViewProps) {
  const globeRef = useRef<GlobeMethods>(null as unknown as GlobeMethods);
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  const containerRef = useRef<HTMLDivElement>(null);

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
    // Initial size
    setTimeout(handleResize, 100);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Format data for the globe
  const pinsData = useMemo(() => entries.map(entry => ({
    lat: entry.lat,
    lng: entry.lng,
    title: entry.title,
    color: entry.visibility === 'private' ? '#10b981' : '#3b82f6', // emerald-500 : blue-500
    size: selectedEntry?.id === entry.id ? 1.5 : 1,
    id: entry.id,
    entry
  })), [entries, selectedEntry]);

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

  // Initial animation
  useEffect(() => {
    if (globeRef.current) {
      globeRef.current.controls().autoRotate = true;
      globeRef.current.controls().autoRotateSpeed = 0.5;
    }
  }, []);

  // Stop auto-rotate when user interacts
  useEffect(() => {
    if (globeRef.current) {
      const controls = globeRef.current.controls();
      controls.addEventListener('start', () => {
        controls.autoRotate = false;
      });
    }
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full bg-[#030308] overflow-hidden" style={{ cursor: 'grab' }}>
      <Globe
        ref={globeRef}
        width={dimensions.width}
        height={dimensions.height}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        
        // Pins (HTML Elements)
        htmlElementsData={pinsData}
        htmlElement={(d: any) => {
          const el = document.createElement('div');
          el.style.position = 'relative';
          el.style.cursor = 'pointer';
          el.style.transform = 'translate(-50%, -50%)';
          // Use CSS variables for hover state via a style tag
          el.innerHTML = `
            <style>
              .globe-pin-${d.id} .pin-tooltip {
                opacity: 0;
                transition: opacity 0.2s;
              }
              .globe-pin-${d.id}:hover .pin-tooltip {
                opacity: 1;
              }
              .globe-pin-${d.id} .pin-dot {
                transition: transform 0.2s;
              }
              .globe-pin-${d.id}:hover .pin-dot {
                transform: scale(1.25);
              }
            </style>
            <div class="globe-pin-${d.id}" style="position: relative;">
              <div class="pin-tooltip" style="position: absolute; top: -35px; left: 50%; transform: translateX(-50%); white-space: nowrap; background: rgba(0,0,0,0.8); color: white; font-size: 12px; padding: 4px 8px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.2); pointer-events: none; z-index: 50;">
                ${d.title}
              </div>
              <div class="pin-dot" style="width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 0 15px rgba(255,255,255,0.5); background-color: ${d.color};">
                <div style="width: 8px; height: 8px; background-color: white; border-radius: 50%;"></div>
              </div>
            </div>
          `;
          
          el.style.pointerEvents = 'auto';
          el.onclick = () => {
            // Stop rotation if active
            if (globeRef.current) globeRef.current.controls().autoRotate = false;
            onSelectEntry(d.entry);
          };
          
          return el;
        }}
        htmlTransitionDuration={500}
        
        // Settings
        atmosphereColor="#0066ff"
        atmosphereAltitude={0.15}
      />
    </div>
  );
}
