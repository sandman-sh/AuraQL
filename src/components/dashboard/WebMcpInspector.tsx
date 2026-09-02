import React, { useState } from 'react';
import { Activity, Zap, Play, Bot, X, Sparkles } from 'lucide-react';
import { WebMcpToolEvent, DatasetId } from '../../types';
import { webMcp } from '../../engine/webmcp';

interface WebMcpInspectorProps {
  isOpen: boolean;
  onClose: () => void;
  events: WebMcpToolEvent[];
  activeDataset: DatasetId;
}

export const WebMcpInspector: React.FC<WebMcpInspectorProps> = ({
  isOpen,
  onClose,
  events,
  activeDataset
}) => {
  const [activeTab, setActiveTab] = useState<'stream' | 'simulate' | 'specs'>('stream');
  const [simulating, setSimulating] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSimulateScenario = async (scenario: 'top_rev' | 'critical_churn' | 'vitals_mobile') => {
    setSimulating(true);
    try {
      if (scenario === 'top_rev') {
        await webMcp.executeSimulatedTool('execute_sql_query', {
          sql: 'SELECT product_category, ROUND(SUM(revenue), 2) as total_rev FROM ecommerce_sales GROUP BY product_category ORDER BY total_rev DESC;'
        });
        await webMcp.executeSimulatedTool('render_interactive_chart', {
          type: 'bar',
          title: 'Top Performing Categories by Net Revenue',
          xAxis: 'product_category',
          yAxis: 'total_rev',
          colorTheme: 'purple'
        });
      } else if (scenario === 'critical_churn') {
        await webMcp.executeSimulatedTool('execute_sql_query', {
          sql: 'SELECT company_name, monthly_mrr, health_score FROM saas_churn_metrics WHERE health_score < 45 ORDER BY monthly_mrr DESC LIMIT 8;'
        });
        await webMcp.executeSimulatedTool('render_interactive_chart', {
          type: 'area',
          title: 'Critical Accounts ARR vs Health Index',
          xAxis: 'company_name',
          yAxis: 'monthly_mrr',
          colorTheme: 'gradient'
        });
      } else if (scenario === 'vitals_mobile') {
        await webMcp.executeSimulatedTool('execute_sql_query', {
          sql: "SELECT url_path, ROUND(AVG(lcp_ms), 0) as avg_lcp_ms FROM web_vitals_telemetry WHERE device_type = 'Mobile' GROUP BY url_path ORDER BY avg_lcp_ms DESC;"
        });
        await webMcp.executeSimulatedTool('render_interactive_chart', {
          type: 'donut',
          title: 'Mobile P95 Largest Contentful Paint by Route',
          xAxis: 'url_path',
          yAxis: 'avg_lcp_ms',
          colorTheme: 'cyan'
        });
      }
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="w-full lg:w-96 glass-panel border-l border-white/[0.08] flex flex-col h-full z-20 shrink-0 bg-dark-950/95">
      {/* Inspector Header */}
      <div className="p-3.5 border-b border-white/[0.08] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-none bg-brand-950 border border-brand-500/40 flex items-center justify-center text-brand-400">
            <Bot className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white font-mono tracking-tight flex items-center gap-1.5">
              <span>WebMCP Bridge</span>
              <span className="w-1.5 h-1.5 rounded-none bg-emerald-400 animate-pulse" />
            </h4>
            <span className="text-[9px] font-mono text-emerald-400">document.modelContext active</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-none text-slate-400 hover:text-white hover:bg-dark-800"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Sharp Tabs */}
      <div className="flex border-b border-white/[0.06] bg-dark-900/60 p-1 gap-1">
        <button
          onClick={() => setActiveTab('stream')}
          className={`flex-1 py-1 text-[11px] font-mono rounded-none transition-colors ${
            activeTab === 'stream'
              ? 'bg-brand-600 text-white font-bold border border-brand-400/40 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Live Telemetry ({events.length})
        </button>
        <button
          onClick={() => setActiveTab('simulate')}
          className={`flex-1 py-1 text-[11px] font-mono rounded-none transition-colors ${
            activeTab === 'simulate'
              ? 'bg-brand-600 text-white font-bold border border-brand-400/40 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Agent Sandbox
        </button>
        <button
          onClick={() => setActiveTab('specs')}
          className={`flex-1 py-1 text-[11px] font-mono rounded-none transition-colors ${
            activeTab === 'specs'
              ? 'bg-brand-600 text-white font-bold border border-brand-400/40 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Tool Specs
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
        {activeTab === 'stream' && (
          <div>
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Tool Invocations Stream</span>
              <span>Execution Duration</span>
            </div>

            {events.length === 0 ? (
              <div className="text-center py-12 px-3 rounded-none border border-dashed border-white/10 text-slate-500 font-mono text-xs">
                <Activity className="w-5 h-5 mx-auto mb-2 text-slate-600 animate-pulse" />
                <p>Waiting for agent calls via WebMCP...</p>
                <p className="text-[10px] text-slate-600 mt-1">
                  Open in ChatGPT in-app browser or click "Agent Sandbox" to trigger.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {events.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-2.5 rounded-none bg-dark-900 border border-white/[0.08] hover:border-brand-500/40 transition-all font-mono text-xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-brand-300 font-bold text-[11px] flex items-center gap-1">
                        <Zap className="w-3 h-3 text-brand-400" />
                        {evt.toolName}
                      </span>
                      <span className="text-emerald-400 text-[10px] font-semibold">
                        ⚡ {evt.durationMs}ms
                      </span>
                    </div>

                    <div className="text-slate-300 text-[11px] mb-1 leading-snug">
                      {evt.resultSummary}
                    </div>

                    {evt.args && Object.keys(evt.args).length > 0 && (
                      <div className="mt-1.5 p-1.5 rounded-none bg-dark-950 text-[10px] text-slate-400 overflow-x-auto border border-white/[0.04]">
                        <pre className="font-mono">{JSON.stringify(evt.args, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'simulate' && (
          <div className="space-y-3">
            <div className="p-3 rounded-none bg-brand-950/40 border border-brand-500/30 text-xs text-slate-300">
              <span className="font-bold text-brand-300 flex items-center gap-1 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                <span>Judge & Reviewer Simulator</span>
              </span>
              <p className="text-[11px] text-slate-400">
                Trigger exact WebMCP tool calls as if ChatGPT was connected in its in-app browser.
              </p>
            </div>

            <div className="space-y-2">
              <button
                disabled={simulating}
                onClick={() => handleSimulateScenario('top_rev')}
                className="w-full text-left p-2.5 rounded-none bg-dark-900 hover:bg-dark-850 border border-white/[0.08] hover:border-brand-500/40 transition-all group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-white text-xs font-mono group-hover:text-brand-300">
                    1. Query Category Revenues
                  </span>
                  <Play className="w-3.5 h-3.5 text-brand-400" />
                </div>
                <p className="text-[11px] text-slate-400">
                  Executes aggregation SQL + renders live bar chart on active canvas.
                </p>
              </button>

              <button
                disabled={simulating}
                onClick={() => handleSimulateScenario('critical_churn')}
                className="w-full text-left p-2.5 rounded-none bg-dark-900 hover:bg-dark-850 border border-white/[0.08] hover:border-purple-500/40 transition-all group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-white text-xs font-mono group-hover:text-purple-300">
                    2. Isolate At-Risk Churn Accounts
                  </span>
                  <Play className="w-3.5 h-3.5 text-purple-400" />
                </div>
                <p className="text-[11px] text-slate-400">
                  Queries health_score &lt; 45 + renders area distribution chart.
                </p>
              </button>

              <button
                disabled={simulating}
                onClick={() => handleSimulateScenario('vitals_mobile')}
                className="w-full text-left p-2.5 rounded-none bg-dark-900 hover:bg-dark-850 border border-white/[0.08] hover:border-cyan-500/40 transition-all group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-white text-xs font-mono group-hover:text-cyan-300">
                    3. Audit Mobile LCP Route Latency
                  </span>
                  <Play className="w-3.5 h-3.5 text-accent-cyan" />
                </div>
                <p className="text-[11px] text-slate-400">
                  Computes mobile Web Vitals + renders donut distribution of slowest routes.
                </p>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'specs' && (
          <div className="space-y-2.5 font-mono text-xs">
            <div className="p-2.5 rounded-none bg-dark-900 border border-white/[0.06]">
              <div className="text-brand-300 font-bold mb-0.5">list_tables_and_schema</div>
              <p className="text-[11px] text-slate-400 font-sans">
                Exposes available dataset tables, column definitions, data types, and row counts.
              </p>
            </div>

            <div className="p-2.5 rounded-none bg-dark-900 border border-white/[0.06]">
              <div className="text-brand-300 font-bold mb-0.5">execute_sql_query(sql)</div>
              <p className="text-[11px] text-slate-400 font-sans">
                Executes OLAP SQL directly inside client AuraQL core in &lt;10ms and returns structured records.
              </p>
            </div>

            <div className="p-2.5 rounded-none bg-dark-900 border border-white/[0.06]">
              <div className="text-brand-300 font-bold mb-0.5">render_interactive_chart(type, x, y)</div>
              <p className="text-[11px] text-slate-400 font-sans">
                Commands the live browser viewport to render Bar, Area, Line, or Donut visualizations.
              </p>
            </div>

            <div className="p-2.5 rounded-none bg-dark-900 border border-white/[0.06]">
              <div className="text-brand-300 font-bold mb-0.5">apply_dashboard_filter(col, val)</div>
              <p className="text-[11px] text-slate-400 font-sans">
                Slices and filters the active dataset metrics and tabular view.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
