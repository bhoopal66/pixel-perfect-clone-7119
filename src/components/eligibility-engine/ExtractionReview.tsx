import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, AlertTriangle, FileText, Receipt, Coins } from 'lucide-react';
import { CurrencyService } from '@/services/currencyService';
import type { CurrencyCode } from '@/services/currencyService';
import type { ParsedBankFile, ParsedVatFile } from '@/types/assessment.types';
import type { AccountCurrencyConfig } from '@/types/currency.types';

interface ExtractionReviewProps {
  bankFiles: ParsedBankFile[];
  vatFiles: ParsedVatFile[];
  baseReportingCurrency?: string;
  accountConfigs?: AccountCurrencyConfig[];
}

export const ExtractionReview: React.FC<ExtractionReviewProps> = ({
  bankFiles,
  vatFiles,
  baseReportingCurrency = 'AED',
  accountConfigs = [],
}) => {
  const validBankFiles = bankFiles.filter(f => f.isValid);
  const validVatFiles = vatFiles.filter(f => f.isValid);
  const totalTxns = validBankFiles.reduce((s, f) => s + f.transactions.length, 0);
  const currencies = [...new Set(accountConfigs.map(a => a.statementCurrencyCode))];
  const isMultiCurrency = currencies.length > 1 || (currencies.length === 1 && currencies[0] !== baseReportingCurrency);

  const fmtForFile = (v: number, idx: number) => {
    const ac = accountConfigs[idx];
    const code = (ac?.statementCurrencyCode || baseReportingCurrency || 'AED') as CurrencyCode;
    return CurrencyService.format(v, code);
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
        <Card className={isMultiCurrency ? 'border-accent/30' : ''}>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-foreground">{currencies.length}</p>
            <p className="text-xs text-muted-foreground">Currencies</p>
            {isMultiCurrency && (
              <div className="flex justify-center gap-1 mt-1 flex-wrap">
                {currencies.map(c => (
                  <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Multi-currency indicator */}
      {isMultiCurrency && (
        <Card className="border-accent/20 bg-accent/5">
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <Coins className="h-5 w-5 text-accent" />
            <div>
              <p className="text-sm font-medium">Multi-Currency Case</p>
              <p className="text-xs text-muted-foreground">
                Base reporting currency: <strong>{baseReportingCurrency}</strong>.
                Currencies detected: {currencies.join(', ')}.
                All consolidated analysis will use {baseReportingCurrency}.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

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
                <TableHead>Currency</TableHead>
                <TableHead>Period</TableHead>
                <TableHead className="text-right">Transactions</TableHead>
                <TableHead className="text-right">Credits</TableHead>
                <TableHead className="text-right">Debits</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bankFiles.map((file, idx) => {
                const ac = accountConfigs[idx];
                const fileCurrency = ac?.statementCurrencyCode || file.detectedCurrency || 'AED';
                const isForeign = fileCurrency !== baseReportingCurrency;
                return (
                  <TableRow key={idx}>
                    <TableCell className="font-medium text-sm max-w-[200px] truncate">{file.fileName}</TableCell>
                    <TableCell>
                      {(ac?.bankNameConfirmed || file.bankName)
                        ? <Badge variant="secondary">{ac?.bankNameConfirmed || file.bankName}</Badge>
                        : <span className="text-muted-foreground text-xs">Unknown</span>}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {file.accountNumber || '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={isForeign ? 'outline' : 'secondary'} className={isForeign ? 'border-accent text-accent' : ''}>
                        {fileCurrency}
                      </Badge>
                      {isForeign && ac?.exchangeRateEntered && (
                        <span className="text-xs text-muted-foreground ml-1">×{ac.exchangeRate}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {file.periodFrom && file.periodTo ? `${file.periodFrom} to ${file.periodTo}` : '—'}
                    </TableCell>
                    <TableCell className="text-right">{file.transactions.length}</TableCell>
                    <TableCell className="text-right text-success font-mono text-sm">{fmtForFile(file.totalCredits, idx)}</TableCell>
                    <TableCell className="text-right text-destructive font-mono text-sm">{fmtForFile(file.totalDebits, idx)}</TableCell>
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
                );
              })}
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
                    <TableCell className="text-right font-mono text-sm">
                      {CurrencyService.format(file.taxableSupplies, baseReportingCurrency as CurrencyCode)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {CurrencyService.format(file.outputVat, baseReportingCurrency as CurrencyCode)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {CurrencyService.format(file.inputVat, baseReportingCurrency as CurrencyCode)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {CurrencyService.format(file.netVatPayable, baseReportingCurrency as CurrencyCode)}
                    </TableCell>
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
