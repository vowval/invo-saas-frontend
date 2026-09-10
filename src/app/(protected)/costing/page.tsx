'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { TooltipValueType } from 'recharts';

type Batch = {
  id: string;
  batchNo: string;
  status: 'SCHEDULED' | 'RUNNING' | 'COMPLETED';
  inputQty: number | string | null;
  dyeingJob?: { jobNo: string; customerName: string } | null;
};

type Costing = {
  batchId: string;
  batchNo: string;
  customerName: string | null;
  jobNo: string | null;
  finishedQty: number;
  breakdown: Record<string, number>;
  totalCost: number;
  costPerKg: number | null;
  customerRate: number | null;
  marginPerKg: number | null;
  marginPercent: number | null;
  notes: string;
  hasCostRecord: boolean;
};

const inr = (value: number | null) =>
  value === null ? '—' : `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const COST_FIELDS: { key: string; label: string }[] = [
  { key: 'fabricCost', label: 'Fabric / Input' },
  { key: 'dyeChemicalCost', label: 'Dyes & Chemicals' },
  { key: 'electricityCost', label: 'Electricity' },
  { key: 'steamFuelCost', label: 'Steam / Fuel' },
  { key: 'waterCost', label: 'Water' },
  { key: 'labourCost', label: 'Labour' },
  { key: 'machineCost', label: 'Machine cost' },
  { key: 'otherCost', label: 'Other expenses' },
];

function extractErrorMessage(err: unknown, fallback: string): string {
  if (!(err instanceof Error)) return fallback;
  try {
    const jsonStart = err.message.indexOf('{');
    if (jsonStart >= 0) {
      const parsed = JSON.parse(err.message.slice(jsonStart));
      if (parsed?.message) return Array.isArray(parsed.message) ? parsed.message.join(', ') : parsed.message;
    }
  } catch {
    // ignore parse errors, fall through to fallback
  }
  return fallback;
}

export default function CostingPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [costing, setCosting] = useState<Costing | null>(null);
  const [report, setReport] = useState<Costing[]>([]);
  const [form, setForm] = useState<Record<string, string>>({
    fabricCost: '',
    dyeChemicalCost: '',
    electricityCost: '',
    steamFuelCost: '',
    waterCost: '',
    labourCost: '',
    machineCost: '',
    otherCost: '',
    notes: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function loadBatches() {
    try {
      const [allBatches, profitability] = await Promise.all([
        apiFetch('/production/batches'),
        apiFetch('/costing/profitability'),
      ]);
      setBatches(allBatches);
      setReport(profitability);
    } catch {
      setError('Failed to load batches');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBatches();
  }, []);

  useEffect(() => {
    if (!selectedBatchId) {
      setCosting(null);
      return;
    }
    apiFetch(`/costing/batches/${selectedBatchId}`)
      .then((data: Costing) => {
        setCosting(data);
        setForm({
          fabricCost: String(data.breakdown.fabricCost ?? ''),
          dyeChemicalCost: data.hasCostRecord ? String(data.breakdown.dyeChemicalCost ?? '') : '',
          electricityCost: String(data.breakdown.electricityCost ?? ''),
          steamFuelCost: String(data.breakdown.steamFuelCost ?? ''),
          waterCost: String(data.breakdown.waterCost ?? ''),
          labourCost: String(data.breakdown.labourCost ?? ''),
          machineCost: String(data.breakdown.machineCost ?? ''),
          otherCost: String(data.breakdown.otherCost ?? ''),
          notes: data.notes ?? '',
        });
      })
      .catch(() => setError('Failed to load batch costing'));
  }, [selectedBatchId]);

  async function submitCost(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const payload: Record<string, string | number> = { notes: form.notes };
      for (const { key } of COST_FIELDS) {
        // Leave dyeChemicalCost blank to keep the auto-computed inventory value.
        if (key === 'dyeChemicalCost' && form[key] === '') continue;
        payload[key] = form[key] === '' ? 0 : form[key];
      }
      const updated = await apiFetch(`/costing/batches/${selectedBatchId}`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setCosting(updated);
      setSuccess('Cost saved');
      loadBatches();
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to save cost'));
    } finally {
      setSaving(false);
    }
  }

  const chartData = useMemo(
    () =>
      report.map((r) => ({
        name: r.batchNo,
        'Cost/kg': r.costPerKg ?? 0,
        'Rate/kg': r.customerRate ?? 0,
        'Margin/kg': r.marginPerKg ?? 0,
      })),
    [report],
  );

  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Production Costing</h1>
        <p className="text-slate-500 text-sm mt-1">
          Cost every batch and see which jobs are actually profitable.
        </p>
      </div>

      {error && <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm">{error}</div>}
      {success && <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-lg text-sm">{success}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-4">
          <h2 className="font-semibold text-slate-700">Cost a batch</h2>
          <select
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            value={selectedBatchId}
            onChange={(e) => setSelectedBatchId(e.target.value)}
          >
            <option value="">Select a batch…</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.batchNo} {b.dyeingJob ? `— ${b.dyeingJob.customerName} (${b.dyeingJob.jobNo})` : ''} [{b.status}]
              </option>
            ))}
          </select>

          {selectedBatchId && (
            <form onSubmit={submitCost} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {COST_FIELDS.map(({ key, label }) => (
                  <label key={key} className="text-xs text-slate-500 space-y-1 block">
                    {label}
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      placeholder={key === 'dyeChemicalCost' ? 'auto (from stock)' : '0'}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mt-1"
                      value={form[key]}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    />
                  </label>
                ))}
              </div>
              <label className="text-xs text-slate-500 space-y-1 block">
                Notes
                <textarea
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mt-1"
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </label>
              <button
                type="submit"
                disabled={saving}
                className="bg-indigo-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save cost'}
              </button>
            </form>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <h2 className="font-semibold text-slate-700 mb-4">Batch summary</h2>
          {!costing ? (
            <p className="text-sm text-slate-400">Select a batch to see its cost breakdown.</p>
          ) : (
            <div className="space-y-3">
              <div className="text-sm text-slate-500">
                {costing.customerName ?? 'No customer'} {costing.jobNo ? `· ${costing.jobNo}` : ''}
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Stat label="Finished qty" value={`${costing.finishedQty} kg`} />
                <Stat label="Total cost" value={inr(costing.totalCost)} />
                <Stat label="Cost / kg" value={inr(costing.costPerKg)} />
                <Stat label="Customer rate / kg" value={inr(costing.customerRate)} />
                <Stat
                  label="Margin / kg"
                  value={inr(costing.marginPerKg)}
                  highlight={costing.marginPerKg !== null ? (costing.marginPerKg >= 0 ? 'good' : 'bad') : undefined}
                />
                <Stat
                  label="Margin %"
                  value={costing.marginPercent === null ? '—' : `${costing.marginPercent}%`}
                  highlight={costing.marginPercent !== null ? (costing.marginPercent >= 0 ? 'good' : 'bad') : undefined}
                />
              </div>
              {!costing.customerRate && (
                <p className="text-xs text-amber-600">
                  No invoice rate found yet for this job — margin will show once it&apos;s invoiced.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <h2 className="font-semibold text-slate-700 mb-4">Profitability report (completed &amp; costed batches)</h2>
        {report.length === 0 ? (
          <p className="text-sm text-slate-400">No costed batches yet.</p>
        ) : (
          <>
            <div className="h-72 mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: TooltipValueType | undefined) => Number(Array.isArray(value) ? value[0] : value ?? 0).toFixed(2)} />
                  <Legend />
                  <Bar dataKey="Cost/kg" fill="#f97316" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Rate/kg" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Margin/kg" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, idx) => (
                      <Cell key={idx} fill={entry['Margin/kg'] >= 0 ? '#10b981' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-100">
                    <th className="py-2 pr-4">Batch</th>
                    <th className="py-2 pr-4">Customer</th>
                    <th className="py-2 pr-4">Cost/kg</th>
                    <th className="py-2 pr-4">Rate/kg</th>
                    <th className="py-2 pr-4">Margin/kg</th>
                    <th className="py-2 pr-4">Margin %</th>
                  </tr>
                </thead>
                <tbody>
                  {report.map((r) => (
                    <tr key={r.batchId} className="border-b border-slate-50">
                      <td className="py-2 pr-4 font-medium text-slate-700">{r.batchNo}</td>
                      <td className="py-2 pr-4 text-slate-500">{r.customerName ?? '—'}</td>
                      <td className="py-2 pr-4">{inr(r.costPerKg)}</td>
                      <td className="py-2 pr-4">{inr(r.customerRate)}</td>
                      <td className={`py-2 pr-4 font-medium ${r.marginPerKg !== null && r.marginPerKg < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {inr(r.marginPerKg)}
                      </td>
                      <td className="py-2 pr-4">{r.marginPercent === null ? '—' : `${r.marginPercent}%`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: 'good' | 'bad' }) {
  const color = highlight === 'good' ? 'text-emerald-600' : highlight === 'bad' ? 'text-red-600' : 'text-slate-800';
  return (
    <div className="bg-slate-50 rounded-lg p-3">
      <div className="text-xs text-slate-400">{label}</div>
      <div className={`text-base font-semibold ${color}`}>{value}</div>
    </div>
  );
}
