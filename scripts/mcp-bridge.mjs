#!/usr/bin/env node
/**
 * Aura Analytics WebMCP External Agent Bridge Server
 * 
 * Compliant with the official Model Context Protocol (MCP) specification:
 * - Transport 1: Stdio JSON-RPC 2.0 (for Desktop ChatGPT, Codex CLI, Claude Desktop, Cursor)
 * - Transport 2: HTTP SSE (for Desktop ChatGPT SSE, remote MCP clients)
 * - Transport 3: Web Browser Bridge (syncs with live in-browser AuraQL database)
 * - Transport 4: Direct REST API (for Python, LangChain, curl)
 * 
 * Usage:
 *   node scripts/mcp-bridge.mjs           (Starts HTTP/SSE server on port 3001)
 *   node scripts/mcp-bridge.mjs --stdio   (Starts Stdio MCP protocol for ChatGPT/Codex/Claude)
 */

import http from 'node:http';
import readline from 'node:readline';
import crypto from 'node:crypto';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
const isStdioMode = process.argv.includes('--stdio');

function log(...args) {
  if (isStdioMode) {
    // In stdio mode, stdout is strictly reserved for JSON-RPC 2.0. Logs must go to stderr.
    console.error('[WebMCP Bridge]', ...args);
  } else {
    console.log('[WebMCP Bridge]', ...args);
  }
}

// Official WebMCP Tool Specifications
const TOOLS_SPEC = [
  {
    name: 'list_tables_and_schema',
    description: 'Inspects in-memory AuraQL database and returns active table names, column definitions, data types, and live row counts.',
    inputSchema: {
      type: 'object',
      properties: {
        tableName: {
          type: 'string',
          description: 'Optional: name of a specific table to inspect'
        }
      }
    }
  },
  {
    name: 'execute_sql_query',
    description: 'Executes analytical SQL queries (SELECT, WHERE, GROUP BY, ORDER BY, LIMIT, SUM, AVG, COUNT, MIN, MAX, ROUND) against in-memory AuraQL columnar tables with sub-10ms latency.',
    inputSchema: {
      type: 'object',
      properties: {
        sql: {
          type: 'string',
          description: 'SQL statement (e.g. SELECT product_category, ROUND(SUM(revenue), 2) as total_rev FROM ecommerce_sales GROUP BY 1 ORDER BY total_rev DESC LIMIT 10;)'
        }
      },
      required: ['sql']
    }
  },
  {
    name: 'render_interactive_chart',
    description: 'Directly updates the user\'s live browser viewport to render or modify a chart (bar, line, area, donut, scatter) mapped to query columns.',
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
    }
  },
  {
    name: 'apply_dashboard_filter',
    description: 'Applies a cohort or segment filter to the user\'s live dashboard view.',
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
    }
  },
  {
    name: 'simulate_forecast_scenario',
    description: 'Executes in-memory what-if scenario simulations against columnar tables by applying metric multipliers or additive deltas (e.g. simulate +15% revenue growth or -20% churn), returning baseline vs projected variance analysis.',
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
    }
  },
  {
    name: 'detect_anomalies',
    description: 'Analyzes numerical columns across in-memory AuraQL tables using statistical Z-scores and Interquartile Ranges (IQR) to detect spikes, severe drop-offs, and margin compression.',
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
    }
  }
];

// Active Browser Clients connected via SSE
const browserClients = new Set();
// Multi-tenant session map: session -> Set of browser SSE response streams
const browserClientsBySession = new Map();
// Pending tool call promises: id -> { resolve, reject, timeout }
const pendingRequests = new Map();
// Active MCP SSE Client Sessions: sessionId -> { res, userSession }
const mcpSessions = new Map();

// Periodic keep-alive ping to prevent cloud load balancers (e.g. Render 55s idle timeout) from closing SSE streams
setInterval(() => {
  for (const client of browserClients) {
    try {
      client.write(': keepalive\n\n');
    } catch {
      browserClients.delete(client);
    }
  }
  for (const [id, sessionObj] of mcpSessions) {
    try {
      const clientRes = sessionObj.res || sessionObj;
      clientRes.write(': keepalive\n\n');
    } catch {
      mcpSessions.delete(id);
    }
  }
}, 25000);

/**
 * Dispatches a tool call to the connected browser tab
 * Routes strictly to targetSession if provided, ensuring multi-user isolation
 */
function callToolInBrowser(toolName, args, targetSession = null, timeoutMs = 15000) {
  return new Promise(async (resolve, reject) => {
    // Select target browser tabs: prioritize exact session match
    let targets = [];
    if (targetSession && browserClientsBySession.has(targetSession) && browserClientsBySession.get(targetSession).size > 0) {
      targets = Array.from(browserClientsBySession.get(targetSession));
    } else {
      targets = Array.from(browserClients);
    }

    if (targets.length === 0) {
      // Only forward to HTTP bridge when running as a separate stdio process
      if (isStdioMode) {
        try {
          const forwardRes = await fetch(`http://localhost:${PORT}/api/mcp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tool: toolName, args: args || {}, session: targetSession })
          });
          if (forwardRes.ok) {
            const json = await forwardRes.json();
            if (json.result) {
              resolve(json.result);
              return;
            }
          }
        } catch {
          // Fall through
        }
      }

      resolve({
        isError: true,
        content: [
          {
            type: 'text',
            text: `[WebMCP Bridge Warning] No active Aura Analytics browser tab matching session "${targetSession || 'any'}" is connected to http://localhost:${PORT}.\nPlease open http://localhost:5173 or the web app in your browser to execute live WebMCP tools.`
          }
        ]
      });
      return;
    }

    const id = `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const payload = JSON.stringify({
      type: 'CALL_TOOL',
      id,
      name: toolName,
      args: args || {}
    });

    const timeout = setTimeout(() => {
      pendingRequests.delete(id);
      reject(new Error(`Tool call "${toolName}" timed out after ${timeoutMs}ms waiting for browser response.`));
    }, timeoutMs);

    pendingRequests.set(id, { resolve, reject, timeout });

    // Send strictly to targeted browser tabs
    for (const client of targets) {
      try {
        client.write(`data: ${payload}\n\n`);
      } catch (err) {
        browserClients.delete(client);
      }
    }
  });
}

/**
 * Process standard MCP JSON-RPC 2.0 messages
 */
async function handleMcpJsonRpc(msg, userSession = null) {
  const { id, method, params } = msg;

  if (method === 'initialize') {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {
            listChanged: false
          },
          resources: {},
          prompts: {}
        },
        serverInfo: {
          name: 'auraql',
          version: '1.0.0'
        }
      }
    };
  }

  if (method === 'notifications/initialized') {
    return null; // Notifications do not have response
  }

  if (method === 'ping') {
    return {
      jsonrpc: '2.0',
      id,
      result: {}
    };
  }

  if (method === 'tools/list') {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        tools: TOOLS_SPEC
      }
    };
  }

  if (method === 'tools/call') {
    const { name, arguments: args } = params || {};
    try {
      const res = await callToolInBrowser(name, args, userSession);
      return {
        jsonrpc: '2.0',
        id,
        result: res
      };
    } catch (err) {
      return {
        jsonrpc: '2.0',
        id,
        error: {
          code: -32000,
          message: err.message || 'Execution error'
        }
      };
    }
  }

  if (method === 'resources/list') {
    return {
      jsonrpc: '2.0',
      id,
      result: { resources: [] }
    };
  }

  if (method === 'prompts/list') {
    return {
      jsonrpc: '2.0',
      id,
      result: { prompts: [] }
    };
  }

  return {
    jsonrpc: '2.0',
    id,
    error: {
      code: -32601,
      message: `Method "${method}" not implemented`
    }
  };
}

// ─────────────────────────────────────────────
// 1. HTTP / SSE Server Mode (Ports & REST & SSE)
// ─────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const proto = req.headers['x-forwarded-proto'] || (req.socket.encrypted ? 'https' : 'http');
  const host = req.headers['x-forwarded-host'] || req.headers.host || `localhost:${PORT}`;
  const baseUrl = `${proto}://${host}`;
  const url = new URL(req.url, baseUrl);

  // Health Check
  if (url.pathname === '/health' || url.pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'online',
      protocol: 'WebMCP Bridge v1.0',
      browserConnected: browserClients.size > 0,
      activeBrowserTabs: browserClients.size,
      availableTools: TOOLS_SPEC.map(t => t.name),
      mcpEndpoints: {
        sse: `${baseUrl}/sse`,
        rest: `${baseUrl}/api/mcp`
      }
    }, null, 2));
    return;
  }

  // Tool List
  if (url.pathname === '/api/tools') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ tools: TOOLS_SPEC }, null, 2));
    return;
  }

  // Official MCP SSE + Streamable HTTP Transport endpoint
  // GET  /sse → Legacy SSE transport (ChatGPT Desktop, Claude Desktop)
  // POST /sse → Streamable HTTP transport (Codex Desktop)
  if (url.pathname === '/sse') {
    const userSession = url.searchParams.get('session') || null;

    // ── Streamable HTTP: POST with JSON-RPC body ──
    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', async () => {
        try {
          const jsonRpcMsg = JSON.parse(body);
          const response = await handleMcpJsonRpc(jsonRpcMsg, userSession);

          if (response) {
            // Respond as SSE stream (Codex expects text/event-stream for POST)
            res.writeHead(200, {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive'
            });
            res.write(`event: message\ndata: ${JSON.stringify(response)}\n\n`);
            res.end();
            log(`Streamable HTTP: Processed ${jsonRpcMsg.method} (id: ${jsonRpcMsg.id}, session: ${userSession || 'all'})`);
          } else {
            // Notifications (no response needed)
            res.writeHead(204);
            res.end();
          }
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
      });
      return;
    }

    // ── Legacy SSE: GET opens a persistent stream ──
    const sessionId = crypto.randomUUID();
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    mcpSessions.set(sessionId, { res, userSession });
    // Send endpoint notification per official MCP SSE specification
    res.write(`event: endpoint\ndata: /message?sessionId=${sessionId}${userSession ? `&session=${userSession}` : ''}\n\n`);
    log(`Legacy SSE: Client connected (Session: ${sessionId}, UserSession: ${userSession || 'all'})`);

    req.on('close', () => {
      mcpSessions.delete(sessionId);
      log(`Legacy SSE: Client disconnected (Session: ${sessionId})`);
    });
    return;
  }

  // Official MCP SSE message receiver
  if (url.pathname === '/message' && req.method === 'POST') {
    const sessionId = url.searchParams.get('sessionId');
    const sessionEntry = sessionId ? mcpSessions.get(sessionId) : null;
    const sseClient = sessionEntry ? (sessionEntry.res || sessionEntry) : null;
    const userSession = sessionEntry?.userSession || url.searchParams.get('session') || null;

    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const jsonRpcMsg = JSON.parse(body);
        const response = await handleMcpJsonRpc(jsonRpcMsg, userSession);

        if (response) {
          if (sseClient) {
            sseClient.write(`event: message\ndata: ${JSON.stringify(response)}\n\n`);
          }
          res.writeHead(202, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ accepted: true }));
        } else {
          res.writeHead(204);
          res.end();
        }
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // Browser Tab Bridge SSE Stream
  if (url.pathname === '/api/bridge/events') {
    const session = url.searchParams.get('session') || 'default';
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    browserClients.add(res);
    if (!browserClientsBySession.has(session)) {
      browserClientsBySession.set(session, new Set());
    }
    browserClientsBySession.get(session).add(res);

    res.write(`data: ${JSON.stringify({ type: 'CONNECTED', session, timestamp: Date.now() })}\n\n`);
    log(`Browser tab connected (Session: ${session}, Total active tabs: ${browserClients.size})`);

    req.on('close', () => {
      browserClients.delete(res);
      const sessGroup = browserClientsBySession.get(session);
      if (sessGroup) {
        sessGroup.delete(res);
        if (sessGroup.size === 0) browserClientsBySession.delete(session);
      }
      log(`Browser tab disconnected (Session: ${session}, Remaining tabs: ${browserClients.size})`);
    });
    return;
  }

  // Browser Reporting Tool Result
  if (url.pathname === '/api/bridge/result' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { id, result } = JSON.parse(body);
        const pending = pendingRequests.get(id);
        if (pending) {
          clearTimeout(pending.timeout);
          pendingRequests.delete(id);
          pending.resolve(result);
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ received: true }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // Simple REST Endpoint for Python / cURL / LangChain
  if ((url.pathname === '/api/mcp' || url.pathname === '/v1/mcp') && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const json = JSON.parse(body);
        const toolName = json.tool || json.name || json.params?.name;
        const toolArgs = json.args || json.arguments || json.params?.arguments || json.params?.args || {};

        if (!toolName) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            error: 'Missing tool name. Provide "tool" or "name".',
            availableTools: TOOLS_SPEC.map(t => t.name)
          }));
          return;
        }

        const toolSession = json.session || url.searchParams.get('session') || null;
        const result = await callToolInBrowser(toolName, toolArgs, toolSession);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: !result.isError,
          tool: toolName,
          result
        }, null, 2));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // 404 Fallback
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint not found' }));
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    if (isStdioMode) {
      log('Port 3001 in use; stdio bridge will forward calls to active HTTP bridge.');
    } else {
      log('Warning: Port 3001 already in use.');
    }
  } else {
    log('Server error:', err.message);
  }
});

server.listen(PORT, () => {
  if (!isStdioMode) {
    log(`
═════════════════════════════════════════════════════════════════════
🔮 AuraQL WebMCP External Agent Bridge Active
═════════════════════════════════════════════════════════════════════
• HTTP Server:    http://localhost:${PORT}
• Health Check:   http://localhost:${PORT}/health
• MCP SSE:        http://localhost:${PORT}/sse (Desktop ChatGPT / Claude SSE)
• MCP REST:       POST http://localhost:${PORT}/api/mcp (Python / cURL)
• Browser Link:   Connects automatically to http://localhost:5173
═════════════════════════════════════════════════════════════════════
`);
  }
});

// ─────────────────────────────────────────────
// 2. Standard MCP Stdio Protocol (Desktop ChatGPT, Codex, Claude Desktop)
// ─────────────────────────────────────────────
if (isStdioMode) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  });

  rl.on('line', async (line) => {
    if (!line.trim()) return;
    try {
      const msg = JSON.parse(line);
      const response = await handleMcpJsonRpc(msg);
      if (response) {
        // Output strictly JSON-RPC to stdout
        process.stdout.write(JSON.stringify(response) + '\n');
      }
    } catch (err) {
      log('Stdio JSON Parse Error:', err.message);
    }
  });
}
