import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ProjectState, Dataset, DatasetColumn, MLResultEntry, ExplainableInsight } from '../types';

// ── Color Constants ──
const PRIMARY_BLUE = [30, 64, 175];   // #1e40af
const ACCENT_BLUE = [37, 99, 235];    // #2563eb
const DARK_SLATE = [30, 41, 59];      // #1e293b
const LIGHT_BG = [248, 250, 252];     // #f8fafc
const CARD_BG = [255, 255, 255];
const BORDER_GRAY = [226, 232, 240];  // #e2e8f0
const TEXT_MUTED = [100, 116, 139];   // #64748b
const GREEN_STATUS = [5, 150, 105];   // #059669
const AMBER_STATUS = [217, 119, 6];   // #d97706
const RED_STATUS = [220, 38, 38];     // #dc2626

// ── Statistical Helper Utilities ─────────────────────────────────────────────

interface NumericStats {
  count: number;
  missing: number;
  missingPercent: number;
  mean: number;
  median: number;
  std: number;
  min: number;
  q25: number;
  q50: number;
  q75: number;
  max: number;
}

interface CategoricalStats {
  count: number;
  missing: number;
  missingPercent: number;
  unique: number;
  topValue: string;
  topFreq: number;
  topPercent: number;
}

function computeNumericStats(rows: any[], colName: string): NumericStats | null {
  const vals: number[] = [];
  let missing = 0;

  rows.forEach(r => {
    const v = r[colName];
    if (v === null || v === undefined || v === '' || isNaN(Number(v))) {
      missing++;
    } else {
      vals.push(Number(v));
    }
  });

  if (vals.length === 0) return null;

  vals.sort((a, b) => a - b);
  const count = vals.length;
  const sum = vals.reduce((a, b) => a + b, 0);
  const mean = sum / count;

  const variance = vals.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (count > 1 ? count - 1 : 1);
  const std = Math.sqrt(variance);

  const getPercentile = (p: number) => {
    const idx = (vals.length - 1) * p;
    const lower = Math.floor(idx);
    const upper = Math.ceil(idx);
    const weight = idx - lower;
    return vals[lower] * (1 - weight) + vals[upper] * weight;
  };

  return {
    count: rows.length,
    missing,
    missingPercent: (missing / rows.length) * 100,
    mean,
    median: getPercentile(0.5),
    std,
    min: vals[0],
    q25: getPercentile(0.25),
    q50: getPercentile(0.5),
    q75: getPercentile(0.75),
    max: vals[vals.length - 1],
  };
}

function computeCategoricalStats(rows: any[], colName: string): CategoricalStats {
  const freqMap: Record<string, number> = {};
  let missing = 0;

  rows.forEach(r => {
    const v = r[colName];
    if (v === null || v === undefined || v === '') {
      missing++;
    } else {
      const s = String(v);
      freqMap[s] = (freqMap[s] || 0) + 1;
    }
  });

  const entries = Object.entries(freqMap).sort((a, b) => b[1] - a[1]);
  const unique = entries.length;
  const topValue = entries.length > 0 ? entries[0][0] : 'N/A';
  const topFreq = entries.length > 0 ? entries[0][1] : 0;

  return {
    count: rows.length,
    missing,
    missingPercent: (missing / rows.length) * 100,
    unique,
    topValue,
    topFreq,
    topPercent: rows.length > 0 ? (topFreq / rows.length) * 100 : 0,
  };
}

interface CorrelationPair {
  varA: string;
  varB: string;
  r: number;
  direction: 'Positive' | 'Negative' | 'Neutral';
  strength: 'Strong' | 'Moderate' | 'Weak';
}

function computeCorrelations(rows: any[], numericCols: string[]): CorrelationPair[] {
  const pairs: CorrelationPair[] = [];
  if (numericCols.length < 2 || rows.length < 3) return pairs;

  for (let i = 0; i < numericCols.length; i++) {
    for (let j = i + 1; j < numericCols.length; j++) {
      const colA = numericCols[i];
      const colB = numericCols[j];

      let n = 0;
      let sumA = 0, sumB = 0, sumA2 = 0, sumB2 = 0, sumAB = 0;

      rows.forEach(r => {
        const vA = Number(r[colA]);
        const vB = Number(r[colB]);
        if (!isNaN(vA) && !isNaN(vB) && r[colA] !== null && r[colB] !== null) {
          n++;
          sumA += vA;
          sumB += vB;
          sumA2 += vA * vA;
          sumB2 += vB * vB;
          sumAB += vA * vB;
        }
      });

      if (n > 2) {
        const numerator = n * sumAB - sumA * sumB;
        const denominator = Math.sqrt((n * sumA2 - sumA * sumA) * (n * sumB2 - sumB * sumB));

        if (denominator !== 0) {
          const r = numerator / denominator;
          const absR = Math.abs(r);
          let strength: 'Strong' | 'Moderate' | 'Weak' = 'Weak';
          if (absR >= 0.7) strength = 'Strong';
          else if (absR >= 0.4) strength = 'Moderate';

          const direction = r > 0.05 ? 'Positive' : r < -0.05 ? 'Negative' : 'Neutral';
          pairs.push({ varA: colA, varB: colB, r, direction, strength });
        }
      }
    }
  }

  return pairs.sort((a, b) => Math.abs(b.r) - Math.abs(a.r));
}

// ── Main PDF Generation Engine ───────────────────────────────────────────────

export function generateProfessionalPDFReport(
  state: ProjectState,
  chartImageBase64?: string | null
): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();  // 210mm
  const pageH = doc.internal.pageSize.getHeight(); // 297mm
  const margin = 15;
  const contentW = pageW - margin * 2;

  const activeDataset = state.activeDatasetId ? state.datasets[state.activeDatasetId] : null;

  if (!activeDataset) {
    throw new Error('No dataset available to generate analysis report.');
  }

  const ds = activeDataset;
  const rows = ds.rows;
  const cols = ds.columns;
  const totalRows = rows.length;
  const totalCols = cols.length;

  // Separate columns
  const numericCols = cols.filter(c => c.type === 'number').map(c => c.name);
  const categoricalCols = cols.filter(c => c.type === 'string' || c.type === 'boolean').map(c => c.name);

  // Compute Missing & Duplicates
  let totalCells = totalRows * totalCols;
  let totalMissingCells = 0;
  cols.forEach(c => {
    rows.forEach(r => {
      if (r[c.name] === null || r[c.name] === undefined || r[c.name] === '') {
        totalMissingCells++;
      }
    });
  });

  const missingPercent = totalCells > 0 ? (totalMissingCells / totalCells) * 100 : 0;

  // Check duplicate rows count
  const rowStrings = new Set();
  let duplicateRowCount = 0;
  rows.forEach(r => {
    const s = JSON.stringify(r);
    if (rowStrings.has(s)) duplicateRowCount++;
    else rowStrings.add(s);
  });
  const duplicatePercent = totalRows > 0 ? (duplicateRowCount / totalRows) * 100 : 0;

  // Data Quality Score calculation
  const dataQualityScore = Math.max(0, Math.min(100, Math.round(100 - (missingPercent * 0.5 + duplicatePercent * 0.5))));
  const overallDataStatus = dataQualityScore >= 85 ? 'Clean' : dataQualityScore >= 65 ? 'Needs Attention' : 'Significant Issues';

  // Correlations
  const correlations = computeCorrelations(rows, numericCols);

  // Generate Report Unique ID
  const reportId = `RPT-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const reportDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  // Page Header & Footer helper
  const addPageHeaderFooter = (pageNumber: number, sectionTitle: string) => {
    if (pageNumber === 1) return; // Skip cover page

    // Header
    doc.setFillColor(...PRIMARY_BLUE);
    doc.rect(0, 0, pageW, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text('DATAINSIGHT PRO  |  CLIENT ANALYSIS REPORT', margin, 6.5);
    doc.setFont('helvetica', 'normal');
    doc.text(state.projectName.slice(0, 40), pageW - margin, 6.5, { align: 'right' });

    // Footer
    doc.setDrawColor(...BORDER_GRAY);
    doc.setLineWidth(0.3);
    doc.line(margin, pageH - 12, pageW - margin, pageH - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...TEXT_MUTED);
    doc.text('Confidential — Prepared for Client', margin, pageH - 6.5);
    doc.text(`Generated ${reportDate}`, pageW / 2, pageH - 6.5, { align: 'center' });
    doc.text(`Page ${pageNumber}`, pageW - margin, pageH - 6.5, { align: 'right' });
  };

  const drawKpiCard = (x: number, y: number, w: number, h: number, label: string, value: string, subtext?: string, color = PRIMARY_BLUE) => {
    doc.setFillColor(...CARD_BG);
    doc.setDrawColor(...BORDER_GRAY);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, w, h, 2, 2, 'FD');

    // Colored left accent bar
    doc.setFillColor(...color);
    doc.rect(x, y, 2, h, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...TEXT_MUTED);
    doc.text(label.toUpperCase(), x + 6, y + 6);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...DARK_SLATE);
    doc.text(value, x + 6, y + 14);

    if (subtext) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(...TEXT_MUTED);
      doc.text(subtext, x + 6, y + 18);
    }
  };

  let pageNum = 1;

  // =========================================================================
  // PAGE 1 — COVER PAGE
  // =========================================================================
  doc.setFillColor(...PRIMARY_BLUE);
  doc.rect(0, 0, pageW, 110, 'F');

  // Decorative diagonal accent
  doc.setFillColor(...ACCENT_BLUE);
  doc.triangle(0, 110, pageW, 85, pageW, 110, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.text('DATAINSIGHT PRO', margin, 45);

  doc.setFontSize(16);
  doc.setFont('helvetica', 'normal');
  doc.text('DATA ANALYSIS & INSIGHTS REPORT', margin, 58);

  doc.setFontSize(10);
  doc.text('Automated Enterprise Data Intelligence Deliverable', margin, 68);

  // Metadata Card on Cover
  let coverY = 130;
  doc.setFillColor(...LIGHT_BG);
  doc.setDrawColor(...BORDER_GRAY);
  doc.roundedRect(margin, coverY, contentW, 110, 4, 4, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...DARK_SLATE);
  doc.text('Project Metadata & File Details', margin + 10, coverY + 15);

  autoTable(doc, {
    startY: coverY + 22,
    head: [['Attribute', 'Value']],
    body: [
      ['Project Name', state.projectName],
      ['Dataset Filename', ds.originalFilename],
      ['Original Format', ds.originalFormat.toUpperCase()],
      ['Analysis Date', reportDate],
      ['Total Records (Rows)', totalRows.toLocaleString()],
      ['Total Variables (Columns)', totalCols.toLocaleString()],
      ['Data Completeness', `${(100 - missingPercent).toFixed(1)}%`],
      ['Report Identifier', reportId],
    ],
    styles: { fontSize: 9, cellPadding: 2.5 },
    headStyles: { fillColor: PRIMARY_BLUE, textColor: [255, 255, 255], fontStyle: 'bold' },
    margin: { left: margin + 10, right: margin + 10 },
  });

  // Footer on cover page
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_MUTED);
  doc.text('CONFIDENTIAL — PREPARED FOR CLIENT', pageW / 2, pageH - 15, { align: 'center' });

  // =========================================================================
  // PAGE 2 — EXECUTIVE SUMMARY
  // =========================================================================
  doc.addPage();
  pageNum++;
  addPageHeaderFooter(pageNum, 'Executive Summary');

  let y = 20;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...DARK_SLATE);
  doc.text('Executive Summary', margin, y);
  y += 8;

  // KPI Cards Grid (2 rows x 3 cols)
  const cardW = (contentW - 8) / 3;
  const cardH = 22;

  drawKpiCard(margin, y, cardW, cardH, 'Total Records', totalRows.toLocaleString(), 'Dataset Rows', PRIMARY_BLUE);
  drawKpiCard(margin + cardW + 4, y, cardW, cardH, 'Variables', totalCols.toString(), `${numericCols.length} Num / ${categoricalCols.length} Cat`, ACCENT_BLUE);
  drawKpiCard(margin + (cardW + 4) * 2, y, cardW, cardH, 'Missing Cells', `${missingPercent.toFixed(1)}%`, `${totalMissingCells.toLocaleString()} null values`, missingPercent > 10 ? RED_STATUS : GREEN_STATUS);

  y += cardH + 4;

  drawKpiCard(margin, y, cardW, cardH, 'Duplicates', `${duplicatePercent.toFixed(1)}%`, `${duplicateRowCount} duplicate rows`, duplicatePercent > 0 ? AMBER_STATUS : GREEN_STATUS);
  drawKpiCard(margin + cardW + 4, y, cardW, cardH, 'Data Quality', `${dataQualityScore}/100`, overallDataStatus, dataQualityScore >= 85 ? GREEN_STATUS : AMBER_STATUS);
  drawKpiCard(margin + (cardW + 4) * 2, y, cardW, cardH, 'ML Models', state.mlResults.length.toString(), `${state.insights.length} AI Insights`, PRIMARY_BLUE);

  y += cardH + 12;

  // Key Findings Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...DARK_SLATE);
  doc.text('Key Findings & Core Observations', margin, y);
  y += 6;

  const keyFindings: { title: string; desc: string; metric: string }[] = [];

  // Finding 1: Volume & Data Scope
  keyFindings.push({
    title: '1. Dataset Scope & Volume',
    desc: `The dataset "${ds.originalFilename}" contains ${totalRows.toLocaleString()} observations evaluated across ${totalCols} distinct variables.`,
    metric: `${totalRows.toLocaleString()} Records`,
  });

  // Finding 2: Data Quality
  if (missingPercent === 0 && duplicateRowCount === 0) {
    keyFindings.push({
      title: '2. High Data Reliability',
      desc: 'The dataset has 0 missing cells and zero duplicate records, providing complete statistical integrity.',
      metric: '100% Complete',
    });
  } else {
    keyFindings.push({
      title: '2. Data Quality & Completeness',
      desc: `Detected ${totalMissingCells.toLocaleString()} missing values (${missingPercent.toFixed(1)}%) and ${duplicateRowCount} duplicate records.`,
      metric: `${dataQualityScore}/100 Quality Score`,
    });
  }

  // Finding 3: Top Correlations
  if (correlations.length > 0) {
    const topCorr = correlations[0];
    keyFindings.push({
      title: '3. Primary Variable Relationship',
      desc: `Strongest statistical correlation identified between "${topCorr.varA}" and "${topCorr.varB}".`,
      metric: `r = ${topCorr.r.toFixed(2)} (${topCorr.strength} ${topCorr.direction})`,
    });
  }

  // Finding 4: ML Models
  if (state.mlResults.length > 0) {
    const ml = state.mlResults[0];
    keyFindings.push({
      title: '4. Machine Learning Modeling',
      desc: `Successfully trained ${state.mlResults.length} machine learning analysis model(s). ${ml.title}: ${ml.description}.`,
      metric: ml.accuracy ? `Accuracy: ${(ml.accuracy * 100).toFixed(1)}%` : 'Model Trained',
    });
  }

  autoTable(doc, {
    startY: y,
    head: [['Finding Title', 'Observation Summary', 'Evidence / Metric']],
    body: keyFindings.map(f => [f.title, f.desc, f.metric]),
    styles: { fontSize: 8.5, cellPadding: 3 },
    headStyles: { fillColor: PRIMARY_BLUE },
    columnStyles: { 0: { fontStyle: 'bold', width: 45 }, 1: { width: 95 }, 2: { fontStyle: 'bold', width: 40 } },
    margin: { left: margin, right: margin },
  });

  // =========================================================================
  // PAGE 3 — DATASET OVERVIEW & VARIABLE SPECS
  // =========================================================================
  doc.addPage();
  pageNum++;
  addPageHeaderFooter(pageNum, 'Dataset Overview');

  y = 20;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...DARK_SLATE);
  doc.text('Dataset Overview & Variable Profiles', margin, y);
  y += 8;

  const varProfiles: any[] = [];
  cols.forEach(c => {
    if (c.type === 'number') {
      const stats = computeNumericStats(rows, c.name);
      if (stats) {
        varProfiles.push([
          c.name,
          'Numeric',
          `${stats.missing} (${stats.missingPercent.toFixed(1)}%)`,
          stats.count.toString(),
          stats.min.toFixed(2),
          stats.max.toFixed(2),
          stats.mean.toFixed(2),
          stats.median.toFixed(2),
        ]);
      }
    } else {
      const stats = computeCategoricalStats(rows, c.name);
      varProfiles.push([
        c.name,
        'Categorical',
        `${stats.missing} (${stats.missingPercent.toFixed(1)}%)`,
        `${stats.unique} unique`,
        '—',
        '—',
        `Top: "${stats.topValue.slice(0, 15)}"`,
        `${stats.topPercent.toFixed(1)}%`,
      ]);
    }
  });

  autoTable(doc, {
    startY: y,
    head: [['Variable Name', 'Type', 'Missing (%)', 'Unique/Count', 'Min', 'Max', 'Mean / Top', 'Median / Share']],
    body: varProfiles,
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: PRIMARY_BLUE },
    margin: { left: margin, right: margin },
  });

  // =========================================================================
  // PAGE 4 — DATA QUALITY ASSESSMENT
  // =========================================================================
  doc.addPage();
  pageNum++;
  addPageHeaderFooter(pageNum, 'Data Quality');

  y = 20;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...DARK_SLATE);
  doc.text('Data Quality Assessment', margin, y);
  y += 8;

  // Quality score bar box
  doc.setFillColor(...LIGHT_BG);
  doc.setDrawColor(...BORDER_GRAY);
  doc.roundedRect(margin, y, contentW, 25, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...DARK_SLATE);
  doc.text(`Data Quality Score: ${dataQualityScore} / 100`, margin + 6, y + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_MUTED);
  doc.text(`Status: ${overallDataStatus}. Evaluated across missing cells (${missingPercent.toFixed(1)}%) and duplicates (${duplicatePercent.toFixed(1)}%).`, margin + 6, y + 18);

  y += 32;

  // Detected Issues Table
  const issues: any[] = [];
  cols.forEach(c => {
    const stats = computeCategoricalStats(rows, c.name);
    if (stats.missing > 0) {
      issues.push([
        'Missing Values',
        c.name,
        `${stats.missing} records`,
        stats.missingPercent > 10 ? 'High' : 'Medium',
        state.workflowHistory.some(w => w.action === 'cleaning') ? 'Resolved' : 'Detected',
      ]);
    }
  });

  if (duplicateRowCount > 0) {
    issues.push([
      'Duplicate Records',
      'Entire Row',
      `${duplicateRowCount} rows`,
      'Medium',
      state.workflowHistory.some(w => w.action === 'cleaning') ? 'Resolved' : 'Detected',
    ]);
  }

  if (issues.length === 0) {
    issues.push(['No Quality Deficiencies Found', 'All Columns', '0 records', 'Low', 'Passed']);
  }

  autoTable(doc, {
    startY: y,
    head: [['Issue Type', 'Affected Column / Scope', 'Records Affected', 'Severity', 'Resolution Status']],
    body: issues,
    styles: { fontSize: 8.5, cellPadding: 3 },
    headStyles: { fillColor: PRIMARY_BLUE },
    margin: { left: margin, right: margin },
  });

  // =========================================================================
  // PAGE 5 — DATA CLEANING & TRANSFORMATION LOG
  // =========================================================================
  doc.addPage();
  pageNum++;
  addPageHeaderFooter(pageNum, 'Cleaning & Transformation');

  y = 20;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...DARK_SLATE);
  doc.text('Data Cleaning & Transformation Audit', margin, y);
  y += 8;

  const cleaningSteps = state.workflowHistory.filter(w => w.action.toLowerCase().includes('clean') || w.action.toLowerCase().includes('transform') || w.action.toLowerCase().includes('upload'));

  const stepRows = cleaningSteps.length > 0 ? cleaningSteps.map((step, idx) => [
    `Step ${idx + 1}`,
    step.action.toUpperCase(),
    step.description,
    step.affectedColumns.length > 0 ? step.affectedColumns.join(', ') : 'All Dataset',
    new Date(step.timestamp).toLocaleTimeString(),
  ]) : [
    ['Step 1', 'UPLOAD', `Uploaded dataset "${ds.originalFilename}"`, 'All Dataset', new Date().toLocaleTimeString()],
  ];

  autoTable(doc, {
    startY: y,
    head: [['Step', 'Action', 'Operation Description', 'Affected Columns', 'Timestamp']],
    body: stepRows,
    styles: { fontSize: 8.5, cellPadding: 3 },
    headStyles: { fillColor: PRIMARY_BLUE },
    margin: { left: margin, right: margin },
  });

  // =========================================================================
  // PAGE 6 — DESCRIPTIVE STATISTICS
  // =========================================================================
  doc.addPage();
  pageNum++;
  addPageHeaderFooter(pageNum, 'Descriptive Statistics');

  y = 20;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...DARK_SLATE);
  doc.text('Descriptive Statistics Summary', margin, y);
  y += 8;

  const numStatsRows: any[] = [];
  numericCols.slice(0, 15).forEach(cName => {
    const stats = computeNumericStats(rows, cName);
    if (stats) {
      numStatsRows.push([
        cName,
        stats.count.toString(),
        stats.mean.toFixed(2),
        stats.std.toFixed(2),
        stats.min.toFixed(2),
        stats.q25.toFixed(2),
        stats.median.toFixed(2),
        stats.q75.toFixed(2),
        stats.max.toFixed(2),
      ]);
    }
  });

  if (numStatsRows.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['Numerical Variable', 'Count', 'Mean', 'Std Dev', 'Min', '25%', '50%', '75%', 'Max']],
      body: numStatsRows,
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: PRIMARY_BLUE },
      margin: { left: margin, right: margin },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // =========================================================================
  // PAGE 7 — VISUALIZATION SNAPSHOT
  // =========================================================================
  if (chartImageBase64) {
    doc.addPage();
    pageNum++;
    addPageHeaderFooter(pageNum, 'Visualizations');

    y = 20;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...DARK_SLATE);
    doc.text('Visualization & Data Distribution Chart', margin, y);
    y += 8;

    try {
      const imgW = contentW;
      const imgH = imgW * 0.55;
      doc.addImage(chartImageBase64, 'PNG', margin, y, imgW, imgH);
      y += imgH + 10;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...TEXT_MUTED);
      doc.text('Key Observation: The above visualization represents active dataset variable relationships and distribution profiles captured from the DataInsight Pro workspace.', margin, y, { maxWidth: contentW });
    } catch {
      // skip image if failed
    }
  }

  // =========================================================================
  // PAGE 8 — CORRELATIONS & RELATIONSHIPS
  // =========================================================================
  if (numericCols.length >= 2) {
    doc.addPage();
    pageNum++;
    addPageHeaderFooter(pageNum, 'Correlations');

    y = 20;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...DARK_SLATE);
    doc.text('Relationships & Statistical Correlations', margin, y);
    y += 8;

    const corrRows = correlations.slice(0, 12).map(c => [
      c.varA,
      c.varB,
      c.r.toFixed(3),
      c.direction,
      c.strength,
    ]);

    autoTable(doc, {
      startY: y,
      head: [['Variable A', 'Variable B', 'Correlation (r)', 'Direction', 'Strength']],
      body: corrRows,
      styles: { fontSize: 8.5, cellPadding: 3 },
      headStyles: { fillColor: PRIMARY_BLUE },
      margin: { left: margin, right: margin },
    });
    y = (doc as any).lastAutoTable.finalY + 8;

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(...TEXT_MUTED);
    doc.text('Note: Correlation coefficients quantify mathematical association, not direct causation between variables.', margin, y);
  }

  // =========================================================================
  // PAGE 9 — AI INSIGHTS
  // =========================================================================
  if (state.insights.length > 0) {
    doc.addPage();
    pageNum++;
    addPageHeaderFooter(pageNum, 'AI Insights');

    y = 20;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...DARK_SLATE);
    doc.text('AI Data Insights & Diagnostics', margin, y);
    y += 8;

    const insightRows = state.insights.slice(0, 10).map(item => [
      item.insight,
      item.explanation,
      item.affectedColumns.join(', ') || 'Dataset',
      `${Math.round(item.confidenceScore * 100)}%`,
    ]);

    autoTable(doc, {
      startY: y,
      head: [['Insight Title', 'Detailed Explanation', 'Relevant Variables', 'Confidence']],
      body: insightRows,
      styles: { fontSize: 8.5, cellPadding: 3 },
      headStyles: { fillColor: PRIMARY_BLUE },
      columnStyles: { 0: { fontStyle: 'bold', width: 45 }, 1: { width: 85 }, 2: { width: 30 }, 3: { width: 20 } },
      margin: { left: margin, right: margin },
    });
  }

  // =========================================================================
  // PAGE 10 — MACHINE LEARNING OVERVIEW
  // =========================================================================
  if (state.mlResults.length > 0) {
    doc.addPage();
    pageNum++;
    addPageHeaderFooter(pageNum, 'Machine Learning');

    y = 20;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...DARK_SLATE);
    doc.text('Machine Learning Models & Segmentation', margin, y);
    y += 8;

    const mlRows = state.mlResults.map(r => [
      r.type.toUpperCase(),
      r.title,
      r.description,
      r.accuracy ? `${(r.accuracy * 100).toFixed(1)}%` : 'Trained',
      r.dateCreated,
    ]);

    autoTable(doc, {
      startY: y,
      head: [['Algorithm Type', 'Model Title', 'Model Description', 'Performance Metric', 'Trained Date']],
      body: mlRows,
      styles: { fontSize: 8.5, cellPadding: 3 },
      headStyles: { fillColor: GREEN_STATUS },
      margin: { left: margin, right: margin },
    });
  }

  // =========================================================================
  // PAGE 11 — ACTIONABLE RECOMMENDATIONS
  // =========================================================================
  doc.addPage();
  pageNum++;
  addPageHeaderFooter(pageNum, 'Recommendations');

  y = 20;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...DARK_SLATE);
  doc.text('Actionable Recommendations & Next Steps', margin, y);
  y += 8;

  const recommendations: any[] = [];

  if (missingPercent > 0) {
    recommendations.push([
      'Automate Missing Data Imputation',
      `Found ${totalMissingCells.toLocaleString()} missing values. Apply mean/median imputation before downstream reporting.`,
      'Data Quality Assessment',
      'High',
    ]);
  }

  if (duplicateRowCount > 0) {
    recommendations.push([
      'Deduplicate Record Database',
      `Detected ${duplicateRowCount} exact duplicate rows. Deduplicate records to eliminate statistical bias.`,
      'Data Quality Assessment',
      'Medium',
    ]);
  }

  if (correlations.length > 0) {
    const top = correlations[0];
    recommendations.push([
      `Leverage Strong Relationship: ${top.varA} & ${top.varB}`,
      `Utilize the ${top.strength.toLowerCase()} correlation (r = ${top.r.toFixed(2)}) for predictive modeling.`,
      'Correlation Analysis',
      'High',
    ]);
  }

  if (recommendations.length === 0) {
    recommendations.push([
      'Maintain Data Integrity Standards',
      'The dataset exhibits clean properties. Additional domain context required for strategic recommendations.',
      'Dataset Audit',
      'Low',
    ]);
  }

  autoTable(doc, {
    startY: y,
    head: [['Recommendation', 'Reasoning & Action Details', 'Supporting Finding', 'Priority']],
    body: recommendations,
    styles: { fontSize: 8.5, cellPadding: 3 },
    headStyles: { fillColor: PRIMARY_BLUE },
    columnStyles: { 0: { fontStyle: 'bold', width: 45 }, 1: { width: 85 }, 2: { width: 30 }, 3: { width: 20 } },
    margin: { left: margin, right: margin },
  });

  // =========================================================================
  // PAGE 12 — CLIENT DELIVERABLES & APPENDIX
  // =========================================================================
  doc.addPage();
  pageNum++;
  addPageHeaderFooter(pageNum, 'Deliverables & Appendix');

  y = 20;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...DARK_SLATE);
  doc.text('Client Deliverables & Technical Appendix', margin, y);
  y += 8;

  const deliverables = [
    [`${ds.name}_cleaned.csv`, 'CSV File', 'Cleaned tabular dataset export', 'Ready for Download'],
    [`${ds.name}_cleaned.xlsx`, 'Excel Sheet', 'Formatted Excel spreadsheet workbook', 'Ready for Download'],
    [`${ds.name}_pipeline.py`, 'Python Script', 'Reproducible Pandas data transformation code', 'Generated'],
    [`${ds.name}_report.pdf`, 'PDF Report', 'Comprehensive executive data analysis document', 'Delivered'],
  ];

  autoTable(doc, {
    startY: y,
    head: [['Filename', 'Format', 'Deliverable Description', 'Status']],
    body: deliverables,
    styles: { fontSize: 8.5, cellPadding: 3 },
    headStyles: { fillColor: PRIMARY_BLUE },
    margin: { left: margin, right: margin },
  });
  y = (doc as any).lastAutoTable.finalY + 12;

  // Analytical Limitations Statement
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...DARK_SLATE);
  doc.text('Analytical Limitations Statement', margin, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...TEXT_MUTED);
  const limitations = [
    '• Analytical outputs depend strictly on the mathematical integrity of source data.',
    '• Statistical correlation identifies mathematical association and does not imply direct causation.',
    '• Machine learning segmentation and AI insights should be evaluated within domain business context.',
  ];
  limitations.forEach(l => {
    doc.text(l, margin, y);
    y += 5;
  });

  // Stamp Page Numbers across all generated pages
  const totalPages = (doc.internal as any).getNumberOfPages?.() ?? pageNum;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addPageHeaderFooter(i, '');
  }

  // Download PDF
  const safeName = (state.projectName || 'DataInsight').replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`${safeName}_analysis_report.pdf`);
}
