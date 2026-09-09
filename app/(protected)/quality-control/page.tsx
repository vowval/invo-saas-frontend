'use client';

import { FormEvent, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

type Batch = {
  id: string;
  batchNo: string;
  status: string;
  machine?: { name: string } | null;
  dyeingJob?: { jobNo: string; customerName: string } | null;
};

type QcInspection = {
  id: string;
  gsm?: number | string | null;
  width?: string;
  shrinkagePercent?: number | string | null;
  shadeResult?: 'PASS' | 'FAIL' | null;
  colourFastnessResult?: 'PASS' | 'FAIL' | null;
  fabricDefects: number;
  overall: 'PASS' | 'FAIL';
  remarks?: string;
  inspectedAt: string;
  batch?: Batch;
};

type Stats = {
  totalInspected: number;
  totalFailed: number;
  failRate: number;
  reprocessBatchCount: number;
};

export default function QualityControlPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [inspections, setInspections] = useState<QcInspection[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    batchId: '',
    gsm: '',
    width: '',
    shrinkagePercent: '',
    shadeResult: '',
    colourFastnessResult: '',
    fabricDefects: '',
    remarks: '',
  });

  async function loadData() {
    try {
      const [batchList, inspectionList, statsData] = await Promise.all([
        apiFetch('/production/batches'),
        apiFetch('/quality-control'),
        apiFetch('/quality-control/stats'),
      ]);
      setBatches(batchList);
      setInspections(inspectionList);
      setStats(statsData);
    } catch {
      setError('Failed to load quality control data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function recordInspection(event: FormEvent) {
    event.preventDefault();
    setError('');
    if (!form.batchId) {
      setError('Select a batch first');
      return;
    }
    try {
      await apiFetch(`/quality-control/batches/${form.batchId}`, {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          gsm: form.gsm || undefined,
          shrinkagePercent: form.shrinkagePercent || undefined,
          fabricDefects: form.fabricDefects || 0,
          shadeResult: form.shadeResult || undefined,
          colourFastnessResult: form.colourFastnessResult || undefined,
        }),
      });
      setForm({
        batchId: '',
        gsm: '',
        width: '',
        shrinkagePercent: '',
        shadeResult: '',
        colourFastnessResult: '',
        fabricDefects: '',
        remarks: '',
      });
      await loadData();
    } catch {
      setError('Failed to record inspection');
    }
  }

  async function reprocess(batchId: string) {
    setError('');
    try {
      await apiFetch(`/quality-control/batches/${batchId}/reprocess`, { method: 'POST' });
      await loadData();
    } catch {
      setError('Failed to create reprocess batch (batch may not be QC-failed, or already reprocessed)');
    }
  }

  if (loading) return <p className="p-6">Loading quality control...</p>;

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-2xl bg-gradient-to-r from-cyan-700 to-indigo-700 p-8 text-white shadow-lg">
          <p className="text-sm uppercase tracking-widest text-cyan-100">Quality control</p>
          <h1 className="mt-2 text-3xl font-bold">Batch QC Inspections</h1>
          <p className="mt-3 text-cyan-100">
            Record GSM, width, shrinkage, shade and colour fastness per batch, and track how much output is lost to reprocessing.
          </p>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        {stats && (
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs text-slate-400">Total inspected</p>
              <p className="text-2xl font-bold text-slate-800">{stats.totalInspected}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs text-slate-400">Total failed</p>
              <p className="text-2xl font-bold text-red-600">{stats.totalFailed}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs text-slate-400">Fail rate</p>
              <p className="text-2xl font-bold text-amber-600">{stats.failRate}%</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs text-slate-400">Reprocess batches</p>
              <p className="text-2xl font-bold text-slate-800">{stats.reprocessBatchCount}</p>
            </div>
          </div>
        )}

        <form onSubmit={recordInspection} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">Record inspection</h2>
          <div className="grid gap-3 md:grid-cols-4">
            <select
              className="border p-2 rounded w-full"
              value={form.batchId}
              onChange={event => setForm(current => ({ ...current, batchId: event.target.value }))}
              required
            >
              <option value="">Select batch</option>
              {batches.map(batch => (
                <option key={batch.id} value={batch.id}>
                  {batch.batchNo} {batch.dyeingJob ? `· ${batch.dyeingJob.jobNo}` : ''}
                </option>
              ))}
            </select>
            <input
              className="border p-2 rounded w-full"
              type="number"
              step="0.01"
              placeholder="GSM"
              value={form.gsm}
              onChange={event => setForm(current => ({ ...current, gsm: event.target.value }))}
            />
            <input
              className="border p-2 rounded w-full"
              placeholder={'Width (e.g. 72")'}
              value={form.width}
              onChange={event => setForm(current => ({ ...current, width: event.target.value }))}
            />
            <input
              className="border p-2 rounded w-full"
              type="number"
              step="0.01"
              placeholder="Shrinkage %"
              value={form.shrinkagePercent}
              onChange={event => setForm(current => ({ ...current, shrinkagePercent: event.target.value }))}
            />
            <select
              className="border p-2 rounded w-full"
              value={form.shadeResult}
              onChange={event => setForm(current => ({ ...current, shadeResult: event.target.value }))}
            >
              <option value="">Shade result</option>
              <option value="PASS">Shade: PASS</option>
              <option value="FAIL">Shade: FAIL</option>
            </select>
            <select
              className="border p-2 rounded w-full"
              value={form.colourFastnessResult}
              onChange={event => setForm(current => ({ ...current, colourFastnessResult: event.target.value }))}
            >
              <option value="">Colour fastness result</option>
              <option value="PASS">Colour fastness: PASS</option>
              <option value="FAIL">Colour fastness: FAIL</option>
            </select>
            <input
              className="border p-2 rounded w-full"
              type="number"
              min="0"
              placeholder="Fabric defects (count)"
              value={form.fabricDefects}
              onChange={event => setForm(current => ({ ...current, fabricDefects: event.target.value }))}
            />
            <input
              className="border p-2 rounded w-full"
              placeholder="Remarks"
              value={form.remarks}
              onChange={event => setForm(current => ({ ...current, remarks: event.target.value }))}
            />
          </div>
          <p className="text-xs text-slate-400">
            Overall result is calculated automatically: any FAIL sub-check, or more than 5 fabric defects, fails the inspection.
          </p>
          <button className="bg-black text-white px-4 py-2 rounded">Record inspection</button>
        </form>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600">
                <th className="border p-2 text-left">Batch</th>
                <th className="border p-2">GSM</th>
                <th className="border p-2">Width</th>
                <th className="border p-2">Shrinkage</th>
                <th className="border p-2">Shade</th>
                <th className="border p-2">Fastness</th>
                <th className="border p-2">Defects</th>
                <th className="border p-2">Overall</th>
                <th className="border p-2">Date</th>
                <th className="border p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {inspections.map(inspection => (
                <tr key={inspection.id} className={inspection.overall === 'FAIL' ? 'bg-red-50' : ''}>
                  <td className="border p-2">{inspection.batch?.batchNo ?? '—'}</td>
                  <td className="border p-2 text-center">{inspection.gsm ?? '—'}</td>
                  <td className="border p-2 text-center">{inspection.width || '—'}</td>
                  <td className="border p-2 text-center">{inspection.shrinkagePercent ?? '—'}</td>
                  <td className="border p-2 text-center">{inspection.shadeResult ?? '—'}</td>
                  <td className="border p-2 text-center">{inspection.colourFastnessResult ?? '—'}</td>
                  <td className="border p-2 text-center">{inspection.fabricDefects}</td>
                  <td className={`border p-2 text-center font-medium ${inspection.overall === 'FAIL' ? 'text-red-600' : 'text-emerald-600'}`}>
                    {inspection.overall}
                  </td>
                  <td className="border p-2 text-center">{new Date(inspection.inspectedAt).toLocaleDateString()}</td>
                  <td className="border p-2 text-center">
                    {inspection.overall === 'FAIL' && inspection.batch && (
                      <button
                        type="button"
                        className="rounded bg-amber-600 px-2 py-1 text-xs text-white hover:bg-amber-700"
                        onClick={() => reprocess(inspection.batch!.id)}
                      >
                        Reprocess
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {inspections.length === 0 && (
                <tr>
                  <td className="border p-2 text-center text-slate-400" colSpan={10}>No inspections recorded yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
