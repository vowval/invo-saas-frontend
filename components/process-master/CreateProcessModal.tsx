'use client';

import { useState } from 'react';
import { apiFetch } from '../../lib/api';

interface CreateProcessModalProps {
  categoryId: string;
  categoryName: string;
  onProcessCreated: (process: any) => void;
  onClose: () => void;
  onToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

const PROCESS_FAMILIES = ['Wash', 'Dye', 'Finish', 'Dry', 'Chemical', 'Treatment', 'Special'];
const PROCESS_TYPES = ['Chemical', 'Mechanical', 'Thermal', 'Hybrid'];

export default function CreateProcessModal({
  categoryId,
  categoryName,
  onProcessCreated,
  onClose,
  onToast,
}: CreateProcessModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    process_code: '',
    description: '',
    process_family: '',
    process_type: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.process_code || !formData.process_family || !formData.process_type) {
      onToast('error', 'All required fields must be filled');
      return;
    }

    try {
      setLoading(true);
      const newProcess = await apiFetch('/api/admin/process-master/processes', {
        method: 'POST',
        body: JSON.stringify({
          category_id: categoryId,
          ...formData,
          process_code: formData.process_code.toUpperCase(),
        }),
      });

      onProcessCreated(newProcess);
      onToast('success', `Process "${formData.name}" created`);
    } catch (err) {
      onToast('error', err instanceof Error ? err.message : 'Failed to create process');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Add Process to {categoryName}</h2>
        <p className="text-sm text-gray-600 mb-4">Create a new process definition</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Process Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Enzyme Wash"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Process Code *</label>
            <input
              type="text"
              required
              value={formData.process_code}
              onChange={(e) => setFormData({ ...formData, process_code: e.target.value.toUpperCase() })}
              placeholder="e.g., WASH-ENZ"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">Must be unique across all processes</p>
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
              <option value="">Select a family</option>
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
              <option value="">Select a type</option>
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
              placeholder="Optional description of the process..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

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
              {loading ? 'Creating...' : 'Create Process'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
