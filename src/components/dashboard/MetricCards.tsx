import React from 'react';
import { DollarSign, Percent, Activity, Zap } from 'lucide-react';
import { auraEngine } from '../../engine/auraql';

interface MetricCardsProps {
  tableName: string;
}

export const MetricCards: React.FC<MetricCardsProps> = ({ tableName }) => {
  const live = auraEngine.computeLiveMetrics(tableName);

  const cards = [
    { ...live.metric1, id: 'm1', icon: DollarSign },
    { ...live.metric2, id: 'm2', icon: Percent },
    { ...live.metric3, id: 'm3', icon: Activity },
    { ...live.metric4, id: 'm4', icon: Zap }
  ];

  const renderSparkline = (points: number[]) => {
    if (!points || points.length < 2) return null;
    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;
    const width = 76;
    const height = 22;

    const coords = points.map((p, i) => {
      const x = (i / (points.length - 1)) * width;
      const y = height - ((p - min) / range) * (height - 6) - 3;
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
            className="glass-card rounded-none p-4 border border-slate-200 dark:border-white/[0.08] relative group overflow-hidden transition-all duration-200 hover:border-brand-500/50"
          >
            {/* Ambient purple background hover glow */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-600/10 blur-xl group-hover:bg-brand-500/20 transition-all pointer-events-none" />

            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400">{m.title}</span>
              <div className="w-7 h-7 rounded-none bg-brand-50 dark:bg-brand-950/80 border border-brand-200 dark:border-brand-500/30 flex items-center justify-center text-brand-600 dark:text-brand-400">
                <Icon className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="flex items-baseline justify-between gap-2 mb-2">
              <span className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight font-mono tabular-nums">
                {m.value}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-none bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 border border-brand-200 dark:border-brand-500/30 font-bold">
                LIVE
              </span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-white/[0.06] text-[11px] font-mono text-slate-500 dark:text-slate-400">
              <span className="truncate max-w-[150px]">{m.sub}</span>
              <div className="shrink-0">{renderSparkline(m.sparkline)}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
