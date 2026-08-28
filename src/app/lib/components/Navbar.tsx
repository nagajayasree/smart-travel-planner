'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Trip builder', href: '/trip-builder' },
  { label: 'Discover', href: '/discover' },
  { label: 'AI assistant', href: '/assistant' },
];

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
];

export default function NavBar() {
  const pathname = usePathname();
  const [langOpen, setLangOpen] = useState(false);
  const [language, setLanguage] = useState(LANGUAGES[0]);

  return (
    <div className="rounded-3xl border border-neutral-200 bg-white px-6 py-4">
      <div className="flex items-center justify-between gap-6">
        <span className="text-xl font-bold text-neutral-900">Trip Planner</span>

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

        <div className="relative">
          <button
            onClick={() => setLangOpen((open) => !open)}
            className="flex items-center gap-2 rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
          >
            {language.label}
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={`transition-transform ${langOpen ? 'rotate-180' : ''}`}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          {/* Language Switcher */}
          {/* {langOpen && (
            <ul className="absolute right-0 z-10 mt-2 w-36 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-md">
              {LANGUAGES.map((lang) => (
                <li key={lang.code}>
                  <button
                    onClick={() => {
                      setLanguage(lang);
                      setLangOpen(false);
                    }}
                    className={`block w-full px-4 py-2.5 text-left text-sm hover:bg-neutral-50 ${
                      lang.code === language.code
                        ? 'font-medium text-neutral-900'
                        : 'text-neutral-600'
                    }`}
                  >
                    {lang.label}
                  </button>
                </li>
              ))}
            </ul>
          )} */}
        </div>
      </div>
    </div>
  );
}
