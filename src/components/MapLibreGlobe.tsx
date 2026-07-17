import React, { useEffect, useRef, useState, useCallback } from 'react';
import Map, { Marker } from 'react-map-gl/maplibre';
import type { MapRef } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { JournalEntry } from '../types';
import { useAuth } from './AuthContext';

interface MapLibreGlobeProps {
  entries: JournalEntry[];
  selectedEntry: JournalEntry | null;
  onSelectEntry: (entry: JournalEntry | null) => void;
}

export const MapLibreGlobe: React.FC<MapLibreGlobeProps> = ({
  entries,
  selectedEntry,
  onSelectEntry,
}) => {
  const mapRef = useRef<MapRef>(null);
  const { user } = useAuth();
  const [viewState, setViewState] = useState({
    longitude: 0,
    latitude: 20,
    zoom: 1.5,
    pitch: 0,
    bearing: 0
  });
  
  const mapStyle = {
    version: 8,
    sources: {
      'osm': {
        type: 'raster',
        tiles: [
          'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
          'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
          'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
        ],
        tileSize: 256,
        attribution: '&copy; OpenStreetMap Contributors'
      }
    },
    layers: [
      {
        id: 'osm-layer',
        type: 'raster',
        source: 'osm',
        minzoom: 0,
        maxzoom: 19
      }
    ]
  };

  const onMapLoad = useCallback((e: any) => {
    const map = e.target;
    
    // Auto-rotate the globe slowly
    let animationId: number;
    let isInteracting = false;
    
    map.on('mousedown', () => isInteracting = true);
    map.on('mouseup', () => isInteracting = false);
    map.on('dragstart', () => isInteracting = true);
    map.on('dragend', () => isInteracting = false);
    map.on('touchstart', () => isInteracting = true);
    map.on('touchend', () => isInteracting = false);
    
    const rotateCamera = () => {
      if (!isInteracting && mapRef.current) {
        // Rotate 10 degrees per second (360 / 36) -> ~0.005 degrees per frame
        const currentCenter = map.getCenter();
        map.jumpTo({ center: [currentCenter.lng + 0.05, currentCenter.lat], zoom: map.getZoom() });
      }
      animationId = requestAnimationFrame(rotateCamera);
    };
    
    // Uncomment to enable auto-rotation (can sometimes conflict with user state in react-map-gl)
    // rotateCamera(0);
    
    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, []);

  // Fly to selected entry
  useEffect(() => {
    if (selectedEntry && mapRef.current) {
      mapRef.current.flyTo({
        center: [selectedEntry.lng, selectedEntry.lat],
        zoom: 12, // Zoom in closely to show high-res tiles
        pitch: 45, // Add a bit of tilt for 3D effect when zoomed in
        duration: 2500,
        essential: true
      });
    }
  }, [selectedEntry]);

  return (
    <div className="w-full h-full bg-[#030308]">
      <Map
        ref={mapRef}
        {...viewState}
        style={{ width: '100%', height: '100%' }}
        onMove={evt => setViewState(evt.viewState)}
        mapStyle={mapStyle as any}
        onLoad={onMapLoad}
        attributionControl={false} // Clean UI
      >
        {entries.map(entry => {
          const isMine = entry.authorId === user?.uid;
          const thumbnailSrc = (entry.photos && entry.photos.length > 0)
            ? entry.photos[0]
            : 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=150&auto=format&fit=crop';
            
          return (
            <Marker
              key={entry.id}
              longitude={entry.lng}
              latitude={entry.lat}
              anchor="center"
              onClick={e => {
                e.originalEvent.stopPropagation();
                onSelectEntry(entry);
              }}
            >
              <div className={`globe-marker-container ${isMine ? 'is-mine' : ''}`}>
                <div className="globe-marker-ring"></div>
                <div 
                  className="globe-marker-thumbnail"
                  style={{ backgroundImage: `url(${thumbnailSrc})` }}
                ></div>
              </div>
            </Marker>
          );
        })}
      </Map>
    </div>
  );
};
