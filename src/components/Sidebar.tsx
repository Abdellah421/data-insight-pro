import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Save, FolderOpen, History, Clock, Edit2, Check, Lightbulb, Brain, Database, Plus, Trash2 } from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { useToast } from '../context/ToastContext';
import { saveProject } from '../utils/exporters';
import LoadProjectDropzone from './LoadProjectDropzone';
import VersionHistory from './VersionHistory';

type Route = {
  id: string;
  name: string;
  icon: React.ReactNode;
  disabled?: boolean;
};

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  routes: Route[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onToggleTimeline: () => void;
  onToggleSuggestions: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  toggleSidebar,
  routes,
  activeTab,
  setActiveTab,
  onToggleTimeline,
  onToggleSuggestions,
}) => {
  const { state, dispatch } = useProject();
  const { showToast } = useToast();

  const [showLoadModal, setShowLoadModal] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(state.projectName);

  const handleSaveProject = () => {
    if (Object.keys(state.datasets).length === 0) {
      showToast('No dataset loaded. Upload data first.', 'warning');
      return;
    }
    const label = `v${state.versions.length + 1} — ${new Date().toLocaleTimeString()}`;
    dispatch({ type: 'SAVE_VERSION', payload: label });
    saveProject(state);
    showToast(`Project "${state.projectName}" saved as .dip file!`, 'success');
  };

  const handleNameConfirm = () => {
    const trimmed = nameInput.trim() || 'Untitled Project';
    dispatch({ type: 'SET_PROJECT_NAME', payload: trimmed });
    setEditingName(false);
    showToast('Project name updated.', 'info');
  };

  const autoSavedLabel = state.lastAutoSaved
    ? `Auto-saved ${formatRelativeTime(state.lastAutoSaved)}`
    : null;

  return (
    <>
      <div
        className={`bg-white shadow-lg transition-all duration-300 ease-in-out flex flex-col ${
          isOpen ? 'w-64' : 'w-20'
        } relative z-40`}
        style={{ minHeight: '100vh' }}
      >
        {/* Top branding + toggle */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-100 flex-shrink-0">
          {isOpen && (
            <div className="flex flex-col min-w-0">
              <span className="text-base font-bold text-blue-600 truncate">DataInsight Pro</span>
              {editingName ? (
                <div className="flex items-center gap-1 mt-0.5">
                  <input
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleNameConfirm()}
                    className="text-xs border border-blue-300 rounded px-1 py-0.5 w-28 focus:outline-none focus:ring-1 focus:ring-blue-400"
                    autoFocus
                  />
                  <button onClick={handleNameConfirm} className="text-green-600 hover:text-green-700">
                    <Check size={13} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-xs text-gray-500 truncate max-w-[130px]" title={state.projectName}>{state.projectName}</span>
                  <button
                    onClick={() => { setNameInput(state.projectName); setEditingName(true); }}
                    className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                  >
                    <Edit2 size={11} />
                  </button>
                </div>
              )}
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 flex-shrink-0"
          >
            {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>

        {/* Project & Panels */}
        <div className="px-3 py-3 border-b border-gray-100 space-y-1.5 flex-shrink-0">
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={handleSaveProject}
              title="Save Project"
              className="flex items-center justify-center gap-2 px-2 py-2 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition"
            >
              <Save size={14} /> {isOpen && "Save"}
            </button>
            <button
              onClick={() => setShowLoadModal(true)}
              title="Load Project"
              className="flex items-center justify-center gap-2 px-2 py-2 rounded-lg text-xs font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 transition"
            >
              <FolderOpen size={14} /> {isOpen && "Load"}
            </button>
          </div>

          {/* Panels Grid */}
          <div className="grid grid-cols-3 gap-1.5 mt-2">
             <button onClick={onToggleTimeline} title="Workflow Timeline" className="flex flex-col items-center justify-center p-2 rounded-lg text-xs font-medium border border-gray-200 text-gray-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition">
               <Clock size={16} className="mb-1" />
               {isOpen && <span className="text-[10px] uppercase truncate">Timeline</span>}
             </button>
             <button onClick={() => setShowVersions(true)} title="Dataset Versions" className="flex flex-col items-center justify-center p-2 rounded-lg text-xs font-medium border border-gray-200 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition">
               <History size={16} className="mb-1" />
               {isOpen && <span className="text-[10px] uppercase truncate">Versions</span>}
             </button>
             <button onClick={onToggleSuggestions} title="Smart Suggestions" className="flex flex-col items-center justify-center p-2 rounded-lg text-xs font-medium border border-gray-200 text-gray-600 hover:bg-yellow-50 hover:text-yellow-600 hover:border-yellow-200 transition">
               <Lightbulb size={16} className="mb-1" />
               {isOpen && <span className="text-[10px] uppercase truncate">Insights</span>}
             </button>
          </div>
        </div>

        {/* Workspace Datasets (Feature 9) */}
        {isOpen && Object.keys(state.datasets).length > 0 && (
          <div className="px-3 pt-3 pb-1 border-b border-gray-100 flex-shrink-0">
            <p className="text-[10px] uppercase font-bold text-gray-400 mb-1 px-1">Active Dataset</p>
            <select
              value={state.activeDatasetId || ''}
              onChange={(e) => dispatch({ type: 'SET_ACTIVE_DATASET', payload: e.target.value })}
              className="w-full text-xs border border-gray-300 rounded p-1.5 mb-2 focus:ring-1 focus:ring-blue-500 truncate"
            >
              {Object.values(state.datasets).map(ds => (
                <option key={ds.id} value={ds.id}>{ds.name} ({ds.rows.length} rows)</option>
              ))}
            </select>
          </div>
        )}

        {/* Status flags */}
        {(autoSavedLabel || state.isDirty) && isOpen && (
          <div className="px-4 py-2 border-b border-gray-100 flex-shrink-0 flex flex-col gap-1">
            {autoSavedLabel && <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /><span className="text-[10px] text-gray-400 truncate">{autoSavedLabel}</span></div>}
            {state.isDirty && !state.lastAutoSaved && <div className="flex items-center gap-1.5"><Clock size={10} className="text-amber-400" /><span className="text-[10px] text-amber-500">Unsaved changes</span></div>}
          </div>
        )}

        {/* Nav routes */}
        <nav className="flex-1 overflow-y-auto p-3">
          {isOpen && <p className="text-[10px] uppercase font-bold text-gray-400 mb-2 px-1 mt-1">Tools</p>}
          <ul className="space-y-1">
            {routes.map((route) => (
              <li key={route.id}>
                <button
                  onClick={() => !route.disabled && setActiveTab(route.id)}
                  title={route.name}
                  className={`w-full flex items-center py-2.5 px-3 rounded-lg transition-all duration-150 ${
                    activeTab === route.id
                      ? 'bg-blue-100 text-blue-700 shadow-sm'
                      : route.disabled
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                  }`}
                  disabled={route.disabled}
                >
                  <span className="flex-shrink-0">{route.icon}</span>
                  {isOpen && (
                    <span className="ml-3 font-medium truncate text-sm">{route.name}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {showLoadModal && <LoadProjectDropzone onClose={() => setShowLoadModal(false)} />}
      {showVersions && <VersionHistory onClose={() => setShowVersions(false)} />}
    </>
  );
};

function formatRelativeTime(ts: number): string {
  const diffSec = Math.floor((Date.now() - ts) / 1000);
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin >= 1) return `${diffMin}m ago`;
  return `${diffSec}s ago`;
}

export default Sidebar;