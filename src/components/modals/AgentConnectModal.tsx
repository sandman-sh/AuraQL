import React, { useState, useEffect } from 'react';
import {
  Bot,
  X,
  Check,
  Copy,
  Zap,
  Cpu,
  Key,
  Globe,
  Radio,
  ExternalLink,
  Shield,
  Play,
  Loader2,
  HelpCircle,
  Server,
  Code2,
  Terminal,
  Sparkles
} from 'lucide-react';
import { auraAgent, AgentProvider, AgentConfig } from '../../engine/agent';
import { webMcp } from '../../engine/webmcp';

interface AgentConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeDataset: string;
}

export const AgentConnectModal: React.FC<AgentConnectModalProps> = ({
  isOpen,
  onClose,
  activeDataset
}) => {
  const [activeTab, setActiveTab] = useState<'chatgpt-desktop' | 'in-browser' | 'external' | 'bridge'>('chatgpt-desktop');
  const [config, setConfig] = useState<AgentConfig>(auraAgent.getConfig());
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testOutput, setTestOutput] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [bridgeRunning, setBridgeRunning] = useState<boolean>(webMcp.isBridgeConnected);

  useEffect(() => {
    if (isOpen) {
      setConfig(auraAgent.getConfig());
      setIsSaved(false);
      setTestStatus('idle');
      setTestOutput('');

      const unsub = webMcp.subscribeBridgeStatus((connected) => {
        setBridgeRunning(connected);
      });
      return () => unsub();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    auraAgent.updateConfig(config);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleTestAgent = async () => {
    setTestStatus('testing');
    setTestOutput('Connecting to real LLM provider (not mocked)...');
    auraAgent.updateConfig(config);

    try {
      const res = await auraAgent.run(
        `List top product categories by revenue in ${activeDataset || 'ecommerce_sales'} and render a bar chart`,
        activeDataset || 'ecommerce_sales',
        (step) => {
          setTestOutput((prev) => `${prev}\n⚡ [${step.type.toUpperCase()}] ${step.message}`);
        }
      );

      if (res.success) {
        setTestStatus('success');
        setTestOutput((prev) => `${prev}\n\n✅ Real Agent execution complete! Tools executed: ${res.toolsExecuted.join(', ')}`);
      } else {
        setTestStatus('error');
        setTestOutput((prev) => `${prev}\n\n❌ ${res.finalMessage}`);
      }
    } catch (err: any) {
      setTestStatus('error');
      setTestOutput(`❌ Error running agent: ${err.message}`);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Real ChatGPT Desktop configuration
  const chatGptDesktopConfig = `{
  "mcpServers": {
    "auraql": {
      "command": "node",
      "args": [
        "<PATH_TO_AURAQL>/scripts/mcp-bridge.mjs",
        "--stdio"
      ]
    }
  }
}`;

  const chatGptSseConfig = `{
  "mcpServers": {
    "auraql": {
      "url": "http://localhost:3001/sse"
    }
  }
}`;

  const codexCliCmd = `codex mcp add auraql node scripts/mcp-bridge.mjs --stdio`;

  const pythonSnippet = `import requests

# 1. Connect to live WebMCP Bridge
BRIDGE_URL = "http://localhost:3001/api/mcp"

# 2. ChatGPT / Agent executes SQL query in browser AuraQL memory
res = requests.post(BRIDGE_URL, json={
    "tool": "execute_sql_query",
    "args": {
        "sql": "SELECT product_category, ROUND(SUM(revenue), 2) as total_rev FROM ecommerce_sales GROUP BY 1 ORDER BY total_rev DESC;"
    }
})
print("Result from AuraQL:", res.json())

# 3. Agent renders dynamic chart on user's live browser screen
requests.post(BRIDGE_URL, json={
    "tool": "render_interactive_chart",
    "args": {
        "type": "bar",
        "title": "Revenue by Product Vertical",
        "xAxis": "product_category",
        "yAxis": "total_rev",
        "colorTheme": "purple"
    }
})`;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div className="w-full max-w-3xl bg-white dark:bg-dark-950 border border-slate-300 dark:border-white/10 rounded-none shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-white/[0.08] flex items-center justify-between bg-slate-50 dark:bg-dark-900/80">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-none bg-brand-600 text-white flex items-center justify-center shadow-sm">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-mono text-slate-900 dark:text-white flex items-center gap-2">
                <span>CONNECT AI AGENT (CHATGPT & WEBMCP)</span>
                <span className="px-1.5 py-0.5 text-[9px] uppercase font-bold tracking-wider rounded-none bg-emerald-50 text-emerald-600 dark:bg-emerald-950/80 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/40">
                  Real MCP • Not Mocked
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                Connect Desktop ChatGPT, Claude Desktop, Codex CLI, or real in-browser AI (GPT-4o, Claude 3.7 Sonnet, Gemini 2.0)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Subnav Tabs */}
        <div className="flex border-b border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-dark-900/60 text-xs font-mono overflow-x-auto">
          <button
            onClick={() => setActiveTab('chatgpt-desktop')}
            className={`py-2 px-3 text-center transition-all flex items-center justify-center gap-2 shrink-0 ${
              activeTab === 'chatgpt-desktop'
                ? 'bg-brand-600 text-white font-bold shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Desktop ChatGPT & Claude</span>
          </button>

          <button
            onClick={() => setActiveTab('in-browser')}
            className={`py-2 px-3 text-center transition-all flex items-center justify-center gap-2 shrink-0 ${
              activeTab === 'in-browser'
                ? 'bg-brand-600 text-white font-bold shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>In-Browser AI (GPT-4o, Claude 3.7, Gemini 2.0)</span>
          </button>

          <button
            onClick={() => setActiveTab('external')}
            className={`py-2 px-3 text-center transition-all flex items-center justify-center gap-2 shrink-0 ${
              activeTab === 'external'
                ? 'bg-brand-600 text-white font-bold shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Python & LangChain</span>
          </button>

          <button
            onClick={() => setActiveTab('bridge')}
            className={`py-2 px-3 text-center transition-all flex items-center justify-center gap-2 shrink-0 ${
              activeTab === 'bridge'
                ? 'bg-brand-600 text-white font-bold shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span className="flex items-center gap-1.5">
              <span>Bridge Server</span>
              <span className={`w-2 h-2 rounded-full ${bridgeRunning ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
            </span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 font-mono text-xs space-y-4">
          {/* TAB 1: Desktop ChatGPT (Codex) */}
          {activeTab === 'chatgpt-desktop' && (
            <div className="space-y-4">
              <div className="p-3 bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-500/30 text-slate-700 dark:text-slate-300">
                <h4 className="font-bold text-brand-700 dark:text-brand-300 flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                  <span>Connecting Official Desktop ChatGPT (or Codex CLI)</span>
                </h4>
                <p className="text-[11px] font-sans text-slate-600 dark:text-slate-400 leading-relaxed">
                  Desktop ChatGPT communicates directly with this app using the <strong>Model Context Protocol (MCP)</strong>.
                  ChatGPT inspects the in-memory database, writes analytical SQL queries, and renders live charts directly on your screen.
                </p>
              </div>

              {/* Step 1: Config Stdio */}
              <div className="border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-dark-900 p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>Method A: Stdio Configuration (ChatGPT Desktop & Claude Desktop)</span>
                  </span>
                  <button
                    onClick={() => handleCopy(chatGptDesktopConfig, 'desktop_stdio')}
                    className="flex items-center gap-1 text-[11px] text-brand-600 dark:text-brand-400 hover:underline"
                  >
                    {copiedKey === 'desktop_stdio' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'desktop_stdio' ? 'Copied' : 'Copy JSON'}</span>
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-sans mb-1.5">
                  Paste into <code>%APPDATA%\OpenAI\ChatGPT\mcp.json</code> (or Claude Desktop configuration):
                </p>
                <pre className="p-2.5 bg-slate-950 text-slate-300 text-[10px] overflow-x-auto">
                  {chatGptDesktopConfig}
                </pre>
              </div>

              {/* Step 2: Config SSE */}
              <div className="border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-dark-900 p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>Method B: SSE Endpoint (Zero Stdio / Remote MCP)</span>
                  </span>
                  <button
                    onClick={() => handleCopy(chatGptSseConfig, 'desktop_sse')}
                    className="flex items-center gap-1 text-[11px] text-brand-600 dark:text-brand-400 hover:underline"
                  >
                    {copiedKey === 'desktop_sse' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'desktop_sse' ? 'Copied' : 'Copy JSON'}</span>
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-sans mb-1.5">
                  Connect ChatGPT directly to the active bridge server via HTTP SSE:
                </p>
                <pre className="p-2.5 bg-slate-950 text-emerald-400 text-[10px] overflow-x-auto">
                  {chatGptSseConfig}
                </pre>
              </div>

              {/* Step 3: Codex CLI */}
              <div className="border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-dark-900 p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>Method C: OpenAI Codex CLI Command</span>
                  </span>
                  <button
                    onClick={() => handleCopy(codexCliCmd, 'codex_cli')}
                    className="flex items-center gap-1 text-[11px] text-brand-600 dark:text-brand-400 hover:underline"
                  >
                    {copiedKey === 'codex_cli' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'codex_cli' ? 'Copied' : 'Copy Command'}</span>
                  </button>
                </div>
                <div className="p-2.5 bg-slate-950 text-emerald-400 text-[10px] overflow-x-auto">
                  <code>{codexCliCmd}</code>
                </div>
              </div>

              {/* Verification instructions */}
              <div className="p-3 bg-slate-100 dark:bg-dark-900 border border-slate-200 dark:border-white/10 text-[11px] text-slate-700 dark:text-slate-300 font-sans leading-relaxed">
                <div className="font-bold font-mono text-slate-900 dark:text-white mb-1">Testing with ChatGPT:</div>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>Start Desktop ChatGPT with the configuration above.</li>
                  <li>In ChatGPT, type: <code>"Inspect tables in Aura Analytics and show revenue by category as a bar chart"</code></li>
                  <li>Watch ChatGPT invoke <code>execute_sql_query</code> and <code>render_interactive_chart</code>, instantly updating this dashboard!</li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 2: In-Browser Real OpenAI API Execution */}
          {activeTab === 'in-browser' && (
            <div className="space-y-4">
              <div className="p-3 bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-500/30 text-slate-700 dark:text-slate-300">
                <span className="font-bold text-brand-700 dark:text-brand-300 flex items-center gap-1 mb-0.5">
                  <Key className="w-3.5 h-3.5" />
                  <span>Real In-Browser LLM Function Calling</span>
                </span>
                <p className="text-[11px] font-sans text-slate-600 dark:text-slate-400">
                  Runs real OpenAI API calls directly to <code>api.openai.com/v1/chat/completions</code> with multi-turn tool calling. Zero mock heuristics.
                </p>
              </div>

              <div>
                <label className="block text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                  Select Provider
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'openai', name: 'OpenAI (ChatGPT)', sub: 'gpt-4o, o3-mini, o1' },
                    { id: 'ollama', name: 'Ollama (Local LLM)', sub: 'llama3.3, deepseek-r1' },
                    { id: 'anthropic', name: 'Anthropic Claude', sub: 'claude-3-7-sonnet' },
                    { id: 'gemini', name: 'Google Gemini', sub: 'gemini-2.0-flash' },
                    { id: 'custom', name: 'Custom OpenAI Endpoint', sub: 'Groq, LM Studio, etc.' }
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setConfig({ ...config, provider: p.id as AgentProvider })}
                      className={`p-2.5 text-left border rounded-none transition-all ${
                        config.provider === p.id
                          ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-bold shadow-sm'
                          : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-dark-900 text-slate-700 dark:text-slate-300 hover:border-brand-500/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs">{p.name}</span>
                        {config.provider === p.id && <Check className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-sans mt-0.5">{p.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* API Key Input */}
              {config.provider !== 'ollama' && (
                <div>
                  <label className="block text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 mb-1">
                    {config.provider.toUpperCase()} API Key
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={config.apiKey}
                      onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                      placeholder={`Enter ${config.provider} API key (e.g. sk-...)`}
                      className="w-full p-2 pl-8 bg-slate-50 dark:bg-dark-900 border border-slate-300 dark:border-white/10 rounded-none text-xs text-slate-900 dark:text-white outline-none focus:border-brand-500"
                    />
                    <Key className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-sans mt-1">
                    Your key is stored only in local storage (localStorage) and sent directly to the provider.
                  </p>
                </div>
              )}

              {/* Model selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Model
                  </label>
                  <input
                    type="text"
                    value={config.model}
                    onChange={(e) => setConfig({ ...config, model: e.target.value })}
                    placeholder="gpt-4o"
                    className="w-full p-2 bg-slate-50 dark:bg-dark-900 border border-slate-300 dark:border-white/10 rounded-none text-xs text-slate-900 dark:text-white outline-none focus:border-brand-500"
                  />
                </div>

                {(config.provider === 'ollama' || config.provider === 'custom') && (
                  <div>
                    <label className="block text-[11px] uppercase font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Base URL Endpoint
                    </label>
                    <input
                      type="text"
                      value={config.baseUrl || ''}
                      onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
                      placeholder="http://localhost:11434/v1"
                      className="w-full p-2 bg-slate-50 dark:bg-dark-900 border border-slate-300 dark:border-white/10 rounded-none text-xs text-slate-900 dark:text-white outline-none focus:border-brand-500"
                    />
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSave}
                  className="btn-sharp px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold flex items-center gap-1.5 shadow-sm shadow-brand-600/30 transition-all"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isSaved ? 'Configuration Saved!' : 'Save Configuration'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleTestAgent}
                  disabled={testStatus === 'testing'}
                  className="btn-sharp px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-dark-900 dark:hover:bg-dark-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-white/10 flex items-center gap-1.5 transition-colors"
                >
                  {testStatus === 'testing' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-600" />
                  ) : (
                    <Play className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                  )}
                  <span>Test Real API Tool Call</span>
                </button>
              </div>

              {/* Test Output */}
              {testOutput && (
                <div className="mt-3 p-3 bg-slate-950 text-emerald-400 border border-slate-800 rounded-none text-[11px] font-mono leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap">
                  {testOutput}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Python & LangChain */}
          {activeTab === 'external' && (
            <div className="space-y-4">
              <div className="border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-dark-900 p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>Python Script (LangChain / OpenAI Swarm / Requests)</span>
                  </span>
                  <button
                    onClick={() => handleCopy(pythonSnippet, 'python')}
                    className="flex items-center gap-1 text-[11px] text-brand-600 dark:text-brand-400 hover:underline"
                  >
                    {copiedKey === 'python' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'python' ? 'Copied' : 'Copy Python'}</span>
                  </button>
                </div>
                <pre className="p-2.5 bg-slate-950 text-emerald-400 text-[10px] overflow-x-auto max-h-56">
                  {pythonSnippet}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 4: Bridge Server Status */}
          {activeTab === 'bridge' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-white/10 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${bridgeRunning ? 'bg-emerald-500 animate-ping' : 'bg-rose-500'}`} />
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {bridgeRunning ? 'WebMCP Bridge Online' : 'WebMCP Bridge Offline'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-sans mt-1">
                    Port 3001 serving Stdio & SSE for Desktop ChatGPT (Codex) and Claude Desktop.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => webMcp.connectBridgeServer()}
                  className="btn-sharp px-3 py-1.5 bg-slate-200 dark:bg-dark-800 text-slate-800 dark:text-slate-200 hover:bg-brand-600 hover:text-white transition-colors text-xs"
                >
                  Reconnect
                </button>
              </div>

              <div className="p-3 bg-slate-900 text-slate-200 border border-slate-800 space-y-2">
                <span className="text-[10px] uppercase text-slate-400 tracking-wider font-bold block">
                  Bridge Server Terminal Command:
                </span>
                <div className="flex items-center justify-between p-2 bg-slate-950 text-emerald-400 font-mono text-xs">
                  <code>npm.cmd run bridge</code>
                  <button
                    onClick={() => handleCopy('npm.cmd run bridge', 'bridge_cmd')}
                    className="text-slate-400 hover:text-white"
                  >
                    {copiedKey === 'bridge_cmd' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-dark-900/80 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            Provider: <span className="font-bold text-brand-600 dark:text-brand-400 uppercase">{config.provider}</span> ({config.model})
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-sharp px-4 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-dark-800 dark:hover:bg-dark-700 text-slate-800 dark:text-slate-200 font-mono text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
