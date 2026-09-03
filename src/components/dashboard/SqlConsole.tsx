import React, { useState, useEffect } from 'react';
import { Terminal, Play, Zap, Copy, Check, AlertTriangle } from 'lucide-react';
import { DATASETS_METADATA } from '../../engine/datasets';

interface SqlConsoleProps {
  activeDataset: string;
  currentSql: string;
  onRunSql: (sql: string) => void;
  executionTimeMs: number;
  rowCount: number;
  isAgentExecuting?: boolean;
  errorMessage?: string;
}

export const SqlConsole: React.FC<SqlConsoleProps> = ({
  activeDataset,
  currentSql,
  onRunSql,
  executionTimeMs,
  rowCount,
  isAgentExecuting,
  errorMessage
}) => {
  const [editorSql, setEditorSql] = useState<string>(currentSql);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    setEditorSql(currentSql);
  }, [currentSql]);

  const meta = DATASETS_METADATA[(activeDataset || '').toLowerCase()];

  const handleCopy = () => {
    navigator.clipboard.writeText(editorSql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      onRunSql(editorSql);
    }
  };

  return (
    <div
      className={`rounded-none p-4 transition-all duration-200 w-full max-w-full overflow-hidden min-w-0 bg-white dark:bg-dark-950 ${
        errorMessage
          ? 'ring-1 ring-rose-500/60'
          : isAgentExecuting
          ? 'ring-2 ring-brand-500/50 glow-purple-sm'
          : ''
      }`}
    >
      {/* Console Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-none bg-brand-50 dark:bg-brand-950 flex items-center justify-center border border-brand-200 dark:border-brand-500/40 text-brand-600 dark:text-brand-400">
            <Terminal className="w-3 h-3" />
          </div>
          <span className="text-xs font-bold font-mono text-slate-900 dark:text-white tracking-wide">
            AuraQL SQL Console
          </span>
          {activeDataset && (
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-none bg-slate-100 dark:bg-dark-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10">
              {activeDataset}
            </span>
          )}
          {isAgentExecuting && (
            <span className="text-[10px] font-mono text-brand-600 dark:text-brand-400 animate-pulse flex items-center gap-1 font-bold">
              <Zap className="w-2.5 h-2.5" />
              <span>WebMCP Invoking</span>
            </span>
          )}
        </div>

        {/* Execution Stats & Copy */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="text-slate-500 dark:text-slate-400 text-[11px] hidden sm:flex items-center gap-2">
            <span>
              Latency:{' '}
              <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">
                {executionTimeMs}ms
              </strong>
            </span>
            <span>•</span>
            <span>
              Records:{' '}
              <strong className="text-slate-900 dark:text-white font-semibold">{rowCount}</strong>
            </span>
          </div>

          <button
            onClick={handleCopy}
            className="p-1 rounded-none text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-dark-800 transition-colors"
            title="Copy SQL Query"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* SQL Editor Surface */}
      <div className="relative">
        <textarea
          value={editorSql}
          onChange={(e) => setEditorSql(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={3}
          className="w-full p-3 font-mono text-xs bg-slate-900 text-slate-100 border border-slate-700/80 rounded-none focus:outline-none focus:border-brand-500 transition-colors leading-relaxed selection:bg-brand-500/40 selection:text-white resize-y"
          placeholder="SELECT * FROM my_table WHERE ...;"
          spellCheck={false}
        />

        <div className="absolute right-3 bottom-3 flex items-center gap-2">
          <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">Ctrl + Enter</span>
          <button
            onClick={() => onRunSql(editorSql)}
            className="btn-sharp px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm shadow-brand-600/30 transition-all border border-brand-400/40"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Execute SQL</span>
          </button>
        </div>
      </div>

      {/* Error Message Display */}
      {errorMessage && (
        <div className="mt-2 p-2.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-500/40 text-rose-700 dark:text-rose-300 text-xs font-mono flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Sample Query Shortcuts */}
      {meta && meta.sampleQueries && meta.sampleQueries.length > 0 && (
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
            Quick Queries:
          </span>
          {meta.sampleQueries.map((q, idx) => (
            <button
              key={idx}
              onClick={() => {
                setEditorSql(q.sql);
                onRunSql(q.sql);
              }}
              className="px-2 py-0.5 text-[10px] font-mono bg-slate-100 hover:bg-slate-200 dark:bg-dark-900 dark:hover:bg-dark-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:border-brand-500/40 transition-colors rounded-none"
            >
              {q.title}
            </button>
          ))}

          {/* Multi-Table JOIN Shortcut */}
          <button
            onClick={() => {
              const joinSql = `SELECT o.order_id, o.region, o.revenue, c.quarterly_revenue_m FROM ecommerce_sales o JOIN cloud_software_financials c ON o.region = c.segment LIMIT 10;`;
              setEditorSql(joinSql);
              onRunSql(joinSql);
            }}
            className="px-2 py-0.5 text-[10px] font-mono bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-500/40 transition-colors rounded-none font-bold flex items-center gap-1"
            title="Execute real in-memory multi-table SQL JOIN"
          >
            <Zap className="w-2.5 h-2.5 text-purple-500" />
            <span>Multi-Table JOIN Demo</span>
          </button>
        </div>
      )}
    </div>
  );
};
