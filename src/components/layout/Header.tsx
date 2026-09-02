import React from 'react';
import { Upload, Home, FileText, Plus, Database } from 'lucide-react';
import { AuraLogo } from '../common/AuraLogo';
import { ThemeToggle } from '../common/ThemeToggle';
import { auraEngine } from '../../engine/auraql';

interface HeaderProps {
  activeDataset: string;
  onSelectDataset: (tableName: string) => void;
  onOpenUpload: () => void;
  onOpenReport: () => void;
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
  onOpenReport,
  onToggleInspector,
  isInspectorOpen,
  onReturnHome,
  isWebMcpActive,
  recentToolCallCount
}) => {
  const tableNames = auraEngine.getTableNames();

  return (
    <header className="h-14 border-b border-slate-200 dark:border-white/[0.08] bg-white/95 dark:bg-dark-950/95 backdrop-blur-md px-4 sm:px-5 flex items-center justify-between sticky top-0 z-30 shrink-0 transition-colors">
      {/* Brand & Home */}
      <div className="flex items-center gap-4 sm:gap-5 min-w-0">
        <button
          onClick={onReturnHome}
          className="flex items-center gap-3 text-left group shrink-0"
          title="Return to Homepage"
        >
          <AuraLogo size={28} />
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5 font-mono">
              AURA <span className="text-brand-600 dark:text-brand-400">ANALYTICS</span>
            </span>
            <span className="text-[9px] uppercase tracking-wider font-mono px-1.5 py-0.5 rounded-none bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 border border-brand-200 dark:border-brand-500/40 hidden md:inline-block">
              AuraQL Engine
            </span>
          </div>
        </button>

        <div className="h-4 w-[1px] bg-slate-200 dark:bg-white/10 mx-1 hidden md:block" />

        {/* Dynamic Table Switcher */}
        <div className="flex items-center gap-1 overflow-x-auto max-w-[280px] sm:max-w-xs md:max-w-md py-1">
          {tableNames.length === 0 ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-dark-900 border border-slate-200 dark:border-white/10 rounded-none">
              <Database className="w-3 h-3 text-slate-400" />
              <span>No Active Tables</span>
            </div>
          ) : (
            <div className="flex items-center bg-slate-100 dark:bg-dark-900 border border-slate-200 dark:border-white/[0.08] p-0.5 rounded-none">
              {tableNames.map((tbl) => (
                <button
                  key={tbl}
                  onClick={() => onSelectDataset(tbl)}
                  className={`px-2.5 py-1 text-xs font-mono rounded-none transition-all truncate max-w-[130px] ${
                    activeDataset === tbl
                      ? 'bg-brand-600 text-white font-bold shadow-sm shadow-brand-600/40 border border-brand-400/40'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-dark-800'
                  }`}
                  title={tbl}
                >
                  {tbl}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={onOpenUpload}
            className="p-1 px-1.5 rounded-none text-xs font-mono bg-slate-100 hover:bg-slate-200 dark:bg-dark-900 dark:hover:bg-dark-800 text-brand-600 dark:text-brand-400 border border-slate-300 dark:border-white/10 flex items-center gap-1 shrink-0"
            title="Import New Dataset"
          >
            <Plus className="w-3 h-3" />
            <span className="hidden sm:inline text-[10px]">Add Table</span>
          </button>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Executive Report Modal Trigger */}
        {tableNames.length > 0 && (
          <button
            onClick={onOpenReport}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-none text-xs font-mono font-semibold bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/60 dark:hover:bg-brand-900/60 text-brand-700 dark:text-brand-300 border border-brand-300 dark:border-brand-500/40 transition-colors"
            title="Generate Executive Briefing"
          >
            <FileText className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
            <span className="hidden lg:inline">Executive Briefing</span>
          </button>
        )}

        {/* WebMCP Telemetry Indicator */}
        <button
          onClick={onToggleInspector}
          className={`flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-none text-xs font-mono border transition-all ${
            isInspectorOpen
              ? 'bg-brand-50 dark:bg-brand-950 border-brand-500 text-brand-700 dark:text-brand-300 shadow-sm'
              : 'bg-slate-100 dark:bg-dark-900 border-slate-300 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-brand-500/40'
          }`}
          title="Toggle WebMCP Protocol Inspector"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-none bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-none h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-semibold hidden sm:inline">WebMCP</span>
          <span className="font-semibold sm:hidden">MCP</span>
          {recentToolCallCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-none bg-brand-600 text-white text-[10px] font-bold">
              {recentToolCallCount}
            </span>
          )}
        </button>

        {/* Import File Button */}
        <button
          onClick={onOpenUpload}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-none text-xs font-mono font-medium bg-slate-100 hover:bg-slate-200 dark:bg-dark-900 dark:hover:bg-dark-850 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-white/10 hover:border-brand-500/30 transition-colors"
        >
          <Upload className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
          <span className="hidden sm:inline">Import CSV/JSON</span>
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
