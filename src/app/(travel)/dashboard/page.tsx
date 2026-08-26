'use client';

import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../lib/hooks';
import {
  addTrip,
  deleteTrip,
  editTrip,
} from '../../lib/features/trips/tripsSlice';
import DatePickerInput from '@/app/lib/components/DatePickerInput';

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

    dispatch(addTrip({ title, destination, startDate, endDate }));

    setTitle('');
    setDestination('');
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
        <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
          {trips.map((trip) => (
            <li
              key={trip.id}
              className="flex flex-wrap items-center justify-between gap-2 py-3"
            >
              {editingId === trip.id ? (
                <>
                  <span className="text-sm text-neutral-900 dark:text-neutral-100">
                    {trip.title} —
                  </span>
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    autoFocus
                    className={`flex-1 ${inputClasses}`}
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => saveEdit(trip.id)}
                      className="text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="text-sm font-medium text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <span className="text-sm flex gap-2 text-neutral-900 dark:text-neutral-100">
                    <span className="font-medium">{trip.title}</span>
                    <span className="text-neutral-900 dark:text-neutral-100">
                      {' '}
                      — {trip.destination}
                    </span>
                    <span>
                      {trip.startDate} - {trip.endDate}
                    </span>
                  </span>
                  <div className="flex gap-3">
                    <button
                      onClick={() => startEditing(trip.id, trip.destination)}
                      className="text-sm font-medium text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => dispatch(deleteTrip(trip.id))}
                      className="text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
