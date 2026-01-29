import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  DollarSign, 
  Calendar,
  Info,
  BarChart3,
  PieChart
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from './ui/table';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';
import type { TurnoverAnalysisSummary, MonthlyTurnoverAnalysis } from '../types/turnoverAnalysis.types';
import { getAvgBalanceColorClass } from '../types/turnoverAnalysis.types';
import type { CurrencyCode } from '../services/currencyService';
import { CurrencyService } from '../services/currencyService';

interface TurnoverAnalysisViewProps {
  summary: TurnoverAnalysisSummary;
}

export const TurnoverAnalysisView: React.FC<TurnoverAnalysisViewProps> = ({ summary }) => {
  const formatCurrency = (value: number) => CurrencyService.format(value, summary.currency);

  // Calculate totals for monthly
  const monthlyTotals = summary.monthly.reduce((acc, m) => ({
    turnover: acc.turnover + m.turnover,
    totalDebits: acc.totalDebits + m.totalDebits,
    days: acc.days + m.days
  }), { turnover: 0, totalDebits: 0, days: 0 });

  // Calculate overall average balance (from H1 or full period)
  const overallAvgBalance = summary.halfYearly.h1?.averageBalance || 
    summary.monthly.reduce((sum, m) => sum + m.averageBalance * m.days, 0) / monthlyTotals.days;
  
  const overallAvgBalancePct = monthlyTotals.turnover > 0 
    ? (overallAvgBalance / monthlyTotals.turnover) * 100 
    : 0;

  const getColorClass = (pct: number) => {
    const colorType = getAvgBalanceColorClass(pct);
    if (colorType === 'high') return 'text-success bg-success/10';
    if (colorType === 'medium') return 'text-warning bg-warning/10';
    return 'text-destructive bg-destructive/10';
  };

  return (
    <div className="space-y-6">
      {/* Definition Box */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-lg bg-primary/5 border border-primary/20"
      >
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div className="text-sm space-y-1">
            <p><strong>Turnover:</strong> Total Credits from Bank Statement</p>
            <p><strong>Average Balance:</strong> Average of all EOD (End of Day) Balances</p>
            <p><strong>Avg Balance %:</strong> (Average Balance / Turnover) × 100</p>
          </div>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
        >
          <Card className="h-full border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">Total Turnover</p>
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(monthlyTotals.turnover)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Total Credits ({monthlyTotals.days} days)
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="h-full border-accent/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">Average Balance</p>
                <DollarSign className="h-4 w-4 text-accent" />
              </div>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(overallAvgBalance)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Average of daily EOD balances
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className={cn("h-full", getColorClass(overallAvgBalancePct))}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Avg Balance %</p>
                <PieChart className="h-4 w-4" />
              </div>
              <p className="text-2xl font-bold">
                {overallAvgBalancePct.toFixed(2)}%
              </p>
              <p className="text-xs mt-1 opacity-80">
                {overallAvgBalancePct > 100 
                  ? 'Balance exceeds turnover' 
                  : 'Balance below turnover'}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="h-full border-muted">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">Total Debits</p>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(monthlyTotals.totalDebits)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                For reference only
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Analysis Tables */}
      <Tabs defaultValue="monthly" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="quarterly">Quarterly</TabsTrigger>
          <TabsTrigger value="halfyearly">Half-Yearly</TabsTrigger>
        </TabsList>

        {/* Monthly Analysis */}
        <TabsContent value="monthly">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Monthly Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead className="text-right">Turnover (Credits)</TableHead>
                      <TableHead className="text-right">Average Balance</TableHead>
                      <TableHead className="text-center">Avg Balance %</TableHead>
                      <TableHead className="text-center">Days</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summary.monthly.map((month) => (
                      <TableRow key={month.month}>
                        <TableCell className="font-medium">{month.month}</TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(month.turnover)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(month.averageBalance)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge 
                            variant="outline" 
                            className={cn("font-mono", getColorClass(month.avgBalancePercentage))}
                          >
                            {month.avgBalancePercentage.toFixed(2)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">{month.days}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow className="bg-muted/50 font-semibold">
                      <TableCell>Total / Avg</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(monthlyTotals.turnover)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(overallAvgBalance)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          variant="outline" 
                          className={cn("font-mono", getColorClass(overallAvgBalancePct))}
                        >
                          {overallAvgBalancePct.toFixed(2)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">{monthlyTotals.days}</TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quarterly Analysis */}
        <TabsContent value="quarterly">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Quarterly Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Quarter</TableHead>
                      <TableHead>Months</TableHead>
                      <TableHead className="text-right">Turnover</TableHead>
                      <TableHead className="text-right">Average Balance</TableHead>
                      <TableHead className="text-center">Avg Balance %</TableHead>
                      <TableHead className="text-center">Days</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summary.quarterly.map((quarter) => (
                      <TableRow key={quarter.quarter}>
                        <TableCell className="font-medium">{quarter.quarter}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {quarter.months.join(', ')}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(quarter.turnover)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(quarter.averageBalance)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge 
                            variant="outline" 
                            className={cn("font-mono", getColorClass(quarter.avgBalancePercentage))}
                          >
                            {quarter.avgBalancePercentage.toFixed(2)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">{quarter.days}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Half-Yearly Analysis */}
        <TabsContent value="halfyearly">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Half-Yearly Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Period</TableHead>
                      <TableHead className="text-right">Turnover</TableHead>
                      <TableHead className="text-right">Average Balance</TableHead>
                      <TableHead className="text-center">Avg Balance %</TableHead>
                      <TableHead className="text-center">Days</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summary.halfYearly.h1 && (
                      <TableRow>
                        <TableCell className="font-medium">
                          H1 {summary.halfYearly.h1.year} (Jan-Jun)
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(summary.halfYearly.h1.turnover)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(summary.halfYearly.h1.averageBalance)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge 
                            variant="outline" 
                            className={cn("font-mono", getColorClass(summary.halfYearly.h1.avgBalancePercentage))}
                          >
                            {summary.halfYearly.h1.avgBalancePercentage.toFixed(2)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">{summary.halfYearly.h1.days}</TableCell>
                      </TableRow>
                    )}
                    {summary.halfYearly.h2 && (
                      <TableRow>
                        <TableCell className="font-medium">
                          H2 {summary.halfYearly.h2.year} (Jul-Dec)
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(summary.halfYearly.h2.turnover)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(summary.halfYearly.h2.averageBalance)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge 
                            variant="outline" 
                            className={cn("font-mono", getColorClass(summary.halfYearly.h2.avgBalancePercentage))}
                          >
                            {summary.halfYearly.h2.avgBalancePercentage.toFixed(2)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">{summary.halfYearly.h2.days}</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                  {summary.yearly && (
                    <TableFooter>
                      <TableRow className="bg-muted/50 font-semibold">
                        <TableCell>Year {summary.yearly.year} Total</TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(summary.yearly.turnover)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(summary.yearly.averageBalance)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge 
                            variant="outline" 
                            className={cn("font-mono", getColorClass(summary.yearly.avgBalancePercentage))}
                          >
                            {summary.yearly.avgBalancePercentage.toFixed(2)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">{summary.yearly.days}</TableCell>
                      </TableRow>
                    </TableFooter>
                  )}
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
