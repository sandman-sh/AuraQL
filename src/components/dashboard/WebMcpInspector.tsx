import React, { useState } from 'react';
import { Activity, Zap, Play, Bot, X, Terminal, Code2, Check, Copy, Trash2 } from 'lucide-react';
import { WebMcpToolEvent } from '../../types';
import { webMcp } from '../../engine/webmcp';

interface WebMcpInspectorProps {
  isOpen: boolean;
  onClose: () => void;
  events: WebMcpToolEvent[];
  activeDataset: string;
}

export const WebMcpInspector: React.FC<WebMcpInspectorProps> = ({
  isOpen,
  onClose,
  events,
  activeDataset
}) => {
  const [activeTab, setActiveTab] = useState<'stream' | 'runner' | 'specs'>('stream');
  const [selectedTool, setSelectedTool] = useState<string>('execute_sql_query');
  const [toolInputJson, setToolInputJson] = useState<string>(
    JSON.stringify({ sql: `SELECT * FROM ${activeDataset || 'my_table'} LIMIT 10;` }, null, 2)
  );
  const [executionResult, setExecutionResult] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  if (!isOpen) return null;

  const tools = webMcp.getRegisteredTools();

  const handleToolSelect = (toolName: string) => {
    setSelectedTool(toolName);
    setExecutionResult(null);

    if (toolName === 'list_tables_and_schema') {
      setToolInputJson(JSON.stringify({}, null, 2));
    } else if (toolName === 'execute_sql_query') {
      setToolInputJson(
        JSON.stringify({ sql: `SELECT * FROM ${activeDataset || 'my_table'} LIMIT 10;` }, null, 2)
      );
    } else if (toolName === 'render_interactive_chart') {
      setToolInputJson(
        JSON.stringify(
          {
            type: 'bar',
            title: `Analytics Overview - ${activeDataset || 'Dataset'}`,
            xAxis: 'category',
            yAxis: 'value',
            colorTheme: 'purple'
          },
          null,
          2
        )
      );
    } else if (toolName === 'apply_dashboard_filter') {
      setToolInputJson(
        JSON.stringify(
          {
            column: 'status',
            operator: '=',
            value: 'Active'
          },
          null,
          2
        )
      );
    }
  };

  const handleRunTool = async () => {
    setIsExecuting(true);
    setExecutionResult(null);
    try {
      const parsedArgs = toolInputJson.trim() ? JSON.parse(toolInputJson) : {};
      const result = await webMcp.callTool(selectedTool, parsedArgs);
      setExecutionResult(JSON.stringify(result, null, 2));
    } catch (err: any) {
      setExecutionResult(JSON.stringify({ error: err.message || 'Execution failed' }, null, 2));
    } finally {
      setIsExecuting(false);
    }
  };

  const sampleSnippet = `// Real WebMCP call via window.modelContext (OpenAI/Browser Agent spec):
const response = await window.modelContext.callTool('execute_sql_query', {
  sql: "SELECT * FROM ${activeDataset || 'my_table'} LIMIT 5;"
});

console.log(response.content[0].text);`;

  const handleCopySnippet = () => {
    navigator.clipboard.writeText(sampleSnippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="w-full lg:w-[420px] glass-panel border-l border-slate-200 dark:border-white/[0.08] flex flex-col h-full z-20 shrink-0 bg-white/95 dark:bg-dark-950/95 transition-colors">
      {/* Inspector Header */}
      <div className="p-3.5 border-b border-slate-200 dark:border-white/[0.08] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-none bg-brand-50 dark:bg-brand-950 border border-brand-200 dark:border-brand-500/40 flex items-center justify-center text-brand-600 dark:text-brand-400">
            <Bot className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white font-mono tracking-tight flex items-center gap-1.5">
              <span>WebMCP Protocol Inspector</span>
              <span className="w-1.5 h-1.5 rounded-none bg-emerald-500 animate-pulse" />
            </h4>
            <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400">
              window.modelContext active & listening
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-none text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-dark-800"
          title="Close Inspector"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-white/[0.06] bg-slate-100 dark:bg-dark-900/60 p-1 gap-1">
        <button
          onClick={() => setActiveTab('stream')}
          className={`flex-1 py-1 text-[11px] font-mono rounded-none transition-colors ${
            activeTab === 'stream'
              ? 'bg-brand-600 text-white font-bold border border-brand-400/40 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Telemetry ({events.length})
        </button>
        <button
          onClick={() => setActiveTab('runner')}
          className={`flex-1 py-1 text-[11px] font-mono rounded-none transition-colors ${
            activeTab === 'runner'
              ? 'bg-brand-600 text-white font-bold border border-brand-400/40 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Tool Runner
        </button>
        <button
          onClick={() => setActiveTab('specs')}
          className={`flex-1 py-1 text-[11px] font-mono rounded-none transition-colors ${
            activeTab === 'specs'
              ? 'bg-brand-600 text-white font-bold border border-brand-400/40 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Agent Docs
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
        {/* Stream Tab */}
        {activeTab === 'stream' && (
          <div>
            <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Live MCP Invocations</span>
              {events.length > 0 && (
                <button
                  onClick={() => webMcp.clearTelemetry()}
                  className="flex items-center gap-1 text-[10px] text-rose-500 hover:text-rose-600"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              )}
            </div>

            {events.length === 0 ? (
              <div className="text-center py-12 px-3 rounded-none border border-dashed border-slate-300 dark:border-white/10 text-slate-400 dark:text-slate-500 font-mono text-xs">
                <Activity className="w-5 h-5 mx-auto mb-2 text-slate-400 dark:text-slate-600 animate-pulse" />
                <p>Awaiting incoming WebMCP tool calls...</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-600 mt-1">
                  Tools are active on <code>window.modelContext</code>. Use the Tool Runner tab or an external agent to invoke.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {events.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-2.5 rounded-none bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-white/[0.08] hover:border-brand-500/40 transition-all font-mono text-xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-brand-700 dark:text-brand-300 font-bold text-[11px] flex items-center gap-1">
                        <Zap className="w-3 h-3 text-brand-600 dark:text-brand-400" />
                        {evt.toolName}
                      </span>
                      <span className="text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold">
                        ⚡ {evt.durationMs}ms
                      </span>
                    </div>

                    <div className="text-slate-700 dark:text-slate-300 text-[11px] mb-1 leading-snug">
                      {evt.resultSummary}
                    </div>

                    {evt.args && Object.keys(evt.args).length > 0 && (
                      <div className="mt-1.5 p-1.5 rounded-none bg-slate-100 dark:bg-dark-950 text-[10px] text-slate-600 dark:text-slate-400 overflow-x-auto border border-slate-200 dark:border-white/[0.04]">
                        <pre className="font-mono">{JSON.stringify(evt.args, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Real Tool Runner Tab (Developer testing against real WebMCP) */}
        {activeTab === 'runner' && (
          <div className="space-y-3 font-mono text-xs">
            <div className="p-2.5 rounded-none bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-500/30 text-slate-700 dark:text-slate-300">
              <span className="font-bold text-brand-700 dark:text-brand-300 flex items-center gap-1 mb-0.5">
                <Terminal className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                <span>WebMCP Protocol Tool Runner</span>
              </span>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 font-sans">
                Invoke real registered WebMCP tools directly against the in-memory engine.
              </p>
            </div>

            {/* Tool Selection */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1">
                Select WebMCP Tool
              </label>
              <select
                value={selectedTool}
                onChange={(e) => handleToolSelect(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-dark-900 border border-slate-300 dark:border-white/10 rounded-none text-xs font-mono text-slate-900 dark:text-white focus:border-brand-500 outline-none"
              >
                {tools.map((t) => (
                  <option key={t.name} value={t.name}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Argument JSON Editor */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
                  Input Parameters (JSON)
                </label>
                <span className="text-[9px] text-slate-400">Standard MCP inputSchema</span>
              </div>
              <textarea
                value={toolInputJson}
                onChange={(e) => setToolInputJson(e.target.value)}
                rows={5}
                className="w-full p-2 bg-slate-900 text-emerald-400 border border-slate-700 rounded-none font-mono text-[11px] leading-relaxed outline-none focus:border-brand-500 resize-y"
                placeholder="Enter tool arguments in JSON format..."
              />
            </div>

            {/* Execute Button */}
            <button
              onClick={handleRunTool}
              disabled={isExecuting}
              className="w-full py-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-mono text-xs font-bold rounded-none flex items-center justify-center gap-1.5 shadow-sm shadow-brand-600/30 transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isExecuting ? 'Executing...' : 'Invoke WebMCP Tool'}</span>
            </button>

            {/* Raw MCP Response */}
            {executionResult && (
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1">
                  MCP Protocol Response Payload
                </label>
                <div className="p-2.5 bg-slate-950 text-slate-300 border border-slate-800 rounded-none overflow-x-auto max-h-56 text-[10px] font-mono leading-tight">
                  <pre>{executionResult}</pre>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Specs & Agent Connection Tab */}
        {activeTab === 'specs' && (
          <div className="space-y-3 font-mono text-xs">
            <div className="p-2.5 rounded-none bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-white/[0.08]">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1 text-[11px]">
                  <Code2 className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                  <span>Agent Invocation Snippet</span>
                </span>
                <button
                  onClick={handleCopySnippet}
                  className="flex items-center gap-1 text-[10px] text-brand-600 dark:text-brand-400 hover:underline"
                >
                  {copiedCode ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="p-2 bg-slate-950 text-emerald-400 rounded-none overflow-x-auto text-[10px]">
                <pre>{sampleSnippet}</pre>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
                Registered Tool Definitions ({tools.length})
              </div>

              {tools.map((t) => (
                <div
                  key={t.name}
                  className="p-2.5 rounded-none bg-white dark:bg-dark-900 border border-slate-200 dark:border-white/[0.06] shadow-sm"
                >
                  <div className="text-brand-700 dark:text-brand-300 font-bold mb-0.5 text-[11px]">
                    {t.name}
                  </div>
                  <p className="text-[10px] text-slate-600 dark:text-slate-400 font-sans leading-relaxed mb-1.5">
                    {t.description}
                  </p>
                  <div className="text-[9px] text-slate-500 dark:text-slate-400">
                    Required:{' '}
                    <span className="text-brand-600 dark:text-brand-400">
                      {t.inputSchema.required?.join(', ') || 'None'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
