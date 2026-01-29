import React from 'react';
import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { 
  CheckCircle, 
  FileText, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Sparkles,
  ArrowRight,
  RotateCcw,
  AlertTriangle
} from 'lucide-react';
import { CurrencyService } from '@/services/currencyService';
import type { ParsedStatementData } from '@/hooks/usePdfParsing';

interface ParsedFilesPreviewProps {
  files: { name: string; data: ParsedStatementData }[];
  onProceed: () => void;
  onReset: () => void;
  isProcessing?: boolean;
}

export const ParsedFilesPreview: React.FC<ParsedFilesPreviewProps> = ({
  files,
  onProceed,
  onReset,
  isProcessing = false,
}) => {
  const formatCurrency = (value: number) => CurrencyService.format(value, 'AED');

  // Aggregate totals across all files
  const totals = files.reduce(
    (acc, file) => ({
      transactions: acc.transactions + file.data.transactions.length,
      credits: acc.credits + file.data.totalCredits,
      debits: acc.debits + file.data.totalDebits,
    }),
    { transactions: 0, credits: 0, debits: 0 }
  );

  // Find date range
  const allDates = files.flatMap(f => [f.data.periodFrom, f.data.periodTo].filter(Boolean)) as string[];
  const sortedDates = allDates.sort();
  const periodFrom = sortedDates[0];
  const periodTo = sortedDates[sortedDates.length - 1];

  const noTransactionsFound = totals.transactions === 0;

  return (
    <div className="w-full max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 text-success mb-4">
          <Sparkles className="h-4 w-4" />
          <span className="text-sm font-medium">Statements Parsed Successfully</span>
        </div>
        <h2 className="text-3xl font-bold text-foreground mb-3">
          Review Extracted Data
        </h2>
        <p className="text-muted-foreground text-lg">
          {files.length} file{files.length > 1 ? 's' : ''} processed • {totals.transactions} transactions found
        </p>
      </motion.div>

      {/* Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
      >
        <Card className="border-success/20 bg-success/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">Total Credits</p>
              <TrendingUp className="h-4 w-4 text-success" />
            </div>
            <p className="text-2xl font-bold text-foreground">
              {formatCurrency(totals.credits)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Incoming transactions
            </p>
          </CardContent>
        </Card>

        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">Total Debits</p>
              <TrendingDown className="h-4 w-4 text-destructive" />
            </div>
            <p className="text-2xl font-bold text-foreground">
              {formatCurrency(totals.debits)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Outgoing transactions
            </p>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">Transactions</p>
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <p className="text-2xl font-bold text-foreground">
              {totals.transactions}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Total extracted
            </p>
          </CardContent>
        </Card>

        <Card className="border-accent/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">Period</p>
              <Calendar className="h-4 w-4 text-accent" />
            </div>
            <p className="text-lg font-bold text-foreground">
              {periodFrom && periodTo ? (
                <>
                  {periodFrom}
                  <br />
                  <span className="text-sm font-normal text-muted-foreground">to</span> {periodTo}
                </>
              ) : (
                'N/A'
              )}
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* File Details */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-3 mb-6"
      >
        <h3 className="text-sm font-semibold text-foreground">File Breakdown</h3>
        {files.map((file, index) => (
          <Card key={index} className="border-border/50">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-destructive/10">
                    <FileText className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {file.data.transactions.length} transactions
                      {file.data.accountInfo.accountNumber && ` • Account: ${file.data.accountInfo.accountNumber}`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono text-success">+{formatCurrency(file.data.totalCredits)}</p>
                  <p className="text-sm font-mono text-destructive">-{formatCurrency(file.data.totalDebits)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Warning if no transactions */}
      {noTransactionsFound && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              No transactions could be extracted from the uploaded files. The PDF format may not be supported.
              The analysis will use demo data for demonstration purposes.
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex gap-4"
      >
        <Button
          variant="outline"
          onClick={onReset}
          disabled={isProcessing}
          className="flex-1"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Upload Different Files
        </Button>
        <Button
          onClick={onProceed}
          disabled={isProcessing}
          className="flex-1 gradient-accent"
        >
          {isProcessing ? (
            'Processing...'
          ) : (
            <>
              Generate Full Analysis
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </motion.div>
    </div>
  );
};
