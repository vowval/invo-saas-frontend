'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

type Plan = {
  id: string;
  name: string;
  description: string;
  maxUsers: number;
  invoiceLimit: number | null;
  priceInr: number;
  billingCycle: string;
  durationMonths: number | null;
  requiresPayment: boolean;
  active: boolean;
};

type Company = {
  id: string;
  name: string;
  subscriptionPlan: string;
  billingCycle: string;
  subscriptionStatus: string;
  maxUsers: number;
  invoiceLimit: number | null;
  invoicesUsed: number;
  subscriptionExpiresAt: string | null;
  users: Array<{ id: string; name: string; email: string; role: string }>;
  lifetimeSubscription: boolean;
};

const statuses = ['ACTIVE', 'PENDING_PAYMENT', 'SUSPENDED', 'EXPIRED'];

export default function SuperAdminCompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyTotal, setCompanyTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscriptionDrafts, setSubscriptionDrafts] = useState<Record<string, { planId: string; status: string; lifetimeOverride: boolean }>>({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState('');

  async function load(searchTerm = '') {
    try {
      const [companyData, planData] = await Promise.all([
        apiFetch(`/super-admin/companies?limit=10&search=${encodeURIComponent(searchTerm)}`),
        apiFetch('/super-admin/plans'),
      ]);
      setCompanies(companyData.results);
      setCompanyTotal(companyData.total);
      setPlans(planData);
    } catch {
      setError('Unable to load platform accounts. Confirm that this account is a super admin.');
    }
  }

  useEffect(() => {
    load();
  }, []);

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    setSearch(searchInput.trim());
    load(searchInput.trim());
  }

  async function updateSubscription(company: Company, planId: string, status: string, lifetimeOverride = company.lifetimeSubscription) {
    setSaving(company.id);
    setError('');
    try {
      await apiFetch(`/super-admin/companies/${company.id}/subscription`, {
        method: 'PATCH',
        body: JSON.stringify({ planId, status, lifetimeOverride }),
      });
      await load(search);
    } catch {
      setError('Unable to update this subscription');
    } finally {
      setSaving('');
    }

  }

  function draftFor(company: Company) {
    return subscriptionDrafts[company.id] || {
      planId: company.subscriptionPlan,
      status: company.subscriptionStatus,
      lifetimeOverride: company.lifetimeSubscription,
    };
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-2xl bg-gradient-to-r from-slate-950 to-indigo-900 p-8 text-white shadow-lg">
          <p className="text-sm uppercase tracking-widest text-cyan-300">Platform control</p>
          <h1 className="mt-2 text-3xl font-bold">Super-admin accounts</h1>
          <p className="mt-3 max-w-3xl text-slate-300">
            Review every registered dyeing factory, see its users and subscription usage,
            and activate or manage plans after payment confirmation.
          </p>
        </header>

        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Registered factories</p>
            <p className="mt-1 text-3xl font-bold text-indigo-700">{companyTotal}</p>
          </div>
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Active subscriptions</p>
            <p className="mt-1 text-3xl font-bold text-emerald-600">
              {companies.filter(company => company.subscriptionStatus === 'ACTIVE').length}
            </p>
          </div>
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Awaiting payment</p>
            <p className="mt-1 text-3xl font-bold text-amber-600">
              {companies.filter(company => company.subscriptionStatus === 'PENDING_PAYMENT').length}
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Factory accounts</h2>
              <p className="text-sm text-slate-500">
                Showing {companies.length} of {companyTotal} {search ? 'matching ' : 'most recent '}registered factories.
              </p>
            </div>
            <form onSubmit={submitSearch} className="flex gap-2">
              <input
                className="min-w-0 flex-1 rounded-lg border border-slate-200 p-2.5 text-sm sm:w-72"
                placeholder="Search factory, user, or email"
                value={searchInput}
                onChange={event => setSearchInput(event.target.value)}
              />
              <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                Search
              </button>
              {search && (
                <button
                  type="button"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  onClick={() => {
                    setSearchInput('');
                    setSearch('');
                    load();
                  }}
                >
                  Clear
                </button>
              )}
            </form>
          </div>
        </section>

        <section className="space-y-4">
          {companies.map(company => (
            <article key={company.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col justify-between gap-4 lg:flex-row">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">{company.name}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {company.users.length} / {company.maxUsers} user(s) · {company.invoicesUsed}
                    {company.invoiceLimit ? ` / ${company.invoiceLimit}` : ''} invoice(s)
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    className="rounded-lg border border-slate-200 p-2 text-sm"
                    value={draftFor(company).planId}
                    disabled={saving === company.id}
                    onChange={event => setSubscriptionDrafts(current => ({
                      ...current,
                      [company.id]: { ...draftFor(company), planId: event.target.value },
                    }))}
                  >
                    {plans.filter(plan => plan.active || plan.id === company.subscriptionPlan).map(plan => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} · ₹{plan.priceInr.toLocaleString('en-IN')}
                      </option>
                    ))}
                  </select>
                  <label className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">
                    <input
                      type="checkbox"
                      checked={draftFor(company).lifetimeOverride}
                      disabled={saving === company.id}
                      onChange={event => setSubscriptionDrafts(current => ({
                        ...current,
                        [company.id]: { ...draftFor(company), lifetimeOverride: event.target.checked },
                      }))}
                    />
                    Lifetime override
                  </label>
                  <select
                    className="rounded-lg border border-slate-200 p-2 text-sm"
                    value={draftFor(company).status}
                    disabled={saving === company.id}
                    onChange={event => setSubscriptionDrafts(current => ({
                      ...current,
                      [company.id]: { ...draftFor(company), status: event.target.value },
                    }))}
                  >
                    {statuses.map(status => <option key={status}>{status}</option>)}
                  </select>
                  <button
                    type="button"
                    disabled={saving === company.id}
                    onClick={() => {
                      const draft = draftFor(company);
                      updateSubscription(company, draft.planId, draft.status, draft.lifetimeOverride);
                      setSubscriptionDrafts(current => {
                        const next = { ...current };
                        delete next[company.id];
                        return next;
                      });
                    }}
                    className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {saving === company.id ? 'Saving...' : 'Save changes'}
                  </button>
                  <button
                    type="button"
                    disabled={saving === company.id}
                    onClick={() => setSubscriptionDrafts(current => {
                      const next = { ...current };
                      delete next[company.id];
                      return next;
                    })}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-60"
                  >
                    Cancel
                  </button>
                </div>
              </div>
              <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr]">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Subscription</p>
                  <p className="mt-2 text-sm text-slate-700">
                    {company.billingCycle} · {company.subscriptionStatus}
                    {company.subscriptionExpiresAt
                      ? ` · expires ${new Date(company.subscriptionExpiresAt).toLocaleDateString('en-IN')}`
                      : ''}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Registered users</p>
                  <div className="mt-2 space-y-1 text-sm text-slate-700">
                    {company.users.map(user => <p key={user.id}>{user.name} · {user.email}</p>)}
                  </div>
                </div>
              </div>
            </article>
          ))}
          {companies.length === 0 && !error && <p className="rounded-xl bg-white p-8 text-center text-slate-500">No registered factories yet.</p>}
        </section>
      </div>
    </main>
  );
}
