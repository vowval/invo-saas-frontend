'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import Link from 'next/link';

type Profile = {
  name: string;
  address?: string;
  gstin?: string;
  msmeUdyam?: string;
  bankName?: string;
  branchName?: string;
  accountNo?: string;
  ifsc?: string;
  allowServiceArchive?: boolean;
  hideDashboardForStaff?: boolean;
  invoicePrefix?: string;
};

const units = ['KG', 'MTR', 'PCS', 'SET', 'BOX', 'DOZ'];

const fields: Array<[keyof Profile, string]> = [
  ['name', 'Factory / legal name'],
  ['address', 'Registered address'],
  ['gstin', 'GSTIN'],
  ['msmeUdyam', 'MSME Udyam number'],
  ['bankName', 'Bank name'],
  ['branchName', 'Branch name'],
  ['accountNo', 'Account number'],
  ['ifsc', 'IFSC code'],
];

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile>({ name: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [processSaving, setProcessSaving] = useState(false);
  const [processMessage, setProcessMessage] = useState('');
  const [processError, setProcessError] = useState('');
  const [process, setProcess] = useState({
    name: '',
    description: '',
    hsnCode: '998821',
    unit: 'KG',
    rate: '',
  });

  useEffect(() => {
    apiFetch('/company/profile')
      .then(setProfile)
      .catch(() => setError('Unable to load company profile'));
  }, []);

  function update(field: keyof Profile, value: string) {
    setProfile(current => ({ ...current, [field]: value }));
  }

  async function addCustomProcess(event: React.FormEvent) {
    event.preventDefault();
    setProcessSaving(true);
    setProcessMessage('');
    setProcessError('');
    try {
      await apiFetch('/products', {
        method: 'POST',
        body: JSON.stringify({
          ...process,
          rate: Number(process.rate),
        }),
      });
      setProcess({
        name: '',
        description: '',
        hsnCode: '998821',
        unit: 'KG',
        rate: '',
      });
      setProcessMessage('Custom process added to the Services page and invoice selector.');
    } catch {
      setProcessError('Unable to add custom process. Check the name, unit, SAC code, and rate.');
    } finally {
      setProcessSaving(false);
    }
  }

  async function save(event?: React.FormEvent) {
    event?.preventDefault();
    setError('');
    setMessage('');
    setSaving(true);
    try {
      const saved = await apiFetch('/company/profile', {
        method: 'PATCH',
        body: JSON.stringify(profile),
      });
      setProfile(saved);
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        localStorage.setItem(
          'user',
          JSON.stringify({ ...JSON.parse(storedUser), companyName: saved.name }),
        );
      }

      setMessage('Company profile saved. Refreshing the navigation name...');
      setTimeout(() => window.location.reload(), 500);
    } catch {
      setError('Unable to save company profile');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl space-y-8 p-6">
      <header className="rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-800 p-8 text-white shadow-lg">
        <p className="text-sm uppercase tracking-widest text-indigo-200">Workspace settings</p>
        <h1 className="mt-2 text-3xl font-bold">Company profile</h1>
        <p className="mt-3 max-w-2xl text-slate-200">
          These details appear on your GST invoice PDF, dashboard, and customer documents.
        </p>
      </header>

      {message && <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <form onSubmit={save} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Invoice identity</h2>
          <p className="mb-5 mt-1 text-sm text-slate-500">Keep your legal and banking information current.</p>
          <div className="grid gap-4 md:grid-cols-2">
            {fields.map(([field, label]) => (
              field === 'address' ? (
                <label key={field} className="text-sm text-slate-600 md:col-span-2">
                  {label}
                  <textarea className="mt-1 w-full rounded-lg border p-3" rows={3} value={profile[field] || ''} onChange={e => update(field, e.target.value)} />
                </label>
              ) : (
                <label key={field} className="text-sm text-slate-600">
                  {label}
                  <input className="mt-1 w-full rounded-lg border p-3" value={String(profile[field] || '')} onChange={e => update(field, e.target.value)} required={field === 'name'} />
                </label>
              )
            ))}
          </div>
          <button className="mt-6 rounded-lg bg-indigo-600 px-5 py-3 font-medium text-white hover:bg-indigo-700">
            Save company details
          </button>
          <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-slate-500">Automatic invoice numbering</p>
          <label className="mt-2 block text-sm text-slate-600">
            Invoice prefix
            <input
              className="mt-1 w-full rounded-lg border p-3 uppercase"
              value={profile.invoicePrefix || 'INV'}
              onChange={event => update('invoicePrefix', event.target.value)}
              maxLength={20}
              pattern="[A-Za-z0-9-]+"
              title="Use letters, numbers, or hyphens"
            />
            <span className="mt-1 block text-xs text-slate-500">
              Invoice numbers will be generated like {profile.invoicePrefix || 'INV'}-00001.
            </span>
          </label>
        </form>

        <aside className="rounded-2xl border border-indigo-100 bg-indigo-50 p-6">
          <h2 className="font-semibold text-indigo-950">Manage your rate card</h2>
          <p className="mt-2 text-sm leading-6 text-indigo-800">
            Add a custom dyeing, washing, finishing, or processing service with its unit and rate.
            It will become available immediately while creating an invoice.
          </p>
          <Link href="/products" className="mt-5 inline-block rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700">
            Open service catalog
          </Link>
        </aside>
      </div>
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
        <h2 className="font-semibold text-amber-950">Service removal policy</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-amber-900">
          Archived services disappear from new invoices but remain attached to old invoices and PDFs.
          This protects historical billing records while keeping your active rate card clean.
        </p>
        <label className="mt-4 flex items-start gap-3 text-sm text-amber-950">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 accent-amber-600"
            checked={profile.allowServiceArchive === true}
            onChange={event =>
              setProfile(current => ({
                ...current,
                allowServiceArchive: event.target.checked,
              }))
            }
          />
          <span>
            Allow users to remove services from the active rate card
            <span className="block text-xs text-amber-800">
              Existing invoice history will not be deleted.
            </span>
          </span>
        </label>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="mt-4 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Save removal setting'}
        </button>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
        <h2 className="font-semibold text-slate-900">Staff access</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
          Staff accounts see the same workflow menu as Factory Admin (excluding User Management).
          Use this if you want staff to focus on assigned work instead of the overall dashboard.
        </p>
        <label className="mt-4 flex items-start gap-3 text-sm text-slate-900">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 accent-slate-700"
            checked={profile.hideDashboardForStaff === true}
            onChange={event =>
              setProfile(current => ({
                ...current,
                hideDashboardForStaff: event.target.checked,
              }))
            }
          />
          <span>
            Hide the Dashboard link for Staff users
            <span className="block text-xs text-slate-600">
              Factory Admin will still see the Dashboard as usual.
            </span>
          </span>
        </label>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="mt-4 rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Save staff access setting'}
        </button>
      </section>
      <section className="rounded-2xl border border-cyan-200 bg-cyan-50 p-6 shadow-sm">
        <div className="mb-5">
          <p className="text-sm font-medium uppercase tracking-widest text-cyan-700">
            Rate card
          </p>
          <h2 className="mt-1 text-xl font-semibold text-cyan-950">
            Add a custom dyeing process
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-cyan-900">
            Add any factory-specific process that is not in the common process list.
            It will immediately appear in Services and be available while creating invoices.
          </p>
        </div>
        {processMessage && <p className="mb-4 rounded-lg bg-emerald-100 p-3 text-sm text-emerald-800">{processMessage}</p>}
        {processError && <p className="mb-4 rounded-lg bg-red-100 p-3 text-sm text-red-800">{processError}</p>}
        <form onSubmit={addCustomProcess} className="grid gap-3 md:grid-cols-2">
          <input
            className="rounded-lg border border-cyan-200 bg-white p-3"
            placeholder="Process name"
            value={process.name}
            onChange={event => setProcess({ ...process, name: event.target.value })}
            maxLength={120}
            required
          />
          <input
            className="rounded-lg border border-cyan-200 bg-white p-3"
            placeholder="SAC code"
            value={process.hsnCode}
            onChange={event => setProcess({ ...process, hsnCode: event.target.value })}
            maxLength={20}
          />
          <textarea
            className="rounded-lg border border-cyan-200 bg-white p-3 md:col-span-2"
            placeholder="Describe what this process includes"
            value={process.description}
            onChange={event => setProcess({ ...process, description: event.target.value })}
            maxLength={500}
            rows={3}
          />
          <select
            className="rounded-lg border border-cyan-200 bg-white p-3"
            value={process.unit}
            onChange={event => setProcess({ ...process, unit: event.target.value })}
          >
            {units.map(unit => <option key={unit}>{unit}</option>)}
          </select>
          <input
            type="number"
            min="0"
            step="0.01"
            className="rounded-lg border border-cyan-200 bg-white p-3"
            placeholder="Unit rate (₹)"
            value={process.rate}
            onChange={event => setProcess({ ...process, rate: event.target.value })}
            required
          />
          <button
            disabled={processSaving}
            className="rounded-lg bg-cyan-700 px-5 py-3 font-medium text-white hover:bg-cyan-800 disabled:opacity-60 md:col-span-2 md:justify-self-start"
          >
            {processSaving ? 'Adding process...' : 'Add process to Services'}
          </button>
        </form>
      </section>
    </main>
  );
}
