import React, { useState, useRef } from 'react';
import { BarChart3, LineChart, PieChart, Sparkles, RefreshCw, Palette, Download, Maximize2, Layers } from 'lucide-react';
import { ChartConfig, ChartType } from '../../types';

interface ChartViewportProps {
  config: ChartConfig;
  data: Record<string, any>[];
  onTypeChange: (type: ChartType) => void;
  isAgentUpdated?: boolean;
}

type ColorTheme = 'violet' | 'emerald' | 'cyan' | 'sunset';

const THEME_PALETTES: Record<ColorTheme, { primary: string; secondary: string; glow: string; text: string; gradient: [string, string]; palette: string[] }> = {
  violet: {
    primary: '#A855F7',
    secondary: '#C084FC',
    glow: 'rgba(168, 85, 247, 0.35)',
    text: 'text-purple-400',
    gradient: ['#A855F7', '#6366F1'],
    palette: ['#C084FC', '#A855F7', '#818CF8', '#6366F1', '#4F46E5', '#9333EA', '#7E22CE', '#3B82F6']
  },
  emerald: {
    primary: '#10B981',
    secondary: '#34D399',
    glow: 'rgba(16, 185, 129, 0.35)',
    text: 'text-emerald-400',
    gradient: ['#10B981', '#059669'],
    palette: ['#34D399', '#10B981', '#059669', '#047857', '#065F46', '#2DD4BF', '#14B8A6', '#0D9488']
  },
  cyan: {
    primary: '#06B6D4',
    secondary: '#22D3EE',
    glow: 'rgba(6, 182, 212, 0.35)',
    text: 'text-cyan-400',
    gradient: ['#22D3EE', '#0284C7'],
    palette: ['#22D3EE', '#06B6D4', '#0EA5E9', '#0284C7', '#38BDF8', '#7DD3FC', '#0369A1', '#075985']
  },
  sunset: {
    primary: '#F59E0B',
    secondary: '#F97316',
    glow: 'rgba(245, 158, 11, 0.35)',
    text: 'text-amber-400',
    gradient: ['#F59E0B', '#EF4444'],
    palette: ['#FCD34D', '#F59E0B', '#F97316', '#EF4444', '#DC2626', '#FB923C', '#EA580C', '#C2410C']
  }
};

/**
 * Computes smooth Catmull-Rom to Cubic Bezier curve paths
 */
function computeCubicSpline(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

    const cp1x = p1.x + (p2.x - p0.x) / 5.5;
    const cp1y = p1.y + (p2.y - p0.y) / 5.5;
    const cp2x = p2.x - (p3.x - p1.x) / 5.5;
    const cp2y = p2.y - (p3.y - p1.y) / 5.5;

    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

export const ChartViewport: React.FC<ChartViewportProps> = ({
  config,
  data,
  onTypeChange,
  isAgentUpdated
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [colorTheme, setColorTheme] = useState<ColorTheme>('violet');
  const [showThemePicker, setShowThemePicker] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const xKey = config.xAxis || '';
  const yKey = config.yAxis || '';

  // Filter and map real data safely (prevent NaN, prevent null rows)
  const validData = (data || []).filter((r) => r && typeof r === 'object');
  const chartItems = validData.slice(0, 12).map((row) => {
    const rawVal = Number(row[yKey]);
    return {
      label: String(row[xKey] ?? 'Item'),
      value: isNaN(rawVal) ? 0 : rawVal
    };
  });

  const numericValues = chartItems.map((d) => d.value).filter((v) => !isNaN(v) && isFinite(v));
  const maxValue = numericValues.length > 0 ? Math.max(...numericValues, 1) : 1;
  const minValue = numericValues.length > 0 ? Math.min(...numericValues, 0) : 0;
  const totalValue = chartItems.reduce((acc, curr) => acc + Math.max(0, curr.value), 0);
  const avgValue = chartItems.length > 0 ? totalValue / chartItems.length : 0;

  const activeTheme = THEME_PALETTES[colorTheme];

  // Format large numbers for Y-axis and tooltips
  const formatCompact = (val: number) => {
    if (Math.abs(val) >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
    if (Math.abs(val) >= 1_000) return `$${(val / 1_000).toFixed(1)}k`;
    return Math.round(val).toLocaleString();
  };

  // Generate SVG coordinates for line/area chart (width: 600, height: 200, padding: 30)
  const svgWidth = 600;
  const svgHeight = 200;
  const padTop = 20;
  const padBottom = 30;
  const chartHeight = svgHeight - padTop - padBottom;

  const points = chartItems.map((item, i) => {
    const x = chartItems.length > 1 ? (i / (chartItems.length - 1)) * (svgWidth - 40) + 20 : svgWidth / 2;
    const norm = (Math.max(0, item.value) - Math.min(0, minValue)) / (maxValue - Math.min(0, minValue) || 1);
    const y = svgHeight - padBottom - norm * chartHeight;
    return { x, y: isNaN(y) ? svgHeight - padBottom : y, item, index: i };
  });

  const smoothCurve = computeCubicSpline(points);
  const areaClose = points.length > 0
    ? `${smoothCurve} L ${points[points.length - 1].x.toFixed(1)} ${svgHeight - padBottom} L ${points[0].x.toFixed(1)} ${svgHeight - padBottom} Z`
    : '';

  // SVG grid reference lines (4 horizontal bands)
  const gridBands = [1, 0.75, 0.5, 0.25, 0].map((frac) => ({
    val: frac * maxValue,
    y: padTop + (1 - frac) * chartHeight
  }));

  const activeHoverItem = hoveredIndex !== null ? chartItems[hoveredIndex] : null;

  return (
    <div
      className={`rounded-none p-4 sm:p-5 transition-all duration-300 relative w-full max-w-full overflow-hidden min-w-0 flex flex-col bg-white dark:bg-dark-950 ${
        isAgentUpdated
          ? 'ring-2 ring-brand-500/70 glow-purple-md'
          : ''
      }`}
    >
      {/* Agent Commanded Banner */}
      {isAgentUpdated && (
        <div className="absolute -top-3 left-4 px-2.5 py-0.5 rounded-none bg-brand-600 text-white text-[10px] font-mono font-bold flex items-center gap-1.5 shadow-md shadow-brand-600/50 border border-brand-300/40 z-10 animate-bounce">
          <Sparkles className="w-3 h-3 text-amber-300 shrink-0" />
          <span className="truncate">WEBMCP COMMAND: ACTIVE VIEWPORT MUTATION</span>
        </div>
      )}

      {/* Top Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3 pb-2.5 border-b border-slate-200 dark:border-white/[0.08] min-w-0 w-full">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white font-mono tracking-tight truncate min-w-0">
              {config.title || 'Analytics Viewport'}
            </h3>
            <span
              className="text-[9px] sm:text-[10px] font-mono px-1.5 sm:px-2 py-0.5 rounded-none font-bold uppercase tracking-wider border shadow-sm shrink-0"
              style={{
                backgroundColor: `${activeTheme.primary}18`,
                color: activeTheme.primary,
                borderColor: `${activeTheme.primary}40`
              }}
            >
              {config.type || 'bar'}
            </span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 flex items-center gap-1.5 truncate">
            <span className="truncate">Dim: <strong className="text-slate-700 dark:text-slate-200">{xKey || 'auto'}</strong></span>
            <span>•</span>
            <span className="truncate">Metric: <strong className="text-slate-700 dark:text-slate-200">{yKey || 'auto'}</strong></span>
            <span>•</span>
            <span className="shrink-0">{chartItems.length} pts</span>
          </p>
        </div>

        {/* Right Action Tools */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Palette Color Picker */}
          <div className="relative">
            <button
              onClick={() => setShowThemePicker(!showThemePicker)}
              className="p-1.5 rounded-none bg-slate-100 dark:bg-dark-900 hover:bg-slate-200 dark:hover:bg-dark-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 transition-colors"
              title="Change Color Theme"
            >
              <Palette className="w-3.5 h-3.5" />
            </button>
            {showThemePicker && (
              <div className="absolute right-0 top-full mt-1.5 p-2 bg-white dark:bg-dark-950 border border-slate-300 dark:border-white/15 shadow-xl z-30 flex gap-1.5 font-mono text-[10px]">
                {(['violet', 'emerald', 'cyan', 'sunset'] as ColorTheme[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setColorTheme(t);
                      setShowThemePicker(false);
                    }}
                    className={`px-2 py-1 rounded-none border text-xs capitalize flex items-center gap-1 ${
                      colorTheme === t
                        ? 'border-brand-500 font-bold bg-slate-100 dark:bg-dark-850'
                        : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-none inline-block shrink-0"
                      style={{ backgroundColor: THEME_PALETTES[t].primary }}
                    />
                    <span>{t}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Visualization Type Switcher */}
          <div className="flex items-center bg-slate-100 dark:bg-dark-950 border border-slate-200 dark:border-white/[0.08] p-0.5 rounded-none">
            <button
              onClick={() => onTypeChange('bar')}
              className={`p-1 sm:p-1.5 rounded-none text-xs transition-colors flex items-center gap-1 font-mono ${
                config.type === 'bar'
                  ? 'bg-slate-900 dark:bg-dark-800 text-white shadow-sm border border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Bar Chart"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span className="hidden md:inline text-[10px]">Bar</span>
            </button>
            <button
              onClick={() => onTypeChange('area')}
              className={`p-1 sm:p-1.5 rounded-none text-xs transition-colors flex items-center gap-1 font-mono ${
                config.type === 'area' || config.type === 'line'
                  ? 'bg-slate-900 dark:bg-dark-800 text-white shadow-sm border border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Smooth Spline Area Chart"
            >
              <LineChart className="w-3.5 h-3.5" />
              <span className="hidden md:inline text-[10px]">Area</span>
            </button>
            <button
              onClick={() => onTypeChange('donut')}
              className={`p-1 sm:p-1.5 rounded-none text-xs transition-colors flex items-center gap-1 font-mono ${
                config.type === 'donut'
                  ? 'bg-slate-900 dark:bg-dark-800 text-white shadow-sm border border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Donut Distribution"
            >
              <PieChart className="w-3.5 h-3.5" />
              <span className="hidden md:inline text-[10px]">Donut</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Canvas Area - Strict Boundary Containment */}
      <div className="relative min-h-[220px] flex-1 w-full max-w-full overflow-hidden flex items-center justify-center min-w-0">
        {chartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-slate-500 font-mono text-xs py-12">
            <RefreshCw className="w-5 h-5 animate-spin mb-2 text-brand-500" />
            <span>AuraQL query stream pending or table empty...</span>
          </div>
        ) : config.type === 'area' || config.type === 'line' ? (
          /* ══════════════════════════════════════════════════
             1. EXECUTIVE BEZIER SPLINE AREA / LINE CHART
             ══════════════════════════════════════════════════ */
          <div className="w-full h-full relative overflow-hidden min-w-0 flex flex-col justify-center">
            <svg
              ref={svgRef}
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-[220px] sm:h-[240px] overflow-hidden"
              preserveAspectRatio="xMidYMid meet"
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <defs>
                {/* Smooth Area Gradient Fill */}
                <linearGradient id={`areaGrad-${colorTheme}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={activeTheme.primary} stopOpacity="0.45" />
                  <stop offset="70%" stopColor={activeTheme.primary} stopOpacity="0.08" />
                  <stop offset="100%" stopColor={activeTheme.primary} stopOpacity="0.0" />
                </linearGradient>
                {/* Glow Filter */}
                <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Horizontal Dotted Grid Lines with Y-Axis Markers */}
              {gridBands.map((band, idx) => (
                <g key={idx} className="opacity-40">
                  <line
                    x1="20"
                    y1={band.y}
                    x2={svgWidth - 20}
                    y2={band.y}
                    stroke="currentColor"
                    strokeDasharray="3 3"
                    className="text-slate-300 dark:text-white/10"
                    strokeWidth="1"
                  />
                  <text
                    x="24"
                    y={band.y - 4}
                    fill="currentColor"
                    className="text-[9px] font-mono fill-slate-400 dark:fill-slate-500 font-semibold"
                  >
                    {formatCompact(band.val)}
                  </text>
                </g>
              ))}

              {/* Area Under Curve Fill */}
              {areaClose && (
                <path
                  d={areaClose}
                  fill={`url(#areaGrad-${colorTheme})`}
                  className="transition-all duration-300"
                />
              )}

              {/* Spline Stroke Curve */}
              <path
                d={smoothCurve}
                fill="none"
                stroke={activeTheme.primary}
                strokeWidth="2.5"
                filter="url(#neonGlow)"
                className="transition-all duration-300"
              />

              {/* Active Hover Crosshair Line */}
              {hoveredIndex !== null && points[hoveredIndex] && (
                <g>
                  <line
                    x1={points[hoveredIndex].x}
                    y1={padTop}
                    x2={points[hoveredIndex].x}
                    y2={svgHeight - padBottom}
                    stroke={activeTheme.primary}
                    strokeWidth="1.5"
                    strokeDasharray="4 2"
                    className="animate-pulse"
                  />
                  <circle
                    cx={points[hoveredIndex].x}
                    cy={points[hoveredIndex].y}
                    r="5"
                    fill="#FFFFFF"
                    stroke={activeTheme.primary}
                    strokeWidth="3"
                    className="shadow-md"
                  />
                </g>
              )}

              {/* Data Point Marker Nodes */}
              {points.map((pt, i) => (
                <circle
                  key={i}
                  cx={pt.x}
                  cy={pt.y}
                  r="3.5"
                  fill="#0F172A"
                  stroke={activeTheme.primary}
                  strokeWidth="2"
                  className="cursor-pointer hover:r-5 transition-all"
                  onMouseEnter={() => setHoveredIndex(i)}
                />
              ))}

              {/* Bottom X-Axis Labels */}
              {points.map((pt, i) => {
                if (points.length > 8 && i % 2 !== 0) return null; // Skip alternating labels on dense datasets
                return (
                  <text
                    key={i}
                    x={pt.x}
                    y={svgHeight - 10}
                    textAnchor="middle"
                    className="text-[9px] font-mono fill-slate-400 dark:fill-slate-500 select-none"
                  >
                    {pt.item.label.length > 8 ? `${pt.item.label.slice(0, 7)}…` : pt.item.label}
                  </text>
                );
              })}
            </svg>

            {/* Floating Glass Tooltip HUD - Fully Contained Inside Card */}
            {activeHoverItem && (
              <div className="absolute top-2 right-2 max-w-[calc(100%-1rem)] px-2.5 py-1 bg-slate-900/95 dark:bg-black/95 backdrop-blur-md border border-slate-700/80 rounded-none shadow-xl text-xs font-mono text-white flex items-center gap-2.5 pointer-events-none z-20 overflow-hidden">
                <div className="min-w-0">
                  <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Dim</span>
                  <span className="font-bold text-white truncate block max-w-[100px]">{activeHoverItem.label}</span>
                </div>
                <div className="h-5 w-[1px] bg-white/10 shrink-0" />
                <div className="shrink-0">
                  <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Value</span>
                  <span className={`font-extrabold ${activeTheme.text}`}>
                    {activeHoverItem.value.toLocaleString()}
                  </span>
                </div>
                <div className="hidden sm:block h-5 w-[1px] bg-white/10 shrink-0" />
                <div className="hidden sm:block shrink-0">
                  <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Share</span>
                  <span className="text-slate-300 font-bold">
                    {totalValue > 0 ? `${((activeHoverItem.value / totalValue) * 100).toFixed(1)}%` : '0%'}
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : config.type === 'bar' ? (
          /* ══════════════════════════════════════════════════
             2. EXECUTIVE HIGH-CONTRAST GRADIENT BAR CHART
             ══════════════════════════════════════════════════ */
          <div className="w-full h-[220px] sm:h-[240px] flex items-end justify-between gap-1 sm:gap-2 px-1 pt-6 pb-4 relative overflow-hidden min-w-0 max-w-full">
            {/* Horizontal Grid lines */}
            <div className="absolute inset-x-0 top-6 bottom-6 flex flex-col justify-between pointer-events-none opacity-30">
              {[0, 1, 2, 3].map((g) => (
                <div key={g} className="border-b border-dashed border-slate-300 dark:border-white/10 w-full" />
              ))}
            </div>

            {chartItems.map((item, idx) => {
              const safeVal = Math.max(0, item.value);
              const heightPct = Math.max(6, Math.min(100, (safeVal / maxValue) * 100));
              const isHovered = hoveredIndex === idx;

              return (
                <div
                  key={idx}
                  className="flex-1 min-w-0 h-full flex flex-col justify-end items-center group relative cursor-pointer z-10 overflow-hidden"
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  {/* Hover Tooltip Card */}
                  {isHovered && (
                    <div className="absolute -top-10 z-20 px-2 py-0.5 rounded-none bg-slate-900/95 dark:bg-black/95 backdrop-blur-md border border-slate-700 text-[9px] sm:text-[10px] font-mono text-white shadow-2xl whitespace-nowrap animate-fadeIn flex items-center gap-1.5 pointer-events-none max-w-[160px] truncate">
                      <span className="w-1.5 h-1.5 rounded-none shrink-0" style={{ backgroundColor: activeTheme.primary }} />
                      <span className="font-bold text-white truncate">{item.label}:</span>
                      <span className={`font-extrabold ${activeTheme.text} shrink-0`}>{item.value.toLocaleString()}</span>
                    </div>
                  )}

                  {/* Value Badge Pin on Hover */}
                  {isHovered && (
                    <span className="text-[9px] font-mono text-slate-400 mb-1 font-bold shrink-0">
                      {formatCompact(item.value)}
                    </span>
                  )}

                  {/* Bar Body */}
                  <div
                    style={{
                      height: `${heightPct}%`,
                      background: isHovered
                        ? `linear-gradient(to top, ${activeTheme.primary}, ${activeTheme.secondary})`
                        : `linear-gradient(to top, ${activeTheme.primary}40, ${activeTheme.primary})`
                    }}
                    className={`w-full transition-all duration-200 relative border-t-2 ${
                      isHovered ? 'shadow-lg' : ''
                    }`}
                  >
                    {/* Top Highlight Rim */}
                    <div className="h-0.5 w-full bg-white/40" />
                  </div>

                  {/* X-Axis Label - Truncated with min-w-0 to NEVER force width */}
                  <span className="text-[9px] sm:text-[10px] font-mono text-slate-600 dark:text-slate-400 mt-1.5 truncate w-full text-center block select-none px-0.5">
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          /* ══════════════════════════════════════════════════
             3. PRECISION DONUT DISTRIBUTION CHART
             ══════════════════════════════════════════════════ */
          <div className="w-full h-[220px] sm:h-[240px] flex flex-col sm:flex-row items-center justify-around gap-4 py-2 overflow-hidden min-w-0 max-w-full">
            {/* Donut SVG */}
            <div className="relative w-36 h-36 sm:w-44 sm:h-44 shrink-0 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                {(() => {
                  let accumulatedPercent = 0;
                  return chartItems.map((item, i) => {
                    const safeVal = Math.max(0, item.value);
                    const percent = totalValue > 0 ? (safeVal / totalValue) * 100 : 0;
                    const strokeDasharray = `${Math.max(0.5, percent)} ${100 - percent}`;
                    const strokeDashoffset = -accumulatedPercent;
                    accumulatedPercent += percent;
                    const color = activeTheme.palette[i % activeTheme.palette.length];
                    const isHovered = hoveredIndex === i;

                    return (
                      <circle
                        key={i}
                        cx="50"
                        cy="50"
                        r="36"
                        pathLength={100}
                        fill="transparent"
                        stroke={color}
                        strokeWidth={isHovered ? '16' : '13'}
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        className="transition-all duration-200 cursor-pointer"
                        onMouseEnter={() => setHoveredIndex(i)}
                        onMouseLeave={() => setHoveredIndex(null)}
                      />
                    );
                  });
                })()}
              </svg>

              {/* Center Metrics Readout */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none font-mono px-2">
                <span className="text-[9px] text-slate-400 uppercase tracking-widest truncate max-w-full">
                  {hoveredIndex !== null ? chartItems[hoveredIndex]?.label : 'Total'}
                </span>
                <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                  {hoveredIndex !== null
                    ? formatCompact(chartItems[hoveredIndex]?.value || 0)
                    : formatCompact(totalValue)}
                </span>
                <span className="text-[8px] sm:text-[9px] text-slate-400">
                  {hoveredIndex !== null && totalValue > 0
                    ? `${(((chartItems[hoveredIndex]?.value || 0) / totalValue) * 100).toFixed(1)}%`
                    : `${chartItems.length} items`}
                </span>
              </div>
            </div>

            {/* Interactive Legend Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1.5 font-mono text-xs max-h-40 sm:max-h-48 overflow-y-auto overflow-x-hidden w-full sm:max-w-xs min-w-0">
              {chartItems.slice(0, 8).map((item, idx) => {
                const color = activeTheme.palette[idx % activeTheme.palette.length];
                const pct = totalValue > 0 ? ((item.value / totalValue) * 100).toFixed(1) : '0';
                const isHovered = hoveredIndex === idx;

                return (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-1 border transition-colors cursor-pointer min-w-0 ${
                      isHovered
                        ? 'border-brand-500 bg-slate-100 dark:bg-dark-800'
                        : 'border-transparent hover:border-slate-300 dark:hover:border-white/10'
                    }`}
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    <div className="flex items-center gap-1.5 truncate min-w-0">
                      <span className="w-2 h-2 rounded-none shrink-0" style={{ backgroundColor: color }} />
                      <span className="truncate text-[11px] text-slate-700 dark:text-slate-300 font-semibold">{item.label}</span>
                    </div>
                    <span className="text-[9px] sm:text-[10px] text-slate-400 tabular-nums ml-1.5 shrink-0">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bottom KPI Highlights Bar - Contained with Flexible Wrap */}
      <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-white/[0.08] flex flex-wrap items-center justify-between gap-2.5 font-mono text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 w-full max-w-full overflow-hidden min-w-0">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 min-w-0">
          <div className="truncate">
            <span>Peak: </span>
            <strong className="text-slate-900 dark:text-white font-bold">{formatCompact(maxValue)}</strong>
          </div>
          <div className="truncate">
            <span>Avg: </span>
            <strong className="text-slate-900 dark:text-white font-bold">{formatCompact(avgValue)}</strong>
          </div>
          <div className="truncate">
            <span>Total: </span>
            <strong className="text-slate-900 dark:text-white font-bold">{formatCompact(totalValue)}</strong>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-[9px] sm:text-[10px] shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Real-time Vector Render</span>
        </div>
      </div>
    </div>
  );
};
