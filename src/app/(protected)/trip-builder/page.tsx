'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/app/lib/hooks';

export default function TripBuilderIndexPage() {
  const router = useRouter();
  const trips = useAppSelector((state) => state.trip.trips);

  useEffect(() => {
    if (trips.length > 0) {
      router.replace(`/trip-builder/${trips[0].id}`);
    }
  }, [trips, router]);

  if (trips.length === 0) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 text-center dark:border-neutral-800 dark:bg-neutral-900">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          No trips created
        </p>
      </div>
    );
  }

  return null;
}
