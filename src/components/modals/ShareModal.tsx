import React, { useState } from 'react';
import { X, Share2, Copy, Check, ExternalLink, ShieldCheck, Sparkles } from 'lucide-react';
import { generateShareableUrl } from '../../engine/share';
import { ChartConfig } from '../../types';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeDataset: string;
  currentSql: string;
  chartConfig: ChartConfig;
  activeFilter?: { column: string; value: string } | null;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  activeDataset,
  currentSql,
  chartConfig,
  activeFilter
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const shareUrl = generateShareableUrl({
    table: activeDataset,
    sql: currentSql,
    chart: chartConfig,
    filter: activeFilter
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 selection:bg-brand-500/30 animate-fadeIn">
      <div className="w-full max-w-lg bg-white dark:bg-dark-950 border border-slate-300 dark:border-white/10 rounded-none shadow-2xl p-6 relative transition-colors">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-none hover:bg-slate-100 dark:hover:bg-dark-900 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-none bg-brand-50 dark:bg-brand-950 flex items-center justify-center border border-brand-200 dark:border-brand-500/40 text-brand-600 dark:text-brand-400">
            <Share2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white font-mono tracking-tight flex items-center gap-2">
              <span>Share Live Dashboard</span>
              <span className="text-[9px] px-1.5 py-0.5 bg-brand-100 dark:bg-brand-900/60 text-brand-700 dark:text-brand-300 font-bold uppercase">
                Zero-Server Link
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              Pure client-side URL state • 0 backend database required
            </p>
          </div>
        </div>

        {/* Informative Callout */}
        <div className="mb-4 p-3 bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-white/10 text-xs font-mono text-slate-600 dark:text-slate-400 space-y-1.5">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>How Zero-Server Sharing Works</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            Your active SQL query, table selection, chart type (<span className="text-brand-600 dark:text-brand-400 font-bold">{chartConfig.type}</span>), and filters are compressed into a secure URL hash fragment. Anyone opening this link will see your exact visualization instantly.
          </p>
        </div>

        {/* Share URL Box */}
        <div className="space-y-2 mb-6">
          <label className="text-[11px] font-mono text-slate-500 dark:text-slate-400 font-medium">
            Shareable URL Link:
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 px-3 py-2 bg-slate-100 dark:bg-dark-900 border border-slate-300 dark:border-white/10 text-xs font-mono text-slate-800 dark:text-slate-200 outline-none select-all rounded-none truncate"
            />
            <button
              onClick={handleCopy}
              className="btn-sharp px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-mono text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 shadow-sm"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  <span>COPIED!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>COPY LINK</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-white/10">
          <a
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
          >
            <span>Test opening in new tab</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          <button
            onClick={onClose}
            className="btn-sharp px-4 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-dark-850 dark:hover:bg-dark-800 text-slate-800 dark:text-slate-200 text-xs font-mono font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
