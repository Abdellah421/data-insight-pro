import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import {
  ProjectState,
  ProjectAction,
  Dataset,
  HistoryEntry,
  ChartConfig,
  AnalysisResult,
  MLResultEntry,
  DIPProject,
  ProjectVersion,
  ExportSettings,
  WorkflowStep,
  DatasetVersion,
  ExplainableInsight,
} from '../types';

// ── Initial State ─────────────────────────────────────────────────────────────

const defaultExportSettings: ExportSettings = {
  defaultFormat: 'csv',
  includeHeaders: true,
  fileNamePrefix: '',
};

const initialState: ProjectState = {
  projectName: 'Untitled Project',
  datasets: {},
  activeDatasetId: null,
  workflowHistory: [],
  historyIndex: -1,
  datasetVersions: [],
  history: [],
  charts: [],
  analysisResults: [],
  mlResults: [],
  insights: [],
  exportSettings: defaultExportSettings,
  uiState: {},
  versions: [],
  lastAutoSaved: null,
  isDirty: false,
};

// ── Helper functions for Timeline ─────────────────────────────────────────────

function generateId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ── Reducer ───────────────────────────────────────────────────────────────────

function projectReducer(state: ProjectState, action: ProjectAction): ProjectState {
  switch (action.type) {
    case 'SET_PROJECT_NAME':
      return { ...state, projectName: action.payload, isDirty: true };

    case 'ADD_DATASET': {
      const { id, dataset, setActive } = action.payload;
      const datasets = { ...state.datasets, [id]: dataset };
      const activeDatasetId = setActive ? id : state.activeDatasetId ?? id;
      return { ...state, datasets, activeDatasetId, isDirty: true };
    }

    case 'SET_ACTIVE_DATASET':
      return { ...state, activeDatasetId: action.payload };

    case 'UPDATE_DATASET': {
      const { id, dataset } = action.payload;
      return {
        ...state,
        datasets: { ...state.datasets, [id]: dataset },
        isDirty: true,
      };
    }

    case 'REMOVE_DATASET': {
      const datasets = { ...state.datasets };
      delete datasets[action.payload];
      let activeDatasetId = state.activeDatasetId;
      if (activeDatasetId === action.payload) {
        const keys = Object.keys(datasets);
        activeDatasetId = keys.length ? keys[0] : null;
      }
      return { ...state, datasets, activeDatasetId, isDirty: true };
    }

    // ── Legacy Handlers (Translated to new format natively) ──
    case 'SET_ORIGINAL_DATASET': {
      const dataset = action.payload;
      const datasetId = dataset.id || generateId('ds');
      // Set to datasets map and set active
      return {
        ...state,
        datasets: { ...state.datasets, [datasetId]: dataset },
        activeDatasetId: datasetId,
        isDirty: true,
      };
    }

    case 'UPDATE_PROCESSED_DATASET': {
      const dataset = action.payload;
      const id = state.activeDatasetId;
      if (!id) return state;
      return {
        ...state,
        datasets: { ...state.datasets, [id]: dataset },
        isDirty: true,
      };
    }

    // ── Workflow Timeline & Undo/Redo Engine ────────────────────────────────
    
    case 'LOG_WORKFLOW_STEP': {
      const step: WorkflowStep = {
        id: generateId('wf'),
        ...action.payload,
        timestamp: Date.now(),
      };

      // Handle Snapshot versioning
      let snapshotId = undefined;
      let newVersions = [...state.datasetVersions];
      if (action.payload.datasetSnapshot) {
        snapshotId = generateId('snap');
        step.snapshotId = snapshotId;
        newVersions.push({
          versionId: snapshotId,
          datasetSnapshot: action.payload.datasetSnapshot,
          createdAt: Date.now(),
          operationType: step.action,
        });
      }

      // Truncate future history (redo stack wiped)
      const currentHistory = state.workflowHistory.slice(0, state.historyIndex + 1);
      const newHistory = [...currentHistory, step];

      return {
        ...state,
        workflowHistory: newHistory,
        historyIndex: newHistory.length - 1,
        datasetVersions: newVersions,
        isDirty: true,
      };
    }

    case 'UNDO_STEP': {
      if (state.historyIndex < 0) return state; // Nothing to undo
      
      const prevIndex = state.historyIndex - 1;
      let newDatasets = { ...state.datasets };
      
      // If going backwards, we need to load the snapshot from the new focused step (if exists)
      // Otherwise fallback to original dataset snapshot which we consider index < 0
      if (prevIndex >= 0 && state.activeDatasetId) {
        const prevStep = state.workflowHistory[prevIndex];
        if (prevStep && prevStep.snapshotId) {
          const snapshot = state.datasetVersions.find(v => v.versionId === prevStep.snapshotId);
          if (snapshot && state.activeDatasetId) {
             newDatasets[state.activeDatasetId] = snapshot.datasetSnapshot;
          }
        }
      }
      
      return { ...state, historyIndex: prevIndex, datasets: newDatasets, isDirty: true };
    }

    case 'REDO_STEP': {
      if (state.historyIndex >= state.workflowHistory.length - 1) return state;
      
      const nextIndex = state.historyIndex + 1;
      let newDatasets = { ...state.datasets };
      const nextStep = state.workflowHistory[nextIndex];

      if (nextStep && nextStep.snapshotId && state.activeDatasetId) {
        const snapshot = state.datasetVersions.find(v => v.versionId === nextStep.snapshotId);
        if (snapshot) {
          newDatasets[state.activeDatasetId] = snapshot.datasetSnapshot;
        }
      }

      return { ...state, historyIndex: nextIndex, datasets: newDatasets, isDirty: true };
    }

    case 'JUMP_TO_STEP': {
      const targetIndex = action.payload;
      if (targetIndex < -1 || targetIndex >= state.workflowHistory.length) return state;
      
      let newDatasets = { ...state.datasets };
      if (targetIndex >= 0 && state.activeDatasetId) {
        const targetStep = state.workflowHistory[targetIndex];
        if (targetStep && targetStep.snapshotId) {
          const snapshot = state.datasetVersions.find(v => v.versionId === targetStep.snapshotId);
          if (snapshot) {
             newDatasets[state.activeDatasetId] = snapshot.datasetSnapshot;
          }
        }
      }

      return { ...state, historyIndex: targetIndex, datasets: newDatasets, isDirty: true };
    }

    // ── Legacy Logging ──────────────────────────────────────────────────────
    case 'LOG_ACTION': {
      const entry: HistoryEntry = {
        ...action.payload,
        id: generateId('hist'),
      };
      return { ...state, history: [...state.history, entry], isDirty: true };
    }

    case 'SAVE_CHART_CONFIG': {
      const config: ChartConfig = {
        ...action.payload,
        id: generateId('chart'),
      };
      const existing = state.charts.findIndex(
        (c) => c.chartType === config.chartType && c.xAxis === config.xAxis && c.yAxis === config.yAxis
      );
      const charts =
        existing >= 0
          ? state.charts.map((c, i) => (i === existing ? config : c))
          : [...state.charts, config];
      return { ...state, charts, isDirty: true };
    }

    case 'SET_ANALYSIS_RESULTS':
      return { ...state, analysisResults: action.payload, isDirty: true };

    case 'ADD_ML_RESULT': {
      const filtered = state.mlResults.filter((r) => r.id !== action.payload.id);
      const mlResults = [action.payload, ...filtered].slice(0, 10);
      return { ...state, mlResults, isDirty: true };
    }

    case 'ADD_INSIGHTS': {
      return { ...state, insights: [...action.payload, ...state.insights], isDirty: true };
    }

    case 'LOAD_PROJECT': {
      const p = action.payload;
      
      // Backward compatibility logic
      const datasets = p.datasets ?? {};
      let activeId = p.activeDatasetId ?? null;

      // Handle old legacy projects mapping
      if (Object.keys(datasets).length === 0 && p.processedDataset) {
        const id = p.processedDataset.id || 'legacy_1';
        datasets[id] = p.processedDataset;
        activeId = id;
      } else if (Object.keys(datasets).length === 0 && p.originalDataset) {
        const id = p.originalDataset.id || 'legacy_orig';
        datasets[id] = p.originalDataset;
        activeId = id;
      }

      return {
        ...state,
        projectName: p.projectName,
        datasets,
        activeDatasetId: activeId,
        history: p.history || [],
        workflowHistory: p.workflowHistory || [],
        historyIndex: p.workflowHistory ? p.workflowHistory.length - 1 : -1,
        datasetVersions: p.datasetVersions || [],
        charts: p.charts || [],
        analysisResults: p.analysisResults || [],
        mlResults: p.mlResults || [],
        insights: p.insights || [],
        exportSettings: p.exportSettings ?? defaultExportSettings,
        uiState: p.uiState || {},
        versions: p.versions || [],
        isDirty: false,
      };
    }

    case 'SAVE_VERSION': {
      const snapshot: DIPProject = {
        schemaVersion: '2.0',
        projectName: state.projectName,
        datasets: state.datasets,
        activeDatasetId: state.activeDatasetId,
        workflowHistory: state.workflowHistory,
        history: state.history,
        datasetVersions: state.datasetVersions,
        charts: state.charts,
        analysisResults: state.analysisResults,
        mlResults: state.mlResults,
        insights: state.insights,
        uiState: state.uiState,
        exportSettings: state.exportSettings,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        versions: [],
      };
      
      const rowCount = state.activeDatasetId && state.datasets[state.activeDatasetId] 
        ? state.datasets[state.activeDatasetId].rows.length 
        : 0;

      const version: ProjectVersion = {
        versionId: generateId('v'),
        label: action.payload,
        savedAt: Date.now(),
        rowCount,
        historyCount: state.workflowHistory.length || state.history.length,
        snapshot,
      };
      const versions = [version, ...state.versions].slice(0, 10);
      return { ...state, versions, isDirty: false };
    }

    case 'RESTORE_VERSION': {
      const version = state.versions.find((v) => v.versionId === action.payload);
      if (!version) return state;
      const p = version.snapshot;
      return {
        ...state,
        projectName: p.projectName,
        datasets: p.datasets || {},
        activeDatasetId: p.activeDatasetId,
        workflowHistory: p.workflowHistory || [],
        historyIndex: p.workflowHistory ? p.workflowHistory.length -1 : -1,
        datasetVersions: p.datasetVersions || [],
        history: p.history || [],
        charts: p.charts || [],
        analysisResults: p.analysisResults || [],
        mlResults: p.mlResults || [],
        insights: p.insights || [],
        exportSettings: p.exportSettings ?? defaultExportSettings,
        isDirty: true,
      };
    }

    case 'SET_AUTO_SAVED':
      return { ...state, lastAutoSaved: action.payload, isDirty: false };

    case 'CLEAR_PROJECT':
      return { ...initialState };

    default:
      return state;
  }
}

// ── Context ───────────────────────────────────────────────────────────────────

interface ProjectContextValue {
  state: ProjectState;
  dispatch: React.Dispatch<ProjectAction>;
  
  // Helpers
  currentDataset: Dataset | null;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

const AUTOSAVE_KEY = 'dataInsight_autosave_project';
const AUTOSAVE_INTERVAL_MS = 20_000; // 20 seconds

// ── Provider ──────────────────────────────────────────────────────────────────

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(projectReducer, initialState);
  const autoSaveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Compute easily accessible current dataset derived from map
  const currentDataset = state.activeDatasetId && state.datasets[state.activeDatasetId] 
    ? state.datasets[state.activeDatasetId] 
    : null;

  // Restore autosave on first mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(AUTOSAVE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as DIPProject;
        // Basic check for either multi-dataset format or legacy format
        if (Object.keys(parsed.datasets || {}).length > 0 || parsed.processedDataset) {
          dispatch({ type: 'LOAD_PROJECT', payload: parsed });
        }
      }
    } catch {
      // ignore corrupt autosave
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-save to localStorage every 20 seconds when dirty
  useEffect(() => {
    autoSaveTimerRef.current = setInterval(() => {
      if (state.isDirty && Object.keys(state.datasets).length > 0) {
        try {
          const dipProject: DIPProject = {
            schemaVersion: '2.0',
            projectName: state.projectName,
            datasets: state.datasets,
            activeDatasetId: state.activeDatasetId,
            workflowHistory: state.workflowHistory,
            history: state.history,
            datasetVersions: state.datasetVersions,
            charts: state.charts,
            analysisResults: state.analysisResults,
            mlResults: state.mlResults,
            insights: state.insights,
            uiState: state.uiState,
            exportSettings: state.exportSettings,
            createdAt: new Date().toISOString(), // Keep it simple for auto-saves
            lastModified: new Date().toISOString(),
            versions: state.versions,
          };
          
          // Inject backward compatibility for exporters expecting processedDataset
          if (state.activeDatasetId) {
            dipProject.processedDataset = state.datasets[state.activeDatasetId];
            dipProject.originalDataset = state.datasets[state.activeDatasetId];
          }

          localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(dipProject));
          dispatch({ type: 'SET_AUTO_SAVED', payload: Date.now() });
        } catch {
          // localStorage might be full
        }
      }
    }, AUTOSAVE_INTERVAL_MS);

    return () => {
      if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current);
    };
  }, [state]);

  const value = {
    state,
    dispatch,
    currentDataset,
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
};

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useProject(): ProjectContextValue {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProject must be used within a ProjectProvider');
  return ctx;
}

export { AUTOSAVE_KEY };
