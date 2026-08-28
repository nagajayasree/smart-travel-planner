'use client';

import { useEffect, useRef, useState } from 'react';

interface LocationResult {
  lat: number;
  lng: number;
  address: string;
}

interface NominatimSearchResult {
  lat: string;
  lon: string;
  display_name: string;
}

interface LocationSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (location: LocationResult) => void;
  placeholder?: string;
}

export default function LocationSearchInput({
  value,
  onChange,
  onSelect,
  placeholder = 'Search for a place',
}: LocationSearchInputProps) {
  const [results, setResults] = useState<LocationResult[]>([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!value.trim()) {
      return; // no setState here — the render guard below hides stale results
    }

    debounceRef.current = setTimeout(() => {
      fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&limit=5`,
      )
        .then((res) => res.json())
        .then((data) => {
          setResults(
            data.map((item: NominatimSearchResult) => ({
              lat: parseFloat(item.lat),
              lng: parseFloat(item.lon),
              address: item.display_name,
            })),
          );
          setOpen(true);
        })
        .catch(() => setResults([]));
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value]);

  return (
    <div className="relative">
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500 dark:focus:ring-neutral-100"
      />
      {open && value.trim() && results.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-neutral-200 bg-white shadow-md dark:border-neutral-800 dark:bg-neutral-900">
          {results.map((result, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => {
                  onSelect(result);
                  setOpen(false);
                }}
                className="block w-full px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800"
              >
                {result.address}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
