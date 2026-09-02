# Aura Analytics (AuraQL) 🔮
### Zero-Server In-Browser OLAP Intelligence Powered by WebMCP & AuraQL

> **Built for The WebMCP Challenge 2026**  
> *Hosted by OpenAI, Google Chrome, Vercel, Cloudflare, Netlify, Render, and Shopify.*

---

## ⚡ Overview

**Aura Analytics** is a zero-server, privacy-first business intelligence and data analytics studio designed specifically for the **WebMCP open standard** (`document.modelContext`).

Instead of sending confidential financial spreadsheets, logs, or customer databases to remote cloud warehouses, **Aura Analytics runs the AuraQL in-memory columnar engine directly inside the user's browser tab**. 

When accessed through **ChatGPT's in-app browser** or **Google Chrome with WebMCP enabled**, ChatGPT automatically discovers structured site tools. It can inspect dataset schemas, execute complex analytical SQL aggregations in under **10 milliseconds**, and dynamically command live visual charts on the user's screen—with **zero raw data ever leaving the device**.

---

## 🚀 Why This is a Strong Fit for WebMCP

1. **True Human + Agent Co-Pilot Experience**:  
   The human analyst and ChatGPT look at the **same live screen simultaneously**. The user watches interactive KPI cards, charts, and tables dynamically update in real-time as the agent issues structured WebMCP calls.
2. **Beyond Brittle DOM Scraping**:  
   Traditional web agents struggle with complex data dashboards because canvas elements and SVG charts cannot be easily scraped. With WebMCP, ChatGPT commands the analytical engine natively via JSON schemas.
3. **Mathematical Accuracy & No LLM Hallucinations**:  
   LLMs are prone to arithmetic errors when computing sums, averages, or variances on large datasets. With Aura Analytics, ChatGPT writes the SQL query, and AuraQL executes it deterministically on the columnar data in client memory.
4. **Zero-Server Overhead & Complete Privacy**:  
   The entire application runs client-side. There are no backend database servers, no API tokens to leak, and zero hosting costs.

---

## 🛠️ How WebMCP Was Implemented

Aura Analytics implements the official W3C WebMCP imperative specification using `document.modelContext.registerTool(...)` with dynamic lifecycle management:

```typescript
// Registering tools directly into document.modelContext
if ('modelContext' in document) {
  const controller = new AbortController();

  // 1. Tool to execute SQL queries in AuraQL
  document.modelContext.registerTool({
    name: "execute_sql_query",
    description: "Executes an analytical SQL query against the in-memory AuraQL database and returns structured records.",
    inputSchema: {
      type: "object",
      properties: {
        sql: {
          type: "string",
          description: "Standard AuraQL statement (e.g., SELECT category, SUM(revenue) FROM ecommerce_sales GROUP BY 1)"
        }
      },
      required: ["sql"]
    },
    execute: async ({ sql }) => {
      const result = await auraEngine.query(sql);
      return {
        content: [{ type: "text", text: JSON.stringify(result.rows) }]
      };
    }
  }, { signal: controller.signal });

  // 2. Tool to command live visual chart updates
  document.modelContext.registerTool({
    name: "render_interactive_chart",
    description: "Updates the live dashboard visual canvas with a dynamic chart (bar, line, area, donut, or scatter).",
    inputSchema: {
      type: "object",
      properties: {
        type: { type: "string", enum: ["bar", "line", "area", "donut", "scatter"] },
        title: { type: "string" },
        xAxis: { type: "string" },
        yAxis: { type: "string" },
        colorTheme: { type: "string", enum: ["purple", "cyan", "emerald", "gradient"] }
      },
      required: ["type", "title", "xAxis", "yAxis"]
    },
    execute: async (config) => {
      dashboardState.setChart(config);
      return {
        content: [{ type: "text", text: `Rendered ${config.type} chart: "${config.title}"` }]
      };
    }
  }, { signal: controller.signal });
}
```

---

## 📊 Pre-Loaded Datasets

The studio comes with three production-grade enterprise datasets:
1. **E-Commerce Operations (`ecommerce_sales`)**: 240 records covering categories, order velocity, unit margins, and regional VIP buyer segments.
2. **SaaS ARR & Churn Matrix (`saas_churn_metrics`)**: 200 account records tracking MRR, seat utilization rates, NPS scores, and churn risk severity.
3. **Core Web Vitals Telemetry (`web_vitals_telemetry`)**: 250 records benchmarking LCP, CLS, and INP metrics across Mobile, Desktop, and Tablet profiles.
4. **Custom Drag & Drop**: Any local `.csv` or `.json` file can be ingested directly into the in-memory engine.

---

## 💻 Running & Testing Locally

### Prerequisites
- Node.js 18+
- npm / pnpm

### Installation & Startup
```bash
# Clone the repository
git clone https://github.com/your-username/aura-analytics.git
cd aura-analytics

# Install dependencies
npm install

# Start the local development server
npm run dev
```

Visit `http://localhost:5173/` in your browser.

---

## 🧪 Testing with WebMCP

### Option 1: In ChatGPT (In-App Browser)
1. Open the ChatGPT Desktop App.
2. Navigate to your deployed live URL (or tunnel URL) in the ChatGPT built-in browser.
3. Notice the **Site Tools** icon illuminate in the address bar.
4. Ask ChatGPT:  
   > *"What were our top 3 loss-making product categories in the e-commerce dataset? Show me a bar chart."*
5. Watch ChatGPT execute the SQL query and render the chart live on your dashboard!

### Option 2: In Google Chrome
1. Enable the experimental flag: `chrome://flags/#enable-webmcp-testing` (or use the WebMCP Chrome Extension).
2. Visit the live URL.
3. Tools are automatically detected under `document.modelContext`.

### Option 3: Built-In Agent Simulator
If testing in a standard browser without flags, open the **WebMCP Bridge** drawer on the right side of the screen and click **"Agent Sandbox"** to simulate exact agent tool calls with one click.

---

## 🏆 Submission Checklist

- [x] Working live application with client-side AuraQL columnar engine
- [x] Full `document.modelContext.registerTool` implementation
- [x] 100% private zero-server execution
- [x] Dynamic multi-type charting (Bar, Area/Line, Donut)
- [x] Interactive SQL console with sub-10ms latency metrics
- [x] Drag & drop CSV/JSON file ingestion
- [x] Open source MIT License

---

## 📄 License
MIT © 2026 Aura Analytics Contributors
