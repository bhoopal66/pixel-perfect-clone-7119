import React from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Percent,
  Building2,
  Users,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface GlobalMetrics {
  totalApplications: number;
  approved: number;
  declined: number;
  pending: number;
  avgApprovalRate: number;
  avgTAT: number;
  activeLenders: number;
  activeAgents: number;
  redCases: number;
  trends: {
    applications: number; // percentage change
    approvals: number;
    tat: number;
  };
}

interface GlobalMetricsCardsProps {
  metrics: GlobalMetrics;
  isLoading?: boolean;
}

export function GlobalMetricsCards({ metrics, isLoading }: GlobalMetricsCardsProps) {
  const cards = [
    {
      title: 'Total Applications',
      value: metrics.totalApplications,
      icon: BarChart3,
      trend: metrics.trends.applications,
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    {
      title: 'Approved',
      value: metrics.approved,
      icon: CheckCircle,
      trend: metrics.trends.approvals,
      color: 'text-success',
      bgColor: 'bg-success/10'
    },
    {
      title: 'Declined',
      value: metrics.declined,
      icon: XCircle,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10'
    },
    {
      title: 'Pending',
      value: metrics.pending,
      icon: Clock,
      color: 'text-warning',
      bgColor: 'bg-warning/10'
    },
    {
      title: 'Approval Rate',
      value: `${metrics.avgApprovalRate}%`,
      icon: Percent,
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    {
      title: 'Avg TAT (days)',
      value: metrics.avgTAT,
      icon: Clock,
      trend: metrics.trends.tat,
      invertTrend: true, // Lower is better
      color: 'text-muted-foreground',
      bgColor: 'bg-muted'
    },
    {
      title: 'Active Lenders',
      value: metrics.activeLenders,
      icon: Building2,
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    {
      title: 'Active Agents',
      value: metrics.activeAgents,
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array(8).fill(0).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-muted rounded w-24" />
                <div className="h-8 bg-muted rounded w-16" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg ${card.bgColor}`}>
                  <card.icon className={`h-4 w-4 ${card.color}`} />
                </div>
                {card.trend !== undefined && (
                  <div className={`flex items-center gap-1 text-xs ${
                    (card.invertTrend ? card.trend < 0 : card.trend > 0)
                      ? 'text-success'
                      : card.trend === 0
                        ? 'text-muted-foreground'
                        : 'text-destructive'
                  }`}>
                    {card.trend > 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : card.trend < 0 ? (
                      <TrendingDown className="h-3 w-3" />
                    ) : null}
                    <span>{Math.abs(card.trend)}%</span>
                  </div>
                )}
              </div>
              <p className="text-2xl font-bold">{card.value}</p>
              <p className="text-xs text-muted-foreground">{card.title}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}

      {/* Red Cases Alert Card */}
      {metrics.redCases > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="col-span-2 md:col-span-4"
        >
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/20">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="font-semibold text-destructive">
                  {metrics.redCases} case{metrics.redCases > 1 ? 's' : ''} require immediate attention
                </p>
                <p className="text-sm text-muted-foreground">
                  These cases have exceeded SLA thresholds and need escalation
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
