'use client';

import { FormEvent, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

type Recipe = { id: string; code: string };
type DyeingJob = { id: string; jobNo: string; customerName: string };

type LabDipSample = {
  id: string;
  sampleNo: number;
  recipeRef?: Recipe | null;
  recipeNotes?: string;
  photoUrl?: string;
  remarks?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
};

type LabDip = {
  id: string;
  labDipNo: string;
  customerName?: string;
  colour?: string;
  shadeCode?: string;
  status: 'IN_PROGRESS' | 'APPROVED' | 'REJECTED';
  dyeingJob?: DyeingJob | null;
  productionRecipe?: Recipe | null;
  samples: LabDipSample[];
};

const statusColors: Record<LabDip['status'], string> = {
  IN_PROGRESS: 'bg-slate-100 text-slate-600',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
};

const sampleStatusColors: Record<LabDipSample['status'], string> = {
  PENDING: 'bg-slate-100 text-slate-600',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
};

export default function LabDipsPage() {
  const [labDips, setLabDips] = useState<LabDip[]>([]);
  const [jobs, setJobs] = useState<DyeingJob[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({ labDipNo: '', dyeingJobId: '', customerName: '', colour: '' });
  const [sampleForms, setSampleForms] = useState<Record<string, { recipeId: string; recipeNotes: string; photoUrl: string; remarks: string }>>({});

  async function loadData() {
    try {
      const [dips, jobList, recipeList] = await Promise.all([
        apiFetch('/lab-dips'),
        apiFetch('/dyeing-jobs/active'),
        apiFetch('/inventory/recipes'),
      ]);
      setLabDips(dips);
      setJobs(jobList);
      setRecipes(recipeList);
    } catch {
      setError('Failed to load lab dips');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function sampleForm(labDipId: string) {
    return sampleForms[labDipId] ?? { recipeId: '', recipeNotes: '', photoUrl: '', remarks: '' };
  }

  function updateSampleForm(labDipId: string, patch: Partial<{ recipeId: string; recipeNotes: string; photoUrl: string; remarks: string }>) {
    setSampleForms(current => ({ ...current, [labDipId]: { ...sampleForm(labDipId), ...patch } }));
  }

  async function createLabDip(event: FormEvent) {
    event.preventDefault();
    setError('');
    try {
      await apiFetch('/lab-dips', {
        method: 'POST',
        body: JSON.stringify({ ...form, dyeingJobId: form.dyeingJobId || undefined }),
      });
      setForm({ labDipNo: '', dyeingJobId: '', customerName: '', colour: '' });
      await loadData();
    } catch {
      setError('Failed to create lab dip');
    }
  }

  async function addSample(labDipId: string, event: FormEvent) {
    event.preventDefault();
    setError('');
    const values = sampleForm(labDipId);
    try {
      await apiFetch(`/lab-dips/${labDipId}/samples`, {
        method: 'POST',
        body: JSON.stringify({ ...values, recipeId: values.recipeId || undefined }),
      });
      setSampleForms(current => ({ ...current, [labDipId]: { recipeId: '', recipeNotes: '', photoUrl: '', remarks: '' } }));
      await loadData();
    } catch {
      setError('Failed to add sample');
    }
  }

  async function decideSample(labDipId: string, sampleId: string, decision: 'approve' | 'reject') {
    setError('');
    try {
      await apiFetch(`/lab-dips/${labDipId}/samples/${sampleId}/${decision}`, { method: 'POST' });
      await loadData();
    } catch {
      setError('Failed to update sample decision (lab dip may already be finalized)');
    }
  }

  if (loading) return <p className="p-6">Loading lab dips...</p>;

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-2xl bg-gradient-to-r from-cyan-700 to-indigo-700 p-8 text-white shadow-lg">
          <p className="text-sm uppercase tracking-widest text-cyan-100">Shade approval</p>
          <h1 className="mt-2 text-3xl font-bold">Lab Dip / Shade Approval</h1>
          <p className="mt-3 text-cyan-100">
            Track sample iterations until the customer approves a shade, then promote it straight to production.
          </p>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <form onSubmit={createLabDip} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">New lab dip</h2>
          <div className="grid gap-3 md:grid-cols-4">
            <input
              className="border p-2 rounded w-full"
              placeholder="Lab dip number (e.g. LD-438)"
              value={form.labDipNo}
              onChange={event => setForm(current => ({ ...current, labDipNo: event.target.value }))}
              required
            />
            <select
              className="border p-2 rounded w-full"
              value={form.dyeingJobId}
              onChange={event => setForm(current => ({ ...current, dyeingJobId: event.target.value }))}
            >
              <option value="">Link to job (optional)</option>
              {jobs.map(job => (
                <option key={job.id} value={job.id}>{job.jobNo} · {job.customerName}</option>
              ))}
            </select>
            <input
              className="border p-2 rounded w-full"
              placeholder="Customer (if no job linked)"
              value={form.customerName}
              onChange={event => setForm(current => ({ ...current, customerName: event.target.value }))}
            />
            <input
              className="border p-2 rounded w-full"
              placeholder="Target colour (e.g. Navy)"
              value={form.colour}
              onChange={event => setForm(current => ({ ...current, colour: event.target.value }))}
            />
          </div>
          <button className="bg-black text-white px-4 py-2 rounded">Create lab dip</button>
        </form>

        <div className="space-y-4">
          {labDips.map(labDip => (
            <div key={labDip.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-semibold text-slate-800">{labDip.labDipNo}</span>
                  {labDip.colour && <span className="ml-2 text-sm text-slate-500">{labDip.colour}</span>}
                  {(labDip.customerName || labDip.dyeingJob) && (
                    <span className="ml-2 text-sm text-slate-500">
                      · {labDip.dyeingJob ? `${labDip.dyeingJob.jobNo} (${labDip.dyeingJob.customerName})` : labDip.customerName}
                    </span>
                  )}
                </div>
                <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusColors[labDip.status]}`}>
                  {labDip.status.replace(/_/g, ' ')}
                </span>
              </div>

              {labDip.status === 'APPROVED' && labDip.productionRecipe && (
                <p className="rounded-lg bg-emerald-50 p-2 text-sm text-emerald-700">
                  ✓ Approved — production recipe <strong>{labDip.productionRecipe.code}</strong> is ready to use for batches.
                </p>
              )}

              <div className="space-y-2">
                {labDip.samples.map(sample => (
                  <div key={sample.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 p-3 text-sm">
                    <div>
                      <span className="font-medium">Sample #{sample.sampleNo}</span>
                      {sample.recipeRef && <span className="ml-2 text-slate-500">Recipe: {sample.recipeRef.code}</span>}
                      {sample.recipeNotes && <span className="ml-2 text-slate-500">{sample.recipeNotes}</span>}
                      {sample.remarks && <div className="text-xs text-slate-400">{sample.remarks}</div>}
                      {sample.photoUrl && (
                        <div>
                          <a className="text-xs text-cyan-700 underline" href={sample.photoUrl} target="_blank" rel="noreferrer">
                            View photo
                          </a>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${sampleStatusColors[sample.status]}`}>
                        {sample.status}
                      </span>
                      {sample.status === 'PENDING' && labDip.status === 'IN_PROGRESS' && (
                        <>
                          <button
                            type="button"
                            className="rounded bg-emerald-600 px-2 py-1 text-xs text-white hover:bg-emerald-700"
                            onClick={() => decideSample(labDip.id, sample.id, 'approve')}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            className="rounded bg-red-500 px-2 py-1 text-xs text-white hover:bg-red-600"
                            onClick={() => decideSample(labDip.id, sample.id, 'reject')}
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                {labDip.samples.length === 0 && (
                  <p className="text-xs text-slate-400">No samples recorded yet</p>
                )}
              </div>

              {labDip.status === 'IN_PROGRESS' && (
                <form onSubmit={event => addSample(labDip.id, event)} className="flex flex-wrap items-end gap-2 border-t pt-3">
                  <select
                    className="border p-2 rounded"
                    value={sampleForm(labDip.id).recipeId}
                    onChange={event => updateSampleForm(labDip.id, { recipeId: event.target.value })}
                  >
                    <option value="">Recipe used (optional)</option>
                    {recipes.map(recipe => (
                      <option key={recipe.id} value={recipe.id}>{recipe.code}</option>
                    ))}
                  </select>
                  <input
                    className="border p-2 rounded flex-1 min-w-[140px]"
                    placeholder="Recipe notes (if no saved recipe)"
                    value={sampleForm(labDip.id).recipeNotes}
                    onChange={event => updateSampleForm(labDip.id, { recipeNotes: event.target.value })}
                  />
                  <input
                    className="border p-2 rounded flex-1 min-w-[140px]"
                    placeholder="Photo URL"
                    value={sampleForm(labDip.id).photoUrl}
                    onChange={event => updateSampleForm(labDip.id, { photoUrl: event.target.value })}
                  />
                  <input
                    className="border p-2 rounded flex-1 min-w-[140px]"
                    placeholder="Remarks"
                    value={sampleForm(labDip.id).remarks}
                    onChange={event => updateSampleForm(labDip.id, { remarks: event.target.value })}
                  />
                  <button className="rounded bg-cyan-700 px-3 py-2 text-sm text-white hover:bg-cyan-800">
                    Add sample #{labDip.samples.length + 1}
                  </button>
                </form>
              )}
            </div>
          ))}
          {labDips.length === 0 && (
            <p className="text-sm text-slate-500">No lab dips created yet.</p>
          )}
        </div>
      </div>
    </main>
  );
}
