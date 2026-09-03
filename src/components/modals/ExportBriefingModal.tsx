import React, { useEffect } from 'react';
import { X, Printer, Sparkles, FileText, BarChart3, Check } from 'lucide-react';
import { AuraLogo } from '../common/AuraLogo';
import { ChartConfig } from '../../types';

interface ExportBriefingModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableName: string;
  chartConfig: ChartConfig;
  currentSql: string;
  metrics: {
    metric1: { title: string; value: string; sub: string };
    metric2: { title: string; value: string; sub: string };
    metric3: { title: string; value: string; sub: string };
    metric4: { title: string; value: string; sub: string };
  };
}

export const ExportBriefingModal: React.FC<ExportBriefingModalProps> = ({
  isOpen,
  onClose,
  tableName,
  chartConfig,
  currentSql,
  metrics
}) => {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handlePrint = () => {
    // Automatically close the modal when user finishes or cancels printing
    const onAfterPrint = () => {
      window.removeEventListener('afterprint', onAfterPrint);
      onClose();
    };
    window.addEventListener('afterprint', onAfterPrint);

    // Fallback: also close modal if window.print returns or after delay
    window.print();
    setTimeout(() => {
      onClose();
    }, 400);
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn print:p-0 print:bg-white print:static"
    >
      <div className="w-full max-w-3xl bg-white dark:bg-dark-950 border border-slate-300 dark:border-white/10 rounded-none shadow-2xl p-5 sm:p-7 relative my-auto transition-colors print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none">
        {/* Modal Top Actions Header (Hidden in Print) */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/10 mb-5 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-none bg-brand-50 dark:bg-brand-950 flex items-center justify-center border border-brand-200 dark:border-brand-500/40 text-brand-600 dark:text-brand-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white font-mono tracking-tight">
                Executive Briefing Slide
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                Auto-formatted presentation slide • Ready for 1-click PDF export
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="btn-sharp px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-mono text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
              title="Open browser print dialog to save as PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>PRINT / SAVE PDF</span>
            </button>
            <button
              onClick={onClose}
              className="btn-sharp px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-dark-850 dark:hover:bg-dark-800 text-slate-700 dark:text-slate-300 font-mono text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Close modal (Esc)"
            >
              <X className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Close</span>
            </button>
          </div>
        </div>

        {/* Printable Executive Slide Card */}
        <div id="briefing-slide" className="bg-white dark:bg-dark-900 p-5 sm:p-7 border border-slate-200 dark:border-white/10 space-y-5 print:border-none print:p-0 print:bg-white print:text-black">
          {/* Executive Header */}
          <div className="flex items-start justify-between border-b border-slate-200 dark:border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <AuraLogo size={32} />
              <div>
                <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight font-mono print:text-slate-950">
                  AURA ANALYTICS <span className="text-brand-600 dark:text-brand-400 print:text-brand-600">// EXECUTIVE BRIEFING</span>
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono print:text-slate-600">
                  Dataset: <strong className="text-slate-900 dark:text-white print:text-black">{tableName}</strong> • In-Memory Columnar Engine
                </p>
              </div>
            </div>
            <div className="text-right font-mono text-xs text-slate-500 dark:text-slate-400 print:text-slate-600">
              <p className="font-bold text-slate-800 dark:text-slate-200 print:text-black">{currentDate}</p>
              <p className="text-[10px]">Confidential Internal Report</p>
            </div>
          </div>

          {/* Key Executive KPIs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[metrics.metric1, metrics.metric2, metrics.metric3, metrics.metric4].map((m, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-white/10 font-mono print:bg-slate-50 print:border-slate-300"
              >
                <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold print:text-slate-600">
                  {m.title}
                </p>
                <p className="text-lg font-extrabold text-slate-900 dark:text-white my-0.5 print:text-black">
                  {m.value}
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate print:text-slate-600">
                  {m.sub}
                </p>
              </div>
            ))}
          </div>

          {/* Active Visualization Summary */}
          <div className="p-3.5 bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-white/10 font-mono text-xs space-y-1.5 print:bg-slate-50 print:border-slate-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold print:text-black">
                <BarChart3 className="w-4 h-4 text-brand-600 dark:text-brand-400 print:text-brand-600" />
                <span>Active Chart: {chartConfig.title}</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 bg-brand-100 dark:bg-brand-900/60 text-brand-700 dark:text-brand-300 font-bold uppercase print:bg-slate-200 print:text-black">
                {chartConfig.type} Chart
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-400 pt-1 print:text-slate-700">
              <div>Dimension (X-Axis): <strong className="text-slate-900 dark:text-white print:text-black">{chartConfig.xAxis}</strong></div>
              <div>Metric (Y-Axis): <strong className="text-slate-900 dark:text-white print:text-black">{chartConfig.yAxis}</strong></div>
            </div>
          </div>

          {/* SQL Query Specification */}
          <div className="space-y-1 font-mono text-xs">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider print:text-slate-600">
              Underlying Analytical Query:
            </span>
            <pre className="p-2.5 bg-slate-900 text-slate-100 dark:bg-black dark:text-slate-200 text-[11px] overflow-x-auto border border-slate-800 leading-relaxed font-mono print:bg-slate-100 print:text-black print:border-slate-300">
              {currentSql}
            </pre>
          </div>

          {/* Strategic Executive Takeaways */}
          <div className="p-3.5 bg-brand-50/50 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-500/30 text-xs font-mono space-y-1.5 print:bg-slate-50 print:border-slate-300">
            <div className="flex items-center gap-2 text-brand-700 dark:text-brand-300 font-bold text-[11px] print:text-brand-700">
              <Sparkles className="w-3.5 h-3.5 text-brand-500" />
              <span>AI Executive Takeaways</span>
            </div>
            <ul className="list-disc list-inside text-[11px] text-slate-700 dark:text-slate-300 space-y-1 leading-relaxed print:text-slate-800">
              <li>In-browser vectorized evaluation completed with sub-10ms latency across <strong>{tableName}</strong>.</li>
              <li>Calculated cohort distributions isolate top volume performance along dimension <strong>{chartConfig.xAxis}</strong>.</li>
              <li>Data is processed locally in client memory with zero remote storage overhead.</li>
            </ul>
          </div>

          {/* Footer Timestamp */}
          <div className="pt-2 border-t border-slate-200 dark:border-white/10 text-[9px] font-mono text-slate-400 flex items-center justify-between print:border-slate-300 print:text-slate-500">
            <span>Generated via AuraQL WebMCP Autonomous Studio</span>
            <span>https://auraql.vercel.app</span>
          </div>
        </div>

        {/* Modal Bottom Footer Actions (Hidden in Print) */}
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-200 dark:border-white/10 print:hidden">
          <span className="text-[11px] font-mono text-slate-400">
            Click outside or press <strong>Esc</strong> to close
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="btn-sharp px-4 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-dark-800 dark:hover:bg-dark-700 text-slate-800 dark:text-slate-200 text-xs font-mono font-medium"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="btn-sharp px-4 py-1.5 bg-brand-600 hover:bg-brand-500 text-white font-mono text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
          </div>
        </div>

        {/* Print Styles */}
        <style>{`
          @media print {
            @page {
              size: landscape;
              margin: 8mm;
            }
            body {
              background: white !important;
              color: black !important;
            }
            body * {
              visibility: hidden;
            }
            #briefing-slide, #briefing-slide * {
              visibility: visible;
            }
            #briefing-slide {
              position: fixed;
              left: 0;
              top: 0;
              width: 100vw;
              margin: 0;
              padding: 12px !important;
              background: white !important;
              color: black !important;
              box-shadow: none !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        `}</style>
      </div>
    </div>
  );
};
