import React, { useState } from 'react';
import { BarChart3, LineChart, PieChart, Sparkles, RefreshCw } from 'lucide-react';
import { ChartConfig, ChartType } from '../../types';

interface ChartViewportProps {
  config: ChartConfig;
  data: Record<string, any>[];
  onTypeChange: (type: ChartType) => void;
  isAgentUpdated?: boolean;
}

export const ChartViewport: React.FC<ChartViewportProps> = ({
  config,
  data,
  onTypeChange,
  isAgentUpdated
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const xKey = config.xAxis || '';
  const yKey = config.yAxis || '';

  // Filter and map real data safely (prevent NaN)
  const chartItems = (data || []).slice(0, 10).map((row) => {
    const rawVal = Number(row[yKey]);
    return {
      label: String(row[xKey] ?? 'Item'),
      value: isNaN(rawVal) ? 0 : rawVal
    };
  });

  const numericValues = chartItems.map((d) => d.value).filter((v) => !isNaN(v));
  const maxValue = numericValues.length > 0 ? Math.max(...numericValues, 1) : 1;
  const purplePalette = ['#C084FC', '#A855F7', '#9333EA', '#7E22CE', '#6B21A8', '#581C87', '#3B0764', '#818CF8', '#00F0FF', '#10B981'];

  return (
    <div
      className={`glass-card rounded-none p-5 border transition-all duration-300 relative ${
        isAgentUpdated
          ? 'border-brand-500 ring-1 ring-brand-500/50 glow-purple-md'
          : 'border-slate-200 dark:border-white/[0.08]'
      }`}
    >
      {/* Agent Commanded Banner */}
      {isAgentUpdated && (
        <div className="absolute -top-3 left-4 px-2.5 py-0.5 rounded-none bg-brand-600 text-white text-[10px] font-mono font-bold flex items-center gap-1.5 shadow-md shadow-brand-600/50 border border-brand-300/40">
          <Sparkles className="w-3 h-3 text-amber-300" />
          <span>WEBMCP COMMAND: ACTIVE VIEWPORT UPDATE</span>
        </div>
      )}

      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-white font-mono tracking-tight">
              {config.title || 'Chart Viewport'}
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-none bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 border border-brand-200 dark:border-brand-500/30 font-semibold">
              {config.type.toUpperCase()}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
            X-Axis: [{xKey || 'auto'}] &nbsp;•&nbsp; Y-Axis: [{yKey || 'auto'}] &nbsp;•&nbsp;{' '}
            {chartItems.length} active data points
          </p>
        </div>

        {/* Chart Type Toggles */}
        <div className="flex items-center bg-slate-100 dark:bg-dark-950 border border-slate-200 dark:border-white/[0.08] p-0.5 rounded-none">
          <button
            onClick={() => onTypeChange('bar')}
            className={`p-1.5 rounded-none text-xs transition-colors ${
              config.type === 'bar'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Bar Visualization"
          >
            <BarChart3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onTypeChange('area')}
            className={`p-1.5 rounded-none text-xs transition-colors ${
              config.type === 'area'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Area / Line Visualization"
          >
            <LineChart className="w-4 h-4" />
          </button>
          <button
            onClick={() => onTypeChange('donut')}
            className={`p-1.5 rounded-none text-xs transition-colors ${
              config.type === 'donut'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Donut Distribution"
          >
            <PieChart className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="h-[240px] w-full flex items-end justify-center relative pt-2 pb-6">
        {chartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-slate-500 font-mono text-xs">
            <RefreshCw className="w-5 h-5 animate-spin mb-2 text-brand-500" />
            <span>AuraQL query stream pending or table empty...</span>
          </div>
        ) : config.type === 'bar' ? (
          // Sharp Bar Chart
          <div className="w-full h-full flex items-end justify-between gap-2.5 px-2">
            {chartItems.map((item, idx) => {
              const safeVal = Math.max(0, item.value);
              const heightPct = Math.max(8, Math.min(100, (safeVal / maxValue) * 100));
              const isHovered = hoveredIndex === idx;
              return (
                <div
                  key={idx}
                  className="flex-1 h-full flex flex-col justify-end items-center group relative cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  {/* Tooltip */}
                  {isHovered && (
                    <div className="absolute -top-11 z-20 px-2 py-0.5 rounded-none bg-slate-900 dark:bg-dark-950 border border-brand-500 text-[10px] font-mono text-white shadow-xl whitespace-nowrap">
                      <span className="text-brand-400 font-bold">{item.label}</span>: {item.value.toLocaleString()}
                    </div>
                  )}

                  {/* Sharp Bar element */}
                  <div
                    style={{ height: `${heightPct}%` }}
                    className={`w-full rounded-none transition-all duration-200 border-t border-brand-300/40 relative ${
                      isHovered
                        ? 'bg-gradient-to-t from-brand-700 via-brand-500 to-purple-300 shadow-lg shadow-brand-500/50'
                        : 'bg-gradient-to-t from-purple-900/60 dark:from-purple-950 via-brand-600 dark:via-brand-700 to-brand-500'
                    }`}
                  >
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>

                  <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400 mt-2 truncate w-full text-center">
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        ) : config.type === 'area' ? (
          // Sharp Area Chart
          <div className="w-full h-full relative flex flex-col justify-end">
            <svg viewBox="0 0 500 130" preserveAspectRatio="none" className="w-full h-[190px] overflow-visible">
              <defs>
                <linearGradient id="areaGlowSharp" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#A855F7" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#A855F7" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              <polygon
                points={`0,130 ${chartItems
                  .map((item, i) => {
                    const x = (i / (chartItems.length - 1 || 1)) * 500;
                    const safeVal = Math.max(0, item.value);
                    const y = 130 - (safeVal / maxValue) * 110;
                    return `${x},${isNaN(y) ? 130 : y}`;
                  })
                  .join(' ')} 500,130`}
                fill="url(#areaGlowSharp)"
              />

              <polyline
                fill="none"
                stroke="#9333EA"
                strokeWidth="2.5"
                strokeLinecap="square"
                strokeLinejoin="miter"
                points={chartItems
                  .map((item, i) => {
                    const x = (i / (chartItems.length - 1 || 1)) * 500;
                    const safeVal = Math.max(0, item.value);
                    const y = 130 - (safeVal / maxValue) * 110;
                    return `${x},${isNaN(y) ? 130 : y}`;
                  })
                  .join(' ')}
              />

              {chartItems.map((item, i) => {
                const x = (i / (chartItems.length - 1 || 1)) * 500;
                const safeVal = Math.max(0, item.value);
                const rawY = 130 - (safeVal / maxValue) * 110;
                const y = isNaN(rawY) ? 130 : rawY;
                return (
                  <rect
                    key={i}
                    x={x - 3}
                    y={y - 3}
                    width={6}
                    height={6}
                    fill={hoveredIndex === i ? '#9333EA' : '#00F0FF'}
                    stroke="#581C87"
                    strokeWidth="1.5"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />
                );
              })}
            </svg>

            <div className="flex justify-between w-full mt-2 text-[10px] font-mono text-slate-600 dark:text-slate-400">
              {chartItems.map((item, idx) => (
                <span key={idx} className="truncate max-w-[55px] text-center">
                  {item.label}
                </span>
              ))}
            </div>
          </div>
        ) : (
          // Donut Distribution
          <div className="w-full h-full flex items-center justify-center gap-8">
            <div className="relative w-40 h-40">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                {(() => {
                  let accumulatedPercent = 0;
                  const total = chartItems.reduce((acc, curr) => acc + Math.max(0, curr.value), 0) || 1;
                  return chartItems.slice(0, 6).map((item, i) => {
                    const safeVal = Math.max(0, item.value);
                    const percent = (safeVal / total) * 100;
                    const strokeDasharray = `${percent} ${100 - percent}`;
                    const strokeDashoffset = -accumulatedPercent;
                    accumulatedPercent += percent;
                    return (
                      <circle
                        key={i}
                        cx="50"
                        cy="50"
                        r="38"
                        pathLength={100}
                        fill="transparent"
                        stroke={purplePalette[i % purplePalette.length]}
                        strokeWidth="15"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        className="transition-all hover:stroke-brand-500 cursor-pointer"
                        onMouseEnter={() => setHoveredIndex(i)}
                        onMouseLeave={() => setHoveredIndex(null)}
                      />
                    );
                  });
                })()}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-[10px] font-mono text-slate-400">Total</span>
                <span className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                  {chartItems.reduce((acc, curr) => acc + Math.max(0, curr.value), 0).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-col gap-1.5 font-mono text-xs max-h-36 overflow-y-auto">
              {chartItems.slice(0, 6).map((item, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-2 cursor-pointer transition-colors ${
                    hoveredIndex === idx ? 'text-brand-600 dark:text-brand-400 font-bold' : 'text-slate-600 dark:text-slate-400'
                  }`}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-none shrink-0"
                    style={{ backgroundColor: purplePalette[idx % purplePalette.length] }}
                  />
                  <span className="truncate max-w-[100px]">{item.label}</span>
                  <span className="text-[10px] text-slate-400 tabular-nums">
                    ({item.value.toLocaleString()})
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
