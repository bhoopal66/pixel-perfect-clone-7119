import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileX, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from './ui/table';
import { cn } from '@/lib/utils';
import type { ClassifiedTransaction } from '../types/turnover.types';
import type { CurrencyCode } from '../services/currencyService';
import { CurrencyService } from '../services/currencyService';

interface ExcludedTransactionsListProps {
  transactions: ClassifiedTransaction[];
  currency: CurrencyCode;
}

export const ExcludedTransactionsList: React.FC<ExcludedTransactionsListProps> = ({
  transactions,
  currency
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const formatCurrency = (value: number) => CurrencyService.format(value, currency);

  const displayedTransactions = isExpanded 
    ? transactions 
    : transactions.slice(0, 5);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (transactions.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-destructive/10">
            <FileX className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <CardTitle className="text-lg">Excluded Transactions Details</CardTitle>
            <CardDescription>
              {transactions.length} transaction{transactions.length !== 1 ? 's' : ''} excluded from business turnover
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Date</TableHead>
                <TableHead className="min-w-[300px]">Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="w-[130px]">Type</TableHead>
                <TableHead>Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedTransactions.map((txn, idx) => (
                <motion.tr
                  key={`${txn.date}-${idx}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.03 }}
                  className={cn(
                    "hover:bg-muted/50",
                    txn.classification.type === 'cash-deposit' && "bg-warning/10",
                    txn.classification.type === 'sister-concern' && "bg-destructive/10"
                  )}
                >
                  <TableCell className="font-medium text-sm">
                    {formatDate(txn.date)}
                  </TableCell>
                  <TableCell className="text-sm max-w-xs truncate" title={txn.description}>
                    {txn.description}
                  </TableCell>
                  <TableCell className="text-right font-medium text-destructive">
                    {formatCurrency(txn.credit)}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline"
                      className={cn(
                        txn.classification.type === 'cash-deposit' && 
                          "border-warning text-warning bg-warning/10",
                        txn.classification.type === 'sister-concern' && 
                          "border-destructive text-destructive bg-destructive/10"
                      )}
                    >
                      {txn.classification.type === 'cash-deposit' ? 'Cash Deposit' : 'Sister Concern'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {txn.classification.reason}
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </div>

        {transactions.length > 5 && (
          <div className="mt-4 flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="gap-2"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Show All ({transactions.length} transactions)
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
