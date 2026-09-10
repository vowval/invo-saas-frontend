'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { TooltipValueType } from 'recharts';

type CustomerSummary = {
  customerName: string;
  jobCount: number;
  activeJobCount: number;
  invoiceCount: number;
  invoicedTotal: number;
  receivedTotal: number;
  outstanding: number;
  lastActivity: string | null;
};

const inr = (value: number) =>
  `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [paymentForm, setPaymentForm] = useState({
    customerName: '',
    amount: '',
    paymentDate: new Date().toISOString().slice(0, 10),
    mode: 'BANK_TRANSFER',
    referenceNo: '',
    remarks: '',
  });

  async function load() {
    try {
      const data = await apiFetch('/customers');
      setCustomers(data);
    } catch {
      setError('Failed to load customer ledger');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function recordPayment(event: FormEvent) {
    event.preventDefault();
    setError('');
    try {
      await apiFetch('/payments', {
        method: 'POST',
        body: JSON.stringify({ ...paymentForm, amount: paymentForm.amount }),
      });
      setPaymentForm(current => ({ ...current, amount: '', referenceNo: '', remarks: '' }));
      await load();
    } catch {
      setError('Failed to record payment');
    }
  }

  const filtered = useMemo(
    () => customers.filter(customer => customer.customerName.toLowerCase().includes(search.toLowerCase())),
    [customers, search],
  );

  const totals = useMemo(
    () =>
      customers.reduce(
        (acc, customer) => ({
          invoiced: acc.invoiced + customer.invoicedTotal,
          received: acc.received + customer.receivedTotal,
          outstanding: acc.outstanding + customer.outstanding,
        }),
        { invoiced: 0, received: 0, outstanding: 0 },
      ),
    [customers],
  );

  const topOutstanding = useMemo(
    () =>
      [...customers]
        .filter(customer => customer.outstanding > 0)
        .sort((a, b) => b.outstanding - a.outstanding)
        .slice(0, 8),
    [customers],
  );

  const pieData = useMemo(
    () => [
      { name: 'Received', value: totals.received },
      { name: 'Outstanding', value: Math.max(totals.outstanding, 0) },
    ],
    [totals],
  );
  const pieColors = ['#059669', '#dc2626'];

  if (loading) return <p className="p-6">Loading customer ledger...</p>;

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-2xl bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-700 p-6 sm:p-8 text-white shadow-lg">
          <p className="text-sm uppercase tracking-widest text-emerald-100">Accounts receivable</p>
          <h1 className="mt-2 text-2xl sm:text-3xl font-bold">Customer Ledger</h1>
          <p className="mt-3 text-emerald-100 max-w-2xl">
            One place to answer &ldquo;who owes me money&rdquo; — job work, invoices raised, and payments received, per customer.
          </p>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <section className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
            <p className="text-xs sm:text-sm font-medium text-slate-500">Total invoiced</p>
            <p className="mt-2 text-xl sm:text-2xl font-bold text-slate-900">{inr(totals.invoiced)}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
            <p className="text-xs sm:text-sm font-medium text-slate-500">Total received</p>
            <p className="mt-2 text-xl sm:text-2xl font-bold text-emerald-600">{inr(totals.received)}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
            <p className="text-xs sm:text-sm font-medium text-slate-500">Outstanding</p>
            <p className="mt-2 text-xl sm:text-2xl font-bold text-red-600">{inr(totals.outstanding)}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
            <p className="text-xs sm:text-sm font-medium text-slate-500">Customers</p>
            <p className="mt-2 text-xl sm:text-2xl font-bold text-slate-900">{customers.length}</p>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-5">
          <div className="lg:col-span-3 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
            <h2 className="font-semibold text-slate-900">Top outstanding customers</h2>
            <div className="mt-4 h-64 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topOutstanding} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickFormatter={value => inr(value)} tick={{ fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="customerName"
                    width={110}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip formatter={(value: TooltipValueType | undefined) => inr(Number(Array.isArray(value) ? value[0] : value ?? 0))} />
                  <Bar dataKey="outstanding" fill="#dc2626" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
              {topOutstanding.length === 0 && (
                <p className="text-center text-sm text-slate-400 -mt-40">No outstanding balances 🎉</p>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
            <h2 className="font-semibold text-slate-900">Received vs outstanding</h2>
            <div className="mt-2 h-64 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="55%"
                    outerRadius="80%"
                    paddingAngle={3}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip formatter={(value: TooltipValueType | undefined) => inr(Number(Array.isArray(value) ? value[0] : value ?? 0))} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        <form onSubmit={recordPayment} className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">Record a payment</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <input
              className="border p-2 rounded w-full lg:col-span-2"
              placeholder="Customer name"
              value={paymentForm.customerName}
              onChange={event => setPaymentForm(current => ({ ...current, customerName: event.target.value }))}
              required
              list="customer-names"
            />
            <datalist id="customer-names">
              {customers.map(customer => (
                <option key={customer.customerName} value={customer.customerName} />
              ))}
            </datalist>
            <input
              className="border p-2 rounded w-full"
              type="number"
              step="0.01"
              placeholder="Amount"
              value={paymentForm.amount}
              onChange={event => setPaymentForm(current => ({ ...current, amount: event.target.value }))}
              required
            />
            <input
              className="border p-2 rounded w-full"
              type="date"
              value={paymentForm.paymentDate}
              onChange={event => setPaymentForm(current => ({ ...current, paymentDate: event.target.value }))}
              required
            />
            <select
              className="border p-2 rounded w-full"
              value={paymentForm.mode}
              onChange={event => setPaymentForm(current => ({ ...current, mode: event.target.value }))}
            >
              <option value="CASH">Cash</option>
              <option value="BANK_TRANSFER">Bank transfer</option>
              <option value="UPI">UPI</option>
              <option value="CHEQUE">Cheque</option>
              <option value="OTHER">Other</option>
            </select>
            <input
              className="border p-2 rounded w-full"
              placeholder="Reference no."
              value={paymentForm.referenceNo}
              onChange={event => setPaymentForm(current => ({ ...current, referenceNo: event.target.value }))}
            />
          </div>
          <input
            className="border p-2 rounded w-full"
            placeholder="Remarks (optional)"
            value={paymentForm.remarks}
            onChange={event => setPaymentForm(current => ({ ...current, remarks: event.target.value }))}
          />
          <button className="bg-emerald-700 text-white px-4 py-2 rounded hover:bg-emerald-800">Record payment</button>
        </form>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">All customers</h2>
            <input
              className="border p-2 rounded w-full sm:w-64"
              placeholder="Search customer..."
              value={search}
              onChange={event => setSearch(event.target.value)}
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm min-w-[720px]">
              <thead>
                <tr className="bg-slate-50 text-slate-600">
                  <th className="border-b p-2 text-left">Customer</th>
                  <th className="border-b p-2">Active jobs</th>
                  <th className="border-b p-2">Invoices</th>
                  <th className="border-b p-2 text-right">Invoiced</th>
                  <th className="border-b p-2 text-right">Received</th>
                  <th className="border-b p-2 text-right">Outstanding</th>
                  <th className="border-b p-2"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(customer => (
                  <tr key={customer.customerName} className="hover:bg-slate-50">
                    <td className="border-b p-2 font-medium text-slate-800">{customer.customerName}</td>
                    <td className="border-b p-2 text-center">{customer.activeJobCount}/{customer.jobCount}</td>
                    <td className="border-b p-2 text-center">{customer.invoiceCount}</td>
                    <td className="border-b p-2 text-right">{inr(customer.invoicedTotal)}</td>
                    <td className="border-b p-2 text-right text-emerald-600">{inr(customer.receivedTotal)}</td>
                    <td className={`border-b p-2 text-right font-semibold ${customer.outstanding > 0 ? 'text-red-600' : 'text-slate-500'}`}>
                      {inr(customer.outstanding)}
                    </td>
                    <td className="border-b p-2 text-center">
                      <button
                        className="rounded bg-slate-800 px-2 py-1 text-xs text-white hover:bg-slate-700"
                        onClick={() => router.push(`/customers/${encodeURIComponent(customer.customerName)}`)}
                      >
                        View ledger
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td className="border-b p-4 text-center text-slate-400" colSpan={7}>No customers found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
