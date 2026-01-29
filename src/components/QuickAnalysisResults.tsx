import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar,
  FileText,
  CreditCard,
  Wallet,
  Building2,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from './ui/table';
import { CurrencyService } from '@/services/currencyService';
import { TurnoverCharts } from './TurnoverCharts';
import { TurnoverBalanceDashboard } from './TurnoverBalanceDashboard';
import type { ParsedStatementData } from '@/hooks/usePdfParsing';
import type { TurnoverBalanceReport, MonthlyTurnoverBalance, QuarterlyTurnoverBalance, HalfYearlyTurnoverBalance } from '@/types/turnover.types';

interface QuickAnalysisResultsProps {
  data: ParsedStatementData;
}

export const QuickAnalysisResults: React.FC<QuickAnalysisResultsProps> = ({ data }) => {
  const formatCurrency = (value: number) => CurrencyService.format(value, 'AED');
  
  const { transactions, accountInfo, balances, totalCredits, totalDebits, periodFrom, periodTo } = data;

  // Calculate some quick stats
  const transactionCount = transactions.length;
  const avgTransactionSize = transactionCount > 0 ? (totalCredits + totalDebits) / transactionCount : 0;
  const creditTransactions = transactions.filter(t => t.credit > 0).length;
  const debitTransactions = transactions.filter(t => t.debit > 0).length;

  // Generate TurnoverBalanceReport from transactions
  const turnoverReport = useMemo((): TurnoverBalanceReport => {
    // Group transactions by month
    const monthlyMap = new Map<string, { credits: number; debits: number; balances: number[]; count: number }>();
    
    transactions.forEach(t => {
      const date = new Date(t.date);
      const monthKey = date.toLocaleString('default', { month: 'short', year: '2-digit' });
      
      const existing = monthlyMap.get(monthKey) || { credits: 0, debits: 0, balances: [], count: 0 };
      existing.credits += t.credit || 0;
      existing.debits += t.debit || 0;
      existing.balances.push(t.balance);
      existing.count += 1;
      monthlyMap.set(monthKey, existing);
    });

    // Convert to monthly data
    const monthly: MonthlyTurnoverBalance[] = Array.from(monthlyMap.entries()).map(([month, data]) => {
      const avgBalance = data.balances.reduce((a, b) => a + b, 0) / data.balances.length;
      const turnover = data.credits;
      return {
        month,
        turnover,
        averageBalance: avgBalance,
        avgBalancePercentage: turnover > 0 ? (avgBalance / turnover) * 100 : 0,
        days: data.count,
        openingBalance: data.balances[0] || 0,
        closingBalance: data.balances[data.balances.length - 1] || 0,
        totalDebits: data.debits,
        transactionCount: data.count
      };
    });

    // Generate quarterly data
    const quarterlyMap = new Map<string, MonthlyTurnoverBalance[]>();
    monthly.forEach(m => {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthIndex = monthNames.findIndex(mn => m.month.startsWith(mn));
      const quarter = Math.floor(monthIndex / 3) + 1;
      // Extract year from month format like "Jan-24"
      const yearMatch = m.month.match(/-(\d{2})$/);
      const yearSuffix = yearMatch ? yearMatch[1] : '24';
      const quarterKey = `Q${quarter} 20${yearSuffix}`;
      
      const existing = quarterlyMap.get(quarterKey) || [];
      existing.push(m);
      quarterlyMap.set(quarterKey, existing);
    });

    const quarterly: QuarterlyTurnoverBalance[] = Array.from(quarterlyMap.entries()).map(([quarter, months]) => {
      const turnover = months.reduce((sum, m) => sum + m.turnover, 0);
      const avgBalance = months.reduce((sum, m) => sum + m.averageBalance, 0) / months.length;
      return {
        quarter,
        months: months.map(m => m.month),
        turnover,
        averageBalance: avgBalance,
        avgBalancePercentage: turnover > 0 ? (avgBalance / turnover) * 100 : 0,
        days: months.reduce((sum, m) => sum + m.days, 0)
      };
    });

    // Generate half-yearly data
    const halfYearly: HalfYearlyTurnoverBalance[] = [];
    const h1Months = monthly.filter(m => {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      return monthNames.some(mn => m.month.startsWith(mn));
    });
    const h2Months = monthly.filter(m => {
      const monthNames = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return monthNames.some(mn => m.month.startsWith(mn));
    });

    if (h1Months.length > 0) {
      const turnover = h1Months.reduce((sum, m) => sum + m.turnover, 0);
      const avgBalance = h1Months.reduce((sum, m) => sum + m.averageBalance, 0) / h1Months.length;
      halfYearly.push({
        period: 'H1 2024',
        months: h1Months.map(m => m.month),
        turnover,
        averageBalance: avgBalance,
        avgBalancePercentage: turnover > 0 ? (avgBalance / turnover) * 100 : 0,
        days: h1Months.reduce((sum, m) => sum + m.days, 0)
      });
    }

    if (h2Months.length > 0) {
      const turnover = h2Months.reduce((sum, m) => sum + m.turnover, 0);
      const avgBalance = h2Months.reduce((sum, m) => sum + m.averageBalance, 0) / h2Months.length;
      halfYearly.push({
        period: 'H2 2024',
        months: h2Months.map(m => m.month),
        turnover,
        averageBalance: avgBalance,
        avgBalancePercentage: turnover > 0 ? (avgBalance / turnover) * 100 : 0,
        days: h2Months.reduce((sum, m) => sum + m.days, 0)
      });
    }

    const overallAvgBalance = balances.average || monthly.reduce((sum, m) => sum + m.averageBalance, 0) / monthly.length;
    const overallAvgBalancePercentage = totalCredits > 0 ? (overallAvgBalance / totalCredits) * 100 : 0;
    
    let balanceCoverage: 'excellent' | 'good' | 'moderate' | 'low' = 'low';
    if (overallAvgBalancePercentage >= 100) balanceCoverage = 'excellent';
    else if (overallAvgBalancePercentage >= 50) balanceCoverage = 'good';
    else if (overallAvgBalancePercentage >= 25) balanceCoverage = 'moderate';

    return {
      companyName: accountInfo.accountName,
      analysisStartDate: periodFrom || '',
      analysisEndDate: periodTo || '',
      totalDays: monthly.reduce((sum, m) => sum + m.days, 0),
      totalTurnover: totalCredits,
      totalDebits,
      overallAverageBalance: overallAvgBalance,
      overallAvgBalancePercentage,
      monthly,
      quarterly,
      halfYearly,
      yearly: null,
      balanceCoverage
    };
  }, [transactions, accountInfo, balances, totalCredits, totalDebits, periodFrom, periodTo]);

  const statsCards = [
    {
      title: 'Total Credits',
      value: formatCurrency(totalCredits),
      icon: <ArrowUpRight className="h-5 w-5" />,
      color: 'text-success',
      bgColor: 'bg-success/10'
    },
    {
      title: 'Total Debits',
      value: formatCurrency(totalDebits),
      icon: <ArrowDownRight className="h-5 w-5" />,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10'
    },
    {
      title: 'Net Position',
      value: formatCurrency(totalCredits - totalDebits),
      icon: <TrendingUp className="h-5 w-5" />,
      color: totalCredits - totalDebits >= 0 ? 'text-success' : 'text-destructive',
      bgColor: totalCredits - totalDebits >= 0 ? 'bg-success/10' : 'bg-destructive/10'
    },
    {
      title: 'Transactions',
      value: transactionCount.toString(),
      icon: <FileText className="h-5 w-5" />,
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Account Info */}
      {(accountInfo.accountNumber || accountInfo.accountName || accountInfo.iban) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {accountInfo.accountName && (
                <div>
                  <p className="text-xs text-muted-foreground">Account Name</p>
                  <p className="font-medium">{accountInfo.accountName}</p>
                </div>
              )}
              {accountInfo.accountNumber && (
                <div>
                  <p className="text-xs text-muted-foreground">Account Number</p>
                  <p className="font-mono">{accountInfo.accountNumber}</p>
                </div>
              )}
              {accountInfo.iban && (
                <div>
                  <p className="text-xs text-muted-foreground">IBAN</p>
                  <p className="font-mono text-sm">{accountInfo.iban}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Period Info */}
      {(periodFrom || periodTo) && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>Statement Period: {periodFrom || '—'} to {periodTo || '—'}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <span className={stat.color}>{stat.icon}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Tabbed Analysis Views */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="turnover">Turnover Charts</TabsTrigger>
          <TabsTrigger value="balance">Balance Analysis</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Balance Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Balance Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Opening Balance</p>
                  <p className="text-lg font-semibold">{formatCurrency(balances.opening)}</p>
                </div>
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Average Balance</p>
                  <p className="text-lg font-semibold">{formatCurrency(balances.average)}</p>
                </div>
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Closing Balance</p>
                  <p className="text-lg font-semibold">{formatCurrency(balances.closing)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transaction Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Transaction Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center p-3 bg-success/5 border border-success/20 rounded-lg">
                  <p className="text-xs text-muted-foreground">Credit Transactions</p>
                  <p className="text-2xl font-bold text-success">{creditTransactions}</p>
                </div>
                <div className="text-center p-3 bg-destructive/5 border border-destructive/20 rounded-lg">
                  <p className="text-xs text-muted-foreground">Debit Transactions</p>
                  <p className="text-2xl font-bold text-destructive">{debitTransactions}</p>
                </div>
                <div className="text-center p-3 bg-primary/5 border border-primary/20 rounded-lg">
                  <p className="text-xs text-muted-foreground">Total Transactions</p>
                  <p className="text-2xl font-bold text-primary">{transactionCount}</p>
                </div>
                <div className="text-center p-3 bg-muted/50 border rounded-lg">
                  <p className="text-xs text-muted-foreground">Avg Transaction</p>
                  <p className="text-lg font-bold">{formatCurrency(avgTransactionSize)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Turnover Charts Tab */}
        <TabsContent value="turnover" className="mt-6">
          <TurnoverCharts report={turnoverReport} currency="AED" />
        </TabsContent>

        {/* Balance Analysis Tab */}
        <TabsContent value="balance" className="mt-6">
          <TurnoverBalanceDashboard report={turnoverReport} currency="AED" />
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="mt-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Transactions ({transactions.length})
                </CardTitle>
                <Badge variant="outline">{transactions.length} records</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Debit</TableHead>
                      <TableHead className="text-right">Credit</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((txn, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-mono text-xs whitespace-nowrap">
                          {txn.date}
                        </TableCell>
                        <TableCell className="max-w-[300px] truncate" title={txn.description}>
                          {txn.description}
                        </TableCell>
                        <TableCell className="text-right font-mono text-destructive">
                          {txn.debit > 0 ? formatCurrency(txn.debit) : '—'}
                        </TableCell>
                        <TableCell className="text-right font-mono text-success">
                          {txn.credit > 0 ? formatCurrency(txn.credit) : '—'}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(txn.balance)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
