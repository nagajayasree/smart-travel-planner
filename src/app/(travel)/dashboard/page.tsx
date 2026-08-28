'use client';

import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../lib/hooks';
import {
  addTrip,
  deleteTrip,
  editTrip,
} from '../../lib/features/trips/tripsSlice';
import DatePickerInput from '@/app/lib/components/DatePickerInput';
import TripCard from '@/app/lib/components/TripCard';

export default function TripList() {
  const trips = useAppSelector((state) => state.trip.trips);
  const dispatch = useAppDispatch();


  const [title, setTitle] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleAddTrip = () => {
    if (!title.trim() || !destination.trim()) return;

    dispatch(addTrip({ title, destination, startDate, endDate, activities: {} }));

    setTitle('');
    setDestination('');
    setStartDate('');
    setEndDate('');
  };

  const startEditing = (tripId: string, currentDestination: string) => {
    setEditingId(tripId);
    setEditValue(currentDestination);
  };

  const saveEdit = (tripId: string) => {
    if (!editValue.trim()) return;

    dispatch(editTrip({ id: tripId, destination: editValue }));

    setEditingId(null);
    setEditValue('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  const handleStartingDate = (value: string) => {
    setStartDate(value);
    console.log('StartDate:', value);
  };

  const handleEndingDate = (value: string) => {
    setEndDate(value);
    console.log('EndDate:', value);
  };

  const inputClasses =
    'w-48 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500 dark:focus:ring-neutral-100';

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-8 w-full flex flex-wrap gap-2">
        <input
          type="text"
          placeholder="Trip title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={inputClasses}
        />
        <input
          type="text"
          placeholder="Destination"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          className={inputClasses}
        />

        <DatePickerInput value={startDate} onDateChange={handleStartingDate} />
        <DatePickerInput value={endDate} onDateChange={handleEndingDate} />

        <button
          onClick={handleAddTrip}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 dark:bg-white dark:text-neutral-900"
        >
          Add trip
        </button>
      </div>

      {trips.length === 0 ? (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          No trips yet — add one above.
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {trips.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              isEditing={editingId === trip.id}
              editValue={editValue}
              onEditValueChange={setEditValue}
              onStartEdit={startEditing}
              onSaveEdit={saveEdit}
              onCancelEdit={cancelEdit}
              onDelete={(id) => dispatch(deleteTrip(id))}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
