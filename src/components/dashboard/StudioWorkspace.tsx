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
import { DatasetId, ChartConfig, QueryResult, WebMcpToolEvent, ChartType } from '../../types';
import { auraEngine } from '../../engine/auraql';
import { webMcp } from '../../engine/webmcp';
import { DATASETS_METADATA } from '../../engine/datasets';

interface StudioWorkspaceProps {
  onReturnHome: () => void;
}

export const StudioWorkspace: React.FC<StudioWorkspaceProps> = ({ onReturnHome }) => {
  const [activeDataset, setActiveDataset] = useState<DatasetId>('ecommerce');
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(true);
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);
  const [isProcessingAi, setIsProcessingAi] = useState<boolean>(false);
  const [events, setEvents] = useState<WebMcpToolEvent[]>([]);
  const [agentUpdated, setAgentUpdated] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<{ column: string; value: string } | null>(null);

  // Active Query State
  const defaultSql = DATASETS_METADATA.ecommerce.sampleQueries[0].sql;
  const [currentSql, setCurrentSql] = useState<string>(defaultSql);
  const [queryResult, setQueryResult] = useState<QueryResult>({
    sql: defaultSql,
    columns: [],
    rows: [],
    rowCount: 0,
    executionTimeMs: 0,
    timestamp: new Date()
  });

  // Active Chart Configuration
  const [chartConfig, setChartConfig] = useState<ChartConfig>({
    type: 'bar',
    title: 'Revenue & Margin by Product Category',
    xAxis: 'product_category',
    yAxis: 'total_rev',
    colorTheme: 'purple'
  });

  // Initialize WebMCP tools and run default query
  useEffect(() => {
    webMcp.registerAllTools();

    const unsubEvents = webMcp.subscribeEvents((newEvt) => {
      setEvents((prev) => [newEvt, ...prev.slice(0, 40)]);
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

    handleRunQuery(defaultSql);

    return () => {
      unsubEvents();
      unsubState();
    };
  }, []);

  const handleSelectDataset = (id: DatasetId) => {
    setActiveDataset(id);
    setActiveFilter(null);
    const meta = DATASETS_METADATA[id];
    if (meta && meta.sampleQueries.length > 0) {
      const sql = meta.sampleQueries[0].sql;
      setCurrentSql(sql);
      handleRunQuery(sql);

      if (id === 'ecommerce') {
        setChartConfig({
          type: 'bar',
          title: 'Revenue by Product Category',
          xAxis: 'product_category',
          yAxis: 'total_rev',
          colorTheme: 'purple'
        });
      } else if (id === 'churn') {
        setChartConfig({
          type: 'area',
          title: 'ARR at Risk by Churn Severity',
          xAxis: 'churn_risk',
          yAxis: 'total_mrr_at_risk',
          colorTheme: 'purple'
        });
      } else if (id === 'webvitals') {
        setChartConfig({
          type: 'bar',
          title: 'P95 Core Web Vitals by Device Profile',
          xAxis: 'device_type',
          yAxis: 'avg_lcp_ms',
          colorTheme: 'purple'
        });
      }
    }
  };

  const handleRunQuery = async (sql: string) => {
    setCurrentSql(sql);
    const res = await auraEngine.query(sql);
    setQueryResult(res);

    if (res.rows.length > 0 && res.columns.length >= 2) {
      const firstCol = res.columns[0];
      const secondCol = res.columns[1];
      setChartConfig((prev) => ({
        ...prev,
        xAxis: prev.xAxis && res.columns.includes(prev.xAxis) ? prev.xAxis : firstCol,
        yAxis: prev.yAxis && res.columns.includes(prev.yAxis) ? prev.yAxis : secondCol
      }));
    }
  };

  const handleApplyFilter = async (column: string, value: string) => {
    setActiveFilter({ column, value });
    const meta = DATASETS_METADATA[activeDataset];
    const table = meta?.tableName || 'ecommerce_sales';

    await webMcp.executeSimulatedTool('apply_dashboard_filter', {
      column,
      operator: '=',
      value
    });

    // Re-run tailored query with WHERE filter applied
    let filteredSql = '';
    if (activeDataset === 'ecommerce') {
      filteredSql = `SELECT product_category, ROUND(SUM(revenue), 2) as total_rev, ROUND(AVG(gross_margin_pct), 1) as avg_margin FROM ${table} WHERE ${column} = '${value}' GROUP BY product_category ORDER BY total_rev DESC;`;
    } else if (activeDataset === 'churn') {
      filteredSql = `SELECT company_name, monthly_mrr, health_score, utilization_pct FROM ${table} WHERE ${column} = '${value}' ORDER BY monthly_mrr DESC LIMIT 10;`;
    } else if (activeDataset === 'webvitals') {
      filteredSql = `SELECT url_path, ROUND(AVG(lcp_ms), 0) as avg_lcp_ms, ROUND(AVG(cls_score), 3) as avg_cls FROM ${table} WHERE ${column} = '${value}' GROUP BY url_path ORDER BY avg_lcp_ms DESC;`;
    } else {
      filteredSql = `SELECT * FROM ${table} WHERE ${column} = '${value}' LIMIT 50;`;
    }

    await handleRunQuery(filteredSql);
  };

  const handleClearFilter = async () => {
    setActiveFilter(null);
    const meta = DATASETS_METADATA[activeDataset];
    if (meta?.sampleQueries[0]) {
      await handleRunQuery(meta.sampleQueries[0].sql);
    }
  };

  // Natural Language AI Co-Pilot command handler
  const handleExecuteAiPrompt = async (promptText: string) => {
    setIsProcessingAi(true);
    try {
      const lower = promptText.toLowerCase();
      const meta = DATASETS_METADATA[activeDataset];
      const table = meta?.tableName || 'ecommerce_sales';

      if (lower.includes('category') || lower.includes('product') || (activeDataset === 'ecommerce' && !lower.includes('region'))) {
        const sql = `SELECT product_category, ROUND(SUM(revenue), 2) as total_rev, ROUND(AVG(gross_margin_pct), 1) as avg_margin FROM ${table} GROUP BY product_category ORDER BY total_rev DESC;`;
        await webMcp.executeSimulatedTool('execute_sql_query', { sql });
        await webMcp.executeSimulatedTool('render_interactive_chart', {
          type: 'bar',
          title: 'Top Product Categories by Net Revenue',
          xAxis: 'product_category',
          yAxis: 'total_rev',
          colorTheme: 'purple'
        });
      } else if (lower.includes('region') || lower.includes('velocity')) {
        const sql = `SELECT region, COUNT(order_id) as total_orders, ROUND(SUM(revenue), 2) as total_revenue FROM ${table} GROUP BY region ORDER BY total_revenue DESC;`;
        await webMcp.executeSimulatedTool('execute_sql_query', { sql });
        await webMcp.executeSimulatedTool('render_interactive_chart', {
          type: 'donut',
          title: 'Regional Order Velocity & Revenue Share',
          xAxis: 'region',
          yAxis: 'total_revenue',
          colorTheme: 'purple'
        });
      } else if (lower.includes('churn') || lower.includes('risk') || lower.includes('health')) {
        const sql = `SELECT company_name, monthly_mrr, health_score FROM saas_churn_metrics WHERE health_score < 45 ORDER BY monthly_mrr DESC LIMIT 8;`;
        await webMcp.executeSimulatedTool('execute_sql_query', { sql });
        await webMcp.executeSimulatedTool('render_interactive_chart', {
          type: 'area',
          title: 'Critical Accounts ARR & Health Risk Distribution',
          xAxis: 'company_name',
          yAxis: 'monthly_mrr',
          colorTheme: 'purple'
        });
      } else if (lower.includes('lcp') || lower.includes('device') || lower.includes('vitals')) {
        const sql = `SELECT device_type, ROUND(AVG(lcp_ms), 0) as avg_lcp_ms, ROUND(AVG(inp_ms), 0) as avg_inp_ms FROM web_vitals_telemetry GROUP BY device_type;`;
        await webMcp.executeSimulatedTool('execute_sql_query', { sql });
        await webMcp.executeSimulatedTool('render_interactive_chart', {
          type: 'bar',
          title: 'Core Web Vitals Timing by Hardware Form Factor',
          xAxis: 'device_type',
          yAxis: 'avg_lcp_ms',
          colorTheme: 'purple'
        });
      } else {
        const sql = `SELECT * FROM ${table} LIMIT 25;`;
        await webMcp.executeSimulatedTool('execute_sql_query', { sql });
      }
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
    setActiveDataset(tableName as any);
    const customSql = `SELECT * FROM ${tableName} LIMIT 50;`;
    setCurrentSql(customSql);
    handleRunQuery(customSql);
  };

  const currentMeta = DATASETS_METADATA[activeDataset];
  const activeTableName = currentMeta?.tableName || String(activeDataset);

  return (
    <div className="h-screen w-screen bg-slate-100 dark:bg-dark-950 text-slate-900 dark:text-slate-100 flex flex-col overflow-hidden selection:bg-brand-500/30 selection:text-brand-300 transition-colors">
      {/* Studio Header */}
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

      {/* Main Studio Viewport (Fixed Layout) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Main Analytics Scrollable Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Natural Language AI Co-Pilot Command Center */}
          <AiCommandBar
            activeDataset={activeDataset}
            onExecutePrompt={handleExecuteAiPrompt}
            isProcessing={isProcessingAi}
          />

          {/* Automated Executive Anomaly & Insights Banner */}
          <InsightBanner
            dataset={activeDataset}
            onActionClick={handleRunQuery}
          />

          {/* Global Multi-Variable Cohort Slicers */}
          <GlobalFilterBar
            dataset={activeDataset}
            activeFilter={activeFilter}
            onApplyFilter={handleApplyFilter}
            onClearFilter={handleClearFilter}
          />

          {/* Dynamic Live Metric Cards computed from real data */}
          <MetricCards tableName={activeTableName} />

          {/* Interactive Chart Canvas Viewport */}
          <ChartViewport
            config={chartConfig}
            data={queryResult.rows}
            onTypeChange={handleChartTypeChange}
            isAgentUpdated={agentUpdated}
          />

          {/* AuraQL Code & Execution Console */}
          <SqlConsole
            activeDataset={activeDataset}
            currentSql={currentSql}
            onRunSql={handleRunQuery}
            executionTimeMs={queryResult.executionTimeMs}
            rowCount={queryResult.rowCount}
            isAgentExecuting={agentUpdated}
          />

          {/* Real Tabular Stream */}
          <DataTable
            columns={queryResult.columns}
            rows={queryResult.rows}
            tableName={activeTableName}
          />
        </main>

        {/* WebMCP Telemetry & Agent Simulation Panel */}
        <WebMcpInspector
          isOpen={isInspectorOpen}
          onClose={() => setIsInspectorOpen(false)}
          events={events}
          activeDataset={activeDataset}
        />
      </div>

      {/* Custom Dataset Upload Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onDatasetImported={handleCustomDatasetImported}
      />

      {/* Executive Briefing & Export Modal */}
      <ExecutiveReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        dataset={activeDataset}
        queryResult={queryResult}
        chartConfig={chartConfig}
      />
    </div>
  );
};
