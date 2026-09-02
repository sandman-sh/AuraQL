import React from 'react';
import { Database, Upload, Activity, Home, ChevronDown, Sparkles, Terminal } from 'lucide-react';
import { DatasetId } from '../../types';
import { DATASETS_METADATA } from '../../engine/datasets';

interface HeaderProps {
  activeDataset: DatasetId;
  onSelectDataset: (id: DatasetId) => void;
  onOpenUpload: () => void;
  onToggleInspector: () => void;
  isInspectorOpen: boolean;
  onReturnHome: () => void;
  isWebMcpActive: boolean;
  recentToolCallCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeDataset,
  onSelectDataset,
  onOpenUpload,
  onToggleInspector,
  isInspectorOpen,
  onReturnHome,
  isWebMcpActive,
  recentToolCallCount
}) => {
  const currentMeta = DATASETS_METADATA[activeDataset];

  return (
    <header className="h-16 border-b border-white/[0.08] bg-dark-900/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Brand & Home */}
      <div className="flex items-center gap-4">
        <button
          onClick={onReturnHome}
          className="flex items-center gap-2.5 text-left group"
          title="Return to Homepage"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-purple-800 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
              Aura <span className="text-brand-400">Analytics</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-brand-950/80 text-brand-300 border border-brand-500/30">
                Studio
              </span>
            </span>
          </div>
        </button>

        <div className="h-5 w-[1px] bg-white/10 mx-1 hidden sm:block" />

        {/* Dataset Switcher */}
        <div className="flex items-center gap-1 bg-dark-950/80 p-1 rounded-xl border border-white/[0.08]">
          {(['ecommerce', 'churn', 'webvitals'] as DatasetId[]).map((id) => (
            <button
              key={id}
              onClick={() => onSelectDataset(id)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                activeDataset === id
                  ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/30 font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-dark-800/60'
              }`}
            >
              {id === 'ecommerce' ? 'E-Commerce' : id === 'churn' ? 'SaaS Churn' : 'Web Vitals'}
            </button>
          ))}
        </div>
      </div>

      {/* Right Utility Actions */}
      <div className="flex items-center gap-3">
        {/* WebMCP Live Telemetry Badge */}
        <button
          onClick={onToggleInspector}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono border transition-all ${
            isInspectorOpen
              ? 'bg-brand-950 border-brand-500/60 text-brand-300 shadow-md shadow-brand-500/20'
              : 'bg-dark-950/80 border-white/10 text-slate-300 hover:border-brand-500/30'
          }`}
          title="Toggle WebMCP Telemetry & Agent Simulator"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-semibold">WebMCP Bridge</span>
          {recentToolCallCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-brand-600/80 text-white text-[10px] font-bold">
              {recentToolCallCount}
            </span>
          )}
        </button>

        {/* Upload Custom CSV */}
        <button
          onClick={onOpenUpload}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-dark-800/80 hover:bg-dark-750 text-slate-200 border border-white/10 transition-colors"
        >
          <Upload className="w-3.5 h-3.5 text-brand-400" />
          <span className="hidden sm:inline">Import CSV</span>
        </button>

        {/* Back to Homepage */}
        <button
          onClick={onReturnHome}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-dark-800/60 border border-transparent hover:border-white/10 transition-colors"
          title="Return to Homepage"
        >
          <Home className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
