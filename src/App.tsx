import React, { useState, Suspense } from 'react';
import {
  Menu, BarChart4, Database, FileCode, Settings, Brain, Calculator,
  RefreshCw, Download, FileSpreadsheet, FileText, FileJson, FileBarChart2, Zap, Code
} from 'lucide-react';
import Sidebar from './components/Sidebar';
import ErrorBoundary from './components/ErrorBoundary';
import TimelinePanel from './components/TimelinePanel';
import SuggestionsPanel from './components/SuggestionsPanel';
import PipelineCodeModal from './components/PipelineCodeModal';
import { AuthModal } from './components/AuthModal';
import Footer from './components/Footer';
import { ProjectProvider, useProject } from './context/ProjectContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { exportDataset, generatePDFReport } from './utils/exporters';
import { Dataset } from './types';

const DataUpload = React.lazy(() => import('./pages/DataUpload'));
const DataExplorer = React.lazy(() => import('./pages/DataExplorer'));
const DataCleaning = React.lazy(() => import('./pages/DataCleaning'));
const DataAnalysis = React.lazy(() => import('./pages/DataAnalysis'));
const DataVisualization = React.lazy(() => import('./pages/DataVisualization'));
const DataTransformationPage = React.lazy(() => import('./pages/DataTransformationPage'));
const MLAnalysis = React.lazy(() => import('./pages/MLAnalysis'));
const AdvancedAnalytics = React.lazy(() => import('./pages/AdvancedAnalytics'));

// ── Inner App (inside providers) ─────────────────────────────────────────────
function AppInner() {
  const { user, logout } = useAuth();
  const { state, dispatch, currentDataset } = useProject();
  const { showToast } = useToast();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('upload');
  const [showTimeline, setShowTimeline] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);

  if (!user) {
    return <AuthModal />;
  }

  const handleUploadSuccess = (dataset: Dataset) => {
    dispatch({ type: 'ADD_DATASET', payload: { id: dataset.id || `ds_${Date.now()}`, dataset, setActive: true } });
    dispatch({
      type: 'LOG_WORKFLOW_STEP',
      payload: {
        action: 'upload',
        description: `Uploaded dataset "${dataset.name}"`,
        parameters: { format: dataset.originalFormat },
        affectedColumns: [],
        datasetSnapshot: dataset,
      },
    });
    setActiveTab('explorer');
    setShowSuggestions(true);
    showToast(`Dataset "${dataset.name}" added to workspace!`, 'success');
  };

  const handleDatasetUpdate = (updatedDataset: Dataset) => {
    if (state.activeDatasetId) {
      dispatch({ 
        type: 'UPDATE_DATASET', 
        payload: { id: state.activeDatasetId, dataset: updatedDataset } 
      });
    }
  };

  // Smart Analysis button handler
  const handleSmartAnalysis = () => {
    if (!currentDataset) {
      showToast('Load a dataset first to run Smart Analysis', 'warning');
      return;
    }
    setActiveTab('ml');
    showToast('Switched to Machine Learning panel for analysis mapping', 'info');
  };

  // Export handlers
  const handleExport = (format: 'csv' | 'xlsx' | 'json') => {
    if (!currentDataset) {
      showToast('No dataset loaded to export.', 'warning');
      return;
    }
    try {
      exportDataset(currentDataset.rows, currentDataset.columns, format, state.projectName);
      showToast(`Dataset exported as ${format.toUpperCase()}!`, 'success');
    } catch (err: any) {
      showToast(`Export failed: ${err?.message}`, 'error');
    }
  };

  const handlePDFReport = () => {
    if (!currentDataset && state.workflowHistory.length === 0) {
      showToast('Nothing to report yet. Load a dataset first.', 'warning');
      return;
    }
    try {
      let chartImage: string | null = null;
      const canvas = document.querySelector('canvas');
      if (canvas) {
        try { chartImage = canvas.toDataURL('image/png'); } catch { /* skip */ }
      }
      generatePDFReport(state, chartImage);
      showToast('PDF report generated!', 'success');
    } catch (err: any) {
      showToast(`PDF generation failed: ${err?.message}`, 'error');
    }
  };

  const routes = [
    { id: 'upload', name: 'Upload Data', icon: <FileCode size={20} /> },
    { id: 'explorer', name: 'Data Explorer', icon: <Database size={20} />, disabled: !currentDataset },
    { id: 'cleaning', name: 'Data Cleaning', icon: <Settings size={20} />, disabled: !currentDataset },
    { id: 'transformation', name: 'Data Transformation', icon: <RefreshCw size={20} />, disabled: !currentDataset },
    { id: 'analysis', name: 'Data Analysis', icon: <BarChart4 size={20} />, disabled: !currentDataset },
    { id: 'visualization', name: 'Visualization', icon: <BarChart4 size={20} />, disabled: !currentDataset },
    { id: 'advanced', name: 'Advanced Analytics', icon: <Calculator size={20} />, disabled: !currentDataset },
    { id: 'ml', name: 'ML Analysis', icon: <Brain size={20} />, disabled: !currentDataset },
  ];

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden relative">
      <Sidebar
        isOpen={sidebarOpen}
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        routes={routes}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onToggleTimeline={() => { setShowTimeline(!showTimeline); setShowSuggestions(false); }}
        onToggleSuggestions={() => { setShowSuggestions(!showSuggestions); setShowTimeline(false); }}
      />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="bg-white shadow-sm z-10 flex-shrink-0">
          <div className="flex items-center justify-between px-4 py-3 gap-4">
            <div className="flex items-center gap-2 min-w-0">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-md text-gray-500 hover:bg-gray-100 flex-shrink-0">
                <Menu size={22} />
              </button>
              {currentDataset && (
                <div className="hidden sm:flex items-center gap-2">
                  <span className="text-sm text-gray-400">Workspace /</span>
                  <span className="font-semibold text-sm text-gray-700 truncate max-w-[200px]">{currentDataset.name}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              {user && (
                <div className="hidden md:flex items-center gap-2 mr-2 border-r border-gray-200 pr-3 text-xs text-gray-600">
                  <span title={user.email || 'User'}>{user.email?.split('@')[0]}</span>
                  <button onClick={logout} className="text-red-500 hover:text-red-700 font-medium">Log out</button>
                </div>
              )}
              
              <button
                onClick={handleSmartAnalysis}
                disabled={!currentDataset}
                title="Auto ML & Smart Profiling"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold shadow-sm transition-colors ${
                  currentDataset ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200' : 'bg-gray-50 text-gray-400 border border-gray-200 cursor-not-allowed'
                }`}
              >
                <Zap size={14} className={currentDataset ? "text-amber-500" : ""} />
                <span className="hidden md:inline">Smart Analysis</span>
              </button>

              <div className="hidden lg:flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg p-1">
                <button onClick={() => handleExport('csv')} disabled={!currentDataset} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${currentDataset ? 'text-green-700 hover:bg-green-100' : 'text-gray-300 cursor-not-allowed'}`}>
                  <FileText size={14} /> CSV
                </button>
                <button onClick={() => handleExport('xlsx')} disabled={!currentDataset} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${currentDataset ? 'text-emerald-700 hover:bg-emerald-100' : 'text-gray-300 cursor-not-allowed'}`}>
                  <FileSpreadsheet size={14} /> Excel
                </button>
                <button onClick={() => handleExport('json')} disabled={!currentDataset} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${currentDataset ? 'text-blue-700 hover:bg-blue-100' : 'text-gray-300 cursor-not-allowed'}`}>
                  <FileJson size={14} /> JSON
                </button>
              </div>

              <button onClick={() => setShowCodeModal(true)} title="Export Python Code" className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 text-gray-100 rounded-lg text-xs font-semibold hover:bg-black transition-colors shadow-sm">
                <Code size={14} /> <span className="hidden sm:inline">Export Code</span>
              </button>
              <button onClick={handlePDFReport} title="Export PDF Report" className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-sm">
                <FileBarChart2 size={14} /> <span className="hidden sm:inline">Report PDF</span>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6 bg-gray-100 relative">
          <Suspense fallback={<div className="flex h-64 items-center justify-center"><svg className="animate-spin h-8 w-8 text-blue-500" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg></div>}>
            {activeTab === 'upload' && <DataUpload onUploadSuccess={handleUploadSuccess} />}
            {activeTab === 'explorer' && currentDataset && <DataExplorer dataset={currentDataset} onDatasetUpdate={handleDatasetUpdate} />}
            {activeTab === 'cleaning' && currentDataset && <DataCleaning dataset={currentDataset} onDatasetUpdate={handleDatasetUpdate} />}
            {activeTab === 'transformation' && currentDataset && <DataTransformationPage dataset={currentDataset} onDatasetUpdate={handleDatasetUpdate} />}
            {activeTab === 'analysis' && currentDataset && <ErrorBoundary><DataAnalysis dataset={currentDataset} /></ErrorBoundary>}
            {activeTab === 'visualization' && currentDataset && <DataVisualization dataset={currentDataset} />}
            {activeTab === 'advanced' && currentDataset && <AdvancedAnalytics dataset={currentDataset} />}
            {activeTab === 'ml' && currentDataset && <MLAnalysis dataset={currentDataset} />}
          </Suspense>
        </main>
        
        <Footer />
      </div>

      {showTimeline && <TimelinePanel onClose={() => setShowTimeline(false)} />}
      {showSuggestions && <SuggestionsPanel onClose={() => setShowSuggestions(false)} />}
      {showCodeModal && <PipelineCodeModal onClose={() => setShowCodeModal(false)} />}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <ProjectProvider>
          <AppInner />
        </ProjectProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;