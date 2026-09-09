'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

type TrackingStatus =
  | 'FABRIC_RECEIVED'
  | 'FABRIC_INSPECTION'
  | 'JOB_CARD_PRODUCTION_ORDER'
  | 'LAB_DIP_SHADE_APPROVAL'
  | 'DYEING'
  | 'WASHING_AFTER_TREATMENT'
  | 'FINISHING'
  | 'QUALITY_CHECK'
  | 'PACKING'
  | 'READY_FOR_DELIVERY'
  | 'DELIVERY'
  | 'READY_FOR_INVOICE'
  | 'GST_INVOICE'
  | 'PAYMENT_CLOSED';

type BoardJob = {
  id: string;
  jobNo: string;
  customerName: string;
  fabricType: string;
  unit: string;
  quantityReceived: number | string;
  trackingStatus: TrackingStatus;
};

type StatusBoard = Record<TrackingStatus, BoardJob[]>;

const columnOrder: TrackingStatus[] = [
  'FABRIC_RECEIVED',
  'FABRIC_INSPECTION',
  'JOB_CARD_PRODUCTION_ORDER',
  'LAB_DIP_SHADE_APPROVAL',
  'DYEING',
  'WASHING_AFTER_TREATMENT',
  'FINISHING',
  'QUALITY_CHECK',
  'PACKING',
  'READY_FOR_DELIVERY',
  'DELIVERY',
  'READY_FOR_INVOICE',
  'GST_INVOICE',
  'PAYMENT_CLOSED',
];

const columnLabels: Record<TrackingStatus, string> = {
  FABRIC_RECEIVED: '1. Fabric received',
  FABRIC_INSPECTION: '2. Fabric inspection',
  JOB_CARD_PRODUCTION_ORDER: '3. Job card / production order',
  LAB_DIP_SHADE_APPROVAL: '4. Lab dip / shade approval',
  DYEING: '5. Dyeing',
  WASHING_AFTER_TREATMENT: '6. Washing / after-treatment',
  FINISHING: '7. Finishing',
  QUALITY_CHECK: '8. Quality check',
  PACKING: '9. Packing',
  READY_FOR_DELIVERY: '10. Ready for delivery',
  DELIVERY: '11. Delivery',
  READY_FOR_INVOICE: '12. Ready for invoice',
  GST_INVOICE: '13. GST invoice',
  PAYMENT_CLOSED: '14. Payment / closed',
};

export default function ProductionBoardPage() {
  const [board, setBoard] = useState<StatusBoard | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function loadBoard() {
    try {
      setBoard(await apiFetch('/dyeing-jobs/status-board'));
    } catch {
      setError('Failed to load the production board');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBoard();
  }, []);

  async function moveJob(jobId: string, trackingStatus: TrackingStatus) {
    setError('');
    try {
      await apiFetch(`/dyeing-jobs/${jobId}/tracking-status`, {
        method: 'PATCH',
        body: JSON.stringify({ trackingStatus }),
      });
      await loadBoard();
    } catch {
      setError('Failed to update job location');
    }
  }

  if (loading) return <p className="p-6">Loading production board...</p>;

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-2xl bg-gradient-to-r from-cyan-700 to-indigo-700 p-8 text-white shadow-lg">
          <p className="text-sm uppercase tracking-widest text-cyan-100">Live tracking</p>
          <h1 className="mt-2 text-3xl font-bold">Production Board</h1>
          <p className="mt-3 text-cyan-100">
            See where every customer&apos;s fabric is right now, from inward receipt to dispatch.
          </p>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="flex gap-4 overflow-x-auto pb-4">
          {columnOrder.map(status => (
            <div key={status} className="w-72 flex-shrink-0 rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
                <h2 className="text-sm font-semibold text-slate-700">{columnLabels[status]}</h2>
                <p className="text-xs text-slate-400">{board?.[status]?.length ?? 0} job(s)</p>
              </div>
              <div className="space-y-2 p-3">
                {(board?.[status] ?? []).map(job => (
                  <div key={job.id} className="rounded-lg border border-slate-200 p-3 text-sm shadow-sm">
                    <div className="font-medium text-slate-800">{job.jobNo}</div>
                    <div className="text-xs text-slate-500">{job.customerName}</div>
                    <div className="text-xs text-slate-500">
                      {job.fabricType} · {Number(job.quantityReceived).toFixed(3)} {job.unit}
                    </div>
                    {job.trackingStatus !== 'PAYMENT_CLOSED' && (
                      <button
                        type="button"
                        className="mt-2 w-full rounded bg-indigo-600 p-1 text-xs font-medium text-white hover:bg-indigo-700"
                        onClick={() => moveJob(job.id, columnOrder[columnOrder.indexOf(job.trackingStatus) + 1])}
                      >
                        Move to {columnLabels[columnOrder[columnOrder.indexOf(job.trackingStatus) + 1]]}
                      </button>
                    )}
                  </div>
                ))}
                {(board?.[status]?.length ?? 0) === 0 && (
                  <p className="py-4 text-center text-xs text-slate-400">No jobs here</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
