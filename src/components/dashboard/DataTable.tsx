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

  const filteredRows = (rows || []).filter((row) => {
    if (!searchTerm.trim()) return true;
    return Object.values(row).some((val) =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  if (sortCol) {
    filteredRows.sort((a, b) => {
      const valA = a[sortCol];
      const valB = b[sortCol];
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortAsc ? valA - valB : valB - valA;
      }
      return sortAsc
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
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
    if (rows.length === 0) return;
    const headers = columns.join(',');
    const csvRows = rows.map((r) =>
      columns.map((c) => `"${String(r[c] ?? '').replace(/"/g, '""')}"`).join(',')
    );
    const blob = new Blob([`${headers}\n${csvRows.join('\n')}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tableName}_auraql_export.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="glass-card rounded-none p-4 border border-slate-200 dark:border-white/[0.08]">
      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Table className="w-4 h-4 text-brand-600 dark:text-brand-400" />
          <h4 className="text-xs font-bold text-slate-900 dark:text-white font-mono tracking-tight">
            Query Records Stream
          </h4>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-none bg-slate-100 dark:bg-dark-950 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10">
            {filteredRows.length} active records
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Filter active rows..."
              className="bg-slate-50 dark:bg-dark-950 rounded-none pl-8 pr-2.5 py-1 text-xs font-mono text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-white/10 focus:border-brand-500 outline-none w-40 sm:w-52"
            />
          </div>

          <button
            onClick={handleExportCsv}
            disabled={rows.length === 0}
            className="p-1 rounded-none text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-dark-800 border border-slate-200 dark:border-white/10 transition-colors disabled:opacity-40"
            title="Download CSV"
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
              {columns.map((col) => (
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
                <td colSpan={columns.length || 1} className="px-4 py-6 text-center text-slate-500">
                  No records returned.
                </td>
              </tr>
            ) : (
              paginatedRows.map((row, i) => (
                <tr key={i} className="hover:bg-purple-50/60 dark:hover:bg-brand-950/20 transition-colors">
                  {columns.map((col) => {
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
                          val ? 'true' : 'false'
                        ) : (
                          String(val)
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between pt-2.5 text-xs font-mono text-slate-500 dark:text-slate-400">
        <div>
          Page {currentPage} of {totalPages}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="p-1 rounded-none bg-slate-100 dark:bg-dark-900 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-dark-800 disabled:opacity-30"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="p-1 rounded-none bg-slate-100 dark:bg-dark-900 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-dark-800 disabled:opacity-30"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
