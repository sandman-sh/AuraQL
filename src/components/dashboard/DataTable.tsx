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
  const pageSize = 8;

  // Filter rows based on search
  const filteredRows = rows.filter((row) => {
    if (!searchTerm.trim()) return true;
    return Object.values(row).some((val) =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Sort rows if column selected
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
    a.download = `${tableName}_export.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="glass-card rounded-2xl p-5 border border-white/[0.08]">
      {/* Table Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Table className="w-4 h-4 text-brand-400" />
          <h4 className="text-sm font-bold text-white font-mono tracking-tight">
            Query Records Stream
          </h4>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-dark-950 text-slate-400 border border-white/10">
            {filteredRows.length} matches
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Filter active rows..."
              className="bg-dark-950/80 rounded-lg pl-8 pr-3 py-1 text-xs font-mono text-slate-200 border border-white/10 focus:border-brand-500 outline-none w-44 sm:w-56"
            />
          </div>

          {/* Export CSV */}
          <button
            onClick={handleExportCsv}
            disabled={rows.length === 0}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-dark-800 border border-white/10 transition-colors disabled:opacity-40"
            title="Download records as CSV"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Table Scroll Viewport */}
      <div className="overflow-x-auto rounded-xl border border-white/[0.06] bg-dark-950/60">
        <table className="w-full text-left border-collapse text-xs font-mono">
          <thead>
            <tr className="border-b border-white/[0.08] bg-dark-900/80 text-slate-400">
              {columns.map((col) => (
                <th
                  key={col}
                  onClick={() => handleSort(col)}
                  className="px-3.5 py-2.5 font-semibold hover:text-white cursor-pointer select-none transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{col}</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-600 hover:text-brand-400" />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {paginatedRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length || 1} className="px-4 py-8 text-center text-slate-500">
                  No records returned by current query.
                </td>
              </tr>
            ) : (
              paginatedRows.map((row, i) => (
                <tr key={i} className="hover:bg-brand-950/20 transition-colors">
                  {columns.map((col) => {
                    const val = row[col];
                    const isNum = typeof val === 'number';
                    return (
                      <td
                        key={col}
                        className={`px-3.5 py-2 text-slate-300 truncate max-w-[200px] ${
                          isNum ? 'text-brand-300 font-semibold tabular-nums' : ''
                        }`}
                      >
                        {val === null || val === undefined ? (
                          <span className="text-slate-600">null</span>
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
      <div className="flex items-center justify-between pt-3 mt-1 text-xs font-mono text-slate-400">
        <div>
          Page {currentPage} of {totalPages}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="p-1 rounded-md bg-dark-900 border border-white/10 hover:bg-dark-800 disabled:opacity-30"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="p-1 rounded-md bg-dark-900 border border-white/10 hover:bg-dark-800 disabled:opacity-30"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
