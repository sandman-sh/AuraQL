import { DatasetMetadata } from '../types';

export const DATASETS_METADATA: Record<string, DatasetMetadata> = {
  ecommerce: {
    id: 'ecommerce',
    name: 'E-Commerce Flash Sale & Margin Matrix',
    tableName: 'ecommerce_sales',
    category: 'Retail & Commerce',
    description: 'Real-time order line-items, product categories, discounts, gross margins, and fulfillment statuses.',
    rowCount: 240,
    columns: [
      { name: 'order_id', type: 'VARCHAR', description: 'Unique order identifier' },
      { name: 'order_date', type: 'TIMESTAMP', description: 'Transaction timestamp' },
      { name: 'product_category', type: 'VARCHAR', description: 'Category (Electronics, Apparel, Home, Fitness, Audio)' },
      { name: 'region', type: 'VARCHAR', description: 'Geographic market (North America, EMEA, APAC, LATAM)' },
      { name: 'customer_tier', type: 'VARCHAR', description: 'Customer status (VIP, Enterprise, Retail, New)' },
      { name: 'units_sold', type: 'INTEGER', description: 'Quantity ordered' },
      { name: 'unit_price', type: 'DOUBLE', description: 'Price per unit in USD' },
      { name: 'discount_pct', type: 'DOUBLE', description: 'Promotional discount rate' },
      { name: 'revenue', type: 'DOUBLE', description: 'Net revenue after discount' },
      { name: 'gross_margin_pct', type: 'DOUBLE', description: 'Profit margin percentage' },
      { name: 'fulfillment_status', type: 'VARCHAR', description: 'Fulfillment stage (Delivered, In Transit, Processing)' }
    ],
    sampleQueries: [
      {
        title: 'Revenue & Margin by Category',
        sql: 'SELECT product_category, ROUND(SUM(revenue), 2) as total_rev, ROUND(AVG(gross_margin_pct), 1) as avg_margin FROM ecommerce_sales GROUP BY product_category ORDER BY total_rev DESC;'
      },
      {
        title: 'Regional Order Velocity',
        sql: 'SELECT region, COUNT(order_id) as total_orders, ROUND(SUM(revenue), 2) as total_revenue FROM ecommerce_sales GROUP BY region ORDER BY total_revenue DESC;'
      },
      {
        title: 'VIP vs Standard Customer Revenue',
        sql: 'SELECT customer_tier, COUNT(order_id) as order_count, ROUND(AVG(revenue), 2) as avg_order_value FROM ecommerce_sales GROUP BY customer_tier;'
      }
    ]
  },
  churn: {
    id: 'churn',
    name: 'SaaS ARR & Customer Health Matrix',
    tableName: 'saas_churn_metrics',
    category: 'Enterprise SaaS',
    description: 'Account-level recurring revenue, seat utilization, product engagement score, and churn probability.',
    rowCount: 200,
    columns: [
      { name: 'company_name', type: 'VARCHAR', description: 'Client account name' },
      { name: 'plan_tier', type: 'VARCHAR', description: 'Subscription tier (Enterprise, Growth, Starter)' },
      { name: 'monthly_mrr', type: 'DOUBLE', description: 'Monthly Recurring Revenue ($USD)' },
      { name: 'seat_count', type: 'INTEGER', description: 'Licensed active user seats' },
      { name: 'utilization_pct', type: 'DOUBLE', description: 'Monthly active seat utilization rate' },
      { name: 'nps_score', type: 'INTEGER', description: 'Net Promoter Score (-100 to 100)' },
      { name: 'support_tickets_30d', type: 'INTEGER', description: 'Inbound support ticket count' },
      { name: 'health_score', type: 'DOUBLE', description: 'Computed health score (0-100)' },
      { name: 'churn_risk', type: 'VARCHAR', description: 'Risk categorization (Low, Medium, High, Critical)' }
    ],
    sampleQueries: [
      {
        title: 'ARR at Risk by Churn Severity',
        sql: 'SELECT churn_risk, COUNT(*) as accounts, ROUND(SUM(monthly_mrr), 2) as total_mrr_at_risk FROM saas_churn_metrics GROUP BY churn_risk ORDER BY total_mrr_at_risk DESC;'
      },
      {
        title: 'MRR and Seat Utilization by Plan',
        sql: 'SELECT plan_tier, ROUND(AVG(monthly_mrr), 2) as avg_mrr, ROUND(AVG(utilization_pct), 1) as avg_seat_utilization FROM saas_churn_metrics GROUP BY plan_tier;'
      },
      {
        title: 'Critical Accounts with Low Health',
        sql: 'SELECT company_name, monthly_mrr, health_score, churn_risk FROM saas_churn_metrics WHERE health_score < 50 ORDER BY monthly_mrr DESC LIMIT 10;'
      }
    ]
  },
  webvitals: {
    id: 'webvitals',
    name: 'Core Web Vitals & Frontend Telemetry',
    tableName: 'web_vitals_telemetry',
    category: 'DevOps & Chrome Telemetry',
    description: 'Synthetic field data tracking Largest Contentful Paint (LCP), Cumulative Layout Shift (CLS), and INP.',
    rowCount: 250,
    columns: [
      { name: 'url_path', type: 'VARCHAR', description: 'Web route visited' },
      { name: 'device_type', type: 'VARCHAR', description: 'Client hardware form factor (Mobile, Desktop, Tablet)' },
      { name: 'lcp_ms', type: 'DOUBLE', description: 'Largest Contentful Paint (ms)' },
      { name: 'cls_score', type: 'DOUBLE', description: 'Cumulative Layout Shift score' },
      { name: 'inp_ms', type: 'DOUBLE', description: 'Interaction to Next Paint (ms)' },
      { name: 'network_type', type: 'VARCHAR', description: 'Client connection speed (5G, 4G, WiFi)' },
      { name: 'vital_rating', type: 'VARCHAR', description: 'Overall assessment (Good, Needs Improvement, Poor)' }
    ],
    sampleQueries: [
      {
        title: 'P95 Core Web Vitals by Device',
        sql: 'SELECT device_type, ROUND(AVG(lcp_ms), 0) as avg_lcp_ms, ROUND(AVG(cls_score), 3) as avg_cls, ROUND(AVG(inp_ms), 0) as avg_inp_ms FROM web_vitals_telemetry GROUP BY device_type;'
      },
      {
        title: 'Worst Performing Routes (Poor Rating)',
        sql: "SELECT url_path, COUNT(*) as incident_count, ROUND(AVG(lcp_ms), 0) as avg_lcp FROM web_vitals_telemetry WHERE vital_rating = 'Poor' GROUP BY url_path ORDER BY incident_count DESC;"
      },
      {
        title: 'Network Impact on LCP Timing',
        sql: 'SELECT network_type, ROUND(AVG(lcp_ms), 0) as avg_lcp_ms, COUNT(*) as sample_size FROM web_vitals_telemetry GROUP BY network_type ORDER BY avg_lcp_ms ASC;'
      }
    ]
  }
};

// Generates high quality deterministic datasets
export function generateSeedData(): Record<string, Record<string, any>[]> {
  // 1. E-Commerce
  const categories = ['Electronics', 'Apparel', 'Home & Living', 'Fitness Gear', 'Audio & HiFi'];
  const regions = ['North America', 'EMEA', 'APAC', 'LATAM'];
  const tiers = ['VIP', 'Enterprise', 'Retail', 'New'];
  const statuses = ['Delivered', 'In Transit', 'Processing'];

  const ecommerce: Record<string, any>[] = [];
  for (let i = 1; i <= 240; i++) {
    const category = categories[i % categories.length];
    const region = regions[(i * 3) % regions.length];
    const tier = tiers[(i * 2) % tiers.length];
    const basePrice = category === 'Electronics' ? 420 : category === 'Audio & HiFi' ? 260 : category === 'Fitness Gear' ? 140 : category === 'Apparel' ? 85 : 120;
    const unitPrice = +(basePrice + (i % 15) * 12).toFixed(2);
    const units = (i % 8) + 1;
    const discount = i % 5 === 0 ? 0.2 : i % 3 === 0 ? 0.1 : 0.05;
    const rev = +(units * unitPrice * (1 - discount)).toFixed(2);
    const margin = +(35 + ((i * 7) % 35)).toFixed(1);

    ecommerce.push({
      order_id: `ORD-${1000 + i}`,
      order_date: `2026-0${1 + (i % 8)}-${10 + (i % 18)}`,
      product_category: category,
      region: region,
      customer_tier: tier,
      units_sold: units,
      unit_price: unitPrice,
      discount_pct: discount,
      revenue: rev,
      gross_margin_pct: margin,
      fulfillment_status: statuses[i % statuses.length]
    });
  }

  // 2. SaaS Churn
  const plans = ['Enterprise', 'Growth', 'Starter'];
  const churnRisks = ['Low', 'Low', 'Low', 'Medium', 'Medium', 'High', 'Critical'];
  const companyPrefixes = ['Nexus', 'Vortex', 'Starlight', 'Hyperion', 'Cortex', 'Omni', 'Pulse', 'Aether', 'Quantum', 'Synthetix'];
  const companySuffixes = ['Cloud', 'Labs', 'Analytics', 'Health', 'Media', 'Dynamics', 'AI', 'Security'];

  const churn: Record<string, any>[] = [];
  for (let i = 1; i <= 200; i++) {
    const p1 = companyPrefixes[i % companyPrefixes.length];
    const p2 = companySuffixes[(i * 4) % companySuffixes.length];
    const plan = plans[i % plans.length];
    const mrr = plan === 'Enterprise' ? +(4800 + (i * 35) % 8000).toFixed(2) : plan === 'Growth' ? +(1400 + (i * 20) % 2200).toFixed(2) : +(390 + (i * 12) % 600).toFixed(2);
    const seats = plan === 'Enterprise' ? 150 + (i % 300) : plan === 'Growth' ? 30 + (i % 70) : 5 + (i % 20);
    const health = +Math.max(18, Math.min(99, 85 - (i % 45) + ((i * 3) % 25))).toFixed(1);
    const risk = health < 40 ? 'Critical' : health < 60 ? 'High' : health < 75 ? 'Medium' : 'Low';

    churn.push({
      company_name: `${p1} ${p2} ${10 + (i % 90)}`,
      plan_tier: plan,
      monthly_mrr: mrr,
      seat_count: seats,
      utilization_pct: +(55 + (health * 0.4)).toFixed(1),
      nps_score: Math.round((health - 50) * 1.8),
      support_tickets_30d: risk === 'Critical' ? 8 + (i % 7) : risk === 'High' ? 4 + (i % 4) : 1 + (i % 2),
      health_score: health,
      churn_risk: risk
    });
  }

  // 3. Web Vitals
  const paths = ['/dashboard', '/checkout', '/pricing', '/catalog', '/settings', '/api-docs'];
  const devices = ['Mobile', 'Desktop', 'Tablet'];
  const nets = ['5G', 'WiFi', '4G'];

  const webvitals: Record<string, any>[] = [];
  for (let i = 1; i <= 250; i++) {
    const path = paths[i % paths.length];
    const device = devices[i % devices.length];
    const net = nets[(i * 2) % nets.length];
    const multiplier = device === 'Mobile' ? 1.4 : device === 'Tablet' ? 1.15 : 0.85;
    const lcp = Math.round((1200 + (i * 23) % 2800) * multiplier);
    const cls = +((0.02 + ((i * 7) % 22) / 100) * (device === 'Mobile' ? 1.3 : 1)).toFixed(3);
    const inp = Math.round((60 + (i * 11) % 280) * multiplier);

    const isGood = lcp < 2500 && cls < 0.1 && inp < 200;
    const isPoor = lcp > 4000 || cls > 0.25 || inp > 500;
    const rating = isGood ? 'Good' : isPoor ? 'Poor' : 'Needs Improvement';

    webvitals.push({
      url_path: path,
      device_type: device,
      lcp_ms: lcp,
      cls_score: cls,
      inp_ms: inp,
      network_type: net,
      vital_rating: rating
    });
  }

  return {
    ecommerce_sales: ecommerce,
    saas_churn_metrics: churn,
    web_vitals_telemetry: webvitals
  };
}
