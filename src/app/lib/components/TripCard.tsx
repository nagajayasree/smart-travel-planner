'use client';

import { Trip } from '../../lib/features/trips/tripsSlice';
import { useRouter } from 'next/navigation';
import { formatDate, getTripDuration } from '../utils/date';
import DatePickerInput from './DatePickerInput';

export interface TripEditForm {
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
}

interface TripCardProps {
  trip: Trip;
  isEditing: boolean;
  editForm: TripEditForm;
  onEditFormChange: (form: TripEditForm) => void;
  onStartEdit: (trip: Trip) => void;
  onSaveEdit: (tripId: string) => void;
  onCancelEdit: () => void;
  onDelete: (tripId: string) => void;
}

const inputClasses =
  'w-48 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500 dark:focus:ring-neutral-100';

export default function TripCard({
  trip,
  isEditing,
  editForm,
  onEditFormChange,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
}: TripCardProps) {
  const router = useRouter();

  const setField = (field: keyof TripEditForm, value: string) => {
    onEditFormChange({ ...editForm, [field]: value });
  };

  return (
    <li
      onClick={() => {
        if (!isEditing) router.push(`/trip-builder/${trip.id}`);
      }}
      className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
    >
      {isEditing ? (
        <>
          <input
            type="text"
            value={editForm.title}
            onChange={(e) => setField('title', e.target.value)}
            onClick={(e) => e.stopPropagation()}
            placeholder="Trip title"
            autoFocus
            className={inputClasses}
          />
          <input
            type="text"
            value={editForm.destination}
            onChange={(e) => setField('destination', e.target.value)}
            onClick={(e) => e.stopPropagation()}
            placeholder="Destination"
            className={inputClasses}
          />
          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            <DatePickerInput
              value={editForm.startDate}
              onDateChange={(value) => setField('startDate', value)}
            />
            <DatePickerInput
              value={editForm.endDate}
              onDateChange={(value) => setField('endDate', value)}
            />
          </div>

          <div className="mt-auto flex justify-end gap-3 border-t border-neutral-100 pt-3 dark:border-neutral-800">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSaveEdit(trip.id);
              }}
              className="text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
            >
              Save
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCancelEdit();
              }}
              className="text-sm font-medium text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300"
            >
              Cancel
            </button>
          </div>
        </>
      ) : (
        <>
          <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
            {trip.title}
          </h3>

          <p className="text-sm text-neutral-900 dark:text-neutral-400">
            {trip.destination}
          </p>

          {(trip.startDate || trip.endDate) && (
            <p className="text-xs text-neutral-800 dark:text-neutral-500">
              {formatDate(trip.startDate)} to {formatDate(trip.endDate)}
              {(() => {
                const duration = getTripDuration(trip.startDate, trip.endDate);
                return duration ? (
                  <span>
                    {' '}
                    ({duration} {duration === 1 ? 'day' : 'days'})
                  </span>
                ) : null;
              })()}
            </p>
          )}

          <div className="mt-auto flex justify-end gap-3 border-t border-neutral-150 pt-3 dark:border-neutral-800">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStartEdit(trip);
              }}
              className="text-sm font-medium text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"
            >
              Edit
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(trip.id);
              }}
              className="text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              Delete
            </button>
          </div>
        </>
      )}
    </li>
  );
}
