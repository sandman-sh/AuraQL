import React, { useMemo } from 'react';
import { TrendingUp, AlertTriangle, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { DatasetId } from '../../types';
import { auraEngine } from '../../engine/auraql';
import { DATASETS_METADATA } from '../../engine/datasets';

interface InsightBannerProps {
  dataset: DatasetId;
  onActionClick: (sql: string) => void;
}

export const InsightBanner: React.FC<InsightBannerProps> = ({ dataset, onActionClick }) => {
  const insight = useMemo(() => {
    const meta = DATASETS_METADATA[dataset];
    if (!meta) {
      return {
        badge: 'Automated Data Audit',
        icon: Sparkles,
        color: 'text-brand-600 dark:text-brand-400',
        border: 'border-brand-500/30',
        bg: 'bg-brand-50 dark:bg-brand-950/40',
        title: 'Dataset Ready for Analysis',
        desc: 'All attributes parsed and available for OLAP aggregations.',
        actionText: 'Sample First 20 Records',
        sql: `SELECT * FROM ${String(dataset)} LIMIT 20;`
      };
    }

    const rows = auraEngine.getTableData(meta.tableName);

    if (dataset === 'ecommerce') {
      // Compute real APAC stats
      const apacRows = rows.filter(r => r.region === 'APAC');
      const apacRev = apacRows.reduce((sum, r) => sum + (Number(r.revenue) || 0), 0);
      const apacMargin = apacRows.length > 0
        ? apacRows.reduce((sum, r) => sum + (Number(r.gross_margin_pct) || 0), 0) / apacRows.length
        : 0;
      const globalMargin = rows.length > 0
        ? rows.reduce((sum, r) => sum + (Number(r.gross_margin_pct) || 0), 0) / rows.length
        : 0;
      const marginDelta = apacMargin - globalMargin;

      return {
        badge: 'Executive Anomaly Alert',
        icon: TrendingUp,
        color: 'text-emerald-600 dark:text-emerald-400',
        border: 'border-emerald-500/30',
        bg: 'bg-emerald-50 dark:bg-emerald-950/40',
        title: `High-Margin Expansion in APAC (${apacRows.length} orders)`,
        desc: `APAC region generated $${Math.round(apacRev).toLocaleString()} in net revenue with ${apacMargin.toFixed(1)}% average margin (${marginDelta >= 0 ? '+' : ''}${marginDelta.toFixed(1)}% vs global mean of ${globalMargin.toFixed(1)}%).`,
        actionText: 'Isolate APAC Revenue Cohort',
        sql: "SELECT product_category, ROUND(SUM(revenue), 2) as total_rev, ROUND(AVG(gross_margin_pct), 1) as avg_margin FROM ecommerce_sales WHERE region = 'APAC' GROUP BY product_category ORDER BY total_rev DESC;"
      };
    }

    if (dataset === 'churn') {
      // Compute real at-risk accounts
      const atRisk = rows.filter(r => r.health_score < 45);
      const atRiskMrr = atRisk.reduce((sum, r) => sum + (Number(r.monthly_mrr) || 0), 0);

      return {
        badge: 'Critical Retention Warning',
        icon: AlertTriangle,
        color: 'text-rose-600 dark:text-rose-400',
        border: 'border-rose-500/30',
        bg: 'bg-rose-50 dark:bg-rose-950/40',
        title: `${atRisk.length} Accounts Flagged with Health < 45.0`,
        desc: `$${Math.round(atRiskMrr).toLocaleString()} monthly MRR at risk (annualized: $${Math.round(atRiskMrr * 12).toLocaleString()}) with elevated support ticket frequency.`,
        actionText: 'Inspect At-Risk Accounts',
        sql: "SELECT company_name, monthly_mrr, health_score, churn_risk FROM saas_churn_metrics WHERE health_score < 45 ORDER BY monthly_mrr DESC LIMIT 10;"
      };
    }

    if (dataset === 'webvitals') {
      // Compute real checkout mobile LCP
      const checkoutMobile = rows.filter(r => r.url_path === '/checkout' && r.device_type === 'Mobile');
      const avgLcp = checkoutMobile.length > 0
        ? checkoutMobile.reduce((sum, r) => sum + (Number(r.lcp_ms) || 0), 0) / checkoutMobile.length
        : 0;
      const poorCount = rows.filter(r => r.vital_rating === 'Poor').length;

      return {
        badge: 'Infrastructure SLA Breach',
        icon: ShieldCheck,
        color: 'text-amber-600 dark:text-amber-400',
        border: 'border-amber-500/30',
        bg: 'bg-amber-50 dark:bg-amber-950/40',
        title: `Mobile /checkout LCP at ${Math.round(avgLcp)}ms (${checkoutMobile.length} samples)`,
        desc: `${poorCount} total sessions rated "Poor" across all routes. /checkout on mobile exceeds 2,500ms LCP threshold, impacting conversion funnel.`,
        actionText: 'Audit Checkout Telemetry',
        sql: "SELECT url_path, device_type, ROUND(AVG(lcp_ms), 0) as avg_lcp_ms, ROUND(AVG(cls_score), 3) as avg_cls FROM web_vitals_telemetry WHERE url_path = '/checkout' GROUP BY url_path, device_type;"
      };
    }

    return {
      badge: 'Automated Data Audit',
      icon: Sparkles,
      color: 'text-brand-600 dark:text-brand-400',
      border: 'border-brand-500/30',
      bg: 'bg-brand-50 dark:bg-brand-950/40',
      title: `${rows.length} Records Loaded into Columnar Buffer`,
      desc: 'All attributes parsed and available for high-speed OLAP aggregations and WebMCP tool queries.',
      actionText: 'Sample First 20 Records',
      sql: `SELECT * FROM ${meta.tableName} LIMIT 20;`
    };
  }, [dataset]);

  const Icon = insight.icon;

  return (
    <div className={`p-3.5 border ${insight.border} ${insight.bg} rounded-none flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all`}>
      <div className="flex items-start gap-3 min-w-0">
        <div className="w-7 h-7 shrink-0 rounded-none bg-white dark:bg-dark-900 border border-slate-200 dark:border-white/10 flex items-center justify-center shadow-sm">
          <Icon className={`w-3.5 h-3.5 ${insight.color}`} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
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
