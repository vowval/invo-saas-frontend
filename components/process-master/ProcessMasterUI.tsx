'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';
import CategoryList from './CategoryList';
import CreateCategoryModal from './CreateCategoryModal';
import Toast from '../ui/Toast';

interface ProcessCategory {
  id: string;
  name: string;
  code: string;
  description?: string;
  is_active: boolean;
  display_order: number;
  processes: Process[];
}

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

type ToastType = 'success' | 'error' | 'info';

export default function ProcessMasterUI() {
  const [categories, setCategories] = useState<ProcessCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiFetch('/api/admin/process-master/categories');
      setCategories(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories');
      showToast('error', 'Failed to load process master');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (type: ToastType, message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleCategoryCreated = async (newCategory: ProcessCategory) => {
    setCategories([...categories, newCategory].sort((a, b) => a.display_order - b.display_order));
    showToast('success', `Category "${newCategory.name}" created successfully`);
    setShowCreateModal(false);
  };

  const handleCategoryUpdated = (updatedCategory: ProcessCategory) => {
    setCategories(
      categories.map((cat) => (cat.id === updatedCategory.id ? updatedCategory : cat)),
    );
    showToast('success', 'Category updated successfully');
  };

  const handleCategoryDeleted = (categoryId: string) => {
    setCategories(categories.filter((cat) => cat.id !== categoryId));
    showToast('success', 'Category deleted successfully');
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading Process Master...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Process Master</h1>
        <p className="text-gray-600">Manage process categories and definitions for your factory</p>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
          <button
            onClick={fetchCategories}
            className="mt-2 text-red-700 hover:text-red-900 underline text-sm"
          >
            Try again
          </button>
        </div>
      )}

      {/* Action buttons */}
      <div className="mb-6 flex gap-3">
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          + Add Category
        </button>
        <button
          onClick={fetchCategories}
          className="bg-gray-200 hover:bg-gray-300 text-gray-900 px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Categories grid */}
      {categories.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-600 mb-4">No process categories found</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Create the first category
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          <CategoryList
            categories={categories}
            onCategoryUpdated={handleCategoryUpdated}
            onCategoryDeleted={handleCategoryDeleted}
            onToast={showToast}
          />
        </div>
      )}

      {/* Create category modal */}
      {showCreateModal && (
        <CreateCategoryModal
          onCreated={handleCategoryCreated}
          onClose={() => setShowCreateModal(false)}
          onToast={showToast}
        />
      )}

      {/* Toast notifications */}
      {toast && <Toast type={toast.type} message={toast.message} />}
    </div>
  );
}
