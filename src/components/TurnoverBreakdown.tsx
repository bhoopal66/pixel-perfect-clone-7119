import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  DollarSign, 
  MinusCircle, 
  AlertTriangle,
  Info,
  Award,
  ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { cn } from '@/lib/utils';
import type { TurnoverSummary, MonthlyTurnover } from '../types/turnover.types';
import type { CurrencyCode } from '../services/currencyService';
import { CurrencyService } from '../services/currencyService';

interface TurnoverBreakdownProps {
  summary: TurnoverSummary;
  currency: CurrencyCode;
  oldTurnover: number;
}

export const TurnoverBreakdown: React.FC<TurnoverBreakdownProps> = ({
  summary,
  currency,
  oldTurnover
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

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Credits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
        >
          <Card className="h-full">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">Total Credits</p>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Total of all credit transactions in the period</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(summary.totalCredits)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                All credit transactions
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Cash Deposits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="h-full border-destructive/20 bg-destructive/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-destructive">Cash Deposits</p>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-destructive/70" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Cash deposits via CDM or physical deposits - excluded because they're not business revenue</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className="text-2xl font-bold text-destructive">
                -{formatCurrency(summary.cashDeposits)}
              </p>
              <p className="text-xs text-destructive/70 mt-1">
                {cashDepositPct.toFixed(2)}% of credits
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Sister Concern */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="h-full border-destructive/20 bg-destructive/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-destructive">Sister Concern</p>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-destructive/70" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Transfers from sister companies or related parties - excluded because they're internal movements, not customer revenue</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className="text-2xl font-bold text-destructive">
                -{formatCurrency(summary.sisterConcern)}
              </p>
              <p className="text-xs text-destructive/70 mt-1">
                {sisterConcernPct.toFixed(2)}% of credits
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Business Turnover */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
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
              <p className="text-xs text-success/80 mt-1">
                {businessPct.toFixed(2)}% of credits
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
                This suggests heavy reliance on sister concern funding.
                Consider reducing sister concern dependency to below 10%.
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
            Impact of Correction
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            {/* Old Method */}
            <div className="flex-1 p-4 rounded-lg bg-destructive/5 border border-destructive/20 text-center">
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Old Method (Incorrect)
              </p>
              <p className="text-xs text-muted-foreground mb-2">
                Turnover = Credits + Debits
              </p>
              <p className="text-2xl font-bold text-destructive">
                {formatCurrency(oldTurnover)}
              </p>
              <span className="inline-block mt-2 px-2 py-0.5 text-xs bg-destructive/20 text-destructive rounded-full">
                Inflated
              </span>
            </div>

            <ArrowRight className="h-8 w-8 text-muted-foreground shrink-0" />

            {/* New Method */}
            <div className="flex-1 p-4 rounded-lg bg-success/5 border border-success/30 text-center">
              <p className="text-sm font-medium text-muted-foreground mb-1">
                New Method (Correct)
              </p>
              <p className="text-xs text-muted-foreground mb-2">
                Business Turnover = Credits - Deposits - Sister
              </p>
              <p className="text-2xl font-bold text-success">
                {formatCurrency(summary.businessTurnover)}
              </p>
              <span className="inline-block mt-2 px-2 py-0.5 text-xs bg-success/20 text-success rounded-full">
                Accurate
              </span>
            </div>
          </div>

          {/* Impact Stats */}
          <div className="mt-4 pt-4 border-t border-border text-center">
            <p className="text-sm text-muted-foreground">Difference</p>
            <p className="text-xl font-bold text-destructive">
              {formatCurrency(overstatementAmount)}
            </p>
            <p className="text-xs text-destructive/70">
              ({overstatementPct.toFixed(1)}% overstatement)
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
