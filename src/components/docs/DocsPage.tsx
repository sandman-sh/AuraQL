import React, { useState } from 'react';
import {
  BookOpen,
  ArrowLeft,
  Search,
  Check,
  Copy,
  Terminal,
  Cpu,
  Database,
  Shield,
  Layers,
  Bot,
  ExternalLink,
  ChevronRight,
  Code2,
  FileText,
  Zap,
  Lock,
  Sparkles
} from 'lucide-react';
import { AuraLogo } from '../common/AuraLogo';
import { ThemeToggle } from '../common/ThemeToggle';

interface DocsPageProps {
  onBackToApp: () => void;
  onReturnHome: () => void;
}

export const DocsPage: React.FC<DocsPageProps> = ({ onBackToApp, onReturnHome }) => {
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const navItems = [
    { id: 'overview', title: '1. Overview & Architecture', icon: Layers },
    { id: 'webmcp', title: '2. WebMCP Protocol Standard', icon: Cpu },
    { id: 'auraql-engine', title: '3. AuraQL Columnar Engine', icon: Database },
    { id: 'tools-ref', title: '4. MCP Tools Reference', icon: Terminal },
    { id: 'codex-chatgpt', title: '5. Desktop ChatGPT & Codex', icon: Bot },
    { id: 'in-browser-ai', title: '6. In-Browser Agent Co-Pilot', icon: Sparkles },
    { id: 'datasets', title: '7. Datasets & Ingestion', icon: FileText },
    { id: 'security', title: '8. Enterprise Security & Privacy', icon: Shield }
  ];

  const filteredNav = navItems.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors selection:bg-brand-500/30 selection:text-brand-300">
      {/* Top Header */}
      <header className="h-16 border-b border-slate-200 dark:border-white/[0.08] bg-white/95 dark:bg-dark-950/95 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={onReturnHome}
            className="flex items-center gap-3 text-left group"
            title="Return to Homepage"
          >
            <AuraLogo size={28} />
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white font-mono">
                AURA <span className="text-brand-600 dark:text-brand-400">ANALYTICS</span>
              </span>
              <span className="text-[10px] uppercase tracking-wider font-mono px-2 py-0.5 rounded-none bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 border border-brand-200 dark:border-brand-500/40">
                Documentation
              </span>
            </div>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onBackToApp}
            className="btn-sharp px-3.5 py-1.5 bg-brand-600 hover:bg-brand-500 text-white font-mono text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-brand-600/30 transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Launch Studio</span>
          </button>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Documentation Grid */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Left Sidebar */}
        <aside className="w-64 border-r border-slate-200 dark:border-white/[0.08] p-5 hidden md:flex flex-col gap-4 bg-slate-50/50 dark:bg-dark-900/30 shrink-0 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
          {/* Search Box */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documentation..."
              className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-dark-900 border border-slate-300 dark:border-white/10 rounded-none text-xs text-slate-900 dark:text-white outline-none focus:border-brand-500 font-mono"
            />
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col space-y-1">
            {filteredNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSection(item.id);
                    document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`flex items-center gap-2.5 px-3 py-2 text-xs text-left font-mono rounded-none transition-all ${
                    isActive
                      ? 'bg-brand-600 text-white font-bold shadow-sm shadow-brand-600/30'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-dark-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{item.title}</span>
                </button>
              );
            })}
          </nav>

          <div className="mt-auto pt-4 border-t border-slate-200 dark:border-white/10 text-[11px] font-mono text-slate-500 dark:text-slate-400">
            <div>AuraQL Engine v1.0.0</div>
            <div className="text-[10px] text-brand-600 dark:text-brand-400 mt-0.5">WebMCP Imperative Spec</div>
          </div>
        </aside>

        {/* Content Body */}
        <main className="flex-1 p-6 md:p-10 max-w-4xl overflow-y-auto space-y-12 leading-relaxed">
          {/* Section 1: Overview */}
          <section id="overview" className="scroll-mt-20 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-500/40 text-brand-700 dark:text-brand-300 text-xs font-mono font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              <span>Core Architecture & Philosophy</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight font-mono">
              Zero-Server In-Browser OLAP Analytics
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              <strong>Aura Analytics (powered by AuraQL)</strong> is a high-performance business intelligence studio engineered around the <strong>WebMCP</strong> (Web Model Context Protocol) open standard.
              Traditional data platforms send sensitive spreadsheets, customer records, and financial logs to remote cloud data warehouses.
              AuraQL reverses this paradigm: <strong>the analytical columnar database engine executes 100% inside your client-side browser tab</strong>.
            </p>

            <div className="p-4 bg-slate-100 dark:bg-dark-900 border border-slate-200 dark:border-white/10 space-y-2">
              <h4 className="text-xs font-bold font-mono text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                <span>The Co-Pilot Experience: Simultaneous Vision</span>
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                When external AI models (like Desktop ChatGPT, Codex CLI, or the in-app co-pilot) connect to Aura Analytics, the human analyst and the AI agent look at the <strong>exact same visual canvas simultaneously</strong>.
                The agent inspects data schemas, writes analytical SQL queries executed by the client browser in under 10ms, and directly renders charts on the user’s live screen.
              </p>
            </div>
          </section>

          {/* Section 2: WebMCP Protocol Standard */}
          <section id="webmcp" className="scroll-mt-20 space-y-4 border-t border-slate-200 dark:border-white/10 pt-10">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-500/40 text-purple-700 dark:text-purple-300 text-xs font-mono font-semibold">
              <Cpu className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>W3C Imperative Standard</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
              WebMCP (`document.modelContext`)
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Aura Analytics registers its capabilities directly into the browser's model context interface. This enables AI browser agents (such as ChatGPT's browser agent or Chrome WebMCP) to discover structured tool definitions via JSON Schema without brittle HTML scraping.
            </p>

            <div className="border border-slate-200 dark:border-white/10 bg-slate-950 p-4">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-xs font-mono text-slate-400">
                <span>TypeScript Tool Registration Implementation</span>
                <button
                  onClick={() =>
                    handleCopy(
                      `// Imperative WebMCP Tool Registration in Aura Analytics\nif ('modelContext' in document) {\n  document.modelContext.registerTool({\n    name: 'execute_sql_query',\n    description: 'Executes analytical SQL queries against in-memory AuraQL columnar tables',\n    inputSchema: {\n      type: 'object',\n      properties: {\n        sql: { type: 'string', description: 'SQL statement' }\n      },\n      required: ['sql']\n    },\n    execute: async ({ sql }) => {\n      const res = await auraEngine.query(sql);\n      return {\n        content: [{ type: 'text', text: JSON.stringify(res.rows) }]\n      };\n    }\n  });\n}`,
                      'webmcp_code'
                    )
                  }
                  className="flex items-center gap-1 text-brand-400 hover:text-white"
                >
                  {copiedKey === 'webmcp_code' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'webmcp_code' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="text-xs text-slate-300 font-mono overflow-x-auto">
{`// Imperative WebMCP Tool Registration in Aura Analytics
if ('modelContext' in document) {
  document.modelContext.registerTool({
    name: 'execute_sql_query',
    description: 'Executes analytical SQL queries against in-memory AuraQL columnar tables',
    inputSchema: {
      type: 'object',
      properties: {
        sql: { type: 'string', description: 'SQL statement' }
      },
      required: ['sql']
    },
    execute: async ({ sql }) => {
      const res = await auraEngine.query(sql);
      return {
        content: [{ type: 'text', text: JSON.stringify(res.rows) }]
      };
    }
  });
}`}
              </pre>
            </div>
          </section>

          {/* Section 3: AuraQL Engine */}
          <section id="auraql-engine" className="scroll-mt-20 space-y-4 border-t border-slate-200 dark:border-white/10 pt-10">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-xs font-mono font-semibold">
              <Database className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>In-Memory Columnar SQL</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
              AuraQL Analytical Engine
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              AuraQL is an in-memory, zero-dependency columnar SQL parser and execution engine created specifically for web browser clients.
              It executes aggregations, grouped rollups, and mathematical transforms with sub-millisecond response times.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 bg-white dark:bg-dark-900 border border-slate-200 dark:border-white/10">
                <span className="font-bold text-brand-600 dark:text-brand-400 block mb-1">Supported Clauses</span>
                <p className="text-slate-600 dark:text-slate-400 text-[11px] font-sans">
                  <code>SELECT</code>, <code>FROM</code>, <code>WHERE</code>, <code>GROUP BY</code> (by name or 1-indexed column), <code>ORDER BY [ASC|DESC]</code>, <code>LIMIT</code>.
                </p>
              </div>
              <div className="p-3 bg-white dark:bg-dark-900 border border-slate-200 dark:border-white/10">
                <span className="font-bold text-brand-600 dark:text-brand-400 block mb-1">Aggregate & Math Functions</span>
                <p className="text-slate-600 dark:text-slate-400 text-[11px] font-sans">
                  <code>SUM(col)</code>, <code>AVG(col)</code>, <code>COUNT(*)</code>, <code>MIN(col)</code>, <code>MAX(col)</code>, <code>ROUND(val, decimals)</code>.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-100 dark:bg-dark-900 border border-slate-200 dark:border-white/10">
              <div className="text-xs font-bold font-mono text-slate-900 dark:text-white mb-1">
                Sample Query:
              </div>
              <pre className="p-2 bg-slate-950 text-emerald-400 text-xs font-mono overflow-x-auto">
{`SELECT product_category, ROUND(SUM(revenue), 2) as total_rev, ROUND(AVG(gross_margin_pct), 1) as avg_margin
FROM ecommerce_sales
WHERE region = 'North America'
GROUP BY 1
ORDER BY total_rev DESC
LIMIT 5;`}
              </pre>
            </div>
          </section>

          {/* Section 4: MCP Tools Reference */}
          <section id="tools-ref" className="scroll-mt-20 space-y-4 border-t border-slate-200 dark:border-white/10 pt-10">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-500/40 text-cyan-700 dark:text-cyan-300 text-xs font-mono font-semibold">
              <Terminal className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>Tool Specifications</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
              MCP Tools Reference
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Every connected agent has access to four core analytical tools:
            </p>

            <div className="space-y-4 text-xs font-mono">
              {/* Tool 1 */}
              <div className="p-4 bg-white dark:bg-dark-900 border border-slate-200 dark:border-white/10">
                <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white mb-1">
                  <span className="text-brand-600 dark:text-brand-400">1. list_tables_and_schema</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-slate-200 dark:bg-dark-800 text-slate-700 dark:text-slate-300">Read Schema</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 font-sans text-xs mb-2">
                  Inspects in-memory AuraQL tables and returns active table names, column definitions, data types (VARCHAR, DOUBLE, INTEGER), and row counts.
                </p>
                <div className="p-2 bg-slate-950 text-slate-300 text-[11px]">
                  <strong>Parameters:</strong> <code>{`{ tableName?: string }`}</code>
                </div>
              </div>

              {/* Tool 2 */}
              <div className="p-4 bg-white dark:bg-dark-900 border border-slate-200 dark:border-white/10">
                <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white mb-1">
                  <span className="text-brand-600 dark:text-brand-400">2. execute_sql_query</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-slate-200 dark:bg-dark-800 text-slate-700 dark:text-slate-300">Run Aggregations</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 font-sans text-xs mb-2">
                  Executes analytical SQL queries against client columnar memory in under 10ms and returns structured JSON rows.
                </p>
                <div className="p-2 bg-slate-950 text-slate-300 text-[11px]">
                  <strong>Parameters:</strong> <code>{`{ sql: string }`}</code>
                </div>
              </div>

              {/* Tool 3 */}
              <div className="p-4 bg-white dark:bg-dark-900 border border-slate-200 dark:border-white/10">
                <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white mb-1">
                  <span className="text-brand-600 dark:text-brand-400">3. render_interactive_chart</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-slate-200 dark:bg-dark-800 text-slate-700 dark:text-slate-300">Viewport Control</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 font-sans text-xs mb-2">
                  Commands the user's live browser visual viewport to render or update charts in real time.
                </p>
                <div className="p-2 bg-slate-950 text-slate-300 text-[11px]">
                  <strong>Parameters:</strong> <code>{`{ type: "bar"|"line"|"area"|"donut"|"scatter", title: string, xAxis: string, yAxis: string, colorTheme?: "purple"|"cyan"|"emerald"|"gradient" }`}</code>
                </div>
              </div>

              {/* Tool 4 */}
              <div className="p-4 bg-white dark:bg-dark-900 border border-slate-200 dark:border-white/10">
                <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white mb-1">
                  <span className="text-brand-600 dark:text-brand-400">4. apply_dashboard_filter</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-slate-200 dark:bg-dark-800 text-slate-700 dark:text-slate-300">Cohort Isolation</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 font-sans text-xs mb-2">
                  Applies dynamic cohort filters across all visual components on the active dashboard.
                </p>
                <div className="p-2 bg-slate-950 text-slate-300 text-[11px]">
                  <strong>Parameters:</strong> <code>{`{ column: string, operator: "="|"!="|">"|"<"|"LIKE", value: string }`}</code>
                </div>
              </div>
            </div>
          </section>

          {/* Section 5: Desktop ChatGPT & Codex */}
          <section id="codex-chatgpt" className="scroll-mt-20 space-y-4 border-t border-slate-200 dark:border-white/10 pt-10">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-500/40 text-amber-700 dark:text-amber-300 text-xs font-mono font-semibold">
              <Bot className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>External MCP Integration</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
              Desktop ChatGPT & Codex Setup (`auraql`)
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Aura Analytics includes a standalone MCP bridge server (<code>scripts/mcp-bridge.mjs</code>) that implements the standard Model Context Protocol over both <strong>Stdio</strong> and <strong>HTTP SSE</strong>.
            </p>

            {/* Quick CLI command */}
            <div className="p-4 bg-slate-900 text-slate-200 border border-slate-800 font-mono text-xs">
              <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
                <span>Codex CLI One-Line Command</span>
                <button
                  onClick={() => handleCopy('codex mcp add auraql node scripts/mcp-bridge.mjs --stdio', 'codex_doc')}
                  className="text-brand-400 hover:text-white flex items-center gap-1"
                >
                  {copiedKey === 'codex_doc' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'codex_doc' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="p-2 bg-slate-950 text-emerald-400 overflow-x-auto">
codex mcp add auraql node scripts/mcp-bridge.mjs --stdio
              </pre>
            </div>

            {/* ChatGPT Desktop JSON */}
            <div className="p-4 bg-slate-900 text-slate-200 border border-slate-800 font-mono text-xs">
              <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
                <span>ChatGPT Desktop App Configuration (`mcp.json`)</span>
                <button
                  onClick={() =>
                    handleCopy(
                      `{\n  "mcpServers": {\n    "auraql": {\n      "command": "node",\n      "args": ["scripts/mcp-bridge.mjs", "--stdio"]\n    }\n  }\n}`,
                      'mcp_json_doc'
                    )
                  }
                  className="text-brand-400 hover:text-white flex items-center gap-1"
                >
                  {copiedKey === 'mcp_json_doc' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'mcp_json_doc' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="p-2 bg-slate-950 text-slate-300 overflow-x-auto">
{`{
  "mcpServers": {
    "auraql": {
      "command": "node",
      "args": ["scripts/mcp-bridge.mjs", "--stdio"]
    }
  }
}`}
              </pre>
            </div>
          </section>

          {/* Section 6: In-Browser AI Co-Pilot */}
          <section id="in-browser-ai" className="scroll-mt-20 space-y-4 border-t border-slate-200 dark:border-white/10 pt-10">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-500/40 text-brand-700 dark:text-brand-300 text-xs font-mono font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              <span>Multi-Provider In-Browser Agent</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
              In-Browser AI Co-Pilot
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              If you are not running Desktop ChatGPT, Aura Analytics features a built-in AI Command Bar that connects directly to real LLM providers using native function calling:
            </p>

            <ul className="list-disc pl-5 space-y-2 text-xs text-slate-600 dark:text-slate-300 font-sans">
              <li><strong>OpenAI (ChatGPT):</strong> Connects directly to <code>api.openai.com/v1/chat/completions</code> with <code>gpt-4o</code>, <code>o3-mini</code>, or <code>o1</code>.</li>
              <li><strong>Ollama (Local LLM):</strong> 100% free and private offline tool calling via <code>http://localhost:11434/v1</code> (e.g. <code>llama3.3</code>, <code>deepseek-r1</code>). Zero API keys needed.</li>
              <li><strong>Anthropic Claude & Google Gemini:</strong> Full multi-turn function calling with Claude 3.7 Sonnet, Claude 3.5 Sonnet, and Gemini 2.0 Flash / Pro.</li>
            </ul>
          </section>

          {/* Section 7: Datasets */}
          <section id="datasets" className="scroll-mt-20 space-y-4 border-t border-slate-200 dark:border-white/10 pt-10">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-500/40 text-blue-700 dark:text-blue-300 text-xs font-mono font-semibold">
              <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Data Ingestion</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
              Pre-Loaded Datasets & CSV Import
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Aura Analytics includes three enterprise datasets pre-seeded directly into memory:
            </p>

            <div className="space-y-2 text-xs font-mono">
              <div className="p-3 bg-white dark:bg-dark-900 border border-slate-200 dark:border-white/10">
                <span className="font-bold text-brand-600 dark:text-brand-400">ecommerce_sales (15 records)</span>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] font-sans">
                  Orders, customer segments (Enterprise VIP, Mid-Market), units, prices, revenue, gross margins, and order statuses.
                </p>
              </div>
              <div className="p-3 bg-white dark:bg-dark-900 border border-slate-200 dark:border-white/10">
                <span className="font-bold text-brand-600 dark:text-brand-400">saas_churn_metrics (10 records)</span>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] font-sans">
                  Account MRR, seat counts, seat utilization rates, NPS satisfaction scores, churn risk tiers, and ticket volume.
                </p>
              </div>
              <div className="p-3 bg-white dark:bg-dark-900 border border-slate-200 dark:border-white/10">
                <span className="font-bold text-brand-600 dark:text-brand-400">cloud_software_financials (8 records)</span>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] font-sans">
                  Quarterly revenue ($M), ticker symbols, gross margins, YoY growth rates, and employee headcounts for Snowflake, Datadog, Cloudflare, etc.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 font-sans">
              To ingest your own data, click <strong>"Import CSV/JSON"</strong> in the top header. The engine automatically parses headers, infers column types, and immediately registers the new table for WebMCP queries.
            </p>
          </section>

          {/* Section 8: Security & Privacy */}
          <section id="security" className="scroll-mt-20 space-y-4 border-t border-slate-200 dark:border-white/10 pt-10 pb-16">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-xs font-mono font-semibold">
              <Shield className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Security & Isolation</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
              Enterprise Privacy Guarantees
            </h2>
            <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/30 text-xs text-slate-700 dark:text-slate-300 space-y-2 font-sans">
              <p>
                <strong>Zero Remote Storage:</strong> Ingested CSV files and SQL buffers reside strictly in your local browser's heap memory. No analytics data is ever transmitted to an Aura server.
              </p>
              <p>
                <strong>Cross-Origin Isolation:</strong> Deployed with strict <code>Cross-Origin-Opener-Policy: same-origin</code> and <code>Cross-Origin-Embedder-Policy: credentialless</code> headers to protect local memory.
              </p>
              <p>
                <strong>Direct Provider Handshake:</strong> When using API keys for in-browser agents, keys are saved only in client <code>localStorage</code> and transmitted directly to the chosen LLM provider via HTTPS.
              </p>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};
