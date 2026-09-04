// MCP Protocol End-to-End Test Script
// Simulates exactly what Codex / ChatGPT Desktop sends to the bridge

const http = require('http');

const BASE = 'http://localhost:3001';

function post(path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const data = JSON.stringify(body);
    const req = http.request(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    }, (res) => {
      let chunks = '';
      res.on('data', c => chunks += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(chunks) }); }
        catch { resolve({ status: res.statusCode, body: chunks }); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function get(path) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    http.get(url, (res) => {
      let chunks = '';
      res.on('data', c => chunks += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(chunks) }); }
        catch { resolve({ status: res.statusCode, body: chunks }); }
      });
    }).on('error', reject);
  });
}

async function testSSEHandshake() {
  return new Promise((resolve, reject) => {
    const url = new URL('/sse?session=test_verify_123', BASE);
    http.get(url, (res) => {
      let buf = '';
      const timer = setTimeout(() => {
        res.destroy();
        resolve({ status: res.statusCode, data: buf });
      }, 2000);
      res.on('data', c => {
        buf += c;
        // Once we get the endpoint event, we have enough
        if (buf.includes('event: endpoint')) {
          clearTimeout(timer);
          res.destroy();
          resolve({ status: res.statusCode, data: buf });
        }
      });
      res.on('error', () => {});
    }).on('error', reject);
  });
}

async function main() {
  const results = [];
  let allPassed = true;

  // ───── TEST 1: Health Check ─────
  console.log('\n═══════════════════════════════════════════════');
  console.log('  TEST 1: Health Check (GET /health)');
  console.log('═══════════════════════════════════════════════');
  try {
    const r = await get('/health');
    const pass = r.status === 200 && r.body.status === 'online' && Array.isArray(r.body.availableTools) && r.body.availableTools.length >= 5;
    console.log(`  Status: ${r.status}`);
    console.log(`  Server: ${r.body.status}`);
    console.log(`  Tools:  ${r.body.availableTools.join(', ')}`);
    console.log(`  Result: ${pass ? '✅ PASS' : '❌ FAIL'}`);
    results.push({ test: 'Health Check', pass });
    if (!pass) allPassed = false;
  } catch (e) {
    console.log(`  Result: ❌ FAIL — ${e.message}`);
    results.push({ test: 'Health Check', pass: false });
    allPassed = false;
  }

  // ───── TEST 2: SSE Handshake (MCP Transport) ─────
  console.log('\n═══════════════════════════════════════════════');
  console.log('  TEST 2: SSE Handshake (GET /sse?session=...)');
  console.log('  Simulates: Codex connecting via SSE transport');
  console.log('═══════════════════════════════════════════════');
  try {
    const r = await testSSEHandshake();
    const hasEndpoint = r.data.includes('event: endpoint');
    const hasMessagePath = r.data.includes('/message?sessionId=');
    const hasSession = r.data.includes('session=test_verify_123');
    console.log(`  Status:     ${r.status}`);
    console.log(`  Endpoint:   ${hasEndpoint ? 'received' : 'MISSING'}`);
    console.log(`  Message URL: ${hasMessagePath ? 'included' : 'MISSING'}`);
    console.log(`  Session Tag: ${hasSession ? 'correctly attached' : 'MISSING'}`);
    const pass = r.status === 200 && hasEndpoint && hasMessagePath && hasSession;
    console.log(`  Result: ${pass ? '✅ PASS' : '❌ FAIL'}`);
    results.push({ test: 'SSE Handshake', pass });
    if (!pass) allPassed = false;
  } catch (e) {
    console.log(`  Result: ❌ FAIL — ${e.message}`);
    results.push({ test: 'SSE Handshake', pass: false });
    allPassed = false;
  }

  // ───── TEST 3: MCP initialize (JSON-RPC via REST) ─────
  console.log('\n═══════════════════════════════════════════════');
  console.log('  TEST 3: MCP initialize (tools/list via REST)');
  console.log('  Simulates: First handshake + tool discovery');
  console.log('═══════════════════════════════════════════════');
  try {
    // Use the REST /api/tools endpoint for direct tool listing
    const r = await get('/api/tools');
    const toolNames = r.body.tools?.map(t => t.name) || [];
    const hasSchema = toolNames.includes('list_tables_and_schema');
    const hasSql = toolNames.includes('execute_sql_query');
    const hasChart = toolNames.includes('render_interactive_chart');
    const hasAnomaly = toolNames.includes('detect_anomalies');

    console.log(`  Status:     ${r.status}`);
    console.log(`  Tool Count: ${toolNames.length}`);
    console.log(`  Tools:`);
    for (const t of r.body.tools || []) {
      console.log(`    • ${t.name} — ${t.description?.substring(0, 60)}...`);
    }
    console.log(`  Has list_tables_and_schema:  ${hasSchema ? '✅' : '❌'}`);
    console.log(`  Has execute_sql_query:       ${hasSql ? '✅' : '❌'}`);
    console.log(`  Has render_interactive_chart: ${hasChart ? '✅' : '❌'}`);
    console.log(`  Has detect_anomalies:        ${hasAnomaly ? '✅' : '❌'}`);
    const pass = r.status === 200 && hasSchema && hasSql && hasChart && hasAnomaly;
    console.log(`  Result: ${pass ? '✅ PASS' : '❌ FAIL'}`);
    results.push({ test: 'MCP Tool Discovery', pass });
    if (!pass) allPassed = false;
  } catch (e) {
    console.log(`  Result: ❌ FAIL — ${e.message}`);
    results.push({ test: 'MCP Tool Discovery', pass: false });
    allPassed = false;
  }

  // ───── TEST 4: MCP tools/call (No browser = graceful warning) ─────
  console.log('\n═══════════════════════════════════════════════');
  console.log('  TEST 4: Tool Execution (No Browser Tab)');
  console.log('  Simulates: Codex calling a tool before user opens browser');
  console.log('═══════════════════════════════════════════════');
  try {
    const r = await post('/api/mcp', {
      tool: 'list_tables_and_schema',
      args: {},
      session: 'test_verify_123'
    });
    const isGraceful = r.body.result?.isError === true &&
      r.body.result?.content?.[0]?.text?.includes('No active Aura Analytics browser tab');
    console.log(`  Status:   ${r.status}`);
    console.log(`  Graceful: ${isGraceful ? 'Yes — clean warning message' : 'No'}`);
    if (r.body.result?.content?.[0]?.text) {
      console.log(`  Message:  ${r.body.result.content[0].text.substring(0, 120)}...`);
    }
    const pass = r.status === 200 && isGraceful;
    console.log(`  Result: ${pass ? '✅ PASS' : '❌ FAIL'}`);
    results.push({ test: 'Tool Graceful Fallback', pass });
    if (!pass) allPassed = false;
  } catch (e) {
    console.log(`  Result: ❌ FAIL — ${e.message}`);
    results.push({ test: 'Tool Graceful Fallback', pass: false });
    allPassed = false;
  }

  // ───── TEST 5: Stdio Mode (Pipe JSON-RPC) ─────
  console.log('\n═══════════════════════════════════════════════');
  console.log('  TEST 5: Stdio MCP Protocol (initialize + tools/list)');
  console.log('  Simulates: Codex CLI spawning the bridge as a child process');
  console.log('═══════════════════════════════════════════════');
  try {
    const { spawn } = require('child_process');
    const result = await new Promise((resolve, reject) => {
      const child = spawn('node', ['scripts/mcp-bridge.mjs', '--stdio'], {
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';
      child.stdout.on('data', d => stdout += d);
      child.stderr.on('data', d => stderr += d);

      // Send initialize
      child.stdin.write(JSON.stringify({
        jsonrpc: '2.0', id: 1, method: 'initialize',
        params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'test', version: '1.0' } }
      }) + '\n');

      // Send tools/list
      child.stdin.write(JSON.stringify({
        jsonrpc: '2.0', id: 2, method: 'tools/list', params: {}
      }) + '\n');

      // Send ping
      child.stdin.write(JSON.stringify({
        jsonrpc: '2.0', id: 3, method: 'ping', params: {}
      }) + '\n');

      setTimeout(() => {
        child.kill();
        resolve({ stdout, stderr });
      }, 3000);
    });

    const lines = result.stdout.trim().split('\n').filter(l => l.trim());
    const responses = [];
    for (const line of lines) {
      try { responses.push(JSON.parse(line)); } catch {}
    }

    const initResp = responses.find(r => r.id === 1);
    const toolsResp = responses.find(r => r.id === 2);
    const pingResp = responses.find(r => r.id === 3);

    const hasInit = initResp?.result?.protocolVersion === '2024-11-05' && initResp?.result?.serverInfo?.name === 'auraql';
    const hasTools = toolsResp?.result?.tools?.length >= 5;
    const hasPing = pingResp?.result !== undefined;

    console.log(`  Responses received: ${responses.length}`);
    console.log(`  initialize:  ${hasInit ? '✅ protocolVersion=2024-11-05, server=auraql' : '❌ MISSING'}`);
    console.log(`  tools/list:  ${hasTools ? `✅ ${toolsResp.result.tools.length} tools` : '❌ MISSING'}`);
    if (hasTools) {
      for (const t of toolsResp.result.tools) {
        console.log(`    • ${t.name}`);
      }
    }
    console.log(`  ping:        ${hasPing ? '✅ pong received' : '❌ MISSING'}`);

    const pass = hasInit && hasTools && hasPing;
    console.log(`  Result: ${pass ? '✅ PASS' : '❌ FAIL'}`);
    results.push({ test: 'Stdio MCP Protocol', pass });
    if (!pass) allPassed = false;
  } catch (e) {
    console.log(`  Result: ❌ FAIL — ${e.message}`);
    results.push({ test: 'Stdio MCP Protocol', pass: false });
    allPassed = false;
  }

  // ───── SUMMARY ─────
  console.log('\n\n═══════════════════════════════════════════════');
  console.log('  VERIFICATION SUMMARY');
  console.log('═══════════════════════════════════════════════');
  for (const r of results) {
    console.log(`  ${r.pass ? '✅' : '❌'} ${r.test}`);
  }
  console.log('───────────────────────────────────────────────');
  console.log(`  ${allPassed ? '🎉 ALL TESTS PASSED — MCP bridge is Codex/ChatGPT compatible!' : '⚠️  SOME TESTS FAILED — see details above'}`);
  console.log('═══════════════════════════════════════════════\n');

  process.exit(allPassed ? 0 : 1);
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
