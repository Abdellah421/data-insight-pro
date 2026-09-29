import Papa from 'papaparse';
import * as XLSX from 'xlsx';

/**
 * Parse CSV file into array of objects with cross-browser Web Worker fallback for Edge/Safari
 */
export const parseCSV = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    // Primary attempt: try background worker for speed
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      worker: true,
      complete: (results) => {
        if (results.errors && results.errors.length > 0 && (!results.data || results.data.length === 0)) {
          reject(new Error(`CSV parsing error: ${results.errors[0].message}`));
        } else {
          resolve(results.data);
        }
      },
      error: () => {
        // Fallback: If Web Worker instantiation fails (e.g. Edge blob URL restrictions), retry synchronously
        Papa.parse(file, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          worker: false,
          complete: (syncResults) => {
            if (syncResults.errors && syncResults.errors.length > 0 && (!syncResults.data || syncResults.data.length === 0)) {
              reject(new Error(`CSV parsing error: ${syncResults.errors[0].message}`));
            } else {
              resolve(syncResults.data);
            }
          },
          error: (syncErr) => {
            reject(syncErr);
          },
        });
      },
    });
  });
};

/**
 * Parse Excel file into array of objects with explicit ArrayBuffer type hint for Edge/Firefox
 */
export const parseExcel = async (file: File): Promise<any[]> => {
  try {
    const data = await file.arrayBuffer();
    // Explicitly set type: 'array' so SheetJS accurately parses ArrayBuffer across all browsers
    const workbook = XLSX.read(data, { type: 'array' });

    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      throw new Error('Excel file contains no readable sheets');
    }

    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false });

    return jsonData;
  } catch (error) {
    throw new Error(`Excel parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Parse JSON file into array of objects
 */
export const parseJSON = async (file: File): Promise<any[]> => {
  try {
    const text = await file.text();
    const data = JSON.parse(text);

    if (!Array.isArray(data)) {
      throw new Error('JSON file must contain an array of objects');
    }

    return data;
  } catch (error) {
    throw new Error(`JSON parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};