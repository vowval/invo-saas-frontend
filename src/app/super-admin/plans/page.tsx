'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

type Plan = {
  id: string;
  name: string;
  description: string;
  maxUsers: number;
  invoiceLimit: number | null;
  priceInr: number | string;
  billingCycle: string;
  durationMonths: number | null;
  requiresPayment: boolean;
  active: boolean;
};

const emptyPlan = {
  id: '',
  name: '',
  description: '',
  billingCycle: 'MONTHLY',
  maxUsers: '5',
  invoiceLimit: '',
  priceInr: '0',
  durationMonths: '1',
};

export default function SuperAdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [newPlan, setNewPlan] = useState(emptyPlan);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState('');

  async function load() {
    try {
      setPlans(await apiFetch('/super-admin/plans'));
    } catch {
      setError('Unable to load subscription plans.');
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function updatePlan(plan: Plan, field: string, value: string | boolean) {
    setSaving(`plan-${plan.id}`);
    setError('');
    try {
      await apiFetch(`/super-admin/plans/${plan.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          [field]: field === 'active'
            ? value
            : field === 'priceInr' || field === 'maxUsers' || field === 'invoiceLimit'
              ? (value === '' && field === 'invoiceLimit' ? null : Number(value))
              : value,
        }),
      });
      await load();
    } catch {
      setError('Unable to update plan settings.');
    } finally {
      setSaving('');
    }
  }

  async function createPlan(event: React.FormEvent) {
    event.preventDefault();
    setSaving('new-plan');
    setError('');
    try {
      await apiFetch('/super-admin/plans', {
        method: 'POST',
        body: JSON.stringify({
          ...newPlan,
          maxUsers: Number(newPlan.maxUsers),
          invoiceLimit: newPlan.invoiceLimit ? Number(newPlan.invoiceLimit) : null,
          priceInr: Number(newPlan.priceInr),
          durationMonths: newPlan.durationMonths ? Number(newPlan.durationMonths) : null,
        }),
      });
      setNewPlan(emptyPlan);
      await load();
    } catch {
      setError('Unable to create plan. Use a unique plan ID and valid values.');
    } finally {
      setSaving('');
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-2xl bg-gradient-to-r from-slate-950 to-indigo-900 p-8 text-white shadow-lg">
          <p className="text-sm uppercase tracking-widest text-cyan-300">Platform control</p>
          <h1 className="mt-2 text-3xl font-bold">Subscription plans</h1>
          <p className="mt-3 max-w-3xl text-slate-300">
            Manage current plans, pricing, limits, and availability for new registrations.
            Deactivated plans remain visible here for reactivation.
          </p>
        </header>

        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <section className="grid gap-4 lg:grid-cols-2">
          {plans.map(plan => (
            <article key={plan.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">{plan.id}</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{plan.name}</p>
                </div>
                <button
                  type="button"
                  disabled={saving === `plan-${plan.id}`}
                  onClick={() => updatePlan(plan, 'active', !plan.active)}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${plan.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}
                >
                  {plan.active ? 'Deactivate plan' : 'Activate plan'}
                </button>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <input className="rounded-lg border p-2" value={plan.name} onChange={e => setPlans(current => current.map(item => item.id === plan.id ? { ...item, name: e.target.value } : item))} onBlur={e => updatePlan(plan, 'name', e.target.value)} />
                <input type="number" min="0" step="0.01" className="rounded-lg border p-2" value={plan.priceInr} onChange={e => setPlans(current => current.map(item => item.id === plan.id ? { ...item, priceInr: e.target.value } : item))} onBlur={e => updatePlan(plan, 'priceInr', e.target.value)} />
                <input type="number" min="1" className="rounded-lg border p-2" value={plan.maxUsers} onChange={e => setPlans(current => current.map(item => item.id === plan.id ? { ...item, maxUsers: Number(e.target.value) } : item))} onBlur={e => updatePlan(plan, 'maxUsers', e.target.value)} />
                <input type="number" min="1" placeholder="Invoice limit (blank = unlimited)" className="rounded-lg border p-2" value={plan.invoiceLimit ?? ''} onChange={e => setPlans(current => current.map(item => item.id === plan.id ? { ...item, invoiceLimit: e.target.value ? Number(e.target.value) : null } : item))} onBlur={e => updatePlan(plan, 'invoiceLimit', e.target.value)} />
              </div>
            </article>
          ))}
        </section>

        <form onSubmit={createPlan} className="rounded-2xl border border-dashed border-indigo-300 bg-indigo-50 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-indigo-950">Add a new plan</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <input className="rounded-lg border p-2" placeholder="Plan ID" value={newPlan.id} onChange={e => setNewPlan({ ...newPlan, id: e.target.value })} required />
            <input className="rounded-lg border p-2" placeholder="Plan name" value={newPlan.name} onChange={e => setNewPlan({ ...newPlan, name: e.target.value })} required />
            <input className="rounded-lg border p-2" placeholder="Description" value={newPlan.description} onChange={e => setNewPlan({ ...newPlan, description: e.target.value })} required />
            <select className="rounded-lg border p-2" value={newPlan.billingCycle} onChange={e => setNewPlan({ ...newPlan, billingCycle: e.target.value })}>
              <option>MONTHLY</option><option>YEARLY</option><option>LIFETIME</option><option>FREE</option>
            </select>
            <input type="number" min="1" className="rounded-lg border p-2" placeholder="Max users" value={newPlan.maxUsers} onChange={e => setNewPlan({ ...newPlan, maxUsers: e.target.value })} required />
            <input type="number" min="0" className="rounded-lg border p-2" placeholder="Invoice limit (blank = unlimited)" value={newPlan.invoiceLimit} onChange={e => setNewPlan({ ...newPlan, invoiceLimit: e.target.value })} />
            <input type="number" min="0" step="0.01" className="rounded-lg border p-2" placeholder="Price INR" value={newPlan.priceInr} onChange={e => setNewPlan({ ...newPlan, priceInr: e.target.value })} required />
            <input type="number" min="1" className="rounded-lg border p-2" placeholder="Duration months" value={newPlan.durationMonths} onChange={e => setNewPlan({ ...newPlan, durationMonths: e.target.value })} />
          </div>
          <button disabled={saving === 'new-plan'} className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
            {saving === 'new-plan' ? 'Adding...' : 'Add active plan'}
          </button>
        </form>
      </div>
    </main>
  );
}
