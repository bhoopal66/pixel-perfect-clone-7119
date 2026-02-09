import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Wallet, 
  Percent, 
  Calendar,
  BarChart3,
  Info,
  CheckCircle2,
  AlertTriangle,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { cn } from '@/lib/utils';
import type { TurnoverBalanceReport } from '../types/turnover.types';
import type { CurrencyCode } from '../services/currencyService';
import { CurrencyService } from '../services/currencyService';

interface TurnoverBalanceDashboardProps {
  report: TurnoverBalanceReport;
  currency: CurrencyCode;
}

export const TurnoverBalanceDashboard: React.FC<TurnoverBalanceDashboardProps> = ({
  report,
  currency
}) => {
  const formatCurrency = (value: number) => CurrencyService.format(value, currency);

  // Coverage color mapping
  const getCoverageConfig = (coverage: TurnoverBalanceReport['balanceCoverage']) => {
    switch (coverage) {
      case 'excellent':
        return {
          color: 'text-success',
          bg: 'bg-success/10',
          border: 'border-success/30',
          icon: CheckCircle2,
          label: 'Excellent',
          description: 'Average balance covers 100%+ of turnover'
        };
      case 'good':
        return {
          color: 'text-accent',
          bg: 'bg-accent/10',
          border: 'border-accent/30',
          icon: CheckCircle2,
          label: 'Good',
          description: 'Average balance covers 50-100% of turnover'
        };
      case 'moderate':
        return {
          color: 'text-warning',
          bg: 'bg-warning/10',
          border: 'border-warning/30',
          icon: AlertTriangle,
          label: 'Moderate',
          description: 'Average balance covers 25-50% of turnover'
        };
      case 'low':
        return {
          color: 'text-destructive',
          bg: 'bg-destructive/10',
          border: 'border-destructive/30',
          icon: AlertCircle,
          label: 'Low',
          description: 'Average balance covers less than 25% of turnover'
        };
    }
  };

  const coverageConfig = getCoverageConfig(report.balanceCoverage);
  const CoverageIcon = coverageConfig.icon;

  // Calculate monthly average
  const monthlyAvgTurnover = report.monthly.length > 0 
    ? report.totalTurnover / report.monthly.length 
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Turnover & Average Balance Analysis
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {report.companyName && `${report.companyName} • `}
            {report.analysisStartDate} to {report.analysisEndDate} ({report.totalDays} days)
          </p>
        </div>
        
        {/* Coverage Badge */}
        <div className={cn(
          "px-4 py-2 rounded-lg border flex items-center gap-2",
          coverageConfig.bg,
          coverageConfig.border
        )}>
          <CoverageIcon className={cn("h-5 w-5", coverageConfig.color)} />
          <div>
            <p className={cn("font-semibold", coverageConfig.color)}>
              {coverageConfig.label} Coverage
            </p>
            <p className="text-xs text-muted-foreground">
              {coverageConfig.description}
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Turnover Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
        >
          <Card className="h-full border-primary/20 hover:border-primary/40 transition-colors">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Sum of all credit transactions (Total Credits)</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className="text-sm font-medium text-muted-foreground">Total Turnover</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {formatCurrency(report.totalTurnover)}
              </p>
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground">Monthly Average</p>
                <p className="text-sm font-semibold text-primary">
                  {formatCurrency(monthlyAvgTurnover)}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Average Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="h-full border-accent/20 hover:border-accent/40 transition-colors">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <Wallet className="h-5 w-5 text-accent" />
                </div>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Average of all End-of-Day (EOD) closing balances</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className="text-sm font-medium text-muted-foreground">Average Balance</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {formatCurrency(report.overallAverageBalance)}
              </p>
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground">Total Debits</p>
                <p className="text-sm font-semibold text-destructive">
                  {formatCurrency(report.totalDebits)}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Avg Balance % Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className={cn(
            "h-full transition-colors",
            coverageConfig.border,
            `hover:${coverageConfig.border.replace('/30', '/50')}`
          )}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-3">
                <div className={cn("p-2 rounded-lg", coverageConfig.bg)}>
                  <Percent className={cn("h-5 w-5", coverageConfig.color)} />
                </div>
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-xs",
                    coverageConfig.color,
                    coverageConfig.border
                  )}
                >
                  {coverageConfig.label}
                </Badge>
              </div>
              <p className="text-sm font-medium text-muted-foreground">Avg Balance %</p>
              <p className={cn("text-2xl font-bold mt-1", coverageConfig.color)}>
                {report.overallAvgBalancePercentage.toFixed(2)}%
              </p>
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground">Formula</p>
                <p className="text-xs font-mono text-muted-foreground">
                  (Avg Balance / Turnover) × 100
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Analysis Period Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="h-full border-muted hover:border-muted-foreground/30 transition-colors">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
              <p className="text-sm font-medium text-muted-foreground">Analysis Period</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {report.totalDays} <span className="text-base font-normal text-muted-foreground">days</span>
              </p>
              <div className="mt-3 pt-3 border-t border-border grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">Months</p>
                  <p className="text-sm font-semibold">{report.monthly.length}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Quarters</p>
                  <p className="text-sm font-semibold">{report.quarterly.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Coverage Scale Indicator */}
      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Balance Coverage Scale</h3>
            <p className="text-sm text-muted-foreground">
              Current: <span className={cn("font-semibold", coverageConfig.color)}>
                {report.overallAvgBalancePercentage.toFixed(1)}%
              </span>
            </p>
          </div>
          
          {/* Scale Bar */}
          <div className="relative h-8 rounded-lg overflow-hidden bg-muted">
            <div className="absolute inset-0 flex">
              <div className="flex-1 bg-destructive/30 border-r border-background" />
              <div className="flex-1 bg-warning/30 border-r border-background" />
              <div className="flex-1 bg-accent/30 border-r border-background" />
              <div className="flex-1 bg-success/30" />
            </div>
            
            {/* Current Position Marker */}
            <div 
              className="absolute top-0 bottom-0 w-1 bg-foreground shadow-lg transition-all duration-500"
              style={{ 
                left: `${Math.min(Math.max(report.overallAvgBalancePercentage, 0), 100)}%`,
                transform: 'translateX(-50%)'
              }}
            />
          </div>
          
          {/* Labels */}
          <div className="flex justify-between mt-2 text-xs">
            <div className="text-center">
              <p className="text-destructive font-medium">Low</p>
              <p className="text-muted-foreground">&lt;25%</p>
            </div>
            <div className="text-center">
              <p className="text-warning font-medium">Moderate</p>
              <p className="text-muted-foreground">25-50%</p>
            </div>
            <div className="text-center">
              <p className="text-accent font-medium">Good</p>
              <p className="text-muted-foreground">50-100%</p>
            </div>
            <div className="text-center">
              <p className="text-success font-medium">Excellent</p>
              <p className="text-muted-foreground">&gt;100%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Half-Yearly Summary (if available) */}
      {report.halfYearly.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {report.halfYearly.map((half, idx) => {
            const halfCoverage = getCoverageConfig(
              half.avgBalancePercentage >= 100 ? 'excellent' :
              half.avgBalancePercentage >= 50 ? 'good' :
              half.avgBalancePercentage >= 25 ? 'moderate' : 'low'
            );
            const HalfIcon = halfCoverage.icon;
            
            return (
              <motion.div
                key={half.period}
                initial={{ opacity: 0, x: idx === 0 ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + idx * 0.1 }}
              >
                <Card className={cn("h-full", halfCoverage.border)}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{half.period}</CardTitle>
                      <Badge 
                        variant="outline" 
                        className={cn(halfCoverage.color, halfCoverage.border)}
                      >
                        <HalfIcon className="h-3 w-3 mr-1" />
                        {halfCoverage.label}
                      </Badge>
                    </div>
                    <CardDescription>
                      {half.months.join(', ')} • {half.days} days
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Turnover</p>
                        <p className="text-sm font-semibold">{formatCurrency(half.turnover)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Avg Balance</p>
                        <p className="text-sm font-semibold">{formatCurrency(half.averageBalance)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Avg Balance %</p>
                        <p className={cn("text-sm font-semibold", halfCoverage.color)}>
                          {half.avgBalancePercentage.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
