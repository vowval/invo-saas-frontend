'use client';

import { FormEvent, Fragment, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

type JobStatus =
  | 'RECEIVED'
  | 'IN_PROCESS'
  | 'READY_FOR_DELIVERY'
  | 'DELIVERED';

type DyeingJob = {
  id: string;
  jobNo: string;
  customerName: string;
  fabricType: string;
  colour?: string;
  shadeNo?: string;
  unit: string;
  quantityReceived: number | string;
  quantityDelivered: number | string;
  receivedDate: string;
  expectedDeliveryDate?: string;
  status: JobStatus;
  partyDcNo?: string;
  processNotes?: string;
};

type StageStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

type ProcessStage = {
  id: string;
  stageName: string;
  sequence: number;
  inputQty: number | string | null;
  outputQty: number | string | null;
  status: StageStatus;
  notes?: string;
};

const stageStatusLabels: Record<StageStatus, string> = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
};

const statuses: JobStatus[] = [
  'RECEIVED',
  'IN_PROCESS',
  'READY_FOR_DELIVERY',
  'DELIVERED',
];

const statusLabels: Record<JobStatus, string> = {
  RECEIVED: 'Received',
  IN_PROCESS: 'In process',
  READY_FOR_DELIVERY: 'Ready for delivery',
  DELIVERED: 'Delivered',
};

export default function DyeingJobsPage() {
  const [jobs, setJobs] = useState<DyeingJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [stagesByJob, setStagesByJob] = useState<Record<string, ProcessStage[]>>({});
  const [newStageName, setNewStageName] = useState('');
  const [outputInputs, setOutputInputs] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    jobNo: '',
    customerName: '',
    customerContact: '',
    fabricType: '',
    colour: '',
    shadeNo: '',
    unit: 'KG',
    quantityReceived: '',
    partyDcNo: '',
    receivedDate: new Date().toISOString().slice(0, 10),
    expectedDeliveryDate: '',
    processNotes: '',
    vehicleNo: '',
    lotNumber: '',
    rollCount: '',
    weight: '',
    inspectionNotes: '',
  });

  async function loadJobs() {
    try {
      setJobs(await apiFetch('/dyeing-jobs'));
    } catch {
      setError('Failed to load dyeing jobs');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadJobs();
  }, []);

  function updateForm(field: keyof typeof form, value: string) {
    setForm(current => ({ ...current, [field]: value }));
  }

  async function createJob(event: FormEvent) {
    event.preventDefault();
    setError('');
    try {
      await apiFetch('/dyeing-jobs', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          quantityReceived: Number(form.quantityReceived),
          rollCount: form.rollCount ? Number(form.rollCount) : undefined,
          weight: form.weight ? Number(form.weight) : undefined,
        }),
      });
      setForm(current => ({
        ...current,
        jobNo: '',
        customerName: '',
        customerContact: '',
        fabricType: '',
        colour: '',
        shadeNo: '',
        quantityReceived: '',
        partyDcNo: '',
        processNotes: '',
        vehicleNo: '',
        lotNumber: '',
        rollCount: '',
        weight: '',
        inspectionNotes: '',
      }));
      await loadJobs();
    } catch {
      setError('Failed to receive fabric');
    }
  }

  async function changeStatus(job: DyeingJob, status: JobStatus) {
    setError('');
    try {
      await apiFetch(`/dyeing-jobs/${job.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status,
          quantityDelivered:
            status === 'DELIVERED'
              ? Number(job.quantityReceived)
              : Number(job.quantityDelivered),
        }),
      });
      await loadJobs();
    } catch {
      setError('Failed to update job status');
    }
  }

  async function loadStages(jobId: string) {
    try {
      const stages = await apiFetch(`/dyeing-jobs/${jobId}/stages`);
      setStagesByJob(current => ({ ...current, [jobId]: stages }));
    } catch {
      setError('Failed to load process stages');
    }
  }

  async function toggleJob(jobId: string) {
    if (expandedJobId === jobId) {
      setExpandedJobId(null);
      return;
    }
    setExpandedJobId(jobId);
    if (!stagesByJob[jobId]) {
      await loadStages(jobId);
    }
  }

  async function addStage(jobId: string, event: FormEvent) {
    event.preventDefault();
    setError('');
    if (!newStageName.trim()) return;
    try {
      await apiFetch(`/dyeing-jobs/${jobId}/stages`, {
        method: 'POST',
        body: JSON.stringify({ stageName: newStageName.trim() }),
      });
      setNewStageName('');
      await loadStages(jobId);
      await loadJobs();
    } catch {
      setError('Failed to add process stage');
    }
  }

  async function startStage(jobId: string, stageId: string) {
    setError('');
    try {
      await apiFetch(`/dyeing-jobs/${jobId}/stages/${stageId}`, {
        method: 'PATCH',
        body: JSON.stringify({ action: 'start' }),
      });
      await loadStages(jobId);
    } catch {
      setError('Failed to start process stage');
    }
  }

  async function completeStage(jobId: string, stageId: string) {
    setError('');
    const outputQty = outputInputs[stageId];
    if (!outputQty) {
      setError('Enter the output quantity before completing the stage');
      return;
    }
    try {
      await apiFetch(`/dyeing-jobs/${jobId}/stages/${stageId}`, {
        method: 'PATCH',
        body: JSON.stringify({ action: 'complete', outputQty: Number(outputQty) }),
      });
      setOutputInputs(current => ({ ...current, [stageId]: '' }));
      await loadStages(jobId);
      await loadJobs();
    } catch {
      setError('Failed to complete process stage');
    }
  }

  function wastageSummary(job: DyeingJob, stages: ProcessStage[]) {
    const completed = stages.filter(stage => stage.status === 'COMPLETED' && stage.outputQty !== null);
    if (!completed.length) return null;
    const finalOutput = Number(completed[completed.length - 1].outputQty);
    const input = Number(job.quantityReceived);
    const wastageQty = Number((input - finalOutput).toFixed(3));
    const wastagePercent = input > 0 ? Number(((wastageQty / input) * 100).toFixed(2)) : 0;
    return { finalOutput, wastageQty, wastagePercent };
  }

  if (loading) return <p className="p-6">Loading dyeing jobs...</p>;

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-cyan-700 to-indigo-700 p-8 text-white shadow-lg">
        <p className="text-sm uppercase tracking-widest text-cyan-100">Fabric workflow</p>
        <h1 className="mt-2 text-3xl font-bold">Dyeing Jobs</h1>
        <p className="mt-3 text-cyan-100">
          Receive customer fabric, track dyeing, and record delivery.
        </p>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <form onSubmit={createJob} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Receive fabric</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {[
            ['jobNo', 'Job / challan number'],
            ['customerName', 'Customer name'],
            ['customerContact', 'Customer contact'],
            ['fabricType', 'Fabric type'],
            ['colour', 'Colour'],
            ['shadeNo', 'Shade number'],
            ['quantityReceived', 'Quantity received'],
            ['partyDcNo', 'Customer DC number'],
          ].map(([field, placeholder]) => (
            <input
              key={field}
              className="border p-2 rounded"
              type={field === 'quantityReceived' ? 'number' : 'text'}
              step={field === 'quantityReceived' ? '0.001' : undefined}
              min={field === 'quantityReceived' ? '0.001' : undefined}
              placeholder={placeholder}
              value={form[field as keyof typeof form]}
              onChange={event =>
                updateForm(field as keyof typeof form, event.target.value)
              }
              required={['jobNo', 'customerName', 'fabricType', 'quantityReceived'].includes(field)}
            />
          ))}
          <select
            className="border p-2 rounded"
            value={form.unit}
            onChange={event => updateForm('unit', event.target.value)}
          >
            <option value="KG">KG</option>
            <option value="MTR">MTR</option>
            <option value="PCS">PCS</option>
          </select>
          <label className="text-sm">
            Received date
            <input
              className="border p-2 rounded w-full"
              type="date"
              value={form.receivedDate}
              onChange={event => updateForm('receivedDate', event.target.value)}
              required
            />
          </label>
          <label className="text-sm">
            Expected delivery
            <input
              className="border p-2 rounded w-full"
              type="date"
              value={form.expectedDeliveryDate}
              onChange={event =>
                updateForm('expectedDeliveryDate', event.target.value)
              }
            />
          </label>
        </div>
        <div className="border-t pt-4">
          <h3 className="mb-2 text-sm font-semibold text-slate-700">GRN / inward receipt details (optional)</h3>
          <div className="grid gap-3 md:grid-cols-3">
            {[
              ['vehicleNo', 'Vehicle number'],
              ['lotNumber', 'Lot number'],
              ['rollCount', 'Roll count'],
              ['weight', 'Inspected weight'],
            ].map(([field, placeholder]) => (
              <input
                key={field}
                className="border p-2 rounded"
                type={field === 'rollCount' || field === 'weight' ? 'number' : 'text'}
                step={field === 'weight' ? '0.001' : field === 'rollCount' ? '1' : undefined}
                min="0"
                placeholder={placeholder}
                value={form[field as keyof typeof form]}
                onChange={event =>
                  updateForm(field as keyof typeof form, event.target.value)
                }
              />
            ))}
          </div>
          <textarea
            className="mt-3 border p-2 rounded w-full"
            placeholder="Inspection notes"
            value={form.inspectionNotes}
            onChange={event => updateForm('inspectionNotes', event.target.value)}
          />
        </div>
        <textarea
          className="border p-2 rounded w-full"
          placeholder="Dyeing process notes"
          value={form.processNotes}
          onChange={event => updateForm('processNotes', event.target.value)}
        />
        <button className="bg-black text-white px-4 py-2 rounded">
          Receive fabric
        </button>
      </form>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-600">
              <th className="border p-2 text-left">Job</th>
              <th className="border p-2 text-left">Customer</th>
              <th className="border p-2 text-left">Fabric / shade</th>
              <th className="border p-2 text-right">Received</th>
              <th className="border p-2">Status</th>
              <th className="border p-2">Update</th>
              <th className="border p-2">Stages</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map(job => {
              const stages = stagesByJob[job.id] ?? [];
              const summary = wastageSummary(job, stages);
              return (
              <Fragment key={job.id}>
                <tr>
                <td className="border-b p-3">
                  <div className="font-medium">{job.jobNo}</div>
                  <div className="text-xs text-gray-500">{job.receivedDate}</div>
                </td>
                <td className="border-b p-3">{job.customerName}</td>
                <td className="border-b p-3">
                  {job.fabricType} {job.colour ? `· ${job.colour}` : ''}
                  {job.shadeNo ? ` · ${job.shadeNo}` : ''}
                </td>
                <td className="border-b p-3 text-right">
                  {Number(job.quantityReceived).toFixed(3)} {job.unit}
                </td>
                <td className="border-b p-3"><span className="rounded-full bg-indigo-50 px-2 py-1 text-xs text-indigo-700">{statusLabels[job.status]}</span></td>
                <td className="border-b p-3">
                  <select
                    className="border p-1 rounded"
                    value={job.status}
                    onChange={event =>
                      changeStatus(job, event.target.value as JobStatus)
                    }
                  >
                    {statuses.map(status => (
                      <option key={status} value={status}>
                        {statusLabels[status]}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="border-b p-3">
                  <button
                    type="button"
                    className="rounded border border-indigo-200 px-3 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-50"
                    onClick={() => toggleJob(job.id)}
                  >
                    {expandedJobId === job.id ? 'Hide pipeline' : 'View pipeline'}
                  </button>
                </td>
                </tr>
                {expandedJobId === job.id && (
                  <tr key={`${job.id}-stages`}>
                    <td colSpan={7} className="border-b bg-slate-50 p-4">
                      <div className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <h3 className="text-sm font-semibold text-slate-800">
                            Process pipeline for {job.jobNo}
                          </h3>
                          {summary && (
                            <div className="flex gap-4 rounded-lg bg-white px-4 py-2 text-xs shadow-sm">
                              <span>Input: <strong>{Number(job.quantityReceived).toFixed(3)} {job.unit}</strong></span>
                              <span>Output: <strong>{summary.finalOutput.toFixed(3)} {job.unit}</strong></span>
                              <span className="text-amber-700">Wastage: <strong>{summary.wastageQty.toFixed(3)} {job.unit} ({summary.wastagePercent}%)</strong></span>
                            </div>
                          )}
                        </div>

                        {stages.length === 0 && (
                          <p className="text-sm text-slate-500">No process stages added yet.</p>
                        )}

                        <ol className="space-y-2">
                          {stages.map(stage => (
                            <li
                              key={stage.id}
                              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3"
                            >
                              <div>
                                <div className="font-medium text-slate-800">
                                  {stage.sequence}. {stage.stageName}
                                </div>
                                <div className="text-xs text-slate-500">
                                  Input: {stage.inputQty !== null ? Number(stage.inputQty).toFixed(3) : '—'} {job.unit}
                                  {stage.outputQty !== null && (
                                    <> · Output: {Number(stage.outputQty).toFixed(3)} {job.unit}</>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                                  {stageStatusLabels[stage.status]}
                                </span>
                                {stage.status === 'PENDING' && (
                                  <button
                                    type="button"
                                    className="rounded bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-700"
                                    onClick={() => startStage(job.id, stage.id)}
                                  >
                                    Start
                                  </button>
                                )}
                                {stage.status === 'IN_PROGRESS' && (
                                  <>
                                    <input
                                      className="w-28 rounded border p-1 text-xs"
                                      type="number"
                                      step="0.001"
                                      min="0"
                                      placeholder="Output qty"
                                      value={outputInputs[stage.id] ?? ''}
                                      onChange={event =>
                                        setOutputInputs(current => ({
                                          ...current,
                                          [stage.id]: event.target.value,
                                        }))
                                      }
                                    />
                                    <button
                                      type="button"
                                      className="rounded bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-700"
                                      onClick={() => completeStage(job.id, stage.id)}
                                    >
                                      Complete
                                    </button>
                                  </>
                                )}
                              </div>
                            </li>
                          ))}
                        </ol>

                        <form
                          onSubmit={event => addStage(job.id, event)}
                          className="flex items-center gap-2"
                        >
                          <input
                            className="border p-2 rounded text-sm"
                            placeholder="New stage name (e.g. Dye, Wash, Compact)"
                            value={newStageName}
                            onChange={event => setNewStageName(event.target.value)}
                          />
                          <button className="rounded bg-black px-3 py-2 text-xs font-medium text-white">
                            Add stage
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
              );
            })}
            {jobs.length === 0 && (
              <tr>
                <td colSpan={7} className="border p-4 text-center text-gray-500">
                  No dyeing jobs received yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      </div>
    </main>
  );
}
