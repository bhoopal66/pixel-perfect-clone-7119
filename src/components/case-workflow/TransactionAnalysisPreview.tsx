import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  FileText,
  Calendar,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Check,
  X
} from 'lucide-react';
import { CurrencyService } from '@/services/currencyService';
import { cn } from '@/lib/utils';
import type { ParsedStatementData } from '@/hooks/usePdfParsing';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../ui/collapsible';

interface TransactionAnalysisPreviewProps {
  data: ParsedStatementData;
  fileName: string;
  onApply: (data: {
    declaredTurnover: number;
    periodFrom?: string;
    periodTo?: string;
    cashAdjustment?: number;
  }) => void;
  onDismiss: () => void;
  isApplying?: boolean;
}

export const TransactionAnalysisPreview: React.FC<TransactionAnalysisPreviewProps> = ({
  data,
  fileName,
  onApply,
  onDismiss,
  isApplying = false,
}) => {
  const [showTransactions, setShowTransactions] = React.useState(false);
  const formatCurrency = (value: number) => CurrencyService.format(value, 'AED');

  // Calculate cash deposits from transactions (based on description matching)
  const cashDeposits = data.transactions
    .filter(t => {
      const desc = t.description.toLowerCase();
      return desc.includes('cash') || 
             desc.includes('cdm') ||
             desc.includes('cash deposit') ||
             desc.includes('atm deposit');
    })
    .reduce((sum, t) => sum + t.credit, 0);

  // Group transactions by inferred category from description
  const inferCategory = (description: string): string => {
    const desc = description.toLowerCase();
    if (desc.includes('cash') || desc.includes('cdm')) return 'Cash Deposit';
    if (desc.includes('salary') || desc.includes('payroll')) return 'Salary';
    if (desc.includes('transfer') || desc.includes('trf')) return 'Transfer';
    if (desc.includes('cheque') || desc.includes('chq')) return 'Cheque';
    if (desc.includes('fee') || desc.includes('charge')) return 'Bank Charges';
    if (desc.includes('payment') || desc.includes('pay')) return 'Payment';
    return 'Other';
  };

  const categoryBreakdown = data.transactions.reduce((acc, t) => {
    const cat = inferCategory(t.description);
    if (!acc[cat]) {
      acc[cat] = { credits: 0, debits: 0, count: 0 };
    }
    acc[cat].credits += t.credit;
    acc[cat].debits += t.debit;
    acc[cat].count += 1;
    return acc;
  }, {} as Record<string, { credits: number; debits: number; count: number }>);

  const handleApply = () => {
    onApply({
      declaredTurnover: data.totalCredits,
      periodFrom: data.periodFrom,
      periodTo: data.periodTo,
      cashAdjustment: cashDeposits,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-success/10 rounded-lg border border-success/30">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-success/20 rounded-lg">
            <Sparkles className="h-4 w-4 text-success" />
          </div>
          <div>
            <p className="font-medium text-sm">Data Extracted from {fileName}</p>
            <p className="text-xs text-muted-foreground">
              {data.transactions.length} transactions found
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-success border-success">
          Auto-Parsed
        </Badge>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-success/30 bg-success/5">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-3 w-3 text-success" />
              <span className="text-xs text-muted-foreground">Total Credits</span>
            </div>
            <p className="font-mono font-bold text-lg">{formatCurrency(data.totalCredits)}</p>
          </CardContent>
        </Card>

        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="h-3 w-3 text-destructive" />
              <span className="text-xs text-muted-foreground">Total Debits</span>
            </div>
            <p className="font-mono font-bold text-lg">{formatCurrency(data.totalDebits)}</p>
          </CardContent>
        </Card>

        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="h-3 w-3 text-warning" />
              <span className="text-xs text-muted-foreground">Cash Deposits</span>
            </div>
            <p className="font-mono font-bold text-lg">{formatCurrency(cashDeposits)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Period</span>
            </div>
            <p className="font-medium text-sm">
              {data.periodFrom && data.periodTo 
                ? `${data.periodFrom} to ${data.periodTo}`
                : 'N/A'
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <Collapsible open={showTransactions} onOpenChange={setShowTransactions}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between" size="sm">
            <span className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Category Breakdown ({Object.keys(categoryBreakdown).length} categories)
            </span>
            {showTransactions ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2">
          <div className="max-h-48 overflow-y-auto space-y-1 p-2 bg-muted/30 rounded-lg">
            {Object.entries(categoryBreakdown)
              .sort((a, b) => b[1].credits - a[1].credits)
              .map(([category, data]) => (
                <div key={category} className="flex justify-between items-center text-sm py-1.5 px-2 hover:bg-muted rounded">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{data.count}</Badge>
                    <span className="truncate max-w-[150px]">{category}</span>
                  </div>
                  <div className="flex gap-4 text-xs font-mono">
                    {data.credits > 0 && (
                      <span className="text-success">+{formatCurrency(data.credits)}</span>
                    )}
                    {data.debits > 0 && (
                      <span className="text-destructive">-{formatCurrency(data.debits)}</span>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Proposed Values */}
      <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
        <p className="text-sm font-medium mb-3">Proposed Values to Apply:</p>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Declared Turnover:</p>
            <p className="font-mono font-semibold">{formatCurrency(data.totalCredits)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Cash Adjustment:</p>
            <p className="font-mono font-semibold text-warning">{formatCurrency(cashDeposits)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Adjusted Turnover:</p>
            <p className="font-mono font-bold text-primary">
              {formatCurrency(data.totalCredits - cashDeposits)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Period:</p>
            <p className="font-medium">
              {data.periodFrom && data.periodTo 
                ? `${data.periodFrom} → ${data.periodTo}`
                : 'Will need manual entry'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onDismiss}
          disabled={isApplying}
          className="flex-1"
        >
          <X className="mr-2 h-4 w-4" />
          Dismiss
        </Button>
        <Button
          onClick={handleApply}
          disabled={isApplying}
          className="flex-1"
        >
          <Check className="mr-2 h-4 w-4" />
          {isApplying ? 'Applying...' : 'Apply Extracted Data'}
        </Button>
      </div>
    </motion.div>
  );
};
