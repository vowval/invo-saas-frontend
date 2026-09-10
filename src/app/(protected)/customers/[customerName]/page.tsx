'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { TooltipValueType } from 'recharts';

type Ledger = {
  customerName: string;
  summary: {
    invoicedTotal: number;
    receivedTotal: number;
    outstanding: number;
    jobCount: number;
    activeJobCount: number;
  };
  jobs: Array<{
    id: string;
    jobNo: string;
    fabricType: string;
    quantityReceived: number | string;
    quantityDelivered: number | string;
    unit: string;
    status: string;
    trackingStatus: string;
    receivedDate: string;
  }>;
  invoices: Array<{
    id: string;
    invoiceNo: string;
    invoiceDate: string;
    grandTotal: number | string;
    itemCount: number;
  }>;
  payments: Array<{
    id: string;
    paymentDate: string;
    amount: number | string;
    mode: string;
    referenceNo?: string;
    remarks?: string;
  }>;
  trend: Array<{ month: string; invoiced: number; received: number }>;
};

const inr = (value: number) =>
  `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

export default function CustomerLedgerPage() {
  const params = useParams();
  const router = useRouter();
  const customerName = decodeURIComponent(String(params.customerName ?? ''));
  const [ledger, setLedger] = useState<Ledger | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!customerName) return;
    apiFetch(`/customers/${encodeURIComponent(customerName)}/ledger`)
      .then(setLedger)
      .catch(() => setError('Failed to load customer ledger'))
      .finally(() => setLoading(false));
  }, [customerName]);

  if (loading) return <p className="p-6">Loading ledger...</p>;
  if (error || !ledger) return <p className="p-6 text-red-600">{error || 'Customer not found'}</p>;

  const { summary } = ledger;

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <button
          className="text-sm text-slate-500 hover:text-slate-800"
          onClick={() => router.push('/customers')}
        >
          ← Back to all customers
        </button>

        <div className="rounded-2xl bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-700 p-6 sm:p-8 text-white shadow-lg">
          <p className="text-sm uppercase tracking-widest text-emerald-100">Customer ledger</p>
          <h1 className="mt-2 text-2xl sm:text-3xl font-bold">{ledger.customerName}</h1>
          <p className="mt-3 text-emerald-100">
            {summary.activeJobCount} active job(s) of {summary.jobCount} total · {ledger.invoices.length} invoice(s)
          </p>
        </div>

        <section className="grid gap-4 grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
            <p className="text-xs sm:text-sm font-medium text-slate-500">Invoiced</p>
            <p className="mt-2 text-xl sm:text-2xl font-bold text-slate-900">{inr(summary.invoicedTotal)}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
            <p className="text-xs sm:text-sm font-medium text-slate-500">Received</p>
            <p className="mt-2 text-xl sm:text-2xl font-bold text-emerald-600">{inr(summary.receivedTotal)}</p>
          </div>
          <div className="col-span-2 lg:col-span-1 rounded-2xl border border-red-200 bg-red-50 p-4 sm:p-5 shadow-sm">
            <p className="text-xs sm:text-sm font-medium text-red-500">Outstanding</p>
            <p className="mt-2 text-xl sm:text-2xl font-bold text-red-700">{inr(summary.outstanding)}</p>
          </div>
        </section>

        {ledger.trend.length > 0 && (
          <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
            <h2 className="font-semibold text-slate-900">Invoiced vs received (last 6 months)</h2>
            <div className="mt-4 h-64 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={ledger.trend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={value => inr(value)} tick={{ fontSize: 11 }} width={70} />
                  <Tooltip formatter={(value: TooltipValueType | undefined) => inr(Number(Array.isArray(value) ? value[0] : value ?? 0))} />
                  <Legend />
                  <Bar dataKey="invoiced" fill="#6366f1" radius={[6, 6, 0, 0]} name="Invoiced" />
                  <Line type="monotone" dataKey="received" stroke="#059669" strokeWidth={2} name="Received" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <h2 className="p-4 font-semibold text-slate-900 border-b border-slate-100">Job work</h2>
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
              {ledger.jobs.map(job => (
                <div key={job.id} className="p-3 text-sm">
                  <p className="font-medium text-slate-800">{job.jobNo}</p>
                  <p className="text-slate-500">{job.fabricType} · {Number(job.quantityReceived).toFixed(0)} {job.unit}</p>
                  <p className="text-xs text-slate-400">{job.trackingStatus?.replaceAll('_', ' ')}</p>
                </div>
              ))}
              {ledger.jobs.length === 0 && <p className="p-4 text-sm text-slate-400">No jobs</p>}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <h2 className="p-4 font-semibold text-slate-900 border-b border-slate-100">Invoices</h2>
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
              {ledger.invoices.map(invoice => (
                <div key={invoice.id} className="p-3 text-sm flex justify-between">
                  <div>
                    <p className="font-medium text-slate-800">{invoice.invoiceNo}</p>
                    <p className="text-xs text-slate-400">{new Date(invoice.invoiceDate).toLocaleDateString()}</p>
                  </div>
                  <p className="font-semibold text-slate-700">{inr(Number(invoice.grandTotal))}</p>
                </div>
              ))}
              {ledger.invoices.length === 0 && <p className="p-4 text-sm text-slate-400">No invoices</p>}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <h2 className="p-4 font-semibold text-slate-900 border-b border-slate-100">Payments</h2>
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
              {ledger.payments.map(payment => (
                <div key={payment.id} className="p-3 text-sm flex justify-between">
                  <div>
                    <p className="font-medium text-slate-800">{new Date(payment.paymentDate).toLocaleDateString()}</p>
                    <p className="text-xs text-slate-400">{payment.mode.replaceAll('_', ' ')}{payment.referenceNo ? ` · ${payment.referenceNo}` : ''}</p>
                  </div>
                  <p className="font-semibold text-emerald-600">{inr(Number(payment.amount))}</p>
                </div>
              ))}
              {ledger.payments.length === 0 && <p className="p-4 text-sm text-slate-400">No payments recorded</p>}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
