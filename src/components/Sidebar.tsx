import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Save, FolderOpen, History, Clock, Edit2, Check, Lightbulb } from 'lucide-react';
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
        className={`sidebar-gradient text-gray-400 transition-all duration-300 ease-in-out flex flex-col ${
          isOpen ? 'w-72' : 'w-20'
        } relative z-40`}
        style={{ minHeight: '100vh' }}
      >
        {/* Top branding + toggle */}
        <div className="flex items-center justify-between h-20 px-5 border-b border-white/5 flex-shrink-0">
          {isOpen && (
            <div className="flex flex-col min-w-0">
              <span className="text-lg font-bold text-white tracking-tight">DataInsight <span className="text-accent-blue">Pro</span></span>
              {editingName ? (
                <div className="flex items-center gap-1 mt-1">
                  <input
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleNameConfirm()}
                    className="premium-input text-xs py-1 w-32"
                    autoFocus
                  />
                  <button onClick={handleNameConfirm} className="text-green-400 hover:text-green-300">
                    <Check size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-xs text-gray-500 truncate max-w-[150px]" title={state.projectName}>{state.projectName}</span>
                  <button
                    onClick={() => { setNameInput(state.projectName); setEditingName(true); }}
                    className="text-gray-600 hover:text-gray-400 flex-shrink-0 transition-colors"
                  >
                    <Edit2 size={11} />
                  </button>
                </div>
              )}
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-xl bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-all flex-shrink-0"
          >
            {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
        </div>

        {/* Project & Panels */}
        <div className="px-4 py-4 border-b border-white/5 space-y-3 flex-shrink-0">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleSaveProject}
              title="Save Project"
              className="premium-btn py-2 text-[11px]"
            >
              <Save size={14} /> {isOpen && "Save"}
            </button>
            <button
              onClick={() => setShowLoadModal(true)}
              title="Load Project"
              className="premium-btn-outline py-2 text-[11px] flex items-center justify-center gap-2"
            >
              <FolderOpen size={14} /> {isOpen && "Load"}
            </button>
          </div>

          {/* Panels Grid */}
          <div className="grid grid-cols-3 gap-2">
             <button onClick={onToggleTimeline} title="Workflow Timeline" className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-white/5 text-gray-500 hover:bg-accent-blue/10 hover:text-accent-blue hover:border-accent-blue/30 transition-all">
               <Clock size={18} />
               {isOpen && <span className="text-[9px] uppercase font-bold mt-1.5 truncate">Timeline</span>}
             </button>
             <button onClick={() => setShowVersions(true)} title="Dataset Versions" className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-white/5 text-gray-500 hover:bg-accent-purple/10 hover:text-accent-purple hover:border-accent-purple/30 transition-all">
               <History size={18} />
               {isOpen && <span className="text-[9px] uppercase font-bold mt-1.5 truncate">Versions</span>}
             </button>
             <button onClick={onToggleSuggestions} title="Smart Suggestions" className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-white/5 text-gray-500 hover:bg-amber-400/10 hover:text-amber-400 hover:border-amber-400/30 transition-all">
               <Lightbulb size={18} />
               {isOpen && <span className="text-[9px] uppercase font-bold mt-1.5 truncate">Insights</span>}
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
                  className={`w-full flex items-center py-3 px-4 rounded-xl transition-all duration-200 ${
                    activeTab === route.id
                      ? 'nav-item-active'
                      : route.disabled
                      ? 'text-gray-700 cursor-not-allowed opacity-50'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
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