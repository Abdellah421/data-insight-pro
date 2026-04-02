import React, { useState } from 'react';
import { FileText, Database, Upload, AlertCircle } from 'lucide-react';
import FileUploader from '../components/FileUploader';
import { Dataset } from '../types';
import { parseCSV, parseExcel, parseJSON } from '../utils/parsers';

interface DataUploadProps {
  onUploadSuccess: (dataset: Dataset) => void;
}

const DataUpload: React.FC<DataUploadProps> = ({ onUploadSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const acceptedFileTypes = {
    'text/csv': ['.csv'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    'application/vnd.ms-excel': ['.xls'],
    'application/json': ['.json'],
  };
  
  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
  };
  
  const determineFileType = (file: File): 'csv' | 'excel' | 'json' | 'unknown' => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    if (extension === 'csv') return 'csv';
    if (extension === 'xlsx' || extension === 'xls') return 'excel';
    if (extension === 'json') return 'json';
    
    return 'unknown';
  };

  const handleProcessFile = async () => {
    if (!file) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const fileType = determineFileType(file);
      let parsedData: any[] = [];
      
      switch (fileType) {
        case 'csv':
          parsedData = await parseCSV(file);
          break;
        case 'excel':
          parsedData = await parseExcel(file);
          break;
        case 'json':
          parsedData = await parseJSON(file);
          break;
        default:
          throw new Error('Unsupported file format');
      }
      
      if (parsedData.length === 0) {
        throw new Error('No data found in the file');
      }
      
      // Get column names and types
      const firstRow = parsedData[0];
      const columns = Object.keys(firstRow).map(name => {
        // Determine column type based on first non-null value
        let type: 'string' | 'number' | 'date' | 'boolean' | 'unknown' = 'unknown';
        let nullable = false;
        
        for (const row of parsedData) {
          const value = row[name];
          
          if (value === null || value === undefined || value === '') {
            nullable = true;
            continue;
          }
          
          if (typeof value === 'number') type = 'number';
          else if (typeof value === 'string') type = 'string';
          else if (typeof value === 'boolean') type = 'boolean';
          else if (value instanceof Date) type = 'date';
          
          if (type !== 'unknown') break;
        }
        
        return { name, type, nullable };
      });
      
      // Create dataset
      const dataset: Dataset = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name.split('.')[0],
        rows: parsedData,
        columns,
        originalFormat: fileType,
        dateCreated: new Date(),
        dateModified: new Date(),
        originalFilename: file.name,
      };
      
      onUploadSuccess(dataset);
    } catch (err) {
      console.error('Error processing file:', err);
      setError(err instanceof Error ? err.message : 'Failed to process file');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800">Upload Your Data</h2>
        <p className="text-gray-600">
          Upload a data file to start analyzing. Support for CSV, Excel, and JSON formats.
        </p>
      </div>
      
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm p-6">
        <div className="space-y-6">
          <FileUploader
            onFileSelect={handleFileSelect}
            acceptedFileTypes={acceptedFileTypes}
          />
          
          {file && (
            <div className="flex items-center p-4 bg-blue-50 rounded-lg">
              <FileText size={24} className="text-blue-600 mr-4" />
              <div className="flex-1">
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-gray-600">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
              </div>
              <button
                onClick={() => setFile(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                Remove
              </button>
            </div>
          )}
          
          {error && (
            <div className="flex items-center p-4 bg-red-50 text-red-700 rounded-lg">
              <AlertCircle size={20} className="mr-2 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}
          
          <button
            onClick={handleProcessFile}
            disabled={!file || loading}
            className={`w-full flex items-center justify-center py-3 px-4 rounded-lg font-medium transition-colors ${
              !file || loading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              <>
                <Upload size={20} className="mr-2" />
                Process File
              </>
            )}
          </button>
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto">
        <h3 className="text-lg font-medium text-gray-800 mb-4">File Format Guidelines</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-lg shadow-sm">
            <div className="flex items-center mb-3">
              <div className="p-2 bg-blue-100 rounded-full text-blue-600 mr-3">
                <FileText size={20} />
              </div>
              <h4 className="font-medium">CSV Files</h4>
            </div>
            <ul className="text-gray-600 text-sm space-y-2">
              <li>• First row should contain column headers</li>
              <li>• Comma-separated values</li>
              <li>• UTF-8 encoding recommended</li>
            </ul>
          </div>
          
          <div className="bg-white p-5 rounded-lg shadow-sm">
            <div className="flex items-center mb-3">
              <div className="p-2 bg-green-100 rounded-full text-green-600 mr-3">
                <Database size={20} />
              </div>
              <h4 className="font-medium">Excel Files</h4>
            </div>
            <ul className="text-gray-600 text-sm space-y-2">
              <li>• First row should contain column headers</li>
              <li>• First sheet will be imported</li>
              <li>• .xlsx and .xls formats supported</li>
            </ul>
          </div>
          
          <div className="bg-white p-5 rounded-lg shadow-sm">
            <div className="flex items-center mb-3">
              <div className="p-2 bg-amber-100 rounded-full text-amber-600 mr-3">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M21 3H3V21H21V3ZM12.5 5C13.17 5 13.72 5.5 13.94 6.15L17 13.31V19H7V13.31L10.06 6.15C10.28 5.5 10.83 5 11.5 5H12.5ZM12 14.5L14.5 8H9.5L12 14.5Z" />
                </svg>
              </div>
              <h4 className="font-medium">JSON Files</h4>
            </div>
            <ul className="text-gray-600 text-sm space-y-2">
              <li>• Array of objects format</li>
              <li>• Each object represents a row</li>
              <li>• Consistent schema recommended</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataUpload;