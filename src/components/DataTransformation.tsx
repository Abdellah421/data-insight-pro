import React, { useState } from 'react';
import { RefreshCw, ArrowRight, CheckCircle } from 'lucide-react';
import { Dataset, DataTransformation } from '../types';

interface DataTransformationProps {
  dataset: Dataset;
  onTransformation: (transformation: DataTransformation) => void;
}

const DataTransformationComponent: React.FC<DataTransformationProps> = ({ 
  dataset, 
  onTransformation 
}) => {
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [transformationType, setTransformationType] = useState<string>('');
  const [parameters, setParameters] = useState<Record<string, any>>({});
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  // Get numeric columns for transformations
  const numericColumns = dataset.columns
    .filter(col => col.type === 'number')
    .map(col => col.name);

  const categoricalColumns = dataset.columns
    .filter(col => col.type === 'string' || col.type === 'boolean')
    .map(col => col.name);

  // Apply transformation
  const applyTransformation = () => {
    if (!transformationType || selectedColumns.length === 0) return;

    let transformedData = [...dataset.rows];
    const transformationParams: Record<string, any> = { ...parameters };

    switch (transformationType) {
      case 'normalize':
        // Min-Max normalization
        selectedColumns.forEach(col => {
          const values = transformedData.map(row => row[col]).filter(v => typeof v === 'number' && !isNaN(v));
          if (values.length > 0) {
            const min = Math.min(...values);
            const max = Math.max(...values);
            const range = max - min;
            
            if (range > 0) {
              transformedData = transformedData.map(row => ({
                ...row,
                [col]: range > 0 ? (row[col] - min) / range : row[col]
              }));
            }
          }
        });
        transformationParams.method = 'min-max';
        transformationParams.range = [0, 1];
        break;

      case 'standardize':
        // Z-score standardization
        selectedColumns.forEach(col => {
          const values = transformedData.map(row => row[col]).filter(v => typeof v === 'number' && !isNaN(v));
          if (values.length > 0) {
            const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
            const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
            const std = Math.sqrt(variance);
            
            if (std > 0) {
              transformedData = transformedData.map(row => ({
                ...row,
                [col]: (row[col] - mean) / std
              }));
            }
          }
        });
        transformationParams.method = 'z-score';
        transformationParams.mean = 0;
        transformationParams.std = 1;
        break;

      case 'log':
        // Logarithmic transformation
        selectedColumns.forEach(col => {
          transformedData = transformedData.map(row => ({
            ...row,
            [col]: typeof row[col] === 'number' && row[col] > 0 ? Math.log(row[col]) : row[col]
          }));
        });
        transformationParams.method = 'natural-log';
        break;

      case 'sqrt':
        // Square root transformation
        selectedColumns.forEach(col => {
          transformedData = transformedData.map(row => ({
            ...row,
            [col]: typeof row[col] === 'number' && row[col] >= 0 ? Math.sqrt(row[col]) : row[col]
          }));
        });
        transformationParams.method = 'square-root';
        break;

      case 'bin':
        // Binning/Discretization
        const numBins = parameters.numBins || 5;
        selectedColumns.forEach(col => {
          const values = transformedData.map(row => row[col]).filter(v => typeof v === 'number' && !isNaN(v));
          if (values.length > 0) {
            const min = Math.min(...values);
            const max = Math.max(...values);
            const binWidth = (max - min) / numBins;
            
            transformedData = transformedData.map(row => {
              if (typeof row[col] === 'number' && !isNaN(row[col])) {
                const binIndex = Math.min(Math.floor((row[col] - min) / binWidth), numBins - 1);
                return {
                  ...row,
                  [col]: `Bin ${binIndex + 1} (${(min + binIndex * binWidth).toFixed(2)}-${(min + (binIndex + 1) * binWidth).toFixed(2)})`
                };
              }
              return row;
            });
          }
        });
        transformationParams.method = 'equal-width';
        transformationParams.numBins = numBins;
        break;

      case 'encode':
        // One-hot encoding for categorical variables
        selectedColumns.forEach(col => {
          const uniqueValues = [...new Set(transformedData.map(row => row[col]).filter(v => v !== null && v !== undefined))];
          
          // Create new columns for each unique value
          uniqueValues.forEach(value => {
            const newColName = `${col}_${String(value).replace(/[^a-zA-Z0-9]/g, '_')}`;
            transformedData = transformedData.map(row => ({
              ...row,
              [newColName]: row[col] === value ? 1 : 0
            }));
          });
          
          // Remove original column
          transformedData = transformedData.map(row => {
            const newRow = { ...row };
            delete newRow[col];
            return newRow;
          });
        });
        transformationParams.method = 'one-hot';
        break;
    }

    const transformation: DataTransformation = {
      id: `transform-${Date.now()}`,
      type: transformationType as any,
      columns: selectedColumns,
      method: transformationParams.method || transformationType,
      parameters: transformationParams,
      originalData: dataset.rows,
      transformedData,
    };

    onTransformation(transformation);
    setPreviewData(transformedData.slice(0, 10)); // Show first 10 rows
    setShowPreview(true);
  };

  // Preview transformation
  const previewTransformation = () => {
    applyTransformation();
  };

  // Reset transformation
  const resetTransformation = () => {
    setSelectedColumns([]);
    setTransformationType('');
    setParameters({});
    setPreviewData([]);
    setShowPreview(false);
  };

  const transformationOptions = [
    {
      id: 'normalize',
      name: 'Normalize (Min-Max)',
      description: 'Scale values to range [0, 1]',
      applicableTo: 'numeric',
      icon: '📊'
    },
    {
      id: 'standardize',
      name: 'Standardize (Z-Score)',
      description: 'Scale values to mean=0, std=1',
      applicableTo: 'numeric',
      icon: '📈'
    },
    {
      id: 'log',
      name: 'Log Transform',
      description: 'Apply natural logarithm',
      applicableTo: 'numeric',
      icon: '📉'
    },
    {
      id: 'sqrt',
      name: 'Square Root',
      description: 'Apply square root transformation',
      applicableTo: 'numeric',
      icon: '√'
    },
    {
      id: 'bin',
      name: 'Binning',
      description: 'Convert continuous to categorical',
      applicableTo: 'numeric',
      icon: '📦'
    },
    {
      id: 'encode',
      name: 'One-Hot Encode',
      description: 'Convert categorical to binary',
      applicableTo: 'categorical',
      icon: '🔢'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Data Transformation</h2>
        <p className="text-gray-600">
          Transform your data for better analysis and modeling
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transformation Controls */}
        <div>
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-800">Transformation Options</h3>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Transformation Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transformation Type
                </label>
                <div className="space-y-2">
                  {transformationOptions.map(option => (
                    <button
                      key={option.id}
                      onClick={() => setTransformationType(option.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        transformationType === option.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{option.icon}</span>
                        <div>
                          <div className="font-medium text-gray-800">{option.name}</div>
                          <div className="text-sm text-gray-600">{option.description}</div>
                          <div className="text-xs text-gray-500">
                            For: {option.applicableTo === 'numeric' ? 'Numeric columns' : 'Categorical columns'}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Column Selection */}
              {transformationType && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Columns
                  </label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {(transformationType === 'encode' ? categoricalColumns : numericColumns).map(column => (
                      <label key={column} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedColumns.includes(column)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedColumns(prev => [...prev, column]);
                            } else {
                              setSelectedColumns(prev => prev.filter(col => col !== column));
                            }
                          }}
                          className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                        />
                        <span className="text-sm text-gray-700">{column}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Parameters */}
              {transformationType === 'bin' && (
                <div>
                  <label htmlFor="num-bins" className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Bins
                  </label>
                  <input
                    id="num-bins"
                    type="number"
                    min="2"
                    max="20"
                    value={parameters.numBins || 5}
                    onChange={(e) => setParameters(prev => ({ ...prev, numBins: parseInt(e.target.value) || 5 }))}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={previewTransformation}
                  disabled={!transformationType || selectedColumns.length === 0}
                  className={`flex-1 flex items-center justify-center py-2 px-4 rounded-md font-medium ${
                    !transformationType || selectedColumns.length === 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  <RefreshCw size={16} className="mr-2" />
                  Preview
                </button>
                
                <button
                  onClick={resetTransformation}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* Transformation Info */}
          {transformationType && (
            <div className="mt-6 bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Transformation Details</h3>
              {transformationOptions.find(opt => opt.id === transformationType) && (
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <span className="text-2xl">
                      {transformationOptions.find(opt => opt.id === transformationType)?.icon}
                    </span>
                    <div>
                      <h4 className="font-medium text-gray-800">
                        {transformationOptions.find(opt => opt.id === transformationType)?.name}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {transformationOptions.find(opt => opt.id === transformationType)?.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 rounded-lg p-4 text-sm">
                    <h4 className="font-medium text-blue-800 mb-2">When to Use</h4>
                    <ul className="text-blue-700 space-y-1">
                      {transformationType === 'normalize' && (
                        <>
                          <li>• When you need values between 0 and 1</li>
                          <li>• For neural networks and some ML algorithms</li>
                          <li>• When preserving the original distribution shape</li>
                        </>
                      )}
                      {transformationType === 'standardize' && (
                        <>
                          <li>• When data has different scales</li>
                          <li>• For algorithms sensitive to scale (SVM, KNN)</li>
                          <li>• When you want mean=0 and std=1</li>
                        </>
                      )}
                      {transformationType === 'log' && (
                        <>
                          <li>• For right-skewed data</li>
                          <li>• To reduce the impact of outliers</li>
                          <li>• When dealing with exponential relationships</li>
                        </>
                      )}
                      {transformationType === 'sqrt' && (
                        <>
                          <li>• For count data</li>
                          <li>• Moderate right-skewed distributions</li>
                          <li>• When log transform is too strong</li>
                        </>
                      )}
                      {transformationType === 'bin' && (
                        <>
                          <li>• To convert continuous to categorical</li>
                          <li>• For decision trees and some algorithms</li>
                          <li>• To reduce noise in the data</li>
                        </>
                      )}
                      {transformationType === 'encode' && (
                        <>
                          <li>• For machine learning algorithms</li>
                          <li>• When categories have no ordinal relationship</li>
                          <li>• To avoid ordinal encoding bias</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Preview Results */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-800">Transformation Preview</h3>
              <p className="text-sm text-gray-500">
                {showPreview ? 'Preview of transformed data' : 'Select transformation options to see preview'}
              </p>
            </div>
            
            <div className="p-6">
              {showPreview && previewData.length > 0 ? (
                <div className="space-y-4">
                  {/* Transformation Summary */}
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <CheckCircle size={20} className="text-green-600" />
                      <h4 className="font-medium text-green-800">Transformation Applied</h4>
                    </div>
                    <div className="text-sm text-green-700">
                      <p><strong>Type:</strong> {transformationOptions.find(opt => opt.id === transformationType)?.name}</p>
                      <p><strong>Columns:</strong> {selectedColumns.join(', ')}</p>
                      <p><strong>Rows:</strong> {dataset.rows.length}</p>
                    </div>
                  </div>

                  {/* Data Preview */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          {Object.keys(previewData[0]).map(column => (
                            <th
                              key={column}
                              className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              {column}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {previewData.map((row, index) => (
                          <tr key={index}>
                            {Object.values(row).map((value, colIndex) => (
                              <td key={colIndex} className="px-3 py-2 text-sm text-gray-900">
                                {typeof value === 'number' ? value.toFixed(4) : String(value)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Apply Button */}
                  <div className="flex justify-end">
                    <button
                      onClick={applyTransformation}
                      className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      <ArrowRight size={16} className="mr-2" />
                      Apply Transformation
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <RefreshCw size={48} className="mx-auto" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">No Preview Available</h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    Select a transformation type and columns, then click "Preview" to see how your data will be transformed.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataTransformationComponent;
