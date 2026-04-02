import React, { useState, useMemo } from 'react';
import { Info, Download } from 'lucide-react';
import EditableDataTable from '../components/EditableDataTable';
import StatsCard from '../components/StatsCard';
import { Dataset } from '../types';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

interface DataExplorerProps {
  dataset: Dataset;
  onDatasetUpdate?: (dataset: Dataset) => void;
}

const DataExplorer: React.FC<DataExplorerProps> = ({ dataset, onDatasetUpdate }) => {
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
  
  // Calculate basic stats about the dataset
  const datasetStats = useMemo(() => {
    let totalMissing = 0;
    const totalCells = dataset.rows.length * dataset.columns.length;
    
    // Count data types and missing values
    dataset.columns.forEach(column => {
      let columnMissing = 0;
      
      dataset.rows.forEach(row => {
        const value = row[column.name];
        // Check for all types of missing values
        if (value === null || 
            value === undefined || 
            value === '' || 
            (typeof value === 'string' && value.trim() === '') ||
            (typeof value === 'number' && isNaN(value))) {
          columnMissing++;
          totalMissing++;
        }
      });
      
      // Update column stats
      column.missing = columnMissing;
      column.missingPercent = (columnMissing / dataset.rows.length) * 100;
    });
    
    return {
      rowCount: dataset.rows.length,
      columnCount: dataset.columns.length,
      missingValues: totalMissing,
      missingPercent: (totalMissing / totalCells) * 100,
      dataTypes: dataset.columns.reduce((acc, col) => {
        acc[col.type] = (acc[col.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  }, [dataset]);
  
  // Get selected column stats
  const selectedColumnStats = useMemo(() => {
    if (!selectedColumn) return null;
    
    const column = dataset.columns.find(col => col.name === selectedColumn);
    if (!column) return null;
    
    // Calculate additional stats for the column
    const values = dataset.rows
      .map(row => row[selectedColumn])
      .filter(val => 
        val !== null && 
        val !== undefined && 
        val !== '' && 
        !(typeof val === 'string' && val.trim() === '') &&
        !(typeof val === 'number' && isNaN(val))
      );
    
    if (column.type === 'number' && values.length > 0) {
      // Calculate numeric stats
      const numericValues = values.map(v => Number(v)).filter(v => !isNaN(v));
      
      if (numericValues.length > 0) {
        column.min = Math.min(...numericValues);
        column.max = Math.max(...numericValues);
        column.mean = numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length;
        
        // Sort values for median
        const sortedValues = [...numericValues].sort((a, b) => a - b);
        const mid = Math.floor(sortedValues.length / 2);
        column.median = sortedValues.length % 2 === 0
          ? (sortedValues[mid - 1] + sortedValues[mid]) / 2
          : sortedValues[mid];
        
        // Standard deviation
        const variance = numericValues.reduce((sum, val) => 
          sum + Math.pow(val - column.mean!, 2), 0) / numericValues.length;
        column.std = Math.sqrt(variance);
      }
    }
    
    // Count unique values (for any type)
    const uniqueValues = new Set(values);
    column.uniqueValues = uniqueValues.size;
    
    return column;
  }, [selectedColumn, dataset]);
  
  // Handle data changes from editable table
  const handleDataChange = (newData: any[], newColumns: string[]) => {
    if (!onDatasetUpdate) return;
    
    // Update column types based on new data
    const updatedColumns = newColumns.map(colName => {
      const existingColumn = dataset.columns.find(col => col.name === colName);
      if (existingColumn) return existingColumn;
      
      // Determine type for new column
      let type: 'string' | 'number' | 'date' | 'boolean' | 'unknown' = 'unknown';
      let nullable = false;
      
      for (const row of newData) {
        const value = row[colName];
        
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
      
      return { name: colName, type, nullable };
    });
    
    const updatedDataset: Dataset = {
      ...dataset,
      rows: newData,
      columns: updatedColumns,
      dateModified: new Date(),
    };
    
    onDatasetUpdate(updatedDataset);
  };
  
  // Export data to different formats
  const handleExport = (format: 'csv' | 'xlsx' | 'json') => {
    const fileName = `${dataset.name}_export`;
    
    switch (format) {
      case 'csv': {
        const csv = Papa.unparse(dataset.rows);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, `${fileName}.csv`);
        break;
      }
      case 'xlsx': {
        const ws = XLSX.utils.json_to_sheet(dataset.rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Data');
        XLSX.writeFile(wb, `${fileName}.xlsx`);
        break;
      }
      case 'json': {
        const jsonStr = JSON.stringify(dataset.rows, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        saveAs(blob, `${fileName}.json`);
        break;
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Data Explorer</h2>
          <p className="text-gray-600">
            View, edit, and explore your dataset
          </p>
        </div>
        
        <div className="flex space-x-2">
          <div className="relative group">
            <button 
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Download size={18} className="mr-2" />
              Export
            </button>
            <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
              <ul className="py-1">
                <li>
                  <button
                    onClick={() => handleExport('csv')}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  >
                    Export as CSV
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleExport('xlsx')}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  >
                    Export as Excel
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleExport('json')}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  >
                    Export as JSON
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      {/* Dataset overview cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Rows"
          value={datasetStats.rowCount.toLocaleString()}
          icon={<Info size={20} />}
        />
        <StatsCard
          title="Total Columns"
          value={datasetStats.columnCount}
          icon={<Info size={20} />}
        />
        <StatsCard
          title="Missing Values"
          value={datasetStats.missingValues.toLocaleString()}
          description={`${datasetStats.missingPercent.toFixed(2)}% of all cells`}
          icon={<Info size={20} />}
        />
        <StatsCard
          title="File Type"
          value={dataset.originalFormat.toUpperCase()}
          description={`Original: ${dataset.originalFilename}`}
          icon={<Info size={20} />}
        />
      </div>
      
      {/* Column and selected column info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-800">Editable Data Table</h3>
              <p className="text-sm text-gray-500">
                Double-click cells to edit, use the buttons to add rows/columns, or click the trash icon to delete
              </p>
            </div>
            
            <div className="p-4">
              <EditableDataTable 
                data={dataset.rows} 
                columns={dataset.columns.map(col => col.name)}
                onDataChange={handleDataChange}
                highlightColumn={selectedColumn || undefined}
                onRowClick={(row) => console.log('Row clicked:', row)}
              />
            </div>
          </div>
        </div>
        
        <div>
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-800">Column Details</h3>
              <p className="text-sm text-gray-500">
                {selectedColumn 
                  ? `Details for column: ${selectedColumn}` 
                  : 'Select a column to see details'}
              </p>
            </div>
            
            <div className="px-6 py-4">
              {selectedColumnStats ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Type</p>
                      <p className="font-medium capitalize">{selectedColumnStats.type}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Missing</p>
                      <p className="font-medium">
                        {selectedColumnStats.missingPercent?.toFixed(1)}% 
                        ({selectedColumnStats.missing})
                      </p>
                    </div>
                    
                    {selectedColumnStats.uniqueValues !== undefined && (
                      <div>
                        <p className="text-sm text-gray-500">Unique Values</p>
                        <p className="font-medium">{selectedColumnStats.uniqueValues}</p>
                      </div>
                    )}
                    
                    {selectedColumnStats.type === 'number' && (
                      <>
                        <div>
                          <p className="text-sm text-gray-500">Min</p>
                          <p className="font-medium">{selectedColumnStats.min?.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Max</p>
                          <p className="font-medium">{selectedColumnStats.max?.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Mean</p>
                          <p className="font-medium">{selectedColumnStats.mean?.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Median</p>
                          <p className="font-medium">{selectedColumnStats.median?.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Std Dev</p>
                          <p className="font-medium">{selectedColumnStats.std?.toFixed(2)}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    Select a column from the data table to view detailed statistics
                  </p>
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-800 mb-2">All Columns</h4>
              <div className="max-h-64 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Missing</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {dataset.columns.map((column) => (
                      <tr 
                        key={column.name}
                        className={`hover:bg-gray-50 cursor-pointer ${selectedColumn === column.name ? 'bg-blue-50' : ''}`}
                        onClick={() => setSelectedColumn(column.name)}
                      >
                        <td className="px-3 py-2 text-sm">{column.name}</td>
                        <td className="px-3 py-2 text-sm capitalize">{column.type}</td>
                        <td className="px-3 py-2 text-sm">
                          {column.missingPercent !== undefined 
                            ? `${column.missingPercent.toFixed(1)}%` 
                            : '0%'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataExplorer;