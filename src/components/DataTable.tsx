import React, { useState, useMemo } from 'react';
import { ArrowDown, ArrowUp, Search } from 'lucide-react';

interface DataTableProps {
  data: any[];
  columns: string[];
  onRowClick?: (row: any) => void;
  highlightColumn?: string;
}

const DataTable: React.FC<DataTableProps> = ({ 
  data, 
  columns, 
  onRowClick,
  highlightColumn
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
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

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 shadow">
      {/* Table Search and Pagination Controls */}
      <div className="bg-white p-4 border-b border-gray-200 flex flex-wrap items-center justify-between">
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
              setCurrentPage(1); // Reset to first page on new search
            }}
          />
        </div>
        
        <div className="flex items-center space-x-2 mt-2 sm:mt-0">
          <span className="text-sm text-gray-700">
            {filteredData.length} results
          </span>
        </div>
      </div>
      
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column}
                  onClick={() => requestSort(column)}
                  className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100 ${
                    highlightColumn === column ? 'bg-blue-50 text-blue-700' : 'text-gray-500'
                  }`}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column}</span>
                    {getSortIcon(column)}
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
                  {columns.map((column) => (
                    <td 
                      key={`${rowIndex}-${column}`} 
                      className={`px-6 py-4 whitespace-nowrap text-sm ${
                        highlightColumn === column ? 'bg-blue-50' : ''
                      }`}
                    >
                      {formatCellValue(row[column])}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td 
                  colSpan={columns.length} 
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
    </div>
  );
};

export default DataTable;