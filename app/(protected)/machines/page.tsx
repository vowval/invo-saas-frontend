'use client';

import { FormEvent, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

type MachineStatus = 'IDLE' | 'RUNNING' | 'MAINTENANCE';

type Batch = {
  id: string;
  batchNo: string;
  recipe?: string;
  inputQty: number | string | null;
  status: 'SCHEDULED' | 'RUNNING' | 'COMPLETED';
  startTime?: string | null;
  endTime?: string | null;
  dyeingJob?: { jobNo: string; customerName: string } | null;
};

type Machine = {
  id: string;
  name: string;
  machineType?: string;
  status: MachineStatus;
  currentBatch: Batch | null;
};

type DyeingJob = { id: string; jobNo: string; customerName: string };

const statusColors: Record<MachineStatus, string> = {
  IDLE: 'bg-slate-100 text-slate-600',
  RUNNING: 'bg-emerald-100 text-emerald-700',
  MAINTENANCE: 'bg-amber-100 text-amber-700',
};

export default function MachinesPage() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [jobs, setJobs] = useState<DyeingJob[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [machineForm, setMachineForm] = useState({ name: '', machineType: '' });
  const [batchForm, setBatchForm] = useState({
    batchNo: '',
    machineId: '',
    dyeingJobId: '',
    recipe: '',
    inputQty: '',
  });

  async function loadBoard() {
    try {
      const [board, allBatches, activeJobs] = await Promise.all([
        apiFetch('/production/machines/board'),
        apiFetch('/production/batches'),
        apiFetch('/dyeing-jobs/active'),
      ]);
      setMachines(board);
      setBatches(allBatches);
      setJobs(activeJobs);
    } catch {
      setError('Failed to load machine board');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBoard();
  }, []);

  async function createMachine(event: FormEvent) {
    event.preventDefault();
    setError('');
    try {
      await apiFetch('/production/machines', {
        method: 'POST',
        body: JSON.stringify(machineForm),
      });
      setMachineForm({ name: '', machineType: '' });
      await loadBoard();
    } catch {
      setError('Failed to add machine');
    }
  }

  async function setMachineStatus(id: string, status: MachineStatus) {
    setError('');
    try {
      await apiFetch(`/production/machines/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      await loadBoard();
    } catch {
      setError('Failed to update machine status (a running batch may block maintenance mode)');
    }
  }

  async function createBatch(event: FormEvent) {
    event.preventDefault();
    setError('');
    try {
      await apiFetch('/production/batches', {
        method: 'POST',
        body: JSON.stringify({
          ...batchForm,
          inputQty: batchForm.inputQty ? Number(batchForm.inputQty) : undefined,
          dyeingJobId: batchForm.dyeingJobId || undefined,
        }),
      });
      setBatchForm({ batchNo: '', machineId: '', dyeingJobId: '', recipe: '', inputQty: '' });
      await loadBoard();
    } catch {
      setError('Failed to create batch');
    }
  }

  async function startBatch(id: string) {
    setError('');
    try {
      await apiFetch(`/production/batches/${id}/start`, { method: 'PATCH' });
      await loadBoard();
    } catch {
      setError('Failed to start batch (machine may already be running or under maintenance)');
    }
  }

  async function completeBatch(id: string) {
    setError('');
    try {
      await apiFetch(`/production/batches/${id}/complete`, { method: 'PATCH' });
      await loadBoard();
    } catch {
      setError('Failed to complete batch');
    }
  }

  if (loading) return <p className="p-6">Loading machine board...</p>;

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-2xl bg-gradient-to-r from-cyan-700 to-indigo-700 p-8 text-white shadow-lg">
          <p className="text-sm uppercase tracking-widest text-cyan-100">Live operations</p>
          <h1 className="mt-2 text-3xl font-bold">Machines &amp; Batches</h1>
          <p className="mt-3 text-cyan-100">
            See which machine is running which batch, and which are idle or under maintenance.
          </p>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="grid gap-4 md:grid-cols-2">
          <form onSubmit={createMachine} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
            <h2 className="text-lg font-semibold text-slate-900">Add machine</h2>
            <input
              className="border p-2 rounded w-full"
              placeholder="Machine name (e.g. Jet Dyeing Machine #4)"
              value={machineForm.name}
              onChange={event => setMachineForm(current => ({ ...current, name: event.target.value }))}
              required
            />
            <input
              className="border p-2 rounded w-full"
              placeholder="Machine type (optional)"
              value={machineForm.machineType}
              onChange={event => setMachineForm(current => ({ ...current, machineType: event.target.value }))}
            />
            <button className="bg-black text-white px-4 py-2 rounded">Add machine</button>
          </form>

          <form onSubmit={createBatch} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
            <h2 className="text-lg font-semibold text-slate-900">Schedule batch</h2>
            <input
              className="border p-2 rounded w-full"
              placeholder="Batch number (e.g. B-2026-0912)"
              value={batchForm.batchNo}
              onChange={event => setBatchForm(current => ({ ...current, batchNo: event.target.value }))}
              required
            />
            <select
              className="border p-2 rounded w-full"
              value={batchForm.machineId}
              onChange={event => setBatchForm(current => ({ ...current, machineId: event.target.value }))}
              required
            >
              <option value="">Select machine</option>
              {machines.map(machine => (
                <option key={machine.id} value={machine.id}>{machine.name}</option>
              ))}
            </select>
            <select
              className="border p-2 rounded w-full"
              value={batchForm.dyeingJobId}
              onChange={event => setBatchForm(current => ({ ...current, dyeingJobId: event.target.value }))}
            >
              <option value="">Link to job (optional)</option>
              {jobs.map(job => (
                <option key={job.id} value={job.id}>{job.jobNo} · {job.customerName}</option>
              ))}
            </select>
            <div className="flex gap-3">
              <input
                className="border p-2 rounded w-full"
                placeholder="Recipe (e.g. BLACK-04)"
                value={batchForm.recipe}
                onChange={event => setBatchForm(current => ({ ...current, recipe: event.target.value }))}
              />
              <input
                className="border p-2 rounded w-full"
                type="number"
                step="0.001"
                min="0"
                placeholder="Input qty"
                value={batchForm.inputQty}
                onChange={event => setBatchForm(current => ({ ...current, inputQty: event.target.value }))}
              />
            </div>
            <button className="bg-black text-white px-4 py-2 rounded">Schedule batch</button>
          </form>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {machines.map(machine => (
            <div key={machine.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">{machine.name}</h3>
                <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusColors[machine.status]}`}>
                  {machine.status}
                </span>
              </div>
              {machine.machineType && <p className="text-xs text-slate-400">{machine.machineType}</p>}

              {machine.currentBatch ? (
                <div className="rounded-lg bg-emerald-50 p-3 text-sm">
                  <div className="font-medium text-emerald-800">Batch {machine.currentBatch.batchNo}</div>
                  {machine.currentBatch.dyeingJob && (
                    <div className="text-xs text-emerald-700">
                      {machine.currentBatch.dyeingJob.jobNo} · {machine.currentBatch.dyeingJob.customerName}
                    </div>
                  )}
                  {machine.currentBatch.recipe && (
                    <div className="text-xs text-emerald-700">Recipe: {machine.currentBatch.recipe}</div>
                  )}
                  <button
                    type="button"
                    className="mt-2 rounded bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-700"
                    onClick={() => completeBatch(machine.currentBatch!.id)}
                  >
                    Complete batch
                  </button>
                </div>
              ) : (
                <p className="text-sm text-slate-400">No batch currently running</p>
              )}

              <div className="flex flex-wrap gap-2 border-t pt-3">
                {(['IDLE', 'RUNNING', 'MAINTENANCE'] as MachineStatus[]).map(status => (
                  <button
                    key={status}
                    type="button"
                    disabled={machine.status === status}
                    className="rounded border border-slate-200 px-2 py-1 text-xs disabled:opacity-40"
                    onClick={() => setMachineStatus(machine.id, status)}
                  >
                    Mark {status}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {machines.length === 0 && (
            <p className="text-sm text-slate-500">No machines added yet.</p>
          )}
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-3">
            <h2 className="font-semibold text-slate-800">All batches</h2>
          </div>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600">
                <th className="border p-2 text-left">Batch</th>
                <th className="border p-2 text-left">Job</th>
                <th className="border p-2 text-left">Recipe</th>
                <th className="border p-2">Input qty</th>
                <th className="border p-2">Status</th>
                <th className="border p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {batches.map(batch => (
                <tr key={batch.id}>
                  <td className="border p-2">{batch.batchNo}</td>
                  <td className="border p-2">
                    {batch.dyeingJob ? `${batch.dyeingJob.jobNo} · ${batch.dyeingJob.customerName}` : '—'}
                  </td>
                  <td className="border p-2">{batch.recipe || '—'}</td>
                  <td className="border p-2 text-center">{batch.inputQty ?? '—'}</td>
                  <td className="border p-2 text-center">{batch.status}</td>
                  <td className="border p-2 text-center">
                    {batch.status === 'SCHEDULED' && (
                      <button
                        type="button"
                        className="rounded bg-cyan-600 px-2 py-1 text-xs text-white hover:bg-cyan-700"
                        onClick={() => startBatch(batch.id)}
                      >
                        Start
                      </button>
                    )}
                    {batch.status === 'RUNNING' && (
                      <button
                        type="button"
                        className="rounded bg-emerald-600 px-2 py-1 text-xs text-white hover:bg-emerald-700"
                        onClick={() => completeBatch(batch.id)}
                      >
                        Complete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {batches.length === 0 && (
                <tr>
                  <td className="border p-2 text-center text-slate-400" colSpan={6}>No batches yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
