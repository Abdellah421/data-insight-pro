export interface DatasetColumn {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'unknown';
  nullable: boolean;
  uniqueValues?: number;
  min?: number;
  max?: number;
  mean?: number;
  median?: number;
  std?: number;
  missing?: number;
  missingPercent?: number;
}

export interface Dataset {
  id: string;
  name: string;
  rows: any[];
  columns: DatasetColumn[];
  originalFormat: 'csv' | 'excel' | 'json' | 'unknown';
  dateCreated: Date;
  dateModified: Date;
  originalFilename: string;
}

// ── Smart Insights & ML Types ───────────────────────────────────────────────

export interface ExplainableInsight {
  id: string;
  insight: string;
  explanation: string;
  confidenceScore: number;
  affectedColumns: string[];
}

export interface MLEvaluation {
  silhouetteScore?: number;
  clusterDistribution?: Record<string, number>;
  centroids?: Record<string, any>[];
  featureImportance?: Record<string, number>;
  metrics?: Record<string, number>; // Custom accuracy/R2
}

export interface MLResultEntry {
  id: string;
  type: 'clustering' | 'regression' | 'classification' | 'insights';
  title: string;
  description: string;
  data: any;
  accuracy?: number;
  evaluation?: MLEvaluation;
  explainableInsights?: ExplainableInsight[];
  dateCreated: string;
}

// ── Workflow Timeline System ────────────────────────────────────────────────

export interface WorkflowStep {
  id: string;
  action: string; // e.g., 'CLEANING', 'TRANSFORMATION', 'COLUMN_RENAME'
  description: string;
  parameters: Record<string, any>;
  affectedColumns: string[];
  timestamp: number;
  snapshotId?: string; // Optional reference to dataset version snapshot
}

// ── Dataset Versioning System ───────────────────────────────────────────────

export interface DatasetVersion {
  versionId: string;
  datasetSnapshot: Dataset;
  createdAt: number;
  operationType: string;
}

// ── Visualization Types ─────────────────────────────────────────────────────

export interface ChartConfig {
  id: string;
  chartType: 'bar' | 'line' | 'pie' | 'scatter' | 'histogram' | 'heatmap' | 'box';
  xAxis: string;
  yAxis: string;
  groupBy: string;
  title: string;
  savedAt: number;
}

export interface VisualizationOptions {
  type: string;
  xAxis?: string;
  yAxis?: string;
  groupBy?: string;
  title?: string;
  color?: string;
}

export interface AnalysisResult {
  id: string;
  type: string;
  title: string;
  description?: string;
  data: any;
  visualizationOptions?: VisualizationOptions;
  dateCreated: Date;
}

// ── Legacy Types (kept for compatibility) ────────────────────────────────────

export interface DataTransformation {
  id: string;
  type: 'normalize' | 'standardize' | 'log' | 'sqrt' | 'bin' | 'encode' | 'scale';
  columns: string[];
  method: string;
  parameters: Record<string, any>;
  originalData: any[];
  transformedData: any[];
}

export interface CleaningOptions {
  removeNulls: boolean;
  removeOutliers: boolean;
  removeEmptyRows: boolean;
  removeEmptyColumns: boolean;
  removeDuplicates: boolean;
  trimWhitespace: boolean;
  fixDataTypes: boolean;
  capitalizeHeaders: boolean;
}

export interface HistoryEntry {
  id: string;
  action: string;
  description: string;
  details: Record<string, any>;
  timestamp: number;
}

export interface ProjectVersion {
  versionId: string;
  label: string;
  savedAt: number;
  rowCount: number;
  historyCount: number;
  snapshot: DIPProject;
}

export interface ExportSettings {
  defaultFormat: 'csv' | 'xlsx' | 'json';
  includeHeaders: boolean;
  fileNamePrefix: string;
}

// ── Main Project Structure ──────────────────────────────────────────────────

export interface DIPProject {
  schemaVersion: string;
  projectName: string;
  
  // Feature 9: Multi-Dataset
  datasets: Record<string, Dataset>;
  activeDatasetId: string | null;
  
  // Backward compatibility
  originalDataset?: Dataset | null;
  processedDataset?: Dataset | null;

  // Feature 2: Workflow Timeline
  workflowHistory: WorkflowStep[];
  history: HistoryEntry[]; // Legacy flat log

  // Feature 3: Dataset Versioning
  datasetVersions: DatasetVersion[];

  charts: ChartConfig[];
  analysisResults: any[];
  mlResults: MLResultEntry[];
  insights: ExplainableInsight[];
  
  uiState?: Record<string, any>;
  
  exportSettings: ExportSettings;
  createdAt: string;
  lastModified: string;
  versions: ProjectVersion[]; // Legacy global snapshots
}

export interface ProjectState {
  projectName: string;
  datasets: Record<string, Dataset>;
  activeDatasetId: string | null;
  
  workflowHistory: WorkflowStep[];
  historyIndex: number; // For undo/redo pointing to workflowHistory index
  history: HistoryEntry[]; // Added back for backwards compatibility
  
  datasetVersions: DatasetVersion[];

  charts: ChartConfig[];
  analysisResults: any[];
  mlResults: MLResultEntry[];
  insights: ExplainableInsight[];

  exportSettings: ExportSettings;
  uiState: Record<string, any>;
  
  lastAutoSaved: number | null;
  isDirty: boolean;
  versions: ProjectVersion[];
}

export type ProjectAction =
  | { type: 'SET_PROJECT_NAME'; payload: string }
  | { type: 'ADD_DATASET'; payload: { id: string; dataset: Dataset; setActive?: boolean } }
  | { type: 'SET_ACTIVE_DATASET'; payload: string }
  | { type: 'UPDATE_DATASET'; payload: { id: string; dataset: Dataset } }
  | { type: 'REMOVE_DATASET'; payload: string }
  | { type: 'LOG_WORKFLOW_STEP'; payload: Omit<WorkflowStep, 'id' | 'timestamp'> & { datasetSnapshot?: Dataset } }
  | { type: 'UNDO_STEP' }
  | { type: 'REDO_STEP' }
  | { type: 'JUMP_TO_STEP'; payload: number }
  | { type: 'SAVE_CHART_CONFIG'; payload: Omit<ChartConfig, 'id'> }
  | { type: 'ADD_ML_RESULT'; payload: MLResultEntry }
  | { type: 'ADD_INSIGHTS'; payload: ExplainableInsight[] }
  | { type: 'LOAD_PROJECT'; payload: DIPProject }
  | { type: 'SET_AUTO_SAVED'; payload: number }
  | { type: 'CLEAR_PROJECT' }
  // Legacy actions wrapping new logic internally
  | { type: 'SET_ORIGINAL_DATASET'; payload: Dataset }
  | { type: 'UPDATE_PROCESSED_DATASET'; payload: Dataset }
  | { type: 'LOG_ACTION'; payload: any }
  | { type: 'SET_ANALYSIS_RESULTS'; payload: any[] }
  | { type: 'SAVE_VERSION'; payload: string }
  | { type: 'RESTORE_VERSION'; payload: string };