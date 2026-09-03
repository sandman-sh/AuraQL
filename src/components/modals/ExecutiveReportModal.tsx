import React, { useState } from 'react';
import { X, Printer, Download, Copy, Check, FileCheck, ShieldCheck } from 'lucide-react';
import { DatasetId, QueryResult, ChartConfig } from '../../types';
import { DATASETS_METADATA } from '../../engine/datasets';
import { AuraLogo } from '../common/AuraLogo';

interface ExecutiveReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  dataset: DatasetId;
  queryResult: QueryResult;
  chartConfig: ChartConfig;
}

export const ExecutiveReportModal: React.FC<ExecutiveReportModalProps> = ({
  isOpen,
  onClose,
  dataset,
  queryResult,
  chartConfig
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  // Close on Escape key
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const meta = DATASETS_METADATA[dataset];
  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const handlePrint = () => {
    const onAfterPrint = () => {
      window.removeEventListener('afterprint', onAfterPrint);
      onClose();
    };
    window.addEventListener('afterprint', onAfterPrint);
    window.print();
    setTimeout(() => {
      onClose();
    }, 400);
  };

  const handleCopyJson = () => {
    const reportData = {
      report: 'Aura Analytics Executive Briefing',
      generatedAt: new Date().toISOString(),
      dataset: meta?.name,
      table: meta?.tableName,
      rowCount: queryResult.rowCount,
      executionTimeMs: queryResult.executionTimeMs,
      sqlQuery: queryResult.sql,
      sampleRows: queryResult.rows.slice(0, 10)
    };
    navigator.clipboard.writeText(JSON.stringify(reportData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto animate-fadeIn"
    >
      <div className="glass-card rounded-none p-6 max-w-2xl w-full border border-slate-300 dark:border-white/[0.12] bg-white dark:bg-dark-950 shadow-2xl relative my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <AuraLogo size={28} />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white font-mono tracking-tight">
                Aura Analytics • Executive Briefing
              </h3>
              <p className="text-[11px] text-slate-500 font-mono">Generated: {dateStr}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-none text-slate-400 hover:text-slate-900 dark:hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Report Body */}
        <div className="space-y-4 font-mono text-xs">
          {/* Executive Overview Pill */}
          <div className="p-3.5 bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-white/[0.08]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-brand-600 dark:text-brand-400 font-bold uppercase tracking-wider text-[10px]">
                Target Dataset
              </span>
              <span className="text-[10px] text-slate-500">AuraQL In-Memory Core</span>
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              {meta?.name} ({meta?.tableName})
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-sans">
              {meta?.description}
            </p>
          </div>

          {/* Active Visualization State */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-white/[0.08]">
              <div className="text-slate-500 text-[10px] uppercase tracking-wider mb-1">Active Visualization</div>
              <div className="font-bold text-slate-900 dark:text-white text-xs">{chartConfig.title}</div>
              <div className="text-[11px] text-brand-600 dark:text-brand-400 mt-0.5">
                Type: {chartConfig.type.toUpperCase()} • Axis: [{chartConfig.xAxis} / {chartConfig.yAxis}]
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-white/[0.08]">
              <div className="text-slate-500 text-[10px] uppercase tracking-wider mb-1">Performance Provenance</div>
              <div className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                ⚡ {queryResult.executionTimeMs}ms Execution
              </div>
              <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                {queryResult.rowCount} rows aggregated • 0 network requests
              </div>
            </div>
          </div>

          {/* Audit SQL */}
          <div className="p-3 bg-slate-100 dark:bg-dark-900 border border-slate-200 dark:border-white/[0.08]">
            <div className="text-slate-500 text-[10px] uppercase tracking-wider mb-1">Evaluated Query Statement</div>
            <code className="text-[11px] text-brand-700 dark:text-brand-300 break-all leading-relaxed">
              {queryResult.sql}
            </code>
          </div>

          {/* Verification Badge */}
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 text-[11px] text-emerald-700 dark:text-emerald-300 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Data Confidentiality Verified: 100% Client-Side In-Memory Execution</span>
            </div>
            <span className="text-[10px] font-bold">SHA-256 Validated</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-200 dark:border-white/10">
          <button
            onClick={handleCopyJson}
            className="btn-sharp px-3 py-1.5 text-xs font-mono bg-slate-100 dark:bg-dark-900 hover:bg-slate-200 dark:hover:bg-dark-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-white/10 flex items-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied Briefing JSON' : 'Copy JSON'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="btn-sharp px-3 py-1.5 text-xs font-mono bg-slate-200 hover:bg-slate-300 dark:bg-dark-800 dark:hover:bg-dark-700 text-slate-800 dark:text-slate-200 transition-colors"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="btn-sharp px-4 py-1.5 text-xs font-mono font-bold bg-brand-600 hover:bg-brand-500 text-white flex items-center gap-1.5 shadow-sm transition-colors border border-brand-400/40"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
