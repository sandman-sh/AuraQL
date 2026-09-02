import React, { useState, useMemo } from 'react';
import { Bot, Send, Sparkles, Zap, ArrowRight, CornerDownLeft, Loader2 } from 'lucide-react';
import { auraEngine } from '../../engine/auraql';

interface AiCommandBarProps {
  activeDataset: string;
  onExecutePrompt: (promptText: string) => Promise<void>;
  isProcessing: boolean;
}

export const AiCommandBar: React.FC<AiCommandBarProps> = ({
  activeDataset,
  onExecutePrompt,
  isProcessing
}) => {
  const [inputVal, setInputVal] = useState('');

  // Generate dynamic query suggestions tailored to whatever table is active
  const dynamicSuggestions = useMemo(() => {
    if (!activeDataset) return [];
    const rows = auraEngine.getTableData(activeDataset);
    if (rows.length === 0) return [];

    const firstRow = rows[0];
    const numericCols = Object.keys(firstRow).filter((k) => typeof firstRow[k] === 'number');
    const stringCols = Object.keys(firstRow).filter(
      (k) => typeof firstRow[k] === 'string' && !k.toLowerCase().includes('id')
    );

    const suggestions = [];

    if (stringCols[0] && numericCols[0]) {
      suggestions.push({
        label: `Aggregate ${numericCols[0]} by ${stringCols[0]} (Bar)`,
        prompt: `Show ${numericCols[0]} aggregated by ${stringCols[0]} as a bar chart`
      });
    }

    if (stringCols[1] && numericCols[0]) {
      suggestions.push({
        label: `Breakdown by ${stringCols[1]} (Donut)`,
        prompt: `Breakdown total ${numericCols[0]} across ${stringCols[1]}`
      });
    }

    if (numericCols[1]) {
      suggestions.push({
        label: `Analyze Distribution of ${numericCols[1]} (Area)`,
        prompt: `Plot distribution of ${numericCols[1]}`
      });
    }

    suggestions.push({
      label: `Inspect Top Records (Table)`,
      prompt: `Show top records sorted by ${numericCols[0] || 'primary field'}`
    });

    return suggestions.slice(0, 3);
  }, [activeDataset]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() || isProcessing) return;
    onExecutePrompt(inputVal.trim());
    setInputVal('');
  };

  if (!activeDataset) return null;

  return (
    <div className="glass-card rounded-none p-3 sm:p-4 border border-brand-500/30 glow-purple-sm transition-all">
      {/* Top Banner */}
      <div className="flex items-center justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-none bg-brand-600 flex items-center justify-center text-white shadow-sm shadow-brand-600/50">
            <Sparkles className="w-3 h-3 animate-pulse" />
          </div>
          <span className="text-xs font-bold font-mono text-slate-900 dark:text-white tracking-wide">
            Natural Language Query Co-Pilot
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-none bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 border border-brand-200 dark:border-brand-500/40 font-semibold hidden sm:inline-block">
            Connected to WebMCP
          </span>
        </div>

        <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 hidden sm:flex items-center gap-1.5">
          <Bot className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
          <span>Active Table: <strong>{activeDataset}</strong></span>
        </div>
      </div>

      {/* Input Field */}
      <form onSubmit={handleSubmit} className="relative flex items-center mb-2.5">
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          disabled={isProcessing}
          placeholder={`Ask anything about ${activeDataset} (e.g. "Aggregate revenue by category as a bar chart")...`}
          className="w-full pl-3 pr-24 py-2 text-xs font-mono bg-white dark:bg-dark-900 border border-slate-300 dark:border-white/10 rounded-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-all selection:bg-brand-500/30"
        />

        <button
          type="submit"
          disabled={!inputVal.trim() || isProcessing}
          className="btn-sharp absolute right-1 px-3 py-1 bg-brand-600 hover:bg-brand-500 disabled:opacity-40 disabled:hover:bg-brand-600 text-white font-mono text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-brand-600/30 transition-all border border-brand-400/40"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Running...</span>
            </>
          ) : (
            <>
              <span>Execute</span>
              <CornerDownLeft className="w-3 h-3 text-brand-200" />
            </>
          )}
        </button>
      </form>

      {/* Dynamic Suggestions */}
      {dynamicSuggestions.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mr-1">
            Suggested Prompts:
          </span>
          {dynamicSuggestions.map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onExecutePrompt(s.prompt)}
              disabled={isProcessing}
              className="btn-sharp px-2 py-0.5 text-[10px] font-mono bg-slate-100 hover:bg-brand-50 dark:bg-dark-900 dark:hover:bg-brand-950/60 text-slate-700 hover:text-brand-700 dark:text-slate-300 dark:hover:text-brand-300 border border-slate-200 dark:border-white/10 hover:border-brand-400 transition-colors flex items-center gap-1"
            >
              <Zap className="w-2.5 h-2.5 text-brand-600 dark:text-brand-400" />
              <span>{s.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
