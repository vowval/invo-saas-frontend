'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useEffect } from 'react';

type Plan = {
  id: string;
  name: string;
  description: string;
  maxUsers: number;
  invoiceLimit: number | null;
  billingCycle: string;
  priceInr: number;
  requiresPayment: boolean;
};

type PlanResponse = {
  plans: Plan[];
  paymentQrCodeUrl: string | null;
};

export default function RegisterPage() {
  const { login } = useAuth();

  const [companyName, setCompanyName] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [paymentQrCodeUrl, setPaymentQrCodeUrl] = useState<string | null>(null);
  const [planId, setPlanId] = useState('FREE');
  const [error, setError] = useState('');
  const [registeredMessage, setRegisteredMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiFetch('/subscriptions/plans')
      .then((response: PlanResponse) => {
        setPlans(response.plans);
        setPaymentQrCodeUrl(response.paymentQrCodeUrl);
      })
      .catch(() => setError('Unable to load subscription plans'));
  }, []);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const cleanCompanyName = companyName.replace(/[\u0000-\u001F\u007F]/g, '').trim();
      const cleanName = name.replace(/[\u0000-\u001F\u007F]/g, '').trim();
      const normalizedEmail = email.trim().toLowerCase();
      if (cleanCompanyName.length < 2 || cleanName.length < 2) {
        setError('Enter a valid company and name');
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        setError('Enter a valid email address');
        return;
      }
      if (password.length < 8 || password.length > 128) {
        setError('Password must be between 8 and 128 characters');
        return;
      }

      // 1️⃣ Register
      await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          companyName: cleanCompanyName,
          name: cleanName,
          email: normalizedEmail,
          password,
          planId,
        }),
      });

      const selectedPlan = plans.find(plan => plan.id === planId);
      if (selectedPlan?.requiresPayment) {
        setRegisteredMessage('Registration received. Complete payment using the QR code above. Your account will be activated after administrator confirmation.');
        return;
      }

      // Free accounts can start immediately.
      const res = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: normalizedEmail, password }),
      });

      login(res.access_token);
    } catch {
      setError('Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-145px)] items-center justify-center bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 px-6 py-12">
      <form
        onSubmit={handleRegister}
        className="w-full max-w-md space-y-5 rounded-2xl border border-white/10 bg-white p-8 shadow-2xl"
      >
        <h1 className="text-xl font-semibold text-center">
          Create your workspace
        </h1>

        <p className="text-center text-sm text-slate-500">Set up your secure dyeing-factory workspace.</p>
        {error && (
          <p role="alert" className="rounded-lg bg-red-50 p-3 text-center text-sm text-red-700">
            {error}
          </p>
        )}
        {registeredMessage && (
          <p role="status" className="rounded-lg bg-emerald-50 p-3 text-center text-sm text-emerald-700">
            {registeredMessage}
          </p>
        )}

        <input
          className="w-full rounded-lg border border-slate-200 p-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          placeholder="Company Name"
          maxLength={150}
          value={companyName}
          onChange={e => setCompanyName(e.target.value)}
          required
        />

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700" htmlFor="plan">
            Choose a subscription plan
          </label>
          <select
            id="plan"
            className="w-full rounded-lg border border-slate-200 p-3"
            value={planId}
            onChange={e => setPlanId(e.target.value)}
          >
            {plans.map(plan => (
              <option key={plan.id} value={plan.id}>
                {plan.name} — {plan.priceInr === 0 ? 'Free' : `₹${plan.priceInr.toLocaleString('en-IN')}`}
              </option>
            ))}
          </select>
          {plans.find(plan => plan.id === planId) && (
            <p className="text-xs leading-5 text-slate-500">
              {plans.find(plan => plan.id === planId)?.description} Up to{' '}
              {plans.find(plan => plan.id === planId)?.maxUsers} user(s)
              {plans.find(plan => plan.id === planId)?.invoiceLimit
                ? ` and ${plans.find(plan => plan.id === planId)?.invoiceLimit} invoices.`
                : ' with unlimited invoices while active.'}
            </p>
          )}
          {plans.find(plan => plan.id === planId)?.requiresPayment && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
              <p className="font-semibold">Payment and approval required</p>
              <p className="mt-1">
                Scan the administrator payment QR code, then wait for payment confirmation and account activation.
              </p>
              {paymentQrCodeUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={paymentQrCodeUrl}
                  alt="Administrator payment QR code"
                  className="mx-auto mt-3 h-48 w-48 rounded-lg border border-amber-200 bg-white object-contain p-2"
                />
              ) : (
                <p className="mt-2 text-xs text-amber-800">
                  Payment QR code is not configured yet. Contact the administrator for payment instructions.
                </p>
              )}
            </div>
          )}
        </div>

        <input
          className="w-full rounded-lg border border-slate-200 p-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          placeholder="Your Name"
          maxLength={100}
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />

        <input
          type="email"
          className="w-full rounded-lg border border-slate-200 p-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          placeholder="Email"
          autoComplete="email"
          maxLength={254}
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          className="w-full rounded-lg border border-slate-200 p-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          placeholder="Password"
          autoComplete="new-password"
          minLength={8}
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
          {loading ? 'Registering...' : 'Register'}
        </button>

        <p className="text-sm text-center">
          Already have an account?{' '}
          <a href="/login" className="underline">
            Login
          </a>
        </p>
      </form>
    </div>
  );
}
