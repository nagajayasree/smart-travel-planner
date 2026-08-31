/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useAppDispatch, useAppSelector } from '@/app/lib/hooks';
import {
  addActivity,
  type Activity,
} from '@/app/lib/features/trips/tripsSlice';
import { getDatesInRange, formatDayLabel } from '@/app/lib/utils/date';

interface OverpassElement {
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: {
    name?: string;
    amenity?: string;
    tourism?: string;
    [key: string]: string | undefined;
  };
}

interface OverpassResponse {
  elements: OverpassElement[];
}

const DiscoverMap = dynamic(() => import('@/app/lib/components/DiscoverMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-neutral-400 dark:text-neutral-500">
      Loading map…
    </div>
  ),
});

type Category = 'all' | 'restaurants' | 'attractions' | 'hotels';

const CATEGORIES: { key: Category; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'restaurants', label: 'Restaurants' },
  { key: 'attractions', label: 'Attractions' },
  { key: 'hotels', label: 'Hotels' },
];

const TAG_QUERIES: Record<Exclude<Category, 'all'>, string> = {
  restaurants: 'amenity=restaurant',
  attractions: 'tourism=attraction',
  hotels: 'tourism=hotel',
};

const CATEGORY_LABELS: Record<string, string> = {
  restaurant: 'Restaurant',
  attraction: 'Attraction',
  hotel: 'Hotel',
};

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.openstreetmap.ru/api/interpreter',
];

interface Place {
  id: string;
  name: string;
  category: 'restaurant' | 'attraction' | 'hotel';
  lat: number;
  lng: number;
  distanceMi: number;
}

function toRad(value: number) {
  return (value * Math.PI) / 180;
}

function haversineMiles(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
) {
  const R = 3958.8;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function DiscoverPage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category>('all');
  const [center, setCenter] = useState<[number, number] | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locatingUser, setLocatingUser] = useState(true);

  const dispatch = useAppDispatch();
  const trips = useAppSelector((state) => state.trip.trips);

  const [addingPlaceId, setAddingPlaceId] = useState<string | null>(null);
  const [selectedTripId, setSelectedTripId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [addedPlaceId, setAddedPlaceId] = useState<string | null>(null);

  const lastFetchKeyRef = useRef<string | null>(null);
  const latestRequestRef = useRef(0);

  const schedulableTrips = trips.filter(
    (trip) => trip.startDate && trip.endDate,
  );

  const activeTrip = schedulableTrips.find(
    (trip) => trip.id === selectedTripId,
  );
  const availableDates = activeTrip
    ? getDatesInRange(activeTrip.startDate!, activeTrip.endDate!)
    : [];

  const openAddToTrip = (placeId: string) => {
    setAddingPlaceId(placeId);
    setSelectedTripId(schedulableTrips[0]?.id ?? '');
    setSelectedDate('');
  };

  const handleAddToTrip = (place: Place) => {
    if (!selectedTripId || !selectedDate) return;

    const activity: Activity = {
      id: crypto.randomUUID(),
      title: place.name,
      category: CATEGORY_LABELS[place.category],
      location: { lat: place.lat, lng: place.lng, address: place.name },
    };

    dispatch(
      addActivity({ tripId: selectedTripId, date: selectedDate, activity }),
    );
    setAddingPlaceId(null);
    setAddedPlaceId(place.id);
    setTimeout(() => setAddedPlaceId(null), 2000);
  };

  const searchDestination = useCallback(async (destination: string) => {
    if (!destination.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(destination)}&limit=1`,
      );
      const geoData = await geoRes.json();

      if (!geoData?.[0]) {
        setError(`Couldn't find "${destination}"`);
        setLoading(false);
        return;
      }

      setCenter([parseFloat(geoData[0].lat), parseFloat(geoData[0].lon)]);
    } catch {
      setError('Something went wrong searching for that place.');
      setLoading(false);
    }
  }, []);

  const fetchPlaces = useCallback(
    async (lat: number, lng: number, cat: Category) => {
      // Round to ~100m so tiny geolocation jitter doesn't count as a new query.
      const fetchKey = `${lat.toFixed(3)},${lng.toFixed(3)},${cat}`;
      if (lastFetchKeyRef.current === fetchKey) return;

      const requestId = ++latestRequestRef.current;

      setLoading(true);
      setError(null);

      const tags =
        cat === 'all' ? Object.values(TAG_QUERIES) : [TAG_QUERIES[cat]];
      const clauses = tags
        .map((tag) => {
          const [key, value] = tag.split('=');
          return `node["${key}"="${value}"](around:4000,${lat},${lng});`;
        })
        .join('\n');
      const overpassQuery = `[out:json][timeout:25];(${clauses});out center;`;

      let lastStatus: number | null = null;

      try {
        for (const endpoint of OVERPASS_ENDPOINTS) {
          let res: Response;
          try {
            res = await fetch(endpoint, {
              method: 'POST',
              body: overpassQuery,
            });
          } catch {
            // Network-level failure (e.g. mirror unreachable) -- try the next one.
            continue;
          }

          // A newer request started while this one was in flight -- ignore
          // everything from here on, this response is stale.
          if (requestId !== latestRequestRef.current) return;

          if (res.status === 429) {
            lastStatus = 429;
            continue; // try the next mirror
          }

          if (!res.ok) {
            lastStatus = res.status;
            continue;
          }

          const data: OverpassResponse = await res.json();

          if (requestId !== latestRequestRef.current) return;

          const parsed: Place[] = data.elements
            .map((el): Place | null => {
              const name = el.tags?.name;
              const placeLat = el.lat ?? el.center?.lat;
              const placeLng = el.lon ?? el.center?.lon;

              if (!name || placeLat === undefined || placeLng === undefined) {
                return null;
              }

              const placeCategory: Place['category'] =
                el.tags?.amenity === 'restaurant'
                  ? 'restaurant'
                  : el.tags?.tourism === 'hotel'
                    ? 'hotel'
                    : 'attraction';

              return {
                id: String(el.id),
                name,
                category: placeCategory,
                lat: placeLat,
                lng: placeLng,
                distanceMi: haversineMiles(lat, lng, placeLat, placeLng),
              };
            })
            .filter((place): place is Place => place !== null)
            .sort((a, b) => a.distanceMi - b.distanceMi)
            .slice(0, 8);

          setPlaces(parsed);
          lastFetchKeyRef.current = fetchKey;
          setLoading(false);
          return; // success -- done, skip the remaining mirrors
        }

        // Every mirror failed.
        if (requestId === latestRequestRef.current) {
          setError(
            lastStatus === 429
              ? 'The map data service is rate-limited right now — wait a moment and try again.'
              : 'Could not load places right now.',
          );
        }
      } finally {
        if (requestId === latestRequestRef.current) {
          setLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;

    const fallbackToIpLocation = async () => {
      try {
        const res = await fetch('https://ipapi.co/json/');
        if (!res.ok) throw new Error('IP lookup failed');
        const data = await res.json();
        if (!cancelled && data.latitude && data.longitude) {
          console.log(
            'falling back to IP-based location:',
            data.latitude,
            data.longitude,
          );
          setCenter([data.latitude, data.longitude]);
        }
      } catch (err) {
        console.error('IP fallback failed:', err);
      } finally {
        if (!cancelled) setLocatingUser(false);
      }
    };

    queueMicrotask(() => {
      if (cancelled) return;
      console.log('geolocation available?', !!navigator.geolocation);

      if (!navigator.geolocation) {
        fallbackToIpLocation();
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (cancelled) return;
          console.log(
            'geolocation success:',
            position.coords.latitude,
            position.coords.longitude,
          );
          setCenter([position.coords.latitude, position.coords.longitude]);
          setLocatingUser(false);
        },
        (geoError) => {
          console.warn(
            'geolocation unavailable, falling back to IP lookup:',
            geoError.code,
            geoError.message,
          );
          if (!cancelled) fallbackToIpLocation();
        },
        { enableHighAccuracy: false, timeout: 15000, maximumAge: 60_000 },
      );
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!center) return;

    let cancelled = false;

    queueMicrotask(() => {
      if (!cancelled) {
        fetchPlaces(center[0], center[1], category);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [center, category, fetchPlaces]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          placeholder="Search destinations, cities, POIs"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && searchDestination(query)}
          className="min-w-[240px] flex-1 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500 dark:focus:ring-neutral-100"
        />
        <button
          onClick={() => searchDestination(query)}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:opacity-90 dark:bg-white dark:text-neutral-900"
        >
          Search
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            onClick={() => setCategory(c.key)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
              category === c.key
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300'
                : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {error && (
        <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.1fr]">
        <div className="min-h-[500px] overflow-hidden rounded-2xl">
          {center ? (
            <DiscoverMap center={center} places={places} />
          ) : locatingUser ? (
            <div className="flex h-full min-h-[500px] items-center justify-center rounded-2xl bg-neutral-100 text-sm text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500">
              Finding your location…
            </div>
          ) : (
            <div className="flex h-full min-h-[500px] items-center justify-center rounded-2xl bg-neutral-100 text-sm text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500">
              Search a destination to see the map
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          {loading && (
            <p className="text-sm text-neutral-400 dark:text-neutral-500">
              Loading places…
            </p>
          )}

          {!loading && center && places.length === 0 && !error && (
            <p className="text-sm text-neutral-400 dark:text-neutral-500">
              No places found nearby.
            </p>
          )}

          {places.length > 0 && (
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
              Top {places.length} nearby
            </p>
          )}

          {places.map((place) => (
            <div
              key={place.id}
              className="rounded-xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                      {place.name}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {CATEGORY_LABELS[place.category]} ·{' '}
                      {place.distanceMi.toFixed(1)} mi
                    </p>
                  </div>
                </div>

                <button
                  onClick={() =>
                    addingPlaceId === place.id
                      ? setAddingPlaceId(null)
                      : openAddToTrip(place.id)
                  }
                  className="shrink-0 rounded-full border border-neutral-200 px-3 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  {addedPlaceId === place.id
                    ? 'Added ✓'
                    : addingPlaceId === place.id
                      ? 'Cancel'
                      : '+ Add to trip'}
                </button>
              </div>

              {addingPlaceId === place.id && (
                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-neutral-100 pt-3 dark:border-neutral-800">
                  {schedulableTrips.length === 0 ? (
                    <p className="text-xs text-neutral-400 dark:text-neutral-500">
                      You don&apos;t have any trips with dates set yet — add one
                      from the Dashboard first.
                    </p>
                  ) : (
                    <>
                      <select
                        value={selectedTripId}
                        onChange={(e) => {
                          setSelectedTripId(e.target.value);
                          setSelectedDate('');
                        }}
                        className="rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-xs text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                      >
                        {schedulableTrips.map((trip) => (
                          <option key={trip.id} value={trip.id}>
                            {trip.title}
                          </option>
                        ))}
                      </select>

                      <select
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-xs text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                      >
                        <option value="">Select day</option>
                        {availableDates.map((date) => (
                          <option key={date} value={date}>
                            {formatDayLabel(date)}
                          </option>
                        ))}
                      </select>

                      <button
                        onClick={() => handleAddToTrip(place)}
                        disabled={!selectedTripId || !selectedDate}
                        className="rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40 dark:bg-white dark:text-neutral-900"
                      >
                        Add
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
