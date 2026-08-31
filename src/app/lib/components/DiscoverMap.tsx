'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

type LeafletIconDefaultPrototype = L.Icon.Default & {
  _getIconUrl?: () => string;
};

delete (L.Icon.Default.prototype as LeafletIconDefaultPrototype)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface Place {
  id: string;
  name: string;
  category: string;
  lat: number;
  lng: number;
}

interface DiscoverMapProps {
  center: [number, number];
  places: Place[];
}

// MapContainer's `center` prop only applies on the map's initial mount --
// react-leaflet does not re-center an already-mounted map when the prop
// changes on later renders. This grabs the live map instance and moves
// it explicitly whenever `center` changes (e.g. a new search).
function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function DiscoverMap({ center, places }: DiscoverMapProps) {
  return (
    <MapContainer center={center} zoom={14} style={{ width: '100%', height: '100%' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <RecenterMap center={center} />
      <MarkerClusterGroup>
        {places.map((place) => (
          <Marker key={place.id} position={[place.lat, place.lng]}>
            <Popup>{place.name}</Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  );
}