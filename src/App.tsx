import React, { useState, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import {
  Menu, BarChart4, Database, FileCode, Settings, Brain, Calculator,
  RefreshCw, FileSpreadsheet, FileText, FileJson, FileBarChart2, Zap, Code, ShieldCheck, Home, ChevronDown, SlidersHorizontal
} from 'lucide-react';
import Sidebar from './components/Sidebar';
import ErrorBoundary from './components/ErrorBoundary';
import TimelinePanel from './components/TimelinePanel';
import SuggestionsPanel from './components/SuggestionsPanel';
import PipelineCodeModal from './components/PipelineCodeModal';
import LandingPage from './pages/LandingPage';
import ToolPage from './pages/ToolPage';
import { PricingPage, AboutPage, ContactPage, PrivacyPage, TermsPage } from './pages/StaticPages';
import { ProjectProvider, useProject } from './context/ProjectContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { exportDataset, generatePDFReport } from './utils/exporters';
import { Dataset } from './types';
import { trackEvent } from './utils/analytics';

const DataUpload = React.lazy(() => import('./pages/DataUpload'));
const DataExplorer = React.lazy(() => import('./pages/DataExplorer'));
const DataCleaning = React.lazy(() => import('./pages/DataCleaning'));
const DataAnalysis = React.lazy(() => import('./pages/DataAnalysis'));
const DataVisualization = React.lazy(() => import('./pages/DataVisualization'));
const DataTransformationPage = React.lazy(() => import('./pages/DataTransformationPage'));
const MLAnalysis = React.lazy(() => import('./pages/MLAnalysis'));
const AdvancedAnalytics = React.lazy(() => import('./pages/AdvancedAnalytics'));

// ── DataInsight Pro Main Workspace (/app) — NO FOOTER & FULLY RESPONSIVE ──────
function DataInsightWorkspace() {
  const { state, dispatch, currentDataset } = useProject();
  const { showToast } = useToast();

  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile drawer defaults to closed
  const [mobileActionsOpen, setMobileActionsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('upload');
  const [showTimeline, setShowTimeline] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);

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
    trackEvent(`${dataset.originalFormat}_uploaded` as any, {
      rowCount: dataset.rows.length,
      columnCount: dataset.columns.length,
    });
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
    setMobileActionsOpen(false);
    showToast('Switched to Machine Learning panel for smart profiling & analysis', 'info');
  };

  // Export handlers
  const handleExport = (format: 'csv' | 'xlsx' | 'json') => {
    if (!currentDataset) {
      showToast('No dataset loaded to export.', 'warning');
      return;
    }
    try {
      exportDataset(currentDataset.rows, format, state.projectName);
      setMobileActionsOpen(false);
      showToast(`Dataset exported as ${format.toUpperCase()}!`, 'success');
      trackEvent('export_clicked', { exportType: format });
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
      setMobileActionsOpen(false);
      showToast('PDF report generated!', 'success');
      trackEvent('pdf_generated');
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
    <div className="flex h-screen h-[100dvh] w-full bg-gray-100 overflow-hidden relative">
      {/* Sidebar Drawer */}
      <Sidebar
        isOpen={sidebarOpen}
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        routes={routes}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onToggleTimeline={() => { setShowTimeline(!showTimeline); setShowSuggestions(false); }}
        onToggleSuggestions={() => { setShowSuggestions(!showSuggestions); setShowTimeline(false); }}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 w-full h-full">
        {/* Top Header Bar */}
        <header className="bg-white shadow-xs z-10 flex-shrink-0 border-b border-gray-200 w-full">
          <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 gap-2 w-full">
            {/* Left section: Drawer Toggle + Home + Dataset Title */}
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2.5 rounded-lg text-gray-600 hover:bg-gray-100 flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-400"
                aria-label="Open sidebar menu"
              >
                <Menu size={22} />
              </button>

              <Link to="/" className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-blue-600 px-2 py-2 rounded-lg hover:bg-gray-50 flex-shrink-0 min-h-[44px]">
                <Home size={16} />
                <span className="hidden sm:inline">Home</span>
              </Link>

              {currentDataset && (
                <div className="flex items-center gap-1.5 border-l border-gray-200 pl-2.5 min-w-0">
                  <span className="hidden md:inline text-xs text-gray-400">Dataset /</span>
                  <span className="font-semibold text-xs sm:text-sm text-gray-800 truncate max-w-[120px] sm:max-w-[200px]" title={currentDataset.name}>
                    {currentDataset.name}
                  </span>
                </div>
              )}
            </div>

            {/* Desktop Actions */}
            <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-medium">
                <ShieldCheck size={13} />
                <span>Saved locally on this device</span>
              </div>

              <button
                onClick={handleSmartAnalysis}
                disabled={!currentDataset}
                title="Auto ML & Smart Profiling"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold shadow-2xs transition-colors min-h-[40px] ${
                  currentDataset ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200' : 'bg-gray-50 text-gray-400 border border-gray-200 cursor-not-allowed'
                }`}
              >
                <Zap size={14} className={currentDataset ? "text-amber-500" : ""} />
                <span>Smart Analysis</span>
              </button>

              <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg p-1">
                <button onClick={() => handleExport('csv')} disabled={!currentDataset} className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${currentDataset ? 'text-green-700 hover:bg-green-100' : 'text-gray-300 cursor-not-allowed'}`}>
                  <FileText size={14} /> CSV
                </button>
                <button onClick={() => handleExport('xlsx')} disabled={!currentDataset} className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${currentDataset ? 'text-emerald-700 hover:bg-emerald-100' : 'text-gray-300 cursor-not-allowed'}`}>
                  <FileSpreadsheet size={14} /> Excel
                </button>
                <button onClick={() => handleExport('json')} disabled={!currentDataset} className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${currentDataset ? 'text-blue-700 hover:bg-blue-100' : 'text-gray-300 cursor-not-allowed'}`}>
                  <FileJson size={14} /> JSON
                </button>
              </div>

              <button onClick={() => setShowCodeModal(true)} title="Export Python Code" className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 text-gray-100 rounded-lg text-xs font-semibold hover:bg-black transition-colors shadow-2xs min-h-[40px]">
                <Code size={14} /> <span>Export Code</span>
              </button>

              <button onClick={handlePDFReport} title="Export PDF Report" className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors shadow-2xs min-h-[40px]">
                <FileBarChart2 size={14} /> <span>PDF Report</span>
              </button>
            </div>

            {/* Mobile Actions Toggle Button */}
            <div className="lg:hidden flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => setMobileActionsOpen(!mobileActionsOpen)}
                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold min-h-[44px]"
              >
                <SlidersHorizontal size={16} />
                <span>Actions</span>
                <ChevronDown size={14} className={`transition-transform ${mobileActionsOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {/* Mobile Collapsible Actions Toolbar */}
          {mobileActionsOpen && (
            <div className="lg:hidden px-3 py-3 bg-gray-50 border-t border-gray-200 grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                onClick={handleSmartAnalysis}
                disabled={!currentDataset}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-semibold bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 min-h-[44px]"
              >
                <Zap size={14} className="text-amber-500" />
                <span>Smart Analysis</span>
              </button>

              <button
                onClick={() => handleExport('csv')}
                disabled={!currentDataset}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-semibold bg-white border border-gray-300 text-green-700 hover:bg-green-50 disabled:opacity-50 min-h-[44px]"
              >
                <FileText size={14} />
                <span>CSV Export</span>
              </button>

              <button
                onClick={() => handleExport('xlsx')}
                disabled={!currentDataset}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-semibold bg-white border border-gray-300 text-emerald-700 hover:bg-emerald-50 disabled:opacity-50 min-h-[44px]"
              >
                <FileSpreadsheet size={14} />
                <span>Excel Export</span>
              </button>

              <button
                onClick={() => handleExport('json')}
                disabled={!currentDataset}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-semibold bg-white border border-gray-300 text-blue-700 hover:bg-blue-50 disabled:opacity-50 min-h-[44px]"
              >
                <FileJson size={14} />
                <span>JSON Export</span>
              </button>

              <button
                onClick={() => { setShowCodeModal(true); setMobileActionsOpen(false); }}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-semibold bg-gray-800 text-white hover:bg-black min-h-[44px]"
              >
                <Code size={14} />
                <span>Export Code</span>
              </button>

              <button
                onClick={handlePDFReport}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 min-h-[44px]"
              >
                <FileBarChart2 size={14} />
                <span>PDF Report</span>
              </button>
            </div>
          )}
        </header>

        {/* Main Analysis Viewport (NO FOOTER BELOW) */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 md:p-6 bg-gray-100 relative w-full h-full">
          <ErrorBoundary>
            <Suspense fallback={<div className="flex h-64 items-center justify-center"><svg className="animate-spin h-8 w-8 text-blue-500" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg></div>}>
              {activeTab === 'upload' && <DataUpload onUploadSuccess={handleUploadSuccess} />}
              {activeTab === 'explorer' && currentDataset && <DataExplorer dataset={currentDataset} onDatasetUpdate={handleDatasetUpdate} />}
              {activeTab === 'cleaning' && currentDataset && <DataCleaning dataset={currentDataset} onDatasetUpdate={handleDatasetUpdate} />}
              {activeTab === 'transformation' && currentDataset && <DataTransformationPage dataset={currentDataset} onDatasetUpdate={handleDatasetUpdate} />}
              {activeTab === 'analysis' && currentDataset && <DataAnalysis dataset={currentDataset} />}
              {activeTab === 'visualization' && currentDataset && <DataVisualization dataset={currentDataset} />}
              {activeTab === 'advanced' && currentDataset && <AdvancedAnalytics dataset={currentDataset} />}
              {activeTab === 'ml' && currentDataset && <MLAnalysis dataset={currentDataset} />}
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>

      {showTimeline && <TimelinePanel onClose={() => setShowTimeline(false)} />}
      {showSuggestions && <SuggestionsPanel onClose={() => setShowSuggestions(false)} />}
      {showCodeModal && <PipelineCodeModal onClose={() => setShowCodeModal(false)} />}
    </div>
  );
}

// ── Root App Router ──────────────────────────────────────────────────────────
function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <ProjectProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Landing Page */}
              <Route path="/" element={<LandingPage />} />

              {/* Public DataInsight Workspace (NO FOOTER, FULL VIEWPORT) */}
              <Route path="/app" element={<DataInsightWorkspace />} />

              {/* Public Tools SEO Pages */}
              <Route path="/tools/:toolId" element={<ToolPage />} />

              {/* Public Static Pages */}
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </ProjectProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;