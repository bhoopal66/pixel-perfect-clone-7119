import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  TrendingUp, TrendingDown, AlertTriangle, BarChart3, ArrowRightLeft,
  Download, DollarSign, Activity, ShieldAlert, ArrowUpDown,
  ChevronDown, Search, FileSpreadsheet, CreditCard, Banknote,
  PieChart as PieChartIcon, CalendarDays, Wallet,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  AreaChart, Area, PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';
import { CurrencyService } from '@/services/currencyService';
import type { CurrencyCode } from '@/services/currencyService';
import type { BankMonthlyAnalysis, ParsedBankFile } from '@/types/assessment.types';
import type { AccountCurrencyConfig } from '@/types/currency.types';
import { BankStatementAnalysisEngine, type BankStatementAnalysisResult } from '@/services/bankStatementAnalysisEngine';
import { BankAnalysisExcelExport } from '@/services/bankAnalysisExcelExport';
import { toast } from 'sonner';

interface BankAnalysisProps {
  monthlySummaries: BankMonthlyAnalysis[];
  bankFiles: ParsedBankFile[];
  baseReportingCurrency?: string;
  accountConfigs?: AccountCurrencyConfig[];
}

const CHART_COLORS = [
  'hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--destructive))',
  'hsl(var(--accent))', 'hsl(var(--warning))', 'hsl(210, 70%, 50%)',
  'hsl(280, 60%, 50%)', 'hsl(30, 80%, 50%)', 'hsl(160, 60%, 40%)',
  'hsl(350, 60%, 50%)',
];

export const BankAnalysis: React.FC<BankAnalysisProps> = ({
  monthlySummaries,
  bankFiles,
  baseReportingCurrency = 'AED',
  accountConfigs = [],
}) => {
  const [viewMode, setViewMode] = useState<'base' | 'original'>('base');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedBank, setSelectedBank] = useState<string>('all');
  const currency = (baseReportingCurrency || 'AED') as CurrencyCode;
  const isMultiCurrency = accountConfigs.some(a => a.statementCurrencyCode !== baseReportingCurrency);

  // Run full analysis
  const analysis = useMemo<BankStatementAnalysisResult>(
    () => BankStatementAnalysisEngine.analyze(bankFiles, monthlySummaries),
    [bankFiles, monthlySummaries]
  );

  const fmt = (v: number) => CurrencyService.format(v, currency);
  const fmtShort = (v: number) => {
    if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
    if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
    return v.toFixed(0);
  };

  const banks = [...new Set(bankFiles.filter(f => f.bankName).map(f => f.bankName!))];
  const months = [...new Set(analysis.monthlyBalances.map(m => m.monthLabel))];

  const handleExport = async () => {
    try {
      const blob = await BankAnalysisExcelExport.generate(analysis, bankFiles[0]?.accountHolder || undefined);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Bank_Statement_Analysis_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Excel report exported successfully');
    } catch (e) {
      console.error('Export error:', e);
      toast.error('Failed to export report');
    }
  };

  // Chart data
  const creditDebitChart = analysis.cashFlow.map(m => ({
    name: m.monthLabel, Credits: m.totalInflow, Debits: m.totalOutflow, Net: m.netCashFlow,
  }));
  const balanceTrend = analysis.monthlyBalances.map(m => ({
    name: m.monthLabel, Average: m.averageBalance, Min: m.minimumBalance, Max: m.maximumBalance,
  }));
  const categoryPie = analysis.categoryOverall.slice(0, 8).map(c => ({
    name: c.category, value: c.totalDebit + c.totalCredit,
  }));
  const chequeReturnChart = analysis.chequeReturns.filter(c => c.totalReturnCount > 0).map(c => ({
    name: c.monthLabel, Inward: c.inwardReturnCount, Outward: c.outwardReturnCount,
  }));

  return (
    <div className="space-y-6">
      {/* Filters & Controls */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            {months.length > 1 && (
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[160px] h-8 text-sm">
                  <SelectValue placeholder="All Months" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Months</SelectItem>
                  {months.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            {banks.length > 1 && (
              <Select value={selectedBank} onValueChange={setSelectedBank}>
                <SelectTrigger className="w-[160px] h-8 text-sm">
                  <SelectValue placeholder="All Banks" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Banks</SelectItem>
                  {banks.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            {isMultiCurrency && (
              <div className="flex gap-1">
                <Button size="sm" variant={viewMode === 'base' ? 'default' : 'outline'} onClick={() => setViewMode('base')} className="text-xs h-8">
                  {baseReportingCurrency}
                </Button>
                <Button size="sm" variant={viewMode === 'original' ? 'default' : 'outline'} onClick={() => setViewMode('original')} className="text-xs h-8">
                  Original
                </Button>
              </div>
            )}
            <Button size="sm" variant="outline" onClick={handleExport} className="h-8 gap-1.5">
              <Download className="h-3.5 w-3.5" />
              Export Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <KPICard label="Total Credits" value={fmt(analysis.totalCredits)} icon={<TrendingUp className="h-4 w-4 text-success" />} />
        <KPICard label="Total Debits" value={fmt(analysis.totalDebits)} icon={<TrendingDown className="h-4 w-4 text-destructive" />} />
        <KPICard label="Avg Monthly Balance" value={fmt(analysis.averageMonthlyBalance)} icon={<Wallet className="h-4 w-4 text-primary" />} />
        <KPICard label="Highest Balance" value={fmt(analysis.highestBalance)} icon={<ArrowUpDown className="h-4 w-4 text-success" />} />
        <KPICard label="Lowest Balance" value={fmt(analysis.lowestBalance)} icon={<ArrowUpDown className="h-4 w-4 text-destructive" />} />
        <KPICard label="Total Transactions" value={analysis.totalTransactions.toLocaleString()} icon={<Activity className="h-4 w-4 text-primary" />} />
        <KPICard label="Cheque Returns" value={analysis.totalChequeReturns.toString()} icon={<AlertTriangle className="h-4 w-4 text-warning" />} alert={analysis.totalChequeReturns > 0} />
        <KPICard label="Net Cash Flow" value={fmt(analysis.netCashFlow)} icon={<DollarSign className="h-4 w-4 text-primary" />} />
      </div>

      {/* Tabbed Analysis Sections */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
          <TabsTrigger value="overview" className="text-xs sm:text-sm gap-1"><BarChart3 className="h-3.5 w-3.5" /><span className="hidden sm:inline">Overview</span></TabsTrigger>
          <TabsTrigger value="daily" className="text-xs sm:text-sm gap-1"><CalendarDays className="h-3.5 w-3.5" /><span className="hidden sm:inline">Daily Balance</span></TabsTrigger>
          <TabsTrigger value="monthly_balance" className="text-xs sm:text-sm gap-1"><Wallet className="h-3.5 w-3.5" /><span className="hidden sm:inline">Monthly Balance</span></TabsTrigger>
          <TabsTrigger value="monthly_txn" className="text-xs sm:text-sm gap-1"><FileSpreadsheet className="h-3.5 w-3.5" /><span className="hidden sm:inline">Monthly Summary</span></TabsTrigger>
          <TabsTrigger value="categories" className="text-xs sm:text-sm gap-1"><PieChartIcon className="h-3.5 w-3.5" /><span className="hidden sm:inline">Categories</span></TabsTrigger>
          <TabsTrigger value="cashflow" className="text-xs sm:text-sm gap-1"><Banknote className="h-3.5 w-3.5" /><span className="hidden sm:inline">Cash Flow</span></TabsTrigger>
          <TabsTrigger value="cheques" className="text-xs sm:text-sm gap-1"><CreditCard className="h-3.5 w-3.5" /><span className="hidden sm:inline">Cheque Returns</span></TabsTrigger>
          <TabsTrigger value="top_flows" className="text-xs sm:text-sm gap-1"><ArrowRightLeft className="h-3.5 w-3.5" /><span className="hidden sm:inline">Top Flows</span></TabsTrigger>
          <TabsTrigger value="risk" className="text-xs sm:text-sm gap-1"><ShieldAlert className="h-3.5 w-3.5" /><span className="hidden sm:inline">Risk Flags</span></TabsTrigger>
        </TabsList>

        {/* ── Overview Tab ── */}
        <TabsContent value="overview" className="space-y-6 mt-4">
          {/* Credits vs Debits Chart */}
          {creditDebitChart.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" />Monthly Credits vs Debits</CardTitle></CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={creditDebitChart}>
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Balance Trend */}
            {balanceTrend.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-lg">Balance Trend</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={balanceTrend}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="name" className="text-xs" />
                        <YAxis tickFormatter={fmtShort} className="text-xs" />
                        <Tooltip formatter={(v: number) => fmt(v)} />
                        <Area type="monotone" dataKey="Average" stroke="hsl(var(--primary))" fill="hsl(var(--primary)/0.2)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Category Distribution */}
            {categoryPie.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-lg">Transaction Category Distribution</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={categoryPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}>
                          {categoryPie.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(v: number) => fmt(v)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Cash Flow Trend */}
          {creditDebitChart.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-lg">Net Cash Flow Trend</CardTitle></CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={creditDebitChart}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="name" className="text-xs" />
                      <YAxis tickFormatter={fmtShort} className="text-xs" />
                      <Tooltip formatter={(v: number) => fmt(v)} />
                      <Line type="monotone" dataKey="Net" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Daily Balance Tab ── */}
        <TabsContent value="daily" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><CalendarDays className="h-5 w-5 text-primary" />Daily Closing Balance</CardTitle>
              <CardDescription>End-of-day balance for each calendar day. Carried forward on non-transaction days.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-[500px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Opening Balance</TableHead>
                      <TableHead className="text-right">Closing Balance</TableHead>
                      <TableHead className="text-right">Daily Avg Balance</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analysis.dailyBalances
                      .filter(d => selectedMonth === 'all' || d.month === selectedMonth)
                      .map((d, i) => (
                        <TableRow key={i} className={!d.hasTransactions ? 'text-muted-foreground' : ''}>
                          <TableCell className="font-mono text-sm">{d.date}</TableCell>
                          <TableCell className="text-right font-mono text-sm">{fmt(d.openingBalance)}</TableCell>
                          <TableCell className="text-right font-mono text-sm">{fmt(d.closingBalance)}</TableCell>
                          <TableCell className="text-right font-mono text-sm">{fmt(d.dailyAvgBalance)}</TableCell>
                          <TableCell className="text-center">
                            {d.hasTransactions
                              ? <Badge variant="default" className="text-xs">✓ Active</Badge>
                              : <Badge variant="secondary" className="text-xs">→ Carried</Badge>}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Monthly Balance Tab ── */}
        <TabsContent value="monthly_balance" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Monthly Average Balance</CardTitle>
              <CardDescription>Average of daily closing balances per month</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead className="text-right">Average Balance</TableHead>
                    <TableHead className="text-right">Minimum Balance</TableHead>
                    <TableHead className="text-right">Maximum Balance</TableHead>
                    <TableHead className="text-right">Low Balance Days</TableHead>
                    <TableHead className="text-right">Negative Balance Days</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analysis.monthlyBalances.map((m, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{m.monthLabel}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{fmt(m.averageBalance)}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{fmt(m.minimumBalance)}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{fmt(m.maximumBalance)}</TableCell>
                      <TableCell className="text-right">{m.lowBalanceDays}</TableCell>
                      <TableCell className="text-right">
                        {m.negativeBalanceDays > 0
                          ? <Badge variant="destructive" className="text-xs">{m.negativeBalanceDays}</Badge>
                          : <span className="text-muted-foreground">0</span>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Monthly Transaction Summary Tab ── */}
        <TabsContent value="monthly_txn" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Month-Wise Transaction Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead className="text-right">Opening</TableHead>
                    <TableHead className="text-right">Total Credits</TableHead>
                    <TableHead className="text-right">Total Debits</TableHead>
                    <TableHead className="text-right">Closing</TableHead>
                    <TableHead className="text-right">Cr Count</TableHead>
                    <TableHead className="text-right">Dr Count</TableHead>
                    <TableHead className="text-right">Net Movement</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analysis.monthlyTransactions.map((m, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{m.monthLabel}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{fmt(m.openingBalance)}</TableCell>
                      <TableCell className="text-right font-mono text-sm text-success">{fmt(m.totalCredits)}</TableCell>
                      <TableCell className="text-right font-mono text-sm text-destructive">{fmt(m.totalDebits)}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{fmt(m.closingBalance)}</TableCell>
                      <TableCell className="text-right">{m.creditCount}</TableCell>
                      <TableCell className="text-right">{m.debitCount}</TableCell>
                      <TableCell className={`text-right font-mono text-sm ${m.netMovement >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {fmt(m.netMovement)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Categories Tab ── */}
        <TabsContent value="categories" className="space-y-6 mt-4">
          {/* Overall Category Summary */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Transaction Category Summary</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Count</TableHead>
                    <TableHead className="text-right">Total Debit</TableHead>
                    <TableHead className="text-right">Total Credit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analysis.categoryOverall.map((c, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{c.category}</TableCell>
                      <TableCell className="text-right">{c.transactionCount}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{c.totalDebit > 0 ? fmt(c.totalDebit) : '-'}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{c.totalCredit > 0 ? fmt(c.totalCredit) : '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Month-wise Category Grouping */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Monthly Category Breakdown</CardTitle></CardHeader>
            <CardContent>
              <div className="max-h-[400px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Count</TableHead>
                      <TableHead className="text-right">Total Debit</TableHead>
                      <TableHead className="text-right">Total Credit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analysis.categoryGrouping
                      .filter(g => selectedMonth === 'all' || g.monthLabel === selectedMonth)
                      .map((g, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-sm">{g.monthLabel}</TableCell>
                          <TableCell className="font-medium text-sm">{g.category}</TableCell>
                          <TableCell className="text-right">{g.transactionCount}</TableCell>
                          <TableCell className="text-right font-mono text-sm">{g.totalDebit > 0 ? fmt(g.totalDebit) : '-'}</TableCell>
                          <TableCell className="text-right font-mono text-sm">{g.totalCredit > 0 ? fmt(g.totalCredit) : '-'}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Cash Flow Tab ── */}
        <TabsContent value="cashflow" className="space-y-6 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Banknote className="h-5 w-5 text-primary" />Monthly Cash Flow Analysis</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead className="text-right">Total Inflow</TableHead>
                    <TableHead className="text-right">Total Outflow</TableHead>
                    <TableHead className="text-right">Net Cash Flow</TableHead>
                    <TableHead className="text-right">Inflow #</TableHead>
                    <TableHead className="text-right">Outflow #</TableHead>
                    <TableHead className="text-right">Avg Credit</TableHead>
                    <TableHead className="text-right">Avg Debit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analysis.cashFlow.map((c, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{c.monthLabel}</TableCell>
                      <TableCell className="text-right font-mono text-sm text-success">{fmt(c.totalInflow)}</TableCell>
                      <TableCell className="text-right font-mono text-sm text-destructive">{fmt(c.totalOutflow)}</TableCell>
                      <TableCell className={`text-right font-mono text-sm font-semibold ${c.netCashFlow >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {fmt(c.netCashFlow)}
                      </TableCell>
                      <TableCell className="text-right">{c.inflowCount}</TableCell>
                      <TableCell className="text-right">{c.outflowCount}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{fmt(c.avgCreditAmount)}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{fmt(c.avgDebitAmount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Cheque Returns Tab ── */}
        <TabsContent value="cheques" className="space-y-6 mt-4">
          {chequeReturnChart.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-lg">Cheque Return Trend</CardTitle></CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chequeReturnChart}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="name" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Inward" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Outward" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><CreditCard className="h-5 w-5 text-warning" />Cheque Return Analysis</CardTitle>
              <CardDescription>Month-wise breakdown of inward and outward cheque returns</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead className="text-right">Inward Count</TableHead>
                    <TableHead className="text-right">Inward Amount</TableHead>
                    <TableHead className="text-right">Outward Count</TableHead>
                    <TableHead className="text-right">Outward Amount</TableHead>
                    <TableHead className="text-right">Total Count</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analysis.chequeReturns.map((c, i) => (
                    <TableRow key={i} className={c.totalReturnCount > 0 ? 'bg-warning/5' : ''}>
                      <TableCell className="font-medium">{c.monthLabel}</TableCell>
                      <TableCell className="text-right">{c.inwardReturnCount || '-'}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{c.inwardReturnAmount > 0 ? fmt(c.inwardReturnAmount) : '-'}</TableCell>
                      <TableCell className="text-right">{c.outwardReturnCount || '-'}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{c.outwardReturnAmount > 0 ? fmt(c.outwardReturnAmount) : '-'}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {c.totalReturnCount > 0
                          ? <Badge variant="destructive" className="text-xs">{c.totalReturnCount}</Badge>
                          : <span className="text-muted-foreground">0</span>}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">{c.totalReturnAmount > 0 ? fmt(c.totalReturnAmount) : '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Top Flows Tab ── */}
        <TabsContent value="top_flows" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><TrendingUp className="h-5 w-5 text-success" />Top Inflow Sources</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">#</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">%</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analysis.topInflows.map((t, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-sm max-w-[200px] truncate" title={t.descriptionGroup}>{t.descriptionGroup}</TableCell>
                        <TableCell className="text-right">{t.transactionCount}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{fmt(t.totalAmount)}</TableCell>
                        <TableCell className="text-right text-sm">{t.contributionPercent}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><TrendingDown className="h-5 w-5 text-destructive" />Top Expense Heads</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">#</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">%</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analysis.topExpenses.map((t, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-sm max-w-[200px] truncate" title={t.descriptionGroup}>{t.descriptionGroup}</TableCell>
                        <TableCell className="text-right">{t.transactionCount}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{fmt(t.totalAmount)}</TableCell>
                        <TableCell className="text-right text-sm">{t.contributionPercent}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Risk Flags Tab ── */}
        <TabsContent value="risk" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-destructive" />Risk Flag Analysis</CardTitle>
              <CardDescription>Automated risk detection based on transaction patterns</CardDescription>
            </CardHeader>
            <CardContent>
              {analysis.riskFlags.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ShieldAlert className="h-8 w-8 mx-auto mb-2 text-success" />
                  <p>No risk flags detected</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Risk Flag</TableHead>
                      <TableHead>Month</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analysis.riskFlags.map((f, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{f.riskFlag}</TableCell>
                        <TableCell className="text-sm">{f.month}</TableCell>
                        <TableCell>
                          <Badge
                            variant={f.severity === 'High' ? 'destructive' : f.severity === 'Medium' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {f.severity}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{f.remarks}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// ─── KPI Card Component ──────────────────────────────────────
function KPICard({ label, value, icon, alert }: { label: string; value: string; icon: React.ReactNode; alert?: boolean }) {
  return (
    <Card className={alert ? 'border-warning/30' : ''}>
      <CardContent className="pt-4 pb-3 px-3">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[10px] sm:text-xs font-medium text-muted-foreground leading-tight">{label}</p>
          {icon}
        </div>
        <p className="text-sm sm:text-lg font-bold truncate">{value}</p>
      </CardContent>
    </Card>
  );
}
