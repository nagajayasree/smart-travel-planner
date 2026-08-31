'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/app/lib/hooks';
import {
  addActivity,
  deleteActivity,
  editActivity,
  Activity,
} from '@/app/lib/features/trips/tripsSlice';
import {
  getDatesInRange,
  formatDateRange,
  getTripDuration,
  formatDayLabel,
} from '@/app/lib/utils/date';
import LocationSearchInput from '@/app/lib/components/LocationSearchInput';
import TripMap from '@/app/lib/components/TripMap';

export default function TripBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const trip = useAppSelector((state) =>
    state.trip.trips.find((t) => t.id === id),
  );

  const [selectedDay, setSelectedDay] = useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newLocationQuery, setNewLocationQuery] = useState('');
  const [newLocation, setNewLocation] = useState<Activity['location'] | null>(
    null,
  );

  const [editingActivityId, setEditingActivityId] = useState<string | null>(
    null,
  );
  const [editTitle, setEditTitle] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editLocationQuery, setEditLocationQuery] = useState('');
  const [editLocation, setEditLocation] = useState<Activity['location'] | null>(
    null,
  );

  if (!trip) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Trip not found.
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          className="mt-3 text-sm font-medium text-neutral-900 underline dark:text-neutral-100"
        >
          Back to dashboard
        </button>
      </div>
    );
  }

  if (!trip.startDate || !trip.endDate) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Add a start and end date to this trip before planning activities.
        </p>
      </div>
    );
  }

  const days = getDatesInRange(trip.startDate, trip.endDate);
  const activeDate = days[selectedDay];
  const activities = trip.activities?.[activeDate] ?? [];
  const duration = getTripDuration(trip.startDate, trip.endDate);

  const handleAddActivity = () => {
    if (!newTitle.trim()) return;

    dispatch(
      addActivity({
        tripId: trip.id,
        date: activeDate,
        activity: {
          id: crypto.randomUUID(),
          title: newTitle.trim(),
          time: newTime || undefined,
          category: newCategory.trim() || undefined,
          location: newLocation ?? undefined,
        },
      }),
    );

    setNewTitle('');
    setNewTime('');
    setNewCategory('');
    setIsAdding(false);
    setNewLocationQuery('');
    setNewLocation(null);
  };

  const startEditingActivity = (activity: Activity) => {
    setEditingActivityId(activity.id);
    setEditTitle(activity.title);
    setEditTime(activity.time ?? '');
    setEditCategory(activity.category ?? '');
    setEditLocationQuery(activity.location?.address ?? '');
    setEditLocation(activity.location ?? null);
  };

  const cancelActivityEdit = () => {
    setEditingActivityId(null);
    setEditTitle('');
    setEditTime('');
    setEditCategory('');
    setEditLocationQuery('');
    setEditLocation(null);
  };

  const saveActivityEdit = () => {
    if (!editingActivityId || !editTitle.trim()) return;

    dispatch(
      editActivity({
        tripId: trip.id,
        date: activeDate,
        activityId: editingActivityId,
        title: editTitle.trim(),
        time: editTime || undefined,
        category: editCategory.trim() || undefined,
        location: editLocation ?? undefined,
      }),
    );

    cancelActivityEdit();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            {trip.title}
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {formatDateRange(trip.startDate, trip.endDate)}
            {duration
              ? ` · ${duration} ${duration === 1 ? 'day' : 'days'}`
              : ''}
          </p>
        </div>

        {/* <div className="flex gap-2">
          <button className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800">
            Share
          </button>
          <button
            onClick={() => router.push('/ai-assistant')}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:opacity-90 dark:bg-white dark:text-neutral-900"
          >
            Ask AI
          </button>
        </div> */}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.3fr]">
        <div className="flex min-h-[420px] items-center justify-center rounded-2xl bg-neutral-100 text-sm text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500">
          {/* Map view */}
          <TripMap destination={trip.destination} activities={activities} />
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-1 rounded-xl bg-neutral-100 p-1 dark:bg-neutral-800">
            {days.map((date, index) => (
              <button
                key={date}
                onClick={() => setSelectedDay(index)}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  selectedDay === index
                    ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-900 dark:text-neutral-100'
                    : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200'
                }`}
              >
                Day {index + 1}
              </button>
            ))}
          </div>

          <p className="text-xs text-neutral-400 dark:text-neutral-500">
            {formatDayLabel(activeDate)}
          </p>

          <div className="flex flex-col gap-3">
            {activities.map((activity, index) =>
              editingActivityId === activity.id ? (
                <div
                  key={activity.id}
                  className="flex flex-col gap-2 rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
                >
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    autoFocus
                    className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500 dark:focus:ring-neutral-100"
                  />

                  <LocationSearchInput
                    value={editLocationQuery}
                    onChange={setEditLocationQuery}
                    onSelect={(location) => {
                      setEditLocation(location);
                      setEditLocationQuery(location.address);
                    }}
                    placeholder="Search for a place (optional)"
                  />

                  <div className="flex gap-2">
                    <input
                      type="time"
                      value={editTime}
                      onChange={(e) => setEditTime(e.target.value)}
                      className="flex-1 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 [color-scheme:light] focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:[color-scheme:dark] dark:focus:ring-neutral-100"
                    />
                    <input
                      type="text"
                      placeholder="Category"
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="flex-1 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500 dark:focus:ring-neutral-100"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-1">
                    <button
                      onClick={cancelActivityEdit}
                      className="text-sm font-medium text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveActivityEdit}
                      className="text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  key={activity.id}
                  className="group flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-sm font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      {activity.title}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {[activity.time, activity.category]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => startEditingActivity(activity)}
                      className="text-xs font-medium text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() =>
                        dispatch(
                          deleteActivity({
                            tripId: trip.id,
                            date: activeDate,
                            index,
                          }),
                        )
                      }
                      className="text-xs font-medium text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ),
            )}

            {isAdding ? (
              <div className="flex flex-col gap-2 rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                <input
                  type="text"
                  placeholder="Activity title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  autoFocus
                  className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500 dark:focus:ring-neutral-100"
                />

                <LocationSearchInput
                  value={newLocationQuery}
                  onChange={setNewLocationQuery}
                  onSelect={(location) => {
                    setNewLocation(location);
                    setNewLocationQuery(location.address);
                  }}
                  placeholder="Search for a place (optional)"
                />

                <div className="flex gap-2">
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="flex-1 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 [color-scheme:light] focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:[color-scheme:dark] dark:focus:ring-neutral-100"
                  />
                  <input
                    type="text"
                    placeholder="Category"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="flex-1 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500 dark:focus:ring-neutral-100"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-1">
                  <button
                    onClick={() => setIsAdding(false)}
                    className="text-sm font-medium text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddActivity}
                    className="text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsAdding(true)}
                className="rounded-xl border border-dashed border-neutral-300 py-3 text-sm font-medium text-neutral-400 hover:border-neutral-400 hover:text-neutral-600 dark:border-neutral-700 dark:text-neutral-500 dark:hover:border-neutral-600 dark:hover:text-neutral-300"
              >
                Add activity
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
