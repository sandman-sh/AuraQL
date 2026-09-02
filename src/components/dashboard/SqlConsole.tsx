import React, { useState, useEffect } from 'react';
import { Terminal, Play, Zap, Copy, Check } from 'lucide-react';
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
    <div className={`glass-card rounded-none p-4 border transition-all duration-200 ${
      isAgentExecuting ? 'border-brand-500 ring-1 ring-brand-500/40 glow-purple-sm' : 'border-slate-200 dark:border-white/[0.08]'
    }`}>
      {/* Console Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-none bg-brand-50 dark:bg-brand-950 flex items-center justify-center border border-brand-200 dark:border-brand-500/40 text-brand-600 dark:text-brand-400">
            <Terminal className="w-3 h-3" />
          </div>
          <span className="text-xs font-bold font-mono text-slate-900 dark:text-white tracking-wide">
            AuraQL Editor
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-none bg-slate-100 dark:bg-dark-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10">
            {meta?.tableName}
          </span>
        </div>

        {/* Execution Telemetry */}
        <div className="flex items-center gap-2">
          {rowCount > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-none bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-[10px] font-mono">
              <Zap className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
              <span>⚡ {executionTimeMs}ms (AuraQL Core)</span>
              <span className="text-emerald-500">•</span>
              <span>{rowCount} live rows</span>
            </div>
          )}

          <button
            onClick={handleCopy}
            className="p-1 rounded-none text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-dark-800 transition-colors"
            title="Copy Query"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* SQL Textarea */}
      <div className="relative mb-2.5">
        <textarea
          value={editorSql}
          onChange={(e) => setEditorSql(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          spellCheck={false}
          className="w-full bg-slate-50 dark:bg-dark-950 rounded-none p-3 text-xs font-mono text-slate-800 dark:text-brand-300 border border-slate-300 dark:border-white/10 focus:border-brand-500 focus:ring-0 outline-none resize-y transition-all leading-relaxed"
          placeholder="Type AuraQL query... (e.g., SELECT * FROM ecommerce_sales LIMIT 20;)"
        />
        <div className="absolute right-2.5 bottom-2.5 text-[9px] font-mono text-slate-400 dark:text-slate-500 pointer-events-none hidden sm:block">
          Ctrl+Enter to run
        </div>
      </div>

      {/* Snippets & Execute Button */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 max-w-full">
          <span className="text-[10px] font-mono text-slate-500 uppercase shrink-0">Templates:</span>
          {meta?.sampleQueries.map((q, idx) => (
            <button
              key={idx}
              onClick={() => {
                setEditorSql(q.sql);
                onRunSql(q.sql);
              }}
              className="px-2 py-1 rounded-none text-[10px] font-mono bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-slate-700 dark:bg-dark-900 dark:hover:bg-brand-950 dark:hover:text-brand-300 dark:text-slate-300 border border-slate-200 dark:border-white/[0.08] hover:border-brand-400 transition-all shrink-0"
            >
              {q.title}
            </button>
          ))}
        </div>

        <button
          onClick={() => onRunSql(editorSql)}
          className="px-4 py-1.5 rounded-none bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs font-mono flex items-center gap-1.5 shadow-md shadow-brand-600/30 transition-all active:scale-[0.98] shrink-0 border border-brand-400/40"
        >
          <Play className="w-3.5 h-3.5" />
          <span>Execute AuraQL</span>
        </button>
      </div>
    </div>
  );
};
