'use client';

import { FormEvent, useEffect, useState } from 'react';
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
            </tr>
          </thead>
          <tbody>
            {jobs.map(job => (
              <tr key={job.id}>
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
              </tr>
            ))}
            {jobs.length === 0 && (
              <tr>
                <td colSpan={6} className="border p-4 text-center text-gray-500">
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
