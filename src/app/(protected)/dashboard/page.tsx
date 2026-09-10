'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { TooltipValueType } from 'recharts';

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
  invoiceDate?: string;
  createdAt?: string;
};

const formatNumber = (value: number | string, maximumFractionDigits = 3) =>
  Number(value).toLocaleString('en-US', { maximumFractionDigits });

const formatCurrency = (value: number | string, maximumFractionDigits = 2) =>
  `₹${formatNumber(value, maximumFractionDigits)}`;

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
    Promise.all([apiFetch("/dyeing-jobs"), apiFetch("/invoices")])
      .then(([jobsData, invoicesData]) => {
        setJobs(jobsData);
        setInvoices(invoicesData);
      })
      .catch(() => setError("Failed to load dashboard data"));
  }, []);


  const activeJobs = jobs.filter(job => job.status !== 'DELIVERED').length;
  const readyJobs = jobs.filter(job => job.status === 'READY_FOR_DELIVERY').length;
  const receivedByUnit = jobs.reduce<Record<string, number>>((totals, job) => {
    totals[job.unit] = (totals[job.unit] || 0) + Number(job.quantityReceived);
    return totals;
  }, {});
  const receivedQuantity = Object.entries(receivedByUnit)
    .map(([unit, quantity]) => `${formatNumber(quantity)} ${unit}`)
    .join(' · ') || '0';
  const invoiceTotal = invoices.reduce(
    (total, invoice) => total + Number(invoice.totalAmount),
    0,
  );

  const statusData = useMemo(() => {
    const counts: Record<string, number> = { RECEIVED: 0, IN_PROCESS: 0, READY_FOR_DELIVERY: 0, DELIVERED: 0 };
    jobs.forEach(job => { counts[job.status] = (counts[job.status] || 0) + 1; });
    return Object.entries(counts)
      .filter(([, count]) => count > 0)
      .map(([status, count]) => ({ name: statusLabels[status as keyof typeof statusLabels], value: count }));
  }, [jobs]);
  const statusColors = ['#6366f1', '#f59e0b', '#0ea5e9', '#059669'];

  const invoiceTrend = useMemo(() => {
    const byMonth: Record<string, number> = {};
    invoices.forEach(invoice => {
      const invoiceDate = invoice.invoiceDate ?? invoice.createdAt;
      if (!invoiceDate) return;
      const d = new Date(invoiceDate);
      const key = d.toLocaleString('en-US', { month: 'short' });
      byMonth[key] = (byMonth[key] || 0) + Number(invoice.totalAmount);
    });
    return Object.entries(byMonth).map(([month, total]) => ({ month, total }));
  }, [invoices]);

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-8">
      <div className="rounded-2xl bg-gradient-to-r from-indigo-700 via-indigo-600 to-cyan-600 p-6 sm:p-8 text-white shadow-lg">
        <p className="text-sm uppercase tracking-widest text-indigo-100">Operations overview</p>
        <h1 className="mt-2 text-2xl sm:text-3xl font-bold">Dyeing Factory Dashboard</h1>
        <p className="mt-3 text-indigo-100">
          Track incoming fabric, dyeing progress, deliveries, and job work billing.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button onClick={() => router.push('/dyeing-jobs')} className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50">Receive fabric</button>
          <button onClick={() => router.push('/invoices')} className="rounded-lg bg-indigo-900/30 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-900/50">Create invoice</button>
          <button onClick={() => router.push('/customers')} className="rounded-lg bg-indigo-900/30 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-900/50">Customer ledger</button>
        </div>
      </div>

      {error && <p className="text-red-600">{error}</p>}

      <section className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[
          ['Active jobs', formatNumber(activeJobs, 0), 'Fabric currently in the workflow'],
          ['Ready for delivery', formatNumber(readyJobs, 0), 'Completed dyeing jobs'],
          ['Fabric received', receivedQuantity, 'Total quantity recorded'],
          ['Invoice value', formatCurrency(invoiceTotal), 'Job work invoice subtotal'],
        ].map(([label, value, hint]) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
            <p className="text-xs sm:text-sm font-medium text-slate-500">{label}</p>
            <p className="mt-2 text-xl sm:text-2xl font-bold text-slate-900">{value}</p>
            <p className="mt-1 text-xs text-slate-500">{hint}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
          <h2 className="font-semibold text-slate-900">Invoice value by month</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={invoiceTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} width={60} />
                <Tooltip formatter={(value: TooltipValueType | undefined) => formatCurrency(Number(Array.isArray(value) ? value[0] : value ?? 0))} />
                <Bar dataKey="total" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            {invoiceTrend.length === 0 && (
              <p className="text-center text-sm text-slate-400 -mt-40">No invoices yet</p>
            )}
          </div>
        </div>
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
          <h2 className="font-semibold text-slate-900">Jobs by status</h2>
          <div className="mt-2 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" innerRadius="50%" outerRadius="80%" paddingAngle={3}>
                  {statusData.map((entry, index) => (
                    <Cell key={entry.name} fill={statusColors[index % statusColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            {statusData.length === 0 && (
              <p className="text-center text-sm text-slate-400 -mt-40">No jobs yet</p>
            )}
          </div>
        </div>
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
                    {job.fabricType} · {formatNumber(job.quantityReceived)} {job.unit}
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
                <span className="font-medium">{formatCurrency(invoice.totalAmount)}</span>
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
