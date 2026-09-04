import React, { useState, useEffect } from 'react';
import {
  Bot,
  X,
  Check,
  Copy,
  Zap,
  Cpu,
  Key,
  ExternalLink,
  Play,
  Loader2,
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
  const [bridgeTarget, setBridgeTarget] = useState<'cloud' | 'local'>('cloud');
  const [desktopMethod, setDesktopMethod] = useState<'sse' | 'stdio'>('sse');

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

  const activeTargetUrl = bridgeTarget === 'cloud' ? 'https://auraql.onrender.com' : 'http://localhost:3001';

  const handleSave = () => {
    auraAgent.updateConfig(config);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2200);
  };

  const handleTestAgent = async () => {
    setTestStatus('testing');
    setTestOutput('Initiating real LLM provider tool call...');
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
        setTestOutput((prev) => `${prev}\n\n✅ Real Agent execution complete! Executed: ${res.toolsExecuted.join(', ')}`);
      } else {
        setTestStatus('error');
        setTestOutput((prev) => `${prev}\n\n❌ ${res.finalMessage}`);
      }
    } catch (err: any) {
      setTestStatus('error');
      setTestOutput(`❌ Error executing agent: ${err.message}`);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const userSessionId = typeof window !== 'undefined' ? webMcp.getSessionId() : 'default';

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
      "url": "${activeTargetUrl}/sse?session=${userSessionId}"
    }
  }
}`;

  const codexCliCmd = bridgeTarget === 'cloud' 
    ? `codex mcp add auraql "${activeTargetUrl}/sse?session=${userSessionId}"`
    : `codex mcp add auraql node scripts/mcp-bridge.mjs --stdio`;

  const pythonSnippet = `import requests

# 1. Connect to live WebMCP Bridge (Session Isolated)
BRIDGE_URL = "${activeTargetUrl}/api/mcp?session=${userSessionId}"

# 2. Execute analytical SQL in local AuraQL browser memory
res = requests.post(BRIDGE_URL, json={
    "tool": "execute_sql_query",
    "args": {
        "sql": "SELECT product_category, ROUND(SUM(revenue), 2) as total_rev FROM ecommerce_sales GROUP BY 1 ORDER BY total_rev DESC;"
    }
})
print("Result from AuraQL:", res.json())

# 3. Agent renders interactive chart directly on user's live screen
requests.post(BRIDGE_URL, json={
    "tool": "render_interactive_chart",
    "args": {
        "type": "bar",
        "title": "Revenue by Product Category",
        "xAxis": "product_category",
        "yAxis": "total_rev",
        "colorTheme": "purple"
    }
})`;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="w-full max-w-2xl bg-white dark:bg-dark-950 border border-slate-300 dark:border-white/10 shadow-2xl flex flex-col h-[85vh] max-h-[620px] overflow-hidden transition-colors">
        
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-50 dark:bg-dark-900/90 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-brand-600 text-white flex items-center justify-center shadow-sm">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold font-mono text-slate-900 dark:text-white flex items-center gap-2">
                <span>AI AGENT & WEBMCP HUB</span>
                <span className="px-1.5 py-0.2 text-[9px] uppercase font-bold tracking-wider bg-emerald-50 text-emerald-600 dark:bg-emerald-950/80 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/40">
                  {bridgeRunning ? 'Bridge Active' : 'Real MCP'}
                </span>
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-sans">
                Connect Desktop ChatGPT, Claude Desktop, or configure direct in-browser LLM keys.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            title="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-dark-900/60 text-xs font-mono overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('chatgpt-desktop')}
            className={`py-2 px-3 sm:px-4 text-center transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'chatgpt-desktop'
                ? 'bg-brand-600 text-white font-bold shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-dark-800'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Desktop MCP</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('in-browser')}
            className={`py-2 px-3 sm:px-4 text-center transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'in-browser'
                ? 'bg-brand-600 text-white font-bold shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-dark-800'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>In-Browser LLM</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('external')}
            className={`py-2 px-3 sm:px-4 text-center transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'external'
                ? 'bg-brand-600 text-white font-bold shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-dark-800'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Python API</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('bridge')}
            className={`py-2 px-3 sm:px-4 text-center transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'bridge'
                ? 'bg-brand-600 text-white font-bold shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-dark-800'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Bridge Server</span>
            <span className={`w-1.5 h-1.5 rounded-full ${bridgeRunning ? 'bg-emerald-400' : 'bg-rose-400'}`} />
          </button>
        </div>

        {/* Scrollable Body Content */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 font-mono text-xs space-y-3.5">
          
          {/* TAB 1: Desktop ChatGPT & Claude Desktop */}
          {activeTab === 'chatgpt-desktop' && (
            <div className="space-y-3">
              <div className="p-2.5 bg-brand-50/80 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-500/30 text-slate-700 dark:text-slate-300">
                <div className="font-bold text-brand-700 dark:text-brand-300 flex items-center gap-1.5 text-xs mb-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                  <span>Desktop ChatGPT & Claude Integration</span>
                </div>
                <p className="text-[11px] font-sans text-slate-600 dark:text-slate-400">
                  ChatGPT, Claude Desktop, and Codex inspect browser memory via <strong>Model Context Protocol (MCP)</strong>. Each tab uses an isolated Session Token (<code className="font-mono text-[10px] text-brand-600 dark:text-brand-400 font-semibold">{userSessionId}</code>), ensuring multiple simultaneous users never conflict.
                </p>
              </div>

              {/* Method Switcher & Target Selection */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-white/10 text-xs">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setDesktopMethod('sse')}
                    className={`px-2.5 py-1 text-[11px] font-semibold transition-all ${
                      desktopMethod === 'sse'
                        ? 'bg-brand-600 text-white font-bold shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-dark-800'
                    }`}
                  >
                    Remote SSE (Zero Install)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDesktopMethod('stdio')}
                    className={`px-2.5 py-1 text-[11px] font-semibold transition-all ${
                      desktopMethod === 'stdio'
                        ? 'bg-brand-600 text-white font-bold shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-dark-800'
                    }`}
                  >
                    Local Stdio (Node)
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 bg-brand-50 text-brand-700 dark:bg-brand-950/80 dark:text-brand-300 border border-brand-200 dark:border-brand-500/30" title="Dedicated session token for this browser tab">
                    Session: {userSessionId}
                  </span>
                  <button
                    type="button"
                    onClick={() => setBridgeTarget(bridgeTarget === 'cloud' ? 'local' : 'cloud')}
                    className="px-2 py-0.5 text-[10px] bg-slate-200 dark:bg-dark-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-white/10"
                  >
                    {bridgeTarget === 'cloud' ? '☁️ Cloud Render' : '💻 Localhost'}
                  </button>
                </div>
              </div>

              {/* Code Box */}
              <div className="border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-dark-900 p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[11px] text-slate-800 dark:text-slate-200 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-brand-500" />
                    <span>Configuration JSON ({desktopMethod === 'sse' ? 'HTTP SSE' : 'Node Stdio'})</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(desktopMethod === 'sse' ? chatGptSseConfig : chatGptDesktopConfig, 'desktop_code')}
                    className="text-[10px] text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                  >
                    {copiedKey === 'desktop_code' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'desktop_code' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <pre className="p-2.5 bg-slate-950 text-emerald-400 text-[10px] overflow-x-auto max-h-36 border border-slate-800">
                  {desktopMethod === 'sse' ? chatGptSseConfig : chatGptDesktopConfig}
                </pre>
              </div>

              {/* File Paths Helper */}
              <div className="p-2.5 bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-white/10 text-[10px] space-y-1">
                <span className="font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">Configuration File Locations:</span>
                <div className="text-slate-600 dark:text-slate-300 space-y-0.5 font-sans">
                  <div>• <strong>Claude Desktop (Win):</strong> <code className="font-mono text-[9px]">%APPDATA%\Claude\claude_desktop_config.json</code></div>
                  <div>• <strong>ChatGPT Desktop (Win):</strong> <code className="font-mono text-[9px]">%APPDATA%\OpenAI\ChatGPT\mcp.json</code></div>
                  <div>• <strong>Codex CLI:</strong> <code className="font-mono text-[9px]">{codexCliCmd}</code></div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: In-Browser Real OpenAI / Anthropic / Gemini Execution */}
          {activeTab === 'in-browser' && (
            <div className="space-y-3">
              <div className="p-2.5 bg-brand-50/80 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-500/30 text-slate-700 dark:text-slate-300">
                <div className="font-bold text-brand-700 dark:text-brand-300 flex items-center gap-1 text-xs mb-0.5">
                  <Key className="w-3.5 h-3.5" />
                  <span>Direct In-Browser LLM Function Calling</span>
                </div>
                <p className="text-[11px] font-sans text-slate-600 dark:text-slate-400">
                  Direct provider API execution with multi-turn tool calling. Your API key stays in local storage and is never sent to our servers.
                </p>
              </div>

              {/* Provider Selection Grid */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1">
                  Select Provider
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                  {[
                    { id: 'openai', name: 'OpenAI', defModel: 'gpt-4o' },
                    { id: 'anthropic', name: 'Claude', defModel: 'claude-3-7-sonnet' },
                    { id: 'gemini', name: 'Gemini', defModel: 'gemini-2.0-flash' },
                    { id: 'ollama', name: 'Ollama', defModel: 'llama3.3' },
                    { id: 'custom', name: 'Custom', defModel: 'gpt-4o' }
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setConfig({ ...config, provider: p.id as AgentProvider, model: config.model || p.defModel })}
                      className={`p-2 text-center border transition-all text-xs ${
                        config.provider === p.id
                          ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-bold shadow-sm'
                          : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-dark-900 text-slate-700 dark:text-slate-300 hover:border-brand-500/40'
                      }`}
                    >
                      <div className="truncate font-semibold">{p.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* API Key Input */}
              {config.provider !== 'ollama' && (
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1">
                    {config.provider.toUpperCase()} API Key
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={config.apiKey}
                      onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                      placeholder={`Enter ${config.provider} API key (e.g. sk-...)`}
                      className="w-full p-2 pl-8 bg-slate-50 dark:bg-dark-900 border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white outline-none focus:border-brand-500 font-mono"
                    />
                    <Key className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  </div>
                </div>
              )}

              {/* Model & Base URL inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1">
                    Model Name
                  </label>
                  <input
                    type="text"
                    value={config.model}
                    onChange={(e) => setConfig({ ...config, model: e.target.value })}
                    placeholder="gpt-4o"
                    className="w-full p-1.5 bg-slate-50 dark:bg-dark-900 border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white outline-none focus:border-brand-500 font-mono"
                  />
                </div>

                {(config.provider === 'ollama' || config.provider === 'custom') && (
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1">
                      Base URL Endpoint
                    </label>
                    <input
                      type="text"
                      value={config.baseUrl || ''}
                      onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
                      placeholder="http://localhost:11434/v1"
                      className="w-full p-1.5 bg-slate-50 dark:bg-dark-900 border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white outline-none focus:border-brand-500 font-mono"
                    />
                  </div>
                )}
              </div>

              {/* Real API Test Output */}
              {testOutput && (
                <div className="p-2.5 bg-slate-950 text-emerald-400 border border-slate-800 text-[10px] font-mono leading-relaxed max-h-32 overflow-y-auto whitespace-pre-wrap">
                  {testOutput}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Python & LangChain */}
          {activeTab === 'external' && (
            <div className="space-y-3">
              <div className="border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-dark-900 p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white text-xs">
                    Python Script (LangChain / OpenAI Swarm / Requests)
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(pythonSnippet, 'python')}
                    className="flex items-center gap-1 text-[11px] text-brand-600 dark:text-brand-400 hover:underline"
                  >
                    {copiedKey === 'python' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'python' ? 'Copied' : 'Copy Python'}</span>
                  </button>
                </div>
                <pre className="p-2.5 bg-slate-950 text-emerald-400 text-[10px] overflow-x-auto max-h-48 border border-slate-800 font-mono">
                  {pythonSnippet}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 4: Bridge Server Status */}
          {activeTab === 'bridge' && (
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-white/10 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${bridgeRunning ? 'bg-emerald-500 animate-ping' : 'bg-rose-500'}`} />
                    <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                      {bridgeRunning ? 'WebMCP Bridge Online' : 'WebMCP Bridge Offline'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-sans mt-0.5">
                    Target: <span className="font-mono text-brand-600 dark:text-brand-400 font-semibold">{activeTargetUrl}</span>
                    <a
                      href={`${activeTargetUrl}/health`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand-600 dark:text-brand-400 hover:underline inline-flex items-center gap-0.5 ml-2 text-[10px]"
                    >
                      <span>Check Health</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => webMcp.connectBridgeServer()}
                  className="px-2.5 py-1 bg-slate-200 dark:bg-dark-800 text-slate-800 dark:text-slate-200 hover:bg-brand-600 hover:text-white transition-colors text-xs font-semibold"
                >
                  Reconnect
                </button>
              </div>

              <div className="p-2.5 bg-slate-900 text-slate-200 border border-slate-800 space-y-1.5">
                <span className="text-[10px] uppercase text-slate-400 tracking-wider font-bold block">
                  Local Terminal Command:
                </span>
                <div className="flex items-center justify-between p-2 bg-slate-950 text-emerald-400 font-mono text-xs">
                  <code>npm.cmd run bridge</code>
                  <button
                    type="button"
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

        {/* Always Fixed Sticky Footer with Action Buttons */}
        <div className="px-4 py-2.5 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-dark-900/90 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-2">
            {activeTab === 'in-browser' && (
              <span>Provider: <strong className="text-brand-600 dark:text-brand-400 uppercase">{config.provider}</strong> ({config.model})</span>
            )}
            {activeTab === 'chatgpt-desktop' && (
              <span>Method: <strong className="text-brand-600 dark:text-brand-400">{desktopMethod === 'sse' ? 'Remote SSE' : 'Local Stdio'}</strong></span>
            )}
            {activeTab === 'external' && <span>LangChain / Python Requests Bridge</span>}
            {activeTab === 'bridge' && (
              <span className="flex items-center gap-1">
                Status: <strong className={bridgeRunning ? 'text-emerald-500' : 'text-rose-500'}>{bridgeRunning ? 'Online' : 'Offline'}</strong>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'in-browser' && (
              <>
                <button
                  type="button"
                  onClick={handleTestAgent}
                  disabled={testStatus === 'testing'}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-dark-800 dark:hover:bg-dark-750 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  {testStatus === 'testing' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-500" />
                  ) : (
                    <Play className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                  )}
                  <span>Test Call</span>
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  className="px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isSaved ? 'Saved!' : 'Save Config'}</span>
                </button>
              </>
            )}

            {activeTab === 'chatgpt-desktop' && (
              <button
                type="button"
                onClick={() => handleCopy(desktopMethod === 'sse' ? chatGptSseConfig : chatGptDesktopConfig, 'desktop_config')}
                className="px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
              >
                {copiedKey === 'desktop_config' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'desktop_config' ? 'Copied!' : 'Copy JSON'}</span>
              </button>
            )}

            {activeTab === 'external' && (
              <button
                type="button"
                onClick={() => handleCopy(pythonSnippet, 'python')}
                className="px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
              >
                {copiedKey === 'python' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'python' ? 'Copied!' : 'Copy Python'}</span>
              </button>
            )}

            {activeTab === 'bridge' && (
              <button
                type="button"
                onClick={() => webMcp.connectBridgeServer()}
                className="px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Reconnect</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-dark-850 dark:hover:bg-dark-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-white/10 text-xs font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
