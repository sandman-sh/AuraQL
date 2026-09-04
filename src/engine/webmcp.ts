import { WebMcpToolEvent, WebMcpToolRegistration, ChartConfig, QueryResult } from '../types';
import { auraEngine } from './auraql';
import { DATASETS_METADATA } from './datasets';

type WebMcpEventListener = (event: WebMcpToolEvent) => void;
type StateUpdateListener = (update: {
  type: 'query' | 'chart' | 'filter' | 'dataset' | 'scenario' | 'anomalies';
  data: any;
}) => void;

class WebMcpManager {
  private abortController: AbortController = new AbortController();
  private eventListeners: Set<WebMcpEventListener> = new Set();
  private stateListeners: Set<StateUpdateListener> = new Set();
  private bridgeListeners: Set<(connected: boolean) => void> = new Set();
  private eventHistory: WebMcpToolEvent[] = [];
  public isNativeSupported: boolean = false;
  public isBridgeConnected: boolean = false;
  private bridgeEventSource: EventSource | null = null;
  private registeredTools: WebMcpToolRegistration[] = [];

  constructor() {
    this.detectCapabilities();
    this.setupPostMessageBridge();
    this.connectBridgeServer();
  }

  private detectCapabilities() {
    try {
      if (typeof window !== 'undefined') {
        this.isNativeSupported =
          'modelContext' in document ||
          'modelContext' in navigator ||
          'modelContext' in window;
      }
    } catch {
      this.isNativeSupported = false;
    }
  }

  public subscribeBridgeStatus(listener: (connected: boolean) => void): () => void {
    this.bridgeListeners.add(listener);
    listener(this.isBridgeConnected);
    return () => this.bridgeListeners.delete(listener);
  }

  private notifyBridgeStateChange() {
    this.bridgeListeners.forEach((fn) => {
      try {
        fn(this.isBridgeConnected);
      } catch {}
    });
  }

  public connectBridgeServer(bridgeUrl: string = ((import.meta as any).env?.VITE_BRIDGE_URL as string) || 'http://localhost:3001') {
    if (typeof window === 'undefined') return;
    if (this.bridgeEventSource) {
      try {
        this.bridgeEventSource.close();
      } catch {}
      this.bridgeEventSource = null;
    }

    try {
      const sse = new EventSource(`${bridgeUrl}/api/bridge/events`);
      this.bridgeEventSource = sse;

      sse.onopen = () => {
        this.isBridgeConnected = true;
        this.notifyBridgeStateChange();
        console.log('[WebMCP] Connected to external Agent Bridge on', bridgeUrl);
      };

      sse.onmessage = async (e) => {
        try {
          const payload = JSON.parse(e.data);
          if (payload.type === 'CALL_TOOL') {
            const { id, name, args } = payload;
            const result = await this.callTool(name, args || {});
            await fetch(`${bridgeUrl}/api/bridge/result`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id, result })
            }).catch(() => {});
          }
        } catch (err) {
          console.error('[WebMCP] Bridge message processing error:', err);
        }
      };

      sse.onerror = () => {
        if (this.isBridgeConnected) {
          this.isBridgeConnected = false;
          this.notifyBridgeStateChange();
        }
      };
    } catch {
      this.isBridgeConnected = false;
      this.notifyBridgeStateChange();
    }
  }

  private setupPostMessageBridge() {
    if (typeof window === 'undefined') return;
    if ((window as any).__webmcp_postmessage_ready) return;
    (window as any).__webmcp_postmessage_ready = true;

    window.addEventListener('message', async (event) => {
      if (event.data && event.data.type === 'WEBMCP_CALL') {
        const { id, tool, args } = event.data;
        const result = await this.callTool(tool, args || {});
        try {
          event.source?.postMessage(
            { type: 'WEBMCP_RESULT', id, result },
            { targetOrigin: '*' } as any
          );
        } catch {
          window.postMessage({ type: 'WEBMCP_RESULT', id, result }, '*');
        }
      }
    });

    window.addEventListener('webmcp:call', async (event: any) => {
      if (event.detail) {
        const { name, args, callback } = event.detail;
        const result = await this.callTool(name, args || {});
        if (typeof callback === 'function') {
          callback(result);
        }
      }
    });
  }

  public subscribeEvents(listener: WebMcpEventListener): () => void {
    this.eventListeners.add(listener);
    return () => this.eventListeners.delete(listener);
  }

  public subscribeStateUpdates(listener: StateUpdateListener): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  public getEventHistory(): WebMcpToolEvent[] {
    return [...this.eventHistory];
  }

  public getRegisteredTools(): WebMcpToolRegistration[] {
    return [...this.registeredTools];
  }

  public clearTelemetry() {
    this.eventHistory = [];
  }

  private recordEvent(event: Omit<WebMcpToolEvent, 'id' | 'timestamp'>) {
    const fullEvent: WebMcpToolEvent = {
      ...event,
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date()
    };
    this.eventHistory.unshift(fullEvent);
    if (this.eventHistory.length > 100) this.eventHistory.pop();

    this.eventListeners.forEach((fn) => {
      try {
        fn(fullEvent);
      } catch (e) {
        console.error('[WebMCP] Event listener error:', e);
      }
    });

    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('webmcp:event', { detail: fullEvent }));
      } catch {}
    }
  }

  private emitStateUpdate(type: 'query' | 'chart' | 'filter' | 'dataset' | 'scenario' | 'anomalies', data: any) {
    this.stateListeners.forEach((fn) => {
      try {
        fn({ type, data });
      } catch (e) {
        console.error('[WebMCP] State listener error:', e);
      }
    });
  }

  /**
   * Registers all standard WebMCP tools.
   * Exposes them to window.modelContext & document.modelContext according to the WebMCP protocol.
   */
  public registerAllTools() {
    try {
      this.abortController.abort();
    } catch {
      // Ignore abort errors
    }
    this.abortController = new AbortController();

    const tools: WebMcpToolRegistration[] = [
      // Tool 1: List all available tables and schemas in AuraQL
      {
        name: 'list_tables_and_schema',
        description:
          'Returns all active tables, column names, data types, and row counts in the in-memory AuraQL engine.',
        inputSchema: {
          type: 'object',
          properties: {
            tableName: {
              type: 'string',
              description: 'Optional: name of a specific table to inspect'
            }
          }
        },
        execute: async (input: { tableName?: string }) => {
          const startTime = performance.now();

          let tables: Array<{
            table: string;
            rowCount: number;
            columns: string[];
          }> = [];

          if (input?.tableName && DATASETS_METADATA[input.tableName.toLowerCase()]) {
            const d = DATASETS_METADATA[input.tableName.toLowerCase()];
            tables = [
              {
                table: d.tableName,
                rowCount: d.rowCount,
                columns: (d.columns || []).map((c) => `${c.name} (${c.type})`)
              }
            ];
          } else {
            tables = Object.values(DATASETS_METADATA).map((d) => ({
              table: d.tableName,
              rowCount: d.rowCount,
              columns: (d.columns || []).map((c) => `${c.name} (${c.type})`)
            }));
          }

          const duration = +(performance.now() - startTime).toFixed(1);
          this.recordEvent({
            toolName: 'list_tables_and_schema',
            args: input || {},
            resultSummary: `Schema returned for ${tables.length} table(s)`,
            durationMs: duration,
            status: 'success'
          });

          return {
            content: [{ type: 'text', text: JSON.stringify(tables, null, 2) }]
          };
        }
      },

      // Tool 2: Execute real analytical SQL query against AuraQL
      {
        name: 'execute_sql_query',
        description:
          'Executes an analytical SQL query against client in-memory AuraQL columnar tables. Supports SELECT, WHERE, GROUP BY, ORDER BY, LIMIT, and aggregate functions (SUM, AVG, COUNT, MIN, MAX, ROUND).',
        inputSchema: {
          type: 'object',
          properties: {
            sql: {
              type: 'string',
              description: 'SQL query to execute (e.g. SELECT category, SUM(revenue) FROM sales GROUP BY 1)'
            }
          },
          required: ['sql']
        },
        execute: async ({ sql }: { sql: string }) => {
          const startTime = performance.now();
          const result: QueryResult = await auraEngine.query(sql);
          const duration = Math.max(
            result.executionTimeMs,
            +(performance.now() - startTime).toFixed(1)
          );

          this.recordEvent({
            toolName: 'execute_sql_query',
            args: { sql },
            resultSummary: result.error
              ? `SQL Error: ${result.error}`
              : `Evaluated ${result.rowCount} live rows in ${duration}ms`,
            durationMs: duration,
            status: result.error ? 'error' : 'success'
          });

          this.emitStateUpdate('query', result);

          if (result.error) {
            return {
              isError: true,
              content: [{ type: 'text', text: `Query Execution Failed: ${result.error}` }]
            };
          }

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    rowCount: result.rowCount,
                    executionTimeMs: result.executionTimeMs,
                    columns: result.columns,
                    rows: (result.rows || []).slice(0, 50)
                  },
                  null,
                  2
                )
              }
            ]
          };
        }
      },

      // Tool 3: Render interactive visualization in browser viewport
      {
        name: 'render_interactive_chart',
        description:
          'Directly updates the live browser viewport to render or modify a chart (bar, line, area, donut, scatter) mapped to active query columns.',
        inputSchema: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['bar', 'line', 'area', 'donut', 'scatter'],
              description: 'Format of the visualization'
            },
            title: {
              type: 'string',
              description: 'Human-readable title displayed on the chart header'
            },
            xAxis: {
              type: 'string',
              description: 'Column name mapped to X-axis / category dimension'
            },
            yAxis: {
              type: 'string',
              description: 'Column name mapped to Y-axis / numeric metric'
            },
            colorTheme: {
              type: 'string',
              enum: ['purple', 'cyan', 'emerald', 'gradient'],
              description: 'Color styling for the rendered series'
            }
          },
          required: ['type', 'title', 'xAxis', 'yAxis']
        },
        execute: async (config: ChartConfig) => {
          const startTime = performance.now();
          this.emitStateUpdate('chart', config);
          const duration = +(performance.now() - startTime).toFixed(1);

          this.recordEvent({
            toolName: 'render_interactive_chart',
            args: config,
            resultSummary: `Rendered ${config.type.toUpperCase()}: "${config.title}" [X: ${config.xAxis}, Y: ${config.yAxis}]`,
            durationMs: duration,
            status: 'success'
          });

          return {
            content: [
              {
                type: 'text',
                text: `Chart Viewport updated: ${config.type} "${config.title}". Mapped [${config.xAxis}] to [${config.yAxis}].`
              }
            ]
          };
        }
      },

      // Tool 4: Apply dashboard filter slice
      {
        name: 'apply_dashboard_filter',
        description:
          'Applies a cohort or segment filter to the live dashboard view.',
        inputSchema: {
          type: 'object',
          properties: {
            column: {
              type: 'string',
              description: 'Table column to filter on'
            },
            operator: {
              type: 'string',
              enum: ['=', '!=', '>', '<', 'LIKE'],
              description: 'Comparison operator'
            },
            value: {
              type: 'string',
              description: 'Target value to isolate'
            }
          },
          required: ['column', 'value']
        },
        execute: async (filter: { column: string; operator?: string; value: string }) => {
          const startTime = performance.now();
          this.emitStateUpdate('filter', filter);
          const duration = +(performance.now() - startTime).toFixed(1);

          this.recordEvent({
            toolName: 'apply_dashboard_filter',
            args: filter,
            resultSummary: `Filter applied: ${filter.column} ${filter.operator || '='} "${filter.value}"`,
            durationMs: duration,
            status: 'success'
          });

          return {
            content: [
              {
                type: 'text',
                text: `Dashboard filter active: ${filter.column} ${filter.operator || '='} ${filter.value}.`
              }
            ]
          };
        }
      },

      // Tool 5: What-If Scenario Simulation
      {
        name: 'simulate_forecast_scenario',
        description:
          'Executes in-memory what-if scenario simulations against columnar tables by applying metric multipliers or additive deltas (e.g. simulate +15% revenue growth or -20% churn), returning baseline vs projected variance analysis.',
        inputSchema: {
          type: 'object',
          properties: {
            tableName: {
              type: 'string',
              description: 'Target table to simulate against'
            },
            description: {
              type: 'string',
              description: 'Scenario name or thesis'
            },
            adjustments: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  column: { type: 'string', description: 'Metric column name' },
                  multiplier: { type: 'number', description: 'Percentage factor (e.g. 1.15 for +15%, 0.80 for -20%)' },
                  addDelta: { type: 'number', description: 'Constant addition or subtraction' },
                  condition: { type: 'string', description: 'Optional row condition filter (e.g. churn_risk = "Critical")' }
                },
                required: ['column']
              },
              description: 'List of adjustment rules to apply'
            }
          },
          required: ['tableName', 'adjustments']
        },
        execute: async (input: { tableName: string; adjustments: any[]; description?: string }) => {
          const startTime = performance.now();
          const simResult = auraEngine.simulateScenario(input.tableName, input.adjustments, input.description);
          this.emitStateUpdate('scenario', simResult);
          const duration = +(performance.now() - startTime).toFixed(1);

          this.recordEvent({
            toolName: 'simulate_forecast_scenario',
            args: input,
            resultSummary: `Simulated scenario: ${input.description || 'Forecast'} (${simResult.impactedRows}/${simResult.totalRows} rows adjusted)`,
            durationMs: duration,
            status: 'success'
          });

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(simResult, null, 2)
              }
            ]
          };
        }
      },

      // Tool 6: Statistical Anomaly & Outlier Detection
      {
        name: 'detect_anomalies',
        description:
          'Analyzes numerical columns across in-memory AuraQL tables using statistical Z-scores and Interquartile Ranges (IQR) to detect spikes, severe drop-offs, and margin compression.',
        inputSchema: {
          type: 'object',
          properties: {
            tableName: {
              type: 'string',
              description: 'Table name to analyze'
            },
            column: {
              type: 'string',
              description: 'Optional specific column to inspect'
            }
          },
          required: ['tableName']
        },
        execute: async (input: { tableName: string; column?: string }) => {
          const startTime = performance.now();
          const report = auraEngine.detectAnomalies(input.tableName, input.column);
          this.emitStateUpdate('anomalies', report);
          const duration = +(performance.now() - startTime).toFixed(1);

          this.recordEvent({
            toolName: 'detect_anomalies',
            args: input,
            resultSummary: `Found ${report.anomaliesFound} anomalies in "${input.tableName}"`,
            durationMs: duration,
            status: 'success'
          });

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(report, null, 2)
              }
            ]
          };
        }
      }
    ];

    this.registeredTools = tools;

    // ─── Real WebMCP Standard Protocol Binding ───
    const self = this;
    const modelContextHost = {
      registerTool: (tool: any) => {
        if (!tool || !tool.name) return;
        const existingIdx = self.registeredTools.findIndex((t) => t.name === tool.name);
        if (existingIdx >= 0) {
          self.registeredTools[existingIdx] = tool;
        } else {
          self.registeredTools.push(tool);
        }
      },
      listTools: () => self.registeredTools,
      callTool: (name: string, args: Record<string, any>) => self.callTool(name, args),
      executeTool: (name: string, args: Record<string, any>) => self.callTool(name, args),
      get tools() {
        return self.registeredTools;
      }
    };

    if (typeof window !== 'undefined') {
      try {
        (window as any).modelContext = modelContextHost;
        (window as any).auraMcp = self;
      } catch (e) {
        console.warn('[WebMCP] window.modelContext assignment skipped:', e);
      }

      if (typeof document !== 'undefined') {
        try {
          const doc = document as any;
          if (!doc.modelContext) {
            try {
              doc.modelContext = modelContextHost;
            } catch {
              try {
                Object.defineProperty(document, 'modelContext', {
                  value: modelContextHost,
                  writable: true,
                  configurable: true
                });
              } catch (err) {
                console.warn('[WebMCP] document.modelContext defineProperty:', err);
              }
            }
          } else if (doc.modelContext !== modelContextHost && typeof doc.modelContext.registerTool === 'function') {
            // Only register with an external native browser agent context, not our own polyfill
            for (const tool of tools) {
              try {
                doc.modelContext.registerTool(
                  {
                    name: tool.name,
                    description: tool.description,
                    inputSchema: tool.inputSchema,
                    execute: tool.execute
                  },
                  { signal: this.abortController.signal }
                );
              } catch (regErr) {
                console.warn('[WebMCP] Tool registration with native agent:', regErr);
              }
            }
            this.isNativeSupported = true;
          }
        } catch (e) {
          console.warn('[WebMCP] document.modelContext setup:', e);
        }
      }
    }
  }

  /**
   * Real standard MCP Tool Execution method.
   * Callable by browser agents via `window.modelContext.callTool(name, args)`
   * or by internal devtools.
   */
  public async callTool(name: string, args: Record<string, any>) {
    const tool = this.registeredTools.find((t) => t.name === name);
    if (!tool) {
      const errorMsg = `WebMCP Error: Tool "${name}" is not registered. Available tools: ${this.registeredTools.map((t) => t.name).join(', ')}`;
      this.recordEvent({
        toolName: name,
        args: args || {},
        resultSummary: errorMsg,
        durationMs: 0.1,
        status: 'error'
      });
      return { isError: true, content: [{ type: 'text', text: errorMsg }] };
    }
    return await tool.execute(args);
  }
}

export const webMcp = new WebMcpManager();
