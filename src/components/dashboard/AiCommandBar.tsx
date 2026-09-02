import React, { useState, useMemo } from 'react';
import { Bot, Send, Sparkles, ArrowRight, CornerDownLeft, Loader2 } from 'lucide-react';
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
    if (!rows || rows.length === 0 || !rows[0]) return [];

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
    onExecutePrompt(inputVal);
    setInputVal('');
  };

  return (
    <div className="glass-card rounded-none p-3.5 border border-brand-500/30 glow-purple-sm">
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <div className="absolute left-3 flex items-center gap-1.5 pointer-events-none text-brand-600 dark:text-brand-400">
          <Bot className="w-4 h-4" />
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider hidden sm:inline">
            AuraQL Co-Pilot
          </span>
        </div>

        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder={`Ask natural language question or request visualization on ${activeDataset || 'active table'}...`}
          disabled={isProcessing}
          className="w-full pl-28 sm:pl-36 pr-24 py-2 text-xs font-mono bg-white dark:bg-dark-900 border border-slate-300 dark:border-white/10 rounded-none focus:outline-none focus:border-brand-500 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors"
        />

        <div className="absolute right-2 flex items-center gap-1.5">
          <button
            type="submit"
            disabled={!inputVal.trim() || isProcessing}
            className="btn-sharp px-3 py-1 bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white font-mono text-xs font-bold flex items-center gap-1 transition-all shadow-sm shadow-brand-600/30"
          >
            {isProcessing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <>
                <span>Run</span>
                <CornerDownLeft className="w-3 h-3" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Dynamic contextual prompts */}
      {dynamicSuggestions.length > 0 && (
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[11px] font-mono">
          <span className="text-slate-400 flex items-center gap-1 text-[10px] uppercase tracking-wider">
            <Sparkles className="w-2.5 h-2.5 text-amber-400" />
            <span>Suggested:</span>
          </span>
          {dynamicSuggestions.map((sug, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onExecutePrompt(sug.prompt)}
              className="px-2 py-0.5 bg-slate-100 dark:bg-dark-900 hover:bg-brand-50 dark:hover:bg-brand-950/60 text-slate-700 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-300 border border-slate-200 dark:border-white/10 hover:border-brand-500/40 transition-colors text-[10px] rounded-none flex items-center gap-1"
            >
              <span>{sug.label}</span>
              <ArrowRight className="w-2.5 h-2.5 opacity-60" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
