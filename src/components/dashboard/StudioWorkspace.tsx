import React, { useState, useEffect } from 'react';
import { Header } from '../layout/Header';
import { MetricCards } from './MetricCards';
import { ChartViewport } from './ChartViewport';
import { SqlConsole } from './SqlConsole';
import { DataTable } from './DataTable';
import { WebMcpInspector } from './WebMcpInspector';
import { UploadModal } from '../modals/UploadModal';
import { ExecutiveReportModal } from '../modals/ExecutiveReportModal';
import { AiCommandBar } from './AiCommandBar';
import { InsightBanner } from './InsightBanner';
import { GlobalFilterBar } from './GlobalFilterBar';
import { ChartConfig, QueryResult, WebMcpToolEvent, ChartType } from '../../types';
import { auraEngine } from '../../engine/auraql';
import { webMcp } from '../../engine/webmcp';
import { DATASETS_METADATA } from '../../engine/datasets';
import { Upload, FileText, Database, Zap, ShieldCheck, Sparkles } from 'lucide-react';

interface StudioWorkspaceProps {
  onReturnHome: () => void;
}

export const StudioWorkspace: React.FC<StudioWorkspaceProps> = ({ onReturnHome }) => {
  const initialTables = auraEngine.getTableNames();
  const [activeDataset, setActiveDataset] = useState<string>(initialTables[0] || '');
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false);
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);
  const [isProcessingAi, setIsProcessingAi] = useState<boolean>(false);
  const [events, setEvents] = useState<WebMcpToolEvent[]>([]);
  const [agentUpdated, setAgentUpdated] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<{ column: string; value: string } | null>(null);

  // Active Query State
  const [currentSql, setCurrentSql] = useState<string>('');
  const [queryResult, setQueryResult] = useState<QueryResult>({
    sql: '',
    columns: [],
    rows: [],
    rowCount: 0,
    executionTimeMs: 0,
    timestamp: new Date()
  });

  // Active Chart Configuration
  const [chartConfig, setChartConfig] = useState<ChartConfig>({
    type: 'bar',
    title: 'Analytics Overview',
    xAxis: '',
    yAxis: '',
    colorTheme: 'purple'
  });

  // Initialize WebMCP tools and register event listeners
  useEffect(() => {
    webMcp.registerAllTools();

    const unsubEvents = webMcp.subscribeEvents((newEvt) => {
      setEvents((prev) => [newEvt, ...prev.slice(0, 50)]);
    });

    const unsubState = webMcp.subscribeStateUpdates(({ type, data }) => {
      if (type === 'query') {
        const res = data as QueryResult;
        setCurrentSql(res.sql);
        setQueryResult(res);
        setAgentUpdated(true);
        setTimeout(() => setAgentUpdated(false), 3000);
      } else if (type === 'chart') {
        const cfg = data as ChartConfig;
        setChartConfig(cfg);
        setAgentUpdated(true);
        setTimeout(() => setAgentUpdated(false), 3000);
      } else if (type === 'filter') {
        setActiveFilter(data);
      }
    });

    if (activeDataset) {
      const defaultQuery = `SELECT * FROM ${activeDataset} LIMIT 50;`;
      handleRunQuery(defaultQuery);
    }

    return () => {
      unsubEvents();
      unsubState();
    };
  }, []);

  const handleSelectDataset = (tableName: string) => {
    setActiveDataset(tableName);
    setActiveFilter(null);
    const meta = DATASETS_METADATA[tableName];
    const initialQuery = meta?.sampleQueries?.[0]?.sql || `SELECT * FROM ${tableName} LIMIT 50;`;
    setCurrentSql(initialQuery);
    handleRunQuery(initialQuery);

    // Auto-configure initial chart from first string & numeric columns
    const rows = auraEngine.getTableData(tableName);
    if (rows.length > 0) {
      const firstRow = rows[0];
      const stringCols = Object.keys(firstRow).filter((k) => typeof firstRow[k] === 'string');
      const numericCols = Object.keys(firstRow).filter((k) => typeof firstRow[k] === 'number');

      setChartConfig({
        type: 'bar',
        title: `Metric Breakdown - ${tableName}`,
        xAxis: stringCols[0] || Object.keys(firstRow)[0] || '',
        yAxis: numericCols[0] || Object.keys(firstRow)[1] || '',
        colorTheme: 'purple'
      });
    }
  };

  const handleRunQuery = async (sql: string) => {
    setCurrentSql(sql);
    const res = await auraEngine.query(sql);
    setQueryResult(res);

    if (res.rows.length > 0 && res.columns.length >= 2) {
      setChartConfig((prev) => {
        const hasValidX = prev.xAxis && res.columns.includes(prev.xAxis);
        const hasValidY = prev.yAxis && res.columns.includes(prev.yAxis);
        return {
          ...prev,
          xAxis: hasValidX ? prev.xAxis : res.columns[0],
          yAxis: hasValidY ? prev.yAxis : res.columns[1]
        };
      });
    }
  };

  const handleApplyFilter = async (column: string, value: string) => {
    setActiveFilter({ column, value });

    await webMcp.callTool('apply_dashboard_filter', {
      column,
      operator: '=',
      value
    });

    const filteredSql = `SELECT * FROM ${activeDataset} WHERE ${column} = '${value}' LIMIT 50;`;
    await handleRunQuery(filteredSql);
  };

  const handleClearFilter = async () => {
    setActiveFilter(null);
    const defaultSql = `SELECT * FROM ${activeDataset} LIMIT 50;`;
    await handleRunQuery(defaultSql);
  };

  // Natural Language Query Assistant that calls real WebMCP tools
  const handleExecuteAiPrompt = async (promptText: string) => {
    if (!activeDataset) return;
    setIsProcessingAi(true);

    try {
      const rows = auraEngine.getTableData(activeDataset);
      if (rows.length === 0) return;

      const firstRow = rows[0];
      const numericCols = Object.keys(firstRow).filter((k) => typeof firstRow[k] === 'number');
      const stringCols = Object.keys(firstRow).filter(
        (k) => typeof firstRow[k] === 'string' && !k.toLowerCase().includes('id')
      );

      const numCol = numericCols[0] || Object.keys(firstRow)[1] || 'value';
      const dimCol = stringCols[0] || Object.keys(firstRow)[0] || 'category';
      const lower = promptText.toLowerCase();

      let targetSql = '';
      let targetChartType: ChartType = 'bar';

      if (lower.includes('area') || lower.includes('trend')) {
        targetChartType = 'area';
        targetSql = `SELECT ${dimCol}, ROUND(SUM(${numCol}), 2) as total_${numCol} FROM ${activeDataset} GROUP BY ${dimCol} ORDER BY total_${numCol} DESC LIMIT 10;`;
      } else if (lower.includes('donut') || lower.includes('pie') || lower.includes('share')) {
        targetChartType = 'donut';
        targetSql = `SELECT ${dimCol}, ROUND(SUM(${numCol}), 2) as total_${numCol} FROM ${activeDataset} GROUP BY ${dimCol} ORDER BY total_${numCol} DESC LIMIT 8;`;
      } else if (lower.includes('line')) {
        targetChartType = 'line';
        targetSql = `SELECT ${dimCol}, ROUND(AVG(${numCol}), 2) as avg_${numCol} FROM ${activeDataset} GROUP BY ${dimCol} LIMIT 15;`;
      } else if (lower.includes('top') || lower.includes('aggregate') || lower.includes('sum')) {
        targetChartType = 'bar';
        targetSql = `SELECT ${dimCol}, ROUND(SUM(${numCol}), 2) as total_${numCol} FROM ${activeDataset} GROUP BY ${dimCol} ORDER BY total_${numCol} DESC LIMIT 10;`;
      } else {
        targetSql = `SELECT * FROM ${activeDataset} LIMIT 25;`;
      }

      await webMcp.callTool('execute_sql_query', { sql: targetSql });
      await webMcp.callTool('render_interactive_chart', {
        type: targetChartType,
        title: `Dynamic View: ${numCol} by ${dimCol}`,
        xAxis: dimCol,
        yAxis: `total_${numCol}`,
        colorTheme: 'purple'
      });
    } catch (err) {
      console.error('Co-Pilot execution error:', err);
    } finally {
      setIsProcessingAi(false);
    }
  };

  const handleChartTypeChange = (type: ChartType) => {
    setChartConfig((prev) => ({ ...prev, type }));
  };

  const handleCustomDatasetImported = (tableName: string, count: number) => {
    setActiveDataset(tableName);
    setIsUploadOpen(false);
    const customSql = `SELECT * FROM ${tableName} LIMIT 50;`;
    setCurrentSql(customSql);
    handleRunQuery(customSql);

    const rows = auraEngine.getTableData(tableName);
    if (rows.length > 0) {
      const firstRow = rows[0];
      const stringCols = Object.keys(firstRow).filter((k) => typeof firstRow[k] === 'string');
      const numericCols = Object.keys(firstRow).filter((k) => typeof firstRow[k] === 'number');

      setChartConfig({
        type: 'bar',
        title: `${tableName} Overview`,
        xAxis: stringCols[0] || Object.keys(firstRow)[0] || '',
        yAxis: numericCols[0] || Object.keys(firstRow)[1] || '',
        colorTheme: 'purple'
      });
    }
  };

  // Helper to load sample real CSV data on user demand without starting with preloaded data
  const handleLoadSampleData = () => {
    const sampleRows: Record<string, any>[] = [
      { company: 'Snowflake Inc', ticker: 'SNOW', segment: 'Data Cloud', quarterly_revenue_m: 829.3, gross_margin_pct: 71.2, yoy_growth_pct: 32.1, headcount: 7004 },
      { company: 'Datadog Inc', ticker: 'DDOG', segment: 'Observability', quarterly_revenue_m: 611.2, gross_margin_pct: 80.5, yoy_growth_pct: 27.4, headcount: 5200 },
      { company: 'Cloudflare Inc', ticker: 'NET', segment: 'Security & CDN', quarterly_revenue_m: 378.6, gross_margin_pct: 78.4, yoy_growth_pct: 30.5, headcount: 3840 },
      { company: 'Palantir Tech', ticker: 'PLTR', segment: 'AI & Defense', quarterly_revenue_m: 678.1, gross_margin_pct: 82.1, yoy_growth_pct: 27.2, headcount: 3800 },
      { company: 'CrowdStrike', ticker: 'CRWD', segment: 'Cybersecurity', quarterly_revenue_m: 921.0, gross_margin_pct: 77.8, yoy_growth_pct: 33.0, headcount: 7925 },
      { company: 'Confluent Inc', ticker: 'CFLT', segment: 'Data Streaming', quarterly_revenue_m: 235.0, gross_margin_pct: 73.1, yoy_growth_pct: 24.5, headcount: 2900 },
      { company: 'MongoDB Inc', ticker: 'MDB', segment: 'Database', quarterly_revenue_m: 478.2, gross_margin_pct: 75.3, yoy_growth_pct: 22.0, headcount: 5080 },
      { company: 'Elastic NV', ticker: 'ESTC', segment: 'Search & Observability', quarterly_revenue_m: 341.0, gross_margin_pct: 76.5, yoy_growth_pct: 18.2, headcount: 3200 }
    ];

    auraEngine.registerCustomTable('cloud_software_financials', sampleRows);
    handleCustomDatasetImported('cloud_software_financials', sampleRows.length);
  };

  const hasActiveTable = Boolean(activeDataset && auraEngine.getTableData(activeDataset).length > 0);

  return (
    <div className="h-screen w-screen bg-slate-50 dark:bg-dark-950 text-slate-900 dark:text-slate-100 flex flex-col overflow-hidden selection:bg-brand-500/30 selection:text-brand-300 transition-colors">
      {/* Header with Table Switcher & WebMCP Status */}
      <Header
        activeDataset={activeDataset}
        onSelectDataset={handleSelectDataset}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenReport={() => setIsReportOpen(true)}
        onToggleInspector={() => setIsInspectorOpen(!isInspectorOpen)}
        isInspectorOpen={isInspectorOpen}
        onReturnHome={onReturnHome}
        isWebMcpActive={true}
        recentToolCallCount={events.length}
      />

      {/* Main Studio Body */}
      <div className="flex-1 flex overflow-hidden">
        {hasActiveTable ? (
          /* Active Analytics Workspace */
          <main className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 min-w-0">
            {/* Natural Language Query Co-Pilot */}
            <AiCommandBar
              activeDataset={activeDataset}
              onExecutePrompt={handleExecuteAiPrompt}
              isProcessing={isProcessingAi}
            />

            {/* Dynamic Statistical Insights */}
            <InsightBanner dataset={activeDataset} onActionClick={handleRunQuery} />

            {/* Dynamic Cohort Slicers */}
            <GlobalFilterBar
              dataset={activeDataset}
              activeFilter={activeFilter}
              onApplyFilter={handleApplyFilter}
              onClearFilter={handleClearFilter}
            />

            {/* Live KPI Metric Cards */}
            <MetricCards tableName={activeDataset} />

            {/* Interactive Visualizations */}
            <ChartViewport
              config={chartConfig}
              data={queryResult.rows}
              onTypeChange={handleChartTypeChange}
              isAgentUpdated={agentUpdated}
            />

            {/* In-Memory SQL Console */}
            <SqlConsole
              activeDataset={activeDataset}
              currentSql={currentSql}
              onRunSql={handleRunQuery}
              executionTimeMs={queryResult.executionTimeMs}
              rowCount={queryResult.rowCount}
              isAgentExecuting={agentUpdated}
            />

            {/* Live Data Grid */}
            <DataTable
              columns={queryResult.columns}
              rows={queryResult.rows}
              tableName={activeDataset}
            />
          </main>
        ) : (
          /* Zero Preloaded Data - Clean Ingestion Center */
          <main className="flex-1 overflow-y-auto p-6 sm:p-12 flex flex-col items-center justify-center min-w-0">
            <div className="max-w-xl w-full text-center space-y-6">
              {/* Icon & Title */}
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-none bg-brand-50 dark:bg-brand-950 border border-brand-200 dark:border-brand-500/40 text-brand-600 dark:text-brand-400 mx-auto shadow-sm">
                <Database className="w-8 h-8" />
              </div>

              <div>
                <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950 px-2 py-0.5 border border-brand-200 dark:border-brand-500/30">
                  Ready for Ingestion
                </span>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white font-mono mt-3 mb-2">
                  No Preloaded Datasets Active
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-sans leading-relaxed max-w-md mx-auto">
                  Aura Analytics operates with zero mock or preloaded data. Ingest your raw CSV or JSON to initialize the in-memory AuraQL columnar engine and activate live WebMCP tools for AI agents.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setIsUploadOpen(true)}
                  className="w-full sm:w-auto btn-sharp px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-mono text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-brand-600/30 transition-all border border-brand-400/40"
                >
                  <Upload className="w-4 h-4" />
                  <span>Import Local CSV or JSON</span>
                </button>

                <button
                  onClick={handleLoadSampleData}
                  className="w-full sm:w-auto btn-sharp px-5 py-2.5 bg-white dark:bg-dark-900 hover:bg-slate-100 dark:hover:bg-dark-850 text-slate-800 dark:text-slate-200 font-mono text-xs font-semibold flex items-center justify-center gap-2 border border-slate-300 dark:border-white/10 hover:border-brand-500/40 transition-colors shadow-sm"
                >
                  <Sparkles className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                  <span>Load Cloud Software CSV (Sample)</span>
                </button>
              </div>

              {/* Protocol Spec Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t border-slate-200 dark:border-white/[0.08] text-left font-mono">
                <div className="p-3 bg-white dark:bg-dark-900 border border-slate-200 dark:border-white/[0.06]">
                  <div className="flex items-center gap-1.5 text-brand-600 dark:text-brand-400 font-bold text-xs mb-1">
                    <Zap className="w-3.5 h-3.5" />
                    <span>AuraQL Engine</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-sans">
                    Sub-10ms analytical query execution fully in-memory in browser RAM.
                  </p>
                </div>

                <div className="p-3 bg-white dark:bg-dark-900 border border-slate-200 dark:border-white/[0.06]">
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-xs mb-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Zero Data Leakage</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-sans">
                    Data never leaves your local browser tab or transmits over network.
                  </p>
                </div>

                <div className="p-3 bg-white dark:bg-dark-900 border border-slate-200 dark:border-white/[0.06]">
                  <div className="flex items-center gap-1.5 text-accent-cyan font-bold text-xs mb-1">
                    <FileText className="w-3.5 h-3.5" />
                    <span>WebMCP Active</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-sans">
                    Real WebMCP tools listening on <code>window.modelContext</code>.
                  </p>
                </div>
              </div>
            </div>
          </main>
        )}

        {/* Real WebMCP Protocol Inspector Side Panel */}
        {isInspectorOpen && (
          <WebMcpInspector
            isOpen={isInspectorOpen}
            onClose={() => setIsInspectorOpen(false)}
            events={events}
            activeDataset={activeDataset}
          />
        )}
      </div>

      {/* CSV / JSON Upload Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onDatasetImported={handleCustomDatasetImported}
      />

      {/* Executive PDF Briefing Modal */}
      {hasActiveTable && (
        <ExecutiveReportModal
          isOpen={isReportOpen}
          onClose={() => setIsReportOpen(false)}
          dataset={activeDataset}
          queryResult={queryResult}
          chartConfig={chartConfig}
        />
      )}
    </div>
  );
};
