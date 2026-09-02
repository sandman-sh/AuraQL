import React, { useState } from 'react';
import { BarChart3, LineChart, PieChart, Sparkles, Maximize2, Download, RefreshCw } from 'lucide-react';
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

  // Extract keys
  const xKey = config.xAxis;
  const yKey = config.yAxis;

  // Aggregate or take top 10 items for visual clarity
  const chartItems = data.slice(0, 10).map((row) => ({
    label: String(row[xKey] ?? 'Unknown'),
    value: Number(row[yKey] ?? 0)
  }));

  const maxValue = Math.max(...chartItems.map((d) => d.value), 1);

  // Palette colors
  const purplePalette = ['#C084FC', '#A855F7', '#9333EA', '#7E22CE', '#6B21A8', '#581C87', '#3B0764', '#818CF8', '#00F0FF', '#10B981'];

  return (
    <div className={`glass-card rounded-2xl p-6 border transition-all duration-500 relative ${
      isAgentUpdated ? 'border-brand-500 ring-2 ring-brand-500/40 glow-purple-md' : 'border-white/[0.08]'
    }`}>
      {/* Agent Commanded Glow Banner */}
      {isAgentUpdated && (
        <div className="absolute -top-3 left-6 px-3 py-0.5 rounded-full bg-brand-600 text-white text-[11px] font-mono font-semibold flex items-center gap-1.5 shadow-lg shadow-brand-600/40 animate-pulse">
          <Sparkles className="w-3 h-3 text-amber-300" />
          <span>WebMCP Commanded: Live Render</span>
        </div>
      )}

      {/* Viewport Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-white tracking-tight">{config.title}</h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-brand-950 text-brand-300 border border-brand-500/30">
              {config.type.toUpperCase()}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">
            Axis: X [{xKey}] &nbsp;•&nbsp; Y [{yKey}] &nbsp;•&nbsp; {chartItems.length} categories plotted
          </p>
        </div>

        {/* Chart Type Selector */}
        <div className="flex items-center gap-1 bg-dark-950/80 p-1 rounded-xl border border-white/[0.08]">
          <button
            onClick={() => onTypeChange('bar')}
            className={`p-1.5 rounded-lg text-xs transition-colors ${config.type === 'bar' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'}`}
            title="Bar Chart"
          >
            <BarChart3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onTypeChange('area')}
            className={`p-1.5 rounded-lg text-xs transition-colors ${config.type === 'area' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'}`}
            title="Area / Line Chart"
          >
            <LineChart className="w-4 h-4" />
          </button>
          <button
            onClick={() => onTypeChange('donut')}
            className={`p-1.5 rounded-lg text-xs transition-colors ${config.type === 'donut' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'}`}
            title="Donut Distribution"
          >
            <PieChart className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="h-[280px] w-full flex items-end justify-center relative pt-4 pb-8">
        {chartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-slate-500 font-mono text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mb-2 text-brand-500" />
            <span>Awaiting query data stream...</span>
          </div>
        ) : config.type === 'bar' ? (
          // Bar Chart Rendering
          <div className="w-full h-full flex items-end justify-between gap-3 px-2">
            {chartItems.map((item, idx) => {
              const heightPct = Math.max(8, (item.value / maxValue) * 100);
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
                    <div className="absolute -top-12 z-20 px-2.5 py-1 rounded-lg bg-dark-950 border border-brand-500/50 text-[11px] font-mono text-white shadow-xl whitespace-nowrap">
                      <span className="text-brand-300 font-bold">{item.label}</span>: {item.value.toLocaleString()}
                    </div>
                  )}

                  {/* Bar element */}
                  <div
                    style={{ height: `${heightPct}%` }}
                    className={`w-full rounded-t-lg transition-all duration-300 relative overflow-hidden ${
                      isHovered
                        ? 'bg-gradient-to-t from-brand-700 via-brand-500 to-purple-300 shadow-lg shadow-brand-500/50'
                        : 'bg-gradient-to-t from-purple-900/80 via-brand-600 to-brand-400'
                    }`}
                  >
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>

                  {/* Label */}
                  <span className="text-[10px] font-mono text-slate-400 mt-2 truncate w-full text-center">
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        ) : config.type === 'area' ? (
          // Area & Line Chart Rendering
          <div className="w-full h-full relative flex flex-col justify-end">
            <svg viewBox="0 0 500 150" preserveAspectRatio="none" className="w-full h-[220px] overflow-visible">
              <defs>
                <linearGradient id="areaGlow" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#A855F7" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#A855F7" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Area fill */}
              <polygon
                points={`0,150 ${chartItems
                  .map((item, i) => {
                    const x = (i / (chartItems.length - 1 || 1)) * 500;
                    const y = 150 - (item.value / maxValue) * 130;
                    return `${x},${y}`;
                  })
                  .join(' ')} 500,150`}
                fill="url(#areaGlow)"
              />

              {/* Polyline stroke */}
              <polyline
                fill="none"
                stroke="#C084FC"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={chartItems
                  .map((item, i) => {
                    const x = (i / (chartItems.length - 1 || 1)) * 500;
                    const y = 150 - (item.value / maxValue) * 130;
                    return `${x},${y}`;
                  })
                  .join(' ')}
              />

              {/* Coordinates dots */}
              {chartItems.map((item, i) => {
                const x = (i / (chartItems.length - 1 || 1)) * 500;
                const y = 150 - (item.value / maxValue) * 130;
                return (
                  <circle
                    key={i}
                    cx={x}
                    cy={y}
                    r={hoveredIndex === i ? 6 : 4}
                    fill="#F8FAFC"
                    stroke="#9333EA"
                    strokeWidth="2.5"
                    className="cursor-pointer transition-all"
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />
                );
              })}
            </svg>

            {/* Labels below */}
            <div className="flex justify-between w-full mt-2 text-[10px] font-mono text-slate-400">
              {chartItems.map((item, idx) => (
                <span key={idx} className="truncate max-w-[50px] text-center">
                  {item.label}
                </span>
              ))}
            </div>
          </div>
        ) : (
          // Donut Chart Rendering
          <div className="w-full h-full flex items-center justify-center gap-8">
            <div className="relative w-44 h-44">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                {(() => {
                  let accumulatedPercent = 0;
                  const total = chartItems.reduce((acc, curr) => acc + curr.value, 0) || 1;
                  return chartItems.slice(0, 6).map((item, i) => {
                    const percent = (item.value / total) * 100;
                    const strokeDasharray = `${percent} ${100 - percent}`;
                    const strokeDashoffset = -accumulatedPercent;
                    accumulatedPercent += percent;
                    return (
                      <circle
                        key={i}
                        cx="50"
                        cy="50"
                        r="38"
                        fill="transparent"
                        stroke={purplePalette[i % purplePalette.length]}
                        strokeWidth="14"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        className="transition-all hover:stroke-white cursor-pointer"
                        pathLength="100"
                        onMouseEnter={() => setHoveredIndex(i)}
                        onMouseLeave={() => setHoveredIndex(null)}
                      />
                    );
                  });
                })()}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Total</span>
                <span className="text-sm font-bold text-white font-mono">
                  {chartItems.reduce((acc, curr) => acc + curr.value, 0).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-col gap-1.5 max-h-[200px] overflow-y-auto pr-2">
              {chartItems.slice(0, 6).map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-xs font-mono">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: purplePalette[i % purplePalette.length] }} />
                  <span className="text-slate-300 truncate max-w-[100px]">{item.label}</span>
                  <span className="text-slate-500 font-bold ml-auto">{item.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
