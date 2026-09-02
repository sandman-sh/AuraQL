import React, { useState } from 'react';
import { Bot, Send, Sparkles, Zap, ArrowRight, CornerDownLeft, Loader2 } from 'lucide-react';
import { DatasetId } from '../../types';
import { webMcp } from '../../engine/webmcp';

interface AiCommandBarProps {
  activeDataset: DatasetId;
  onExecutePrompt: (promptText: string) => Promise<void>;
  isProcessing: boolean;
}

export const AiCommandBar: React.FC<AiCommandBarProps> = ({
  activeDataset,
  onExecutePrompt,
  isProcessing
}) => {
  const [inputVal, setInputVal] = useState('');

  const getQuickPrompts = () => {
    switch (activeDataset) {
      case 'ecommerce':
        return [
          {
            label: 'Top Categories by Net Revenue (Bar)',
            prompt: 'Plot the top product categories by net revenue as a bar chart'
          },
          {
            label: 'Regional Revenue & Order Velocity',
            prompt: 'Compare order velocity and total revenue across regions'
          },
          {
            label: 'VIP vs Standard Customer AOV',
            prompt: 'Show average order value for VIP and retail tiers'
          }
        ];
      case 'churn':
        return [
          {
            label: 'Critical Churn Accounts ARR (Area)',
            prompt: 'Isolate critical churn accounts with low health and plot ARR'
          },
          {
            label: 'MRR & Seat Utilization by Plan',
            prompt: 'Compare monthly MRR and average seat utilization across tiers'
          },
          {
            label: 'NPS vs Support Ticket Volume',
            prompt: 'Analyze accounts with high support tickets and negative NPS'
          }
        ];
      case 'webvitals':
        return [
          {
            label: 'P95 LCP by Device Profile (Donut)',
            prompt: 'Show mobile vs desktop largest contentful paint distribution'
          },
          {
            label: 'Routes with Worst Performance SLA',
            prompt: 'Audit routes marked with Poor rating and average LCP'
          },
          {
            label: 'Network Latency on 4G vs 5G',
            prompt: 'Compare LCP timings on cellular 4G versus WiFi connections'
          }
        ];
      default:
        return [
          {
            label: 'Aggregate Top 5 Values',
            prompt: 'Group and aggregate the highest values in the dataset'
          }
        ];
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() || isProcessing) return;
    const prompt = inputVal;
    setInputVal('');
    await onExecutePrompt(prompt);
  };

  const quickPrompts = getQuickPrompts();

  return (
    <div className="glass-card rounded-none p-3.5 border border-brand-500/40 bg-white dark:bg-dark-950 relative overflow-hidden glow-purple-sm">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-5 h-5 rounded-none bg-brand-600 flex items-center justify-center text-white">
          <Bot className="w-3 h-3" />
        </div>
        <span className="text-xs font-bold font-mono text-slate-900 dark:text-white flex items-center gap-2">
          <span>AuraQL AI Co-Pilot Command</span>
          <span className="text-[10px] font-mono font-normal px-1.5 py-0.2 rounded-none bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 border border-brand-200 dark:border-brand-500/30">
            WebMCP Bridge
          </span>
        </span>
      </div>

      {/* Input Prompt Form */}
      <form onSubmit={handleFormSubmit} className="relative flex items-center mb-2.5">
        <Sparkles className="w-4 h-4 text-brand-600 dark:text-brand-400 absolute left-3 pointer-events-none" />
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="Ask AuraQL Co-Pilot (e.g., 'Analyze our top revenue categories and plot a bar chart')..."
          className="w-full bg-slate-50 dark:bg-dark-900 rounded-none pl-9 pr-24 py-2 text-xs font-mono text-slate-900 dark:text-white border border-slate-300 dark:border-white/10 focus:border-brand-500 outline-none transition-colors"
        />

        <button
          type="submit"
          disabled={!inputVal.trim() || isProcessing}
          className="btn-sharp absolute right-1.5 px-3 py-1 bg-brand-600 hover:bg-brand-500 text-white font-mono text-xs flex items-center gap-1.5 disabled:opacity-40 transition-colors border border-brand-400/40"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Executing...</span>
            </>
          ) : (
            <>
              <span>Ask Agent</span>
              <CornerDownLeft className="w-3 h-3" />
            </>
          )}
        </button>
      </form>

      {/* Quick Prompt Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
        <span className="text-[10px] font-mono text-slate-500 uppercase shrink-0">Quick Queries:</span>
        {quickPrompts.map((qp, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onExecutePrompt(qp.prompt)}
            disabled={isProcessing}
            className="btn-sharp px-2 py-0.5 text-[10px] font-mono bg-slate-100 hover:bg-brand-50 hover:text-brand-700 dark:bg-dark-900 dark:hover:bg-brand-950 dark:hover:text-brand-300 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/[0.08] hover:border-brand-500/40 transition-all shrink-0 flex items-center gap-1"
          >
            <Sparkles className="w-2.5 h-2.5 text-brand-600 dark:text-brand-400" />
            <span>{qp.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
