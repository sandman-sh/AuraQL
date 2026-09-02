import React from 'react';
import { Filter, X, Check, RefreshCw } from 'lucide-react';
import { DatasetId } from '../../types';

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
  const getFilterOptions = () => {
    switch (dataset) {
      case 'ecommerce':
        return [
          { label: 'Region: APAC', column: 'region', value: 'APAC' },
          { label: 'Region: EMEA', column: 'region', value: 'EMEA' },
          { label: 'Region: North America', column: 'region', value: 'North America' },
          { label: 'Customer: VIP Tier', column: 'customer_tier', value: 'VIP' },
          { label: 'Customer: Enterprise', column: 'customer_tier', value: 'Enterprise' },
          { label: 'Status: Delivered', column: 'fulfillment_status', value: 'Delivered' }
        ];
      case 'churn':
        return [
          { label: 'Risk: Critical Severity', column: 'churn_risk', value: 'Critical' },
          { label: 'Risk: High Alert', column: 'churn_risk', value: 'High' },
          { label: 'Plan: Enterprise Tier', column: 'plan_tier', value: 'Enterprise' },
          { label: 'Plan: Growth Plan', column: 'plan_tier', value: 'Growth' },
          { label: 'Health: Under 50 Index', column: 'health_score', value: '50', op: '<' }
        ];
      case 'webvitals':
        return [
          { label: 'Device: Mobile Only', column: 'device_type', value: 'Mobile' },
          { label: 'Device: Desktop Workstations', column: 'device_type', value: 'Desktop' },
          { label: 'SLA: Poor Performance', column: 'vital_rating', value: 'Poor' },
          { label: 'Network: 4G Cellular', column: 'network_type', value: '4G' },
          { label: 'Network: 5G Ultra', column: 'network_type', value: '5G' }
        ];
      default:
        return [];
    }
  };

  const options = getFilterOptions();
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
