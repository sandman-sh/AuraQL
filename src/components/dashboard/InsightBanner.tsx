import React, { useMemo } from 'react';
import { TrendingUp, ArrowRight, Sparkles, Database } from 'lucide-react';
import { auraEngine } from '../../engine/auraql';
import { DATASETS_METADATA } from '../../engine/datasets';

interface InsightBannerProps {
  dataset: string;
  onActionClick: (sql: string) => void;
}

export const InsightBanner: React.FC<InsightBannerProps> = ({ dataset, onActionClick }) => {
  const insight = useMemo(() => {
    if (!dataset) return null;
    const rows = auraEngine.getTableData(dataset);
    if (rows.length === 0) return null;

    const meta = DATASETS_METADATA[dataset];
    const firstRow = rows[0];
    const numericCols = Object.keys(firstRow).filter((k) => typeof firstRow[k] === 'number');
    const stringCols = Object.keys(firstRow).filter(
      (k) => typeof firstRow[k] === 'string' && !k.toLowerCase().includes('id')
    );

    const primaryMetric = numericCols[0];
    const primaryDim = stringCols[0];

    if (primaryMetric && primaryDim) {
      // Find top dimension by primary metric sum
      const dimSums = new Map<string, number>();
      for (const r of rows) {
        const d = String(r[primaryDim] ?? 'Other');
        const v = Number(r[primaryMetric]) || 0;
        dimSums.set(d, (dimSums.get(d) || 0) + v);
      }

      let topDim = '';
      let maxVal = -Infinity;
      for (const [d, sum] of dimSums.entries()) {
        if (sum > maxVal) {
          maxVal = sum;
          topDim = d;
        }
      }

      const totalVal = rows.reduce((s, r) => s + (Number(r[primaryMetric]) || 0), 0);
      const sharePct = totalVal > 0 ? ((maxVal / totalVal) * 100).toFixed(1) : '0';

      return {
        badge: 'Automated Columnar Insight',
        icon: TrendingUp,
        color: 'text-emerald-600 dark:text-emerald-400',
        border: 'border-emerald-500/30',
        bg: 'bg-emerald-50 dark:bg-emerald-950/40',
        title: `Top Segment in ${dataset}: "${topDim}" leads ${primaryMetric}`,
        desc: `"${topDim}" accounts for ${sharePct}% of total ${primaryMetric} ($${Math.round(maxVal).toLocaleString()}) across ${rows.length} ingested records.`,
        actionText: `Filter by "${topDim}"`,
        sql: `SELECT ${primaryDim}, ROUND(SUM(${primaryMetric}), 2) as total_${primaryMetric} FROM ${dataset} GROUP BY ${primaryDim} ORDER BY total_${primaryMetric} DESC;`
      };
    }

    return {
      badge: 'Columnar Buffer Active',
      icon: Database,
      color: 'text-brand-600 dark:text-brand-400',
      border: 'border-brand-500/30',
      bg: 'bg-brand-50 dark:bg-brand-950/40',
      title: `${rows.length} Records Loaded into Memory`,
      desc: `Table "${dataset}" with ${Object.keys(firstRow).length} attributes is ready for analytical queries and real WebMCP agent calls.`,
      actionText: 'View First 25 Rows',
      sql: `SELECT * FROM ${dataset} LIMIT 25;`
    };
  }, [dataset]);

  if (!insight) return null;
  const Icon = insight.icon;

  return (
    <div
      className={`p-3.5 border ${insight.border} ${insight.bg} rounded-none flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all`}
    >
      <div className="flex items-start gap-3 min-w-0">
        <div className="w-7 h-7 shrink-0 rounded-none bg-white dark:bg-dark-900 border border-slate-200 dark:border-white/10 flex items-center justify-center shadow-sm">
          <Icon className={`w-3.5 h-3.5 ${insight.color}`} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${insight.color}`}>
              {insight.badge}
            </span>
            <span className="text-slate-400 dark:text-slate-600">•</span>
            <span className="text-xs font-bold text-slate-900 dark:text-white font-mono truncate">
              {insight.title}
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 font-sans leading-normal">
            {insight.desc}
          </p>
        </div>
      </div>

      <button
        onClick={() => onActionClick(insight.sql)}
        className="btn-sharp shrink-0 px-3 py-1.5 bg-white dark:bg-dark-900 hover:bg-slate-50 dark:hover:bg-dark-850 text-slate-800 dark:text-white text-xs font-mono font-semibold border border-slate-300 dark:border-white/10 hover:border-brand-500/50 flex items-center gap-1.5 shadow-sm transition-all"
      >
        <span>{insight.actionText}</span>
        <ArrowRight className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
      </button>
    </div>
  );
};
