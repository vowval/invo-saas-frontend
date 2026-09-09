'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const { isAuthenticated, logout, user } = useAuth();

  if (!isAuthenticated || !user) return null;
  if (user.role === 'SUPER_ADMIN') {
    return (
      <nav className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-slate-950 px-6 py-4 text-white">
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
    <nav className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-6 py-4 shadow-sm backdrop-blur">
      {/* LEFT: COMPANY NAME */}
      <Link href="/dashboard" className="font-bold text-lg text-indigo-700">
        {user.companyName}
      </Link>

      {/* CENTER */}
      <div className="flex flex-wrap gap-2 text-sm font-medium text-slate-600">
        <Link className="rounded-full px-3 py-1.5 hover:bg-indigo-50 hover:text-indigo-700" href="/dashboard">Dashboard</Link>
        <Link className="rounded-full px-3 py-1.5 hover:bg-indigo-50 hover:text-indigo-700" href="/dyeing-jobs">Jobs</Link>
        <Link className="rounded-full px-3 py-1.5 hover:bg-indigo-50 hover:text-indigo-700" href="/production-board">Production Board</Link>
        <Link className="rounded-full px-3 py-1.5 hover:bg-indigo-50 hover:text-indigo-700" href="/machines">Machines</Link>
        <Link className="rounded-full px-3 py-1.5 hover:bg-indigo-50 hover:text-indigo-700" href="/recipes">Recipes</Link>
        <Link className="rounded-full px-3 py-1.5 hover:bg-indigo-50 hover:text-indigo-700" href="/chemicals">Chemicals</Link>
        <Link className="rounded-full px-3 py-1.5 hover:bg-indigo-50 hover:text-indigo-700" href="/products">Services</Link>
        <Link className="rounded-full px-3 py-1.5 hover:bg-indigo-50 hover:text-indigo-700" href="/invoices">Invoices</Link>
      </div>

      {/* RIGHT: USER + LOGOUT */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600">
          Hi, {user.userName}
        </span>

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
    </nav>
  );
}
