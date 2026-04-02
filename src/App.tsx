import React, { useState, Suspense } from 'react';
import {
  Menu, BarChart4, Database, FileCode, Settings, Brain, Calculator,
  RefreshCw, FileSpreadsheet, FileText, FileJson, FileBarChart2, Zap, Code
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
  const { user, isPro, logout } = useAuth();
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
    if (!isPro && format !== 'csv') {
      showToast('XLSX and JSON exports require a Pro subscription.', 'error');
      return;
    }
    try {
      exportDataset(currentDataset.rows, format, state.projectName);
      showToast(`Dataset exported as ${format.toUpperCase()}!`, 'success');
    } catch (err: any) {
      showToast(`Export failed: ${err?.message}`, 'error');
    }
  };

  const handlePDFReport = () => {
    if (!isPro) {
      showToast('PDF Reports require a Pro subscription.', 'error');
      return;
    }
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
    <div className="flex h-screen bg-background text-gray-300 overflow-hidden relative">
      <div className="glow-overlay" />
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
        <header className="bg-panel/60 backdrop-blur-md border-b border-white/5 z-10 flex-shrink-0">
          <div className="flex items-center justify-between px-4 py-3 gap-4">
            <div className="flex items-center gap-2 min-w-0">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-md text-gray-500 hover:bg-gray-100 flex-shrink-0">
                <Menu size={22} />
              </button>
              {currentDataset && (
                <div className="hidden sm:flex items-center gap-2">
                <span className="text-sm text-gray-500">Workspace /</span>
                <span className="font-semibold text-sm text-white truncate max-w-[200px]">{currentDataset!.name}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
                <div className="hidden md:flex items-center gap-2 mr-2 border-r border-white/10 pr-3 text-xs text-gray-400">
                  <span className="font-medium text-gray-300" title={user!.email || 'User'}>{user!.email?.split('@')[0]}</span>
                  <button onClick={logout} className="text-red-400 hover:text-red-300 font-medium transition-colors">Log out</button>
                </div>
              
              <button
                onClick={handleSmartAnalysis}
                disabled={!currentDataset}
                title="Auto ML & Smart Profiling"
                className={`premium-btn py-2 flex items-center gap-1.5 ${
                  !currentDataset ? 'opacity-30' : ''
                }`}
              >
                <Zap size={14} className={currentDataset ? "text-white" : ""} />
                <span className="hidden md:inline">Smart Analysis</span>
              </button>

              <div className="hidden lg:flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
                <button onClick={() => handleExport('csv')} disabled={!currentDataset} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${currentDataset ? 'text-green-400 hover:bg-green-400/10' : 'text-gray-600 cursor-not-allowed'}`}>
                  <FileText size={14} /> CSV
                </button>
                <button onClick={() => handleExport('xlsx')} disabled={!currentDataset} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${currentDataset ? 'text-emerald-400 hover:bg-emerald-400/10' : 'text-gray-600 cursor-not-allowed'}`}>
                  <FileSpreadsheet size={14} /> Excel
                </button>
                <button onClick={() => handleExport('json')} disabled={!currentDataset} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${currentDataset ? 'text-blue-400 hover:bg-blue-400/10' : 'text-gray-600 cursor-not-allowed'}`}>
                  <FileJson size={14} /> JSON
                </button>
               </div>

              <button onClick={() => setShowCodeModal(true)} title="Export Python Code" className="premium-btn py-2 bg-gray-800 hover:bg-gray-700">
                <Code size={14} /> <span className="hidden sm:inline">Export Code</span>
              </button>
              <button onClick={handlePDFReport} title="Export PDF Report" className="premium-btn py-2 bg-accent-purple hover:bg-accent-purple/80">
                <FileBarChart2 size={14} /> <span className="hidden sm:inline">Report PDF</span>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6 bg-background relative z-0">
          <ErrorBoundary>
            <Suspense fallback={<div className="flex h-64 items-center justify-center"><svg className="animate-spin h-8 w-8 text-blue-500" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg></div>}>
              {activeTab === 'upload' && <DataUpload onUploadSuccess={handleUploadSuccess} />}
              {activeTab === 'explorer' && currentDataset && <DataExplorer dataset={currentDataset!} onDatasetUpdate={handleDatasetUpdate} />}
              {activeTab === 'cleaning' && currentDataset && <DataCleaning dataset={currentDataset!} onDatasetUpdate={handleDatasetUpdate} />}
              {activeTab === 'transformation' && currentDataset && <DataTransformationPage dataset={currentDataset!} onDatasetUpdate={handleDatasetUpdate} />}
              {activeTab === 'analysis' && currentDataset && <DataAnalysis dataset={currentDataset!} />}
              {activeTab === 'visualization' && currentDataset && <DataVisualization dataset={currentDataset!} />}
              {activeTab === 'advanced' && currentDataset && <AdvancedAnalytics dataset={currentDataset!} />}
              {activeTab === 'ml' && currentDataset && <MLAnalysis dataset={currentDataset!} />}
            </Suspense>
          </ErrorBoundary>
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