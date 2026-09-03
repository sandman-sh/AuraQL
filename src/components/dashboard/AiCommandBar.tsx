import React, { useState, useMemo } from 'react';
import { Bot, Sparkles, ArrowRight, CornerDownLeft, Loader2, Settings2, Cpu } from 'lucide-react';
import { auraEngine } from '../../engine/auraql';
import { auraAgent } from '../../engine/agent';

interface AiCommandBarProps {
  activeDataset: string;
  onExecutePrompt: (promptText: string) => Promise<void>;
  isProcessing: boolean;
  onOpenAgentConfig?: () => void;
  agentStatusMessage?: string;
}

export const AiCommandBar: React.FC<AiCommandBarProps> = ({
  activeDataset,
  onExecutePrompt,
  isProcessing,
  onOpenAgentConfig,
  agentStatusMessage
}) => {
  const [inputVal, setInputVal] = useState('');
  const agentConfig = auraAgent.getConfig();

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
        prompt: `Show total ${numericCols[0]} by ${stringCols[0]} as a bar chart`
      });
    }

    if (stringCols[1] && numericCols[0]) {
      suggestions.push({
        label: `Share across ${stringCols[1]} (Donut)`,
        prompt: `Breakdown ${numericCols[0]} share across ${stringCols[1]}`
      });
    }

    if (numericCols[1]) {
      suggestions.push({
        label: `Trend Analysis of ${numericCols[1]} (Area)`,
        prompt: `Analyze distribution and trend of ${numericCols[1]}`
      });
    }

    suggestions.push({
      label: `Top Performers (Bar)`,
      prompt: `Find top 5 ${stringCols[0] || 'records'} by ${numericCols[0] || 'primary value'}`
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
        {/* Agent Provider Trigger Badge */}
        <button
          type="button"
          onClick={onOpenAgentConfig}
          className="absolute left-2.5 z-10 flex items-center gap-1.5 px-2 py-1 rounded-none bg-brand-50 dark:bg-brand-950 border border-brand-200 dark:border-brand-500/40 text-brand-700 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-brand-900 transition-colors"
          title="Configure AI Agent Provider (OpenAI, Claude, Gemini, Ollama, Smart Agent)"
        >
          <Bot className="w-3.5 h-3.5" />
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider hidden sm:inline">
            {agentConfig.provider === 'smart' ? 'Smart Agent' : agentConfig.provider}
          </span>
          <Settings2 className="w-3 h-3 opacity-60 ml-0.5" />
        </button>

        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder={`Instruct AI agent (e.g. "Rank top categories by revenue and show area chart on ${activeDataset || 'active table'}")`}
          disabled={isProcessing}
          className="w-full pl-36 sm:pl-44 pr-24 py-2 text-xs font-mono bg-white dark:bg-dark-900 border border-slate-300 dark:border-white/10 rounded-none focus:outline-none focus:border-brand-500 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors"
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

      {/* Live Agent Thought / Execution Status */}
      {isProcessing && agentStatusMessage && (
        <div className="mt-2.5 p-2 bg-brand-50/80 dark:bg-brand-950/50 border border-brand-300/40 dark:border-brand-500/30 flex items-center gap-2 text-xs font-mono text-brand-800 dark:text-brand-300 animate-pulse">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-600 shrink-0" />
          <span className="truncate">{agentStatusMessage}</span>
        </div>
      )}

      {/* Dynamic contextual suggestions */}
      {!isProcessing && dynamicSuggestions.length > 0 && (
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
