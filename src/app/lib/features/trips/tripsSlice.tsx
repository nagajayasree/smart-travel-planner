import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Trip {
  id: string;
  title: string;
  destination: string;
  startDate?: string;
  endDate?: string;
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
        payload: { ...trip, id: crypto.randomUUID() },
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
  },
});

export const { addTrip, deleteTrip, editTrip } = tripSlice.actions;
export default tripSlice.reducer;
