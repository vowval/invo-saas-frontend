'use client';

import { FormEvent, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

type Chemical = {
  id: string;
  name: string;
  unit: string;
};

type RecipeIngredient = {
  id: string;
  dosageGPerKg: number | string;
  chemicalItem: Chemical;
};

type Recipe = {
  id: string;
  code: string;
  fabricType?: string;
  temperatureC?: number;
  timeMinutes?: number;
  liquorRatio?: string;
  notes?: string;
  ingredients: RecipeIngredient[];
};

type IngredientRow = { chemicalItemId: string; dosageGPerKg: string };

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [chemicals, setChemicals] = useState<Chemical[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    code: '',
    fabricType: '',
    temperatureC: '',
    timeMinutes: '',
    liquorRatio: '',
    notes: '',
  });
  const [ingredientRows, setIngredientRows] = useState<IngredientRow[]>([{ chemicalItemId: '', dosageGPerKg: '' }]);

  const [previewRecipeId, setPreviewRecipeId] = useState('');
  const [previewInputQty, setPreviewInputQty] = useState('');
  const [preview, setPreview] = useState<any[] | null>(null);

  async function loadData() {
    try {
      const [recipeList, chemicalList] = await Promise.all([
        apiFetch('/inventory/recipes'),
        apiFetch('/inventory/chemicals'),
      ]);
      setRecipes(recipeList);
      setChemicals(chemicalList);
    } catch {
      setError('Failed to load recipes');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function addIngredientRow() {
    setIngredientRows(current => [...current, { chemicalItemId: '', dosageGPerKg: '' }]);
  }

  function removeIngredientRow(index: number) {
    setIngredientRows(current => current.filter((_, i) => i !== index));
  }

  function updateIngredientRow(index: number, patch: Partial<IngredientRow>) {
    setIngredientRows(current => current.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  async function createRecipe(event: FormEvent) {
    event.preventDefault();
    setError('');
    const ingredients = ingredientRows
      .filter(row => row.chemicalItemId && row.dosageGPerKg)
      .map(row => ({ chemicalItemId: row.chemicalItemId, dosageGPerKg: Number(row.dosageGPerKg) }));

    if (ingredients.length === 0) {
      setError('Add at least one ingredient with a dosage');
      return;
    }

    try {
      await apiFetch('/inventory/recipes', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          temperatureC: form.temperatureC ? Number(form.temperatureC) : undefined,
          timeMinutes: form.timeMinutes ? Number(form.timeMinutes) : undefined,
          ingredients,
        }),
      });
      setForm({ code: '', fabricType: '', temperatureC: '', timeMinutes: '', liquorRatio: '', notes: '' });
      setIngredientRows([{ chemicalItemId: '', dosageGPerKg: '' }]);
      await loadData();
    } catch {
      setError('Failed to create recipe (check dosage values and that chemicals exist)');
    }
  }

  async function loadPreview(event: FormEvent) {
    event.preventDefault();
    if (!previewRecipeId || !previewInputQty) return;
    setError('');
    try {
      setPreview(await apiFetch(`/inventory/recipes/${previewRecipeId}/requirement?inputQty=${previewInputQty}`));
    } catch {
      setError('Failed to compute requirement');
    }
  }

  if (loading) return <p className="p-6">Loading recipes...</p>;

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-2xl bg-gradient-to-r from-cyan-700 to-indigo-700 p-8 text-white shadow-lg">
          <p className="text-sm uppercase tracking-widest text-cyan-100">Recipe management</p>
          <h1 className="mt-2 text-3xl font-bold">Dyeing Recipes</h1>
          <p className="mt-3 text-cyan-100">
            Store fabric/dye/chemical formulas with dosage per kg, and preview chemical requirements for any batch size.
          </p>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        {chemicals.length === 0 && (
          <p className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-700">
            Add chemical/dye items on the <a className="underline" href="/chemicals">Chemicals</a> page first, so you can reference them here.
          </p>
        )}

        <form onSubmit={createRecipe} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Create recipe</h2>
          <div className="grid gap-3 md:grid-cols-3">
            <input
              className="border p-2 rounded w-full"
              placeholder="Recipe code (e.g. NAVY-023)"
              value={form.code}
              onChange={event => setForm(current => ({ ...current, code: event.target.value }))}
              required
            />
            <input
              className="border p-2 rounded w-full"
              placeholder="Fabric type (e.g. 100% Cotton)"
              value={form.fabricType}
              onChange={event => setForm(current => ({ ...current, fabricType: event.target.value }))}
            />
            <input
              className="border p-2 rounded w-full"
              placeholder="Liquor ratio (e.g. 1:8)"
              value={form.liquorRatio}
              onChange={event => setForm(current => ({ ...current, liquorRatio: event.target.value }))}
            />
            <input
              className="border p-2 rounded w-full"
              type="number"
              placeholder="Temperature (°C)"
              value={form.temperatureC}
              onChange={event => setForm(current => ({ ...current, temperatureC: event.target.value }))}
            />
            <input
              className="border p-2 rounded w-full"
              type="number"
              placeholder="Time (minutes)"
              value={form.timeMinutes}
              onChange={event => setForm(current => ({ ...current, timeMinutes: event.target.value }))}
            />
            <input
              className="border p-2 rounded w-full"
              placeholder="Notes (optional)"
              value={form.notes}
              onChange={event => setForm(current => ({ ...current, notes: event.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-slate-700">Ingredients (dosage in grams per kg of fabric)</h3>
            {ingredientRows.map((row, index) => (
              <div key={index} className="flex flex-wrap items-center gap-2">
                <select
                  className="border p-2 rounded flex-1 min-w-[160px]"
                  value={row.chemicalItemId}
                  onChange={event => updateIngredientRow(index, { chemicalItemId: event.target.value })}
                >
                  <option value="">Select chemical / dye</option>
                  {chemicals.map(chemical => (
                    <option key={chemical.id} value={chemical.id}>{chemical.name}</option>
                  ))}
                </select>
                <input
                  className="border p-2 rounded w-40"
                  type="number"
                  step="0.0001"
                  min="0"
                  placeholder="g/kg fabric"
                  value={row.dosageGPerKg}
                  onChange={event => updateIngredientRow(index, { dosageGPerKg: event.target.value })}
                />
                <button
                  type="button"
                  className="text-xs text-red-500 hover:underline"
                  onClick={() => removeIngredientRow(index)}
                  disabled={ingredientRows.length === 1}
                >
                  Remove
                </button>
              </div>
            ))}
            <button type="button" className="text-xs text-cyan-700 hover:underline" onClick={addIngredientRow}>
              + Add another ingredient
            </button>
          </div>

          <button className="bg-black text-white px-4 py-2 rounded">Save recipe</button>
        </form>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-3">
            <h2 className="font-semibold text-slate-800">Saved recipes</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {recipes.map(recipe => (
              <div key={recipe.id} className="p-4 text-sm">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="font-semibold text-slate-800">{recipe.code}</span>
                  {recipe.fabricType && <span className="text-slate-500">· {recipe.fabricType}</span>}
                  {recipe.liquorRatio && <span className="text-slate-500">· Liquor {recipe.liquorRatio}</span>}
                  {recipe.temperatureC != null && <span className="text-slate-500">· {recipe.temperatureC}°C</span>}
                  {recipe.timeMinutes != null && <span className="text-slate-500">· {recipe.timeMinutes} min</span>}
                </div>
                <ul className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                  {recipe.ingredients.map(ingredient => (
                    <li key={ingredient.id} className="rounded-full bg-slate-100 px-2 py-1">
                      {ingredient.chemicalItem.name}: {Number(ingredient.dosageGPerKg)} g/kg
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {recipes.length === 0 && (
              <p className="p-4 text-center text-sm text-slate-400">No recipes saved yet</p>
            )}
          </div>
        </div>

        <form onSubmit={loadPreview} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">Preview requirement for a batch size</h2>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs text-slate-500">Recipe</label>
              <select
                className="border p-2 rounded"
                value={previewRecipeId}
                onChange={event => setPreviewRecipeId(event.target.value)}
              >
                <option value="">Select recipe</option>
                {recipes.map(recipe => (
                  <option key={recipe.id} value={recipe.id}>{recipe.code}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500">Fabric input (kg)</label>
              <input
                className="border p-2 rounded w-32"
                type="number"
                step="0.001"
                min="0"
                value={previewInputQty}
                onChange={event => setPreviewInputQty(event.target.value)}
              />
            </div>
            <button className="bg-cyan-700 text-white px-4 py-2 rounded">Calculate</button>
          </div>

          {preview && (
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-600">
                  <th className="border p-2 text-left">Chemical</th>
                  <th className="border p-2">Required qty</th>
                  <th className="border p-2">Current stock</th>
                  <th className="border p-2">Sufficient?</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((row: any) => (
                  <tr key={row.chemicalItemId}>
                    <td className="border p-2">{row.name}</td>
                    <td className="border p-2 text-center">{row.requiredQty} {row.unit}</td>
                    <td className="border p-2 text-center">{row.currentStock} {row.unit}</td>
                    <td className="border p-2 text-center">
                      {row.currentStock >= row.requiredQty ? (
                        <span className="text-emerald-600">Yes</span>
                      ) : (
                        <span className="text-red-600">No — short by {(row.requiredQty - row.currentStock).toFixed(3)}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </form>
      </div>
    </main>
  );
}
