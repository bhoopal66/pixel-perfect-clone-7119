import React from 'react';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { CheckCircle, FileText, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { CurrencyService } from '@/services/currencyService';
import type { ParsedStatementData } from '@/hooks/usePdfParsing';

interface ParsedDataPreviewProps {
  data: ParsedStatementData;
  onApply: (data: {
    declaredTurnover: number;
    periodFrom?: string;
    periodTo?: string;
  }) => void;
  onDismiss: () => void;
}

export const ParsedDataPreview: React.FC<ParsedDataPreviewProps> = ({
  data,
  onApply,
  onDismiss,
}) => {
  const formatCurrency = (value: number) => CurrencyService.format(value, 'AED');

  const handleApply = () => {
    onApply({
      declaredTurnover: data.totalCredits,
      periodFrom: data.periodFrom,
      periodTo: data.periodTo,
    });
  };

  return (
    <Alert className="border-success/50 bg-success/10">
      <CheckCircle className="h-4 w-4 text-success" />
      <AlertDescription className="ml-2">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-medium text-foreground">
              Statement Parsed Successfully
            </span>
            <span className="text-xs text-muted-foreground">
              {data.transactions.length} transactions found
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-success" />
              <div>
                <p className="text-xs text-muted-foreground">Total Credits</p>
                <p className="font-mono font-medium">{formatCurrency(data.totalCredits)}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-destructive" />
              <div>
                <p className="text-xs text-muted-foreground">Total Debits</p>
                <p className="font-mono font-medium">{formatCurrency(data.totalDebits)}</p>
              </div>
            </div>

            {data.periodFrom && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Period Start</p>
                  <p className="font-medium">{data.periodFrom}</p>
                </div>
              </div>
            )}

            {data.periodTo && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Period End</p>
                  <p className="font-medium">{data.periodTo}</p>
                </div>
              </div>
            )}
          </div>

          {data.accountInfo.accountNumber && (
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Account:</span>
              <span className="font-mono">{data.accountInfo.accountNumber}</span>
              {data.accountInfo.iban && (
                <span className="text-muted-foreground">({data.accountInfo.iban})</span>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              size="sm"
              onClick={handleApply}
              className="flex-1"
            >
              Apply Extracted Data
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onDismiss}
            >
              Dismiss
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Clicking "Apply" will set Declared Turnover to total credits ({formatCurrency(data.totalCredits)})
            {data.periodFrom && data.periodTo && ` and period dates to ${data.periodFrom} - ${data.periodTo}`}.
          </p>
        </div>
      </AlertDescription>
    </Alert>
  );
};
