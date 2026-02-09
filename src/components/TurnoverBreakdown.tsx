import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  MinusCircle, 
  AlertTriangle,
  Info,
  Award,
  ArrowRight,
  Lock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';
import type { TurnoverSummary, MonthlyTurnover, ExclusionStatus, TurnoverResult } from '../types/turnover.types';
import type { CurrencyCode } from '../services/currencyService';
import { CurrencyService } from '../services/currencyService';

interface TurnoverBreakdownProps {
  summary: TurnoverSummary;
  currency: CurrencyCode;
  oldTurnover: number;
  exclusionStatus?: ExclusionStatus;
  turnoverResult?: TurnoverResult;
}

export const TurnoverBreakdown: React.FC<TurnoverBreakdownProps> = ({
  summary,
  currency,
  oldTurnover,
  exclusionStatus,
  turnoverResult
}) => {
  const formatCurrency = (value: number) => CurrencyService.format(value, currency);

  const cashDepositPct = summary.totalCredits > 0 
    ? (summary.cashDeposits / summary.totalCredits) * 100 
    : 0;
  const sisterConcernPct = summary.totalCredits > 0 
    ? (summary.sisterConcern / summary.totalCredits) * 100 
    : 0;
  const businessPct = summary.totalCredits > 0 
    ? (summary.businessTurnover / summary.totalCredits) * 100 
    : 0;

  const overstatementAmount = oldTurnover - summary.businessTurnover;
  const overstatementPct = summary.businessTurnover > 0 
    ? ((oldTurnover - summary.businessTurnover) / summary.businessTurnover) * 100 
    : 0;

  // Find highest month
  const highestMonth = [...summary.monthlyData].sort((a, b) => 
    b.businessTurnover - a.businessTurnover
  )[0];

  // Use exclusion status if available
  const cashExcluded = exclusionStatus?.cashDeposits.excluded ?? true;
  const cashMandatory = exclusionStatus?.cashDeposits.mandatory ?? false;
  const sisterExcluded = exclusionStatus?.sisterConcern.excluded ?? true;
  const sisterMandatory = exclusionStatus?.sisterConcern.mandatory ?? false;

  return (
    <div className="space-y-6">
      {/* Calculation Breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Turnover Calculation Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Total Credits */}
          <div className="flex items-center justify-between py-2 border-b border-border">
            <span className="font-medium">Total Credits</span>
            <span className="text-lg font-semibold">{formatCurrency(summary.totalCredits)}</span>
          </div>

          {/* Cash Deposits Row */}
          {cashExcluded && (
            <div className={cn(
              "flex items-center justify-between py-2 border-b",
              cashMandatory ? "border-destructive/30 bg-destructive/5 -mx-4 px-4" : "border-border"
            )}>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Less: Cash Deposits</span>
                {cashMandatory ? (
                  <Badge variant="destructive" className="text-xs gap-1">
                    <Lock className="h-3 w-3" />
                    MANDATORY
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">OPTIONAL</Badge>
                )}
              </div>
              <span className="text-destructive font-medium">
                -{formatCurrency(summary.cashDeposits)}
              </span>
            </div>
          )}

          {/* Sister Concern Row */}
          {sisterExcluded && (
            <div className={cn(
              "flex items-center justify-between py-2 border-b",
              sisterMandatory ? "border-destructive/30 bg-destructive/5 -mx-4 px-4" : "border-border"
            )}>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Less: Sister Concern</span>
                {sisterMandatory ? (
                  <Badge variant="destructive" className="text-xs gap-1">
                    <Lock className="h-3 w-3" />
                    MANDATORY
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">OPTIONAL</Badge>
                )}
              </div>
              <span className="text-destructive font-medium">
                -{formatCurrency(summary.sisterConcern)}
              </span>
            </div>
          )}

          {/* Business Turnover */}
          <div className="flex items-center justify-between py-3 bg-success/10 -mx-4 px-4 rounded-b-lg">
            <span className="font-semibold text-success">Business Turnover</span>
            <span className="text-xl font-bold text-success">
              {formatCurrency(summary.businessTurnover)}
            </span>
          </div>

          {/* Exclusion Rate */}
          <div className="flex items-center justify-between pt-2 text-sm">
            <span className="text-muted-foreground">Total Exclusion Rate</span>
            <span className={cn(
              "font-medium",
              summary.exclusionRate > 30 ? "text-destructive" : "text-muted-foreground"
            )}>
              {summary.exclusionRate.toFixed(2)}%
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Cash Deposits Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
        >
          <Card className={cn(
            "h-full",
            cashMandatory 
              ? "border-destructive/50 bg-destructive/5" 
              : cashExcluded 
                ? "border-warning/30 bg-warning/5" 
                : "border-border"
          )}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">Cash Deposits</p>
                {cashMandatory && <Lock className="h-4 w-4 text-destructive" />}
              </div>
              <p className="text-2xl font-bold">{formatCurrency(summary.cashDeposits)}</p>
              <div className="flex items-center justify-between mt-2">
                <span className={cn(
                  "text-lg font-semibold",
                  cashDepositPct > 20 ? "text-destructive" : "text-success"
                )}>
                  {cashDepositPct.toFixed(2)}%
                </span>
                <span className="text-xs text-muted-foreground">
                  {cashDepositPct > 20 ? 'Exceeds 20%' : 'Below 20%'}
                </span>
              </div>
              <div className="mt-3 pt-3 border-t border-border">
                {cashExcluded ? (
                  <span className="text-xs px-2 py-1 rounded-full bg-destructive/20 text-destructive">
                    ✓ Excluded from Turnover
                  </span>
                ) : (
                  <span className="text-xs px-2 py-1 rounded-full bg-success/20 text-success">
                    ✗ Included in Turnover
                  </span>
                )}
              </div>
              {cashMandatory && (
                <div className="mt-2 flex items-center gap-1 text-xs text-destructive">
                  <AlertTriangle className="h-3 w-3" />
                  <span>Mandatory Exclusion</span>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Sister Concern Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className={cn(
            "h-full",
            sisterMandatory 
              ? "border-destructive/50 bg-destructive/5" 
              : sisterExcluded 
                ? "border-warning/30 bg-warning/5" 
                : "border-border"
          )}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">Sister Concern</p>
                {sisterMandatory && <Lock className="h-4 w-4 text-destructive" />}
              </div>
              <p className="text-2xl font-bold">{formatCurrency(summary.sisterConcern)}</p>
              <div className="flex items-center justify-between mt-2">
                <span className={cn(
                  "text-lg font-semibold",
                  sisterConcernPct > 20 ? "text-destructive" : "text-success"
                )}>
                  {sisterConcernPct.toFixed(2)}%
                </span>
                <span className="text-xs text-muted-foreground">
                  {sisterConcernPct > 20 ? 'Exceeds 20%' : 'Below 20%'}
                </span>
              </div>
              <div className="mt-3 pt-3 border-t border-border">
                {sisterExcluded ? (
                  <span className="text-xs px-2 py-1 rounded-full bg-destructive/20 text-destructive">
                    ✓ Excluded from Turnover
                  </span>
                ) : (
                  <span className="text-xs px-2 py-1 rounded-full bg-success/20 text-success">
                    ✗ Included in Turnover
                  </span>
                )}
              </div>
              {sisterMandatory && (
                <div className="mt-2 flex items-center gap-1 text-xs text-destructive">
                  <AlertTriangle className="h-3 w-3" />
                  <span>Mandatory Exclusion</span>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Business Turnover Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="h-full border-success/30 bg-success/10">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-success">Business Turnover</p>
                <Tooltip>
                  <TooltipTrigger>
                    <TrendingUp className="h-4 w-4 text-success" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Genuine revenue from business operations with external customers</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className="text-2xl font-bold text-success">
                {formatCurrency(summary.businessTurnover)}
              </p>
              <p className="text-sm text-success/80 mt-2">
                {businessPct.toFixed(2)}% of total credits
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* High Exclusion Warning */}
      {summary.exclusionRate > 30 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 rounded-lg bg-warning/10 border border-warning/30"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-warning mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-warning">
                High Exclusion Rate ({summary.exclusionRate.toFixed(1)}%)
              </p>
              <p className="text-sm text-warning/80 mt-1">
                Over 30% of credits are excluded from business turnover. 
                This suggests heavy reliance on non-business income sources.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Comparison View */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MinusCircle className="h-5 w-5 text-accent" />
            Impact of Exclusions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            {/* Without Exclusions */}
            <div className="flex-1 p-4 rounded-lg bg-muted/50 border border-border text-center">
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Total Credits
              </p>
              <p className="text-xs text-muted-foreground mb-2">
                Before exclusions
              </p>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(summary.totalCredits)}
              </p>
            </div>

            <ArrowRight className="h-8 w-8 text-muted-foreground shrink-0" />

            {/* With Exclusions */}
            <div className="flex-1 p-4 rounded-lg bg-success/5 border border-success/30 text-center">
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Business Turnover
              </p>
              <p className="text-xs text-muted-foreground mb-2">
                After exclusions applied
              </p>
              <p className="text-2xl font-bold text-success">
                {formatCurrency(summary.businessTurnover)}
              </p>
            </div>
          </div>

          {/* Impact Stats */}
          <div className="mt-4 pt-4 border-t border-border text-center">
            <p className="text-sm text-muted-foreground">Total Excluded</p>
            <p className="text-xl font-bold text-destructive">
              {formatCurrency(summary.cashDeposits + summary.sisterConcern)}
            </p>
            <p className="text-xs text-muted-foreground">
              ({summary.exclusionRate.toFixed(1)}% of total credits)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Highest Month Card */}
      {highestMonth && (
        <Card className="border-accent/30 bg-accent/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-accent/20">
                <Award className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Highest Business Turnover Month</p>
                <p className="text-xl font-bold text-foreground">{highestMonth.month}</p>
                <p className="text-lg font-semibold text-accent">
                  {formatCurrency(highestMonth.businessTurnover)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {highestMonth.percentageOfTotal.toFixed(1)}% of total business turnover
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
