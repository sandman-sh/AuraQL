import React from 'react';
import { DollarSign, Percent, Activity, Zap } from 'lucide-react';
import { auraEngine } from '../../engine/auraql';

interface MetricCardsProps {
  tableName: string;
}

export const MetricCards: React.FC<MetricCardsProps> = ({ tableName }) => {
  const live = auraEngine.computeLiveMetrics(tableName);

  const cards = [
    { ...(live?.metric1 || { title: 'Total Records', value: '0', sub: '', sparkline: [0, 0] }), id: 'm1', icon: DollarSign },
    { ...(live?.metric2 || { title: 'Columns', value: '0', sub: '', sparkline: [0, 0] }), id: 'm2', icon: Percent },
    { ...(live?.metric3 || { title: 'Attributes', value: '0', sub: '', sparkline: [0, 0] }), id: 'm3', icon: Activity },
    { ...(live?.metric4 || { title: 'Categories', value: '0', sub: '', sparkline: [0, 0] }), id: 'm4', icon: Zap }
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
        <polyline
          fill="none"
          stroke="#A855F7"
          strokeWidth="2"
          strokeLinecap="square"
          strokeLinejoin="miter"
          points={coords}
        />
      </svg>
    );
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {cards.map((m) => {
        const Icon = m.icon;
        return (
          <div
            key={m.id}
            className="glass-card rounded-none p-4 border border-slate-200 dark:border-white/[0.08] relative overflow-hidden group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400 font-medium">
                {m.title}
              </span>
              <div className="p-1.5 rounded-none bg-brand-50 dark:bg-brand-950/80 border border-brand-200 dark:border-brand-500/30 text-brand-600 dark:text-brand-400">
                <Icon className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white font-mono">
                {m.value}
              </span>
              <div className="h-6 flex items-center">{renderSparkline(m.sparkline)}</div>
            </div>

            <div className="mt-2 text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate">
              {m.sub}
            </div>

            {/* Micro accent border on hover */}
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-brand-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        );
      })}
    </div>
  );
};
