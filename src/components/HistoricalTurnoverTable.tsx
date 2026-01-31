import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, AlertTriangle, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow,
  TableFooter
} from './ui/table';
import { cn } from '@/lib/utils';
import type { MonthlyTurnover } from '../types/turnover.types';
import type { CurrencyCode } from '../services/currencyService';
import { CurrencyService } from '../services/currencyService';

interface HistoricalTurnoverTableProps {
  monthlyData: MonthlyTurnover[];
  currency: CurrencyCode;
}

export const HistoricalTurnoverTable: React.FC<HistoricalTurnoverTableProps> = ({
  monthlyData,
  currency
}) => {
  const formatCurrency = (value: number) => CurrencyService.format(value, currency);
  const formatNumber = (value: number) => new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);

  // Calculate totals
  const totals = monthlyData.reduce(
    (acc, month) => ({
      totalCredits: acc.totalCredits + month.totalCredits,
      cashDeposits: acc.cashDeposits + month.cashDeposits,
      sisterConcern: acc.sisterConcern + month.sisterConcern,
      businessTurnover: acc.businessTurnover + month.businessTurnover
    }),
    { totalCredits: 0, cashDeposits: 0, sisterConcern: 0, businessTurnover: 0 }
  );

  const totalExclusionRate = totals.totalCredits > 0
    ? ((totals.cashDeposits + totals.sisterConcern) / totals.totalCredits) * 100
    : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Historical Analysis - Corrected Turnover</CardTitle>
              <CardDescription className="flex items-center gap-1 text-destructive">
                <span className="italic">
                  Business Turnover = Total Credits - Cash Deposits - Sister Concern Transfers
                </span>
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary/5">
                <TableHead className="font-semibold">Month</TableHead>
                <TableHead className="text-right font-semibold">
                  <div className="flex items-center justify-end gap-1">
                    Total Credits
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>All credit transactions for the month</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </TableHead>
                <TableHead className="text-right font-semibold text-destructive">
                  <div className="flex items-center justify-end gap-1">
                    Cash Deposits
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3 text-destructive/70" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>CDM deposits excluded from turnover</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </TableHead>
                <TableHead className="text-right font-semibold text-destructive">
                  <div className="flex items-center justify-end gap-1">
                    Sister Concern
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3 text-destructive/70" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Related party transfers excluded</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </TableHead>
                <TableHead className="text-right font-semibold text-success">
                  <div className="flex items-center justify-end gap-1">
                    Business Turnover
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3 text-success/70" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Genuine business revenue</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </TableHead>
                <TableHead className="text-right font-semibold">% of Total</TableHead>
                <TableHead className="text-right font-semibold">
                  <div className="flex items-center justify-end gap-1">
                    Exclusion Rate
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>% of credits excluded. Target: &lt;10%</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monthlyData.map((month, idx) => (
                <motion.tr
                  key={month.month}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="hover:bg-muted/50"
                >
                  <TableCell className="font-medium">{month.month}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(month.totalCredits)}
                  </TableCell>
                  <TableCell className={cn(
                    "text-right tabular-nums",
                    month.cashDeposits > 0 && "bg-destructive/10 text-destructive font-medium"
                  )}>
                    {formatNumber(month.cashDeposits)}
                  </TableCell>
                  <TableCell className={cn(
                    "text-right tabular-nums",
                    month.sisterConcern > 0 && "bg-destructive/10 text-destructive font-medium"
                  )}>
                    {formatNumber(month.sisterConcern)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums bg-success/10 text-success font-semibold">
                    {formatNumber(month.businessTurnover)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {month.percentageOfTotal.toFixed(2)}%
                  </TableCell>
                  <TableCell className={cn(
                    "text-right tabular-nums",
                    month.exclusionRate > 50 && "bg-destructive/20 text-destructive font-bold",
                    month.exclusionRate > 30 && month.exclusionRate <= 50 && "bg-warning/20 text-warning font-medium"
                  )}>
                    <div className="flex items-center justify-end gap-1">
                      {month.exclusionRate.toFixed(2)}%
                      {month.exclusionRate > 50 && (
                        <AlertTriangle className="h-4 w-4" />
                      )}
                    </div>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow className="bg-primary/10 font-bold">
                <TableCell>TOTAL</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumber(totals.totalCredits)}
                </TableCell>
                <TableCell className="text-right tabular-nums text-destructive">
                  {formatNumber(totals.cashDeposits)}
                </TableCell>
                <TableCell className="text-right tabular-nums text-destructive">
                  {formatNumber(totals.sisterConcern)}
                </TableCell>
                <TableCell className="text-right tabular-nums text-success">
                  {formatNumber(totals.businessTurnover)}
                </TableCell>
                <TableCell className="text-right tabular-nums">100.00%</TableCell>
                <TableCell className={cn(
                  "text-right tabular-nums",
                  totalExclusionRate > 30 && "text-warning"
                )}>
                  {totalExclusionRate.toFixed(2)}%
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>

        {/* Month-specific warnings */}
        <div className="mt-4 space-y-2">
          {monthlyData.map(month => (
            month.exclusionRate > 50 && (
              <motion.div
                key={month.month}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-3 rounded-lg bg-destructive/10 border border-destructive/20"
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                  <div className="text-sm">
                    <span className="font-semibold text-destructive">
                      {month.month}: {month.exclusionRate.toFixed(1)}% Exclusions
                    </span>
                    <p className="text-destructive/80">
                      Over half of this month's credits are excluded. 
                      This month may not represent actual business performance.
                    </p>
                  </div>
                </div>
              </motion.div>
            )
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
