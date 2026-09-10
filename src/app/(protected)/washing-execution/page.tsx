'use client';

import { FormEvent, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { CheckCircleOutlined, PlayCircleOutlined, StopOutlined } from '@ant-design/icons';

type WashingBatch = {
  id: string;
  batchNo: string;
  jobId: string;
  processType: string;
  inputQuantity: number;
  outputQuantity?: number;
  lossQuantity?: number;
  lossPercentage?: number;
  status: string;
  machineName?: string;
  operatorName?: string;
  parameters?: any;
  startedAt?: string;
  completedAt?: string;
  remarks?: string;
};

const PROCESS_LABELS = {
  NORMAL_WASH: 'Normal Wash',
  RINSE_WASH: 'Rinse Wash',
  HOT_WASH: 'Hot Wash',
  COLD_WASH: 'Cold Wash',
  ENZYME_WASH: 'Enzyme Wash',
  BIO_WASH: 'Bio Wash',
  STONE_WASH: 'Stone Wash',
  STONE_ENZYME_WASH: 'Stone + Enzyme',
  ACID_WASH: 'Acid Wash',
  BLEACH_WASH: 'Bleach Wash',
  PIGMENT_WASH: 'Pigment Wash',
  DENIM_WASH: 'Denim Wash',
};

const STATUS_COLORS = {
  PENDING: 'bg-yellow-50 border-yellow-200 text-yellow-700',
  IN_PROGRESS: 'bg-blue-50 border-blue-200 text-blue-700',
  COMPLETED: 'bg-green-50 border-green-200 text-green-700',
  ON_HOLD: 'bg-orange-50 border-orange-200 text-orange-700',
  REJECTED: 'bg-red-50 border-red-200 text-red-700',
};

export default function WashingExecutionPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [batches, setBatches] = useState<WashingBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedJobId, setSelectedJobId] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9>(1);

  const [newBatch, setNewBatch] = useState({
    routeStepId: '',
    processType: 'NORMAL_WASH',
    inputQuantity: '',
    machineId: '',
    machineName: '',
    operatorId: '',
    operatorName: '',
    recipeId: '',
    recipeName: '',
    shift: 'Morning',
  });

  const [outputData, setOutputData] = useState({
    outputQuantity: '',
    remarks: '',
  });

  async function loadJobs() {
    try {
      const data = await apiFetch('/dyeing-jobs');
      setJobs(data);
    } catch {
      setError('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }

  async function loadBatches(jobId: string) {
    try {
      const data = await apiFetch(`/washing-execution/job/${jobId}/batches`);
      setBatches(data);
      setSelectedJobId(jobId);
    } catch {
      setError('Failed to load batches');
    }
  }

  async function createNewBatch(event: FormEvent) {
    event.preventDefault();
    setError('');
    try {
      const batch = await apiFetch(`/washing-execution/job/${selectedJobId}/batch`, {
        method: 'POST',
        body: JSON.stringify({
          ...newBatch,
          inputQuantity: Number(newBatch.inputQuantity),
        }),
      });
      await loadBatches(selectedJobId);
      setNewBatch({
        routeStepId: '',
        processType: 'NORMAL_WASH',
        inputQuantity: '',
        machineId: '',
        machineName: '',
        operatorId: '',
        operatorName: '',
        recipeId: '',
        recipeName: '',
        shift: 'Morning',
      });
      setStep(1);
      setSelectedBatchId(batch.id);
    } catch (err: any) {
      setError(err.message || 'Failed to create batch');
    }
  }

  async function startBatch() {
    try {
      await apiFetch(`/washing-execution/batch/${selectedBatchId}/start`, {
        method: 'POST',
      });
      await loadBatches(selectedJobId);
      setStep(3);
    } catch (err: any) {
      setError(err.message || 'Failed to start batch');
    }
  }

  async function completeBatch() {
    try {
      await apiFetch(`/washing-execution/batch/${selectedBatchId}/complete`, {
        method: 'POST',
        body: JSON.stringify({
          outputQuantity: Number(outputData.outputQuantity),
          remarks: outputData.remarks,
        }),
      });
      await loadBatches(selectedJobId);
      setStep(9);
      setOutputData({ outputQuantity: '', remarks: '' });
    } catch (err: any) {
      setError(err.message || 'Failed to complete batch');
    }
  }

  useEffect(() => {
    loadJobs();
  }, []);

  const batch = batches.find(b => b.id === selectedBatchId);

  if (loading) return <p className="p-6">Loading...</p>;

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-2xl bg-gradient-to-r from-purple-700 to-blue-700 p-8 text-white shadow-lg">
          <p className="text-sm uppercase tracking-widest text-purple-100">Washing Production</p>
          <h1 className="mt-2 text-3xl font-bold">Washing Execution</h1>
          <p className="mt-3 text-purple-100">Execute washing processes step-by-step with automated batch tracking.</p>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded">{error}</div>}

        {step === 1 && (
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">Step 1: Select Job</h2>
            <select
              className="border border-slate-300 rounded p-3 w-full"
              value={selectedJobId}
              onChange={e => {
                loadBatches(e.target.value);
                setStep(2);
              }}
            >
              <option value="">Choose a job...</option>
              {jobs.map(job => (
                <option key={job.id} value={job.id}>
                  {job.jobNo} - {job.customerName}
                </option>
              ))}
            </select>
          </div>
        )}

        {step === 2 && (
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm space-y-6">
            <h2 className="text-lg font-semibold">Step 2: Open or Create Batch</h2>

            {batches.length > 0 && (
              <div>
                <h3 className="mb-3 font-medium">Existing Batches</h3>
                <div className="space-y-2">
                  {batches.map(b => (
                    <button
                      key={b.id}
                      onClick={() => {
                        setSelectedBatchId(b.id);
                        setStep(b.status === 'PENDING' ? 3 : 5);
                      }}
                      className={`w-full text-left p-3 border rounded cursor-pointer transition-colors ${STATUS_COLORS[b.status as keyof typeof STATUS_COLORS] || 'bg-slate-50'}`}
                    >
                      <div className="font-medium">{b.batchNo}</div>
                      <div className="text-sm">
                        {PROCESS_LABELS[b.processType as keyof typeof PROCESS_LABELS]} | {b.status} | Input: {b.inputQuantity} kg
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t pt-6">
              <h3 className="mb-3 font-medium">Create New Batch</h3>
              <form onSubmit={createNewBatch} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <select
                    className="border border-slate-300 rounded p-2"
                    value={newBatch.processType}
                    onChange={e => setNewBatch({ ...newBatch, processType: e.target.value })}
                  >
                    {Object.entries(PROCESS_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    step="0.001"
                    min="0.001"
                    className="border border-slate-300 rounded p-2"
                    placeholder="Input quantity (kg)"
                    value={newBatch.inputQuantity}
                    onChange={e => setNewBatch({ ...newBatch, inputQuantity: e.target.value })}
                    required
                  />
                  <input
                    type="text"
                    className="border border-slate-300 rounded p-2"
                    placeholder="Machine name"
                    value={newBatch.machineName}
                    onChange={e => setNewBatch({ ...newBatch, machineName: e.target.value })}
                  />
                  <input
                    type="text"
                    className="border border-slate-300 rounded p-2"
                    placeholder="Operator name"
                    value={newBatch.operatorName}
                    onChange={e => setNewBatch({ ...newBatch, operatorName: e.target.value })}
                  />
                  <select
                    className="border border-slate-300 rounded p-2"
                    value={newBatch.shift}
                    onChange={e => setNewBatch({ ...newBatch, shift: e.target.value })}
                  >
                    <option value="Morning">Morning</option>
                    <option value="Afternoon">Afternoon</option>
                    <option value="Night">Night</option>
                  </select>
                </div>
                <button className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700">
                  Create Batch
                </button>
              </form>
            </div>
          </div>
        )}

        {batch && step >= 3 && (
          <div className="space-y-6">
            <div className="rounded-lg bg-white border border-slate-200 p-6">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-slate-600">Batch</div>
                  <div className="text-lg font-semibold">{batch.batchNo}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-600">Process</div>
                <div className="text-lg font-semibold">{PROCESS_LABELS[batch.processType as keyof typeof PROCESS_LABELS]}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-600">Input</div>
                  <div className="text-lg font-semibold">{batch.inputQuantity.toFixed(3)} kg</div>
                </div>
              </div>
            </div>

            {step === 3 && batch.status === 'PENDING' && (
              <div className="rounded-lg bg-white border border-slate-200 p-6">
                <h2 className="mb-4 text-lg font-semibold">Step 3: Confirm Input</h2>
                <p className="mb-4">Confirm input quantity: <strong>{batch.inputQuantity} kg</strong></p>
                <div className="flex gap-3">
                  <button
                    onClick={startBatch}
                    className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700 flex items-center gap-2"
                  >
                    <PlayCircleOutlined /> Start
                  </button>
                  <button onClick={() => setStep(2)} className="bg-slate-200 text-slate-700 px-6 py-2 rounded">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {step >= 4 && step < 8 && batch.status === 'IN_PROGRESS' && (
              <div className="rounded-lg bg-white border border-slate-200 p-6">
                <h2 className="mb-4 text-lg font-semibold">Steps 4-7: Washing in Progress</h2>
                <button
                  onClick={() => setStep(8)}
                  className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 flex items-center gap-2"
                >
                  <StopOutlined /> Complete Washing
                </button>
              </div>
            )}

            {step >= 8 && (
              <div className="rounded-lg bg-white border border-slate-200 p-6">
                <h2 className="mb-4 text-lg font-semibold">Steps 8-9: Enter Output</h2>
                <div className="space-y-4">
                  <input
                    type="number"
                    step="0.001"
                    className="border border-slate-300 rounded p-2 w-full"
                    placeholder="Output quantity"
                    value={outputData.outputQuantity}
                    onChange={e => setOutputData({ ...outputData, outputQuantity: e.target.value })}
                  />
                  {outputData.outputQuantity && (
                    <div className="bg-orange-50 p-3 rounded">
                      <div>Loss: {(batch.inputQuantity - Number(outputData.outputQuantity)).toFixed(3)} kg</div>
                      <div>Loss %: {((batch.inputQuantity - Number(outputData.outputQuantity)) / batch.inputQuantity * 100).toFixed(2)}%</div>
                    </div>
                  )}
                  <textarea
                    className="border border-slate-300 rounded p-2 w-full"
                    placeholder="Remarks"
                    value={outputData.remarks}
                    onChange={e => setOutputData({ ...outputData, remarks: e.target.value })}
                    rows={3}
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={completeBatch}
                      disabled={!outputData.outputQuantity}
                      className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:bg-gray-400 flex items-center gap-2"
                    >
                      <CheckCircleOutlined /> Complete
                    </button>
                    <button onClick={() => setStep(4)} className="bg-slate-200 text-slate-700 px-6 py-2 rounded">
                      Back
                    </button>
                  </div>
                </div>
              </div>
            )}

            {step === 9 && batch.status === 'COMPLETED' && (
              <div className="rounded-lg bg-green-50 border border-green-200 p-6">
                <h2 className="mb-4 text-lg font-semibold text-green-800 flex items-center gap-2">
                  <CheckCircleOutlined className="text-2xl" /> Success!
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div><span className="text-sm text-slate-600">Input:</span> {batch.inputQuantity.toFixed(3)} kg</div>
                    <div><span className="text-sm text-slate-600">Output:</span> {batch.outputQuantity?.toFixed(3)} kg</div>
                  </div>
                  <div className="space-y-2">
                    <div><span className="text-sm text-slate-600">Loss:</span> {batch.lossQuantity?.toFixed(3)} kg ({batch.lossPercentage?.toFixed(2)}%)</div>
                    <div><span className="text-sm text-slate-600">Batch:</span> {batch.batchNo}</div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setStep(1);
                    setSelectedJobId('');
                    setSelectedBatchId('');
                    setBatches([]);
                  }}
                  className="mt-6 bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700"
                >
                  Start Next Batch
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
