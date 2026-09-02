import { WebMcpToolEvent, WebMcpToolRegistration, ChartConfig, QueryResult } from '../types';
import { auraEngine } from './auraql';
import { DATASETS_METADATA } from './datasets';

type WebMcpEventListener = (event: WebMcpToolEvent) => void;
type StateUpdateListener = (update: {
  type: 'query' | 'chart' | 'filter' | 'dataset';
  data: any;
}) => void;

class WebMcpManager {
  private abortController: AbortController = new AbortController();
  private eventListeners: Set<WebMcpEventListener> = new Set();
  private stateListeners: Set<StateUpdateListener> = new Set();
  private eventHistory: WebMcpToolEvent[] = [];
  public isNativeSupported: boolean = false;
  private registeredTools: WebMcpToolRegistration[] = [];

  constructor() {
    this.detectCapabilities();
  }

  private detectCapabilities() {
    if (typeof window !== 'undefined') {
      this.isNativeSupported =
        'modelContext' in document ||
        'modelContext' in navigator ||
        'modelContext' in window;
    }
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
  }

  private emitStateUpdate(type: 'query' | 'chart' | 'filter' | 'dataset', data: any) {
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
    this.abortController.abort();
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

          if (input?.tableName && DATASETS_METADATA[input.tableName]) {
            const d = DATASETS_METADATA[input.tableName];
            tables = [
              {
                table: d.tableName,
                rowCount: d.rowCount,
                columns: d.columns.map((c) => `${c.name} (${c.type})`)
              }
            ];
          } else {
            tables = Object.values(DATASETS_METADATA).map((d) => ({
              table: d.tableName,
              rowCount: d.rowCount,
              columns: d.columns.map((c) => `${c.name} (${c.type})`)
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
                    rows: result.rows.slice(0, 50)
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
      }
    ];

    this.registeredTools = tools;

    // ─── Real WebMCP Standard Protocol Binding ───
    const self = this;
    const modelContextHost = {
      registerTool: (tool: any) => {
        self.registeredTools.push(tool);
      },
      listTools: () => self.registeredTools,
      callTool: (name: string, args: Record<string, any>) => self.callTool(name, args),
      executeTool: (name: string, args: Record<string, any>) => self.callTool(name, args),
      get tools() {
        return self.registeredTools;
      }
    };

    if (typeof window !== 'undefined') {
      (window as any).modelContext = modelContextHost;
      (window as any).auraMcp = self;

      if (typeof document !== 'undefined') {
        const doc = document as any;
        if (!doc.modelContext) {
          doc.modelContext = modelContextHost;
        } else if (typeof doc.modelContext.registerTool === 'function') {
          // Native browser agent has already injected document.modelContext
          try {
            for (const tool of tools) {
              doc.modelContext.registerTool(
                {
                  name: tool.name,
                  description: tool.description,
                  inputSchema: tool.inputSchema,
                  execute: tool.execute
                },
                { signal: this.abortController.signal }
              );
            }
            this.isNativeSupported = true;
            console.log('⚡ [WebMCP] Native document.modelContext detected & registered');
          } catch (e) {
            console.warn('[WebMCP] Native registration:', e);
          }
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
