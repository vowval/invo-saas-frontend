'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

type Product = {
  id: string;
  name: string;
  description?: string;
  hsnCode?: string;
  unit: string;
  rate: number | string;
};

type InvoiceItem = {
  dyeingJobId: string;
  productId: string;
  quantity: number;
  rate: number;
  partyDcNo: string;
  partyDcDate: string;
  deliveryDcNo: string;
  colour: string;
  fabricWidth: string;
};

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
  partyDcNo?: string;
  receivedDate: string;
  status: 'RECEIVED' | 'IN_PROCESS' | 'READY_FOR_DELIVERY' | 'DELIVERED';
};

type Invoice = {
  id: string;
  invoiceNo: string;
  buyerName: string;
  invoiceDate: string;
  totalAmount: number | string;
  grandTotal: number | string;
};

export default function InvoicesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [activeJobs, setActiveJobs] = useState<DyeingJob[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // invoice form
  const [buyerName, setBuyerName] = useState('');
  const [buyerAddress, setBuyerAddress] = useState('');
  const [buyerGstin, setBuyerGstin] = useState('');
  const [orderNo, setOrderNo] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [gstRate, setGstRate] = useState('5');
  const [supplyType, setSupplyType] = useState<'INTRA_STATE' | 'INTER_STATE'>('INTRA_STATE');
  const [placeOfSupply, setPlaceOfSupply] = useState('');

  function finiteNumber(value: number | string | undefined) {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
  }

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [productsRes, invoicesRes, jobsRes] = await Promise.all([
        apiFetch('/products'),
        apiFetch('/invoices'),
        apiFetch('/dyeing-jobs/active'),
      ]);

      setProducts(productsRes);
      setInvoices(invoicesRes);
      setActiveJobs(jobsRes);
    } catch {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  function addItem() {
    setItems([
      ...items,
      {
        dyeingJobId: '',
        productId: '',
        quantity: 1,
        rate: 0,
        partyDcNo: '',
        partyDcDate: '',
        deliveryDcNo: '',
        colour: '',
        fabricWidth: '',
      },
    ]);
  }

  function updateItem<K extends keyof InvoiceItem>(
    index: number,
    field: K,
    value: InvoiceItem[K],
  ) {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  }

  function selectJob(index: number, jobId: string) {
    const job = activeJobs.find(currentJob => currentJob.id === jobId);
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      dyeingJobId: jobId,
      quantity: job
        ? Math.max(0.001, finiteNumber(job.quantityReceived) - finiteNumber(job.quantityDelivered))
        : updated[index].quantity,
      partyDcNo: job?.partyDcNo || '',
      partyDcDate: job?.receivedDate || '',
      colour: job?.colour || '',
    };
    setItems(updated);
  }

  const customerNames = Array.from(
    new Set(activeJobs.map(job => job.customerName)),
  );
  const customerJobs = activeJobs.filter(job => job.customerName === buyerName);

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  function calculateTotal() {
    return items.reduce(
      (sum, i) => sum + i.quantity * i.rate,
      0,
    );
  }

  async function submitInvoice(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    try {
      await apiFetch('/invoices', {
        method: 'POST',
        body: JSON.stringify({
          buyerName,
          buyerAddress,
          buyerGstin,
          orderNo,
          invoiceDate,
          gstRate: Number(gstRate),
          supplyType,
          placeOfSupply,
          items,
        }),
      });

      setBuyerName('');
      setBuyerAddress('');
      setBuyerGstin('');
      setOrderNo('');
      setInvoiceDate('');
      setGstRate('5');
      setSupplyType('INTRA_STATE');
      setPlaceOfSupply('');
      setItems([]);

      loadData();
    } catch {
      setError('Failed to create invoice');
    }
  }

  // 🔐 SECURE PDF HANDLING
  async function openInvoicePdf(
    invoiceId: string,
    autoPrint = false,
  ) {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Not authenticated');
      return;
    }

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/invoices/${invoiceId}/pdf`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!res.ok) {
      alert('Failed to load invoice PDF');
      return;
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);

    const win = window.open(url, '_blank');
    if (!win) return;

    if (autoPrint) {
      win.onload = () => {
        win.focus();
        win.print();
      };
    }
  }

  function downloadPdf(invoiceId: string) {
    openInvoicePdf(invoiceId, false);
  }

  function printInvoice(invoiceId: string) {
    openInvoicePdf(invoiceId, true);
  }

  if (loading) {
    return <p className="p-6">Loading invoices…</p>;
  }

  return (
    <div className="mx-auto max-w-7xl p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Job Work Invoices</h1>
        <p className="text-gray-600">
          Bill dyeing and processing work with customer challan and fabric details.
        </p>
      </div>

      {error && <p className="text-red-500">{error}</p>}

      {/* CREATE INVOICE */}
      <form
        onSubmit={submitInvoice}
        className="border rounded-lg p-5 space-y-4 shadow-sm"
      >
        <h2 className="font-semibold">Create Invoice</h2>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded border border-indigo-100 bg-indigo-50 p-3 text-sm text-indigo-800">
            Invoice number is generated automatically from Settings.
          </div>
          <input
            className="border p-2 rounded"
            placeholder="Place of supply (state)"
            value={placeOfSupply}
            onChange={e => setPlaceOfSupply(e.target.value)}
            required
          />
          <select
            className="border p-2 rounded"
            value={supplyType}
            onChange={e =>
              setSupplyType(e.target.value as 'INTRA_STATE' | 'INTER_STATE')
            }
          >
            <option value="INTRA_STATE">Intra-state: CGST + SGST</option>
            <option value="INTER_STATE">Inter-state: IGST</option>
          </select>
          <label className="text-sm">
            GST rate (%)
            <input
              type="number"
              min="0"
              max="28"
              step="0.01"
              className="border p-2 rounded w-full"
              value={gstRate}
              onChange={e => setGstRate(e.target.value)}
              required
            />
          </label>
          <input
            className="border p-2 rounded"
            placeholder="Order / Job No"
            value={orderNo}
            onChange={e => setOrderNo(e.target.value)}
          />

          <input
            type="date"
            className="border p-2 rounded"
            value={invoiceDate}
            onChange={e => setInvoiceDate(e.target.value)}
            required
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <select
            className="border p-2 rounded"
            value={buyerName}
            onChange={e => {
              setBuyerName(e.target.value);
              setItems([]);
            }}
            required
          >
            <option value="">Select customer from received fabric</option>
            {customerNames.map(customer => <option key={customer}>{customer}</option>)}
          </select>
          <input
            className="border p-2 rounded"
            placeholder="Customer GSTIN (optional)"
            value={buyerGstin}
            onChange={e => setBuyerGstin(e.target.value)}
          />
        </div>
        <textarea
          className="border p-2 rounded w-full"
          placeholder="Customer address"
          value={buyerAddress}
          onChange={e => setBuyerAddress(e.target.value)}
          required
        />

        {/* ITEMS */}
        <div className="space-y-2">
          <h3 className="font-medium">Items</h3>

          {items.map((item, idx) => (
            <div
              key={idx}
              className="grid gap-2 rounded border p-3 md:grid-cols-6"
            >
              <select
                className="border p-2 rounded md:col-span-2"
                value={item.dyeingJobId}
                onChange={e => selectJob(idx, e.target.value)}
                required
              >
                <option value="">Select received fabric / job</option>
                {customerJobs.map(job => (
                  <option key={job.id} value={job.id}>
                    {job.jobNo} · {job.fabricType} · {job.colour || 'No colour'} · {job.quantityReceived} {job.unit}
                  </option>
                ))}
              </select>
              <select
                className="border p-2 rounded md:col-span-2"
                value={item.productId}
                onChange={e => {
                  const prod = products.find(
                    p => p.id === e.target.value,
                  );
                  updateItem(idx, 'productId', e.target.value);
                  updateItem(
                    idx,
                    'rate',
                    finiteNumber(prod?.rate),
                  );
                }}
                required
              >
                <option value="">Select dyeing service</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.unit})
                  </option>
                ))}
              </select>
              <p className="self-center text-xs text-gray-500">
              {products.find(product => product.id === item.productId)?.description ||
                'Select a service from the rate card'}
              </p>
              <input
                className="border p-2 rounded"
                placeholder="Party DC No"
                value={item.partyDcNo}
                onChange={e => updateItem(idx, 'partyDcNo', e.target.value)}
              />
              <input
                type="date"
                className="border p-2 rounded"
                title="Party DC date"
                value={item.partyDcDate}
                onChange={e => updateItem(idx, 'partyDcDate', e.target.value)}
              />
              <input
                className="border p-2 rounded"
                placeholder="Delivery DC No"
                value={item.deliveryDcNo}
                onChange={e => updateItem(idx, 'deliveryDcNo', e.target.value)}
              />

              <input
                type="number"
                className="border p-2 rounded"
                placeholder="Qty"
                value={item.quantity}
                onChange={e =>
                  updateItem(idx, 'quantity', finiteNumber(e.target.value))
                }
                min={0.001}
                step={0.001}
              />

              <input
                type="number"
                className="border p-2 rounded"
                placeholder="Rate"
                value={item.rate}
                onChange={e =>
                  updateItem(idx, 'rate', finiteNumber(e.target.value))
                }
                min={0}
                step={0.01}
              />
              <input
                className="border p-2 rounded"
                placeholder="Colour"
                value={item.colour}
                onChange={e => updateItem(idx, 'colour', e.target.value)}
              />
              <input
                className="border p-2 rounded"
                placeholder="Fabric width"
                value={item.fabricWidth}
                onChange={e => updateItem(idx, 'fabricWidth', e.target.value)}
              />

              <button
                type="button"
                onClick={() => removeItem(idx)}
                className="text-red-600"
              >
                ✕
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addItem}
            className="border px-3 py-1 rounded"
          >
            + Add Item
          </button>
        </div>

        <div className="rounded bg-gray-50 p-3 space-y-1 text-right">
          <div>Taxable value: ₹ {calculateTotal().toFixed(2)}</div>
          <div className="text-sm text-gray-600">
            GST ({gstRate}%): ₹ {(calculateTotal() * finiteNumber(gstRate) / 100).toFixed(2)}
          </div>
          <div className="font-semibold">
            Grand total: ₹ {(calculateTotal() * (1 + finiteNumber(gstRate) / 100)).toFixed(2)}
          </div>
        </div>

        <button className="bg-black text-white px-4 py-2 rounded">
          Save Invoice
        </button>
      </form>

      {/* INVOICE LIST */}
      <div>
        <h2 className="font-semibold mb-2">Invoice List</h2>

        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">Invoice No</th>
              <th className="border p-2">Buyer</th>
              <th className="border p-2">Date</th>
              <th className="border p-2">Total</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>

          <tbody>
            {invoices.map(inv => (
              <tr key={inv.id}>
                <td className="border p-2">{inv.invoiceNo}</td>
                <td className="border p-2">{inv.buyerName}</td>
                <td className="border p-2">
                  {new Date(inv.invoiceDate).toLocaleDateString()}
                </td>
                <td className="border p-2 text-right">
                  ₹ {Number(inv.grandTotal ?? inv.totalAmount).toFixed(2)}
                </td>
                <td className="border p-2 text-center space-x-2">
                  <button
                    onClick={() => downloadPdf(inv.id)}
                    className="border px-2 py-1 rounded text-sm"
                  >
                    PDF
                  </button>

                  <button
                    onClick={() => printInvoice(inv.id)}
                    className="border px-2 py-1 rounded text-sm"
                  >
                    Print
                  </button>
                </td>
              </tr>
            ))}

            {invoices.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="border p-4 text-center text-gray-500"
                >
                  No invoices yet
                </td>
              </tr>
            )}
          </tbody>
        </table>

      </div>
    </div>
  );
}
