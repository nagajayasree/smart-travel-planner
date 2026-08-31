import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from '@reduxjs/toolkit';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  type User as FirebaseUser,
  type AuthError,
} from 'firebase/auth';
import { auth } from '@/firebase/firebaseConfig';
import { RootState } from '../../store';
import { resetStore } from '../../actions';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}

export type AuthStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

export interface AuthState {
  user: AuthUser | null;
  status: AuthStatus;
  error: string | null;
  initialized: boolean;
}

interface RegisterArgs {
  email: string;
  password: string;
  displayName?: string;
}

interface LoginArgs {
  email: string;
  password: string;
}

interface ThunkApiConfig {
  rejectValue: string;
}

function serializeUser(user: FirebaseUser): AuthUser;
function serializeUser(user: null): null;
function serializeUser(user: FirebaseUser | null): AuthUser | null {
  if (!user) return null;
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    emailVerified: user.emailVerified,
  };
}

export const registerUser = createAsyncThunk<
  AuthUser,
  RegisterArgs,
  ThunkApiConfig
>(
  'auth/registerUser',
  async ({ email, password, displayName }, { rejectWithValue }) => {
    try {
      const { user } = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      if (displayName) {
        await updateProfile(user, { displayName });
      }
      return serializeUser(user);
    } catch (error) {
      return rejectWithValue(mapFirebaseError(error as AuthError));
    }
  },
);

export const loginUser = createAsyncThunk<AuthUser, LoginArgs, ThunkApiConfig>(
  'auth/loginUser',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      return serializeUser(user);
    } catch (error) {
      return rejectWithValue(mapFirebaseError(error as AuthError));
    }
  },
);

export const loginWithGoogle = createAsyncThunk<AuthUser, void, ThunkApiConfig>(
  'auth/loginWithGoogle',
  async (_, { rejectWithValue }) => {
    try {
      const provider = new GoogleAuthProvider();
      const { user } = await signInWithPopup(auth, provider);
      return serializeUser(user);
    } catch (error) {
      return rejectWithValue(mapFirebaseError(error as AuthError));
    }
  },
);

export const logoutUser = createAsyncThunk<null, void, ThunkApiConfig>(
  'auth/logoutUser',
  async (_, { rejectWithValue, dispatch }) => {
    try {
      await signOut(auth);
      dispatch(resetStore());
      return null;
    } catch (error) {
      return rejectWithValue(mapFirebaseError(error as AuthError));
    }
  },
);

export const resetPassword = createAsyncThunk<string, string, ThunkApiConfig>(
  'auth/resetPassword',
  async (email, { rejectWithValue }) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return email;
    } catch (error) {
      return rejectWithValue(mapFirebaseError(error as AuthError));
    }
  },
);

function mapFirebaseError(error: AuthError): string {
  const map: Record<string, string> = {
    'auth/email-already-in-use': 'That email is already registered.',
    'auth/invalid-email': 'That email address looks invalid.',
    'auth/weak-password': 'Password should be at least 6 characters.',
    'auth/user-not-found': 'No account found with that email.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/invalid-credential': 'Incorrect email or password.',
    'auth/too-many-requests': 'Too many attempts. Try again later.',
  };
  return map[error.code] ?? error.message ?? 'Something went wrong.';
}

const initialState: AuthState = {
  user: null,
  status: 'idle',
  error: null,
  initialized: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<AuthUser | null>) {
      state.user = action.payload;
      state.initialized = true;
      state.status = 'succeeded';
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // registerUser
      .addCase(registerUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? 'Registration failed.';
      })
      // loginUser
      .addCase(loginUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? 'Login failed.';
      })
      // loginWithGoogle
      .addCase(loginWithGoogle.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginWithGoogle.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload;
      })
      .addCase(loginWithGoogle.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? 'Google sign-in failed.';
      })
      // logoutUser
      .addCase(logoutUser.fulfilled, (state) => {
        state.status = 'idle';
        state.user = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? 'Sign-out failed.';
      })
      // resetPassword
      .addCase(resetPassword.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.status = 'succeeded';
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? 'Could not send reset email.';
      });
  },
});

export const { setUser, clearError } = authSlice.actions;

export const selectCurrentUser = (state: RootState): AuthUser | null =>
  state.auth.user;
export const selectAuthStatus = (state: RootState): AuthStatus =>
  state.auth.status;
export const selectAuthError = (state: RootState): string | null =>
  state.auth.error;
export const selectIsAuthenticated = (state: RootState): boolean =>
  Boolean(state.auth.user);
export const selectAuthInitialized = (state: RootState): boolean =>
  state.auth.initialized;

export default authSlice.reducer;
