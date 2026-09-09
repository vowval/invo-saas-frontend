'use client';

import { FormEvent, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

type Chemical = {
  id: string;
  name: string;
  category: 'DYE' | 'CHEMICAL' | 'OTHER';
  unit: string;
  currentStock: number | string;
  minStockLevel: number | string;
};

type Transaction = {
  id: string;
  type: 'OPENING' | 'PURCHASE' | 'CONSUMPTION' | 'WASTAGE' | 'ADJUSTMENT';
  quantity: number | string;
  notes?: string;
  createdAt: string;
  batch?: { batchNo: string } | null;
};

const categoryLabels: Record<Chemical['category'], string> = {
  DYE: 'Dye',
  CHEMICAL: 'Chemical',
  OTHER: 'Other',
};

export default function ChemicalsPage() {
  const [chemicals, setChemicals] = useState<Chemical[]>([]);
  const [lowStock, setLowStock] = useState<Chemical[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: '',
    category: 'CHEMICAL' as Chemical['category'],
    unit: 'kg',
    openingStock: '',
    minStockLevel: '',
  });

  const [selected, setSelected] = useState<Chemical | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [movement, setMovement] = useState({ type: 'purchase', quantity: '', notes: '' });

  async function loadChemicals() {
    try {
      const [all, low] = await Promise.all([
        apiFetch('/inventory/chemicals'),
        apiFetch('/inventory/chemicals/low-stock'),
      ]);
      setChemicals(all);
      setLowStock(low);
    } catch {
      setError('Failed to load chemical inventory');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadChemicals();
  }, []);

  async function createChemical(event: FormEvent) {
    event.preventDefault();
    setError('');
    try {
      await apiFetch('/inventory/chemicals', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          openingStock: form.openingStock ? Number(form.openingStock) : 0,
          minStockLevel: form.minStockLevel ? Number(form.minStockLevel) : 0,
        }),
      });
      setForm({ name: '', category: 'CHEMICAL', unit: 'kg', openingStock: '', minStockLevel: '' });
      await loadChemicals();
    } catch {
      setError('Failed to add chemical item');
    }
  }

  async function openHistory(chemical: Chemical) {
    setSelected(chemical);
    setError('');
    try {
      setTransactions(await apiFetch(`/inventory/chemicals/${chemical.id}/transactions`));
    } catch {
      setError('Failed to load stock history');
    }
  }

  async function recordMovement(event: FormEvent) {
    event.preventDefault();
    if (!selected) return;
    setError('');
    const endpoint =
      movement.type === 'purchase' ? 'purchase' : movement.type === 'wastage' ? 'wastage' : 'adjustment';
    try {
      await apiFetch(`/inventory/chemicals/${selected.id}/${endpoint}`, {
        method: 'POST',
        body: JSON.stringify({ quantity: Number(movement.quantity), notes: movement.notes }),
      });
      setMovement({ type: 'purchase', quantity: '', notes: '' });
      await loadChemicals();
      await openHistory(selected);
    } catch {
      setError('Failed to record stock movement');
    }
  }

  if (loading) return <p className="p-6">Loading chemical inventory...</p>;

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-2xl bg-gradient-to-r from-cyan-700 to-indigo-700 p-8 text-white shadow-lg">
          <p className="text-sm uppercase tracking-widest text-cyan-100">Inventory</p>
          <h1 className="mt-2 text-3xl font-bold">Chemical &amp; Dye Stock</h1>
          <p className="mt-3 text-cyan-100">
            Track opening stock, purchases, production consumption and wastage for every dye and chemical.
          </p>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        {lowStock.length > 0 && (
          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4">
            <h2 className="font-semibold text-amber-800">⚠ Low stock alert</h2>
            <p className="text-sm text-amber-700">
              {lowStock.map(c => c.name).join(', ')} {lowStock.length === 1 ? 'is' : 'are'} at or below the minimum stock level.
            </p>
          </div>
        )}

        <form onSubmit={createChemical} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">Add chemical / dye item</h2>
          <div className="grid gap-3 md:grid-cols-3">
            <input
              className="border p-2 rounded w-full"
              placeholder="Name (e.g. Reactive Blue)"
              value={form.name}
              onChange={event => setForm(current => ({ ...current, name: event.target.value }))}
              required
            />
            <select
              className="border p-2 rounded w-full"
              value={form.category}
              onChange={event => setForm(current => ({ ...current, category: event.target.value as Chemical['category'] }))}
            >
              <option value="DYE">Dye</option>
              <option value="CHEMICAL">Chemical</option>
              <option value="OTHER">Other</option>
            </select>
            <input
              className="border p-2 rounded w-full"
              placeholder="Unit (e.g. kg)"
              value={form.unit}
              onChange={event => setForm(current => ({ ...current, unit: event.target.value }))}
            />
            <input
              className="border p-2 rounded w-full"
              type="number"
              step="0.001"
              min="0"
              placeholder="Opening stock"
              value={form.openingStock}
              onChange={event => setForm(current => ({ ...current, openingStock: event.target.value }))}
            />
            <input
              className="border p-2 rounded w-full"
              type="number"
              step="0.001"
              min="0"
              placeholder="Minimum stock level (alert threshold)"
              value={form.minStockLevel}
              onChange={event => setForm(current => ({ ...current, minStockLevel: event.target.value }))}
            />
          </div>
          <button className="bg-black text-white px-4 py-2 rounded">Add item</button>
        </form>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600">
                <th className="border p-2 text-left">Item</th>
                <th className="border p-2 text-left">Category</th>
                <th className="border p-2">Current stock</th>
                <th className="border p-2">Min level</th>
                <th className="border p-2">History</th>
              </tr>
            </thead>
            <tbody>
              {chemicals.map(chemical => {
                const isLow = Number(chemical.currentStock) <= Number(chemical.minStockLevel);
                return (
                  <tr key={chemical.id} className={isLow ? 'bg-amber-50' : ''}>
                    <td className="border p-2">{chemical.name}</td>
                    <td className="border p-2">{categoryLabels[chemical.category]}</td>
                    <td className="border p-2 text-center font-medium">
                      {Number(chemical.currentStock).toFixed(3)} {chemical.unit}
                      {isLow && <span className="ml-1 text-amber-600">⚠</span>}
                    </td>
                    <td className="border p-2 text-center">{Number(chemical.minStockLevel).toFixed(3)}</td>
                    <td className="border p-2 text-center">
                      <button
                        type="button"
                        className="rounded bg-slate-700 px-2 py-1 text-xs text-white hover:bg-slate-800"
                        onClick={() => openHistory(chemical)}
                      >
                        View / update
                      </button>
                    </td>
                  </tr>
                );
              })}
              {chemicals.length === 0 && (
                <tr>
                  <td className="border p-2 text-center text-slate-400" colSpan={5}>No chemical items yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {selected && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                {selected.name} — stock ledger
              </h2>
              <button type="button" className="text-sm text-slate-400 hover:text-slate-700" onClick={() => setSelected(null)}>
                Close
              </button>
            </div>

            <form onSubmit={recordMovement} className="flex flex-wrap items-end gap-3">
              <div>
                <label className="block text-xs text-slate-500">Type</label>
                <select
                  className="border p-2 rounded"
                  value={movement.type}
                  onChange={event => setMovement(current => ({ ...current, type: event.target.value }))}
                >
                  <option value="purchase">Purchase (stock in)</option>
                  <option value="wastage">Wastage (stock out)</option>
                  <option value="adjustment">Manual adjustment (+/-)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-500">Quantity ({selected.unit})</label>
                <input
                  className="border p-2 rounded"
                  type="number"
                  step="0.001"
                  placeholder={movement.type === 'adjustment' ? '+/- quantity' : 'Quantity'}
                  value={movement.quantity}
                  onChange={event => setMovement(current => ({ ...current, quantity: event.target.value }))}
                  required
                />
              </div>
              <div className="flex-1 min-w-[160px]">
                <label className="block text-xs text-slate-500">Notes</label>
                <input
                  className="border p-2 rounded w-full"
                  placeholder="Optional notes"
                  value={movement.notes}
                  onChange={event => setMovement(current => ({ ...current, notes: event.target.value }))}
                />
              </div>
              <button className="bg-cyan-700 text-white px-4 py-2 rounded">Record</button>
            </form>

            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-600">
                  <th className="border p-2 text-left">Date</th>
                  <th className="border p-2 text-left">Type</th>
                  <th className="border p-2">Quantity</th>
                  <th className="border p-2 text-left">Notes</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(txn => (
                  <tr key={txn.id}>
                    <td className="border p-2">{new Date(txn.createdAt).toLocaleString()}</td>
                    <td className="border p-2">{txn.type}</td>
                    <td className={`border p-2 text-center ${Number(txn.quantity) < 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                      {Number(txn.quantity) > 0 ? '+' : ''}{Number(txn.quantity).toFixed(3)}
                    </td>
                    <td className="border p-2">
                      {txn.notes || (txn.batch ? `Batch ${txn.batch.batchNo}` : '—')}
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td className="border p-2 text-center text-slate-400" colSpan={4}>No transactions yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
