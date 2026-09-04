import React from 'react';
import { X, Sparkles, ArrowRight, BarChart2, TrendingUp, Cloud, Database } from 'lucide-react';

interface DemoDatasetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDataset: (tableName: string) => void;
}

export const DemoDatasetModal: React.FC<DemoDatasetModalProps> = ({
  isOpen,
  onClose,
  onSelectDataset
}) => {
  if (!isOpen) return null;

  const demoDatasets = [
    {
      key: 'ecommerce_sales',
      title: 'E-Commerce Sales',
      icon: '🛒',
      rows: '15 records',
      desc: 'Order velocity, product line items, gross margin %, regional segments',
      badge: 'Relational & Join'
    },
    {
      key: 'saas_churn_metrics',
      title: 'SaaS Account Churn',
      icon: '📈',
      rows: '10 records',
      desc: 'B2B subscription health, seat utilization, NPS satisfaction, churn risk tiers',
      badge: 'Cohort & ML'
    },
    {
      key: 'cloud_software_financials',
      title: 'Cloud Software Comps',
      icon: '☁️',
      rows: '8 records',
      desc: 'Public cloud software metrics: quarterly revenue ($M), YoY growth, margins',
      badge: 'Financial Comps'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-dark-950 border-2 border-black dark:border-purple-500/70 shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-dark-900 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-brand-600 text-white shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white font-mono">
                Select Demo Dataset to Test
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-sans">
                Choose a pre-configured scenario to test sub-10ms SQL & WebMCP tools:
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dataset Cards */}
        <div className="p-4 space-y-2.5 font-mono text-xs">
          {demoDatasets.map((ds) => (
            <div
              key={ds.key}
              onClick={() => {
                onSelectDataset(ds.key);
                onClose();
              }}
              className="p-3.5 bg-white dark:bg-dark-900/90 border border-slate-200 dark:border-white/10 hover:border-brand-500 dark:hover:border-purple-500/80 hover:shadow-md cursor-pointer transition-all group flex items-center justify-between"
            >
              <div className="min-w-0 flex-1 pr-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base">{ds.icon}</span>
                  <span className="font-bold text-xs text-slate-900 dark:text-white font-mono group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors truncate">
                    {ds.title}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 font-semibold border border-brand-200 dark:border-brand-500/30">
                    {ds.badge}
                  </span>
                  <span className="text-[10px] text-slate-400 font-sans">
                    ({ds.rows})
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-sans line-clamp-1">
                  {ds.desc}
                </p>
              </div>

              <button
                type="button"
                className="px-3 py-1.5 text-[11px] font-mono bg-brand-600 hover:bg-brand-500 text-white transition-colors shrink-0 flex items-center gap-1 font-bold shadow-sm"
              >
                <span>Load</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-dark-900/80 flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
          <span>Engine: Columnar Vectorized Heap</span>
          <button
            onClick={onClose}
            className="text-slate-600 dark:text-slate-300 hover:underline"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
