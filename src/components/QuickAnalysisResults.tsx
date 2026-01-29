import React from 'react';
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
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from './ui/table';
import { CurrencyService } from '@/services/currencyService';
import type { ParsedStatementData } from '@/hooks/usePdfParsing';

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

      {/* Transactions Table */}
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
          <ScrollArea className="h-[400px]">
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
    </div>
  );
};
