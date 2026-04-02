import React, { useMemo, useCallback } from 'react';
import { Dataset } from '../types';

interface CorrelationHeatmapProps {
  dataset: Dataset;
  onCellClick?: (col1: string, col2: string, correlation: number) => void;
}

const CorrelationHeatmap: React.FC<CorrelationHeatmapProps> = ({ dataset, onCellClick }) => {
  // Get numeric columns only
  const numericColumns = dataset.columns
    .filter(col => col.type === 'number')
    .map(col => col.name);

  // Calculate Pearson correlation coefficient
  const calculateCorrelation = useCallback((x: number[], y: number[]): number => {
    const n = x.length;
    if (n < 2) return 0;
    
    const xMean = x.reduce((sum, val) => sum + val, 0) / n;
    const yMean = y.reduce((sum, val) => sum + val, 0) / n;
    
    let numerator = 0;
    let xDenominator = 0;
    let yDenominator = 0;
    
    for (let i = 0; i < n; i++) {
      const xDiff = x[i] - xMean;
      const yDiff = y[i] - yMean;
      numerator += xDiff * yDiff;
      xDenominator += xDiff * xDiff;
      yDenominator += yDiff * yDiff;
    }
    
    const correlation = numerator / Math.sqrt(xDenominator * yDenominator);
    return isNaN(correlation) ? 0 : correlation;
  }, []);

  // Calculate correlation matrix
  const correlationMatrix = useMemo(() => {
    try {
      if (numericColumns.length < 2) return null;

      const matrix: number[][] = [];
      
      for (let i = 0; i < numericColumns.length; i++) {
        matrix[i] = [];
        for (let j = 0; j < numericColumns.length; j++) {
          if (i === j) {
            matrix[i][j] = 1; // Perfect correlation with itself
          } else {
            const col1 = numericColumns[i];
            const col2 = numericColumns[j];
            
            const values1 = dataset.rows.map(row => row[col1]).filter(v => typeof v === 'number' && !isNaN(v));
            const values2 = dataset.rows.map(row => row[col2]).filter(v => typeof v === 'number' && !isNaN(v));
            
            // Ensure both arrays have the same length
            const minLength = Math.min(values1.length, values2.length);
            if (minLength < 2) {
              matrix[i][j] = 0;
              continue;
            }
            
            const corr = calculateCorrelation(values1.slice(0, minLength), values2.slice(0, minLength));
            matrix[i][j] = isNaN(corr) ? 0 : corr;
          }
        }
      }
      
      return matrix;
    } catch (error) {
      console.error('Error calculating correlation matrix:', error);
      return null;
    }
  }, [dataset, numericColumns, calculateCorrelation]);

  // Get color for correlation value
  const getCorrelationColor = (value: number): string => {
    const absValue = Math.abs(value);
    
    if (absValue >= 0.8) {
      return value >= 0 ? 'bg-red-600' : 'bg-blue-600';
    } else if (absValue >= 0.6) {
      return value >= 0 ? 'bg-red-500' : 'bg-blue-500';
    } else if (absValue >= 0.4) {
      return value >= 0 ? 'bg-red-400' : 'bg-blue-400';
    } else if (absValue >= 0.2) {
      return value >= 0 ? 'bg-red-300' : 'bg-blue-300';
    } else {
      return 'bg-gray-200';
    }
  };

  // Get text color for correlation value
  const getTextColor = (value: number): string => {
    const absValue = Math.abs(value);
    return absValue >= 0.4 ? 'text-white' : 'text-gray-800';
  };

  if (!correlationMatrix || numericColumns.length < 2) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="text-gray-400 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-800 mb-2">No Correlation Data</h3>
        <p className="text-gray-500">
          You need at least two numeric columns to generate a correlation heatmap.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-800">Correlation Heatmap</h3>
        <p className="text-sm text-gray-500">
          Click on any cell to see detailed correlation information
        </p>
      </div>
      
      <div className="p-6">
        {/* Color Legend */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Correlation Strength</h4>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-600">Strong Negative</span>
            <div className="flex space-x-1">
              {[-0.8, -0.6, -0.4, -0.2, 0, 0.2, 0.4, 0.6, 0.8].map(value => (
                <div
                  key={value}
                  className={`w-8 h-4 ${getCorrelationColor(value)} ${getTextColor(value)} flex items-center justify-center text-xs font-medium`}
                >
                  {value}
                </div>
              ))}
            </div>
            <span className="text-xs text-gray-600">Strong Positive</span>
          </div>
        </div>
        
        {/* Correlation Matrix */}
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Variables
                </th>
                {numericColumns.map(column => (
                  <th
                    key={column}
                    className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    <div className="transform -rotate-45 origin-left whitespace-nowrap">
                      {column}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {numericColumns.map((column, i) => (
                <tr key={column}>
                  <td className="px-2 py-2 text-sm font-medium text-gray-900 whitespace-nowrap">
                    {column}
                  </td>
                  {numericColumns.map((_, j) => (
                    <td
                      key={`${i}-${j}`}
                      className={`px-2 py-2 text-center text-sm font-medium cursor-pointer hover:opacity-80 transition-opacity ${
                        getCorrelationColor(correlationMatrix[i][j])
                      } ${getTextColor(correlationMatrix[i][j])}`}
                      onClick={() => onCellClick && onCellClick(
                        numericColumns[i], 
                        numericColumns[j], 
                        correlationMatrix[i][j]
                      )}
                      title={`${numericColumns[i]} vs ${numericColumns[j]}: ${correlationMatrix[i][j].toFixed(3)}`}
                    >
                      {correlationMatrix[i][j].toFixed(2)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Interpretation Guide */}
        <div className="mt-6 bg-blue-50 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 mb-2">How to Interpret Correlations</h4>
          <div className="text-sm text-blue-700 space-y-1">
            <p><strong>0.8 to 1.0:</strong> Very strong positive correlation</p>
            <p><strong>0.6 to 0.8:</strong> Strong positive correlation</p>
            <p><strong>0.4 to 0.6:</strong> Moderate positive correlation</p>
            <p><strong>0.2 to 0.4:</strong> Weak positive correlation</p>
            <p><strong>-0.2 to 0.2:</strong> Little to no correlation</p>
            <p><strong>-0.4 to -0.2:</strong> Weak negative correlation</p>
            <p><strong>-0.6 to -0.4:</strong> Moderate negative correlation</p>
            <p><strong>-0.8 to -0.6:</strong> Strong negative correlation</p>
            <p><strong>-1.0 to -0.8:</strong> Very strong negative correlation</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CorrelationHeatmap;
