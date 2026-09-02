export type DatasetId = string;

export interface ColumnDefinition {
  name: string;
  type: 'VARCHAR' | 'INTEGER' | 'DOUBLE' | 'TIMESTAMP' | 'BOOLEAN';
  description: string;
}

export interface DatasetMetadata {
  id?: string;
  name: string;
  tableName: string;
  category: string;
  description: string;
  rowCount: number;
  columns: ColumnDefinition[];
  sampleQueries: { title: string; sql: string }[];
}

export interface QueryResult {
  sql: string;
  columns: string[];
  rows: Record<string, any>[];
  rowCount: number;
  executionTimeMs: number;
  timestamp: Date;
  error?: string;
}

export type ChartType = 'bar' | 'line' | 'area' | 'donut' | 'scatter';

export interface ChartConfig {
  type: ChartType;
  title: string;
  xAxis: string;
  yAxis: string;
  categoryKey?: string;
  colorTheme?: 'purple' | 'cyan' | 'emerald' | 'gradient';
  description?: string;
}

export interface WebMcpToolEvent {
  id: string;
  timestamp: Date;
  toolName: string;
  args: Record<string, any>;
  resultSummary: string;
  durationMs: number;
  status: 'success' | 'error';
}

export interface WebMcpToolRegistration {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
  execute: (input: any) => Promise<{
    content: Array<{ type: 'text' | 'image' | 'resource'; text?: string; data?: string; mimeType?: string }>;
    isError?: boolean;
  }>;
}
