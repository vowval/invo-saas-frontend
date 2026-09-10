'use client';

import { FormEvent, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { CheckCircleOutlined, PlayCircleOutlined, PauseOutlined, StopOutlined } from '@ant-design/icons';

type DyeingBatch = {
  id: string;
  batchNo: string;
  jobId: string;
  processType: string;
  recipeCode?: string;
  colour?: string;
  shadeCode?: string;
  inputQuantity: number;
  outputQuantity?: number;
  lossQuantity?: number;
  lossPercentage?: number;
  status: string;
  labDipApprovalStatus?: string;
  machineName?: string;
  operatorName?: string;
  targetParameters?: any;
  actualParameters?: any;
  startedAt?: string;
  completedAt?: string;
  remarks?: string;
};

const PROCESS_TYPES = {
  REACTIVE_DYEING: 'Reactive Dyeing',
  DISPERSE_DYEING: 'Disperse Dyeing',
  PIGMENT_DYEING: 'Pigment Dyeing',
  DIRECT_DYEING: 'Direct Dyeing',
  VAT_DYEING: 'Vat Dyeing',
  SULPHUR_DYEING: 'Sulphur Dyeing',
  OTHER_DYEING: 'Other Dyeing',
};

const STATUS_COLORS = {
  PENDING: 'bg-yellow-50 border-yellow-200 text-yellow-700',
  IN_PROGRESS: 'bg-blue-50 border-blue-200 text-blue-700',
  PAUSED: 'bg-orange-50 border-orange-200 text-orange-700',
  COMPLETED: 'bg-green-50 border-green-200 text-green-700',
  ON_HOLD: 'bg-red-50 border-red-200 text-red-700',
  REJECTED: 'bg-red-100 border-red-300 text-red-800',
};

export default function DyeingExecutionPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [batches, setBatches] = useState<DyeingBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedJobId, setSelectedJobId] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9>(1);

  const [newBatch, setNewBatch] = useState({
    routeStepId: '',
    processType: 'REACTIVE_DYEING',
    recipeId: '',
    inputQuantity: '',
    colour: '',
    shadeCode: '',
    machineName: '',
    operatorName: '',
    shift: 'Morning',
    labDipApprovalRequired: false,
  });

  const [outputData, setOutputData] = useState({
    outputQuantity: '',
    remarks: '',
    qcResults: {
      shadeResult: '',
      colourMatchingResult: '',
      washFastnessResult: '',
      rubbingFastnessResult: '',
      status: 'PASS',
    },
  });

  const [processEvent, setProcessEvent] = useState({
    eventName: '',
    description: '',
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

  async function loadRecipes() {
    try {
      const data = await apiFetch('/recipes'); // Assuming recipes endpoint exists
      setRecipes(data);
    } catch {
      console.log('Recipes not available');
    }
  }

  async function loadBatches(jobId: string) {
    try {
      const data = await apiFetch(`/dyeing-execution/job/${jobId}/batches`);
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
      const batch = await apiFetch(`/dyeing-execution/job/${selectedJobId}/batch`, {
        method: 'POST',
        body: JSON.stringify({
          ...newBatch,
          inputQuantity: Number(newBatch.inputQuantity),
        }),
      });
      await loadBatches(selectedJobId);
      setNewBatch({
        routeStepId: '',
        processType: 'REACTIVE_DYEING',
        recipeId: '',
        inputQuantity: '',
        colour: '',
        shadeCode: '',
        machineName: '',
        operatorName: '',
        shift: 'Morning',
        labDipApprovalRequired: false,
      });
      setStep(3);
      setSelectedBatchId(batch.id);
    } catch (err: any) {
      setError(err.message || 'Failed to create batch');
    }
  }

  async function startBatch() {
    try {
      await apiFetch(`/dyeing-execution/batch/${selectedBatchId}/start`, {
        method: 'POST',
      });
      await loadBatches(selectedJobId);
      setStep(4);
    } catch (err: any) {
      setError(err.message || 'Failed to start batch');
    }
  }

  async function pauseBatch() {
    try {
      await apiFetch(`/dyeing-execution/batch/${selectedBatchId}/pause`, {
        method: 'POST',
        body: JSON.stringify({ reason: 'Operator pause' }),
      });
      await loadBatches(selectedJobId);
    } catch (err: any) {
      setError(err.message || 'Failed to pause batch');
    }
  }

  async function resumeBatch() {
    try {
      await apiFetch(`/dyeing-execution/batch/${selectedBatchId}/resume`, {
        method: 'POST',
      });
      await loadBatches(selectedJobId);
    } catch (err: any) {
      setError(err.message || 'Failed to resume batch');
    }
  }

  async function recordProcessEvent() {
    try {
      await apiFetch(`/dyeing-execution/batch/${selectedBatchId}/event`, {
        method: 'POST',
        body: JSON.stringify({
          eventName: processEvent.eventName,
          description: processEvent.description,
        }),
      });
      setProcessEvent({ eventName: '', description: '' });
    } catch (err: any) {
      setError(err.message || 'Failed to record event');
    }
  }

  async function completeBatch() {
    try {
      await apiFetch(`/dyeing-execution/batch/${selectedBatchId}/complete`, {
        method: 'POST',
        body: JSON.stringify({
          outputQuantity: Number(outputData.outputQuantity),
          remarks: outputData.remarks,
          qcResults: outputData.qcResults,
        }),
      });
      await loadBatches(selectedJobId);
      setStep(9);
      setOutputData({
        outputQuantity: '',
        remarks: '',
        qcResults: {
          shadeResult: '',
          colourMatchingResult: '',
          washFastnessResult: '',
          rubbingFastnessResult: '',
          status: 'PASS',
        },
      });
    } catch (err: any) {
      setError(err.message || 'Failed to complete batch');
    }
  }

  useEffect(() => {
    loadJobs();
    loadRecipes();
  }, []);

  const batch = batches.find(b => b.id === selectedBatchId);

  if (loading) return <p className="p-6">Loading...</p>;

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-2xl bg-gradient-to-r from-purple-700 via-pink-600 to-red-600 p-8 text-white shadow-lg">
          <p className="text-sm uppercase tracking-widest text-pink-100">Dyeing Production</p>
          <h1 className="mt-2 text-3xl font-bold">Dyeing Execution</h1>
          <p className="mt-3 text-pink-100">Recipe-driven dyeing execution with lab dip approval, parameter tracking, and QC results.</p>
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
            <h2 className="text-lg font-semibold">Step 2: Create Batch or Select Existing</h2>

            {batches.length > 0 && (
              <div>
                <h3 className="mb-3 font-medium">Existing Batches</h3>
                <div className="space-y-2">
                  {batches.map(b => (
                    <button
                      key={b.id}
                      onClick={() => {
                        setSelectedBatchId(b.id);
                        setStep(b.status === 'PENDING' ? 3 : b.status === 'IN_PROGRESS' ? 4 : 8);
                      }}
                      className={`w-full text-left p-3 border rounded cursor-pointer transition-colors ${STATUS_COLORS[b.status as keyof typeof STATUS_COLORS] || 'bg-slate-50'}`}
                    >
                      <div className="font-medium">{b.batchNo}</div>
                      <div className="text-sm">
                        {PROCESS_TYPES[b.processType as keyof typeof PROCESS_TYPES]} | {b.status} | Input: {b.inputQuantity} kg | Colour: {b.colour}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t pt-6">
              <h3 className="mb-3 font-medium">Create New Batch (Recipe-Driven)</h3>
              <form onSubmit={createNewBatch} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <select
                    className="border border-slate-300 rounded p-2"
                    value={newBatch.processType}
                    onChange={e => setNewBatch({ ...newBatch, processType: e.target.value })}
                  >
                    {Object.entries(PROCESS_TYPES).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <select
                    className="border border-slate-300 rounded p-2"
                    value={newBatch.recipeId}
                    onChange={e => setNewBatch({ ...newBatch, recipeId: e.target.value })}
                  >
                    <option value="">Select Recipe...</option>
                    {recipes.map((r: any) => (
                      <option key={r.id} value={r.id}>
                        {r.code} - {r.fabricType}
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
                    placeholder="Colour"
                    value={newBatch.colour}
                    onChange={e => setNewBatch({ ...newBatch, colour: e.target.value })}
                  />
                  <input
                    type="text"
                    className="border border-slate-300 rounded p-2"
                    placeholder="Shade Code (e.g., NAV-204)"
                    value={newBatch.shadeCode}
                    onChange={e => setNewBatch({ ...newBatch, shadeCode: e.target.value })}
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
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newBatch.labDipApprovalRequired}
                      onChange={e => setNewBatch({ ...newBatch, labDipApprovalRequired: e.target.checked })}
                    />
                    Requires Lab Dip Approval
                  </label>
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
              <div className="grid md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-slate-600">Batch</div>
                  <div className="text-lg font-semibold">{batch.batchNo}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-600">Process</div>
                  <div className="text-lg font-semibold">{PROCESS_TYPES[batch.processType as keyof typeof PROCESS_TYPES]}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-600">Colour / Shade</div>
                  <div className="text-lg font-semibold">{batch.colour} {batch.shadeCode && `(${batch.shadeCode})`}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-600">Input</div>
                  <div className="text-lg font-semibold">{batch.inputQuantity.toFixed(3)} kg</div>
                </div>
              </div>
            </div>

            {step === 3 && batch.status === 'PENDING' && (
              <div className="rounded-lg bg-white border border-slate-200 p-6">
                <h2 className="mb-4 text-lg font-semibold">Step 3: Confirm Input & Start</h2>
                <p className="mb-4">Confirm input quantity: <strong>{batch.inputQuantity} kg</strong></p>
                <div className="flex gap-3">
                  <button
                    onClick={startBatch}
                    className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700 flex items-center gap-2"
                  >
                    <PlayCircleOutlined /> Start Dyeing
                  </button>
                  <button onClick={() => setStep(2)} className="bg-slate-200 text-slate-700 px-6 py-2 rounded">
                    Back
                  </button>
                </div>
              </div>
            )}

            {step >= 4 && step < 8 && batch.status === 'IN_PROGRESS' && (
              <div className="rounded-lg bg-white border border-slate-200 p-6 space-y-4">
                <h2 className="text-lg font-semibold">Steps 4-7: Dyeing in Progress</h2>
                
                <div className="border-t pt-4">
                  <h3 className="font-medium mb-2">Record Process Event</h3>
                  <div className="space-y-2">
                    <input
                      type="text"
                      className="border border-slate-300 rounded p-2 w-full"
                      placeholder="Event name (e.g., Dye Addition, Temperature Raise)"
                      value={processEvent.eventName}
                      onChange={e => setProcessEvent({ ...processEvent, eventName: e.target.value })}
                    />
                    <textarea
                      className="border border-slate-300 rounded p-2 w-full"
                      placeholder="Event description"
                      rows={2}
                      value={processEvent.description}
                      onChange={e => setProcessEvent({ ...processEvent, description: e.target.value })}
                    />
                    <button
                      onClick={recordProcessEvent}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
                    >
                      Record Event
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={pauseBatch}
                    className="bg-orange-600 text-white px-6 py-2 rounded hover:bg-orange-700 flex items-center gap-2"
                  >
                    <PauseOutlined /> Pause
                  </button>
                  <button
                    onClick={() => setStep(8)}
                    className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
                  >
                    Enter Output
                  </button>
                </div>
              </div>
            )}

            {step === 3 && batch.status === 'PAUSED' && (
              <div className="rounded-lg bg-orange-50 border border-orange-200 p-6">
                <h2 className="mb-4 text-lg font-semibold text-orange-800">Batch Paused</h2>
                <button
                  onClick={resumeBatch}
                  className="bg-orange-600 text-white px-6 py-2 rounded hover:bg-orange-700"
                >
                  Resume Batch
                </button>
              </div>
            )}

            {step >= 8 && (
              <div className="rounded-lg bg-white border border-slate-200 p-6">
                <h2 className="mb-4 text-lg font-semibold">Steps 8-9: Output & QC Results</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Output Quantity (kg)</label>
                    <input
                      type="number"
                      step="0.001"
                      className="border border-slate-300 rounded p-2 w-full"
                      placeholder="Output quantity"
                      value={outputData.outputQuantity}
                      onChange={e => setOutputData({ ...outputData, outputQuantity: e.target.value })}
                    />
                  </div>

                  {outputData.outputQuantity && (
                    <div className="bg-amber-50 p-4 rounded border border-amber-200">
                      <div className="font-medium text-amber-900">Loss Calculation:</div>
                      <div className="text-sm text-amber-800">Loss: {(batch.inputQuantity - Number(outputData.outputQuantity)).toFixed(3)} kg</div>
                      <div className="text-sm text-amber-800">Loss %: {((batch.inputQuantity - Number(outputData.outputQuantity)) / batch.inputQuantity * 100).toFixed(2)}%</div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium mb-1">QC Results</label>
                    <div className="grid md:grid-cols-2 gap-2">
                      <input
                        type="text"
                        className="border border-slate-300 rounded p-2"
                        placeholder="Shade Result"
                        value={outputData.qcResults.shadeResult}
                        onChange={e => setOutputData({
                          ...outputData,
                          qcResults: { ...outputData.qcResults, shadeResult: e.target.value }
                        })}
                      />
                      <input
                        type="text"
                        className="border border-slate-300 rounded p-2"
                        placeholder="Colour Matching"
                        value={outputData.qcResults.colourMatchingResult}
                        onChange={e => setOutputData({
                          ...outputData,
                          qcResults: { ...outputData.qcResults, colourMatchingResult: e.target.value }
                        })}
                      />
                      <input
                        type="text"
                        className="border border-slate-300 rounded p-2"
                        placeholder="Wash Fastness"
                        value={outputData.qcResults.washFastnessResult}
                        onChange={e => setOutputData({
                          ...outputData,
                          qcResults: { ...outputData.qcResults, washFastnessResult: e.target.value }
                        })}
                      />
                      <input
                        type="text"
                        className="border border-slate-300 rounded p-2"
                        placeholder="Rubbing Fastness"
                        value={outputData.qcResults.rubbingFastnessResult}
                        onChange={e => setOutputData({
                          ...outputData,
                          qcResults: { ...outputData.qcResults, rubbingFastnessResult: e.target.value }
                        })}
                      />
                      <select
                        className="border border-slate-300 rounded p-2"
                        value={outputData.qcResults.status}
                        onChange={e => setOutputData({
                          ...outputData,
                          qcResults: { ...outputData.qcResults, status: e.target.value }
                        })}
                      >
                        <option value="PASS">PASS</option>
                        <option value="HOLD">HOLD</option>
                        <option value="REJECT">REJECT</option>
                      </select>
                    </div>
                  </div>

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
                      <CheckCircleOutlined /> Complete Batch
                    </button>
                    <button
                      onClick={() => setStep(4)}
                      className="bg-slate-200 text-slate-700 px-6 py-2 rounded"
                    >
                      Back
                    </button>
                  </div>
                </div>
              </div>
            )}

            {step === 9 && batch.status === 'COMPLETED' && (
              <div className="rounded-lg bg-green-50 border border-green-200 p-6">
                <h2 className="mb-4 text-lg font-semibold text-green-800 flex items-center gap-2">
                  <CheckCircleOutlined className="text-2xl" /> Dyeing Batch Completed!
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div><span className="text-sm text-slate-600">Colour:</span> {batch.colour} {batch.shadeCode && `(${batch.shadeCode})`}</div>
                    <div><span className="text-sm text-slate-600">Input:</span> {batch.inputQuantity.toFixed(3)} kg</div>
                    <div><span className="text-sm text-slate-600">Output:</span> {batch.outputQuantity?.toFixed(3)} kg</div>
                  </div>
                  <div className="space-y-2">
                    <div><span className="text-sm text-slate-600">Loss:</span> {batch.lossQuantity?.toFixed(3)} kg ({batch.lossPercentage?.toFixed(2)}%)</div>
                    <div><span className="text-sm text-slate-600">Recipe:</span> {batch.recipeCode}</div>
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
