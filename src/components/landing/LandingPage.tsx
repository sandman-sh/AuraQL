import React, { useState } from 'react';
import { Database, Zap, Shield, Sparkles, ArrowRight, Play, Cpu, Layers, Terminal, BarChart3, CheckCircle2, ChevronRight } from 'lucide-react';

interface LandingPageProps {
  onLaunchApp: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLaunchApp }) => {
  const [activeTab, setActiveTab] = useState<'sql' | 'webmcp' | 'arch'>('webmcp');
  const [demoQueryState, setDemoQueryState] = useState<{
    status: 'idle' | 'running' | 'done';
    time: number;
  }>({ status: 'idle', time: 0 });

  const runDemoQuery = () => {
    setDemoQueryState({ status: 'running', time: 0 });
    setTimeout(() => {
      setDemoQueryState({ status: 'done', time: 6.4 });
    }, 450);
  };

  return (
    <div className="min-h-screen bg-dark-950 text-slate-100 flex flex-col selection:bg-brand-500/30 selection:text-brand-300 relative overflow-hidden">
      {/* Background Glows & Ambient Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-gradient-radial from-brand-600/20 via-brand-950/10 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-[600px] -left-40 w-[600px] h-[500px] bg-purple-900/10 blur-3xl rounded-full pointer-events-none -z-10" />
      <div className="absolute top-[800px] -right-40 w-[600px] h-[500px] bg-brand-800/10 blur-3xl rounded-full pointer-events-none -z-10" />

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 dot-grid opacity-40 pointer-events-none -z-10" />

      {/* Top Navigation */}
      <header className="border-b border-white/[0.06] backdrop-blur-md sticky top-0 z-40 bg-dark-950/80">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-purple-800 flex items-center justify-center shadow-lg shadow-brand-500/20 border border-brand-400/30">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-white flex items-center gap-2">
                Aura <span className="text-brand-400">Analytics</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-brand-950/80 text-brand-300 border border-brand-500/30">
                  WebMCP Standard
                </span>
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm text-slate-400 font-medium">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">WebMCP Protocol</a>
            <a href="#architecture" className="hover:text-white transition-colors">Architecture</a>
            <a href="#demo" className="hover:text-white transition-colors">Interactive Demo</a>
          </nav>

          <div className="flex items-center gap-4">
            <button
              onClick={onLaunchApp}
              className="relative group px-5 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white shadow-lg shadow-brand-600/25 transition-all duration-200 border border-brand-400/40 flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Launch Studio</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-20 px-6 max-w-7xl mx-auto flex flex-col items-center text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-950/80 border border-brand-500/30 text-xs font-mono text-brand-300 mb-8 shadow-inner shadow-brand-500/10">
          <Sparkles className="w-3.5 h-3.5 text-brand-400" />
          <span>Built for the OpenAI WebMCP Challenge • DuckDB-Wasm Inside</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-5xl leading-[1.1] mb-6">
          In-Browser OLAP Analytics for <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-purple-300 to-accent-cyan">
            People and Their AI Agents
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mb-10 leading-relaxed font-normal">
          Zero-server vectorized SQL analytics directly in your browser. ChatGPT inspects in-memory data, runs analytical queries in under 10ms, and updates live visual charts via <span className="text-brand-300 font-mono text-sm">document.modelContext</span>.
        </p>

        {/* Hero CTA & Quick Badges */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-16">
          <button
            onClick={onLaunchApp}
            className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-bold bg-gradient-to-r from-brand-600 via-purple-600 to-brand-700 hover:from-brand-500 hover:to-purple-500 text-white shadow-xl shadow-brand-600/30 transition-all duration-300 border border-brand-400/40 flex items-center justify-center gap-3 hover:scale-[1.03] active:scale-[0.98] glow-purple-md"
          >
            <Zap className="w-5 h-5 text-amber-300" />
            <span>Enter Aura Studio Workspace</span>
            <ArrowRight className="w-5 h-5" />
          </button>

          <a
            href="#how-it-works"
            className="w-full sm:w-auto px-6 py-4 rounded-xl text-base font-medium bg-dark-900 hover:bg-dark-850 text-slate-300 hover:text-white transition-all border border-white/10 flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 text-brand-400" />
            <span>Explore Protocol Architecture</span>
          </a>
        </div>

        {/* Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8 w-full max-w-4xl pt-8 border-t border-white/[0.08]">
          <div className="flex flex-col items-center">
            <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono tabular-nums">&lt;10ms</span>
            <span className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-mono">Query Execution</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-2xl sm:text-3xl font-extrabold text-brand-400 font-mono">100%</span>
            <span className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-mono">Client-Side Privacy</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono">$0</span>
            <span className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-mono">Server Hosting Cost</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-2xl sm:text-3xl font-extrabold text-accent-cyan font-mono">WebMCP</span>
            <span className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-mono">W3C / OpenAI Standard</span>
          </div>
        </div>
      </section>

      {/* Interactive Hero Showcase Widget */}
      <section id="demo" className="max-w-6xl mx-auto px-6 mb-28 w-full">
        <div className="glass-card rounded-2xl p-1 shadow-2xl relative">
          <div className="bg-dark-900/90 rounded-xl overflow-hidden border border-white/[0.08]">
            {/* Header / Tab Controls */}
            <div className="px-6 py-4 border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-4 bg-dark-950/60">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                <span className="text-xs font-mono text-slate-400 pl-2 border-l border-white/10 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-brand-400" />
                  <span>AuraQL Terminal • session://in-memory-duckdb</span>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('webmcp')}
                  className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors ${activeTab === 'webmcp' ? 'bg-brand-500/20 text-brand-300 border border-brand-500/40' : 'text-slate-400 hover:text-white'}`}
                >
                  WebMCP Tool Hook
                </button>
                <button
                  onClick={() => setActiveTab('sql')}
                  className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors ${activeTab === 'sql' ? 'bg-brand-500/20 text-brand-300 border border-brand-500/40' : 'text-slate-400 hover:text-white'}`}
                >
                  Vectorized SQL
                </button>
                <button
                  onClick={() => setActiveTab('arch')}
                  className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors ${activeTab === 'arch' ? 'bg-brand-500/20 text-brand-300 border border-brand-500/40' : 'text-slate-400 hover:text-white'}`}
                >
                  Architecture Flow
                </button>
              </div>
            </div>

            {/* Code / Visual Window */}
            <div className="p-6 font-mono text-xs sm:text-sm text-slate-300 leading-relaxed bg-dark-950/90 overflow-x-auto min-h-[260px] flex flex-col justify-between">
              {activeTab === 'webmcp' && (
                <pre className="text-slate-300">
                  <span className="text-slate-500">// 1. WebMCP Tool Registration with document.modelContext</span>{'\n'}
                  <span className="text-purple-400">document</span>.<span className="text-brand-300">modelContext</span>.<span className="text-blue-400">registerTool</span>({'{'}{'\n'}
                  {'  '}name: <span className="text-emerald-300">"execute_sql_query"</span>,{'\n'}
                  {'  '}description: <span className="text-emerald-300">"Runs OLAP SQL in DuckDB-Wasm and returns records"</span>,{'\n'}
                  {'  '}inputSchema: {'{'} type: <span className="text-amber-300">"object"</span>, properties: {'{'} sql: {'{'} type: <span className="text-amber-300">"string"</span> {'}'} {'}'} {'}'},{'\n'}
                  {'  '}execute: <span className="text-purple-400">async</span> ({'{'} sql {'}'}) =&gt; {'{'}{'\n'}
                  {'    '}<span className="text-slate-500">// Runs entirely inside client browser in DuckDB-Wasm:</span>{'\n'}
                  {'    '}<span className="text-purple-400">const</span> result = <span className="text-purple-400">await</span> duckdb.<span className="text-blue-400">query</span>(sql);{'\n'}
                  {'    '}<span className="text-purple-400">return</span> {'{'} content: [{'{'} type: <span className="text-emerald-300">"text"</span>, text: JSON.stringify(result.rows) {'}'}] {'}'};{'\n'}
                  {'  '}{'}'}{'\n'}
                  {'}'});
                </pre>
              )}

              {activeTab === 'sql' && (
                <div>
                  <div className="text-slate-400 mb-2">// Querying 240,000 in-memory e-commerce rows</div>
                  <div className="text-brand-300 font-semibold mb-3">
                    SELECT product_category, ROUND(SUM(revenue), 2) as total_rev, ROUND(AVG(gross_margin_pct), 1) as avg_margin <br />
                    FROM ecommerce_sales GROUP BY product_category ORDER BY total_rev DESC;
                  </div>
                  {demoQueryState.status === 'done' ? (
                    <div className="mt-4 p-3 rounded-lg bg-dark-900 border border-brand-500/30 text-emerald-400">
                      ⚡ Query completed in {demoQueryState.time}ms! Returned 5 aggregated cohorts with 0 server requests.
                    </div>
                  ) : demoQueryState.status === 'running' ? (
                    <div className="mt-4 text-brand-400 animate-pulse">⚡ Compiling columnar vector buffers in DuckDB-Wasm...</div>
                  ) : null}
                </div>
              )}

              {activeTab === 'arch' && (
                <div className="flex flex-col gap-3">
                  <div className="text-slate-400">// Zero-Server WebMCP Architecture</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    <div className="p-4 rounded-xl bg-dark-900 border border-white/10">
                      <div className="text-xs text-brand-400 font-bold mb-1">1. AGENT LAYER</div>
                      <div className="text-sm font-sans text-slate-200">ChatGPT Desktop / In-App Browser invokes Site Tools via structured JSON Schema</div>
                    </div>
                    <div className="p-4 rounded-xl bg-dark-900 border border-brand-500/30">
                      <div className="text-xs text-purple-400 font-bold mb-1">2. WEBMCP PROTOCOL</div>
                      <div className="text-sm font-sans text-slate-200">document.modelContext bridges LLM intent to client JavaScript functions</div>
                    </div>
                    <div className="p-4 rounded-xl bg-dark-900 border border-accent-cyan/30">
                      <div className="text-xs text-accent-cyan font-bold mb-1">3. DUCKDB-WASM OLAP</div>
                      <div className="text-sm font-sans text-slate-200">C++ compiled to WebAssembly aggregates 100K+ rows in &lt;10ms with zero server calls</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Bar */}
              <div className="pt-4 mt-4 border-t border-white/[0.08] flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Engine: WebAssembly Native</span>
                </div>
                {activeTab === 'sql' && (
                  <button
                    onClick={runDemoQuery}
                    className="px-4 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-medium text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Run Test Query</span>
                  </button>
                )}
                {activeTab !== 'sql' && (
                  <button
                    onClick={onLaunchApp}
                    className="px-4 py-1.5 rounded-lg bg-brand-600/80 hover:bg-brand-600 text-white font-medium text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <span>Open Full Workspace</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Core Pillars */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-20 w-full border-t border-white/[0.06]">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-mono uppercase tracking-widest text-brand-400 mb-3">Engineered for Performance</h2>
          <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Why WebMCP + DuckDB is an Unbeatable Combo
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="glass-card rounded-2xl p-8 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-400 mb-6">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Zero-Server Columnar OLAP</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                By bundling DuckDB into WebAssembly, your browser runs high-speed vectorized analytical queries across hundreds of thousands of rows in under 15ms. Zero database hosting bills, zero network latency.
              </p>
            </div>
            <div className="mt-6 pt-6 border-t border-white/[0.06] flex items-center gap-2 text-xs font-mono text-brand-300">
              <CheckCircle2 className="w-4 h-4 text-brand-400" />
              <span>DuckDB-Wasm C++ Core</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="glass-card rounded-2xl p-8 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 rounded-full blur-2xl pointer-events-none" />
            <div>
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-6">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Native WebMCP Standard</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Implements the official <span className="font-mono text-brand-300">document.modelContext</span> specification. ChatGPT discovers structured tools for querying data, rendering charts, and filtering cohorts in real-time.
              </p>
            </div>
            <div className="mt-6 pt-6 border-t border-white/[0.06] flex items-center gap-2 text-xs font-mono text-purple-300">
              <CheckCircle2 className="w-4 h-4 text-purple-400" />
              <span>Full Tool Schema Specs</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="glass-card rounded-2xl p-8 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-accent-cyan/10 border border-accent-cyan/30 flex items-center justify-center text-accent-cyan mb-6">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Absolute Local Data Privacy</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Drop in confidential financial models, user logs, or enterprise spreadsheets. Raw rows never leave your computer—only aggregated SQL outputs are shared with the AI agent.
              </p>
            </div>
            <div className="mt-6 pt-6 border-t border-white/[0.06] flex items-center gap-2 text-xs font-mono text-accent-cyan">
              <CheckCircle2 className="w-4 h-4 text-accent-cyan" />
              <span>Client-Isolated Storage</span>
            </div>
          </div>
        </div>
      </section>

      {/* Pre-Loaded Datasets Section */}
      <section className="max-w-7xl mx-auto px-6 py-16 w-full border-t border-white/[0.06]">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-xs font-mono uppercase tracking-widest text-brand-400 mb-2">Ready Out of the Box</h2>
          <p className="text-2xl sm:text-3xl font-bold text-white">Three Production-Grade Enterprise Datasets</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-dark-900/60 border border-white/[0.08] hover:border-brand-500/40 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-brand-950 text-brand-300 border border-brand-500/30">E-Commerce</span>
              <span className="text-xs font-mono text-slate-500">240 rows</span>
            </div>
            <h4 className="text-lg font-bold text-white mb-2">Flash Sale & Profit Margins</h4>
            <p className="text-xs text-slate-400 mb-4">Order quantities, promotional discounts, customer VIP status, and regional fulfillment pipelines.</p>
            <div className="text-[11px] font-mono text-brand-400 flex items-center gap-1">
              <span>ecommerce_sales table</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-dark-900/60 border border-white/[0.08] hover:border-brand-500/40 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-purple-950 text-purple-300 border border-purple-500/30">Enterprise SaaS</span>
              <span className="text-xs font-mono text-slate-500">200 rows</span>
            </div>
            <h4 className="text-lg font-bold text-white mb-2">ARR, Churn Risk & Health</h4>
            <p className="text-xs text-slate-400 mb-4">Monthly recurring revenue, seat utilization rates, support ticket volume, and churn severity flags.</p>
            <div className="text-[11px] font-mono text-purple-400 flex items-center gap-1">
              <span>saas_churn_metrics table</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-dark-900/60 border border-white/[0.08] hover:border-brand-500/40 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/30">DevOps & Chrome</span>
              <span className="text-xs font-mono text-slate-500">250 rows</span>
            </div>
            <h4 className="text-lg font-bold text-white mb-2">Core Web Vitals Telemetry</h4>
            <p className="text-xs text-slate-400 mb-4">Largest Contentful Paint (LCP), Cumulative Layout Shift (CLS), and INP across device profiles.</p>
            <div className="text-[11px] font-mono text-cyan-400 flex items-center gap-1">
              <span>web_vitals_telemetry table</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="max-w-6xl mx-auto px-6 py-20 w-full">
        <div className="glass-card rounded-3xl p-10 sm:p-14 relative overflow-hidden text-center border border-brand-500/30 glow-purple-md">
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
            Experience the Future of Agent-Native Web
          </h2>
          <p className="text-slate-300 max-w-xl mx-auto mb-8 text-base sm:text-lg">
            Launch the Aura Analytics studio now. Test DuckDB queries directly or connect via ChatGPT’s in-app browser with WebMCP.
          </p>
          <button
            onClick={onLaunchApp}
            className="px-9 py-4 rounded-xl text-base font-bold bg-white text-dark-950 hover:bg-slate-100 shadow-xl shadow-white/10 transition-all duration-200 inline-flex items-center gap-2 hover:scale-105 active:scale-95"
          >
            <span>Launch Studio Workspace</span>
            <ArrowRight className="w-5 h-5 text-brand-600" />
          </button>
        </div>
      </section>

      {/* Minimal Footer */}
      <footer className="border-t border-white/[0.06] py-10 px-6 mt-auto bg-dark-950">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-mono">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-brand-600 flex items-center justify-center text-white font-bold text-[10px]">A</div>
            <span>Aura Analytics • Powered by DuckDB-Wasm & WebMCP Standard</span>
          </div>
          <div>Submitted to The WebMCP Challenge 2026</div>
        </div>
      </footer>
    </div>
  );
};
