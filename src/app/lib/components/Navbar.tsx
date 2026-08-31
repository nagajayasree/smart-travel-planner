'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import UserNav from './UserNav';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Trip builder', href: '/trip-builder' },
  { label: 'Discover', href: '/discover' },
];

const HIDDEN_ROUTES = ['/login', '/signup'];

export default function NavBar() {
  const pathname = usePathname();

  if (HIDDEN_ROUTES.includes(pathname)) {
    return null;
  }

  return (
    <div className="rounded-3xl border border-neutral-200 bg-white px-6 py-4">
      <div className="flex items-center justify-between gap-6">
        <Link href={'/dashboard'}>
          <span className="text-xl font-bold text-neutral-900">
            Trip Planner
          </span>
        </Link>

        <nav className="flex items-center gap-1 rounded-2xl bg-neutral-100 p-1.5">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`min-w-[92px] rounded-xl px-4 py-2.5 text-center text-sm font-medium leading-tight transition-colors ${
                  isActive
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <UserNav />
      </div>
    </div>
  );
}
