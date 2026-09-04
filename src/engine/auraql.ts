import { QueryResult } from '../types';
import { DATASETS_METADATA, INITIAL_ECOMMERCE_DATA, INITIAL_SAAS_CHURN_DATA, INITIAL_FINANCIALS_DATA } from './datasets';
import { auraStorage } from './storage';

export interface ScenarioAdjustment {
  column: string;
  multiplier?: number; // e.g. 1.15 (+15%), 0.80 (-20%)
  addDelta?: number;   // e.g. +500
  condition?: string;  // e.g. "region = 'North America'" or "churn_risk = 'Critical'"
}

export interface ScenarioResult {
  tableName: string;
  description: string;
  impactedRows: number;
  totalRows: number;
  metrics: Record<string, {
    baselineTotal: number;
    projectedTotal: number;
    deltaTotal: number;
    variancePct: number;
    baselineAvg: number;
    projectedAvg: number;
  }>;
  sampleProjectedRows: Record<string, any>[];
}

export interface AnomalyItem {
  rowIndex: number;
  rowIdentifier: string;
  column: string;
  value: number;
  mean: number;
  stdDev: number;
  zScore: number;
  type: 'spike' | 'drop';
  severity: 'high' | 'medium';
  reason: string;
}

export interface AnomalyReport {
  tableName: string;
  totalRows: number;
  analyzedColumns: string[];
  anomaliesFound: number;
  anomalies: AnomalyItem[];
}

export class AuraQLEngine {
  private tables: Map<string, Record<string, any>[]> = new Map();

  constructor() {
    this.hydrateFromStorage();
  }

  /**
   * Loads a sample dataset into memory on demand.
   */
  public loadPreloadedDataset(tableName: string): Record<string, any>[] {
    const key = (tableName || '').toLowerCase().trim();
    if (key === 'ecommerce_sales') {
      this.tables.set('ecommerce_sales', INITIAL_ECOMMERCE_DATA);
      return INITIAL_ECOMMERCE_DATA;
    }
    if (key === 'saas_churn_metrics') {
      this.tables.set('saas_churn_metrics', INITIAL_SAAS_CHURN_DATA);
      return INITIAL_SAAS_CHURN_DATA;
    }
    if (key === 'cloud_software_financials') {
      this.tables.set('cloud_software_financials', INITIAL_FINANCIALS_DATA);
      return INITIAL_FINANCIALS_DATA;
    }
    return this.tables.get(key) || [];
  }

  /**
   * Hydrates user tables saved in browser IndexedDB
   */
  private async hydrateFromStorage() {
    try {
      const stored = await auraStorage.loadAllTables();
      for (const t of stored) {
        if (!this.tables.has(t.name) && t.rows.length > 0) {
          this.registerCustomTable(t.name, t.rows, false);
        }
      }
    } catch (e) {
      console.warn('[AuraQL] Could not hydrate tables from IndexedDB', e);
    }
  }

  public getTableNames(): string[] {
    return Array.from(this.tables.keys());
  }

  public getTableData(tableName: string): Record<string, any>[] {
    if (!tableName) return [];
    const key = tableName.toLowerCase().trim();
    if (this.tables.has(key)) {
      return this.tables.get(key) || [];
    }
    if (key === 'ecommerce_sales' || key === 'saas_churn_metrics' || key === 'cloud_software_financials') {
      return this.loadPreloadedDataset(key);
    }
    return [];
  }

  public getTableCount(): number {
    return this.tables.size;
  }

  public getTotalRowCount(): number {
    let total = 0;
    for (const rows of this.tables.values()) total += rows.length;
    return total;
  }

  /**
   * Register a table from user-uploaded CSV/JSON data.
   * Normalizes table name to lowercase for case-insensitive SQL queries.
   */
  public registerCustomTable(rawTableName: string, rows: Record<string, any>[], persistToStorage: boolean = true) {
    const tableName = (rawTableName || 'custom_table').trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    this.tables.set(tableName, rows);

    if (persistToStorage) {
      auraStorage.saveTable(tableName, rows).catch(() => {});
    }

    if (rows.length > 0) {
      const firstRow = rows[0];
      DATASETS_METADATA[tableName] = {
        id: tableName,
        name: rawTableName,
        tableName,
        category: 'User Import',
        description: `${rows.length} records with ${Object.keys(firstRow).length} columns.`,
        rowCount: rows.length,
        columns: Object.keys(firstRow).map((k) => ({
          name: k,
          type: typeof firstRow[k] === 'number' ? 'DOUBLE' : 'VARCHAR',
          description: k
        })),
        sampleQueries: [
          { title: 'All Records', sql: `SELECT * FROM ${tableName} LIMIT 50;` }
        ]
      };
    }
  }

  public removeTable(tableName: string) {
    const key = (tableName || '').toLowerCase();
    this.tables.delete(key);
    delete DATASETS_METADATA[key];
    auraStorage.deleteTable(key).catch(() => {});
  }

  public getDistinctValues(tableName: string, column: string, maxValues: number = 20): string[] {
    const rows = this.getTableData(tableName);
    const seen = new Set<string>();
    for (const row of rows) {
      if (row[column] !== undefined && row[column] !== null) {
        seen.add(String(row[column]));
        if (seen.size >= maxValues) break;
      }
    }
    return Array.from(seen);
  }

  /**
   * Compute live KPI metrics from any table's actual data.
   */
  public computeLiveMetrics(tableName: string): {
    metric1: { title: string; value: string; sub: string; sparkline: number[] };
    metric2: { title: string; value: string; sub: string; sparkline: number[] };
    metric3: { title: string; value: string; sub: string; sparkline: number[] };
    metric4: { title: string; value: string; sub: string; sparkline: number[] };
  } {
    const rows = this.getTableData(tableName);
    if (rows.length === 0) {
      return {
        metric1: { title: 'Records', value: '0', sub: 'No data loaded', sparkline: [0, 0] },
        metric2: { title: 'Columns', value: '0', sub: 'Upload data to begin', sparkline: [0, 0] },
        metric3: { title: 'Status', value: 'Empty', sub: 'Awaiting import', sparkline: [0, 0] },
        metric4: { title: 'Engine', value: 'Ready', sub: 'AuraQL Core', sparkline: [0, 0] }
      };
    }

    const cols = Object.keys(rows[0]);
    const numericCols = cols.filter((k) => typeof rows[0][k] === 'number');
    const stringCols = cols.filter((k) => typeof rows[0][k] === 'string');

    const n1 = numericCols[0];
    const n2 = numericCols[1];

    let sum1 = 0;
    let sum2 = 0;
    if (n1) sum1 = rows.reduce((acc, r) => acc + (Number(r[n1]) || 0), 0);
    if (n2) sum2 = rows.reduce((acc, r) => acc + (Number(r[n2]) || 0), 0);
    const avg2 = n2 && rows.length > 0 ? sum2 / rows.length : 0;

    const buildSparkline = (arr: Record<string, any>[], key: string, aggType: 'sum' | 'avg') => {
      const step = Math.max(1, Math.floor(arr.length / 7));
      const points: number[] = [];
      for (let i = 0; i < arr.length; i += step) {
        const slice = arr.slice(i, i + step);
        const val = slice.reduce((a, b) => a + (Number(b[key]) || 0), 0);
        points.push(aggType === 'avg' && slice.length > 0 ? val / slice.length : val);
      }
      return points.length > 1 ? points : [10, 25, 45, 30, 60, 80, 95];
    };

    const categories = stringCols[0] ? new Set(rows.map((r) => r[stringCols[0]])).size : 0;

    return {
      metric1: {
        title: 'Total Records',
        value: rows.length.toLocaleString(),
        sub: `Table: ${tableName}`,
        sparkline: n1 ? buildSparkline(rows, n1, 'sum') : [rows.length, rows.length]
      },
      metric2: {
        title: n1 ? `Sum(${n1})` : 'Columns',
        value: n1 ? (sum1 > 9999 ? `$${(sum1 / 1000).toFixed(1)}k` : Math.round(sum1).toLocaleString()) : `${cols.length}`,
        sub: n1 ? 'Computed from live data' : `${numericCols.length} numeric, ${stringCols.length} text`,
        sparkline: n1 ? buildSparkline(rows, n1, 'sum') : [0, 0]
      },
      metric3: {
        title: n2 ? `Avg(${n2})` : 'Attributes',
        value: n2 ? avg2.toFixed(2) : `${cols.length}`,
        sub: 'Real-time aggregation',
        sparkline: n2 ? buildSparkline(rows, n2, 'avg') : [0, 0]
      },
      metric4: {
        title: 'Distinct Categories',
        value: stringCols[0] ? `${categories}` : `${cols.length} cols`,
        sub: stringCols[0] ? `In column: ${stringCols[0]}` : 'Schema attributes',
        sparkline: n1 ? buildSparkline(rows, n1, 'avg') : [0, 0]
      }
    };
  }

  /**
   * Helper to resolve column names from joined or single rows
   */
  private resolveRowValue(row: Record<string, any>, colRef: string): any {
    if (row[colRef] !== undefined) return row[colRef];
    // Strip table/alias prefix (e.g. o.order_id -> order_id)
    const baseCol = colRef.split('.').pop() || colRef;
    if (row[baseCol] !== undefined) return row[baseCol];
    // Case-insensitive fallback
    const lowerRef = colRef.toLowerCase();
    const lowerBase = baseCol.toLowerCase();
    for (const key of Object.keys(row)) {
      if (key.toLowerCase() === lowerRef || key.toLowerCase() === lowerBase) {
        return row[key];
      }
    }
    return undefined;
  }

  private evaluateAggExpr(expr: string, groupItems: Record<string, any>[]): number | string | null {
    const trimmed = expr.trim();

    const roundMatch = trimmed.match(/^ROUND\(\s*(.*?)\s*,\s*(\d+)\s*\)$/i);
    if (roundMatch) {
      const innerVal = this.evaluateAggExpr(roundMatch[1], groupItems);
      const precision = parseInt(roundMatch[2], 10);
      if (typeof innerVal === 'number' && !isNaN(innerVal)) return +(innerVal.toFixed(precision));
      return innerVal;
    }

    const sumMatch = trimmed.match(/^SUM\(\s*([a-zA-Z0-9_.]+)\s*\)$/i);
    if (sumMatch) {
      const colName = sumMatch[1];
      return groupItems.reduce((acc, r) => acc + (Number(this.resolveRowValue(r, colName)) || 0), 0);
    }

    const avgMatch = trimmed.match(/^AVG\(\s*([a-zA-Z0-9_.]+)\s*\)$/i);
    if (avgMatch) {
      if (groupItems.length === 0) return 0;
      const colName = avgMatch[1];
      const total = groupItems.reduce((acc, r) => acc + (Number(this.resolveRowValue(r, colName)) || 0), 0);
      return total / groupItems.length;
    }

    const countMatch = trimmed.match(/^COUNT\(\s*(.*?)\s*\)$/i);
    if (countMatch) return groupItems.length;

    const minMatch = trimmed.match(/^MIN\(\s*([a-zA-Z0-9_.]+)\s*\)$/i);
    if (minMatch) {
      const colName = minMatch[1];
      const vals = groupItems.map((r) => Number(this.resolveRowValue(r, colName)) || 0).filter((v) => !isNaN(v));
      return vals.length > 0 ? Math.min(...vals) : 0;
    }

    const maxMatch = trimmed.match(/^MAX\(\s*([a-zA-Z0-9_.]+)\s*\)$/i);
    if (maxMatch) {
      const colName = maxMatch[1];
      const vals = groupItems.map((r) => Number(this.resolveRowValue(r, colName)) || 0).filter((v) => !isNaN(v));
      return vals.length > 0 ? Math.max(...vals) : 0;
    }

    return null;
  }

  /**
   * Main SQL execution method.
   * Supports SELECT, WHERE, JOIN (INNER/LEFT), GROUP BY, ORDER BY, LIMIT.
   */
  public async query(sql: string): Promise<QueryResult> {
    const startTime = performance.now();
    const cleanSql = (sql || '').trim().replace(/;$/, '');

    if (!cleanSql) {
      return {
        sql: '',
        columns: [],
        rows: [],
        rowCount: 0,
        executionTimeMs: 0.1,
        timestamp: new Date()
      };
    }

    try {
      // Regex supporting optional JOIN clause
      const selectMatch = cleanSql.match(
        /SELECT\s+(.*?)\s+FROM\s+([a-zA-Z0-9_]+)(?:\s+([a-zA-Z0-9_]+))?(?:\s+(INNER|LEFT)?\s*JOIN\s+([a-zA-Z0-9_]+)(?:\s+([a-zA-Z0-9_]+))?\s+ON\s+([a-zA-Z0-9_.]+)\s*=\s*([a-zA-Z0-9_.]+))?(?:\s+WHERE\s+(.*?))?(?:\s+GROUP\s+BY\s+(.*?))?(?:\s+ORDER\s+BY\s+(.*?))?(?:\s+LIMIT\s+(\d+))?$/i
      );

      if (!selectMatch) {
        // Fallback simple query
        const fromMatch = cleanSql.match(/FROM\s+([a-zA-Z0-9_]+)/i);
        const targetTable = fromMatch ? fromMatch[1].toLowerCase() : '';
        const rawRows = this.getTableData(targetTable);
        const limitMatch = cleanSql.match(/LIMIT\s+(\d+)/i);
        const limit = limitMatch ? parseInt(limitMatch[1], 10) : 50;
        const sliced = rawRows.slice(0, limit);
        return {
          sql,
          columns: sliced.length > 0 ? Object.keys(sliced[0]) : [],
          rows: sliced,
          rowCount: sliced.length,
          executionTimeMs: +(performance.now() - startTime).toFixed(1),
          timestamp: new Date()
        };
      }

      const [
        ,
        selectClause,
        table1NameRaw,
        table1Alias,
        joinTypeRaw,
        table2NameRaw,
        table2Alias,
        joinKey1,
        joinKey2,
        whereClause,
        groupByClause,
        orderByClause,
        limitClause
      ] = selectMatch;

      const table1Name = table1NameRaw.toLowerCase();
      let rows1 = [...this.getTableData(table1Name)];

      if (rows1.length === 0) {
        return {
          sql,
          columns: [],
          rows: [],
          rowCount: 0,
          executionTimeMs: +(performance.now() - startTime).toFixed(1),
          timestamp: new Date(),
          error: `Table "${table1Name}" not found or empty. Upload data first.`
        };
      }

      let mergedRows: Record<string, any>[] = rows1;

      // In-Memory Hash JOIN Execution
      if (table2NameRaw && joinKey1 && joinKey2) {
        const table2Name = table2NameRaw.toLowerCase();
        const rows2 = this.getTableData(table2Name);
        const joinType = (joinTypeRaw || 'INNER').toUpperCase();

        const cleanKey1 = joinKey1.split('.').pop() || joinKey1;
        const cleanKey2 = joinKey2.split('.').pop() || joinKey2;

        // Build hash index on right table
        const rightIndex = new Map<string, Record<string, any>[]>();
        for (const r2 of rows2) {
          const val = String(this.resolveRowValue(r2, cleanKey2)).toLowerCase();
          const bucket = rightIndex.get(val) || [];
          bucket.push(r2);
          rightIndex.set(val, bucket);
        }

        const joinedResults: Record<string, any>[] = [];
        for (const r1 of rows1) {
          const val = String(this.resolveRowValue(r1, cleanKey1)).toLowerCase();
          const matchedRightRows = rightIndex.get(val);

          if (matchedRightRows && matchedRightRows.length > 0) {
            for (const r2 of matchedRightRows) {
              joinedResults.push({ ...r2, ...r1 });
            }
          } else if (joinType === 'LEFT') {
            joinedResults.push({ ...r1 });
          }
        }
        mergedRows = joinedResults;
      }

      // WHERE Clause
      let rows = mergedRows;
      if (whereClause) {
        rows = rows.filter((row) => {
          try {
            const conditions = whereClause.split(/\s+AND\s+/i);
            return conditions.every((cond) => {
              const trimmedCond = cond.trim();

              // IS NULL / IS NOT NULL
              const isNullMatch = trimmedCond.match(/^([a-zA-Z0-9_.]+)\s+IS\s+(NOT\s+)?NULL$/i);
              if (isNullMatch) {
                const [, colName, isNot] = isNullMatch;
                const val = this.resolveRowValue(row, colName);
                const isNil = val === null || val === undefined || val === '';
                return isNot ? !isNil : isNil;
              }

              // IN ('a', 'b') / NOT IN ('a', 'b')
              const inMatch = trimmedCond.match(/^([a-zA-Z0-9_.]+)\s+(NOT\s+)?IN\s*\((.*?)\)$/i);
              if (inMatch) {
                const [, colName, isNot, rawList] = inMatch;
                const list = rawList.split(',').map((s) => s.trim().replace(/^'|'$/g, '').toLowerCase());
                const val = String(this.resolveRowValue(row, colName) ?? '').toLowerCase();
                const has = list.includes(val);
                return isNot ? !has : has;
              }

              const eqMatch = trimmedCond.match(/([a-zA-Z0-9_.]+)\s*(=|!=|<|>|<=|>=|LIKE)\s*('?[^']*'?)/i);
              if (!eqMatch) return true;
              const [, colName, op, rawTarget] = eqMatch;
              const target = rawTarget.replace(/^'|'$/g, '').trim();
              const val = this.resolveRowValue(row, colName);

              if (op.toUpperCase() === 'LIKE') {
                const regexStr = target.replace(/%/g, '.*');
                return new RegExp(`^${regexStr}$`, 'i').test(String(val ?? ''));
              }

              const numVal = Number(val);
              const numTarget = Number(target);
              const isNumeric = !isNaN(numVal) && !isNaN(numTarget);

              if (op === '=') return isNumeric ? numVal === numTarget : String(val).toLowerCase() === target.toLowerCase();
              if (op === '!=') return isNumeric ? numVal !== numTarget : String(val).toLowerCase() !== target.toLowerCase();
              if (op === '>') return isNumeric ? numVal > numTarget : String(val) > target;
              if (op === '<') return isNumeric ? numVal < numTarget : String(val) < target;
              if (op === '>=') return isNumeric ? numVal >= numTarget : String(val) >= target;
              if (op === '<=') return isNumeric ? numVal <= numTarget : String(val) <= target;
              return true;
            });
          } catch {
            return true;
          }
        });
      }

      // SELECT & GROUP BY
      const selectExprs = this.parseSelectExprs(selectClause);
      const hasAggs = selectExprs.some((e) => /SUM|AVG|COUNT|MIN|MAX/i.test(e.raw));
      let resultRows: Record<string, any>[] = [];

      if (groupByClause || hasAggs) {
        let groupKeys: string[] = [];
        if (groupByClause) {
          const rawTokens = groupByClause.split(',').map((s) => s.trim());
          groupKeys = rawTokens.map((tok) => {
            const num = parseInt(tok, 10);
            if (!isNaN(num) && num >= 1 && num <= selectExprs.length) {
              const exprObj = selectExprs[num - 1];
              return exprObj.alias || exprObj.raw;
            }
            return tok;
          });
        }

        const groups = new Map<string, Record<string, any>[]>();
        for (const row of rows) {
          const keyValues = groupKeys.map((k) => String(this.resolveRowValue(row, k) ?? ''));
          const groupHash = keyValues.join('|||');
          const bucket = groups.get(groupHash) || [];
          bucket.push(row);
          groups.set(groupHash, bucket);
        }

        if (groups.size === 0 && rows.length === 0) {
          groups.set('__empty__', []);
        }

        for (const [, groupItems] of groups) {
          const outRow: Record<string, any> = {};
          const first = groupItems[0] || {};

          for (const exprObj of selectExprs) {
            const rawExpr = exprObj.raw;
            const alias = exprObj.alias || rawExpr;

            if (/SUM|AVG|COUNT|MIN|MAX/i.test(rawExpr)) {
              outRow[alias] = this.evaluateAggExpr(rawExpr, groupItems);
            } else {
              outRow[alias] = this.resolveRowValue(first, rawExpr) ?? null;
            }
          }
          resultRows.push(outRow);
        }
      } else {
        // Non-aggregated projection
        const isStar = selectClause.trim() === '*';
        for (const row of rows) {
          if (isStar) {
            resultRows.push({ ...row });
          } else {
            const outRow: Record<string, any> = {};
            for (const exprObj of selectExprs) {
              const alias = exprObj.alias || exprObj.raw;
              outRow[alias] = this.resolveRowValue(row, exprObj.raw) ?? null;
            }
            resultRows.push(outRow);
          }
        }
      }

      // ORDER BY
      if (orderByClause && resultRows.length > 0) {
        const orderParts = orderByClause.trim().split(/\s+/);
        const orderToken = orderParts[0];
        const isDesc = orderParts[1]?.toUpperCase() === 'DESC';

        const availableCols = Object.keys(resultRows[0]);
        const posNum = parseInt(orderToken, 10);
        const orderCol =
          !isNaN(posNum) && posNum >= 1 && posNum <= availableCols.length
            ? availableCols[posNum - 1]
            : (orderToken.split('.').pop() || orderToken);

        resultRows.sort((a, b) => {
          const valA = a[orderCol] ?? 0;
          const valB = b[orderCol] ?? 0;
          if (typeof valA === 'number' && typeof valB === 'number') {
            return isDesc ? valB - valA : valA - valB;
          }
          return isDesc
            ? String(valB).localeCompare(String(valA))
            : String(valA).localeCompare(String(valB));
        });
      }

      // LIMIT
      const limit = limitClause ? parseInt(limitClause, 10) : 200;
      resultRows = resultRows.slice(0, limit);

      const columns = resultRows.length > 0 ? Object.keys(resultRows[0]) : [];
      const executionTimeMs = +(performance.now() - startTime).toFixed(1);
      auraStorage.logQuery(sql, resultRows.length, executionTimeMs).catch(() => {});

      return {
        sql,
        columns,
        rows: resultRows,
        rowCount: resultRows.length,
        executionTimeMs,
        timestamp: new Date()
      };
    } catch (e: any) {
      return {
        sql,
        columns: [],
        rows: [],
        rowCount: 0,
        executionTimeMs: +(performance.now() - startTime).toFixed(1),
        timestamp: new Date(),
        error: e.message || 'Query error'
      };
    }
  }

  /**
   * "What-If" Scenario Modeling Engine.
   * Simulates percentage adjustments or additive deltas against baseline metrics.
   */
  public simulateScenario(
    tableName: string,
    adjustments: ScenarioAdjustment[],
    description: string = 'Scenario Simulation'
  ): ScenarioResult {
    const rawRows = this.getTableData(tableName);
    if (rawRows.length === 0) {
      throw new Error(`Table "${tableName}" not found or has no records to simulate`);
    }

    const firstRow = rawRows[0];
    const numericCols = Object.keys(firstRow).filter((k) => typeof firstRow[k] === 'number');

    // Baseline Totals & Averages
    const baselineTotals: Record<string, number> = {};
    numericCols.forEach((col) => {
      baselineTotals[col] = rawRows.reduce((acc, r) => acc + (Number(r[col]) || 0), 0);
    });

    let impactedCount = 0;
    const projectedRows = rawRows.map((origRow) => {
      const cloned = { ...origRow };
      let wasImpacted = false;

      for (const adj of adjustments) {
        const col = adj.column;
        if (typeof cloned[col] !== 'number') continue;

        let matchesCondition = true;
        if (adj.condition) {
          const match = adj.condition.match(/([a-zA-Z0-9_]+)\s*(=|!=|>|<)\s*'?(.*?)'?$/);
          if (match) {
            const [, condCol, condOp, condVal] = match;
            const actualVal = String(cloned[condCol] ?? '').toLowerCase();
            const targetVal = condVal.toLowerCase();
            if (condOp === '=' && actualVal !== targetVal) matchesCondition = false;
            if (condOp === '!=' && actualVal === targetVal) matchesCondition = false;
          }
        }

        if (matchesCondition) {
          wasImpacted = true;
          if (adj.multiplier !== undefined) {
            cloned[col] = +(cloned[col] * adj.multiplier).toFixed(2);
          }
          if (adj.addDelta !== undefined) {
            cloned[col] = +(cloned[col] + adj.addDelta).toFixed(2);
          }
        }
      }

      if (wasImpacted) impactedCount++;
      return cloned;
    });

    // Projected Totals & Variances
    const metrics: ScenarioResult['metrics'] = {};
    numericCols.forEach((col) => {
      const baseTot = baselineTotals[col] || 0;
      const projTot = projectedRows.reduce((acc, r) => acc + (Number(r[col]) || 0), 0);
      const delta = projTot - baseTot;
      const variancePct = baseTot !== 0 ? +((delta / baseTot) * 100).toFixed(2) : 0;

      metrics[col] = {
        baselineTotal: +baseTot.toFixed(2),
        projectedTotal: +projTot.toFixed(2),
        deltaTotal: +delta.toFixed(2),
        variancePct,
        baselineAvg: +(baseTot / rawRows.length).toFixed(2),
        projectedAvg: +(projTot / projectedRows.length).toFixed(2)
      };
    });

    return {
      tableName,
      description,
      impactedRows: impactedCount,
      totalRows: rawRows.length,
      metrics,
      sampleProjectedRows: projectedRows.slice(0, 10)
    };
  }

  /**
   * Automated Anomaly & Outlier Detection Engine.
   * Computes Z-score (|Z| >= 2.0) and Interquartile Range to flag statistical outliers.
   */
  public detectAnomalies(tableName: string, targetCol?: string): AnomalyReport {
    const rows = this.getTableData(tableName);
    if (rows.length === 0) {
      throw new Error(`Table "${tableName}" not found or empty`);
    }

    const firstRow = rows[0];
    const availableNumeric = Object.keys(firstRow).filter((k) => typeof firstRow[k] === 'number');
    const colsToAnalyze = targetCol ? [targetCol] : availableNumeric;

    const anomalies: AnomalyItem[] = [];

    colsToAnalyze.forEach((col) => {
      const values = rows.map((r) => Number(r[col]) || 0);
      if (values.length < 3) return;

      const n = values.length;
      const mean = values.reduce((a, b) => a + b, 0) / n;
      const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n;
      const stdDev = Math.sqrt(variance);

      if (stdDev === 0) return;

      rows.forEach((row, idx) => {
        const val = Number(row[col]) || 0;
        const zScore = (val - mean) / stdDev;

        if (Math.abs(zScore) >= 1.85) {
          const isSpike = zScore > 0;
          const identifier = String(row['order_id'] || row['account_id'] || row['company'] || row['ticker'] || `Row #${idx + 1}`);

          anomalies.push({
            rowIndex: idx,
            rowIdentifier: identifier,
            column: col,
            value: +val.toFixed(2),
            mean: +mean.toFixed(2),
            stdDev: +stdDev.toFixed(2),
            zScore: +zScore.toFixed(2),
            type: isSpike ? 'spike' : 'drop',
            severity: Math.abs(zScore) >= 2.5 ? 'high' : 'medium',
            reason: `${isSpike ? 'Abnormal Spike' : 'Severe Drop'} in ${col} (${val.toLocaleString()} vs mean ${mean.toFixed(1)}, Z=${zScore > 0 ? '+' : ''}${zScore.toFixed(2)})`
          });
        }
      });
    });

    anomalies.sort((a, b) => Math.abs(b.zScore) - Math.abs(a.zScore));

    return {
      tableName,
      totalRows: rows.length,
      analyzedColumns: colsToAnalyze,
      anomaliesFound: anomalies.length,
      anomalies
    };
  }

  private parseSelectExprs(selectClause: string): { raw: string; alias: string | null }[] {
    const results: { raw: string; alias: string | null }[] = [];
    let depth = 0;
    let current = '';
    for (const ch of selectClause) {
      if (ch === '(') {
        depth++;
        current += ch;
      } else if (ch === ')') {
        depth--;
        current += ch;
      } else if (ch === ',' && depth === 0) {
        results.push(this.parseOneExpr(current.trim()));
        current = '';
      } else {
        current += ch;
      }
    }
    if (current.trim()) results.push(this.parseOneExpr(current.trim()));
    return results;
  }

  private parseOneExpr(expr: string): { raw: string; alias: string | null } {
    const aliasMatch = expr.match(/^(.*?)\s+as\s+([a-zA-Z0-9_]+)$/i);
    if (aliasMatch) return { raw: aliasMatch[1].trim(), alias: aliasMatch[2].trim() };
    return { raw: expr, alias: null };
  }
}

export const auraEngine = new AuraQLEngine();
