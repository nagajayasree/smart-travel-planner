import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from '@reduxjs/toolkit';
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../../../../firebase/firebaseConfig';
import type { RootState } from '../../store';

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
  userId: string;
  title: string;
  destination: string;
  startDate?: string;
  endDate?: string;
  activities: Record<string, Activity[]>;
}

interface TripState {
  trips: Trip[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: TripState = { trips: [], status: 'idle', error: null };

const TRIPS_COLLECTION = 'trips';

export const fetchTrips = createAsyncThunk<Trip[], string>(
  'trip/fetchTrips',
  async (userId) => {
    const q = query(
      collection(db, TRIPS_COLLECTION),
      where('userId', '==', userId),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Trip);
  },
);

interface NewTripArgs {
  userId: string;
  title: string;
  destination: string;
  startDate?: string;
  endDate?: string;
}

export const addTrip = createAsyncThunk<Trip, NewTripArgs>(
  'trip/addTrip',
  async ({ userId, ...trip }) => {
    const docRef = await addDoc(collection(db, TRIPS_COLLECTION), {
      ...trip,
      userId,
      activities: {},
    });
    return { id: docRef.id, userId, activities: {}, ...trip };
  },
);

export const deleteTrip = createAsyncThunk<string, string>(
  'trip/deleteTrip',
  async (tripId) => {
    await deleteDoc(doc(db, TRIPS_COLLECTION, tripId));
    return tripId;
  },
);

interface EditTripArgs {
  id: string;
  title?: string;
  destination?: string;
  startDate?: string;
  endDate?: string;
}

export const editTrip = createAsyncThunk<EditTripArgs, EditTripArgs>(
  'trip/editTrip',
  async (payload) => {
    const { id, ...changes } = payload;
    await updateDoc(doc(db, TRIPS_COLLECTION, id), changes);
    return payload;
  },
);

interface AddActivityArgs {
  tripId: string;
  date: string;
  activity: Activity;
}

export const addActivity = createAsyncThunk<
  AddActivityArgs,
  AddActivityArgs,
  { state: RootState }
>('trip/addActivity', async (payload, { getState }) => {
  const trip = getState().trip.trips.find((t) => t.id === payload.tripId);
  const activities = { ...(trip?.activities ?? {}) };
  activities[payload.date] = [
    ...(activities[payload.date] ?? []),
    payload.activity,
  ];
  await updateDoc(doc(db, TRIPS_COLLECTION, payload.tripId), { activities });
  return payload;
});

interface DeleteActivityArgs {
  tripId: string;
  date: string;
  index: number;
}

export const deleteActivity = createAsyncThunk<
  DeleteActivityArgs,
  DeleteActivityArgs,
  { state: RootState }
>('trip/deleteActivity', async (payload, { getState }) => {
  const trip = getState().trip.trips.find((t) => t.id === payload.tripId);
  const activities = { ...(trip?.activities ?? {}) };
  const list = [...(activities[payload.date] ?? [])];
  list.splice(payload.index, 1);
  activities[payload.date] = list;
  await updateDoc(doc(db, TRIPS_COLLECTION, payload.tripId), { activities });
  return payload;
});

interface EditActivityArgs {
  tripId: string;
  date: string;
  activityId: string;
  title: string;
  time?: string;
  category?: string;
  location?: { lat: number; lng: number; address?: string };
}

export const editActivity = createAsyncThunk<
  EditActivityArgs,
  EditActivityArgs,
  { state: RootState }
>('trip/editActivity', async (payload, { getState }) => {
  const trip = getState().trip.trips.find((t) => t.id === payload.tripId);
  const activities = { ...(trip?.activities ?? {}) };
  const list = [...(activities[payload.date] ?? [])];
  const idx = list.findIndex((a) => a.id === payload.activityId);
  if (idx !== -1) {
    list[idx] = {
      ...list[idx],
      title: payload.title,
      time: payload.time,
      category: payload.category,
      location: payload.location,
    };
  }
  activities[payload.date] = list;
  await updateDoc(doc(db, TRIPS_COLLECTION, payload.tripId), { activities });
  return payload;
});

const tripSlice = createSlice({
  name: 'trip',
  initialState,
  reducers: {
    clearTrips(state) {
      state.trips = [];
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTrips.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchTrips.fulfilled, (state, action: PayloadAction<Trip[]>) => {
        state.status = 'succeeded';
        state.trips = action.payload;
      })
      .addCase(fetchTrips.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'Could not load trips.';
      })
      .addCase(addTrip.fulfilled, (state, action) => {
        state.trips.push(action.payload);
      })
      .addCase(deleteTrip.fulfilled, (state, action) => {
        state.trips = state.trips.filter((t) => t.id !== action.payload);
      })
      .addCase(editTrip.fulfilled, (state, action) => {
        const trip = state.trips.find((t) => t.id === action.payload.id);
        if (trip) {
          if (action.payload.title !== undefined)
            trip.title = action.payload.title;
          if (action.payload.destination !== undefined)
            trip.destination = action.payload.destination;
          if (action.payload.startDate !== undefined)
            trip.startDate = action.payload.startDate;
          if (action.payload.endDate !== undefined)
            trip.endDate = action.payload.endDate;
        }
      })
      .addCase(addActivity.fulfilled, (state, action) => {
        const trip = state.trips.find((t) => t.id === action.payload.tripId);
        if (!trip) return;
        if (!trip.activities) trip.activities = {};
        if (!trip.activities[action.payload.date])
          trip.activities[action.payload.date] = [];
        trip.activities[action.payload.date].push(action.payload.activity);
      })
      .addCase(deleteActivity.fulfilled, (state, action) => {
        const trip = state.trips.find((t) => t.id === action.payload.tripId);
        trip?.activities?.[action.payload.date]?.splice(
          action.payload.index,
          1,
        );
      })
      .addCase(editActivity.fulfilled, (state, action) => {
        const trip = state.trips.find((t) => t.id === action.payload.tripId);
        const activity = trip?.activities?.[action.payload.date]?.find(
          (a) => a.id === action.payload.activityId,
        );
        if (!activity) return;
        activity.title = action.payload.title;
        activity.time = action.payload.time;
        activity.category = action.payload.category;
        activity.location = action.payload.location;
      });
  },
});

export const { clearTrips } = tripSlice.actions;
export default tripSlice.reducer;
