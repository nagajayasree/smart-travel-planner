'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiUser } from 'react-icons/fi';
import { useAuth } from '../features/auth/useAuth';

export default function UserNav() {
  const { user, isAuthenticated, initialized, isLoading, logout } = useAuth();
  const router = useRouter();

  if (!initialized) {
    return (
      <div className="h-[42px] w-[104px] animate-pulse rounded-xl bg-neutral-100" />
    );
  }

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (isAuthenticated && user) {
    return (
      <button
        type="button"
        onClick={handleLogout}
        disabled={isLoading}
        aria-label={`Log out of ${user.displayName ?? user.email ?? 'your account'}`}
        className="flex items-center gap-2 rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-800 hover:bg-neutral-50 disabled:opacity-60"
      >
        <Avatar name={user.displayName ?? user.email} />
        <span>{isLoading ? 'Logging out...' : 'Logout'}</span>
      </button>
    );
  }

  return (
    <Link
      href="/login"
      className="flex items-center gap-2 rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
    >
      <FiUser size={18} className="text-neutral-500" aria-hidden="true" />
      <span>Login</span>
    </Link>
  );
}

function Avatar({ name }: { name: string | null }) {
  const initial = name?.trim()?.[0]?.toUpperCase();
  if (initial) {
    return (
      <span
        aria-hidden="true"
        className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-900 text-xs font-semibold text-white"
      >
        {initial}
      </span>
    );
  }

  return <FiUser size={18} className="text-neutral-500" aria-hidden="true" />;
}
