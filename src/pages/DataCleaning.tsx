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
      
      // Filter out empty columns
      modifiedColumns = modifiedColumns.filter(
        column => !columnsToRemove.includes(column.name)
      );
      
      // Remove these columns from all rows
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
        // Create a string key from all values
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
        // For numeric columns, replace nulls with mean value
        if (column.type === 'number') {
          // Calculate mean of non-null values
          const values = modifiedRows
            .map(row => row[column.name])
            .filter(val => val !== null && val !== undefined && val !== '');
          
          if (values.length > 0) {
            const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
            
            // Replace nulls with mean
            modifiedRows.forEach(row => {
              if (row[column.name] === null || row[column.name] === undefined || row[column.name] === '') {
                row[column.name] = mean;
                stats.nullsFixed++;
              }
            });
          }
        } else if (column.type === 'string') {
          // For string columns, replace nulls with empty string
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
          // Calculate quartiles and IQR
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
            
            // Replace outliers with boundary values
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
        // Create a capitalized version of the column name
        const capitalizedName = column.name
          .toLowerCase()
          .replace(/(?:^|\s|_|-)\S/g, match => match.toUpperCase())
          .replace(/[_-]/g, ' ');
        
        // If name has changed, update all rows
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
    
    // Update the dataset with cleaned data
    const updatedDataset: Dataset = {
      ...dataset,
      rows: cleanedData.rows,
      columns: cleanedData.columns,
      dateModified: new Date(),
    };
    
    onDatasetUpdate(updatedDataset);

    // Log action to project history
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
  
  // Toggle a cleaning option
  const toggleOption = (option: keyof CleaningOptions) => {
    setCleaningOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
    
    // If preview was active, update it
    if (previewCleaned) {
      setPreviewCleaned(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Data Cleaning</h2>
        <p className="text-gray-600">
          Select options to clean and prepare your data
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div>
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-800">Cleaning Options</h3>
            </div>
            
            <div className="px-6 py-4 space-y-4">
              <p className="text-sm text-gray-600">
                Select the cleaning operations to apply to your dataset:
              </p>
              
              <div className="space-y-3">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={cleaningOptions.removeNulls}
                    onChange={() => toggleOption('removeNulls')}
                    className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <span className="text-gray-700">Fill missing values</span>
                </label>
                
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={cleaningOptions.removeOutliers}
                    onChange={() => toggleOption('removeOutliers')}
                    className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <span className="text-gray-700">Handle outliers</span>
                </label>
                
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={cleaningOptions.removeEmptyRows}
                    onChange={() => toggleOption('removeEmptyRows')}
                    className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <span className="text-gray-700">Remove empty rows</span>
                </label>
                
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={cleaningOptions.removeEmptyColumns}
                    onChange={() => toggleOption('removeEmptyColumns')}
                    className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <span className="text-gray-700">Remove empty columns</span>
                </label>
                
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={cleaningOptions.removeDuplicates}
                    onChange={() => toggleOption('removeDuplicates')}
                    className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <span className="text-gray-700">Remove duplicate rows</span>
                </label>
                
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={cleaningOptions.trimWhitespace}
                    onChange={() => toggleOption('trimWhitespace')}
                    className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <span className="text-gray-700">Trim whitespace</span>
                </label>
                
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={cleaningOptions.fixDataTypes}
                    onChange={() => toggleOption('fixDataTypes')}
                    className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <span className="text-gray-700">Fix data types</span>
                </label>
                
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={cleaningOptions.capitalizeHeaders}
                    onChange={() => toggleOption('capitalizeHeaders')}
                    className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <span className="text-gray-700">Clean column names</span>
                </label>
              </div>
              
              <div className="pt-4 flex space-x-4">
                {!previewCleaned ? (
                  <button
                    onClick={() => setPreviewCleaned(true)}
                    disabled={!Object.values(cleaningOptions).some(Boolean)}
                    className={`flex items-center px-4 py-2 rounded-md ${
                      !Object.values(cleaningOptions).some(Boolean)
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    <Filter size={18} className="mr-2" />
                    Preview Changes
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleApplyCleaningOptions}
                      className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      <Check size={18} className="mr-2" />
                      Apply Changes
                    </button>
                    <button
                      onClick={handleReset}
                      className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {cleanedStats && (
            <div className="mt-6 bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
                <h3 className="text-lg font-medium text-blue-800">Cleaning Summary</h3>
              </div>
              <div className="px-6 py-4">
                <ul className="space-y-2 text-sm">
                  {cleanedStats.rowsRemoved > 0 && (
                    <li className="flex items-start">
                      <CheckCircle size={16} className="text-green-500 mr-2 mt-0.5" />
                      <span>Removed {cleanedStats.rowsRemoved} empty rows</span>
                    </li>
                  )}
                  
                  {cleanedStats.columnsRemoved.length > 0 && (
                    <li className="flex items-start">
                      <CheckCircle size={16} className="text-green-500 mr-2 mt-0.5" />
                      <span>
                        Removed {cleanedStats.columnsRemoved.length} empty columns: 
                        <span className="font-medium"> {cleanedStats.columnsRemoved.join(', ')}</span>
                      </span>
                    </li>
                  )}
                  
                  {cleanedStats.nullsFixed > 0 && (
                    <li className="flex items-start">
                      <CheckCircle size={16} className="text-green-500 mr-2 mt-0.5" />
                      <span>Fixed {cleanedStats.nullsFixed} missing values</span>
                    </li>
                  )}
                  
                  {cleanedStats.outlierCount > 0 && (
                    <li className="flex items-start">
                      <CheckCircle size={16} className="text-green-500 mr-2 mt-0.5" />
                      <span>Adjusted {cleanedStats.outlierCount} outliers</span>
                    </li>
                  )}
                  
                  {cleanedStats.duplicatesRemoved > 0 && (
                    <li className="flex items-start">
                      <CheckCircle size={16} className="text-green-500 mr-2 mt-0.5" />
                      <span>Removed {cleanedStats.duplicatesRemoved} duplicate rows</span>
                    </li>
                  )}
                  
                  {cleaningOptions.trimWhitespace && (
                    <li className="flex items-start">
                      <CheckCircle size={16} className="text-green-500 mr-2 mt-0.5" />
                      <span>Trimmed whitespace in string values</span>
                    </li>
                  )}
                  
                  {cleaningOptions.fixDataTypes && (
                    <li className="flex items-start">
                      <CheckCircle size={16} className="text-green-500 mr-2 mt-0.5" />
                      <span>Fixed data types where possible</span>
                    </li>
                  )}
                  
                  {cleaningOptions.capitalizeHeaders && (
                    <li className="flex items-start">
                      <CheckCircle size={16} className="text-green-500 mr-2 mt-0.5" />
                      <span>Cleaned column names</span>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          )}
        </div>
        
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-800">
                {previewCleaned ? 'Preview of Cleaned Data' : 'Original Data'}
              </h3>
            </div>
            
            <div className="p-4">
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
            <div className="mt-6 bg-white rounded-lg shadow p-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <WandSparkles size={24} className="text-blue-600" />
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-medium text-gray-800">Data Cleaning Tips</h4>
                  <ul className="mt-2 space-y-2 text-sm text-gray-600">
                    <li>
                      <strong>Missing Values:</strong> For numeric columns, missing values will be filled with the mean.
                      For text columns, they'll be replaced with empty strings.
                    </li>
                    <li>
                      <strong>Outliers:</strong> Values beyond 1.5 × IQR will be capped at the boundaries.
                    </li>
                    <li>
                      <strong>Data Types:</strong> Attempts to convert strings to numbers where possible.
                    </li>
                    <li>
                      <strong>Column Names:</strong> Capitalizes words and replaces underscores with spaces.
                    </li>
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