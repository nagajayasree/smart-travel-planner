import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks';

import {
  loginUser,
  registerUser,
  loginWithGoogle,
  logoutUser,
  resetPassword,
  clearError,
  selectCurrentUser,
  selectAuthStatus,
  selectAuthError,
  selectIsAuthenticated,
  selectAuthInitialized,
} from './authSlice';

interface LoginArgs {
  email: string;
  password: string;
}

interface RegisterArgs {
  email: string;
  password: string;
  displayName?: string;
}

export function useAuth() {
  const dispatch = useAppDispatch();

  const user = useAppSelector(selectCurrentUser);
  const status = useAppSelector(selectAuthStatus);
  const error = useAppSelector(selectAuthError);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const initialized = useAppSelector(selectAuthInitialized);

  const login = useCallback(
    (args: LoginArgs) => dispatch(loginUser(args)),
    [dispatch],
  );

  const register = useCallback(
    (args: RegisterArgs) => dispatch(registerUser(args)),
    [dispatch],
  );

  const loginGoogle = useCallback(
    () => dispatch(loginWithGoogle()),
    [dispatch],
  );

  const logout = useCallback(() => dispatch(logoutUser()), [dispatch]);

  const sendPasswordReset = useCallback(
    (email: string) => dispatch(resetPassword(email)),
    [dispatch],
  );

  const clearAuthError = useCallback(() => dispatch(clearError()), [dispatch]);

  return {
    user,
    status,
    error,
    isAuthenticated,
    initialized,
    isLoading: status === 'loading',
    login,
    register,
    loginGoogle,
    logout,
    sendPasswordReset,
    clearAuthError,
  } as const;
}
