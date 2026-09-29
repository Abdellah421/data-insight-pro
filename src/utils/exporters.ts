import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { DIPProject, ProjectState } from '../types';
import { generateProfessionalPDFReport } from './pdfGenerator';

// ── Dataset Export ────────────────────────────────────────────────────────────

/**
 * Export the processed dataset in CSV, XLSX, or JSON format.
 */
export function exportDataset(
  rows: any[],
  format: 'csv' | 'xlsx' | 'json',
  projectName: string
): void {
  const safeName = (projectName || 'dataset').replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `${safeName}_cleaned`;

  if (format === 'csv') {
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${fileName}.csv`);
  } else if (format === 'xlsx') {
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    saveAs(blob, `${fileName}.xlsx`);
  } else if (format === 'json') {
    const json = JSON.stringify(rows, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    saveAs(blob, `${fileName}.json`);
  }
}

// ── Project Save ──────────────────────────────────────────────────────────────

/**
 * Serialize and download the full project as a .dip file.
 */
export function saveProject(state: ProjectState): void {
  const activeDataset = state.activeDatasetId ? state.datasets[state.activeDatasetId] : null;
  
  const dipProject: DIPProject = {
    schemaVersion: '2.0',
    projectName: state.projectName,
    datasets: state.datasets,
    activeDatasetId: state.activeDatasetId,
    originalDataset: activeDataset,
    processedDataset: activeDataset,
    history: state.history,
    charts: state.charts,
    analysisResults: state.analysisResults,
    mlResults: state.mlResults,
    insights: state.insights,
    exportSettings: state.exportSettings,
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    versions: state.versions,
    workflowHistory: state.workflowHistory,
    datasetVersions: state.datasetVersions,
  };

  const safeName = (state.projectName || 'project').replace(/[^a-zA-Z0-9_-]/g, '_');
  const blob = new Blob([JSON.stringify(dipProject, null, 2)], {
    type: 'application/json',
  });
  saveAs(blob, `${safeName}.dip`);
}

// ── Project Load ──────────────────────────────────────────────────────────────

/**
 * Read and parse a .dip file, returns raw parsed JSON (validation happens in
 * the calling context using dipSchema.ts).
 */
export function loadProjectFromFile(file: File): Promise<any> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = JSON.parse(text);
        resolve(data);
      } catch {
        reject(new Error('Failed to parse .dip file. File may be corrupted.'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsText(file);
  });
}

// ── Client-Facing PDF Data Analysis Report ───────────────────────────────────

/**
 * Generate an executive, client-facing PDF data analysis report automatically
 * computed from dataset statistics, quality checks, correlations, ML results, and AI insights.
 */
export function generatePDFReport(
  state: ProjectState,
  chartImageBase64?: string | null
): void {
  generateProfessionalPDFReport(state, chartImageBase64);
}
