import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DIPProject, ProjectState } from '../types';

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

// ── PDF Report ────────────────────────────────────────────────────────────────

/**
 * Generate a comprehensive PDF report of the project session.
 */
export function generatePDFReport(
  state: ProjectState,
  chartImageBase64?: string | null
): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const safeName = (state.projectName || 'Project').replace(/[^a-zA-Z0-9_-]/g, '_');
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 15;

  // ── Cover / Header ──
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, pageW, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('DataInsight Pro', margin, 18);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'normal');
  doc.text(`Project Report: ${state.projectName || 'Untitled'}`, margin, 30);

  doc.setTextColor(100, 100, 100);
  doc.setFontSize(9);
  doc.text(`Generated: ${new Date().toLocaleString()}`, margin, 46);

  let y = 55;

  // ── Dataset Summary ──
  const activeDataset = state.activeDatasetId ? state.datasets[state.activeDatasetId] : null;
  
  if (activeDataset) {
    const ds = activeDataset;
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Dataset Summary', margin, y);
    y += 6;

    autoTable(doc, {
      startY: y,
      head: [['Property', 'Value']],
      body: [
        ['File Name', ds.originalFilename],
        ['Format', ds.originalFormat.toUpperCase()],
        ['Total Rows', ds.rows.length.toLocaleString()],
        ['Total Columns', ds.columns.length.toLocaleString()],
        ['Date Modified', new Date(ds.dateModified).toLocaleString()],
      ],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [37, 99, 235] },
      margin: { left: margin, right: margin },
    });
    y = (doc as any).lastAutoTable.finalY + 10;

    // Column details table
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Column Details', margin, y);
    y += 4;

    const colRows = ds.columns.slice(0, 20).map((col: any) => [
      col.name,
      col.type,
      col.missing != null ? col.missing.toString() : '0',
      col.mean != null ? col.mean.toFixed(3) : '-',
      col.min != null ? col.min.toString() : '-',
      col.max != null ? col.max.toString() : '-',
    ]);

    autoTable(doc, {
      startY: y,
      head: [['Column', 'Type', 'Missing', 'Mean', 'Min', 'Max']],
      body: colRows,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [37, 99, 235] },
      margin: { left: margin, right: margin },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // ── Workflow History ──
  if (state.history.length > 0) {
    if (y > 230) { doc.addPage(); y = 20; }
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text('Workflow History', margin, y);
    y += 4;

    const histRows = state.history.slice(0, 30).map((h) => [
      h.action,
      h.description,
      new Date(h.timestamp).toLocaleString(),
    ]);

    autoTable(doc, {
      startY: y,
      head: [['Action', 'Description', 'Timestamp']],
      body: histRows,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [79, 70, 229] },
      margin: { left: margin, right: margin },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // ── ML Results ──
  if (state.mlResults.length > 0) {
    if (y > 230) { doc.addPage(); y = 20; }
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text('Machine Learning Results', margin, y);
    y += 4;

    const mlRows = state.mlResults.map((r) => [
      r.type.charAt(0).toUpperCase() + r.type.slice(1),
      r.title,
      r.description,
      r.accuracy != null ? `${(r.accuracy * 100).toFixed(1)}%` : '-',
    ]);

    autoTable(doc, {
      startY: y,
      head: [['Type', 'Title', 'Description', 'Accuracy']],
      body: mlRows,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [16, 185, 129] },
      margin: { left: margin, right: margin },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // ── Chart image ──
  if (chartImageBase64) {
    if (y > 170) { doc.addPage(); y = 20; }
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Visualization Snapshot', margin, y);
    y += 5;
    try {
      const imgW = pageW - margin * 2;
      const imgH = imgW * 0.55;
      doc.addImage(chartImageBase64, 'PNG', margin, y, imgW, imgH);
      y += imgH + 10;
    } catch {
      // skip image if it fails
    }
  }

  // ── Footer on all pages ──
  const totalPages = (doc.internal as any).getNumberOfPages?.() ?? 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(180, 180, 180);
    doc.text(
      `DataInsight Pro — ${state.projectName} — Page ${i} of ${totalPages}`,
      pageW / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: 'center' }
    );
  }

  doc.save(`${safeName}_report.pdf`);
}
