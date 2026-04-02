import React, { useState } from 'react';
import { FileText, Database, Upload, AlertCircle, FileCode } from 'lucide-react';
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
    <div className="space-y-12 py-6">
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <h2 className="text-4xl font-extrabold text-white tracking-tight">Upload Your <span className="text-accent-blue">Dataset</span></h2>
        <p className="text-lg text-gray-400">
          Transform your raw data into actionable insights. Support for CSV, Excel, and JSON formats.
        </p>
      </div>
      
      <div className="max-w-2xl mx-auto glass-card p-8">
        <div className="space-y-6">
          <FileUploader
            onFileSelect={handleFileSelect}
            acceptedFileTypes={acceptedFileTypes}
          />
          
          {file && (
            <div className="flex items-center p-5 bg-white/5 border border-white/5 rounded-2xl">
              <div className="p-3 bg-accent-blue/10 rounded-xl mr-4">
                <FileText size={24} className="text-accent-blue" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-white">{file.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {(file.size / 1024).toFixed(2)} KB • {file.name.split('.').pop()?.toUpperCase()}
                </p>
              </div>
              <button
                onClick={() => setFile(null)}
                className="text-gray-500 hover:text-red-400 p-2 transition-colors"
              >
                Remove
              </button>
            </div>
          )}
          
          {error && (
            <div className="flex items-center p-4 bg-red-400/10 border border-red-400/20 text-red-400 rounded-xl">
              <AlertCircle size={20} className="mr-3 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}
          
          <button
            onClick={handleProcessFile}
            disabled={!file || loading}
            className="premium-btn w-full py-4 text-sm font-bold uppercase tracking-widest"
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
        <h3 className="text-xl font-bold text-white mb-6 text-center">Supported Formats</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-card p-6 border-white/5 border hover:border-accent-blue/30 transition-all">
            <div className="flex items-center mb-4">
              <div className="p-2.5 bg-accent-blue/10 rounded-xl text-accent-blue mr-4">
                <FileText size={22} />
              </div>
              <h4 className="font-bold text-white">CSV Data</h4>
            </div>
            <ul className="text-gray-400 text-sm space-y-2 leading-relaxed">
              <li>• Auto-header detection</li>
              <li>• Comma/Semicolon separator</li>
              <li>• UTF-8 optimized</li>
            </ul>
          </div>
          
          <div className="glass-card p-6 border-white/5 border hover:border-emerald-400/30 transition-all">
            <div className="flex items-center mb-4">
              <div className="p-2.5 bg-emerald-400/10 rounded-xl text-emerald-400 mr-4">
                <Database size={22} />
              </div>
              <h4 className="font-bold text-white">Excel Sheets</h4>
            </div>
            <ul className="text-gray-400 text-sm space-y-2 leading-relaxed">
              <li>• Full .xlsx / .xls support</li>
              <li>• First sheet auto-import</li>
              <li>• Formatting preserved</li>
            </ul>
          </div>
          
          <div className="glass-card p-6 border-white/5 border hover:border-amber-400/30 transition-all">
            <div className="flex items-center mb-4">
              <div className="p-2.5 bg-amber-400/10 rounded-xl text-amber-400 mr-4">
                <FileCode size={22} />
              </div>
              <h4 className="font-bold text-white">JSON Objects</h4>
            </div>
            <ul className="text-gray-400 text-sm space-y-2 leading-relaxed">
              <li>• Nested object parsing</li>
              <li>• Array of objects support</li>
              <li>• Dynamic schema mapping</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataUpload;