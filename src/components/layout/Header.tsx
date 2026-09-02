import React from 'react';
import { Upload, Home } from 'lucide-react';
import { DatasetId } from '../../types';
import { AuraLogo } from '../common/AuraLogo';
import { ThemeToggle } from '../common/ThemeToggle';

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
  return (
    <header className="h-14 border-b border-slate-200 dark:border-white/[0.08] bg-white/95 dark:bg-dark-950/95 backdrop-blur-md px-5 flex items-center justify-between sticky top-0 z-30 shrink-0 transition-colors">
      {/* Brand & Home */}
      <div className="flex items-center gap-5">
        <button
          onClick={onReturnHome}
          className="flex items-center gap-3 text-left group"
          title="Return to Homepage"
        >
          <AuraLogo size={28} />
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5 font-mono">
              AURA <span className="text-brand-600 dark:text-brand-400">ANALYTICS</span>
            </span>
            <span className="text-[9px] uppercase tracking-wider font-mono px-1.5 py-0.5 rounded-none bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 border border-brand-200 dark:border-brand-500/40">
              AuraQL Core
            </span>
          </div>
        </button>

        <div className="h-4 w-[1px] bg-slate-200 dark:bg-white/10 mx-1 hidden sm:block" />

        {/* Dataset Switcher with Sharp Buttons */}
        <div className="flex items-center bg-slate-100 dark:bg-dark-900 border border-slate-200 dark:border-white/[0.08] p-0.5 rounded-none">
          {(['ecommerce', 'churn', 'webvitals'] as DatasetId[]).map((id) => (
            <button
              key={id}
              onClick={() => onSelectDataset(id)}
              className={`px-3 py-1 text-xs font-mono rounded-none transition-all ${
                activeDataset === id
                  ? 'bg-brand-600 text-white font-bold shadow-sm shadow-brand-600/40 border border-brand-400/40'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-dark-800'
              }`}
            >
              {id === 'ecommerce' ? 'E-Commerce' : id === 'churn' ? 'SaaS Churn' : 'Web Vitals'}
            </button>
          ))}
        </div>
      </div>

      {/* Right Actions with Sharp Cyber Buttons */}
      <div className="flex items-center gap-2">
        {/* WebMCP Telemetry Indicator */}
        <button
          onClick={onToggleInspector}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-none text-xs font-mono border transition-all ${
            isInspectorOpen
              ? 'bg-brand-50 dark:bg-brand-950 border-brand-500 text-brand-700 dark:text-brand-300 shadow-sm'
              : 'bg-slate-100 dark:bg-dark-900 border-slate-300 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-brand-500/40'
          }`}
          title="Toggle WebMCP Telemetry & Agent Simulator"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-none bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-none h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-semibold">WebMCP Bridge</span>
          {recentToolCallCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-none bg-brand-600 text-white text-[10px] font-bold">
              {recentToolCallCount}
            </span>
          )}
        </button>

        {/* Import CSV */}
        <button
          onClick={onOpenUpload}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-none text-xs font-mono font-medium bg-slate-100 hover:bg-slate-200 dark:bg-dark-900 dark:hover:bg-dark-850 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-white/10 hover:border-brand-500/30 transition-colors"
        >
          <Upload className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
          <span className="hidden sm:inline">Import CSV</span>
        </button>

        {/* Light / Dark Mode Toggle */}
        <ThemeToggle />

        {/* Back to Homepage */}
        <button
          onClick={onReturnHome}
          className="p-1.5 rounded-none text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-dark-800 border border-transparent hover:border-slate-200 dark:hover:border-white/10 transition-colors"
          title="Return to Homepage"
        >
          <Home className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
