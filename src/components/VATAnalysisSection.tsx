import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Lightbulb
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine
} from 'recharts';
import type { VATReturn } from '../types/turnover.types';
import type { CurrencyCode } from '../services/currencyService';
import { CurrencyService } from '../services/currencyService';

interface VATAnalysisSectionProps {
  vatReturns: VATReturn[];
  currency?: CurrencyCode;
}

export const VATAnalysisSection: React.FC<VATAnalysisSectionProps> = ({
  vatReturns,
  currency = 'AED'
}) => {
  const formatCurrency = (value: number) => CurrencyService.format(value, currency);
  const formatCompact = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return value.toFixed(0);
  };

  // Sort returns by period for trend analysis
  const sortedReturns = useMemo(() => {
    return [...vatReturns].sort((a, b) => {
      const dateA = new Date(a.startDate || a.period);
      const dateB = new Date(b.startDate || b.period);
      return dateA.getTime() - dateB.getTime();
    });
  }, [vatReturns]);

  // Chart data
  const chartData = useMemo(() => {
    return sortedReturns.map(r => ({
      period: r.period,
      taxableSales: r.taxableSales,
      outputVAT: r.outputVAT,
      inputVAT: r.inputVAT,
      netVAT: r.outputVAT - r.inputVAT,
      zeroRated: r.zeroRatedSales,
      exempt: r.exemptSales
    }));
  }, [sortedReturns]);

  // Calculate trends
  const trends = useMemo(() => {
    if (sortedReturns.length < 2) return null;

    const first = sortedReturns[0];
    const last = sortedReturns[sortedReturns.length - 1];
    
    const salesChange = first.taxableSales > 0 
      ? ((last.taxableSales - first.taxableSales) / first.taxableSales) * 100 
      : 0;
    
    const vatChange = first.outputVAT > 0 
      ? ((last.outputVAT - first.outputVAT) / first.outputVAT) * 100 
      : 0;

    const avgTaxableSales = vatReturns.reduce((sum, r) => sum + r.taxableSales, 0) / vatReturns.length;
    const avgOutputVAT = vatReturns.reduce((sum, r) => sum + r.outputVAT, 0) / vatReturns.length;

    return {
      salesChange,
      vatChange,
      avgTaxableSales,
      avgOutputVAT,
      periodsAnalyzed: sortedReturns.length
    };
  }, [sortedReturns, vatReturns]);

  // Generate insights
  const insights = useMemo(() => {
    const result: Array<{ type: 'success' | 'warning' | 'info'; message: string }> = [];
    
    if (!trends) return result;

    // Sales trend insight
    if (trends.salesChange > 10) {
      result.push({
        type: 'success',
        message: `Taxable sales increased by ${trends.salesChange.toFixed(1)}% over the analyzed period`
      });
    } else if (trends.salesChange < -10) {
      result.push({
        type: 'warning',
        message: `Taxable sales decreased by ${Math.abs(trends.salesChange).toFixed(1)}% over the analyzed period`
      });
    }

    // VAT consistency check
    const expectedVATRate = 5; // UAE standard rate
    const avgEffectiveRate = vatReturns.reduce((sum, r) => {
      const rate = r.taxableSales > 0 ? (r.outputVAT / r.taxableSales) * 100 : 0;
      return sum + rate;
    }, 0) / vatReturns.length;

    if (Math.abs(avgEffectiveRate - expectedVATRate) > 0.5) {
      result.push({
        type: 'warning',
        message: `Average effective VAT rate (${avgEffectiveRate.toFixed(2)}%) differs from standard 5% rate`
      });
    } else {
      result.push({
        type: 'success',
        message: `VAT calculations are consistent with the standard 5% rate`
      });
    }

    // Zero-rated proportion
    const totalSales = vatReturns.reduce((sum, r) => sum + r.taxableSales + r.zeroRatedSales + r.exemptSales, 0);
    const zeroRatedTotal = vatReturns.reduce((sum, r) => sum + r.zeroRatedSales, 0);
    const zeroRatedPercent = totalSales > 0 ? (zeroRatedTotal / totalSales) * 100 : 0;

    if (zeroRatedPercent > 20) {
      result.push({
        type: 'info',
        message: `${zeroRatedPercent.toFixed(1)}% of sales are zero-rated (exports/qualifying supplies)`
      });
    }

    // Net VAT position
    const totalNetVAT = vatReturns.reduce((sum, r) => sum + (r.outputVAT - r.inputVAT), 0);
    if (totalNetVAT < 0) {
      result.push({
        type: 'info',
        message: `Net VAT position is refundable - ensure refund claims are filed timely`
      });
    }

    return result;
  }, [trends, vatReturns]);

  if (vatReturns.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="space-y-6"
    >
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-accent/10">
          <BarChart3 className="h-5 w-5 text-accent" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">VAT Analysis</h3>
          <p className="text-sm text-muted-foreground">
            Trends and insights from your VAT returns
          </p>
        </div>
      </div>

      {/* Trend Cards */}
      {trends && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                {trends.salesChange >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-success" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-destructive" />
                )}
                <span className="text-xs text-muted-foreground">Sales Trend</span>
              </div>
              <p className={cn(
                "text-xl font-bold",
                trends.salesChange >= 0 ? "text-success" : "text-destructive"
              )}>
                {trends.salesChange >= 0 ? '+' : ''}{trends.salesChange.toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                {trends.vatChange >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-success" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-destructive" />
                )}
                <span className="text-xs text-muted-foreground">VAT Trend</span>
              </div>
              <p className={cn(
                "text-xl font-bold",
                trends.vatChange >= 0 ? "text-success" : "text-destructive"
              )}>
                {trends.vatChange >= 0 ? '+' : ''}{trends.vatChange.toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <span className="text-xs text-muted-foreground">Avg Taxable Sales</span>
              <p className="text-xl font-bold mt-1">{formatCurrency(trends.avgTaxableSales)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <span className="text-xs text-muted-foreground">Avg Output VAT</span>
              <p className="text-xl font-bold mt-1">{formatCurrency(trends.avgOutputVAT)}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Taxable Sales Trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Taxable Sales Trend</CardTitle>
            <CardDescription>Period-over-period comparison</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                  <XAxis 
                    dataKey="period" 
                    tick={{ fontSize: 11 }}
                    className="text-muted-foreground"
                  />
                  <YAxis 
                    tickFormatter={formatCompact}
                    tick={{ fontSize: 11 }}
                    className="text-muted-foreground"
                  />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="taxableSales" 
                    name="Taxable Sales"
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                  {trends && (
                    <ReferenceLine 
                      y={trends.avgTaxableSales} 
                      stroke="hsl(var(--muted-foreground))" 
                      strokeDasharray="5 5"
                      label={{ value: 'Avg', fontSize: 10 }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* VAT Comparison */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Output vs Input VAT</CardTitle>
            <CardDescription>VAT collected vs VAT paid</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                  <XAxis 
                    dataKey="period" 
                    tick={{ fontSize: 11 }}
                    className="text-muted-foreground"
                  />
                  <YAxis 
                    tickFormatter={formatCompact}
                    tick={{ fontSize: 11 }}
                    className="text-muted-foreground"
                  />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="outputVAT" 
                    name="Output VAT" 
                    fill="hsl(var(--destructive))" 
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="inputVAT" 
                    name="Input VAT" 
                    fill="hsl(var(--success))" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-accent" />
              Key Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insights.map((insight, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border",
                    insight.type === 'success' && "bg-success/5 border-success/20",
                    insight.type === 'warning' && "bg-warning/5 border-warning/20",
                    insight.type === 'info' && "bg-primary/5 border-primary/20"
                  )}
                >
                  {insight.type === 'success' && <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />}
                  {insight.type === 'warning' && <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />}
                  {insight.type === 'info' && <ArrowRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />}
                  <p className="text-sm">{insight.message}</p>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
};
