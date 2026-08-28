'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete (L.Icon.Default.prototype as L.Icon.Default & { _getIconUrl?: () => string })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function createNumberedIcon(number: number) {
  return L.divIcon({
    className: '',
    html: `<div style="background:#171717;color:white;width:28px;height:28px;border-radius:9999px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:600;box-shadow:0 1px 3px rgba(0,0,0,0.3);">${number}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

interface MapActivity {
  id: string;
  title: string;
  location?: { lat: number; lng: number; address?: string };
}

interface TripMapProps {
  destination: string;
  activities: MapActivity[];
}

function FitToMarkers({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length === 1) map.setView(positions[0], 14);
    else if (positions.length > 1) map.fitBounds(positions, { padding: [40, 40] });
  }, [positions, map]);
  return null;
}

export default function TripMap({ destination, activities }: TripMapProps) {
  const [fallbackCenter, setFallbackCenter] = useState<[number, number] | null>(null);
  const [error, setError] = useState(false);

  const positions = activities
    .filter((a) => a.location)
    .map((a) => [a.location!.lat, a.location!.lng] as [number, number]);

  useEffect(() => {
    if (positions.length > 0 || !destination) return;
    let cancelled = false;

    fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(destination)}&limit=1`
    )
      .then((res) => res.json())
      .then((results) => {
        if (cancelled) return;
        if (results?.[0]) {
          setFallbackCenter([parseFloat(results[0].lat), parseFloat(results[0].lon)]);
        } else {
          setError(true);
        }
      })
      .catch(() => !cancelled && setError(true));

    return () => {
      cancelled = true;
    };
  }, [destination, positions.length]);

  const center = positions[0] ?? fallbackCenter;

  if (!center) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-neutral-400 dark:text-neutral-500">
        {error ? `Couldn't locate "${destination}"` : `Locating ${destination}…`}
      </div>
    );
  }

  return (
    <MapContainer center={center} zoom={12} style={{ width: '100%', height: '100%' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {activities.map((activity, index) =>
        activity.location ? (
          <Marker
            key={activity.id}
            position={[activity.location.lat, activity.location.lng]}
            icon={createNumberedIcon(index + 1)}
          >
            <Popup>{activity.title}</Popup>
          </Marker>
        ) : null
      )}
      {positions.length > 0 && <FitToMarkers positions={positions} />}
    </MapContainer>
  );
}