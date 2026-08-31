import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth } from '../../../../firebase/firebaseConfig';
import { setUser, type AuthUser } from './authSlice';
import type { AppStore } from '../../store';

function toAuthUser(user: FirebaseUser | null): AuthUser | null {
  if (!user) return null;
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    emailVerified: user.emailVerified,
  };
}

export function initAuthListener(store: AppStore): () => void {
  return onAuthStateChanged(auth, (firebaseUser) => {
    store.dispatch(setUser(toAuthUser(firebaseUser)));
  });
}
