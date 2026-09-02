import React from 'react';
import { Sparkles, TrendingUp, AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';
import { DatasetId } from '../../types';

interface InsightBannerProps {
  dataset: DatasetId;
  onActionClick: (sql: string) => void;
}

export const InsightBanner: React.FC<InsightBannerProps> = ({ dataset, onActionClick }) => {
  const getInsight = () => {
    switch (dataset) {
      case 'ecommerce':
        return {
          badge: 'Executive Anomaly Alert',
          icon: TrendingUp,
          color: 'text-emerald-600 dark:text-emerald-400',
          border: 'border-emerald-500/30',
          bg: 'bg-emerald-50 dark:bg-emerald-950/40',
          title: 'High-Margin Expansion Detected in APAC Electronics',
          desc: 'APAC region is generating $48,200 in net revenue with average profit margins exceeding 56.4% (+4.2% over global mean).',
          actionText: 'Isolate APAC Revenue Cohort',
          sql: "SELECT product_category, ROUND(SUM(revenue), 2) as total_rev, ROUND(AVG(gross_margin_pct), 1) as avg_margin FROM ecommerce_sales WHERE region = 'APAC' GROUP BY product_category ORDER BY total_rev DESC;"
        };
      case 'churn':
        return {
          badge: 'Critical Retention Warning',
          icon: AlertTriangle,
          color: 'text-rose-600 dark:text-rose-400',
          border: 'border-rose-500/30',
          bg: 'bg-rose-50 dark:bg-rose-950/40',
          title: '12 Enterprise Accounts Flagged with Low Health (<45.0)',
          desc: 'Identified $78,400 in Monthly Recurring Revenue (ARR risk: $940k) exhibiting declining seat utilization and elevated support ticket frequency.',
          actionText: 'Inspect At-Risk Accounts',
          sql: "SELECT company_name, monthly_mrr, health_score, churn_risk FROM saas_churn_metrics WHERE health_score < 45 ORDER BY monthly_mrr DESC LIMIT 10;"
        };
      case 'webvitals':
        return {
          badge: 'Infrastructure SLA Breach',
          icon: ShieldCheck,
          color: 'text-amber-600 dark:text-amber-400',
          border: 'border-amber-500/30',
          bg: 'bg-amber-50 dark:bg-amber-950/40',
          title: 'Mobile Checkout Route Exceeding 2,500ms LCP Threshold',
          desc: 'Telemetry indicates /checkout route has a P95 Largest Contentful Paint of 3,120ms on 4G connections, impacting conversion funnel efficiency.',
          actionText: 'Audit Checkout Telemetry',
          sql: "SELECT url_path, device_type, ROUND(AVG(lcp_ms), 0) as avg_lcp_ms, ROUND(AVG(cls_score), 3) as avg_cls FROM web_vitals_telemetry WHERE url_path = '/checkout' GROUP BY url_path, device_type;"
        };
      default:
        return {
          badge: 'Automated Data Audit',
          icon: Sparkles,
          color: 'text-brand-600 dark:text-brand-400',
          border: 'border-brand-500/30',
          bg: 'bg-brand-50 dark:bg-brand-950/40',
          title: 'Dataset Ingested & Columnar Index Ready',
          desc: 'All attributes parsed and available for high-speed OLAP aggregations and WebMCP tool queries.',
          actionText: 'Sample First 20 Records',
          sql: `SELECT * FROM ${String(dataset)} LIMIT 20;`
        };
    }
  };

  const insight = getInsight();
  const Icon = insight.icon;

  return (
    <div className={`p-3.5 border ${insight.border} ${insight.bg} rounded-none flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all`}>
      <div className="flex items-start gap-3">
        <div className="w-7 h-7 shrink-0 rounded-none bg-white dark:bg-dark-900 border border-slate-200 dark:border-white/10 flex items-center justify-center shadow-sm">
          <Icon className={`w-3.5 h-3.5 ${insight.color}`} />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${insight.color}`}>
              {insight.badge}
            </span>
            <span className="text-slate-400 dark:text-slate-600">•</span>
            <span className="text-xs font-bold text-slate-900 dark:text-white font-mono">
              {insight.title}
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 font-sans leading-normal">
            {insight.desc}
          </p>
        </div>
      </div>

      <button
        onClick={() => onActionClick(insight.sql)}
        className="btn-sharp shrink-0 px-3 py-1.5 bg-white dark:bg-dark-900 hover:bg-slate-50 dark:hover:bg-dark-850 text-slate-800 dark:text-white text-xs font-mono font-semibold border border-slate-300 dark:border-white/10 hover:border-brand-500/50 flex items-center gap-1.5 shadow-sm transition-all"
      >
        <span>{insight.actionText}</span>
        <ArrowRight className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
      </button>
    </div>
  );
};
