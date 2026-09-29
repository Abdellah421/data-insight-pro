import React, { useState, useMemo } from 'react';
import { ArrowDown, ArrowUp, Search, Plus, Trash2, Edit3, Save, X, ChevronLeft, ChevronRight } from 'lucide-react';

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
  const [newRowData, setNewRowData] = useState<Record<string, string>>({});
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
    return sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />;
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

  // Add new row
  const addRow = () => {
    const newRow: any = {};
    columns.forEach(col => {
      newRow[col] = newRowData[col] || '';
    });
    
    const newData = [...data, newRow];
    onDataChange(newData, columns);
    setNewRowData({});
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
    <div className="overflow-hidden rounded-xl border border-gray-200 shadow-xs bg-white w-full max-w-full">
      {/* Table Controls */}
      <div className="bg-white p-3 sm:p-4 border-b border-gray-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              className="pl-10 pr-4 py-2.5 w-full border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Search records..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddRow(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition min-h-[44px]"
            >
              <Plus size={16} />
              Add Row
            </button>
            
            <button
              onClick={() => setShowAddColumn(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition min-h-[44px]"
            >
              <Plus size={16} />
              Add Column
            </button>
          </div>
        </div>
        
        <div className="text-xs text-gray-500 font-medium text-right">
          {filteredData.length} records found
        </div>
      </div>
      
      {/* Add Row Form (Responsive Grid) */}
      {showAddRow && (
        <div className="bg-blue-50/80 p-4 border-b border-blue-200">
          <p className="text-xs font-bold text-blue-900 mb-3">Add New Record Row:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 mb-3">
            {columns.map(column => (
              <div key={column}>
                <label className="block text-[11px] font-semibold text-blue-800 mb-1 truncate">{column}</label>
                <input
                  type="text"
                  placeholder={column}
                  value={newRowData[column] || ''}
                  onChange={(e) => setNewRowData({ ...newRowData, [column]: e.target.value })}
                  className="w-full px-3 py-2 border border-blue-300 rounded-lg text-xs bg-white"
                />
              </div>
            ))}
          </div>
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setShowAddRow(false)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-300 transition min-h-[40px]"
            >
              Cancel
            </button>
            <button
              onClick={addRow}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition min-h-[40px]"
            >
              Save Record
            </button>
          </div>
        </div>
      )}
      
      {/* Add Column Form */}
      {showAddColumn && (
        <div className="bg-blue-50/80 p-4 border-b border-blue-200">
          <p className="text-xs font-bold text-blue-900 mb-2">Add New Attribute Column:</p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="text"
              placeholder="Column name"
              value={newColumnName}
              onChange={(e) => setNewColumnName(e.target.value)}
              className="flex-1 px-3 py-2.5 border border-blue-300 rounded-lg text-xs bg-white"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddColumn(false)}
                className="flex-1 sm:flex-none px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-300 transition min-h-[44px]"
              >
                Cancel
              </button>
              <button
                onClick={addColumn}
                className="flex-1 sm:flex-none px-4 py-2.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition min-h-[44px]"
              >
                Add Column
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Dedicated Table Scroll Container */}
      <div className="overflow-x-auto w-full max-w-full touch-pan-x">
        <table className="min-w-full divide-y divide-gray-200 text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider w-12">
                Action
              </th>
              {columns.map((column) => (
                <th
                  key={column}
                  className="px-4 sm:px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-gray-600"
                >
                  <div className="flex items-center justify-between gap-2 min-h-[24px]">
                    <div className="flex items-center space-x-1 cursor-pointer select-none" onClick={() => requestSort(column)}>
                      <span className="truncate">{column}</span>
                      {getSortIcon(column)}
                    </div>
                    <button
                      onClick={() => setDeletingColumn(column)}
                      className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
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
                <tr key={rowIndex} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-3 py-3.5 text-center whitespace-nowrap">
                    <button
                      onClick={() => setDeletingRow((currentPage - 1) * rowsPerPage + rowIndex)}
                      className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 min-h-[36px] min-w-[36px] flex items-center justify-center"
                      title="Delete row"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                  {columns.map((column) => (
                    <td 
                      key={`${rowIndex}-${column}`} 
                      className={`px-4 sm:px-6 py-3.5 whitespace-nowrap text-xs sm:text-sm ${
                        highlightColumn === column ? 'bg-blue-50/70 font-medium' : 'text-gray-700'
                      }`}
                    >
                      {editingCell?.rowIndex === rowIndex && editingCell?.column === column ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); else if (e.key === 'Escape') cancelEdit(); }}
                            className="flex-1 px-2.5 py-1.5 border border-blue-400 rounded-md text-xs bg-white"
                            autoFocus
                          />
                          <button onClick={saveEdit} className="p-1.5 text-green-600 hover:bg-green-50 rounded">
                            <Save size={16} />
                          </button>
                          <button onClick={cancelEdit} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded">
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div 
                          className="flex items-center justify-between gap-2 group cursor-pointer"
                          onClick={() => startEditing(rowIndex, column, row[column])}
                        >
                          <span className="truncate">{formatCellValue(row[column])}</span>
                          <button
                            onClick={() => startEditing(rowIndex, column, row[column])}
                            className="text-gray-400 hover:text-gray-600 p-1 rounded"
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
                  className="px-6 py-8 text-center text-sm text-gray-500"
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
        <div className="bg-white px-4 py-3 flex flex-col sm:flex-row items-center justify-between border-t border-gray-200 gap-3">
          <div className="text-xs text-gray-600">
            Showing <span className="font-semibold">{(currentPage - 1) * rowsPerPage + 1}</span> to{' '}
            <span className="font-semibold">
              {Math.min(currentPage * rowsPerPage, filteredData.length)}
            </span>{' '}
            of <span className="font-semibold">{filteredData.length}</span> records
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={`inline-flex items-center justify-center px-3 py-2 rounded-lg text-xs font-semibold border min-h-[40px] ${
                currentPage === 1
                  ? 'bg-gray-50 text-gray-300 border-gray-200 cursor-not-allowed'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <ChevronLeft size={16} className="mr-1" /> Prev
            </button>
            <span className="text-xs text-gray-600 font-medium px-2">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className={`inline-flex items-center justify-center px-3 py-2 rounded-lg text-xs font-semibold border min-h-[40px] ${
                currentPage === totalPages
                  ? 'bg-gray-50 text-gray-300 border-gray-200 cursor-not-allowed'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Next <ChevronRight size={16} className="ml-1" />
            </button>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modals */}
      {deletingRow !== null && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Record Row</h3>
            <p className="text-sm text-gray-600 mb-6">Are you sure you want to delete this row? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingRow(null)}
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-200 transition min-h-[44px]"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteRow(deletingRow)}
                className="flex-1 bg-red-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-700 transition min-h-[44px]"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      
      {deletingColumn !== null && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Attribute Column</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete column <strong className="text-gray-900">{deletingColumn}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingColumn(null)}
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-200 transition min-h-[44px]"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteColumn(deletingColumn)}
                className="flex-1 bg-red-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-700 transition min-h-[44px]"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditableDataTable;