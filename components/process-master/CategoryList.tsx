'use client';

import { useState } from 'react';
import ProcessList from './ProcessList';
import EditCategoryModal from './EditCategoryModal';
import CreateProcessModal from './CreateProcessModal';

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

interface CategoryListProps {
  categories: ProcessCategory[];
  onCategoryUpdated: (category: ProcessCategory) => void;
  onCategoryDeleted: (categoryId: string) => void;
  onToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

export default function CategoryList({
  categories,
  onCategoryUpdated,
  onCategoryDeleted,
  onToast,
}: CategoryListProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(categories.map((c) => c.id)),
  );
  const [editingCategory, setEditingCategory] = useState<ProcessCategory | null>(null);
  const [showCreateProcessModal, setShowCreateProcessModal] = useState<string | null>(null);

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  return (
    <div className="space-y-4">
      {categories.map((category) => (
        <div key={category.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Category Header */}
          <div
            className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
            onClick={() => toggleCategory(category.id)}
          >
            <div className="flex items-center flex-1">
              <button className="text-gray-400 hover:text-gray-600 mr-3 transition-transform">
                {expandedCategories.has(category.id) ? '▼' : '▶'}
              </button>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                <p className="text-sm text-gray-500">
                  {category.code} • {category.processes.length} processes
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  category.is_active
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {category.is_active ? 'Active' : 'Inactive'}
              </span>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingCategory(category);
                }}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Edit
              </button>
            </div>
          </div>

          {/* Category Content */}
          {expandedCategories.has(category.id) && (
            <div className="border-t border-gray-200 bg-gray-50">
              {category.description && (
                <div className="px-6 py-3 text-sm text-gray-600 border-b border-gray-200">
                  {category.description}
                </div>
              )}

              {/* Processes */}
              <div className="px-6 py-4">
                {category.processes.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 text-sm mb-3">No processes in this category</p>
                    <button
                      onClick={() => setShowCreateProcessModal(category.id)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      + Add Process
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="mb-4">
                      <button
                        onClick={() => setShowCreateProcessModal(category.id)}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        + Add Process
                      </button>
                    </div>

                    <ProcessList
                      processes={category.processes}
                      categoryId={category.id}
                      onProcessUpdated={(updatedProcess) => {
                        const updatedCategory = {
                          ...category,
                          processes: category.processes.map((p) =>
                            p.id === updatedProcess.id ? updatedProcess : p,
                          ),
                        };
                        onCategoryUpdated(updatedCategory);
                      }}
                      onToast={onToast}
                    />
                  </>
                )}
              </div>
            </div>
          )}

          {/* Edit Category Modal */}
          {editingCategory?.id === category.id && (
            <EditCategoryModal
              category={editingCategory}
              onUpdated={onCategoryUpdated}
              onDeleted={onCategoryDeleted}
              onClose={() => setEditingCategory(null)}
              onToast={onToast}
            />
          )}

          {/* Create Process Modal */}
          {showCreateProcessModal === category.id && (
            <CreateProcessModal
              categoryId={category.id}
              categoryName={category.name}
              onProcessCreated={(newProcess) => {
                const updatedCategory = {
                  ...category,
                  processes: [...category.processes, newProcess],
                };
                onCategoryUpdated(updatedCategory);
                setShowCreateProcessModal(null);
              }}
              onClose={() => setShowCreateProcessModal(null)}
              onToast={onToast}
            />
          )}
        </div>
      ))}
    </div>
  );
}
