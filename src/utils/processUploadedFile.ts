import { Dataset, DatasetColumn } from '../types';
import { parseCSV, parseExcel, parseJSON } from './parsers';

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export type SupportedUploadFormat = 'csv' | 'excel' | 'json';

export function determineFileType(file: File): SupportedUploadFormat | 'unknown' {
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (extension === 'csv') return 'csv';
  if (extension === 'xlsx' || extension === 'xls') return 'excel';
  if (extension === 'json') return 'json';
  return 'unknown';
}

export function inferColumns(rows: Record<string, unknown>[]): DatasetColumn[] {
  const firstRow = rows[0];
  if (!firstRow) return [];

  return Object.keys(firstRow).map((name) => {
    let type: DatasetColumn['type'] = 'unknown';
    let nullable = false;

    for (const row of rows) {
      const value = row[name];

      if (value === null || value === undefined || value === '') {
        nullable = true;
        continue;
      }

      if (typeof value === 'number') type = 'number';
      else if (typeof value === 'boolean') type = 'boolean';
      else if (value instanceof Date) type = 'date';
      else if (typeof value === 'string') type = 'string';

      if (type !== 'unknown') break;
    }

    return { name, type, nullable };
  });
}

export function friendlyUploadError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error || '');
  const lower = raw.toLowerCase();

  if (
    raw === 'UNSUPPORTED_FORMAT' ||
    lower.includes('unsupported file format') ||
    lower.includes('file-invalid-type') ||
    lower.includes('invalid file type')
  ) {
    return 'Unsupported file format. Please upload CSV, Excel or JSON.';
  }

  if (raw === 'EMPTY_FILE' || lower.includes('empty') || lower.includes('no data found') || lower.includes('no readable sheets')) {
    return 'The file appears to be empty. Please choose another file.';
  }

  if (raw === 'FILE_TOO_LARGE' || lower.includes('too large') || lower.includes('file-too-large')) {
    return 'The file is too large for browser processing. Please try a smaller file.';
  }

  if (raw === 'INVALID_JSON_SHAPE') {
    return 'This JSON file must contain an array of objects, with each object representing a row.';
  }

  if (raw === 'INVALID_CSV' || lower.includes('csv')) {
    return "We couldn't read this file. Please check that it is a valid CSV file.";
  }

  if (raw === 'INVALID_EXCEL' || lower.includes('excel') || lower.includes('sheet')) {
    return "We couldn't read this file. Please check that it is a valid Excel file.";
  }

  if (raw === 'INVALID_JSON' || lower.includes('json')) {
    return "We couldn't read this file. Please check that it is a valid JSON file.";
  }

  return "We couldn't read this file. Please check that it is a valid CSV, Excel or JSON file.";
}

export async function processUploadedFile(file: File): Promise<Dataset> {
  if (!file || file.size === 0) {
    throw new Error('EMPTY_FILE');
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error('FILE_TOO_LARGE');
  }

  const fileType = determineFileType(file);
  if (fileType === 'unknown') {
    throw new Error('UNSUPPORTED_FORMAT');
  }

  let parsedData: Record<string, unknown>[] = [];

  try {
    if (fileType === 'csv') {
      parsedData = await parseCSV(file);
    } else if (fileType === 'excel') {
      parsedData = await parseExcel(file);
    } else {
      parsedData = await parseJSON(file);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message === 'INVALID_JSON_SHAPE' || message === 'EMPTY_FILE' || message.startsWith('INVALID_')) {
      throw error;
    }
    if (fileType === 'csv') throw new Error('INVALID_CSV');
    if (fileType === 'excel') throw new Error('INVALID_EXCEL');
    throw new Error('INVALID_JSON');
  }

  const rows = (parsedData || []).filter((row) => row && typeof row === 'object' && Object.keys(row).length > 0);
  if (rows.length === 0) {
    throw new Error('EMPTY_FILE');
  }

  return {
    id: Math.random().toString(36).substr(2, 9),
    name: file.name.replace(/\.[^.]+$/, '') || 'dataset',
    rows,
    columns: inferColumns(rows),
    originalFormat: fileType,
    dateCreated: new Date(),
    dateModified: new Date(),
    originalFilename: file.name,
  };
}
