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
      this.isNativeSupported = 'modelContext' in document || 'modelContext' in navigator;
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

  private recordEvent(event: Omit<WebMcpToolEvent, 'id' | 'timestamp'>) {
    const fullEvent: WebMcpToolEvent = {
      ...event,
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date()
    };
    this.eventHistory.unshift(fullEvent);
    if (this.eventHistory.length > 50) this.eventHistory.pop();

    this.eventListeners.forEach(fn => {
      try {
        fn(fullEvent);
      } catch (e) {
        console.error('Error in WebMCP event listener:', e);
      }
    });
  }

  private emitStateUpdate(type: 'query' | 'chart' | 'filter' | 'dataset', data: any) {
    this.stateListeners.forEach(fn => {
      try {
        fn({ type, data });
      } catch (e) {
        console.error('Error in WebMCP state listener:', e);
      }
    });
  }

  public registerAllTools() {
    this.abortController.abort();
    this.abortController = new AbortController();

    const tools: WebMcpToolRegistration[] = [
      // Tool 1: List Datasets and Schema
      {
        name: 'list_tables_and_schema',
        description: 'Returns available dataset tables, column definitions, data types, and row counts in the active in-memory AuraQL engine.',
        inputSchema: {
          type: 'object',
          properties: {
            datasetId: {
              type: 'string',
              description: 'Optional filter for specific dataset (ecommerce, churn, webvitals)'
            }
          }
        },
        execute: async (input: { datasetId?: string }) => {
          const startTime = performance.now();
          const target = input?.datasetId && DATASETS_METADATA[input.datasetId] 
            ? { [input.datasetId]: DATASETS_METADATA[input.datasetId] }
            : DATASETS_METADATA;

          const summary = Object.values(target).map(d => ({
            table: d.tableName,
            category: d.category,
            rowCount: d.rowCount,
            columns: d.columns.map(c => `${c.name} (${c.type}): ${c.description}`)
          }));

          const duration = +(performance.now() - startTime).toFixed(1);
          this.recordEvent({
            toolName: 'list_tables_and_schema',
            args: input || {},
            resultSummary: `Returned schema for ${Object.keys(target).length} tables`,
            durationMs: duration,
            status: 'success'
          });

          return {
            content: [{ type: 'text', text: JSON.stringify(summary, null, 2) }]
          };
        }
      },

      // Tool 2: Execute SQL Query in AuraQL
      {
        name: 'execute_sql_query',
        description: 'Executes an analytical SQL query against the in-memory AuraQL database and returns structured records in milliseconds.',
        inputSchema: {
          type: 'object',
          properties: {
            sql: {
              type: 'string',
              description: 'Standard AuraQL SQL query (e.g., SELECT category, SUM(revenue) FROM ecommerce_sales GROUP BY 1)'
            }
          },
          required: ['sql']
        },
        execute: async ({ sql }: { sql: string }) => {
          const startTime = performance.now();
          const result: QueryResult = await auraEngine.query(sql);
          const duration = Math.max(result.executionTimeMs, +(performance.now() - startTime).toFixed(1));

          this.recordEvent({
            toolName: 'execute_sql_query',
            args: { sql },
            resultSummary: result.error ? `Error: ${result.error}` : `Returned ${result.rowCount} live rows in ${duration}ms`,
            durationMs: duration,
            status: result.error ? 'error' : 'success'
          });

          this.emitStateUpdate('query', result);

          if (result.error) {
            return {
              isError: true,
              content: [{ type: 'text', text: `SQL Evaluation Failed: ${result.error}` }]
            };
          }

          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                rowCount: result.rowCount,
                executionTimeMs: result.executionTimeMs,
                columns: result.columns,
                rows: result.rows.slice(0, 50)
              }, null, 2)
            }]
          };
        }
      },

      // Tool 3: Render Interactive Chart
      {
        name: 'render_interactive_chart',
        description: 'Directly commands the live browser viewport to render or update a visualization (bar, line, area, donut, or scatter).',
        inputSchema: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['bar', 'line', 'area', 'donut', 'scatter'],
              description: 'Visualization format'
            },
            title: {
              type: 'string',
              description: 'Visual heading for the chart'
            },
            xAxis: {
              type: 'string',
              description: 'Column to map to the X category axis'
            },
            yAxis: {
              type: 'string',
              description: 'Column to map to the Y metric axis'
            },
            colorTheme: {
              type: 'string',
              enum: ['purple', 'cyan', 'emerald', 'gradient'],
              description: 'Color styling'
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
            resultSummary: `Rendered ${config.type.toUpperCase()} chart: "${config.title}" [X: ${config.xAxis}, Y: ${config.yAxis}]`,
            durationMs: duration,
            status: 'success'
          });

          return {
            content: [{
              type: 'text',
              text: `Rendered ${config.type} chart: "${config.title}". Viewport updated live on screen.`
            }]
          };
        }
      },

      // Tool 4: Apply Dashboard Filter Slice
      {
        name: 'apply_dashboard_filter',
        description: 'Filters the active analytics view to isolate a specific cohort, region, or segment.',
        inputSchema: {
          type: 'object',
          properties: {
            column: { type: 'string', description: 'Column to filter on' },
            operator: { type: 'string', enum: ['=', '!=', '>', '<', 'LIKE'], description: 'Comparison operator' },
            value: { type: 'string', description: 'Filter target value' }
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
            resultSummary: `Applied filter: ${filter.column} ${filter.operator || '='} "${filter.value}"`,
            durationMs: duration,
            status: 'success'
          });

          return {
            content: [{
              type: 'text',
              text: `Dashboard filter set: ${filter.column} ${filter.operator || '='} ${filter.value}.`
            }]
          };
        }
      }
    ];

    // Attempt native registration if document.modelContext exists
    const doc = typeof document !== 'undefined' ? (document as any) : null;
    const modelContext = doc?.modelContext || (typeof navigator !== 'undefined' ? (navigator as any).modelContext : null);

    if (modelContext && typeof modelContext.registerTool === 'function') {
      try {
        for (const tool of tools) {
          modelContext.registerTool(
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
        console.log('⚡ [WebMCP] Successfully registered tools with document.modelContext');
      } catch (err) {
        console.warn('⚡ [WebMCP] Native tool registration:', err);
      }
    }

    this.registeredTools = tools;
  }

  /**
   * Executes a registered WebMCP tool by name with the given arguments.
   * This calls the exact same real tool function that document.modelContext would call —
   * it is NOT a simulation or mock. The tool runs through AuraQL, records real telemetry,
   * and emits real state updates to the dashboard.
   */
  public async executeTool(name: string, args: Record<string, any>) {
    const tool = this.registeredTools.find(t => t.name === name);
    if (!tool) throw new Error(`Tool ${name} not found`);
    return await tool.execute(args);
  }
}

export const webMcp = new WebMcpManager();
