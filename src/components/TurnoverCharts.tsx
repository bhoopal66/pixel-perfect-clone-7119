import React from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { TrendingUp, BarChart3, Activity, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MonthlyTurnoverBalance, QuarterlyTurnoverBalance, TurnoverBalanceReport } from '../types/turnover.types';
import type { CurrencyCode } from '../services/currencyService';
import { CurrencyService } from '../services/currencyService';

interface TurnoverChartsProps {
  report: TurnoverBalanceReport;
  currency?: CurrencyCode;
}

export const TurnoverCharts: React.FC<TurnoverChartsProps> = ({ 
  report, 
  currency = 'AED' 
}) => {
  const formatCurrency = (value: number) => CurrencyService.format(value, currency);
  const formatCompact = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return value.toFixed(0);
  };

  // Prepare monthly data for line chart
  const monthlyData = report.monthly.map((m) => ({
    month: m.month,
    turnover: m.turnover,
    averageBalance: m.averageBalance,
    avgBalancePercentage: m.avgBalancePercentage,
    transactionCount: m.transactionCount
  }));

  // Prepare quarterly data for bar chart
  const quarterlyData = report.quarterly.map((q) => ({
    quarter: q.quarter,
    turnover: q.turnover,
    averageBalance: q.averageBalance,
    avgBalancePercentage: q.avgBalancePercentage,
    days: q.days
  }));

  // Calculate trend indicators
  const getTrend = (data: { turnover: number }[]) => {
    if (data.length < 2) return { direction: 'neutral', percentage: 0 };
    const first = data[0].turnover;
    const last = data[data.length - 1].turnover;
    const change = ((last - first) / first) * 100;
    return {
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
      percentage: Math.abs(change)
    };
  };

  const monthlyTrend = getTrend(monthlyData);
  const avgTurnover = monthlyData.reduce((sum, m) => sum + m.turnover, 0) / monthlyData.length;

  // Custom tooltip for line chart
  const MonthlyTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-card border border-border rounded-lg shadow-lg p-3 text-sm">
        <p className="font-semibold text-foreground mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 py-0.5">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-medium text-foreground">
              {entry.name.includes('%') 
                ? `${entry.value.toFixed(1)}%`
                : formatCurrency(entry.value)
              }
            </span>
          </div>
        ))}
      </div>
    );
  };

  // Custom tooltip for bar chart
  const QuarterlyTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-card border border-border rounded-lg shadow-lg p-3 text-sm">
        <p className="font-semibold text-foreground mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 py-0.5">
            <div 
              className="w-3 h-3 rounded-sm" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-medium text-foreground">
              {formatCurrency(entry.value)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Monthly Trend Line Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Monthly Turnover Trend
                </CardTitle>
                <CardDescription>
                  Turnover and average balance over time
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge 
                  variant="outline" 
                  className={cn(
                    "gap-1",
                    monthlyTrend.direction === 'up' 
                      ? "text-success border-success/30" 
                      : monthlyTrend.direction === 'down'
                      ? "text-destructive border-destructive/30"
                      : "text-muted-foreground"
                  )}
                >
                  {monthlyTrend.direction === 'up' ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : monthlyTrend.direction === 'down' ? (
                    <ArrowDownRight className="h-3 w-3" />
                  ) : null}
                  {monthlyTrend.percentage.toFixed(1)}% trend
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={monthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="turnoverGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="hsl(var(--border))" 
                    vertical={false}
                  />
                  <XAxis 
                    dataKey="month" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={formatCompact}
                  />
                  <Tooltip content={<MonthlyTooltip />} />
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                    iconType="circle"
                  />
                  <ReferenceLine 
                    y={avgTurnover} 
                    stroke="hsl(var(--muted-foreground))" 
                    strokeDasharray="5 5"
                    label={{ 
                      value: `Avg: ${formatCompact(avgTurnover)}`, 
                      position: 'right',
                      fill: 'hsl(var(--muted-foreground))',
                      fontSize: 11
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="turnover"
                    name="Turnover"
                    stroke="hsl(var(--primary))"
                    fill="url(#turnoverGradient)"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="averageBalance"
                    name="Avg Balance"
                    stroke="hsl(var(--accent))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--accent))', strokeWidth: 0, r: 4 }}
                    activeDot={{ r: 6, fill: 'hsl(var(--accent))' }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Monthly Balance Percentage Sparkline */}
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Avg Balance % by Month
              </p>
              <div className="h-[80px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <XAxis 
                      dataKey="month" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      hide 
                      domain={[0, 'dataMax + 10']}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`${value.toFixed(1)}%`, 'Avg Balance %']}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="avgBalancePercentage"
                      stroke="hsl(var(--success))"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--success))', strokeWidth: 0, r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quarterly Comparison Bar Chart */}
      {quarterlyData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-accent" />
                Quarterly Comparison
              </CardTitle>
              <CardDescription>
                Turnover vs average balance by quarter
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={quarterlyData} 
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    barCategoryGap="20%"
                  >
                    <CartesianGrid 
                      strokeDasharray="3 3" 
                      stroke="hsl(var(--border))" 
                      vertical={false}
                    />
                    <XAxis 
                      dataKey="quarter" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={formatCompact}
                    />
                    <Tooltip content={<QuarterlyTooltip />} />
                    <Legend 
                      wrapperStyle={{ paddingTop: '20px' }}
                      iconType="square"
                    />
                    <Bar 
                      dataKey="turnover" 
                      name="Turnover"
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar 
                      dataKey="averageBalance" 
                      name="Avg Balance"
                      fill="hsl(var(--accent))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Quarterly Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-border">
                {quarterlyData.map((q, index) => (
                  <motion.div
                    key={q.quarter}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="bg-muted/30 rounded-lg p-3"
                  >
                    <p className="text-xs text-muted-foreground">{q.quarter}</p>
                    <p className="text-sm font-semibold text-foreground mt-1">
                      {formatCompact(q.turnover)}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <div 
                        className={cn(
                          "text-xs px-1.5 py-0.5 rounded",
                          q.avgBalancePercentage >= 50 
                            ? "bg-success/20 text-success" 
                            : q.avgBalancePercentage >= 25
                            ? "bg-warning/20 text-warning"
                            : "bg-destructive/20 text-destructive"
                        )}
                      >
                        {q.avgBalancePercentage.toFixed(1)}%
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Half-Yearly Comparison (if available) */}
      {report.halfYearly.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-success" />
                Half-Yearly Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {report.halfYearly.map((h, index) => (
                  <motion.div
                    key={h.period}
                    initial={{ opacity: 0, x: index === 0 ? -20 : 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className={cn(
                      "p-4 rounded-lg border",
                      index === 0 ? "bg-primary/5 border-primary/20" : "bg-accent/5 border-accent/20"
                    )}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold">{h.period}</h4>
                      <Badge 
                        variant="outline"
                        className={cn(
                          h.avgBalancePercentage >= 50 
                            ? "bg-success/20 text-success border-success/30" 
                            : h.avgBalancePercentage >= 25
                            ? "bg-warning/20 text-warning border-warning/30"
                            : "bg-destructive/20 text-destructive border-destructive/30"
                        )}
                      >
                        {h.avgBalancePercentage.toFixed(1)}% Balance
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Turnover</span>
                        <span className="font-medium">{formatCurrency(h.turnover)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Avg Balance</span>
                        <span className="font-medium">{formatCurrency(h.averageBalance)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Days</span>
                        <span className="font-medium">{h.days} days</span>
                      </div>
                    </div>
                    {/* Visual progress bar */}
                    <div className="mt-3 pt-3 border-t border-border">
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full transition-all",
                            h.avgBalancePercentage >= 50 
                              ? "bg-success" 
                              : h.avgBalancePercentage >= 25
                              ? "bg-warning"
                              : "bg-destructive"
                          )}
                          style={{ width: `${Math.min(h.avgBalancePercentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};
