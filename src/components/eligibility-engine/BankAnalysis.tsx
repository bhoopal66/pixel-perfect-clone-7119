import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, AlertTriangle, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { CurrencyService } from '@/services/currencyService';
import type { BankMonthlyAnalysis, ParsedBankFile } from '@/types/assessment.types';

interface BankAnalysisProps {
  monthlySummaries: BankMonthlyAnalysis[];
  bankFiles: ParsedBankFile[];
}

const fmt = (v: number) => CurrencyService.format(v, 'AED');
const fmtShort = (v: number) => {
  if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `${(v / 1000).toFixed(0)}K`;
  return v.toFixed(0);
};

export const BankAnalysis: React.FC<BankAnalysisProps> = ({ monthlySummaries, bankFiles }) => {
  const totalCredits = monthlySummaries.reduce((s, m) => s + m.totalCredits, 0);
  const totalDebits = monthlySummaries.reduce((s, m) => s + m.totalDebits, 0);
  const monthCount = monthlySummaries.length || 1;
  const avgMonthlyCredit = totalCredits / monthCount;
  const avgMonthlyDebit = totalDebits / monthCount;
  const totalBounces = monthlySummaries.reduce((s, m) => s + m.bounceCount, 0);
  const totalNegDays = monthlySummaries.reduce((s, m) => s + m.negativeBalanceDays, 0);
  const avgBalance = monthlySummaries.reduce((s, m) => s + m.avgDailyBalance, 0) / monthCount;
  const totalCash = monthlySummaries.reduce((s, m) => s + m.cashDepositTotal, 0);
  const cashRatio = totalCredits > 0 ? (totalCash / totalCredits * 100) : 0;

  const chartData = monthlySummaries.map(m => ({
    name: m.monthLabel,
    Credits: m.totalCredits,
    Debits: m.totalDebits,
    Balance: m.avgDailyBalance,
  }));

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-success/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-medium text-muted-foreground">Avg Monthly Credit</p>
              <TrendingUp className="h-4 w-4 text-success" />
            </div>
            <p className="text-xl font-bold">{fmt(avgMonthlyCredit)}</p>
          </CardContent>
        </Card>
        <Card className="border-destructive/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-medium text-muted-foreground">Avg Monthly Debit</p>
              <TrendingDown className="h-4 w-4 text-destructive" />
            </div>
            <p className="text-xl font-bold">{fmt(avgMonthlyDebit)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium text-muted-foreground mb-1">Avg Daily Balance</p>
            <p className="text-xl font-bold">{fmt(avgBalance)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium text-muted-foreground mb-1">Cash Deposit Ratio</p>
            <p className="text-xl font-bold">{cashRatio.toFixed(1)}%</p>
            {cashRatio > 30 && (
              <Badge variant="destructive" className="text-xs mt-1">
                <AlertTriangle className="h-3 w-3 mr-1" /> High
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Risk Indicators */}
      {(totalBounces > 0 || totalNegDays > 5) && (
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              <h3 className="font-semibold text-foreground">Risk Indicators</h3>
            </div>
            <div className="flex gap-4">
              {totalBounces > 0 && (
                <Badge variant="outline" className="border-warning text-warning">
                  {totalBounces} cheque return(s)
                </Badge>
              )}
              {totalNegDays > 5 && (
                <Badge variant="outline" className="border-destructive text-destructive">
                  {totalNegDays} negative balance days
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5 text-primary" />
              Monthly Credit & Debit Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis tickFormatter={fmtShort} className="text-xs" />
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Legend />
                  <Bar dataKey="Credits" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Debits" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Monthly Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Monthly Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead className="text-right">Credits</TableHead>
                <TableHead className="text-right">Debits</TableHead>
                <TableHead className="text-right">Inward Txns</TableHead>
                <TableHead className="text-right">Outward Txns</TableHead>
                <TableHead className="text-right">Highest Credit</TableHead>
                <TableHead className="text-right">Avg Balance</TableHead>
                <TableHead className="text-right">Cash Deposits</TableHead>
                <TableHead className="text-right">Bounces</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monthlySummaries.map((m, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium">{m.monthLabel}</TableCell>
                  <TableCell className="text-right font-mono text-sm text-success">{fmt(m.totalCredits)}</TableCell>
                  <TableCell className="text-right font-mono text-sm text-destructive">{fmt(m.totalDebits)}</TableCell>
                  <TableCell className="text-right">{m.creditCount}</TableCell>
                  <TableCell className="text-right">{m.debitCount}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{fmt(m.highestCredit)}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{fmt(m.avgDailyBalance)}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{fmt(m.cashDepositTotal)}</TableCell>
                  <TableCell className="text-right">
                    {m.bounceCount > 0 ? (
                      <Badge variant="destructive" className="text-xs">{m.bounceCount}</Badge>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
