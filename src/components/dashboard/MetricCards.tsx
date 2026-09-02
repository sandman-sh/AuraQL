import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, Percent, ShoppingBag, Users, AlertTriangle, Activity, Gauge, Zap } from 'lucide-react';
import { DatasetId } from '../../types';

interface MetricCardsProps {
  dataset: DatasetId;
}

export const MetricCards: React.FC<MetricCardsProps> = ({ dataset }) => {
  const getMetrics = () => {
    switch (dataset) {
      case 'ecommerce':
        return [
          {
            id: 'rev',
            title: 'Total Gross Revenue',
            value: '$184,390.50',
            change: '+14.8%',
            isPositive: true,
            sublabel: 'vs previous 30-day cohort',
            icon: DollarSign,
            sparkline: [35, 42, 40, 58, 62, 75, 88, 94]
          },
          {
            id: 'margin',
            title: 'Average Gross Margin',
            value: '53.6%',
            change: '+3.2%',
            isPositive: true,
            sublabel: 'across 5 product categories',
            icon: Percent,
            sparkline: [48, 50, 49, 51, 52, 54, 53, 56]
          },
          {
            id: 'orders',
            title: 'Order Velocity',
            value: '1,420 orders',
            change: '+8.4%',
            isPositive: true,
            sublabel: 'avg 5.8 units/basket',
            icon: ShoppingBag,
            sparkline: [120, 140, 130, 160, 155, 180, 195, 210]
          },
          {
            id: 'vip',
            title: 'VIP Account Ratio',
            value: '38.2%',
            change: '+6.1%',
            isPositive: true,
            sublabel: 'highest revenue tier',
            icon: Users,
            sparkline: [25, 28, 30, 31, 34, 35, 36, 38]
          }
        ];

      case 'churn':
        return [
          {
            id: 'mrr',
            title: 'Active Subscription MRR',
            value: '$432,600',
            change: '+16.2%',
            isPositive: true,
            sublabel: '200 enterprise accounts',
            icon: DollarSign,
            sparkline: [380, 395, 405, 412, 420, 425, 432]
          },
          {
            id: 'risk',
            title: 'Accounts at Churn Risk',
            value: '12 accounts',
            change: '-4.8%',
            isPositive: true, // fewer churn risk accounts is good
            sublabel: 'health score < 45.0',
            icon: AlertTriangle,
            sparkline: [22, 19, 18, 16, 15, 13, 12]
          },
          {
            id: 'seats',
            title: 'Seat Utilization',
            value: '79.4%',
            change: '+4.1%',
            isPositive: true,
            sublabel: 'monthly active ratio',
            icon: Activity,
            sparkline: [70, 72, 73, 75, 77, 78, 79]
          },
          {
            id: 'nps',
            title: 'Computed NPS Index',
            value: '+52 NPS',
            change: '+8 pts',
            isPositive: true,
            sublabel: 'inbound sentiment score',
            icon: Zap,
            sparkline: [40, 42, 45, 47, 49, 50, 52]
          }
        ];

      case 'webvitals':
        return [
          {
            id: 'lcp',
            title: 'Largest Contentful Paint (P75)',
            value: '1,820 ms',
            change: '-14% faster',
            isPositive: true,
            sublabel: 'target: <2,500ms',
            icon: Gauge,
            sparkline: [2400, 2200, 2100, 1950, 1900, 1820]
          },
          {
            id: 'cls',
            title: 'Cumulative Layout Shift',
            value: '0.041',
            change: 'Optimal',
            isPositive: true,
            sublabel: 'target: <0.10',
            icon: Activity,
            sparkline: [0.08, 0.07, 0.06, 0.05, 0.045, 0.041]
          },
          {
            id: 'inp',
            title: 'Interaction to Next Paint',
            value: '78 ms',
            change: '-18ms',
            isPositive: true,
            sublabel: 'target: <200ms',
            icon: Zap,
            sparkline: [110, 102, 95, 88, 82, 78]
          },
          {
            id: 'poor',
            title: 'Poor Experience Ratio',
            value: '3.6%',
            change: '-2.1%',
            isPositive: true,
            sublabel: '250 telemetry sessions',
            icon: AlertTriangle,
            sparkline: [8.2, 7.1, 5.8, 4.9, 4.2, 3.6]
          }
        ];

      default:
        return [];
    }
  };

  const metrics = getMetrics();

  // Helper to render sparkline SVG
  const renderSparkline = (points: number[]) => {
    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;
    const width = 80;
    const height = 24;

    const coords = points.map((p, i) => {
      const x = (i / (points.length - 1)) * width;
      const y = height - ((p - min) / range) * (height - 6) - 3;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg width={width} height={height} className="overflow-visible">
        <polyline
          fill="none"
          stroke="#A855F7"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={coords}
        />
      </svg>
    );
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((m) => {
        const Icon = m.icon;
        return (
          <div
            key={m.id}
            className="glass-card rounded-2xl p-5 border border-white/[0.08] relative group overflow-hidden"
          >
            {/* Ambient purple background hover glow */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-600/10 rounded-full blur-xl group-hover:bg-brand-500/20 transition-all pointer-events-none" />

            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-400">{m.title}</span>
              <div className="w-8 h-8 rounded-lg bg-brand-950/80 border border-brand-500/30 flex items-center justify-center text-brand-400">
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-baseline justify-between gap-2 mb-2">
              <span className="text-2xl font-extrabold text-white tracking-tight font-mono tabular-nums">
                {m.value}
              </span>
              <div className="flex items-center gap-1 text-xs font-mono font-medium text-emerald-400">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>{m.change}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-[11px] text-slate-400">
              <span className="truncate">{m.sublabel}</span>
              <div className="shrink-0">{renderSparkline(m.sparkline)}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
