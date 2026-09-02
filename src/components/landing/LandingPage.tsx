import React, { useState } from 'react';
import { Zap, Shield, Sparkles, ArrowRight, Play, Cpu, Layers, Terminal, CheckCircle2, ChevronRight, Activity, Globe, Lock, ExternalLink } from 'lucide-react';
import { AuraLogo } from '../common/AuraLogo';
import { auraEngine } from '../../engine/auraql';

interface LandingPageProps {
  onLaunchApp: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLaunchApp }) => {
  const [activeTab, setActiveTab] = useState<'sql' | 'webmcp' | 'arch'>('webmcp');
  const [demoQueryState, setDemoQueryState] = useState<{
    status: 'idle' | 'running' | 'done';
    time: number;
    rows: number;
  }>({ status: 'idle', time: 0, rows: 0 });

  const runDemoQuery = async () => {
    setDemoQueryState({ status: 'running', time: 0, rows: 0 });
    const res = await auraEngine.query(
      'SELECT product_category, ROUND(SUM(revenue), 2) as total_rev, ROUND(AVG(gross_margin_pct), 1) as avg_margin FROM ecommerce_sales GROUP BY product_category ORDER BY total_rev DESC;'
    );
    setDemoQueryState({ status: 'done', time: res.executionTimeMs, rows: res.rowCount });
  };

  return (
    <div className="min-h-screen bg-dark-950 text-slate-100 flex flex-col selection:bg-brand-500/30 selection:text-brand-300 relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[550px] bg-gradient-radial from-brand-600/20 via-purple-950/15 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-[500px] -left-32 w-[600px] h-[600px] bg-purple-900/10 blur-3xl rounded-none pointer-events-none -z-10" />
      <div className="absolute top-[800px] -right-32 w-[600px] h-[600px] bg-brand-800/10 blur-3xl rounded-none pointer-events-none -z-10" />

      {/* Grid Pattern */}
      <div className="absolute inset-0 dot-grid opacity-35 pointer-events-none -z-10" />

      {/* Top Navigation */}
      <header className="border-b border-white/[0.08] backdrop-blur-md sticky top-0 z-40 bg-dark-950/85">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AuraLogo size={32} />
            <div>
              <span className="font-extrabold text-base tracking-tight text-white flex items-center gap-2 font-mono">
                AURA <span className="text-brand-400">ANALYTICS</span>
                <span className="text-[9px] uppercase font-mono px-2 py-0.5 rounded-none bg-brand-950 text-brand-300 border border-brand-500/40">
                  WebMCP Protocol
                </span>
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs text-slate-400 font-mono">
            <a href="#features" className="hover:text-white transition-colors">CAPABILITIES</a>
            <a href="#protocol" className="hover:text-white transition-colors">WEBMCP BRIDGE</a>
            <a href="#architecture" className="hover:text-white transition-colors">ARCHITECTURE</a>
            <a href="#demo" className="hover:text-white transition-colors">LIVE TERMINAL</a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={onLaunchApp}
              className="btn-sharp px-5 py-2 text-xs font-mono font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-600/30 transition-all border border-brand-400/50 flex items-center gap-2 glow-purple-sm"
            >
              <span>LAUNCH STUDIO</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-6 max-w-7xl mx-auto flex flex-col items-center text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-none bg-brand-950/90 border border-brand-500/40 text-xs font-mono text-brand-300 mb-8 shadow-inner">
          <Sparkles className="w-3.5 h-3.5 text-brand-400" />
          <span>The WebMCP Challenge 2026 • Powered by AuraQL In-Memory Engine</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-5xl leading-[1.12] mb-6 font-sans">
          In-Browser OLAP Intelligence for <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-purple-300 to-accent-cyan">
            People and Their AI Agents
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mb-10 leading-relaxed font-normal">
          Zero-server vectorized SQL analytics directly in your browser tab. ChatGPT inspects in-memory data schemas, runs analytical queries in under 10ms, and updates live visual charts via <span className="text-brand-300 font-mono text-xs">document.modelContext</span>.
        </p>

        {/* Sharp Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-16">
          <button
            onClick={onLaunchApp}
            className="btn-sharp w-full sm:w-auto px-8 py-4 text-sm font-bold font-mono bg-gradient-to-r from-brand-600 via-purple-600 to-brand-700 hover:from-brand-500 hover:to-purple-500 text-white shadow-xl shadow-brand-600/40 transition-all border border-brand-400/50 flex items-center justify-center gap-3 glow-purple-md"
          >
            <Zap className="w-4 h-4 text-amber-300" />
            <span>ENTER AURA STUDIO WORKSPACE</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <a
            href="#protocol"
            className="btn-sharp w-full sm:w-auto px-6 py-4 text-sm font-mono font-medium bg-dark-900 hover:bg-dark-850 text-slate-300 hover:text-white transition-all border border-white/10 flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 text-brand-400" />
            <span>EXPLORE SPECIFICATION</span>
          </a>
        </div>

        {/* Live Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8 w-full max-w-4xl pt-8 border-t border-white/[0.08]">
          <div className="flex flex-col items-center">
            <span className="text-2xl sm:text-3xl font-bold text-white font-mono tabular-nums">&lt;10ms</span>
            <span className="text-[11px] text-slate-400 mt-1 uppercase tracking-wider font-mono">Query Latency</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-2xl sm:text-3xl font-bold text-brand-400 font-mono">100%</span>
            <span className="text-[11px] text-slate-400 mt-1 uppercase tracking-wider font-mono">Local Privacy</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-2xl sm:text-3xl font-bold text-white font-mono">$0</span>
            <span className="text-[11px] text-slate-400 mt-1 uppercase tracking-wider font-mono">Server Cloud Cost</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-2xl sm:text-3xl font-bold text-accent-cyan font-mono">WebMCP</span>
            <span className="text-[11px] text-slate-400 mt-1 uppercase tracking-wider font-mono">Open Standard</span>
          </div>
        </div>
      </section>

      {/* Interactive Hero Showcase Widget */}
      <section id="demo" className="max-w-5xl mx-auto px-6 mb-24 w-full">
        <div className="glass-card rounded-none p-1 shadow-2xl relative border border-white/[0.12]">
          <div className="bg-dark-950 rounded-none overflow-hidden border border-white/[0.08]">
            {/* Header Tabs with Sharp Corners */}
            <div className="px-5 py-3 border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-4 bg-dark-900">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 bg-brand-500 rounded-none animate-ping" />
                <span className="text-xs font-mono text-slate-300 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-brand-400" />
                  <span>AuraQL Vector Terminal • session://in-memory-engine</span>
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveTab('webmcp')}
                  className={`px-3 py-1 text-xs font-mono rounded-none transition-colors ${activeTab === 'webmcp' ? 'bg-brand-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                >
                  WebMCP Tool Schema
                </button>
                <button
                  onClick={() => setActiveTab('sql')}
                  className={`px-3 py-1 text-xs font-mono rounded-none transition-colors ${activeTab === 'sql' ? 'bg-brand-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                >
                  Real-Time SQL
                </button>
                <button
                  onClick={() => setActiveTab('arch')}
                  className={`px-3 py-1 text-xs font-mono rounded-none transition-colors ${activeTab === 'arch' ? 'bg-brand-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                >
                  Architecture
                </button>
              </div>
            </div>

            {/* Code / Visual Window */}
            <div className="p-5 font-mono text-xs sm:text-sm text-slate-300 leading-relaxed bg-dark-950 overflow-x-auto min-h-[240px] flex flex-col justify-between">
              {activeTab === 'webmcp' && (
                <pre className="text-slate-300">
                  <span className="text-slate-500">// 1. WebMCP Tool Registration via document.modelContext</span>{'\n'}
                  <span className="text-purple-400">document</span>.<span className="text-brand-300">modelContext</span>.<span className="text-blue-400">registerTool</span>({'{'}{'\n'}
                  {'  '}name: <span className="text-emerald-300">"execute_sql_query"</span>,{'\n'}
                  {'  '}description: <span className="text-emerald-300">"Runs OLAP SQL in AuraQL columnar memory and returns records"</span>,{'\n'}
                  {'  '}inputSchema: {'{'} type: <span className="text-amber-300">"object"</span>, properties: {'{'} sql: {'{'} type: <span className="text-amber-300">"string"</span> {'}'} {'}'} {'}'},{'\n'}
                  {'  '}execute: <span className="text-purple-400">async</span> ({'{'} sql {'}'}) =&gt; {'{'}{'\n'}
                  {'    '}<span className="text-slate-500">// Real in-memory mathematical execution:</span>{'\n'}
                  {'    '}<span className="text-purple-400">const</span> result = <span className="text-purple-400">await</span> auraEngine.<span className="text-blue-400">query</span>(sql);{'\n'}
                  {'    '}<span className="text-purple-400">return</span> {'{'} content: [{'{'} type: <span className="text-emerald-300">"text"</span>, text: JSON.stringify(result.rows) {'}'}] {'}'};{'\n'}
                  {'  '}{'}'}{'\n'}
                  {'}'});
                </pre>
              )}

              {activeTab === 'sql' && (
                <div>
                  <div className="text-slate-500 mb-1.5">// Real in-memory calculation on 240 sales records</div>
                  <div className="text-brand-300 font-semibold mb-3">
                    SELECT product_category, ROUND(SUM(revenue), 2) as total_rev, ROUND(AVG(gross_margin_pct), 1) as avg_margin <br />
                    FROM ecommerce_sales GROUP BY product_category ORDER BY total_rev DESC;
                  </div>
                  {demoQueryState.status === 'done' ? (
                    <div className="mt-3 p-3 bg-dark-900 border border-emerald-500/40 text-emerald-400 text-xs">
                      ⚡ Query completed in {demoQueryState.time}ms! Aggregated {demoQueryState.rows} categories with mathematical precision.
                    </div>
                  ) : demoQueryState.status === 'running' ? (
                    <div className="mt-3 text-brand-400 animate-pulse">⚡ Compiling columnar buffers in AuraQL...</div>
                  ) : null}
                </div>
              )}

              {activeTab === 'arch' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                  <div className="p-3 bg-dark-900 border border-white/10">
                    <div className="text-xs text-brand-400 font-bold mb-1">1. AGENT CO-PILOT</div>
                    <div className="text-xs font-sans text-slate-300">ChatGPT in-app browser or Chrome agent invokes site tools via JSON schemas</div>
                  </div>
                  <div className="p-3 bg-dark-900 border border-brand-500/40">
                    <div className="text-xs text-purple-400 font-bold mb-1">2. WEBMCP STANDARD</div>
                    <div className="text-xs font-sans text-slate-300">document.modelContext triggers structured browser functions directly</div>
                  </div>
                  <div className="p-3 bg-dark-900 border border-accent-cyan/40">
                    <div className="text-xs text-accent-cyan font-bold mb-1">3. AURAQL ENGINE</div>
                    <div className="text-xs font-sans text-slate-300">In-memory columnar OLAP executes queries in &lt;10ms with zero server latency</div>
                  </div>
                </div>
              )}

              {/* Action Bar */}
              <div className="pt-3 mt-3 border-t border-white/[0.08] flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="w-2 h-2 rounded-none bg-emerald-400 animate-pulse" />
                  <span>Engine: AuraQL Active</span>
                </div>
                {activeTab === 'sql' ? (
                  <button
                    onClick={runDemoQuery}
                    className="btn-sharp px-3.5 py-1 bg-brand-600 hover:bg-brand-500 text-white font-mono text-xs flex items-center gap-1.5 transition-colors border border-brand-400/40"
                  >
                    <Play className="w-3 h-3" />
                    <span>Run Query</span>
                  </button>
                ) : (
                  <button
                    onClick={onLaunchApp}
                    className="btn-sharp px-3.5 py-1 bg-brand-600/90 hover:bg-brand-600 text-white font-mono text-xs flex items-center gap-1.5 transition-colors border border-brand-400/40"
                  >
                    <span>Launch Studio</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Core Pillars with Sharp Design */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-16 w-full border-t border-white/[0.08]">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-xs font-mono uppercase tracking-widest text-brand-400 mb-2">Architectural Superiority</h2>
          <p className="text-3xl font-extrabold text-white tracking-tight">Built for Real Analytical Scale</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card rounded-none p-7 flex flex-col justify-between border border-white/[0.08]">
            <div>
              <div className="w-10 h-10 rounded-none bg-brand-950 border border-brand-500/40 flex items-center justify-center text-brand-400 mb-5">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2 font-mono">Zero-Server Columnar OLAP</h3>
              <p className="text-slate-400 text-xs leading-relaxed font-sans">
                AuraQL processes columnar aggregations in browser memory in under 10ms. No database connection strings, no API gateway bills, and zero network timeouts.
              </p>
            </div>
            <div className="mt-5 pt-4 border-t border-white/[0.06] flex items-center gap-2 text-xs font-mono text-brand-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-brand-400" />
              <span>AuraQL Vector Core</span>
            </div>
          </div>

          <div className="glass-card rounded-none p-7 flex flex-col justify-between border border-white/[0.08]">
            <div>
              <div className="w-10 h-10 rounded-none bg-purple-950 border border-purple-500/40 flex items-center justify-center text-purple-400 mb-5">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2 font-mono">Native WebMCP Specification</h3>
              <p className="text-slate-400 text-xs leading-relaxed font-sans">
                Adheres to the official <span className="font-mono text-brand-300">document.modelContext</span> standard. ChatGPT discovers structured tools for querying data, rendering charts, and filtering cohorts in real-time.
              </p>
            </div>
            <div className="mt-5 pt-4 border-t border-white/[0.06] flex items-center gap-2 text-xs font-mono text-purple-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
              <span>Full Tool Schema Specs</span>
            </div>
          </div>

          <div className="glass-card rounded-none p-7 flex flex-col justify-between border border-white/[0.08]">
            <div>
              <div className="w-10 h-10 rounded-none bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-accent-cyan mb-5">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2 font-mono">Absolute Local Data Privacy</h3>
              <p className="text-slate-400 text-xs leading-relaxed font-sans">
                Drop in sensitive financial spreadsheets, operational logs, or customer databases. Raw rows never leave your machine—only computed query results are returned to the agent.
              </p>
            </div>
            <div className="mt-5 pt-4 border-t border-white/[0.06] flex items-center gap-2 text-xs font-mono text-accent-cyan">
              <CheckCircle2 className="w-3.5 h-3.5 text-accent-cyan" />
              <span>Client-Isolated Storage</span>
            </div>
          </div>
        </div>
      </section>

      {/* Protocol Diagram Section */}
      <section id="protocol" className="max-w-6xl mx-auto px-6 py-16 w-full border-t border-white/[0.08]">
        <div className="glass-card rounded-none p-8 border border-brand-500/30 glow-purple-sm">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
            <div>
              <span className="text-xs font-mono text-brand-400 uppercase tracking-widest">Protocol Lifecycle</span>
              <h3 className="text-2xl font-bold text-white font-mono mt-1">Bi-Directional Agent & Human Co-Pilot</h3>
            </div>
            <button
              onClick={onLaunchApp}
              className="btn-sharp px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-mono text-xs flex items-center gap-2 border border-brand-400/50"
            >
              <span>Test Live in Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
            <div className="p-4 bg-dark-900 border border-white/[0.08]">
              <div className="text-brand-400 font-bold mb-1">01. DISCOVERY</div>
              <p className="text-slate-400 font-sans text-xs">ChatGPT in-app browser inspects document.modelContext on page mount.</p>
            </div>
            <div className="p-4 bg-dark-900 border border-white/[0.08]">
              <div className="text-purple-400 font-bold mb-1">02. REASONING</div>
              <p className="text-slate-400 font-sans text-xs">Model writes exact SQL statement to answer analytical user prompt.</p>
            </div>
            <div className="p-4 bg-dark-900 border border-white/[0.08]">
              <div className="text-accent-cyan font-bold mb-1">03. EXECUTION</div>
              <p className="text-slate-400 font-sans text-xs">AuraQL evaluates query locally in &lt;10ms and returns structured JSON rows.</p>
            </div>
            <div className="p-4 bg-dark-900 border border-white/[0.08]">
              <div className="text-emerald-400 font-bold mb-1">04. VIEWPORT SYNC</div>
              <p className="text-slate-400 font-sans text-xs">Agent commands render_interactive_chart to update live visual canvas.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Comprehensive Professional Footer */}
      <footer className="border-t border-white/[0.08] py-12 px-6 mt-auto bg-dark-950">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10 text-xs font-mono">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <AuraLogo size={24} />
                <span className="font-bold text-sm tracking-tight text-white">AURA ANALYTICS</span>
              </div>
              <p className="text-slate-400 font-sans text-xs leading-relaxed mb-3">
                Zero-server, privacy-first in-browser OLAP analytics studio built for the WebMCP open standard.
              </p>
              <div className="flex items-center gap-2 text-emerald-400 text-[11px]">
                <span className="w-2 h-2 rounded-none bg-emerald-400 animate-pulse" />
                <span>All systems operational • v1.0.0</span>
              </div>
            </div>

            <div>
              <h5 className="font-bold text-white uppercase tracking-wider mb-3">Protocol Architecture</h5>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#demo" className="hover:text-brand-300 transition-colors">document.modelContext Spec</a></li>
                <li><a href="#features" className="hover:text-brand-300 transition-colors">AuraQL In-Memory Core</a></li>
                <li><a href="#protocol" className="hover:text-brand-300 transition-colors">Client Columnar Storage</a></li>
                <li><a href="#demo" className="hover:text-brand-300 transition-colors">Live SQL Telemetry</a></li>
              </ul>
            </div>

            <div>
              <h5 className="font-bold text-white uppercase tracking-wider mb-3">Supported Tool Schemas</h5>
              <ul className="space-y-2 text-slate-400">
                <li><span className="text-brand-300">execute_sql_query</span></li>
                <li><span className="text-purple-300">render_interactive_chart</span></li>
                <li><span className="text-accent-cyan">list_tables_and_schema</span></li>
                <li><span className="text-emerald-300">apply_dashboard_filter</span></li>
              </ul>
            </div>

            <div>
              <h5 className="font-bold text-white uppercase tracking-wider mb-3">Challenge & Standards</h5>
              <ul className="space-y-2 text-slate-400">
                <li><span>The WebMCP Challenge 2026</span></li>
                <li><span>OpenAI • Google Chrome</span></li>
                <li><span>Vercel • Cloudflare • Netlify</span></li>
                <li><span>Open Source MIT License</span></li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-mono">
            <div>
              © 2026 Aura Analytics. Open source under MIT License.
            </div>
            <div className="flex items-center gap-4">
              <span>W3C WebML CG Compatible</span>
              <span>•</span>
              <span>OpenAI Site Tools Standard</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
