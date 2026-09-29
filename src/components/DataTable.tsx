import React, { useState, useMemo } from 'react';
import { ArrowDown, ArrowUp, Search, ChevronLeft, ChevronRight } from 'lucide-react';

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

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 shadow-xs bg-white w-full max-w-full">
      {/* Table Search and Summary Header */}
      <div className="bg-white p-3 sm:p-4 border-b border-gray-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-xs">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            className="pl-10 pr-4 py-2.5 w-full border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Search dataset records..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        
        <div className="flex items-center justify-between sm:justify-end text-xs text-gray-500 font-medium">
          <span>{filteredData.length} records found</span>
        </div>
      </div>
      
      {/* Dedicated Scroll Container for Table Body ONLY */}
      <div className="overflow-x-auto w-full max-w-full touch-pan-x">
        <table className="min-w-full divide-y divide-gray-200 text-left">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column}
                  onClick={() => requestSort(column)}
                  className={`px-4 sm:px-6 py-3.5 text-xs font-bold uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100 transition-colors ${
                    highlightColumn === column ? 'bg-blue-50 text-blue-700' : 'text-gray-600'
                  }`}
                >
                  <div className="flex items-center space-x-1.5 min-h-[24px]">
                    <span className="truncate">{column}</span>
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
                  className={onRowClick ? "hover:bg-blue-50/50 cursor-pointer transition-colors" : ""}
                >
                  {columns.map((column) => (
                    <td 
                      key={`${rowIndex}-${column}`} 
                      className={`px-4 sm:px-6 py-3.5 whitespace-nowrap text-xs sm:text-sm ${
                        highlightColumn === column ? 'bg-blue-50/70 font-medium' : 'text-gray-700'
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
                  className="px-6 py-8 text-center text-sm text-gray-500"
                >
                  No matching dataset records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Responsive Pagination Controls */}
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
    </div>
  );
};

export default DataTable;