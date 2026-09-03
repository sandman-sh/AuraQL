import React, { useState } from 'react';
import { Table, Search, Download, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';

interface DataTableProps {
  columns: string[];
  rows: Record<string, any>[];
  tableName: string;
}

export const DataTable: React.FC<DataTableProps> = ({ columns, rows, tableName }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const pageSize = 7;

  const validRows = (rows || []).filter((r) => r && typeof r === 'object');

  const filteredRows = validRows.filter((row) => {
    if (!searchTerm.trim()) return true;
    return Object.values(row).some((val) =>
      String(val ?? '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  if (sortCol) {
    filteredRows.sort((a, b) => {
      if (!a || !b) return 0;
      const valA = a[sortCol];
      const valB = b[sortCol];
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortAsc ? valA - valB : valB - valA;
      }
      return sortAsc
        ? String(valA ?? '').localeCompare(String(valB ?? ''))
        : String(valB ?? '').localeCompare(String(valA ?? ''));
    });
  }

  const totalPages = Math.ceil(filteredRows.length / pageSize) || 1;
  const paginatedRows = filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSort = (col: string) => {
    if (sortCol === col) {
      setSortAsc(!sortAsc);
    } else {
      setSortCol(col);
      setSortAsc(true);
    }
  };

  const handleExportCsv = () => {
    if (validRows.length === 0 || !columns || columns.length === 0) return;
    const headers = columns.join(',');
    const csvRows = validRows.map((r) =>
      columns.map((c) => `"${String(r[c] ?? '').replace(/"/g, '""')}"`).join(',')
    );
    const blob = new Blob([`${headers}\n${csvRows.join('\n')}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tableName || 'export'}_auraql_export.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const safeColumns = columns || [];

  return (
    <div className="rounded-none p-4 w-full max-w-full overflow-hidden min-w-0 bg-white dark:bg-dark-950">
      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <Table className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />
          <h4 className="text-xs font-bold text-slate-900 dark:text-white font-mono tracking-tight truncate">
            Query Records Stream
          </h4>
          <span className="hidden sm:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded-none bg-slate-100 dark:bg-dark-950 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10 shrink-0">
            {filteredRows.length} active records
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search..."
              className="pl-8 pr-2 py-1 text-xs font-mono bg-white dark:bg-dark-950 border border-slate-200 dark:border-white/10 rounded-none focus:outline-none focus:border-brand-500 w-32 sm:w-48 text-slate-900 dark:text-white truncate"
            />
          </div>

          <button
            onClick={handleExportCsv}
            className="btn-sharp p-1.5 bg-slate-100 dark:bg-dark-900 hover:bg-slate-200 dark:hover:bg-dark-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-white/10 transition-colors"
            title="Export CSV"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto rounded-none border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-dark-950">
        <table className="w-full text-left border-collapse text-xs font-mono">
          <thead>
            <tr className="border-b border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-dark-900/90 text-slate-700 dark:text-slate-400">
              {safeColumns.map((col) => (
                <th
                  key={col}
                  onClick={() => handleSort(col)}
                  className="px-3 py-2 font-semibold hover:text-brand-600 dark:hover:text-white cursor-pointer select-none transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>{col}</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400 dark:text-slate-600 hover:text-brand-600 dark:hover:text-brand-400" />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
            {paginatedRows.length === 0 ? (
              <tr>
                <td colSpan={Math.max(1, safeColumns.length)} className="px-4 py-6 text-center text-slate-500">
                  No records returned.
                </td>
              </tr>
            ) : (
              paginatedRows.map((row, i) => {
                if (!row) return null;
                return (
                  <tr key={i} className="hover:bg-purple-50/60 dark:hover:bg-brand-950/20 transition-colors">
                    {safeColumns.map((col) => {
                      const val = row[col];
                      const isNum = typeof val === 'number';
                      return (
                        <td
                          key={col}
                          className={`px-3 py-1.5 text-slate-800 dark:text-slate-300 truncate max-w-[200px] ${
                            isNum ? 'text-brand-700 dark:text-brand-300 font-semibold tabular-nums' : ''
                          }`}
                        >
                          {val === null || val === undefined ? (
                            <span className="text-slate-400 dark:text-slate-600">null</span>
                          ) : typeof val === 'boolean' ? (
                            String(val)
                          ) : isNum ? (
                            val.toLocaleString()
                          ) : (
                            String(val)
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between pt-3 text-[11px] font-mono text-slate-500 dark:text-slate-400">
        <div>
          Showing {filteredRows.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{' '}
          {Math.min(currentPage * pageSize, filteredRows.length)} of {filteredRows.length} rows
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1 rounded-none border border-slate-300 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-dark-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="px-2 py-0.5 border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-dark-900 text-slate-900 dark:text-white">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1 rounded-none border border-slate-300 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-dark-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
