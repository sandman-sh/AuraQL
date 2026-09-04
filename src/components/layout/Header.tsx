import React, { useState, useRef, useEffect } from 'react';
import { Upload, Home, FileText, Plus, Database, Bot, BookOpen, ChevronDown, Search, Check, Share2, Printer, HardDrive } from 'lucide-react';
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
  onOpenDatasetSelector?: () => void;
  onOpenAgentModal?: () => void;
  onOpenDocs?: () => void;
  onOpenShare?: () => void;
  onOpenExportSlide?: () => void;
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
  recentToolCallCount,
  onOpenAgentModal,
  onOpenDocs,
  onOpenShare,
  onOpenExportSlide,
  onOpenDatasetSelector
}) => {
  const tableNames = auraEngine.getTableNames();

  const [isTableDropdownOpen, setIsTableDropdownOpen] = useState(false);
  const [tableSearchQuery, setTableSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsTableDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredTables = tableNames.filter((t) =>
    t.toLowerCase().includes(tableSearchQuery.toLowerCase())
  );

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
          </div>
        </button>

        <div className="h-4 w-[1px] bg-slate-200 dark:bg-white/10 mx-1 hidden md:block" />

        {/* Dynamic Table Switcher */}
        {tableNames.length > 4 ? (
          /* Multi-Table Smart Dropdown Switcher */
          <div className="relative" ref={dropdownRef}>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsTableDropdownOpen(!isTableDropdownOpen)}
                className="flex items-center gap-2 px-2.5 py-1 text-xs font-mono font-bold bg-brand-50 dark:bg-brand-950/80 border border-brand-300 dark:border-brand-500/40 text-brand-700 dark:text-brand-300 hover:border-brand-500 transition-all rounded-none shadow-sm"
              >
                <Database className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 shrink-0" />
                <span className="truncate max-w-[120px] sm:max-w-[160px]">{activeDataset}</span>
                <span className="px-1.5 py-0.2 text-[9px] bg-brand-200/70 dark:bg-brand-900 text-brand-800 dark:text-brand-200 rounded-none">
                  {tableNames.length} Tables
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              <button
                onClick={onOpenUpload}
                className="p-1 px-1.5 rounded-none text-xs font-mono bg-slate-100 hover:bg-slate-200 dark:bg-dark-900 dark:hover:bg-dark-800 text-brand-600 dark:text-brand-400 border border-slate-300 dark:border-white/10 flex items-center gap-1 shrink-0"
                title="Import New Dataset"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>

            {isTableDropdownOpen && (
              <div className="absolute left-0 mt-1 w-64 bg-white dark:bg-dark-950 border border-slate-300 dark:border-white/10 shadow-2xl z-50 p-2 font-mono text-xs animate-fadeIn">
                <div className="relative mb-2">
                  <input
                    type="text"
                    value={tableSearchQuery}
                    onChange={(e) => setTableSearchQuery(e.target.value)}
                    placeholder="Search tables..."
                    className="w-full pl-7 pr-2 py-1 bg-slate-50 dark:bg-dark-900 border border-slate-300 dark:border-white/10 text-[11px] text-slate-900 dark:text-white outline-none focus:border-brand-500"
                    autoFocus
                  />
                  <Search className="w-3 h-3 absolute left-2 top-2 text-slate-400" />
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1">
                  {filteredTables.map((tbl) => {
                    const rowCount = auraEngine.getTableData(tbl).length;
                    const isSelected = activeDataset === tbl;
                    return (
                      <button
                        key={tbl}
                        onClick={() => {
                          onSelectDataset(tbl);
                          setIsTableDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2 py-1.5 text-left text-[11px] rounded-none transition-colors ${
                          isSelected
                            ? 'bg-brand-600 text-white font-bold'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-850'
                        }`}
                      >
                        <span className="truncate flex items-center gap-1.5">
                          <Database className="w-3 h-3 opacity-70" />
                          <span>{tbl}</span>
                        </span>
                        <span className="text-[9px] opacity-70">
                          {rowCount} rows
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2 mt-1 border-t border-slate-200 dark:border-white/10">
                  <button
                    onClick={() => {
                      setIsTableDropdownOpen(false);
                      onOpenUpload();
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-1 text-[11px] text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/50"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Upload More Tables (.csv, .json)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Horizontal Buttons for <= 4 tables */
          <div className="flex items-center gap-1 overflow-x-auto max-w-[280px] sm:max-w-xs md:max-w-md py-1">
            {tableNames.length === 0 ? (
              <button
                type="button"
                onClick={onOpenDatasetSelector || onOpenUpload}
                className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-500/50 hover:border-amber-500 transition-all rounded-none shadow-sm animate-pulse"
              >
                <Database className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Select / Upload Dataset</span>
              </button>
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
              onClick={onOpenDatasetSelector || onOpenUpload}
              className="p-1 px-1.5 rounded-none text-xs font-mono bg-slate-100 hover:bg-slate-200 dark:bg-dark-900 dark:hover:bg-dark-800 text-brand-600 dark:text-brand-400 border border-slate-300 dark:border-white/10 flex items-center gap-1 shrink-0"
              title="Add or Select Dataset"
            >
              <Plus className="w-3 h-3" />
              <span className="hidden sm:inline text-[10px]">Dataset</span>
            </button>
          </div>
        )}
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* AI Agent Connection Hub Trigger */}
        <button
          onClick={onOpenAgentModal}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-none text-xs font-mono font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-sm shadow-brand-600/30 transition-all border border-brand-400/40"
          title="Configure AI Agent (OpenAI, Claude, Gemini, Ollama, Python, WebMCP)"
        >
          <Bot className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Connect Agent</span>
          <span className="sm:hidden">Agent</span>
        </button>

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

        {/* Share Dashboard Link */}
        {onOpenShare && (
          <button
            onClick={onOpenShare}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-none text-xs font-mono font-medium bg-slate-100 hover:bg-slate-200 dark:bg-dark-900 dark:hover:bg-dark-850 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-white/10 hover:border-brand-500/30 transition-colors"
            title="Share Live Dashboard via Zero-Server Link"
          >
            <Share2 className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
            <span className="hidden xl:inline">Share</span>
          </button>
        )}

        {/* Export Slide PDF */}
        {onOpenExportSlide && (
          <button
            onClick={onOpenExportSlide}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-none text-xs font-mono font-medium bg-slate-100 hover:bg-slate-200 dark:bg-dark-900 dark:hover:bg-dark-850 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-white/10 hover:border-brand-500/30 transition-colors"
            title="Export 1-Click Executive PDF Slide"
          >
            <Printer className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
            <span className="hidden xl:inline">Export PDF</span>
          </button>
        )}

        {/* Local Storage Indicator */}
        <div
          className="hidden 2xl:flex items-center gap-1.5 px-2 py-1 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 rounded-none"
          title="Browser-Native IndexedDB Active • Auto-saving datasets locally"
        >
          <HardDrive className="w-3 h-3" />
          <span>Local DB</span>
        </div>

        {/* Developer Documentation Trigger */}
        {onOpenDocs && (
          <button
            onClick={onOpenDocs}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-none text-xs font-mono font-medium bg-slate-100 hover:bg-slate-200 dark:bg-dark-900 dark:hover:bg-dark-850 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-white/10 hover:border-brand-500/30 transition-colors"
            title="Read Developer Documentation"
          >
            <BookOpen className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
            <span className="hidden sm:inline">Docs</span>
          </button>
        )}

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
