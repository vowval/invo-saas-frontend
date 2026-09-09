'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

type TrackingStatus =
  | 'RECEIVED'
  | 'WAITING_FOR_PRODUCTION'
  | 'IN_DYEING'
  | 'WASHING'
  | 'FINISHING'
  | 'QC'
  | 'PACKED'
  | 'READY_FOR_DISPATCH'
  | 'DISPATCHED'
  | 'RETURNED';

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
  'RECEIVED',
  'WAITING_FOR_PRODUCTION',
  'IN_DYEING',
  'WASHING',
  'FINISHING',
  'QC',
  'PACKED',
  'READY_FOR_DISPATCH',
  'DISPATCHED',
  'RETURNED',
];

const columnLabels: Record<TrackingStatus, string> = {
  RECEIVED: 'Received',
  WAITING_FOR_PRODUCTION: 'Waiting for production',
  IN_DYEING: 'In dyeing',
  WASHING: 'Washing',
  FINISHING: 'Finishing',
  QC: 'QC',
  PACKED: 'Packed',
  READY_FOR_DISPATCH: 'Ready for dispatch',
  DISPATCHED: 'Dispatched',
  RETURNED: 'Returned',
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
                    <select
                      className="mt-2 w-full rounded border p-1 text-xs"
                      value={job.trackingStatus}
                      onChange={event => moveJob(job.id, event.target.value as TrackingStatus)}
                    >
                      {columnOrder.map(option => (
                        <option key={option} value={option}>
                          {columnLabels[option]}
                        </option>
                      ))}
                    </select>
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
