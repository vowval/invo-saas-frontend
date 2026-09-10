'use client';

import { useState } from 'react';
import { apiFetch } from '../../lib/api';

interface Process {
  id: string;
  name: string;
  process_code: string;
  description?: string;
  process_family: string;
  process_type: string;
  is_active: boolean;
  display_order: number;
}

interface EditProcessModalProps {
  process: Process;
  onUpdated: (process: Process) => void;
  onClose: () => void;
  onToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

const PROCESS_FAMILIES = ['Wash', 'Dye', 'Finish', 'Dry', 'Chemical', 'Treatment', 'Special'];
const PROCESS_TYPES = ['Chemical', 'Mechanical', 'Thermal', 'Hybrid'];

export default function EditProcessModal({
  process,
  onUpdated,
  onClose,
  onToast,
}: EditProcessModalProps) {
  const [formData, setFormData] = useState({
    name: process.name,
    description: process.description || '',
    process_family: process.process_family,
    process_type: process.process_type,
    is_active: process.is_active,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.process_family || !formData.process_type) {
      onToast('error', 'All required fields must be filled');
      return;
    }

    try {
      setLoading(true);
      const updatedProcess = await apiFetch(`/api/admin/process-master/processes/${process.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || undefined,
          process_family: formData.process_family,
          process_type: formData.process_type,
          is_active: formData.is_active,
        }),
      });

      onUpdated(updatedProcess);
      onClose();
      onToast('success', 'Process updated successfully');
    } catch (err) {
      onToast('error', err instanceof Error ? err.message : 'Failed to update process');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Edit Process</h2>
        <p className="text-sm text-gray-600 mb-4">Code: {process.process_code}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Process Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Process Family *
            </label>
            <select
              required
              value={formData.process_family}
              onChange={(e) => setFormData({ ...formData, process_family: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {PROCESS_FAMILIES.map((family) => (
                <option key={family} value={family}>
                  {family}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Process Type *</label>
            <select
              required
              value={formData.process_type}
              onChange={(e) => setFormData({ ...formData, process_type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {PROCESS_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="rounded border-gray-300"
            />
            <label htmlFor="is_active" className="text-sm text-gray-700">
              Active
            </label>
          </div>

          {!formData.is_active && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-800">
                Inactive processes won't be selectable for new jobs but will remain visible in
                historical records.
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
