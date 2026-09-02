import React, { useState, useEffect } from 'react';
import { Terminal, Play, Zap, Copy, Check, Clock, Sparkles } from 'lucide-react';
import { DATASETS_METADATA } from '../../engine/datasets';
import { DatasetId } from '../../types';

interface SqlConsoleProps {
  activeDataset: DatasetId;
  currentSql: string;
  onRunSql: (sql: string) => void;
  executionTimeMs: number;
  rowCount: number;
  isAgentExecuting?: boolean;
}

export const SqlConsole: React.FC<SqlConsoleProps> = ({
  activeDataset,
  currentSql,
  onRunSql,
  executionTimeMs,
  rowCount,
  isAgentExecuting
}) => {
  const [editorSql, setEditorSql] = useState<string>(currentSql);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    setEditorSql(currentSql);
  }, [currentSql]);

  const meta = DATASETS_METADATA[activeDataset];

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
    <div className={`glass-card rounded-2xl p-5 border transition-all duration-300 ${
      isAgentExecuting ? 'border-brand-500 ring-2 ring-brand-500/30' : 'border-white/[0.08]'
    }`}>
      {/* Console Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-brand-950 flex items-center justify-center border border-brand-500/30 text-brand-400">
            <Terminal className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold font-mono text-white tracking-wide">
            AuraQL Console
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-dark-900 text-slate-400 border border-white/10">
            {meta?.tableName}
          </span>
        </div>

        {/* Execution Speed Telemetry Badge */}
        <div className="flex items-center gap-2">
          {rowCount > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-[11px] font-mono">
              <Zap className="w-3 h-3 text-emerald-400" />
              <span>⚡ {executionTimeMs}ms</span>
              <span className="text-emerald-500">•</span>
              <span>{rowCount} rows</span>
            </div>
          )}

          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-dark-800 transition-colors"
            title="Copy SQL"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* SQL Textarea Editor */}
      <div className="relative mb-3">
        <textarea
          value={editorSql}
          onChange={(e) => setEditorSql(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={3}
          spellCheck={false}
          className="w-full bg-dark-950/90 rounded-xl p-3.5 text-xs sm:text-sm font-mono text-brand-300 border border-white/10 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none resize-y transition-all leading-relaxed"
          placeholder="Enter DuckDB SQL query... (e.g., SELECT * FROM ecommerce_sales LIMIT 10;)"
        />

        <div className="absolute right-3 bottom-3 text-[10px] font-mono text-slate-500 pointer-events-none hidden sm:block">
          Press ⌘+Enter / Ctrl+Enter to execute
        </div>
      </div>

      {/* Quick Templates & Run Button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full">
          <span className="text-[10px] font-mono text-slate-500 uppercase shrink-0">Snippets:</span>
          {meta?.sampleQueries.map((q, idx) => (
            <button
              key={idx}
              onClick={() => {
                setEditorSql(q.sql);
                onRunSql(q.sql);
              }}
              className="px-2.5 py-1 rounded-md text-[11px] font-mono bg-dark-900/80 hover:bg-brand-950 hover:text-brand-300 text-slate-300 border border-white/[0.06] hover:border-brand-500/30 transition-all shrink-0"
            >
              {q.title}
            </button>
          ))}
        </div>

        <button
          onClick={() => onRunSql(editorSql)}
          className="px-4 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium text-xs font-mono flex items-center gap-1.5 shadow-md shadow-brand-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0"
        >
          <Play className="w-3.5 h-3.5" />
          <span>Execute Query</span>
        </button>
      </div>
    </div>
  );
};
