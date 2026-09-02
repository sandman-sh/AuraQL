import { QueryResult } from '../types';
import { DATASETS_METADATA } from './datasets';

export class AuraQLEngine {
  private tables: Map<string, Record<string, any>[]> = new Map();

  public getTableNames(): string[] {
    return Array.from(this.tables.keys());
  }

  public getTableData(tableName: string): Record<string, any>[] {
    if (!tableName) return [];
    return this.tables.get(tableName.toLowerCase()) || [];
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
  public registerCustomTable(rawTableName: string, rows: Record<string, any>[]) {
    const tableName = (rawTableName || 'custom_table').trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    this.tables.set(tableName, rows);

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

    const buildSparkline = (data: Record<string, any>[], col: string, agg: 'sum' | 'avg' = 'sum'): number[] => {
      if (data.length === 0) return [0, 0];
      const buckets = 8;
      const chunkSize = Math.max(1, Math.floor(data.length / buckets));
      const result: number[] = [];
      for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, i + chunkSize);
        if (chunk.length === 0) continue;
        const vals = chunk.map((r) => Number(r[col]) || 0).filter((v) => !isNaN(v));
        if (vals.length === 0) {
          result.push(0);
          continue;
        }
        if (agg === 'sum') {
          result.push(Math.round(vals.reduce((a, b) => a + b, 0)));
        } else {
          result.push(+(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2));
        }
      }
      return result.length >= 2 ? result.slice(0, 8) : [result[0] || 0, result[0] || 0];
    };

    const n1 = numericCols[0];
    const n2 = numericCols[1] || numericCols[0];

    const sum1 = n1 ? rows.reduce((s, r) => s + (Number(r[n1]) || 0), 0) : 0;
    const avg2 = n2 && rows.length > 0 ? rows.reduce((s, r) => s + (Number(r[n2]) || 0), 0) / rows.length : 0;
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

  private evaluateAggExpr(expr: string, groupItems: Record<string, any>[]): number | string | null {
    const trimmed = expr.trim();

    const roundMatch = trimmed.match(/^ROUND\(\s*(.*?)\s*,\s*(\d+)\s*\)$/i);
    if (roundMatch) {
      const innerVal = this.evaluateAggExpr(roundMatch[1], groupItems);
      const precision = parseInt(roundMatch[2], 10);
      if (typeof innerVal === 'number' && !isNaN(innerVal)) return +(innerVal.toFixed(precision));
      return innerVal;
    }

    const sumMatch = trimmed.match(/^SUM\(\s*([a-zA-Z0-9_]+)\s*\)$/i);
    if (sumMatch) {
      return groupItems.reduce((acc, r) => acc + (Number(r[sumMatch[1]]) || 0), 0);
    }

    const avgMatch = trimmed.match(/^AVG\(\s*([a-zA-Z0-9_]+)\s*\)$/i);
    if (avgMatch) {
      if (groupItems.length === 0) return 0;
      const total = groupItems.reduce((acc, r) => acc + (Number(r[avgMatch[1]]) || 0), 0);
      return total / groupItems.length;
    }

    const countMatch = trimmed.match(/^COUNT\(\s*(.*?)\s*\)$/i);
    if (countMatch) return groupItems.length;

    const minMatch = trimmed.match(/^MIN\(\s*([a-zA-Z0-9_]+)\s*\)$/i);
    if (minMatch) {
      const vals = groupItems.map((r) => Number(r[minMatch[1]]) || 0).filter((v) => !isNaN(v));
      return vals.length > 0 ? Math.min(...vals) : 0;
    }

    const maxMatch = trimmed.match(/^MAX\(\s*([a-zA-Z0-9_]+)\s*\)$/i);
    if (maxMatch) {
      const vals = groupItems.map((r) => Number(r[maxMatch[1]]) || 0).filter((v) => !isNaN(v));
      return vals.length > 0 ? Math.max(...vals) : 0;
    }

    return null;
  }

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
      const selectMatch = cleanSql.match(
        /SELECT\s+(.*?)\s+FROM\s+([a-zA-Z0-9_]+)(?:\s+WHERE\s+(.*?))?(?:\s+GROUP\s+BY\s+(.*?))?(?:\s+ORDER\s+BY\s+(.*?))?(?:\s+LIMIT\s+(\d+))?$/i
      );

      if (!selectMatch) {
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

      const [, selectClause, tableNameRaw, whereClause, groupByClause, orderByClause, limitClause] = selectMatch;
      const tableName = tableNameRaw.toLowerCase();
      let rows = [...this.getTableData(tableName)];

      if (rows.length === 0) {
        return {
          sql,
          columns: [],
          rows: [],
          rowCount: 0,
          executionTimeMs: +(performance.now() - startTime).toFixed(1),
          timestamp: new Date(),
          error: `Table "${tableName}" not found or empty. Upload data first.`
        };
      }

      // WHERE
      if (whereClause) {
        rows = rows.filter((row) => {
          try {
            const conditions = whereClause.split(/\s+AND\s+/i);
            return conditions.every((cond) => {
              const eqMatch = cond.trim().match(/([a-zA-Z0-9_]+)\s*(=|!=|<|>|<=|>=)\s*('?[^']*'?)/);
              if (!eqMatch) return true;
              const [, col, op, rawVal] = eqMatch;
              const val = rawVal.replace(/^'|'$/g, '');
              const rowVal = row[col];
              if (rowVal === undefined) return true;
              if (op === '=') return String(rowVal).toLowerCase() === val.toLowerCase();
              if (op === '!=') return String(rowVal).toLowerCase() !== val.toLowerCase();
              if (op === '<') return Number(rowVal) < Number(val);
              if (op === '>') return Number(rowVal) > Number(val);
              if (op === '<=') return Number(rowVal) <= Number(val);
              if (op === '>=') return Number(rowVal) >= Number(val);
              return true;
            });
          } catch {
            return true;
          }
        });
      }

      // GROUP BY
      let resultRows: Record<string, any>[] = [];
      const selectExprs = this.parseSelectExprs(selectClause);

      if (groupByClause) {
        const groupColTokens = groupByClause.split(',').map((s) => s.trim());
        const groupCols = groupColTokens.map((tok) => {
          const posNum = parseInt(tok, 10);
          if (!isNaN(posNum) && posNum >= 1 && posNum <= selectExprs.length) {
            return selectExprs[posNum - 1].raw;
          }
          return tok;
        });

        const groups: Map<string, Record<string, any>[]> = new Map();
        for (const row of rows) {
          const groupKey = groupCols.map((c) => String(row[c] ?? '')).join('___');
          if (!groups.has(groupKey)) groups.set(groupKey, []);
          groups.get(groupKey)!.push(row);
        }

        for (const [, groupItems] of groups.entries()) {
          const resRow: Record<string, any> = {};
          for (const expr of selectExprs) {
            const colName = expr.alias || expr.raw;
            if (groupCols.includes(expr.raw)) {
              resRow[colName] = groupItems[0][expr.raw];
              continue;
            }
            const aggResult = this.evaluateAggExpr(expr.raw, groupItems);
            if (aggResult !== null) {
              resRow[colName] = aggResult;
            } else {
              resRow[colName] = groupItems[0][expr.raw] ?? null;
            }
          }
          resultRows.push(resRow);
        }
      } else {
        if (selectClause.trim() === '*') {
          resultRows = rows;
        } else {
          const hasAgg = selectExprs.some((e) =>
            /SUM\s*\(|AVG\s*\(|COUNT\s*\(|MIN\s*\(|MAX\s*\(|ROUND\s*\(/i.test(e.raw)
          );

          if (hasAgg) {
            const resRow: Record<string, any> = {};
            for (const expr of selectExprs) {
              const colName = expr.alias || expr.raw;
              const aggResult = this.evaluateAggExpr(expr.raw, rows);
              resRow[colName] = aggResult !== null ? aggResult : rows[0]?.[expr.raw] ?? null;
            }
            resultRows = [resRow];
          } else {
            resultRows = rows.map((r) => {
              const rowObj: Record<string, any> = {};
              for (const e of selectExprs) rowObj[e.alias || e.raw] = r[e.raw];
              return rowObj;
            });
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
            : orderToken;

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
      return {
        sql,
        columns,
        rows: resultRows,
        rowCount: resultRows.length,
        executionTimeMs: +(performance.now() - startTime).toFixed(1),
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
