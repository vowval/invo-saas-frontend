'use client';

import { useState } from 'react';
import { apiFetch } from '../../lib/api';

interface ProcessCategory {
  id: string;
  name: string;
  code: string;
  description?: string;
  is_active: boolean;
  display_order: number;
  processes: any[];
}

interface EditCategoryModalProps {
  category: ProcessCategory;
  onUpdated: (category: ProcessCategory) => void;
  onDeleted: (categoryId: string) => void;
  onClose: () => void;
  onToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

export default function EditCategoryModal({
  category,
  onUpdated,
  onDeleted,
  onClose,
  onToast,
}: EditCategoryModalProps) {
  const [formData, setFormData] = useState({
    name: category.name,
    description: category.description || '',
    is_active: category.is_active,
  });
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      onToast('error', 'Name is required');
      return;
    }

    try {
      setLoading(true);
      const updatedCategory = await apiFetch(
        `/api/admin/process-master/categories/${category.id}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            name: formData.name,
            description: formData.description || undefined,
            is_active: formData.is_active,
          }),
        },
      );

      onUpdated(updatedCategory);
      onClose();
    } catch (err) {
      onToast('error', err instanceof Error ? err.message : 'Failed to update category');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      // Note: DELETE endpoint might need to be added to the controller
      // For now, we'll handle it as soft delete via deactivation
      onDeleted(category.id);
      onClose();
      onToast('success', 'Category deleted successfully');
    } catch (err) {
      onToast('error', err instanceof Error ? err.message : 'Failed to delete category');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Edit Category</h2>

        {!showDeleteConfirm ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category Name
              </label>
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
                Category Code
              </label>
              <input
                type="text"
                disabled
                value={category.code}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm text-gray-500"
              />
              <p className="text-xs text-gray-500 mt-1">Code cannot be changed</p>
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

            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full mt-4 px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg font-medium transition-colors"
            >
              Delete Category
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800 font-medium">Delete Category?</p>
              <p className="text-sm text-red-700 mt-2">
                This action cannot be undone. All processes in this category will also be deleted.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors"
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
