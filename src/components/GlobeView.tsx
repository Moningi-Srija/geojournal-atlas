import React, { useEffect, useRef, useState } from 'react';
import Globe from 'react-globe.gl';
import type { JournalEntry } from '../types';

interface GlobeViewProps {
  entries: JournalEntry[];
  selectedEntry: JournalEntry | null;
  onSelectEntry: (entry: JournalEntry | null) => void;
  globeRef: React.MutableRefObject<any>;
}

export const GlobeView: React.FC<GlobeViewProps> = ({
  entries,
  selectedEntry,
  onSelectEntry,
  globeRef,
}) => {
  const [globeReady, setGlobeReady] = useState(false);
  const idleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Setup auto-rotation and idle detection
  useEffect(() => {
    if (!globeReady || !globeRef.current) return;

    const globeInstance = globeRef.current;
    const controls = globeInstance.controls();

    if (controls) {
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.5;
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;

      const handleStart = () => {
        // Pause auto-rotation when user starts interacting
        controls.autoRotate = false;
        if (idleTimeoutRef.current) {
          clearTimeout(idleTimeoutRef.current);
        }
      };

      const handleEnd = () => {
        // Resume auto-rotation after 5 seconds of idle time
        if (idleTimeoutRef.current) {
          clearTimeout(idleTimeoutRef.current);
        }
        idleTimeoutRef.current = setTimeout(() => {
          controls.autoRotate = true;
        }, 5000);
      };

      controls.addEventListener('start', handleStart);
      controls.addEventListener('end', handleEnd);

      return () => {
        controls.removeEventListener('start', handleStart);
        controls.removeEventListener('end', handleEnd);
        if (idleTimeoutRef.current) {
          clearTimeout(idleTimeoutRef.current);
        }
      };
    }
  }, [globeReady, globeRef]);

  // Handle flying to selected entry when it changes from the sidebar
  useEffect(() => {
    if (!globeRef.current || !selectedEntry) return;

    // Fly to coordinates with smooth camera animation
    globeRef.current.pointOfView(
      {
        lat: selectedEntry.lat,
        lng: selectedEntry.lng,
        altitude: 1.8,
      },
      1800 // 1.8 seconds duration
    );

    // Temporarily pause auto-rotation so the camera locks on the selected pin
    if (globeRef.current.controls()) {
      const controls = globeRef.current.controls();
      controls.autoRotate = false;
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
      }
      idleTimeoutRef.current = setTimeout(() => {
        controls.autoRotate = true;
      }, 8000); // Wait longer (8s) before resuming rotation after flying to a pin
    }
  }, [selectedEntry, globeRef]);

  // Triggered when clicking a pin directly
  const handleMarkerClick = (entry: JournalEntry) => {
    onSelectEntry(entry);
  };

  return (
    <div className="w-full h-full relative" style={{ background: 'radial-gradient(circle, #090e25 0%, #030308 100%)' }}>
      <Globe
        ref={globeRef}
        onGlobeReady={() => setGlobeReady(true)}
        backgroundColor="rgba(0,0,0,0)"
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        
        // Custom HTML Marker Config
        htmlElementsData={entries}
        htmlLat={(d: any) => d.lat}
        htmlLng={(d: any) => d.lng}
        htmlElement={(d: any) => {
          const entry = d as JournalEntry;
          const container = document.createElement('div');
          container.className = 'globe-marker-container';

          const ring = document.createElement('div');
          ring.className = 'globe-marker-ring';

          const thumbnail = document.createElement('div');
          thumbnail.className = 'globe-marker-thumbnail';
          const thumbnailSrc = (entry.photos && entry.photos.length > 0)
            ? entry.photos[0]
            : 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=150&auto=format&fit=crop';
          thumbnail.style.backgroundImage = `url(${thumbnailSrc})`;

          container.appendChild(ring);
          container.appendChild(thumbnail);

          // Event Listener for click
          container.addEventListener('click', (e) => {
            e.stopPropagation();
            handleMarkerClick(entry);
          });

          return container;
        }}
        
        // Disable default hover behavior for performance since we style HTML element hover via CSS
        htmlTransitionDuration={0}
      />
    </div>
  );
};
