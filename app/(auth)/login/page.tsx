'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        setError('Enter a valid email address');
        return;
      }
      if (!password || password.length > 128) {
        setError('Enter a valid password');
        return;
      }
      const res = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: normalizedEmail, password }),
      });

      // ✅ CENTRALIZED AUTH HANDLING
      login(res.access_token);
    } catch {
      setError('Invalid credentials');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-145px)] items-center justify-center bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 px-6 py-12">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md space-y-6 rounded-2xl border border-white/10 bg-white p-8 shadow-2xl"
      >
        <h1 className="text-xl font-semibold text-center">
          Welcome back
        </h1>

        <p className="text-center text-sm text-slate-500">Sign in to manage fabric, jobs, and GST invoices.</p>
        {error && (
          <p role="alert" className="rounded-lg bg-red-50 p-3 text-center text-sm text-red-700">
            {error}
          </p>
        )}

        <input
          type="email"
          className="w-full rounded-lg border border-slate-200 p-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          placeholder="Email"
          autoComplete="email"
          maxLength={254}
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          className="w-full rounded-lg border border-slate-200 p-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          placeholder="Password"
          autoComplete="current-password"
          maxLength={128}
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-indigo-600 p-3 font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>

        <p className="text-sm text-center">
          Don&apos;t have an account?{' '}
          <a href="/register" className="underline">
            Register
          </a>
        </p>
      </form>
    </div>
  );
}
