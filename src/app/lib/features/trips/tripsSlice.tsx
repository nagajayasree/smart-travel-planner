import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Activity {
  id: string;
  title: string;
  time?: string;
  category?: string;
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
}

export interface Trip {
  id: string;
  title: string;
  destination: string;
  startDate?: string;
  endDate?: string;
  activities: Record<string, Activity[]>;
}

interface TripState {
  trips: Trip[];
}

const initialState: TripState = { trips: [] };

const tripSlice = createSlice({
  name: 'trip',
  initialState,
  reducers: {
    addTrip: {
      reducer: (state, action: PayloadAction<Trip>) => {
        state.trips.push(action.payload);
      },
      prepare: (trip: Omit<Trip, 'id'>) => ({
        payload: { ...trip, id: crypto.randomUUID(), activities: {} },
      }),
    },
    deleteTrip: (state, action: PayloadAction<string>) => {
      state.trips = state.trips.filter((trip) => trip.id !== action.payload);
    },
    editTrip: (
      state,
      action: PayloadAction<{ id: string; destination: string }>,
    ) => {
      const trip = state.trips.find((t) => t.id === action.payload.id);
      if (trip) {
        trip.destination = action.payload.destination;
      }
    },
    addActivity: (
      state,
      action: PayloadAction<{
        tripId: string;
        date: string;
        activity: Activity;
      }>,
    ) => {
      const trip = state.trips.find((t) => t.id === action.payload.tripId);
      if (!trip) return;
      if (!trip.activities) trip.activities = {};
      if (!trip.activities[action.payload.date]) {
        trip.activities[action.payload.date] = [];
      }
      trip.activities[action.payload.date].push(action.payload.activity);
    },
    deleteActivity: (
      state,
      action: PayloadAction<{ tripId: string; date: string; index: number }>,
    ) => {
      const trip = state.trips.find((t) => t.id === action.payload.tripId);
      trip?.activities?.[action.payload.date]?.splice(action.payload.index, 1);
    },
    editActivity: (
      state,
      action: PayloadAction<{
        tripId: string;
        date: string;
        activityId: string;
        title: string;
        time?: string;
        category?: string;
        location?: { lat: number; lng: number; address?: string };
      }>,
    ) => {
      const trip = state.trips.find((t) => t.id === action.payload.tripId);
      const activity = trip?.activities?.[action.payload.date]?.find(
        (a) => a.id === action.payload.activityId,
      );
      if (!activity) return;

      activity.title = action.payload.title;
      activity.time = action.payload.time;
      activity.category = action.payload.category;
      activity.location = action.payload.location;
    },
  },
});

export const {
  addTrip,
  deleteTrip,
  editTrip,
  addActivity,
  deleteActivity,
  editActivity,
} = tripSlice.actions;
export default tripSlice.reducer;
