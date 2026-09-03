import { webMcp } from './webmcp';
import { auraEngine } from './auraql';
import { DATASETS_METADATA } from './datasets';
import { ChartType } from '../types';

export type AgentProvider = 'smart' | 'openai' | 'anthropic' | 'gemini' | 'ollama' | 'custom';

export interface AgentConfig {
  provider: AgentProvider;
  apiKey: string;
  model: string;
  baseUrl?: string;
  customHeaders?: Record<string, string>;
}

export interface AgentStep {
  id: string;
  type: 'thinking' | 'tool_call' | 'tool_result' | 'complete' | 'error';
  message: string;
  toolName?: string;
  args?: any;
  resultSummary?: string;
}

export interface AgentRunResult {
  success: boolean;
  finalMessage: string;
  steps: AgentStep[];
  toolsExecuted: string[];
}

const STORAGE_KEY = 'aura_agent_config';

const DEFAULT_CONFIGS: Record<AgentProvider, { model: string; baseUrl?: string }> = {
  smart: { model: 'auraql-native-v1' },
  openai: { model: 'gpt-4o', baseUrl: 'https://api.openai.com/v1' },
  anthropic: { model: 'claude-3-7-sonnet-20250219', baseUrl: 'https://api.anthropic.com/v1' },
  gemini: { model: 'gemini-2.0-flash', baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai' },
  ollama: { model: 'llama3.3', baseUrl: 'http://localhost:11434/v1' },
  custom: { model: 'custom-model', baseUrl: 'http://localhost:8000/v1' }
};

export class AuraAgentService {
  private config: AgentConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  public getConfig(): AgentConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<AgentConfig>) {
    this.config = { ...this.config, ...newConfig };
    this.saveConfig();
  }

  private loadConfig(): AgentConfig {
    const metaEnv = (typeof import.meta !== 'undefined' && (import.meta as any).env) || {};
    const envOpenAiKey = metaEnv.VITE_OPENAI_API_KEY || '';
    const envAnthropicKey = metaEnv.VITE_ANTHROPIC_API_KEY || '';
    const envGeminiKey = metaEnv.VITE_GEMINI_API_KEY || '';
    const envExplicitProvider = metaEnv.VITE_AI_PROVIDER as AgentProvider | undefined;
    const envModel = metaEnv.VITE_AI_MODEL || '';

    // Determine default provider from available keys or explicit config
    let defaultProvider: AgentProvider = 'openai';
    let defaultKey = envOpenAiKey;

    if (envExplicitProvider && DEFAULT_CONFIGS[envExplicitProvider]) {
      defaultProvider = envExplicitProvider;
      defaultKey =
        envExplicitProvider === 'anthropic'
          ? envAnthropicKey
          : envExplicitProvider === 'gemini'
          ? envGeminiKey
          : envOpenAiKey;
    } else if (envAnthropicKey && !envOpenAiKey) {
      defaultProvider = 'anthropic';
      defaultKey = envAnthropicKey;
    } else if (envGeminiKey && !envOpenAiKey) {
      defaultProvider = 'gemini';
      defaultKey = envGeminiKey;
    }

    const defaultModel = envModel || DEFAULT_CONFIGS[defaultProvider].model;

    if (typeof window === 'undefined') {
      return { provider: defaultProvider, apiKey: defaultKey, model: defaultModel };
    }

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.apiKey && defaultKey) {
          parsed.apiKey = defaultKey;
        }
        return parsed;
      }
    } catch (e) {
      console.warn('[AgentService] Could not read stored config', e);
    }

    return {
      provider: defaultProvider,
      apiKey: defaultKey,
      model: defaultModel
    };
  }

  private saveConfig() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
    } catch (e) {
      console.warn('[AgentService] Could not save config', e);
    }
  }

  /**
   * Main entry point: runs an autonomous agent workflow to fulfill the user's prompt.
   */
  public async run(
    promptText: string,
    activeDataset: string,
    onStep?: (step: AgentStep) => void
  ): Promise<AgentRunResult> {
    const steps: AgentStep[] = [];
    const toolsExecuted: string[] = [];

    const emitStep = (type: AgentStep['type'], message: string, extra: Partial<AgentStep> = {}) => {
      const step: AgentStep = {
        id: `step-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        type,
        message,
        ...extra
      };
      steps.push(step);
      onStep?.(step);
    };

    emitStep('thinking', `Analyzing prompt: "${promptText}" on dataset [${activeDataset || 'default'}]...`);

    const provider = this.config.provider || 'openai';

    try {
      if (provider === 'openai') {
        if (!this.config.apiKey) {
          const errMsg = 'Real ChatGPT execution requires an OpenAI API key. Click "Connect Agent" to enter your key, or use Desktop ChatGPT (Codex) connected via the WebMCP Bridge.';
          emitStep('error', errMsg);
          return {
            success: false,
            finalMessage: errMsg,
            steps,
            toolsExecuted
          };
        }
        return await this.runOpenAiCompatibleAgent(promptText, activeDataset, emitStep, toolsExecuted, steps);
      }

      if (provider === 'ollama' || provider === 'gemini' || provider === 'custom') {
        return await this.runOpenAiCompatibleAgent(promptText, activeDataset, emitStep, toolsExecuted, steps);
      }

      if (provider === 'anthropic') {
        if (!this.config.apiKey) {
          const errMsg = 'Anthropic Claude API key required. Click "Connect Agent" in the header to enter your API key.';
          emitStep('error', errMsg);
          return { success: false, finalMessage: errMsg, steps, toolsExecuted };
        }
        return await this.runAnthropicAgent(promptText, activeDataset, emitStep, toolsExecuted, steps);
      }

      return await this.runOpenAiCompatibleAgent(promptText, activeDataset, emitStep, toolsExecuted, steps);
    } catch (err: any) {
      emitStep('error', `Agent execution failed: ${err.message || 'Unknown error'}`);
      return {
        success: false,
        finalMessage: `Encountered an error: ${err.message || 'Unknown error'}.`,
        steps,
        toolsExecuted
      };
    }
  }

  /**
   * Smart Built-In Agent:
   * 100% offline, privacy-first, zero API key required.
   * Reasons over the dataset schema and emits exact SQL + chart WebMCP calls.
   */
  private async runSmartOfflineAgent(
    promptText: string,
    activeDataset: string,
    emitStep: (type: AgentStep['type'], message: string, extra?: Partial<AgentStep>) => void,
    toolsExecuted: string[],
    steps: AgentStep[]
  ): Promise<AgentRunResult> {
    emitStep('thinking', 'Using Smart Built-in Agent: Reading table schema and columns...');

    const tableName = (activeDataset || auraEngine.getTableNames()[0] || 'ecommerce_sales').toLowerCase();
    const schemaRes = await webMcp.callTool('list_tables_and_schema', { tableName });
    toolsExecuted.push('list_tables_and_schema');

    emitStep('tool_call', 'Inspected schema via list_tables_and_schema', {
      toolName: 'list_tables_and_schema',
      args: { tableName },
      resultSummary: `Discovered schema for table "${tableName}"`
    });

    const rows = auraEngine.getTableData(tableName);
    if (!rows || rows.length === 0) {
      const msg = `No data found in table "${tableName}". Please upload or select a dataset.`;
      emitStep('error', msg);
      return { success: false, finalMessage: msg, steps, toolsExecuted };
    }

    const firstRow = rows[0];
    const numericCols = Object.keys(firstRow).filter((k) => typeof firstRow[k] === 'number');
    const stringCols = Object.keys(firstRow).filter(
      (k) => typeof firstRow[k] === 'string' && !k.toLowerCase().includes('id')
    );

    const primaryMetric = numericCols[0] || 'revenue';
    const primaryDim = stringCols[0] || 'product_category';
    const secondaryMetric = numericCols[1] || primaryMetric;
    const lower = promptText.toLowerCase();

    // Natural query intent classification
    let targetSql = '';
    let chartType: ChartType = 'bar';
    let chartTitle = '';
    let xAxisCol = primaryDim;
    let yAxisCol = primaryMetric;
    let filterToApply: { column: string; value: string } | null = null;

    if (lower.includes('filter') || lower.includes('only') || lower.includes('where')) {
      // Extract filter candidate
      for (const strCol of stringCols) {
        const distinctVals = auraEngine.getDistinctValues(tableName, strCol, 10);
        for (const val of distinctVals) {
          if (lower.includes(val.toLowerCase())) {
            filterToApply = { column: strCol, value: val };
            break;
          }
        }
        if (filterToApply) break;
      }
    }

    if (lower.includes('area') || lower.includes('trend') || lower.includes('distribution')) {
      chartType = 'area';
      targetSql = `SELECT ${primaryDim}, ROUND(SUM(${primaryMetric}), 2) as total_${primaryMetric} FROM ${tableName} GROUP BY ${primaryDim} ORDER BY total_${primaryMetric} DESC LIMIT 10;`;
      chartTitle = `${primaryMetric} Trend by ${primaryDim}`;
      yAxisCol = `total_${primaryMetric}`;
    } else if (lower.includes('donut') || lower.includes('pie') || lower.includes('share') || lower.includes('breakdown')) {
      chartType = 'donut';
      targetSql = `SELECT ${primaryDim}, ROUND(SUM(${primaryMetric}), 2) as total_${primaryMetric} FROM ${tableName} GROUP BY ${primaryDim} ORDER BY total_${primaryMetric} DESC LIMIT 7;`;
      chartTitle = `Market Share of ${primaryMetric} by ${primaryDim}`;
      yAxisCol = `total_${primaryMetric}`;
    } else if (lower.includes('line') || lower.includes('average') || lower.includes('avg')) {
      chartType = 'line';
      targetSql = `SELECT ${primaryDim}, ROUND(AVG(${secondaryMetric}), 2) as avg_${secondaryMetric} FROM ${tableName} GROUP BY ${primaryDim} LIMIT 12;`;
      chartTitle = `Average ${secondaryMetric} across ${primaryDim}`;
      yAxisCol = `avg_${secondaryMetric}`;
    } else if (lower.includes('top') || lower.includes('best') || lower.includes('rank') || lower.includes('loss') || lower.includes('highest')) {
      chartType = 'bar';
      const orderDir = lower.includes('loss') || lower.includes('lowest') || lower.includes('bottom') ? 'ASC' : 'DESC';
      targetSql = `SELECT ${primaryDim}, ROUND(SUM(${primaryMetric}), 2) as total_${primaryMetric} FROM ${tableName} GROUP BY ${primaryDim} ORDER BY total_${primaryMetric} ${orderDir} LIMIT 8;`;
      chartTitle = `${orderDir === 'DESC' ? 'Top' : 'Bottom'} ${primaryDim} by ${primaryMetric}`;
      yAxisCol = `total_${primaryMetric}`;
    } else {
      chartType = 'bar';
      targetSql = `SELECT ${primaryDim}, ROUND(SUM(${primaryMetric}), 2) as total_${primaryMetric} FROM ${tableName} GROUP BY ${primaryDim} ORDER BY total_${primaryMetric} DESC LIMIT 10;`;
      chartTitle = `${primaryMetric} aggregated by ${primaryDim}`;
      yAxisCol = `total_${primaryMetric}`;
    }

    // Step 2: Execute SQL Query via WebMCP
    emitStep('tool_call', `Executing SQL Query: ${targetSql}`, {
      toolName: 'execute_sql_query',
      args: { sql: targetSql }
    });
    const queryRes = await webMcp.callTool('execute_sql_query', { sql: targetSql });
    toolsExecuted.push('execute_sql_query');

    emitStep('tool_result', `Evaluated query in AuraQL columnar memory`, {
      resultSummary: `Calculated metrics for ${primaryDim}`
    });

    // Step 3: Render Interactive Chart via WebMCP
    emitStep('tool_call', `Rendering ${chartType} visualization: "${chartTitle}"`, {
      toolName: 'render_interactive_chart',
      args: {
        type: chartType,
        title: chartTitle,
        xAxis: xAxisCol,
        yAxis: yAxisCol,
        colorTheme: 'purple'
      }
    });

    await webMcp.callTool('render_interactive_chart', {
      type: chartType,
      title: chartTitle,
      xAxis: xAxisCol,
      yAxis: yAxisCol,
      colorTheme: 'purple'
    });
    toolsExecuted.push('render_interactive_chart');

    // Step 4: If filter requested, apply filter
    if (filterToApply) {
      emitStep('tool_call', `Applying cohort filter: ${filterToApply.column} = "${filterToApply.value}"`, {
        toolName: 'apply_dashboard_filter',
        args: filterToApply
      });
      await webMcp.callTool('apply_dashboard_filter', {
        column: filterToApply.column,
        operator: '=',
        value: filterToApply.value
      });
      toolsExecuted.push('apply_dashboard_filter');
    }

    const finalMsg = `Executed analytical SQL query against table "${tableName}", synthesized ${chartType.toUpperCase()} chart "${chartTitle}", and updated the live dashboard viewport.`;
    emitStep('complete', finalMsg);

    return {
      success: true,
      finalMessage: finalMsg,
      steps,
      toolsExecuted
    };
  }

  /**
   * OpenAI / Ollama / Gemini Compatible Function Calling Loop
   */
  private async runOpenAiCompatibleAgent(
    promptText: string,
    activeDataset: string,
    emitStep: (type: AgentStep['type'], message: string, extra?: Partial<AgentStep>) => void,
    toolsExecuted: string[],
    steps: AgentStep[]
  ): Promise<AgentRunResult> {
    const provider = this.config.provider;
    const baseUrl = (this.config.baseUrl || DEFAULT_CONFIGS[provider].baseUrl || 'https://api.openai.com/v1').replace(/\/$/, '');
    const model = this.config.model || DEFAULT_CONFIGS[provider].model;

    const availableTools = webMcp.getRegisteredTools().map((t) => ({
      type: 'function',
      function: {
        name: t.name,
        description: t.description,
        parameters: t.inputSchema
      }
    }));

    const systemPrompt = `You are the Aura Analytics AI Co-Pilot, an expert business intelligence and data analyst agent.
You have native WebMCP tools connected to an in-memory client-side columnar database (AuraQL).
Active Dataset: "${activeDataset || 'default'}".

Available tools:
- list_tables_and_schema: Inspect tables and columns.
- execute_sql_query: Run SQL aggregation (SELECT, GROUP BY, ORDER BY, SUM, AVG, COUNT, ROUND, LIMIT).
- render_interactive_chart: Render live visualizations (bar, line, area, donut, scatter).
- apply_dashboard_filter: Filter dashboard by a column and value.

Workflow:
1. If you need schema details, call list_tables_and_schema.
2. Formulate an analytical SQL query and call execute_sql_query.
3. Call render_interactive_chart to visually present the results to the user.
4. Synthesize an insightful, concise business analysis summarizing key numbers, outliers, or takeaways.`;

    const messages: any[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: promptText }
    ];

    emitStep('thinking', `Sending goal to ${provider.toUpperCase()} (${model})...`);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    let iterations = 0;
    const maxIterations = 5;

    while (iterations < maxIterations) {
      iterations++;

      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model,
          messages,
          tools: availableTools,
          tool_choice: 'auto',
          temperature: 0.2
        })
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`${provider.toUpperCase()} API Error (${res.status}): ${errText}`);
      }

      const json = await res.json();
      const choice = json.choices?.[0];
      if (!choice) throw new Error('No completion returned from provider.');

      const responseMessage = choice.message;
      messages.push(responseMessage);

      // Check for tool calls
      if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
        for (const call of responseMessage.tool_calls) {
          const fnName = call.function.name;
          let fnArgs = {};
          try {
            fnArgs = JSON.parse(call.function.arguments || '{}');
          } catch {
            fnArgs = {};
          }

          emitStep('tool_call', `Agent invoking WebMCP tool: ${fnName}`, {
            toolName: fnName,
            args: fnArgs
          });

          const toolRes = await webMcp.callTool(fnName, fnArgs);
          toolsExecuted.push(fnName);

          const resultText = toolRes?.content?.[0]?.text || JSON.stringify(toolRes);
          emitStep('tool_result', `WebMCP Tool [${fnName}] responded`, {
            toolName: fnName,
            resultSummary: resultText.substring(0, 120) + (resultText.length > 120 ? '...' : '')
          });

          messages.push({
            role: 'tool',
            tool_call_id: call.id,
            name: fnName,
            content: resultText
          });
        }
      } else {
        // Final assistant response reached
        const finalContent = responseMessage.content || 'Analysis complete.';
        emitStep('complete', finalContent);
        return {
          success: true,
          finalMessage: finalContent,
          steps,
          toolsExecuted
        };
      }
    }

    return {
      success: true,
      finalMessage: 'Agent finished multi-turn tool execution loop.',
      steps,
      toolsExecuted
    };
  }

  /**
   * Anthropic Claude Tool Calling Loop
   */
  private async runAnthropicAgent(
    promptText: string,
    activeDataset: string,
    emitStep: (type: AgentStep['type'], message: string, extra?: Partial<AgentStep>) => void,
    toolsExecuted: string[],
    steps: AgentStep[]
  ): Promise<AgentRunResult> {
    const baseUrl = (this.config.baseUrl || DEFAULT_CONFIGS.anthropic.baseUrl || 'https://api.anthropic.com/v1').replace(/\/$/, '');
    const model = this.config.model || DEFAULT_CONFIGS.anthropic.model;

    const availableTools = webMcp.getRegisteredTools().map((t) => ({
      name: t.name,
      description: t.description,
      input_schema: t.inputSchema
    }));

    const systemPrompt = `You are Aura Analytics Co-Pilot. You have access to WebMCP tools to inspect data, run SQL on client memory, and command live charts. Active dataset: "${activeDataset || 'default'}".`;

    const messages: any[] = [{ role: 'user', content: promptText }];

    emitStep('thinking', `Connecting to Anthropic Claude (${model})...`);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-api-key': this.config.apiKey,
      'anthropic-version': '2023-06-01',
      'dangerously-allow-browser': 'true'
    };

    let iterations = 0;
    while (iterations < 5) {
      iterations++;

      const res = await fetch(`${baseUrl}/messages`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model,
          max_tokens: 2048,
          system: systemPrompt,
          messages,
          tools: availableTools
        })
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Anthropic API Error (${res.status}): ${errText}`);
      }

      const data = await res.json();
      const contentBlocks = data.content || [];
      messages.push({ role: 'assistant', content: contentBlocks });

      const toolUses = contentBlocks.filter((b: any) => b.type === 'tool_use');

      if (toolUses.length === 0) {
        const textBlock = contentBlocks.find((b: any) => b.type === 'text');
        const finalMsg = textBlock?.text || 'Analysis complete.';
        emitStep('complete', finalMsg);
        return { success: true, finalMessage: finalMsg, steps, toolsExecuted };
      }

      const toolResults = [];
      for (const tu of toolUses) {
        emitStep('tool_call', `Claude invoking: ${tu.name}`, {
          toolName: tu.name,
          args: tu.input
        });

        const mcpRes = await webMcp.callTool(tu.name, tu.input || {});
        toolsExecuted.push(tu.name);

        const resText = mcpRes?.content?.[0]?.text || JSON.stringify(mcpRes);
        toolResults.push({
          type: 'tool_result',
          tool_use_id: tu.id,
          content: resText
        });
      }

      messages.push({ role: 'user', content: toolResults });
    }

    return { success: true, finalMessage: 'Completed tool loop.', steps, toolsExecuted };
  }
}

export const auraAgent = new AuraAgentService();
