import React, { useMemo } from 'react';
import { Filter, X, Check } from 'lucide-react';
import { DatasetId } from '../../types';
import { auraEngine } from '../../engine/auraql';
import { DATASETS_METADATA } from '../../engine/datasets';

interface FilterOption {
  label: string;
  column: string;
  value: string;
}

interface GlobalFilterBarProps {
  dataset: DatasetId;
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
  // Build filter options dynamically from real unique values in the dataset
  const options = useMemo<FilterOption[]>(() => {
    const meta = DATASETS_METADATA[dataset];
    if (!meta) return [];
    const tableName = meta.tableName;

    if (dataset === 'ecommerce') {
      const regions = auraEngine.getDistinctValues(tableName, 'region');
      const tiers = auraEngine.getDistinctValues(tableName, 'customer_tier');
      return [
        ...regions.map(v => ({ label: `Region: ${v}`, column: 'region', value: v })),
        ...tiers.map(v => ({ label: `Tier: ${v}`, column: 'customer_tier', value: v }))
      ];
    }

    if (dataset === 'churn') {
      const risks = auraEngine.getDistinctValues(tableName, 'churn_risk');
      const plans = auraEngine.getDistinctValues(tableName, 'plan_tier');
      return [
        ...risks.map(v => ({ label: `Risk: ${v}`, column: 'churn_risk', value: v })),
        ...plans.map(v => ({ label: `Plan: ${v}`, column: 'plan_tier', value: v }))
      ];
    }

    if (dataset === 'webvitals') {
      const devices = auraEngine.getDistinctValues(tableName, 'device_type');
      const nets = auraEngine.getDistinctValues(tableName, 'network_type');
      const ratings = auraEngine.getDistinctValues(tableName, 'vital_rating');
      return [
        ...devices.map(v => ({ label: `Device: ${v}`, column: 'device_type', value: v })),
        ...ratings.map(v => ({ label: `Rating: ${v}`, column: 'vital_rating', value: v })),
        ...nets.map(v => ({ label: `Network: ${v}`, column: 'network_type', value: v }))
      ];
    }

    // Custom tables: use first string column for filtering
    const rows = auraEngine.getTableData(tableName);
    if (rows.length === 0) return [];
    const stringCols = Object.keys(rows[0]).filter(k => typeof rows[0][k] === 'string');
    if (stringCols.length === 0) return [];
    const col = stringCols[0];
    const vals = auraEngine.getDistinctValues(tableName, col, 8);
    return vals.map(v => ({ label: `${col}: ${v}`, column: col, value: v }));
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
              onClick={() => (isSelected ? onClearFilter() : onApplyFilter(opt.column, opt.value))}
              className={`btn-sharp px-2.5 py-1 text-[11px] font-mono border transition-all flex items-center gap-1 shrink-0 ${
                isSelected
                  ? 'bg-brand-600 text-white font-bold border-brand-400 shadow-sm shadow-brand-600/30'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-dark-900 dark:hover:bg-dark-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-brand-500/40'
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
          className="btn-sharp px-2.5 py-1 text-[10px] font-mono text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-300 dark:border-rose-500/30 flex items-center gap-1 shrink-0 transition-colors"
        >
          <X className="w-3 h-3" />
          <span>Reset Slicers</span>
        </button>
      )}
    </div>
  );
};
