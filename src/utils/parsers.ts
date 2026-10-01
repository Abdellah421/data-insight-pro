import Papa from 'papaparse';

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
          reject(new Error('INVALID_CSV'));
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
              reject(new Error('INVALID_CSV'));
            } else {
              resolve(syncResults.data);
            }
          },
          error: () => {
            reject(new Error('INVALID_CSV'));
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
    const XLSX = await import('xlsx');
    const data = await file.arrayBuffer();
    // Explicitly set type: 'array' so SheetJS accurately parses ArrayBuffer across all browsers
    const workbook = XLSX.read(data, { type: 'array' });

    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      throw new Error('EMPTY_FILE');
    }

    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false });

    return jsonData;
  } catch (error) {
    if (error instanceof Error && error.message === 'EMPTY_FILE') {
      throw error;
    }
    throw new Error('INVALID_EXCEL');
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
      throw new Error('INVALID_JSON_SHAPE');
    }

    return data;
  } catch (error) {
    if (error instanceof Error && error.message === 'INVALID_JSON_SHAPE') {
      throw error;
    }
    throw new Error('INVALID_JSON');
  }
};