'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

type NavItem = { href: string; label: string };
type NavGroup = { label: string; items: NavItem[] };

const navGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [{ href: '/dashboard', label: 'Dashboard' }],
  },
  {
    label: 'Production',
    items: [
      { href: '/dyeing-jobs', label: 'Jobs' },
      { href: '/production-board', label: 'Production Board' },
      { href: '/machines', label: 'Machines' },
    ],
  },
  {
    label: 'Quality',
    items: [
      { href: '/lab-dips', label: 'Lab Dips' },
      { href: '/quality-control', label: 'Quality Control' },
    ],
  },
  {
    label: 'Inventory',
    items: [
      { href: '/recipes', label: 'Recipes' },
      { href: '/chemicals', label: 'Chemicals' },
    ],
  },
  {
    label: 'Billing',
    items: [
      { href: '/products', label: 'Services' },
      { href: '/invoices', label: 'Invoices' },
      { href: '/customers', label: 'Customer Ledger' },
    ],
  },
];

function GroupDropdown({ group, active }: { group: NavGroup; active: boolean }) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearCloseTimer() {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }

  function scheduleClose() {
    clearCloseTimer();
    // Small delay so moving the mouse diagonally from the button to the
    // dropdown panel doesn't cause it to close before the user gets there.
    closeTimer.current = setTimeout(() => setOpen(false), 250);
  }

  useEffect(() => () => clearCloseTimer(), []);

  return (
    <div
      className="relative"
      onMouseEnter={() => {
        clearCloseTimer();
        setOpen(true);
      }}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
          active ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-700'
        }`}
        onClick={() => setOpen(current => !current)}
      >
        {group.label} <span className="text-xs text-slate-400">▾</span>
      </button>
      {open && (
        // Invisible bridge closes the gap between the button and the panel so
        // hover doesn't drop out while crossing it.
        <div className="absolute left-0 top-full h-2 w-52" />
      )}
      {open && (
        <div className="absolute left-0 top-[calc(100%+0.5rem)] z-20 w-52 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg transition-opacity duration-150">
          {group.items.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const { isAuthenticated, logout, user } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!isAuthenticated || !user) return null;

  if (user.role === 'SUPER_ADMIN') {
    return (
      <nav className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-800 bg-slate-950 px-6 py-4 text-white">
        <Link href="/super-admin/companies" className="font-bold text-lg text-cyan-300">DyeFlow Platform</Link>
        <div className="flex items-center gap-2">
          <Link href="/super-admin/companies" className="rounded-lg px-3 py-1.5 text-sm hover:bg-slate-800">Factories</Link>
          <Link href="/super-admin/plans" className="rounded-lg px-3 py-1.5 text-sm hover:bg-slate-800">Plans</Link>
          <span className="text-sm text-slate-300">Super admin · {user.userName}</span>
          <button onClick={logout} className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm hover:bg-slate-800">Logout</button>
        </div>
      </nav>
    );
  }

  return (
    <nav className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3">
        {/* LEFT: COMPANY NAME */}
        <Link href="/dashboard" className="font-bold text-lg text-indigo-700 whitespace-nowrap">
          {user.companyName}
        </Link>

        {/* CENTER: grouped nav, desktop only */}
        <div className="hidden lg:flex flex-wrap items-center gap-1">
          {navGroups.map(group => (
            <GroupDropdown
              key={group.label}
              group={group}
              active={group.items.some(item => pathname?.startsWith(item.href))}
            />
          ))}
        </div>

        {/* RIGHT: USER + LOGOUT, desktop */}
        <div className="hidden lg:flex items-center gap-3">
          <span className="text-sm text-slate-600 whitespace-nowrap">Hi, {user.userName}</span>
          <button
            onClick={logout}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-50"
          >
            Logout
          </button>
          <Link href="/settings" className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700">
            Settings
          </Link>
        </div>

        {/* MOBILE MENU BUTTON */}
        <button
          type="button"
          className="lg:hidden rounded-lg border border-slate-200 px-3 py-2 text-slate-600"
          onClick={() => setMobileOpen(current => !current)}
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* MOBILE PANEL */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-slate-100 bg-white px-4 py-3 space-y-4">
          {navGroups.map(group => (
            <div key={group.label}>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{group.label}</p>
              <div className="mt-1 flex flex-col">
                {group.items.map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-lg px-2 py-2 text-sm ${
                      pathname?.startsWith(item.href) ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                    onClick={() => setMobileOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between border-t border-slate-100 pt-3">
            <span className="text-sm text-slate-600">Hi, {user.userName}</span>
            <div className="flex gap-2">
              <Link href="/settings" className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm text-white">Settings</Link>
              <button onClick={logout} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm">Logout</button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
