import Papa from 'papaparse';
import * as XLSX from 'xlsx';

/**
 * Parse CSV file into array of objects
 */
export const parseCSV = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true, // First row is header
      dynamicTyping: true, // Convert numbers and booleans
      skipEmptyLines: true,
      worker: true, // Offload to background web worker to prevent UI freezing
      complete: (results) => {
        if (results.errors.length > 0) {
          reject(new Error(`CSV parsing error: ${results.errors[0].message}`));
        } else {
          resolve(results.data);
        }
      },
      error: (error) => {
        reject(error);
      }
    });
  });
};

/**
 * Parse Excel file into array of objects
 */
export const parseExcel = async (file: File): Promise<any[]> => {
  try {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    
    // Get first sheet
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    // Convert to JSON
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
    
    // Check if data is an array
    if (!Array.isArray(data)) {
      throw new Error('JSON file must contain an array of objects');
    }
    
    return data;
  } catch (error) {
    throw new Error(`JSON parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};