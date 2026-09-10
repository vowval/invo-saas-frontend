'use client';

import { useState } from 'react';
import { apiFetch } from '../../lib/api';
import EditProcessModal from './EditProcessModal';

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

interface ProcessListProps {
  processes: Process[];
  categoryId: string;
  onProcessUpdated: (process: Process) => void;
  onToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

export default function ProcessList({
  processes,
  categoryId,
  onProcessUpdated,
  onToast,
}: ProcessListProps) {
  const [editingProcess, setEditingProcess] = useState<Process | null>(null);
  const [duplicatingProcess, setDuplicatingProcess] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');

  const sortedProcesses = [...processes].sort((a, b) => a.display_order - b.display_order);

  const handleToggleActive = async (process: Process) => {
    try {
      await apiFetch(`/api/admin/process-master/processes/toggle-active/${process.id}`, {
        method: 'PUT',
      });
      onProcessUpdated({ ...process, is_active: !process.is_active });
      onToast(
        'success',
        `Process "${process.name}" ${!process.is_active ? 'activated' : 'deactivated'}`,
      );
    } catch (err) {
      onToast('error', err instanceof Error ? err.message : 'Failed to toggle process status');
    }
  };

  const handleDuplicate = async () => {
    if (!duplicatingProcess || !newName || !newCode) return;

    try {
      const process = processes.find((p) => p.id === duplicatingProcess);
      if (!process) return;

      const newProcess = await apiFetch(
        `/api/admin/process-master/processes/${duplicatingProcess}/duplicate`,
        {
          method: 'POST',
          body: JSON.stringify({
            new_name: newName,
            new_process_code: newCode,
          }),
        },
      );

      onToast('success', `Process "${newName}" created as duplicate`);
      setDuplicatingProcess(null);
      setNewName('');
      setNewCode('');
    } catch (err) {
      onToast('error', err instanceof Error ? err.message : 'Failed to duplicate process');
    }
  };

  return (
    <div>
      <div className="space-y-2">
        {sortedProcesses.map((process) => (
          <div
            key={process.id}
            className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div>
                    <h4 className="font-medium text-gray-900">{process.name}</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      Code: <span className="font-mono">{process.process_code}</span> •{' '}
                      {process.process_family} • {process.process_type}
                    </p>
                  </div>
                </div>

                {process.description && (
                  <p className="text-sm text-gray-600 mt-2">{process.description}</p>
                )}
              </div>

              <div className="flex items-center gap-2 ml-4">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                    process.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {process.is_active ? 'Active' : 'Inactive'}
                </span>

                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingProcess(process)}
                    className="text-blue-600 hover:text-blue-700 text-xs font-medium px-2 py-1"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => setDuplicatingProcess(process.id)}
                    className="text-blue-600 hover:text-blue-700 text-xs font-medium px-2 py-1"
                  >
                    Duplicate
                  </button>

                  <button
                    onClick={() => handleToggleActive(process)}
                    className="text-xs font-medium px-2 py-1"
                    style={{
                      color: process.is_active ? '#dc2626' : '#16a34a',
                    }}
                  >
                    {process.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Process Modal */}
      {editingProcess && (
        <EditProcessModal
          process={editingProcess}
          onUpdated={onProcessUpdated}
          onClose={() => setEditingProcess(null)}
          onToast={onToast}
        />
      )}

      {/* Duplicate Process Modal */}
      {duplicatingProcess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Duplicate Process</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Process Name
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g., Enhanced Enzyme Wash"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Process Code
                </label>
                <input
                  type="text"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  placeholder="e.g., WASH-ENZ-V2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setDuplicatingProcess(null);
                  setNewName('');
                  setNewCode('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDuplicate}
                disabled={!newName || !newCode}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors"
              >
                Duplicate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
