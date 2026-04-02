import React, { useState } from 'react';
import { History, RotateCcw, ChevronDown, ChevronUp, X } from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { useToast } from '../context/ToastContext';

interface VersionHistoryProps {
  onClose: () => void;
}

const VersionHistory: React.FC<VersionHistoryProps> = ({ onClose }) => {
  const { state, dispatch } = useProject();
  const { showToast } = useToast();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleRollback = (versionId: string, label: string) => {
    dispatch({ type: 'RESTORE_VERSION', payload: versionId });
    showToast(`Rolled back to "${label}"`, 'success');
    onClose();
  };

  const formatRelativeTime = (ts: number) => {
    const diffMs = Date.now() - ts;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr >= 1) return `${diffHr}h ago`;
    if (diffMin >= 1) return `${diffMin}m ago`;
    return `${diffSec}s ago`;
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          maxWidth: 520,
          width: '100%',
          maxHeight: '85vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <History size={20} className="text-indigo-600" />
            <h2 className="text-xl font-bold text-gray-800">Version History</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={22} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6">
          {state.versions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <History size={48} className="text-gray-200 mb-4" />
              <p className="text-gray-500 font-medium">No saved versions yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Click "Save Version" in the sidebar to create a snapshot of your current work.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {state.versions.map((v, index) => (
                <div
                  key={v.versionId}
                  className="border border-gray-200 rounded-xl overflow-hidden transition-shadow hover:shadow-md"
                >
                  {/* Version header */}
                  <div
                    className="flex items-center justify-between px-4 py-3 cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                    onClick={() => setExpandedId(expandedId === v.versionId ? null : v.versionId)}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          index === 0
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        v{state.versions.length - index}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">{v.label}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(v.savedAt).toLocaleString()} · {formatRelativeTime(v.savedAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {index === 0 && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                          Latest
                        </span>
                      )}
                      {expandedId === v.versionId ? (
                        <ChevronUp size={16} className="text-gray-400" />
                      ) : (
                        <ChevronDown size={16} className="text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded details */}
                  {expandedId === v.versionId && (
                    <div className="px-4 py-3 border-t border-gray-100">
                      <dl className="grid grid-cols-3 gap-3 mb-3 text-sm">
                        <div className="text-center p-2 bg-blue-50 rounded-lg">
                          <p className="text-2xl font-bold text-blue-700">
                            {v.rowCount.toLocaleString()}
                          </p>
                          <p className="text-xs text-blue-600">Rows</p>
                        </div>
                        <div className="text-center p-2 bg-purple-50 rounded-lg">
                          <p className="text-2xl font-bold text-purple-700">
                            {v.snapshot.processedDataset?.columns.length ?? 0}
                          </p>
                          <p className="text-xs text-purple-600">Columns</p>
                        </div>
                        <div className="text-center p-2 bg-green-50 rounded-lg">
                          <p className="text-2xl font-bold text-green-700">
                            {v.historyCount}
                          </p>
                          <p className="text-xs text-green-600">Steps</p>
                        </div>
                      </dl>

                      {index !== 0 && (
                        <button
                          onClick={() => handleRollback(v.versionId, v.label)}
                          className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors text-sm"
                        >
                          <RotateCcw size={15} />
                          Restore this version
                        </button>
                      )}
                      {index === 0 && (
                        <p className="text-xs text-center text-gray-400 py-1">
                          This is your current state — no rollback needed.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50">
          <p className="text-xs text-gray-400 text-center">
            Up to 10 versions are kept. Older versions are removed automatically.
          </p>
        </div>
      </div>
    </div>
  );
};

export default VersionHistory;
