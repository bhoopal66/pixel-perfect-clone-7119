import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertTriangle, XCircle, FileText, ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { ScrollArea } from './ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { SUPPORTED_BANKS } from '@/hooks/usePdfParsing';
import type { ParsedStatementData } from '@/hooks/usePdfParsing';

interface ParsedTransactionPreviewProps {
  data: ParsedStatementData;
  fileName: string;
  onConfirm: () => void;
  onRetry: (bankHint: string) => void;
  onBack: () => void;
  isRetrying?: boolean;
}

export const ParsedTransactionPreview: React.FC<ParsedTransactionPreviewProps> = ({
  data,
  fileName,
  onConfirm,
  onRetry,
  onBack,
  isRetrying = false
}) => {
  const [selectedBank, setSelectedBank] = React.useState<string>('auto');
  const [showAllTransactions, setShowAllTransactions] = React.useState(false);
  
  const { transactions, totalCredits, totalDebits, periodFrom, periodTo, accountInfo, detectedBank } = data;
  const transactionCount = transactions.length;
  const previewCount = 10;
  const displayedTransactions = showAllTransactions ? transactions : transactions.slice(0, previewCount);
  
  // Get detected bank label
  const detectedBankLabel = detectedBank?.detectedBank 
    ? SUPPORTED_BANKS.find(b => b.value === detectedBank.detectedBank)?.label || detectedBank.detectedBank
    : null;

  // Determine extraction quality
  const getExtractionStatus = () => {
    if (transactionCount === 0) return 'error';
    if (transactionCount < 5) return 'warning';
    return 'success';
  };
  
  const status = getExtractionStatus();
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return dateStr;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-5xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Upload
        </Button>
        <div className="flex items-center gap-2">
          {detectedBankLabel && (
            <Badge 
              variant="secondary" 
              className={`gap-1 ${
                detectedBank?.confidence === 'high' ? 'bg-success/10 text-success border-success/30' :
                detectedBank?.confidence === 'medium' ? 'bg-primary/10 text-primary border-primary/30' :
                'bg-warning/10 text-warning border-warning/30'
              }`}
            >
              {detectedBank?.confidence === 'high' && <CheckCircle className="h-3 w-3" />}
              {detectedBankLabel}
            </Badge>
          )}
          <Badge variant="outline" className="gap-2">
            <FileText className="h-3 w-3" />
            {fileName}
          </Badge>
        </div>
      </div>

      {/* Status Card */}
      <Card className={`border-2 ${
        status === 'success' ? 'border-success/50 bg-success/5' :
        status === 'warning' ? 'border-warning/50 bg-warning/5' :
        'border-destructive/50 bg-destructive/5'
      }`}>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            {status === 'success' && <CheckCircle className="h-8 w-8 text-success flex-shrink-0" />}
            {status === 'warning' && <AlertTriangle className="h-8 w-8 text-warning flex-shrink-0" />}
            {status === 'error' && <XCircle className="h-8 w-8 text-destructive flex-shrink-0" />}
            
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-foreground mb-1">
                {status === 'success' && `Successfully extracted ${transactionCount} transactions`}
                {status === 'warning' && `Only ${transactionCount} transactions found`}
                {status === 'error' && 'No transactions could be extracted'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {status === 'success' && 'Review the transactions below and confirm to proceed with analysis.'}
                {status === 'warning' && 'This seems low. Try selecting your bank manually for better results.'}
                {status === 'error' && 'The PDF format may not be supported. Try selecting your bank manually.'}
              </p>
              
              {/* Retry with different bank */}
              {(status === 'warning' || status === 'error') && (
                <div className="flex items-center gap-3 mt-4">
                  <Select value={selectedBank} onValueChange={setSelectedBank}>
                    <SelectTrigger className="w-64 bg-background">
                      <SelectValue placeholder="Select your bank" />
                    </SelectTrigger>
                    <SelectContent>
                      {SUPPORTED_BANKS.filter(b => b.value !== 'auto').map(bank => (
                        <SelectItem key={bank.value} value={bank.value}>
                          {bank.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() => onRetry(selectedBank)}
                    disabled={isRetrying || selectedBank === 'auto'}
                    size="sm"
                  >
                    {isRetrying ? 'Retrying...' : 'Retry Parsing'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      {transactionCount > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-muted-foreground">Total Credits</p>
              <p className="text-xl font-bold text-success">{formatCurrency(totalCredits)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-muted-foreground">Total Debits</p>
              <p className="text-xl font-bold text-destructive">{formatCurrency(totalDebits)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-muted-foreground">Period</p>
              <p className="text-sm font-medium">
                {periodFrom && periodTo ? `${periodFrom} to ${periodTo}` : 'Not detected'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-muted-foreground">Account</p>
              <p className="text-sm font-medium truncate">
                {accountInfo.iban || accountInfo.accountNumber || 'Not detected'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Transaction Preview Table */}
      {transactionCount > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Transaction Preview</CardTitle>
              <Badge variant="secondary">{transactionCount} transactions</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right w-[120px]">Debit</TableHead>
                    <TableHead className="text-right w-[120px]">Credit</TableHead>
                    <TableHead className="text-right w-[120px]">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedTransactions.map((txn, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono text-xs">
                        {formatDate(txn.date)}
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate" title={txn.description}>
                        {txn.description}
                      </TableCell>
                      <TableCell className="text-right text-destructive">
                        {txn.debit > 0 ? formatCurrency(txn.debit) : '-'}
                      </TableCell>
                      <TableCell className="text-right text-success">
                        {txn.credit > 0 ? formatCurrency(txn.credit) : '-'}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {txn.balance > 0 ? formatCurrency(txn.balance) : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
            
            {/* Show more/less toggle */}
            {transactionCount > previewCount && (
              <div className="mt-4 text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllTransactions(!showAllTransactions)}
                  className="gap-2"
                >
                  {showAllTransactions ? (
                    <>
                      <ChevronUp className="h-4 w-4" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      Show All {transactionCount} Transactions
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onBack}>
          Cancel
        </Button>
        <Button 
          onClick={onConfirm} 
          disabled={transactionCount === 0}
          className="gap-2"
        >
          <CheckCircle className="h-4 w-4" />
          Confirm & Proceed
        </Button>
      </div>
    </motion.div>
  );
};
