import React, { useState, useEffect } from 'react';
import { Header } from '../layout/Header';
import { MetricCards } from './MetricCards';
import { ChartViewport } from './ChartViewport';
import { SqlConsole } from './SqlConsole';
import { DataTable } from './DataTable';
import { WebMcpInspector } from './WebMcpInspector';
import { UploadModal } from '../modals/UploadModal';
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
  const [events, setEvents] = useState<WebMcpToolEvent[]>([]);
  const [agentUpdated, setAgentUpdated] = useState<boolean>(false);

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
      }
    });

    // Run initial query with live calculations
    handleRunQuery(defaultSql);

    return () => {
      unsubEvents();
      unsubState();
    };
  }, []);

  const handleSelectDataset = (id: DatasetId) => {
    setActiveDataset(id);
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
    </div>
  );
};
