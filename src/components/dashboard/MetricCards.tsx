import React from 'react';
import { DollarSign, Percent, Activity, Zap, TrendingUp } from 'lucide-react';
import { auraEngine } from '../../engine/auraql';

interface MetricCardsProps {
  tableName: string;
}

export const MetricCards: React.FC<MetricCardsProps> = ({ tableName }) => {
  const live = auraEngine.computeLiveMetrics(tableName);

  const cards = [
    { ...(live?.metric1 || { title: 'Total Records', value: '0', sub: '', sparkline: [0, 0] }), id: 'm1', icon: DollarSign, trend: '+14.2%', trendUp: true },
    { ...(live?.metric2 || { title: 'Columns', value: '0', sub: '', sparkline: [0, 0] }), id: 'm2', icon: Percent, trend: 'Optimal', trendUp: true },
    { ...(live?.metric3 || { title: 'Attributes', value: '0', sub: '', sparkline: [0, 0] }), id: 'm3', icon: Activity, trend: 'Live Feed', trendUp: true },
    { ...(live?.metric4 || { title: 'Categories', value: '0', sub: '', sparkline: [0, 0] }), id: 'm4', icon: Zap, trend: 'Indexed', trendUp: true }
  ];

  const renderSparkline = (points: number[]) => {
    if (!points || !Array.isArray(points)) return null;
    const valid = points.filter((p) => typeof p === 'number' && !isNaN(p) && isFinite(p));
    if (valid.length < 2) return null;
    const min = Math.min(...valid);
    const max = Math.max(...valid);
    const range = max - min || 1;
    const width = 76;
    const height = 22;

    const coords = valid.map((p, i) => {
      const x = (i / (valid.length - 1)) * width;
      const rawY = height - ((p - min) / range) * (height - 6) - 3;
      const y = isNaN(rawY) ? height / 2 : rawY;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg width={width} height={height} className="overflow-visible">
        <defs>
          <linearGradient id="sparklineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#A855F7" />
            <stop offset="100%" stopColor="#00F0FF" />
          </linearGradient>
        </defs>
        <polyline
          fill="none"
          stroke="url(#sparklineGrad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={coords}
        />
      </svg>
    );
  };

  return (
    <div className="p-4 sm:p-5 bg-white dark:bg-dark-950 w-full max-w-full overflow-hidden min-w-0">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5 min-w-0">
        {cards.map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.id}
              className="bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-white/[0.08] p-4 relative overflow-hidden group hover:border-brand-500/50 transition-all shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400 font-medium">
                  {m.title}
                </span>
                <div className="p-1.5 rounded-none bg-brand-50 dark:bg-brand-950/80 border border-brand-200 dark:border-brand-500/30 text-brand-600 dark:text-brand-400">
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="flex items-baseline justify-between gap-2">
                <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white font-mono truncate">
                  {m.value}
                </span>
                <div className="h-6 flex items-center shrink-0">{renderSparkline(m.sparkline)}</div>
              </div>

              <div className="mt-2.5 flex items-center justify-between text-[10px] font-mono border-t border-slate-200/60 dark:border-white/[0.05] pt-1.5">
                <span className="text-slate-500 dark:text-slate-400 truncate max-w-[120px]">
                  {m.sub}
                </span>
                <span className="px-1.5 py-0.5 rounded-none bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 font-bold flex items-center gap-0.5">
                  <TrendingUp className="w-2.5 h-2.5" />
                  <span>{m.trend}</span>
                </span>
              </div>

              {/* Accent micro-bar on hover */}
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-brand-600 via-brand-400 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          );
        })}
      </div>
    </div>
  );
};
