import React, { useMemo } from 'react';
import { Filter, X, Check } from 'lucide-react';
import { auraEngine } from '../../engine/auraql';

interface FilterOption {
  label: string;
  column: string;
  value: string;
}

interface GlobalFilterBarProps {
  dataset: string;
  activeFilter: { column: string; value: string } | null;
  onApplyFilter: (column: string, value: string) => void;
  onClearFilter: () => void;
}

export const GlobalFilterBar: React.FC<GlobalFilterBarProps> = ({
  dataset,
  activeFilter,
  onApplyFilter,
  onClearFilter
}) => {
  // Discovers filter options dynamically from real unique values in whatever table is loaded
  const options = useMemo<FilterOption[]>(() => {
    if (!dataset) return [];
    const rows = auraEngine.getTableData(dataset);
    if (!rows || rows.length === 0 || !rows[0]) return [];

    const firstRow = rows[0];
    const stringCols = Object.keys(firstRow).filter(
      (k) => typeof firstRow[k] === 'string' && !k.toLowerCase().includes('id') && !k.toLowerCase().includes('date')
    );

    const result: FilterOption[] = [];
    for (const col of stringCols.slice(0, 3)) {
      const distinctVals = auraEngine.getDistinctValues(dataset, col, 4);
      for (const val of distinctVals) {
        result.push({
          label: `${col}: ${val}`,
          column: col,
          value: val
        });
      }
    }
    return result.slice(0, 8);
  }, [dataset]);

  if (options.length === 0) return null;

  return (
    <div className="glass-card rounded-none p-3 border border-slate-200 dark:border-white/[0.08] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
      <div className="flex items-center gap-2 overflow-x-auto py-0.5">
        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 shrink-0 font-bold uppercase tracking-wider text-[10px]">
          <Filter className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
          <span>Cohort Slicers:</span>
        </div>

        {options.map((opt, idx) => {
          const isSelected = activeFilter?.column === opt.column && activeFilter?.value === opt.value;
          return (
            <button
              key={idx}
              onClick={() => {
                if (isSelected) {
                  onClearFilter();
                } else {
                  onApplyFilter(opt.column, opt.value);
                }
              }}
              className={`px-2.5 py-1 rounded-none border transition-all text-[11px] flex items-center gap-1.5 whitespace-nowrap ${
                isSelected
                  ? 'bg-brand-600 text-white border-brand-400 shadow-sm shadow-brand-600/30'
                  : 'bg-white dark:bg-dark-900 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-brand-500/50'
              }`}
            >
              {isSelected && <Check className="w-3 h-3" />}
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>

      {activeFilter && (
        <button
          onClick={onClearFilter}
          className="btn-sharp px-2 py-1 text-[11px] text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-rose-200 dark:border-rose-500/30 flex items-center gap-1 transition-colors"
        >
          <X className="w-3 h-3" />
          <span>Reset Slicers</span>
        </button>
      )}
    </div>
  );
};
