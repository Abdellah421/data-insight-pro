import React, { useState, useMemo } from 'react';
import { ArrowDown, ArrowUp, Search, Plus, Trash2, Edit3, Save, X } from 'lucide-react';

interface EditableDataTableProps {
  data: any[];
  columns: string[];
  onDataChange: (newData: any[], newColumns: string[]) => void;
  onRowClick?: (row: any) => void;
  highlightColumn?: string;
}

const EditableDataTable: React.FC<EditableDataTableProps> = ({ 
  data, 
  columns, 
  onDataChange,
  onRowClick,
  highlightColumn
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingCell, setEditingCell] = useState<{rowIndex: number, column: string} | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [showAddRow, setShowAddRow] = useState(false);
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [deletingRow, setDeletingRow] = useState<number | null>(null);
  const [deletingColumn, setDeletingColumn] = useState<string | null>(null);
  
  const rowsPerPage = 10;

  // Sort the data
  const sortedData = useMemo(() => {
    let sortableData = [...data];
    if (sortConfig !== null) {
      sortableData.sort((a, b) => {
        const valueA = a[sortConfig.key];
        const valueB = b[sortConfig.key];
        
        if (valueA === null || valueA === undefined) return 1;
        if (valueB === null || valueB === undefined) return -1;
        
        // Handle different data types
        if (typeof valueA === 'string' && typeof valueB === 'string') {
          return sortConfig.direction === 'asc' 
            ? valueA.localeCompare(valueB) 
            : valueB.localeCompare(valueA);
        }
        
        return sortConfig.direction === 'asc' 
          ? (valueA > valueB ? 1 : -1) 
          : (valueA < valueB ? 1 : -1);
      });
    }
    return sortableData;
  }, [data, sortConfig]);
  
  // Filter the data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return sortedData;
    
    return sortedData.filter(row => 
      Object.values(row).some(value => 
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [sortedData, searchTerm]);
  
  // Calculate pagination
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );
  
  // Handle sort
  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Get sort indicator
  const getSortIcon = (column: string) => {
    if (!sortConfig || sortConfig.key !== column) {
      return null;
    }
    return sortConfig.direction === 'asc' ? <ArrowUp size={16} /> : <ArrowDown size={16} />;
  };

  // Format cell value for display
  const formatCellValue = (value: any) => {
    if (value === null || value === undefined) {
      return <span className="text-gray-400 italic">NULL</span>;
    }
    
    if (typeof value === 'object') {
      if (value instanceof Date) {
        return value.toLocaleString();
      }
      try {
        return JSON.stringify(value);
      } catch (e) {
        return String(value);
      }
    }
    
    return String(value);
  };

  // Handle cell editing
  const startEditing = (rowIndex: number, column: string, value: any) => {
    setEditingCell({ rowIndex, column });
    setEditingValue(String(value || ''));
  };

  const saveEdit = () => {
    if (!editingCell) return;
    
    const { rowIndex, column } = editingCell;
    const newData = [...data];
    
    // Find the actual row index in the original data
    const actualRowIndex = data.findIndex(row => 
      JSON.stringify(row) === JSON.stringify(paginatedData[rowIndex])
    );
    
    if (actualRowIndex !== -1) {
      newData[actualRowIndex] = { ...newData[actualRowIndex], [column]: editingValue };
      onDataChange(newData, columns);
    }
    
    setEditingCell(null);
    setEditingValue('');
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditingValue('');
  };

  // Handle key press in edit mode
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  // Add new row
  const addRow = () => {
    const newRow: any = {};
    columns.forEach(col => {
      newRow[col] = '';
    });
    
    const newData = [...data, newRow];
    onDataChange(newData, columns);
    setShowAddRow(false);
  };

  // Delete row
  const deleteRow = (rowIndex: number) => {
    const newData = data.filter((_, index) => index !== rowIndex);
    onDataChange(newData, columns);
    setDeletingRow(null);
  };

  // Add new column
  const addColumn = () => {
    if (!newColumnName.trim()) return;
    
    const newColumns = [...columns, newColumnName.trim()];
    const newData = data.map(row => ({
      ...row,
      [newColumnName.trim()]: ''
    }));
    
    onDataChange(newData, newColumns);
    setNewColumnName('');
    setShowAddColumn(false);
  };

  // Delete column
  const deleteColumn = (columnName: string) => {
    const newColumns = columns.filter(col => col !== columnName);
    const newData = data.map(row => {
      const newRow = { ...row };
      delete newRow[columnName];
      return newRow;
    });
    
    onDataChange(newData, newColumns);
    setDeletingColumn(null);
  };

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 shadow">
      {/* Table Controls */}
      <div className="bg-white p-4 border-b border-gray-200 flex flex-wrap items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search size={18} className="text-gray-500" />
            </div>
            <input
              type="text"
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Search data..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          
          <button
            onClick={() => setShowAddRow(true)}
            className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            <Plus size={16} className="mr-1" />
            Add Row
          </button>
          
          <button
            onClick={() => setShowAddColumn(true)}
            className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus size={16} className="mr-1" />
            Add Column
          </button>
        </div>
        
        <div className="flex items-center space-x-2 mt-2 sm:mt-0">
          <span className="text-sm text-gray-700">
            {filteredData.length} results
          </span>
        </div>
      </div>
      
      {/* Add Row Form */}
      {showAddRow && (
        <div className="bg-blue-50 p-4 border-b border-blue-200">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-blue-800">Add New Row:</span>
            {columns.map(column => (
              <div key={column} className="flex-1">
                <input
                  type="text"
                  placeholder={column}
                  className="w-full px-3 py-1 border border-blue-300 rounded text-sm"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') addRow();
                    if (e.key === 'Escape') setShowAddRow(false);
                  }}
                />
              </div>
            ))}
            <button
              onClick={addRow}
              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
            >
              <Save size={14} />
            </button>
            <button
              onClick={() => setShowAddRow(false)}
              className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}
      
      {/* Add Column Form */}
      {showAddColumn && (
        <div className="bg-blue-50 p-4 border-b border-blue-200">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-blue-800">Add New Column:</span>
            <input
              type="text"
              placeholder="Column name"
              value={newColumnName}
              onChange={(e) => setNewColumnName(e.target.value)}
              className="flex-1 px-3 py-1 border border-blue-300 rounded text-sm"
              onKeyPress={(e) => {
                if (e.key === 'Enter') addColumn();
                if (e.key === 'Escape') setShowAddColumn(false);
              }}
            />
            <button
              onClick={addColumn}
              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
            >
              <Save size={14} />
            </button>
            <button
              onClick={() => setShowAddColumn(false)}
              className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}
      
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
              {columns.map((column) => (
                <th
                  key={column}
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1" onClick={() => requestSort(column)}>
                      <span>{column}</span>
                      {getSortIcon(column)}
                    </div>
                    <button
                      onClick={() => setDeletingColumn(column)}
                      className="text-red-500 hover:text-red-700 opacity-0 hover:opacity-100 transition-opacity"
                      title="Delete column"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.length > 0 ? (
              paginatedData.map((row, rowIndex) => (
                <tr 
                  key={rowIndex} 
                  onClick={() => onRowClick && onRowClick(row)}
                  className={onRowClick ? "hover:bg-gray-50 cursor-pointer" : ""}
                >
                  <td className="px-2 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => setDeletingRow((currentPage - 1) * rowsPerPage + rowIndex)}
                      className="text-red-500 hover:text-red-700"
                      title="Delete row"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                  {columns.map((column) => (
                    <td 
                      key={`${rowIndex}-${column}`} 
                      className={`px-6 py-4 whitespace-nowrap text-sm ${
                        highlightColumn === column ? 'bg-blue-50' : ''
                      }`}
                    >
                      {editingCell?.rowIndex === rowIndex && editingCell?.column === column ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onKeyPress={handleKeyPress}
                            onBlur={saveEdit}
                            className="flex-1 px-2 py-1 border border-blue-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
                            autoFocus
                          />
                          <button
                            onClick={saveEdit}
                            className="text-green-600 hover:text-green-800"
                          >
                            <Save size={14} />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div 
                          className="flex items-center justify-between group"
                          onDoubleClick={() => startEditing(rowIndex, column, row[column])}
                        >
                          <span>{formatCellValue(row[column])}</span>
                          <button
                            onClick={() => startEditing(rowIndex, column, row[column])}
                            className="text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Edit cell"
                          >
                            <Edit3 size={14} />
                          </button>
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td 
                  colSpan={columns.length + 1} 
                  className="px-6 py-4 text-center text-sm text-gray-500"
                >
                  No data found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
          <div>
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{(currentPage - 1) * rowsPerPage + 1}</span> to{' '}
              <span className="font-medium">
                {Math.min(currentPage * rowsPerPage, filteredData.length)}
              </span>{' '}
              of <span className="font-medium">{filteredData.length}</span> results
            </p>
          </div>
          <div>
            <nav className="flex items-center">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                  currentPage === 1
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Previous
              </button>
              <span className="mx-2">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                  currentPage === totalPages
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Next
              </button>
            </nav>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modals */}
      {deletingRow !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Row</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to delete this row? This action cannot be undone.</p>
            <div className="flex space-x-3">
              <button
                onClick={() => deleteRow(deletingRow)}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                Delete
              </button>
              <button
                onClick={() => setDeletingRow(null)}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      {deletingColumn !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Column</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete the column "{deletingColumn}"? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => deleteColumn(deletingColumn)}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                Delete
              </button>
              <button
                onClick={() => setDeletingColumn(null)}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditableDataTable; 