import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, AlertTriangle, FileText, Receipt } from 'lucide-react';
import { CurrencyService } from '@/services/currencyService';
import type { ParsedBankFile, ParsedVatFile } from '@/types/assessment.types';

interface ExtractionReviewProps {
  bankFiles: ParsedBankFile[];
  vatFiles: ParsedVatFile[];
}

const fmt = (v: number) => CurrencyService.format(v, 'AED');

export const ExtractionReview: React.FC<ExtractionReviewProps> = ({ bankFiles, vatFiles }) => {
  const validBankFiles = bankFiles.filter(f => f.isValid);
  const validVatFiles = vatFiles.filter(f => f.isValid);
  const totalTxns = validBankFiles.reduce((s, f) => s + f.transactions.length, 0);

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-foreground">{validBankFiles.length}</p>
            <p className="text-xs text-muted-foreground">Valid Statements</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-foreground">{totalTxns}</p>
            <p className="text-xs text-muted-foreground">Transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-foreground">{validVatFiles.length}</p>
            <p className="text-xs text-muted-foreground">VAT Returns</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-foreground">
              {[...new Set(validBankFiles.map(f => f.bankName).filter(Boolean))].length}
            </p>
            <p className="text-xs text-muted-foreground">Banks Detected</p>
          </CardContent>
        </Card>
      </div>

      {/* Bank Statement Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Bank Statements Extracted
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File</TableHead>
                <TableHead>Bank</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Period</TableHead>
                <TableHead className="text-right">Transactions</TableHead>
                <TableHead className="text-right">Credits</TableHead>
                <TableHead className="text-right">Debits</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bankFiles.map((file, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium text-sm max-w-[200px] truncate">{file.fileName}</TableCell>
                  <TableCell>
                    {file.bankName ? <Badge variant="secondary">{file.bankName}</Badge> : <span className="text-muted-foreground text-xs">Unknown</span>}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {file.accountNumber || '—'}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {file.periodFrom && file.periodTo ? `${file.periodFrom} to ${file.periodTo}` : '—'}
                  </TableCell>
                  <TableCell className="text-right">{file.transactions.length}</TableCell>
                  <TableCell className="text-right text-success font-mono text-sm">{fmt(file.totalCredits)}</TableCell>
                  <TableCell className="text-right text-destructive font-mono text-sm">{fmt(file.totalDebits)}</TableCell>
                  <TableCell>
                    {file.isValid ? (
                      <Badge className="bg-success/10 text-success border-success/30">
                        <CheckCircle className="h-3 w-3 mr-1" /> Valid
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="text-xs">
                        <AlertTriangle className="h-3 w-3 mr-1" /> {file.validationMessage || 'Invalid'}
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* VAT Returns Details */}
      {vatFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-accent" />
              VAT Returns Extracted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File</TableHead>
                  <TableHead>Tax Period</TableHead>
                  <TableHead className="text-right">Taxable Sales</TableHead>
                  <TableHead className="text-right">Output VAT</TableHead>
                  <TableHead className="text-right">Input VAT</TableHead>
                  <TableHead className="text-right">Net VAT</TableHead>
                  <TableHead>Confidence</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vatFiles.map((file, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium text-sm max-w-[200px] truncate">{file.fileName}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {file.taxPeriodFrom && file.taxPeriodTo
                        ? `${file.taxPeriodFrom} to ${file.taxPeriodTo}`
                        : '—'}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">{fmt(file.taxableSupplies)}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{fmt(file.outputVat)}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{fmt(file.inputVat)}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{fmt(file.netVatPayable)}</TableCell>
                    <TableCell>
                      <Badge variant={file.confidence === 'high' ? 'default' : file.confidence === 'medium' ? 'secondary' : 'destructive'}>
                        {file.confidence}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
