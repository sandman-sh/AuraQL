import React, { useState, useEffect, useRef } from 'react';
import { Header } from '../layout/Header';
import { MetricCards } from './MetricCards';
import { ChartViewport } from './ChartViewport';
import { SqlConsole } from './SqlConsole';
import { DataTable } from './DataTable';
import { WebMcpInspector } from './WebMcpInspector';
import { UploadModal } from '../modals/UploadModal';
import { ExecutiveReportModal } from '../modals/ExecutiveReportModal';
import { AgentConnectModal } from '../modals/AgentConnectModal';
import { ShareModal } from '../modals/ShareModal';
import { ExportBriefingModal } from '../modals/ExportBriefingModal';
import { AiCommandBar } from './AiCommandBar';
import { InsightBanner } from './InsightBanner';
import { GlobalFilterBar } from './GlobalFilterBar';
import { WorkspaceWindow } from './WorkspaceWindow';
import { SplitGutter } from './SplitGutter';
import { ChartConfig, QueryResult, WebMcpToolEvent, ChartType } from '../../types';
import { auraEngine } from '../../engine/auraql';
import { webMcp } from '../../engine/webmcp';
import { auraAgent } from '../../engine/agent';
import { parseShareableUrl } from '../../engine/share';
import { DATASETS_METADATA } from '../../engine/datasets';
import {
  Upload,
  Database,
  Zap,
  ShieldCheck,
  Sparkles,
  LayoutGrid,
  Columns,
  RotateCcw,
  BarChart2,
  Terminal,
  Activity,
  Table as TableIcon
} from 'lucide-react';

export type WindowId = 'stats' | 'graph' | 'terminal' | 'table';

const DEFAULT_SLOTS: WindowId[] = ['graph', 'terminal', 'stats', 'table'];

interface StudioWorkspaceProps {
  onReturnHome: () => void;
  onOpenDocs?: () => void;
}

export const StudioWorkspace: React.FC<StudioWorkspaceProps> = ({ onReturnHome, onOpenDocs }) => {
  const initialTables = auraEngine.getTableNames();
  const [activeDataset, setActiveDataset] = useState<string>(initialTables[0] || 'ecommerce_sales');
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false);
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);
  const [isAgentModalOpen, setIsAgentModalOpen] = useState<boolean>(false);
  const [isShareOpen, setIsShareOpen] = useState<boolean>(false);
  const [isExportSlideOpen, setIsExportSlideOpen] = useState<boolean>(false);
  const [scenarioResult, setScenarioResult] = useState<any>(null);
  const [anomalyReport, setAnomalyReport] = useState<any>(null);
  const [agentStatusMessage, setAgentStatusMessage] = useState<string>('');
  const [isProcessingAi, setIsProcessingAi] = useState<boolean>(false);
  const [events, setEvents] = useState<WebMcpToolEvent[]>([]);
  const [agentUpdated, setAgentUpdated] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<{ column: string; value: string } | null>(null);

  // Modular Workspace Layout State: 4 slots with dynamic percentage split & vertical height
  const [slots, setSlots] = useState<WindowId[]>(DEFAULT_SLOTS);
  const [row1Split, setRow1Split] = useState<number>(50); // Default equal 50%
  const [row2Split, setRow2Split] = useState<number>(50); // Default equal 50%
  const [row1Height, setRow1Height] = useState<number>(440); // Default row 1 height
  const [row2Height, setRow2Height] = useState<number>(440); // Default row 2 height
  const [verticalSplit, setVerticalSplit] = useState<number>(50); // Default 50/50 vertical split
  const [windowHeights, setWindowHeights] = useState<Record<WindowId, number>>({
    stats: 440,
    graph: 440,
    terminal: 440,
    table: 440
  });
  const [isStacked, setIsStacked] = useState<boolean>(false);
  const [minimizedWindows, setMinimizedWindows] = useState<Record<string, boolean>>({});
  const [maximizedWindow, setMaximizedWindow] = useState<WindowId | null>(null);
  const [draggedWindow, setDraggedWindow] = useState<WindowId | null>(null);
  const [dragOverWindow, setDragOverWindow] = useState<WindowId | null>(null);

  const row1Ref = useRef<HTMLDivElement>(null);
  const row2Ref = useRef<HTMLDivElement>(null);
  const workspaceGridRef = useRef<HTMLDivElement>(null);

  // Load saved workspace layout preferences
  useEffect(() => {
    try {
      const savedSlots = localStorage.getItem('auraql_slots_v3');
      if (savedSlots) {
        const parsed = JSON.parse(savedSlots);
        if (Array.isArray(parsed) && parsed.length === 4) setSlots(parsed);
      }
      const savedSplits = localStorage.getItem('auraql_splits_v3');
      if (savedSplits) {
        const parsed = JSON.parse(savedSplits);
        if (parsed.row1 !== undefined) setRow1Split(parsed.row1);
        if (parsed.row2 !== undefined) setRow2Split(parsed.row2);
        if (parsed.isStacked !== undefined) setIsStacked(parsed.isStacked);
        if (parsed.row1Height !== undefined) setRow1Height(parsed.row1Height);
        if (parsed.row2Height !== undefined) setRow2Height(parsed.row2Height);
        if (parsed.verticalSplit !== undefined) setVerticalSplit(parsed.verticalSplit);
      }
    } catch {}
  }, []);

  // Restore dashboard state from URL hash if opened via Shareable Link
  useEffect(() => {
    const shared = parseShareableUrl();
    if (shared) {
      setActiveDataset(shared.table);
      setCurrentSql(shared.sql);
      setChartConfig(shared.chart as ChartConfig);
      if (shared.filter) setActiveFilter(shared.filter);
      auraEngine.query(shared.sql).then(setQueryResult);
    }
  }, []);

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
    try {
      webMcp.registerAllTools();
    } catch (e) {
      console.warn('[StudioWorkspace] webMcp registerAllTools:', e);
    }

    const unsubEvents = webMcp.subscribeEvents((newEvt) => {
      setEvents((prev) => [newEvt, ...prev.slice(0, 50)]);
    });

    const unsubState = webMcp.subscribeStateUpdates(({ type, data }) => {
      if (type === 'query') {
        const res = data as QueryResult;
        if (res) {
          setCurrentSql(res.sql || '');
          setQueryResult(res);
          setAgentUpdated(true);
          setTimeout(() => setAgentUpdated(false), 3000);
        }
      } else if (type === 'chart') {
        const cfg = data as ChartConfig;
        if (cfg) {
          setChartConfig(cfg);
          setAgentUpdated(true);
          setTimeout(() => setAgentUpdated(false), 3000);
        }
      } else if (type === 'filter') {
        setActiveFilter(data);
        if (data && data.column && data.value && activeDataset) {
          const filteredSql = `SELECT * FROM ${activeDataset} WHERE ${data.column} = '${data.value}' LIMIT 50;`;
          handleRunQuery(filteredSql);
        }
      } else if (type === 'scenario') {
        setScenarioResult(data);
        setAgentUpdated(true);
        setTimeout(() => setAgentUpdated(false), 4000);
      } else if (type === 'anomalies') {
        setAnomalyReport(data);
        setAgentUpdated(true);
        setTimeout(() => setAgentUpdated(false), 4000);
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
  }, [activeDataset]);

  const handleSelectDataset = (tableName: string) => {
    if (!tableName) return;
    const safeName = tableName.toLowerCase();
    setActiveDataset(safeName);
    setActiveFilter(null);
    const meta = DATASETS_METADATA[safeName];
    const initialQuery = meta?.sampleQueries?.[0]?.sql || `SELECT * FROM ${safeName} LIMIT 50;`;
    setCurrentSql(initialQuery);
    handleRunQuery(initialQuery);

    // Auto-configure initial chart from first string & numeric columns
    const rows = auraEngine.getTableData(safeName);
    if (rows.length > 0 && rows[0]) {
      const firstRow = rows[0];
      const stringCols = Object.keys(firstRow).filter((k) => typeof firstRow[k] === 'string');
      const numericCols = Object.keys(firstRow).filter(
        (k) => typeof firstRow[k] === 'number' || !isNaN(Number(firstRow[k]))
      );

      setChartConfig({
        type: 'bar',
        title: `${safeName} Overview`,
        xAxis: stringCols[0] || Object.keys(firstRow)[0] || '',
        yAxis: numericCols[0] || Object.keys(firstRow)[1] || '',
        colorTheme: 'purple'
      });
    }
  };

  const handleRunQuery = async (sql: string) => {
    if (!sql || !sql.trim()) return;
    setCurrentSql(sql);
    try {
      const res = await auraEngine.query(sql);
      setQueryResult(res || {
        sql,
        columns: [],
        rows: [],
        rowCount: 0,
        executionTimeMs: 0.1,
        timestamp: new Date()
      });

      if (res && res.rows && res.rows.length > 0 && res.columns && res.columns.length >= 1) {
        const firstRow = res.rows[0];
        if (firstRow) {
          const stringCol = res.columns.find((c) => typeof firstRow[c] === 'string') || res.columns[0];
          const numCol =
            res.columns.find((c) => typeof firstRow[c] === 'number') ||
            res.columns.find((c) => !isNaN(Number(firstRow[c]))) ||
            res.columns[1] ||
            res.columns[0];

          setChartConfig((prev) => {
            const hasValidX = prev.xAxis && res.columns.includes(prev.xAxis);
            const hasValidY = prev.yAxis && res.columns.includes(prev.yAxis);
            return {
              ...prev,
              xAxis: hasValidX ? prev.xAxis : stringCol,
              yAxis: hasValidY ? prev.yAxis : numCol
            };
          });
        }
      }
    } catch (err: any) {
      console.error('[StudioWorkspace] Query execution error:', err);
      setQueryResult((prev) => ({
        ...prev,
        error: err?.message || 'Query execution error'
      }));
    }
  };

  const handleApplyFilter = async (column: string, value: string) => {
    if (!activeDataset) return;
    setActiveFilter({ column, value });

    try {
      await webMcp.callTool('apply_dashboard_filter', {
        column,
        operator: '=',
        value
      });
    } catch (e) {
      console.warn('[StudioWorkspace] apply_dashboard_filter error:', e);
    }

    const filteredSql = `SELECT * FROM ${activeDataset} WHERE ${column} = '${value}' LIMIT 50;`;
    await handleRunQuery(filteredSql);
  };

  const handleClearFilter = async () => {
    setActiveFilter(null);
    if (!activeDataset) return;
    const defaultSql = `SELECT * FROM ${activeDataset} LIMIT 50;`;
    await handleRunQuery(defaultSql);
  };

  // Autonomous AI Agent execution loop connected to WebMCP
  const handleExecuteAiPrompt = async (promptText: string) => {
    if (!activeDataset) return;
    setIsProcessingAi(true);
    setAgentStatusMessage('Initializing AI agent...');

    try {
      const res = await auraAgent.run(promptText, activeDataset, (step) => {
        setAgentStatusMessage(step.message);
      });

      if (res.success) {
        setAgentUpdated(true);
        setTimeout(() => setAgentUpdated(false), 3000);
      } else {
        setAgentStatusMessage(res.finalMessage);
      }
    } catch (err: any) {
      console.error('AI Agent execution error:', err);
      setAgentStatusMessage(`Error: ${err.message || 'Execution error'}`);
    } finally {
      setTimeout(() => {
        setIsProcessingAi(false);
        setAgentStatusMessage('');
      }, 1800);
    }
  };

  const handleChartTypeChange = (type: ChartType) => {
    setChartConfig((prev) => ({ ...prev, type }));
  };

  const handleCustomDatasetImported = (tableName: string, count: number) => {
    const safeName = (tableName || '').toLowerCase().replace(/[^a-z0-9_]/g, '_');
    setActiveDataset(safeName);
    setIsUploadOpen(false);
    const customSql = `SELECT * FROM ${safeName} LIMIT 50;`;
    setCurrentSql(customSql);
    handleRunQuery(customSql);

    const rows = auraEngine.getTableData(safeName);
    if (rows.length > 0 && rows[0]) {
      const firstRow = rows[0];
      const stringCols = Object.keys(firstRow).filter((k) => typeof firstRow[k] === 'string');
      const numericCols = Object.keys(firstRow).filter(
        (k) => typeof firstRow[k] === 'number' || !isNaN(Number(firstRow[k]))
      );

      setChartConfig({
        type: 'bar',
        title: `${safeName} Overview`,
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

  // Layout Persistence Helper
  const saveLayout = (
    newSlots: WindowId[],
    r1: number,
    r2: number,
    stacked: boolean,
    h1?: number,
    h2?: number,
    vSplit?: number
  ) => {
    try {
      localStorage.setItem('auraql_slots_v3', JSON.stringify(newSlots));
      localStorage.setItem(
        'auraql_splits_v3',
        JSON.stringify({
          row1: r1,
          row2: r2,
          isStacked: stacked,
          row1Height: h1 ?? row1Height,
          row2Height: h2 ?? row2Height,
          verticalSplit: vSplit ?? verticalSplit
        })
      );
    } catch {}
  };

  // Drag & Drop Window Position Swapping
  const handleDragStart = (id: WindowId) => {
    setDraggedWindow(id);
  };

  const handleDragOver = (e: React.DragEvent, id: WindowId) => {
    e.preventDefault();
    if (draggedWindow && draggedWindow !== id) {
      setDragOverWindow(id);
    }
  };

  const handleDrop = (e: React.DragEvent, targetId: WindowId) => {
    e.preventDefault();
    if (!draggedWindow || draggedWindow === targetId) {
      setDraggedWindow(null);
      setDragOverWindow(null);
      return;
    }

    const fromIdx = slots.indexOf(draggedWindow);
    const toIdx = slots.indexOf(targetId);
    if (fromIdx !== -1 && toIdx !== -1) {
      const newSlots = [...slots];
      newSlots[fromIdx] = targetId;
      newSlots[toIdx] = draggedWindow;
      setSlots(newSlots);
      saveLayout(newSlots, row1Split, row2Split, isStacked, row1Height, row2Height, verticalSplit);
    }
    setDraggedWindow(null);
    setDragOverWindow(null);
  };

  const handleDragEnd = () => {
    setDraggedWindow(null);
    setDragOverWindow(null);
  };

  // Real-time Resizing with Dynamic Sibling Auto-Adjustment
  const handleRow1SplitChange = (newPct: number) => {
    setRow1Split(newPct);
    saveLayout(slots, newPct, row2Split, isStacked, row1Height, row2Height, verticalSplit);
  };

  const handleRow2SplitChange = (newPct: number) => {
    setRow2Split(newPct);
    saveLayout(slots, row1Split, newPct, isStacked, row1Height, row2Height, verticalSplit);
  };

  // Downward / Height Resizing Handlers
  const handleRow1HeightChange = (newH: number) => {
    setRow1Height(newH);
    setWindowHeights((prev) => ({ ...prev, [slots[0]]: newH, [slots[1]]: newH }));
    saveLayout(slots, row1Split, row2Split, isStacked, newH, row2Height, verticalSplit);
  };

  const handleRow2HeightChange = (newH: number) => {
    setRow2Height(newH);
    setWindowHeights((prev) => ({ ...prev, [slots[2]]: newH, [slots[3]]: newH }));
    saveLayout(slots, row1Split, row2Split, isStacked, row1Height, newH, verticalSplit);
  };

  const handleVerticalSplitChange = (newPct: number) => {
    setVerticalSplit(newPct);
    const totalHeight = (row1Height + row2Height) || 880;
    const newH1 = Math.max(240, Math.round((newPct / 100) * totalHeight));
    const newH2 = Math.max(240, totalHeight - newH1);
    setRow1Height(newH1);
    setRow2Height(newH2);
    setWindowHeights((prev) => ({
      ...prev,
      [slots[0]]: newH1,
      [slots[1]]: newH1,
      [slots[2]]: newH2,
      [slots[3]]: newH2
    }));
    saveLayout(slots, row1Split, row2Split, isStacked, newH1, newH2, newPct);
  };

  // When a user selects a width percentage on an individual window
  const handleWindowSetWidth = (id: WindowId, desiredPct: number) => {
    if (id === slots[0]) {
      handleRow1SplitChange(desiredPct);
    } else if (id === slots[1]) {
      handleRow1SplitChange(100 - desiredPct);
    } else if (id === slots[2]) {
      handleRow2SplitChange(desiredPct);
    } else if (id === slots[3]) {
      handleRow2SplitChange(100 - desiredPct);
    }
  };

  const toggleMinimize = (id: WindowId) => {
    setMinimizedWindows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleMaximize = (id: WindowId) => {
    setMaximizedWindow((prev) => (prev === id ? null : id));
  };

  // Presets
  const applyPreset = (preset: 'equal' | 'wideGraph' | 'wideSql' | 'stacked') => {
    if (preset === 'equal') {
      setRow1Split(50);
      setRow2Split(50);
      setRow1Height(440);
      setRow2Height(440);
      setVerticalSplit(50);
      setIsStacked(false);
      saveLayout(slots, 50, 50, false, 440, 440, 50);
    } else if (preset === 'wideGraph') {
      setRow1Split(65);
      setRow2Split(50);
      setRow1Height(480);
      setRow2Height(400);
      setVerticalSplit(55);
      setIsStacked(false);
      saveLayout(slots, 65, 50, false, 480, 400, 55);
    } else if (preset === 'wideSql') {
      setRow1Split(35);
      setRow2Split(50);
      setRow1Height(480);
      setRow2Height(400);
      setVerticalSplit(55);
      setIsStacked(false);
      saveLayout(slots, 35, 50, false, 480, 400, 55);
    } else if (preset === 'stacked') {
      setIsStacked(true);
      saveLayout(slots, row1Split, row2Split, true, row1Height, row2Height, verticalSplit);
    }
  };

  const resetLayout = () => {
    const defaultSlots: WindowId[] = ['graph', 'terminal', 'stats', 'table'];
    setSlots(defaultSlots);
    setRow1Split(50);
    setRow2Split(50);
    setRow1Height(440);
    setRow2Height(440);
    setVerticalSplit(50);
    setIsStacked(false);
    setMinimizedWindows({});
    setMaximizedWindow(null);
    try {
      localStorage.removeItem('auraql_slots_v3');
      localStorage.removeItem('auraql_splits_v3');
    } catch {}
  };

  const renderWindowContent = (id: WindowId, widthPct: number) => {
    const isRow1 = id === slots[0] || id === slots[1];
    const currentHeight = isStacked ? (windowHeights[id] || 440) : (isRow1 ? row1Height : row2Height);
    const handleHeightChange = (newH: number) => {
      if (isStacked) {
        setWindowHeights((prev) => ({ ...prev, [id]: newH }));
      } else if (isRow1) {
        handleRow1HeightChange(newH);
      } else {
        handleRow2HeightChange(newH);
      }
    };

    switch (id) {
      case 'stats':
        return (
          <WorkspaceWindow
            key={id}
            id={id}
            title="Executive KPI Metrics"
            icon={<Activity className="w-3.5 h-3.5" />}
            statusBadge="4 ATTRIBUTES"
            widthPct={widthPct}
            heightPx={currentHeight}
            onHeightChange={handleHeightChange}
            isFullWidth={isStacked}
            onSetWidth={(pct) => handleWindowSetWidth(id, pct)}
            isMinimized={!!minimizedWindows[id]}
            onToggleMinimize={() => toggleMinimize(id)}
            isMaximized={maximizedWindow === id}
            onToggleMaximize={() => toggleMaximize(id)}
            onDragStart={() => handleDragStart(id)}
            onDragOver={(e) => handleDragOver(e, id)}
            onDrop={(e) => handleDrop(e, id)}
            onDragEnd={handleDragEnd}
            isDragging={draggedWindow === id}
            isDragOver={dragOverWindow === id}
          >
            <MetricCards tableName={activeDataset} />
          </WorkspaceWindow>
        );

      case 'graph':
        return (
          <WorkspaceWindow
            key={id}
            id={id}
            title="Analytics Viewport Canvas"
            icon={<BarChart2 className="w-3.5 h-3.5" />}
            statusBadge={`${(chartConfig.type || 'bar').toUpperCase()} • LIVE`}
            widthPct={widthPct}
            heightPx={currentHeight}
            onHeightChange={handleHeightChange}
            isFullWidth={isStacked}
            onSetWidth={(pct) => handleWindowSetWidth(id, pct)}
            isMinimized={!!minimizedWindows[id]}
            onToggleMinimize={() => toggleMinimize(id)}
            isMaximized={maximizedWindow === id}
            onToggleMaximize={() => toggleMaximize(id)}
            onDragStart={() => handleDragStart(id)}
            onDragOver={(e) => handleDragOver(e, id)}
            onDrop={(e) => handleDrop(e, id)}
            onDragEnd={handleDragEnd}
            isDragging={draggedWindow === id}
            isDragOver={dragOverWindow === id}
          >
            <ChartViewport
              config={chartConfig}
              data={queryResult.rows}
              onTypeChange={handleChartTypeChange}
              isAgentUpdated={agentUpdated}
            />
          </WorkspaceWindow>
        );

      case 'terminal':
        return (
          <WorkspaceWindow
            key={id}
            id={id}
            title="AuraQL SQL Console"
            icon={<Terminal className="w-3.5 h-3.5" />}
            statusBadge={`${queryResult.executionTimeMs}ms • IN-MEMORY`}
            widthPct={widthPct}
            heightPx={currentHeight}
            onHeightChange={handleHeightChange}
            isFullWidth={isStacked}
            onSetWidth={(pct) => handleWindowSetWidth(id, pct)}
            isMinimized={!!minimizedWindows[id]}
            onToggleMinimize={() => toggleMinimize(id)}
            isMaximized={maximizedWindow === id}
            onToggleMaximize={() => toggleMaximize(id)}
            onDragStart={() => handleDragStart(id)}
            onDragOver={(e) => handleDragOver(e, id)}
            onDrop={(e) => handleDrop(e, id)}
            onDragEnd={handleDragEnd}
            isDragging={draggedWindow === id}
            isDragOver={dragOverWindow === id}
          >
            <SqlConsole
              activeDataset={activeDataset}
              currentSql={currentSql}
              onRunSql={handleRunQuery}
              executionTimeMs={queryResult.executionTimeMs}
              rowCount={queryResult.rowCount}
              isAgentExecuting={agentUpdated}
              errorMessage={queryResult.error}
            />
          </WorkspaceWindow>
        );

      case 'table':
        return (
          <WorkspaceWindow
            key={id}
            id={id}
            title="Live OLAP Data Grid"
            icon={<TableIcon className="w-3.5 h-3.5" />}
            statusBadge={`${queryResult.rowCount} RECORDS`}
            widthPct={widthPct}
            heightPx={currentHeight}
            onHeightChange={handleHeightChange}
            isFullWidth={isStacked}
            onSetWidth={(pct) => handleWindowSetWidth(id, pct)}
            isMinimized={!!minimizedWindows[id]}
            onToggleMinimize={() => toggleMinimize(id)}
            isMaximized={maximizedWindow === id}
            onToggleMaximize={() => toggleMaximize(id)}
            onDragStart={() => handleDragStart(id)}
            onDragOver={(e) => handleDragOver(e, id)}
            onDrop={(e) => handleDrop(e, id)}
            onDragEnd={handleDragEnd}
            isDragging={draggedWindow === id}
            isDragOver={dragOverWindow === id}
          >
            <DataTable
              columns={queryResult.columns}
              rows={queryResult.rows}
              tableName={activeDataset}
            />
          </WorkspaceWindow>
        );
    }
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
        onOpenAgentModal={() => setIsAgentModalOpen(true)}
        onToggleInspector={() => setIsInspectorOpen(!isInspectorOpen)}
        isInspectorOpen={isInspectorOpen}
        onReturnHome={onReturnHome}
        isWebMcpActive={true}
        recentToolCallCount={events.length}
        onOpenDocs={onOpenDocs}
        onOpenShare={() => setIsShareOpen(true)}
        onOpenExportSlide={() => setIsExportSlideOpen(true)}
      />

      {/* Main Studio Body */}
      <div className="flex-1 flex overflow-hidden">
        {hasActiveTable ? (
          /* Active Analytics Workspace */
          <main className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 min-w-0">
            {/* What-If Scenario Forecast Banner */}
            {scenarioResult && (
              <div className="p-3.5 bg-brand-50/90 dark:bg-brand-950/80 border border-brand-300 dark:border-brand-500/40 font-mono text-xs space-y-2 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-brand-700 dark:text-brand-300 font-bold">
                    <Sparkles className="w-4 h-4 text-brand-500" />
                    <span>Active What-If Scenario: {scenarioResult.description || 'Forecast Simulation'}</span>
                  </div>
                  <button
                    onClick={() => setScenarioResult(null)}
                    className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    Dismiss
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-1">
                  {Object.entries(scenarioResult.metrics || {}).map(([col, m]: [string, any]) => (
                    <div key={col} className="p-2 bg-white dark:bg-dark-900 border border-brand-200 dark:border-brand-500/20">
                      <div className="text-[10px] text-slate-500 uppercase">{col}</div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">
                        {m.projectedTotal?.toLocaleString()}
                      </div>
                      <div className={`text-[10px] font-bold ${m.variancePct >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {m.variancePct >= 0 ? '+' : ''}{m.variancePct}% variance
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Statistical Anomaly Detection Alert */}
            {anomalyReport && anomalyReport.anomaliesFound > 0 && (
              <div className="p-3.5 bg-amber-50/90 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-500/40 font-mono text-xs space-y-2 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold">
                    <ShieldCheck className="w-4 h-4 text-amber-500" />
                    <span>Statistical Anomaly Detection: {anomalyReport.anomaliesFound} Outlier(s) in "{anomalyReport.tableName}"</span>
                  </div>
                  <button
                    onClick={() => setAnomalyReport(null)}
                    className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    Dismiss
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 text-[11px] pt-1">
                  {anomalyReport.anomalies.slice(0, 3).map((a: any, idx: number) => (
                    <span key={idx} className="px-2 py-1 bg-white dark:bg-dark-900 border border-amber-200 dark:border-amber-500/30 text-slate-800 dark:text-slate-200">
                      <strong>{a.rowIdentifier}</strong>: {a.reason}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Natural Language Query Co-Pilot */}
            <AiCommandBar
              activeDataset={activeDataset}
              onExecutePrompt={handleExecuteAiPrompt}
              isProcessing={isProcessingAi}
              onOpenAgentConfig={() => setIsAgentModalOpen(true)}
              agentStatusMessage={agentStatusMessage}
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

            {/* Workspace Layout Manager Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 px-3 py-2 bg-white/80 dark:bg-dark-900/80 backdrop-blur-md border border-slate-200 dark:border-white/[0.08] font-mono text-xs shadow-sm">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-bold">
                  <LayoutGrid className="w-3.5 h-3.5 text-brand-500" />
                  <span className="uppercase text-[11px] tracking-wider">Split View:</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => applyPreset('equal')}
                    className={`px-2 py-1 rounded-none border text-[10px] font-medium transition-colors ${
                      row1Split === 50 && !isStacked
                        ? 'bg-brand-600 text-white font-bold border-brand-500'
                        : 'bg-slate-100 dark:bg-dark-850 hover:bg-slate-200 dark:hover:bg-dark-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10'
                    }`}
                    title="Equal 50/50: All windows equally divided across screen"
                  >
                    Equal 50/50
                  </button>
                  <button
                    onClick={() => applyPreset('wideGraph')}
                    className={`px-2 py-1 rounded-none border text-[10px] font-medium transition-colors ${
                      row1Split === 65 && !isStacked
                        ? 'bg-brand-600 text-white font-bold border-brand-500'
                        : 'bg-slate-100 dark:bg-dark-850 hover:bg-slate-200 dark:hover:bg-dark-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10'
                    }`}
                    title="Wide Graph: 65% Graph + 35% SQL Terminal"
                  >
                    Focus Graph (65/35)
                  </button>
                  <button
                    onClick={() => applyPreset('wideSql')}
                    className={`px-2 py-1 rounded-none border text-[10px] font-medium transition-colors ${
                      row1Split === 35 && !isStacked
                        ? 'bg-brand-600 text-white font-bold border-brand-500'
                        : 'bg-slate-100 dark:bg-dark-850 hover:bg-slate-200 dark:hover:bg-dark-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10'
                    }`}
                    title="Focus SQL: 35% Graph + 65% SQL Terminal"
                  >
                    Focus SQL (35/65)
                  </button>
                  <button
                    onClick={() => applyPreset('stacked')}
                    className={`px-2 py-1 rounded-none border text-[10px] font-medium transition-colors ${
                      isStacked
                        ? 'bg-brand-600 text-white font-bold border-brand-500'
                        : 'bg-slate-100 dark:bg-dark-850 hover:bg-slate-200 dark:hover:bg-dark-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10'
                    }`}
                    title="Stacked: 100% full width for each window"
                  >
                    Full Stacked
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[10px] text-slate-400 hidden md:inline">
                  Drag splitters or bottom window edges to resize • Sibling windows auto-balance to 100%
                </span>

                <button
                  onClick={resetLayout}
                  className="px-2 py-1 rounded-none bg-slate-100 dark:bg-dark-850 hover:bg-slate-200 dark:hover:bg-dark-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 text-[10px] flex items-center gap-1 transition-colors"
                  title="Reset to default 50/50 arrangement"
                >
                  <RotateCcw className="w-3 h-3 text-slate-400" />
                  <span>Reset 50/50</span>
                </button>
              </div>
            </div>

            {/* Modular Dynamic Auto-Adjusting Workspace Grid */}
            <div ref={workspaceGridRef} className="flex flex-col gap-2 sm:gap-3 w-full min-w-0">
              {/* Row 1: Default Graph & SQL Terminal */}
              <div
                ref={row1Ref}
                className={`w-full flex ${isStacked ? 'flex-col gap-4' : 'flex-col lg:flex-row'} items-stretch min-w-0`}
              >
                {renderWindowContent(slots[0], isStacked ? 100 : row1Split)}
                {!isStacked && (
                  <SplitGutter
                    direction="horizontal"
                    currentPct={row1Split}
                    onSplitChange={handleRow1SplitChange}
                    containerRef={row1Ref}
                  />
                )}
                {renderWindowContent(slots[1], isStacked ? 100 : 100 - row1Split)}
              </div>

              {/* Horizontal Split Gutter between Row 1 & Row 2 for Downward/Upward Resizing */}
              {!isStacked && (
                <SplitGutter
                  direction="vertical"
                  currentPct={verticalSplit}
                  onSplitChange={handleVerticalSplitChange}
                  containerRef={workspaceGridRef}
                />
              )}

              {/* Row 2: Default KPI Stats & Data Grid */}
              <div
                ref={row2Ref}
                className={`w-full flex ${isStacked ? 'flex-col gap-4' : 'flex-col lg:flex-row'} items-stretch min-w-0`}
              >
                {renderWindowContent(slots[2], isStacked ? 100 : row2Split)}
                {!isStacked && (
                  <SplitGutter
                    direction="horizontal"
                    currentPct={row2Split}
                    onSplitChange={handleRow2SplitChange}
                    containerRef={row2Ref}
                  />
                )}
                {renderWindowContent(slots[3], isStacked ? 100 : 100 - row2Split)}
              </div>
            </div>
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
                    <Database className="w-3.5 h-3.5" />
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

      {/* AI Agent Connection & Provider Modal */}
      <AgentConnectModal
        isOpen={isAgentModalOpen}
        onClose={() => setIsAgentModalOpen(false)}
        activeDataset={activeDataset}
      />

      {/* Zero-Server Shareable Link Modal */}
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        activeDataset={activeDataset}
        currentSql={currentSql}
        chartConfig={chartConfig}
        activeFilter={activeFilter}
      />

      {/* 1-Click Executive PDF Slide Export Modal */}
      <ExportBriefingModal
        isOpen={isExportSlideOpen}
        onClose={() => setIsExportSlideOpen(false)}
        tableName={activeDataset}
        chartConfig={chartConfig}
        currentSql={currentSql}
        metrics={auraEngine.computeLiveMetrics(activeDataset)}
      />
    </div>
  );
};
