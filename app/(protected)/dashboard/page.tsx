'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

type Job = {
  id: string;
  jobNo: string;
  customerName: string;
  fabricType: string;
  unit: string;
  quantityReceived: number | string;
  status: 'RECEIVED' | 'IN_PROCESS' | 'READY_FOR_DELIVERY' | 'DELIVERED';
};

type Invoice = {
  id: string;
  invoiceNo: string;
  buyerName: string;
  totalAmount: number | string;
};

const statusLabels = {
  RECEIVED: 'Received',
  IN_PROCESS: 'In process',
  READY_FOR_DELIVERY: 'Ready for delivery',
  DELIVERED: 'Delivered',
};

export default function DashboardPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      router.push('/login');
      return;
    }
    Promise.all([apiFetch('/dyeing-jobs'), apiFetch('/invoices')])
      .then(([jobsData, invoicesData]) => {
        setJobs(jobsData);
        setInvoices(invoicesData);
      })
      .catch(() => setError('Failed to load dashboard data'));
  }, [router]);

  const activeJobs = jobs.filter(job => job.status !== 'DELIVERED').length;
  const readyJobs = jobs.filter(job => job.status === 'READY_FOR_DELIVERY').length;
  const receivedByUnit = jobs.reduce<Record<string, number>>((totals, job) => {
    totals[job.unit] = (totals[job.unit] || 0) + Number(job.quantityReceived);
    return totals;
  }, {});
  const receivedQuantity = Object.entries(receivedByUnit)
    .map(([unit, quantity]) => `${quantity.toFixed(3)} ${unit}`)
    .join(' · ') || '0';
  const invoiceTotal = invoices.reduce(
    (total, invoice) => total + Number(invoice.totalAmount),
    0,
  );

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-8">
      <div className="rounded-2xl bg-gradient-to-r from-indigo-700 via-indigo-600 to-cyan-600 p-8 text-white shadow-lg">
        <p className="text-sm uppercase tracking-widest text-indigo-100">Operations overview</p>
        <h1 className="mt-2 text-3xl font-bold">Dyeing Factory Dashboard</h1>
        <p className="mt-3 text-indigo-100">
          Track incoming fabric, dyeing progress, deliveries, and job work billing.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button onClick={() => router.push('/dyeing-jobs')} className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50">Receive fabric</button>
          <button onClick={() => router.push('/invoices')} className="rounded-lg bg-indigo-900/30 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-900/50">Create invoice</button>
        </div>
      </div>

      {error && <p className="text-red-600">{error}</p>}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Active jobs', activeJobs.toString(), 'Fabric currently in the workflow'],
          ['Ready for delivery', readyJobs.toString(), 'Completed dyeing jobs'],
          ['Fabric received', receivedQuantity, 'Total quantity recorded'],
          ['Invoice value', `₹ ${invoiceTotal.toFixed(2)}`, 'Job work invoice subtotal'],
        ].map(([label, value, hint]) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
            <p className="mt-1 text-xs text-slate-500">{hint}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Recent dyeing jobs</h2>
            <button
              className="text-sm underline"
              onClick={() => router.push('/dyeing-jobs')}
            >
              View all
            </button>
          </div>
          <div className="space-y-3">
            {jobs.slice(0, 5).map(job => (
              <div key={job.id} className="flex justify-between border-b pb-3">
                <div>
                  <p className="font-medium">{job.jobNo} · {job.customerName}</p>
                  <p className="text-sm text-gray-500">
                    {job.fabricType} · {Number(job.quantityReceived).toFixed(3)} {job.unit}
                  </p>
                </div>
                <span className="text-sm text-gray-600">
                  {statusLabels[job.status]}
                </span>
              </div>
            ))}
            {jobs.length === 0 && <p className="text-sm text-gray-500">No jobs received yet.</p>}
          </div>
        </div>

        <div className="rounded-lg border p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Recent invoices</h2>
            <button
              className="text-sm underline"
              onClick={() => router.push('/invoices')}
            >
              View all
            </button>
          </div>
          <div className="space-y-3">
            {invoices.slice(0, 5).map(invoice => (
              <div key={invoice.id} className="flex justify-between border-b pb-3">
                <span>{invoice.invoiceNo} · {invoice.buyerName}</span>
                <span className="font-medium">₹ {Number(invoice.totalAmount).toFixed(2)}</span>
              </div>
            ))}
            {invoices.length === 0 && <p className="text-sm text-gray-500">No invoices created yet.</p>}
          </div>
        </div>
      </section>
      </div>
    </main>
  );
}
