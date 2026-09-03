import { DatasetMetadata } from '../types';

export const INITIAL_ECOMMERCE_DATA: Record<string, any>[] = [
  { order_id: 'ORD-1001', customer_segment: 'Enterprise VIP', product_category: 'Cloud Infrastructure', region: 'North America', units: 14, unit_price: 350.0, revenue: 4900.0, gross_margin_pct: 78.5, order_status: 'Completed' },
  { order_id: 'ORD-1002', customer_segment: 'Mid-Market', product_category: 'Developer Tooling', region: 'Europe', units: 28, unit_price: 120.0, revenue: 3360.0, gross_margin_pct: 82.1, order_status: 'Completed' },
  { order_id: 'ORD-1003', customer_segment: 'SMB', product_category: 'Data Analytics', region: 'Asia Pacific', units: 8, unit_price: 490.0, revenue: 3920.0, gross_margin_pct: 74.0, order_status: 'Completed' },
  { order_id: 'ORD-1004', customer_segment: 'Enterprise VIP', product_category: 'Security & Auth', region: 'North America', units: 22, unit_price: 280.0, revenue: 6160.0, gross_margin_pct: 86.4, order_status: 'Completed' },
  { order_id: 'ORD-1005', customer_segment: 'Mid-Market', product_category: 'Cloud Infrastructure', region: 'Latin America', units: 11, unit_price: 350.0, revenue: 3850.0, gross_margin_pct: 76.2, order_status: 'Completed' },
  { order_id: 'ORD-1006', customer_segment: 'Startup', product_category: 'AI Gateway', region: 'North America', units: 45, unit_price: 180.0, revenue: 8100.0, gross_margin_pct: 88.0, order_status: 'Completed' },
  { order_id: 'ORD-1007', customer_segment: 'Enterprise VIP', product_category: 'Data Analytics', region: 'Europe', units: 30, unit_price: 490.0, revenue: 14700.0, gross_margin_pct: 79.2, order_status: 'Completed' },
  { order_id: 'ORD-1008', customer_segment: 'SMB', product_category: 'Developer Tooling', region: 'North America', units: 15, unit_price: 120.0, revenue: 1800.0, gross_margin_pct: 81.5, order_status: 'Completed' },
  { order_id: 'ORD-1009', customer_segment: 'Mid-Market', product_category: 'Security & Auth', region: 'Asia Pacific', units: 19, unit_price: 280.0, revenue: 5320.0, gross_margin_pct: 85.0, order_status: 'Completed' },
  { order_id: 'ORD-1010', customer_segment: 'Enterprise VIP', product_category: 'AI Gateway', region: 'Europe', units: 60, unit_price: 180.0, revenue: 10800.0, gross_margin_pct: 89.4, order_status: 'Completed' },
  { order_id: 'ORD-1011', customer_segment: 'Startup', product_category: 'Cloud Infrastructure', region: 'North America', units: 9, unit_price: 350.0, revenue: 3150.0, gross_margin_pct: 75.0, order_status: 'Processing' },
  { order_id: 'ORD-1012', customer_segment: 'Mid-Market', product_category: 'Data Analytics', region: 'North America', units: 18, unit_price: 490.0, revenue: 8820.0, gross_margin_pct: 77.8, order_status: 'Completed' },
  { order_id: 'ORD-1013', customer_segment: 'SMB', product_category: 'AI Gateway', region: 'Europe', units: 25, unit_price: 180.0, revenue: 4500.0, gross_margin_pct: 87.2, order_status: 'Completed' },
  { order_id: 'ORD-1014', customer_segment: 'Enterprise VIP', product_category: 'Developer Tooling', region: 'Asia Pacific', units: 50, unit_price: 120.0, revenue: 6000.0, gross_margin_pct: 83.0, order_status: 'Completed' },
  { order_id: 'ORD-1015', customer_segment: 'Mid-Market', product_category: 'Security & Auth', region: 'North America', units: 16, unit_price: 280.0, revenue: 4480.0, gross_margin_pct: 84.6, order_status: 'Completed' }
];

export const INITIAL_SAAS_CHURN_DATA: Record<string, any>[] = [
  { account_id: 'ACC-801', company_name: 'Apex Data Corp', plan: 'Enterprise Plus', mrr: 18500, seat_count: 420, seat_utilization_pct: 94.2, nps_score: 9, churn_risk: 'Low', support_tickets: 3 },
  { account_id: 'ACC-802', company_name: 'Starlight Logistics', plan: 'Team Pro', mrr: 4200, seat_count: 65, seat_utilization_pct: 52.0, nps_score: 5, churn_risk: 'High', support_tickets: 14 },
  { account_id: 'ACC-803', company_name: 'Vanguard FinTech', plan: 'Enterprise', mrr: 12800, seat_count: 280, seat_utilization_pct: 88.5, nps_score: 8, churn_risk: 'Low', support_tickets: 5 },
  { account_id: 'ACC-804', company_name: 'OmniMedia Global', plan: 'Team Pro', mrr: 3600, seat_count: 50, seat_utilization_pct: 44.0, nps_score: 4, churn_risk: 'Critical', support_tickets: 19 },
  { account_id: 'ACC-805', company_name: 'BioGenix Labs', plan: 'Enterprise', mrr: 9400, seat_count: 190, seat_utilization_pct: 79.1, nps_score: 7, churn_risk: 'Medium', support_tickets: 8 },
  { account_id: 'ACC-806', company_name: 'HyperScale AI', plan: 'Enterprise Plus', mrr: 24500, seat_count: 650, seat_utilization_pct: 96.8, nps_score: 10, churn_risk: 'Low', support_tickets: 2 },
  { account_id: 'ACC-807', company_name: 'Nexus Retail Partners', plan: 'Team Pro', mrr: 5100, seat_count: 85, seat_utilization_pct: 61.2, nps_score: 6, churn_risk: 'Medium', support_tickets: 9 },
  { account_id: 'ACC-808', company_name: 'Zenith Health Systems', plan: 'Enterprise Plus', mrr: 16200, seat_count: 360, seat_utilization_pct: 91.0, nps_score: 9, churn_risk: 'Low', support_tickets: 4 },
  { account_id: 'ACC-809', company_name: 'Kinetics Robotics', plan: 'Enterprise', mrr: 11500, seat_count: 240, seat_utilization_pct: 83.4, nps_score: 8, churn_risk: 'Low', support_tickets: 6 },
  { account_id: 'ACC-810', company_name: 'AeroDynamics Global', plan: 'Team Pro', mrr: 4800, seat_count: 70, seat_utilization_pct: 48.6, nps_score: 5, churn_risk: 'High', support_tickets: 16 }
];

export const INITIAL_FINANCIALS_DATA: Record<string, any>[] = [
  { company: 'Snowflake Inc', ticker: 'SNOW', segment: 'Data Cloud', quarterly_revenue_m: 829.3, gross_margin_pct: 71.2, yoy_growth_pct: 32.1, headcount: 7004 },
  { company: 'Datadog Inc', ticker: 'DDOG', segment: 'Observability', quarterly_revenue_m: 611.2, gross_margin_pct: 80.5, yoy_growth_pct: 27.4, headcount: 5200 },
  { company: 'Cloudflare Inc', ticker: 'NET', segment: 'Security & CDN', quarterly_revenue_m: 378.6, gross_margin_pct: 78.4, yoy_growth_pct: 30.5, headcount: 3840 },
  { company: 'Palantir Tech', ticker: 'PLTR', segment: 'AI & Defense', quarterly_revenue_m: 678.1, gross_margin_pct: 82.1, yoy_growth_pct: 27.2, headcount: 3800 },
  { company: 'CrowdStrike', ticker: 'CRWD', segment: 'Cybersecurity', quarterly_revenue_m: 921.0, gross_margin_pct: 77.8, yoy_growth_pct: 33.0, headcount: 7925 },
  { company: 'Confluent Inc', ticker: 'CFLT', segment: 'Data Streaming', quarterly_revenue_m: 235.0, gross_margin_pct: 73.1, yoy_growth_pct: 24.5, headcount: 2900 },
  { company: 'MongoDB Inc', ticker: 'MDB', segment: 'Database', quarterly_revenue_m: 478.2, gross_margin_pct: 75.3, yoy_growth_pct: 22.0, headcount: 5080 },
  { company: 'Elastic NV', ticker: 'ESTC', segment: 'Search & Observability', quarterly_revenue_m: 341.0, gross_margin_pct: 76.5, yoy_growth_pct: 18.2, headcount: 3200 }
];

/**
 * Dynamic metadata registry with default pre-configured enterprise datasets.
 */
export const DATASETS_METADATA: Record<string, DatasetMetadata> = {
  ecommerce_sales: {
    id: 'ecommerce_sales',
    name: 'E-Commerce Operations',
    tableName: 'ecommerce_sales',
    category: 'Operations',
    description: 'Order velocity, revenue, unit margins, and regional buyer segments.',
    rowCount: INITIAL_ECOMMERCE_DATA.length,
    columns: [
      { name: 'order_id', type: 'VARCHAR', description: 'Unique order reference code' },
      { name: 'customer_segment', type: 'VARCHAR', description: 'Enterprise VIP, Mid-Market, SMB, Startup' },
      { name: 'product_category', type: 'VARCHAR', description: 'Product vertical' },
      { name: 'region', type: 'VARCHAR', description: 'Geographic market' },
      { name: 'units', type: 'INTEGER', description: 'Number of units sold' },
      { name: 'unit_price', type: 'DOUBLE', description: 'Price per unit in USD' },
      { name: 'revenue', type: 'DOUBLE', description: 'Total line item revenue in USD' },
      { name: 'gross_margin_pct', type: 'DOUBLE', description: 'Gross profit margin percentage' },
      { name: 'order_status', type: 'VARCHAR', description: 'Completed, Processing' }
    ],
    sampleQueries: [
      { title: 'Revenue by Category', sql: 'SELECT product_category, ROUND(SUM(revenue), 2) as total_revenue FROM ecommerce_sales GROUP BY product_category ORDER BY total_revenue DESC;' },
      { title: 'Regional Performance', sql: 'SELECT region, ROUND(AVG(gross_margin_pct), 1) as avg_margin, ROUND(SUM(revenue), 2) as total_rev FROM ecommerce_sales GROUP BY region;' }
    ]
  },
  saas_churn_metrics: {
    id: 'saas_churn_metrics',
    name: 'SaaS ARR & Churn Matrix',
    tableName: 'saas_churn_metrics',
    category: 'Subscription Finance',
    description: 'Account-level MRR, seat utilization rates, NPS scores, and churn risk levels.',
    rowCount: INITIAL_SAAS_CHURN_DATA.length,
    columns: [
      { name: 'account_id', type: 'VARCHAR', description: 'Account ID' },
      { name: 'company_name', type: 'VARCHAR', description: 'Client company name' },
      { name: 'plan', type: 'VARCHAR', description: 'Subscription tier' },
      { name: 'mrr', type: 'DOUBLE', description: 'Monthly Recurring Revenue in USD' },
      { name: 'seat_count', type: 'INTEGER', description: 'Total licensed seats' },
      { name: 'seat_utilization_pct', type: 'DOUBLE', description: 'Active monthly seat utilization' },
      { name: 'nps_score', type: 'INTEGER', description: 'Net Promoter Score (1-10)' },
      { name: 'churn_risk', type: 'VARCHAR', description: 'Risk level: Low, Medium, High, Critical' },
      { name: 'support_tickets', type: 'INTEGER', description: 'Open or recent support tickets' }
    ],
    sampleQueries: [
      { title: 'MRR by Churn Risk Tier', sql: 'SELECT churn_risk, ROUND(SUM(mrr), 2) as at_risk_mrr, COUNT(*) as account_count FROM saas_churn_metrics GROUP BY churn_risk ORDER BY at_risk_mrr DESC;' },
      { title: 'Seat Utilization Analysis', sql: 'SELECT plan, ROUND(AVG(seat_utilization_pct), 1) as avg_utilization, ROUND(AVG(nps_score), 1) as avg_nps FROM saas_churn_metrics GROUP BY plan;' }
    ]
  },
  cloud_software_financials: {
    id: 'cloud_software_financials',
    name: 'Cloud Software Financials',
    tableName: 'cloud_software_financials',
    category: 'Public SaaS Comps',
    description: 'Public cloud software metrics: quarterly revenue, gross margins, and YoY growth.',
    rowCount: INITIAL_FINANCIALS_DATA.length,
    columns: [
      { name: 'company', type: 'VARCHAR', description: 'Company Name' },
      { name: 'ticker', type: 'VARCHAR', description: 'Stock Ticker' },
      { name: 'segment', type: 'VARCHAR', description: 'Software Market Segment' },
      { name: 'quarterly_revenue_m', type: 'DOUBLE', description: 'Quarterly Revenue in $M' },
      { name: 'gross_margin_pct', type: 'DOUBLE', description: 'Gross Margin %' },
      { name: 'yoy_growth_pct', type: 'DOUBLE', description: 'Year-over-Year Growth Rate %' },
      { name: 'headcount', type: 'INTEGER', description: 'Reported Full-time Employees' }
    ],
    sampleQueries: [
      { title: 'Revenue Comparison', sql: 'SELECT company, quarterly_revenue_m, gross_margin_pct FROM cloud_software_financials ORDER BY quarterly_revenue_m DESC;' }
    ]
  }
};
