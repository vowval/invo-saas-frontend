'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

type Service = {
  id: string;
  name: string;
  description?: string;
  hsnCode?: string;
  unit: string;
  rate: number | string;
};

const units = ['KG', 'MTR', 'PCS', 'SET', 'BOX', 'DOZ'];
const standardServices = [
  ['Reactive dyeing', 'Reactive colour dyeing for cotton fabric', '998821', 'KG'],
  ['Pigment dyeing', 'Pigment dyeing and curing process', '998821', 'KG'],
  ['Pre-treatment', 'Scouring, bleaching, and preparation', '998821', 'KG'],
  ['Fabric washing', 'Post-dyeing wash and finishing', '998821', 'KG'],
  ['Softener finish', 'Softener and hand-feel finishing', '998821', 'KG'],
  ['Compacting', 'Compacting and dimensional stabilisation', '998821', 'MTR'],
] as const;

export default function ServicesPage() {
  const { isAuthenticated } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [canArchive, setCanArchive] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    hsnCode: '998821',
    unit: 'KG',
    rate: '',
  });

  async function loadServices() {
    try {
      const [serviceData, profile] = await Promise.all([
        apiFetch('/products'),
        apiFetch('/company/profile'),
      ]);
      setServices(serviceData);
      setCanArchive(profile.allowServiceArchive === true);
    } catch {
      setError('Failed to load service catalog');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isAuthenticated) loadServices();
  }, [isAuthenticated]);

  function chooseTemplate(template: (typeof standardServices)[number]) {
    setForm({
      name: template[0],
      description: template[1],
      hsnCode: template[2],
      unit: template[3],
      rate: '',
    });
  }

  async function addService(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    try {
      await apiFetch('/products', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          rate: Number(form.rate),
        }),
      });
      setForm({
        name: '',
        description: '',
        hsnCode: '998821',
        unit: 'KG',
        rate: '',
      });
      await loadServices();
    } catch {
      setError('Failed to save service');
    }
  }

  async function deleteService(id: string) {
    try {
      await apiFetch(`/products/${id}`, { method: 'DELETE' });
      await loadServices();
    } catch {
      setError('Service was not removed. Enable service removal in Settings first.');
    }
  }

  if (loading) return <p className="p-6">Loading service catalog...</p>;

  return (
    <main className="mx-auto max-w-7xl space-y-8 p-6">
      <header className="rounded-2xl bg-gradient-to-r from-indigo-700 to-cyan-600 p-8 text-white shadow-lg">
        <p className="text-sm font-medium uppercase tracking-widest text-cyan-100">
          Factory rate card
        </p>
        <h1 className="mt-2 text-3xl font-bold">Dyeing Services</h1>
        <p className="mt-3 max-w-2xl text-indigo-100">
          Maintain the processing services your factory provides. These services
          appear directly in invoices with their saved unit, SAC code, and rate.
        </p>
      </header>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Common processes</h2>
            <p className="text-sm text-slate-500">Choose a template to start your rate card.</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {standardServices.map(template => (
            <button
              key={template[0]}
              type="button"
              onClick={() => chooseTemplate(template)}
              className="rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900">{template[0]}</span>
                <span className="rounded-full bg-indigo-50 px-2 py-1 text-xs text-indigo-700">
                  {template[3]}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-500">{template[1]}</p>
              <p className="mt-3 text-xs text-slate-400">SAC {template[2]} · Click to use</p>
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <form onSubmit={addService} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Add to rate card</h2>
          <p className="mb-4 mt-1 text-sm text-slate-500">
            Save the rate used when billing received fabric.
          </p>
          <div className="space-y-3">
            <input className="w-full rounded-lg border p-2.5" placeholder="Service name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            <textarea className="w-full rounded-lg border p-2.5" placeholder="What does this process include?" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            <input className="w-full rounded-lg border p-2.5" placeholder="SAC code" value={form.hsnCode} onChange={e => setForm({ ...form, hsnCode: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <select className="rounded-lg border p-2.5" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>
                {units.map(unit => <option key={unit}>{unit}</option>)}
              </select>
              <input type="number" min="0" step="0.01" className="rounded-lg border p-2.5" placeholder="Rate" value={form.rate} onChange={e => setForm({ ...form, rate: e.target.value })} required />
            </div>
          </div>
          <button className="mt-4 w-full rounded-lg bg-indigo-600 px-4 py-2.5 font-medium text-white transition hover:bg-indigo-700">
            Save service rate
          </button>
        </form>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b bg-slate-50 px-5 py-4">
            <h2 className="font-semibold text-slate-900">Saved service catalog</h2>
            <p className="text-sm text-slate-500">{services.length} billable process{services.length === 1 ? '' : 'es'}</p>
          </div>
          <div className="divide-y">
            {services.map(service => (
              <div key={service.id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div>
                  <p className="font-medium text-slate-900">{service.name}</p>
                  <p className="text-sm text-slate-500">{service.description || 'Dyeing and processing service'}</p>
                  <p className="mt-1 text-xs text-slate-400">SAC {service.hsnCode || 'N/A'} · Per {service.unit}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-indigo-700">₹ {Number(service.rate).toFixed(2)}</p>
                  <button
                    onClick={() => deleteService(service.id)}
                    disabled={!canArchive}
                    title={canArchive ? 'Archive service' : 'Enable removal in Settings'}
                    className="mt-1 text-xs text-red-600 hover:underline disabled:cursor-not-allowed disabled:text-slate-400"
                  >
                    {canArchive ? 'Remove from active list' : 'Removal disabled in Settings'}
                  </button>
                </div>
              </div>
            ))}
            {services.length === 0 && <p className="p-8 text-center text-sm text-slate-500">Add your first service rate or use a common process above.</p>}
          </div>
        </div>
      </section>
    </main>
  );
}
