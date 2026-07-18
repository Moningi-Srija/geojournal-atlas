import React from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from 'react-leaflet';
import { useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { JournalEntry, UserProfile } from '../types';
import { useAuth } from './AuthContext';

interface LeafletMapProps {
  entries: JournalEntry[];
  selectedEntry: JournalEntry | null;
  onSelectEntry: (entry: JournalEntry | null) => void;
  currentUserId?: string;
  filteredIds?: string[] | null;
  authorProfiles?: Record<string, UserProfile>;
}

const SelectedMemoryFocus: React.FC<{ entry: JournalEntry | null }> = ({ entry }) => {
  const map = useMap();

  useEffect(() => {
    if (!entry) return;
    map.flyTo([entry.lat, entry.lng], Math.max(map.getZoom(), 11), {
      animate: true,
      duration: 0.8,
    });
  }, [entry, map]);

  return null;
};

// Fix for default Leaflet marker icons not showing up due to Webpack/Vite asset hashing
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export const LeafletMap: React.FC<LeafletMapProps> = ({
  entries,
  selectedEntry,
  onSelectEntry,
  currentUserId,
  filteredIds = null,
  authorProfiles = {},
}) => {
  const { user } = useAuth();
  const viewerUid = currentUserId || user?.uid;
  const visibleEntries = filteredIds === null
    ? entries
    : entries.filter((entry) => filteredIds.includes(entry.id));
  
  // Center of the map initially
  const center: [number, number] = [20, 0];
  
  return (
    <div className="w-full h-full bg-[#030308]" style={{ zIndex: 1 }}>
      <MapContainer 
        center={center} 
        zoom={2.5} 
        minZoom={2}
        maxZoom={20}
        zoomSnap={0.5}
        wheelPxPerZoomLevel={90}
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
      >
        <SelectedMemoryFocus entry={selectedEntry} />
        <TileLayer
          attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          detectRetina
          maxNativeZoom={19}
          maxZoom={20}
          keepBuffer={5}
          updateWhenZooming
        />
        <TileLayer
          url="https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
          detectRetina
          maxNativeZoom={19}
          maxZoom={20}
          keepBuffer={5}
          opacity={0.86}
        />
        
        {visibleEntries.map(entry => {
          const isMine = entry.authorId === viewerUid;
          const author = entry.authorId ? authorProfiles[entry.authorId] : undefined;
          const authorLabel = isMine ? 'You' : (author?.displayName || author?.username || 'Explorer');
          const thumbnailSrc = (entry.photos && entry.photos.length > 0)
            ? entry.photos[0]
            : 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=150&auto=format&fit=crop';
            
          // Create custom HTML icon for Leaflet using the same styling as MapLibre
          const customIcon = L.divIcon({
            className: 'custom-leaflet-marker',
            html: `
              <div class="globe-marker-container ${isMine ? 'is-mine' : 'is-friend'}">
                <div class="globe-marker-ring"></div>
                <div 
                  class="globe-marker-thumbnail"
                  style="background-image: url(${thumbnailSrc})"
                ></div>
              </div>
            `,
            iconSize: [40, 40],
            iconAnchor: [20, 20]
          });

          return (
            <Marker 
              key={entry.id} 
              position={[entry.lat, entry.lng]} 
              icon={customIcon}
              eventHandlers={{
                click: () => onSelectEntry(entry),
              }}
            >
              <Tooltip
                direction="top"
                offset={[0, -18]}
                opacity={1}
                className={isMine ? 'atlas-map-tooltip is-mine' : 'atlas-map-tooltip is-friend'}
              >
                <strong>{authorLabel}</strong> · {entry.title}
              </Tooltip>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};
