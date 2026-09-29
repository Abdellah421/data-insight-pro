import React, { useState } from 'react';
import { Check, CheckCircle, Filter, Sparkles as WandSparkles } from 'lucide-react';
import DataTable from '../components/DataTable';
import { CleaningOptions, Dataset } from '../types';
import { useProject } from '../context/ProjectContext';
import { useToast } from '../context/ToastContext';

interface DataCleaningProps {
  dataset: Dataset;
  onDatasetUpdate: (dataset: Dataset) => void;
}

const DataCleaning: React.FC<DataCleaningProps> = ({ dataset, onDatasetUpdate }) => {
  const { dispatch } = useProject();
  const { showToast } = useToast();
  const [cleaningOptions, setCleaningOptions] = useState<CleaningOptions>({
    removeNulls: false,
    removeOutliers: false,
    removeEmptyRows: false,
    removeEmptyColumns: false,
    removeDuplicates: false,
    trimWhitespace: false,
    fixDataTypes: false,
    capitalizeHeaders: false,
  });
  
  const [previewCleaned, setPreviewCleaned] = useState(false);
  const [cleanedStats, setCleanedStats] = useState<{
    rowsRemoved: number;
    columnsRemoved: string[];
    nullsFixed: number;
    outlierCount: number;
    duplicatesRemoved: number;
  } | null>(null);
  
  // Preview of cleaned data
  const cleanedData = React.useMemo(() => {
    if (!previewCleaned) return null;
    
    let modifiedRows = [...dataset.rows];
    let modifiedColumns = [...dataset.columns];
    let stats = {
      rowsRemoved: 0,
      columnsRemoved: [] as string[],
      nullsFixed: 0,
      outlierCount: 0,
      duplicatesRemoved: 0,
    };
    
    // Remove empty rows
    if (cleaningOptions.removeEmptyRows) {
      const initialRowCount = modifiedRows.length;
      modifiedRows = modifiedRows.filter(row => {
        const values = Object.values(row);
        const isEmpty = values.every(v => v === null || v === undefined || v === '');
        return !isEmpty;
      });
      stats.rowsRemoved += (initialRowCount - modifiedRows.length);
    }
    
    // Remove empty columns
    if (cleaningOptions.removeEmptyColumns) {
      const columnsToRemove: string[] = [];
      
      modifiedColumns.forEach(column => {
        const isEmpty = modifiedRows.every(row => 
          row[column.name] === null || 
          row[column.name] === undefined || 
          row[column.name] === ''
        );
        
        if (isEmpty) {
          columnsToRemove.push(column.name);
        }
      });
      
      modifiedColumns = modifiedColumns.filter(
        column => !columnsToRemove.includes(column.name)
      );
      
      if (columnsToRemove.length > 0) {
        modifiedRows = modifiedRows.map(row => {
          const newRow = { ...row };
          columnsToRemove.forEach(colName => {
            delete newRow[colName];
          });
          return newRow;
        });
      }
      
      stats.columnsRemoved = columnsToRemove;
    }
    
    // Remove duplicate rows
    if (cleaningOptions.removeDuplicates) {
      const initialRowCount = modifiedRows.length;
      const uniqueRows = new Map();
      
      modifiedRows.forEach(row => {
        const key = Object.values(row).join('|');
        uniqueRows.set(key, row);
      });
      
      modifiedRows = Array.from(uniqueRows.values());
      stats.duplicatesRemoved = initialRowCount - modifiedRows.length;
    }
    
    // Fix data types
    if (cleaningOptions.fixDataTypes) {
      modifiedColumns.forEach(column => {
        if (column.type === 'number') {
          modifiedRows.forEach(row => {
            const value = row[column.name];
            if (typeof value === 'string' && !isNaN(Number(value))) {
              row[column.name] = Number(value);
              stats.nullsFixed++;
            }
          });
        }
      });
    }
    
    // Trim whitespace in string values
    if (cleaningOptions.trimWhitespace) {
      modifiedRows = modifiedRows.map(row => {
        const newRow = { ...row };
        Object.keys(newRow).forEach(key => {
          if (typeof newRow[key] === 'string') {
            newRow[key] = newRow[key].trim();
          }
        });
        return newRow;
      });
    }
    
    // Handle null values
    if (cleaningOptions.removeNulls) {
      modifiedColumns.forEach(column => {
        if (column.type === 'number') {
          const values = modifiedRows
            .map(row => row[column.name])
            .filter(val => val !== null && val !== undefined && val !== '');
          
          if (values.length > 0) {
            const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
            
            modifiedRows.forEach(row => {
              if (row[column.name] === null || row[column.name] === undefined || row[column.name] === '') {
                row[column.name] = mean;
                stats.nullsFixed++;
              }
            });
          }
        } else if (column.type === 'string') {
          modifiedRows.forEach(row => {
            if (row[column.name] === null || row[column.name] === undefined) {
              row[column.name] = '';
              stats.nullsFixed++;
            }
          });
        }
      });
    }
    
    // Handle outliers
    if (cleaningOptions.removeOutliers) {
      modifiedColumns.forEach(column => {
        if (column.type === 'number') {
          const values = modifiedRows
            .map(row => row[column.name])
            .filter(val => val !== null && val !== undefined && val !== '');
          
          if (values.length > 0) {
            const sortedValues = [...values].sort((a, b) => a - b);
            const q1Index = Math.floor(sortedValues.length * 0.25);
            const q3Index = Math.floor(sortedValues.length * 0.75);
            
            const q1 = sortedValues[q1Index];
            const q3 = sortedValues[q3Index];
            const iqr = q3 - q1;
            
            const lowerBound = q1 - 1.5 * iqr;
            const upperBound = q3 + 1.5 * iqr;
            
            modifiedRows.forEach(row => {
              const value = row[column.name];
              if (typeof value === 'number') {
                if (value < lowerBound) {
                  row[column.name] = lowerBound;
                  stats.outlierCount++;
                } else if (value > upperBound) {
                  row[column.name] = upperBound;
                  stats.outlierCount++;
                }
              }
            });
          }
        }
      });
    }
    
    // Capitalize headers if needed
    if (cleaningOptions.capitalizeHeaders) {
      modifiedColumns = modifiedColumns.map(column => {
        const capitalizedName = column.name
          .toLowerCase()
          .replace(/(?:^|\s|_|-)\S/g, match => match.toUpperCase())
          .replace(/[_-]/g, ' ');
        
        if (capitalizedName !== column.name) {
          modifiedRows.forEach(row => {
            row[capitalizedName] = row[column.name];
            delete row[column.name];
          });
          
          return { ...column, name: capitalizedName };
        }
        
        return column;
      });
    }
    
    setCleanedStats(stats);
    
    return {
      rows: modifiedRows,
      columns: modifiedColumns,
    };
  }, [dataset, cleaningOptions, previewCleaned]);
  
  const handleApplyCleaningOptions = () => {
    if (!cleanedData) {
      setPreviewCleaned(true);
      return;
    }
    
    const updatedDataset: Dataset = {
      ...dataset,
      rows: cleanedData.rows,
      columns: cleanedData.columns,
      dateModified: new Date(),
    };
    
    onDatasetUpdate(updatedDataset);

    const activeOptions = Object.entries(cleaningOptions)
      .filter(([, v]) => v)
      .map(([k]) => k);
    dispatch({
      type: 'LOG_WORKFLOW_STEP',
      payload: {
        action: 'cleaning',
        description: `Applied cleaning: ${activeOptions.join(', ')}`,
        parameters: { options: cleaningOptions, stats: cleanedStats },
        affectedColumns: cleanedStats?.columnsRemoved ?? [],
        datasetSnapshot: updatedDataset,
      },
    });
    showToast('Data cleaning applied successfully!', 'success');
    setPreviewCleaned(false);
    setCleanedStats(null);
  };
  
  const handleReset = () => {
    setPreviewCleaned(false);
    setCleanedStats(null);
  };
  
  const toggleOption = (option: keyof CleaningOptions) => {
    setCleaningOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
    
    if (previewCleaned) {
      setPreviewCleaned(false);
    }
  };

  return (
    <div className="space-y-6 w-full max-w-full">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Data Cleaning</h2>
        <p className="text-xs sm:text-sm text-gray-600">
          Select options to clean and prepare your dataset records
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Cleaning Options Column */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-base font-bold text-gray-800">Cleaning Options</h3>
            </div>
            
            <div className="p-4 sm:p-6 space-y-4">
              <p className="text-xs text-gray-500">
                Select the data cleaning operations to apply:
              </p>
              
              <div className="space-y-2.5">
                <label className="flex items-center p-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors min-h-[44px]">
                  <input
                    type="checkbox"
                    checked={cleaningOptions.removeNulls}
                    onChange={() => toggleOption('removeNulls')}
                    className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 mr-3"
                  />
                  <span className="text-xs sm:text-sm font-medium text-gray-700">Fill missing values</span>
                </label>
                
                <label className="flex items-center p-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors min-h-[44px]">
                  <input
                    type="checkbox"
                    checked={cleaningOptions.removeOutliers}
                    onChange={() => toggleOption('removeOutliers')}
                    className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 mr-3"
                  />
                  <span className="text-xs sm:text-sm font-medium text-gray-700">Handle outliers (IQR)</span>
                </label>
                
                <label className="flex items-center p-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors min-h-[44px]">
                  <input
                    type="checkbox"
                    checked={cleaningOptions.removeEmptyRows}
                    onChange={() => toggleOption('removeEmptyRows')}
                    className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 mr-3"
                  />
                  <span className="text-xs sm:text-sm font-medium text-gray-700">Remove empty rows</span>
                </label>
                
                <label className="flex items-center p-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors min-h-[44px]">
                  <input
                    type="checkbox"
                    checked={cleaningOptions.removeEmptyColumns}
                    onChange={() => toggleOption('removeEmptyColumns')}
                    className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 mr-3"
                  />
                  <span className="text-xs sm:text-sm font-medium text-gray-700">Remove empty columns</span>
                </label>
                
                <label className="flex items-center p-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors min-h-[44px]">
                  <input
                    type="checkbox"
                    checked={cleaningOptions.removeDuplicates}
                    onChange={() => toggleOption('removeDuplicates')}
                    className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 mr-3"
                  />
                  <span className="text-xs sm:text-sm font-medium text-gray-700">Remove duplicate rows</span>
                </label>
                
                <label className="flex items-center p-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors min-h-[44px]">
                  <input
                    type="checkbox"
                    checked={cleaningOptions.trimWhitespace}
                    onChange={() => toggleOption('trimWhitespace')}
                    className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 mr-3"
                  />
                  <span className="text-xs sm:text-sm font-medium text-gray-700">Trim whitespace</span>
                </label>
                
                <label className="flex items-center p-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors min-h-[44px]">
                  <input
                    type="checkbox"
                    checked={cleaningOptions.fixDataTypes}
                    onChange={() => toggleOption('fixDataTypes')}
                    className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 mr-3"
                  />
                  <span className="text-xs sm:text-sm font-medium text-gray-700">Fix data types</span>
                </label>
                
                <label className="flex items-center p-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors min-h-[44px]">
                  <input
                    type="checkbox"
                    checked={cleaningOptions.capitalizeHeaders}
                    onChange={() => toggleOption('capitalizeHeaders')}
                    className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 mr-3"
                  />
                  <span className="text-xs sm:text-sm font-medium text-gray-700">Clean column names</span>
                </label>
              </div>
              
              <div className="pt-3 flex flex-col sm:flex-row items-stretch gap-2">
                {!previewCleaned ? (
                  <button
                    onClick={() => setPreviewCleaned(true)}
                    disabled={!Object.values(cleaningOptions).some(Boolean)}
                    className={`w-full flex items-center justify-center px-4 py-3 rounded-lg text-xs font-semibold shadow-2xs transition-colors min-h-[44px] ${
                      !Object.values(cleaningOptions).some(Boolean)
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    <Filter size={16} className="mr-2" />
                    Preview Changes
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleApplyCleaningOptions}
                      className="flex-1 flex items-center justify-center px-4 py-3 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition min-h-[44px]"
                    >
                      <Check size={16} className="mr-1.5" />
                      Apply
                    </button>
                    <button
                      onClick={handleReset}
                      className="flex-1 flex items-center justify-center px-4 py-3 bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-300 transition min-h-[44px]"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {cleanedStats && (
            <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
              <div className="px-4 sm:px-6 py-3.5 border-b border-gray-200 bg-blue-50">
                <h3 className="text-sm font-bold text-blue-800">Cleaning Summary</h3>
              </div>
              <div className="p-4 sm:p-6">
                <ul className="space-y-2.5 text-xs text-gray-700">
                  {cleanedStats.rowsRemoved > 0 && (
                    <li className="flex items-start">
                      <CheckCircle size={16} className="text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Removed {cleanedStats.rowsRemoved} empty rows</span>
                    </li>
                  )}
                  
                  {cleanedStats.columnsRemoved.length > 0 && (
                    <li className="flex items-start">
                      <CheckCircle size={16} className="text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span>
                        Removed {cleanedStats.columnsRemoved.length} empty columns: 
                        <span className="font-semibold"> {cleanedStats.columnsRemoved.join(', ')}</span>
                      </span>
                    </li>
                  )}
                  
                  {cleanedStats.nullsFixed > 0 && (
                    <li className="flex items-start">
                      <CheckCircle size={16} className="text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Fixed {cleanedStats.nullsFixed} missing values</span>
                    </li>
                  )}
                  
                  {cleanedStats.outlierCount > 0 && (
                    <li className="flex items-start">
                      <CheckCircle size={16} className="text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Adjusted {cleanedStats.outlierCount} outliers</span>
                    </li>
                  )}
                  
                  {cleanedStats.duplicatesRemoved > 0 && (
                    <li className="flex items-start">
                      <CheckCircle size={16} className="text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Removed {cleanedStats.duplicatesRemoved} duplicate rows</span>
                    </li>
                  )}
                  
                  {cleaningOptions.trimWhitespace && (
                    <li className="flex items-start">
                      <CheckCircle size={16} className="text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Trimmed whitespace in string values</span>
                    </li>
                  )}
                  
                  {cleaningOptions.fixDataTypes && (
                    <li className="flex items-start">
                      <CheckCircle size={16} className="text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Fixed data types where possible</span>
                    </li>
                  )}
                  
                  {cleaningOptions.capitalizeHeaders && (
                    <li className="flex items-start">
                      <CheckCircle size={16} className="text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Cleaned column names</span>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          )}
        </div>
        
        {/* Preview Data Column */}
        <div className="lg:col-span-2 space-y-6 min-w-0">
          <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-bold text-gray-800">
                {previewCleaned ? 'Preview of Cleaned Dataset' : 'Current Dataset Table'}
              </h3>
            </div>
            
            <div className="p-3 sm:p-4">
              {previewCleaned && cleanedData ? (
                <DataTable 
                  data={cleanedData.rows} 
                  columns={cleanedData.columns.map(col => col.name)} 
                />
              ) : (
                <DataTable 
                  data={dataset.rows} 
                  columns={dataset.columns.map(col => col.name)} 
                />
              )}
            </div>
          </div>
          
          {!previewCleaned && (
            <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-4 sm:p-6">
              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600 flex-shrink-0">
                  <WandSparkles size={22} />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-gray-800">Data Cleaning Guidelines</h4>
                  <ul className="mt-2 space-y-2 text-xs sm:text-sm text-gray-600">
                    <li>• <strong>Missing Values:</strong> Replaces missing numbers with the column mean, and text with empty strings.</li>
                    <li>• <strong>Outliers:</strong> Caps extreme values outside 1.5 × IQR boundary range.</li>
                    <li>• <strong>Data Types:</strong> Auto-converts string numbers into true numeric values.</li>
                    <li>• <strong>Column Headers:</strong> Formats headers into title case and cleans underscores.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataCleaning;