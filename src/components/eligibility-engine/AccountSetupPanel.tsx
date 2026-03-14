import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, CheckCircle, Building2, Coins, ArrowRightLeft, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { AccountCurrencyConfig, BankMasterEntry, CurrencyMasterEntry } from '@/types/currency.types';

interface AccountSetupPanelProps {
  accounts: AccountCurrencyConfig[];
  baseReportingCurrency: string;
  onAccountUpdate: (index: number, updates: Partial<AccountCurrencyConfig>) => void;
  onBaseReportingCurrencyChange: (currency: string) => void;
}

export const AccountSetupPanel: React.FC<AccountSetupPanelProps> = ({
  accounts,
  baseReportingCurrency,
  onAccountUpdate,
  onBaseReportingCurrencyChange,
}) => {
  const [banks, setBanks] = useState<BankMasterEntry[]>([]);
  const [currencies, setCurrencies] = useState<CurrencyMasterEntry[]>([]);

  useEffect(() => {
    const fetchMasters = async () => {
      const [bankRes, currRes] = await Promise.all([
        supabase.from('bank_master').select('*').eq('is_active', true).order('bank_name'),
        supabase.from('currency_master').select('*').eq('is_active', true).order('currency_code'),
      ]);
      if (bankRes.data) setBanks(bankRes.data as any[]);
      if (currRes.data) setCurrencies(currRes.data as any[]);
    };
    fetchMasters();
  }, []);

  const hasForeignCurrency = accounts.some(a => a.statementCurrencyCode !== baseReportingCurrency);
  const missingRates = accounts.filter(a => 
    a.statementCurrencyCode !== baseReportingCurrency && !a.exchangeRateEntered
  );

  return (
    <div className="space-y-6">
      {/* Base Reporting Currency */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Coins className="h-5 w-5 text-primary" />
            Base Reporting Currency
          </CardTitle>
          <CardDescription>All consolidated analysis will be reported in this currency</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Select value={baseReportingCurrency} onValueChange={onBaseReportingCurrencyChange}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currencies.map(c => (
                  <SelectItem key={c.currency_code} value={c.currency_code}>
                    {c.currency_code} — {c.currency_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasForeignCurrency && (
              <Badge variant="outline" className="border-warning text-warning">
                <ArrowRightLeft className="h-3 w-3 mr-1" />
                Multi-currency case
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Warnings */}
      {missingRates.length > 0 && (
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">Exchange rates required</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {missingRates.length} account(s) have a different currency from the base ({baseReportingCurrency}).
                  Please enter exchange rates before running consolidated analysis.
                </p>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {missingRates.map((a, i) => (
                    <Badge key={i} variant="destructive" className="text-xs">
                      {a.fileName}: {a.statementCurrencyCode}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Per-Account Setup */}
      {accounts.map((account, idx) => {
        const isForeign = account.statementCurrencyCode !== baseReportingCurrency;
        return (
          <Card key={idx} className={isForeign ? 'border-accent/30' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate max-w-[300px]">{account.fileName}</span>
                </div>
                <div className="flex items-center gap-2">
                  {account.bankConfirmed && account.currencyConfirmed ? (
                    <Badge className="bg-success/10 text-success border-success/30 text-xs">
                      <CheckCircle className="h-3 w-3 mr-1" /> Confirmed
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs border-warning text-warning">
                      Needs confirmation
                    </Badge>
                  )}
                  <Badge variant="secondary" className="text-xs">{account.statementCurrencyCode}</Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Bank Selection */}
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Bank Name</Label>
                  <Select
                    value={account.bankId || '__other'}
                    onValueChange={(val) => {
                      if (val === '__other') {
                        onAccountUpdate(idx, { bankId: null, bankDetectionSource: 'manual', bankConfirmed: true });
                      } else {
                        const bank = banks.find(b => b.id === val);
                        onAccountUpdate(idx, {
                          bankId: val,
                          bankNameConfirmed: bank?.bank_name || null,
                          bankDetectionSource: 'manual',
                          bankConfirmed: true,
                        });
                      }
                    }}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select bank..." />
                    </SelectTrigger>
                    <SelectContent>
                      {banks.map(b => (
                        <SelectItem key={b.id} value={b.id}>{b.bank_name}</SelectItem>
                      ))}
                      <SelectItem value="__other">Other / Manual Entry</SelectItem>
                    </SelectContent>
                  </Select>
                  {(!account.bankId || account.bankId === '__other') && (
                    <Input
                      className="mt-2"
                      placeholder="Enter bank name manually..."
                      value={account.bankNameConfirmed || ''}
                      onChange={e => onAccountUpdate(idx, {
                        bankNameConfirmed: e.target.value,
                        bankDetectionSource: 'manual',
                        bankConfirmed: !!e.target.value,
                      })}
                    />
                  )}
                  {account.bankName && account.bankDetectionSource === 'auto' && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Info className="h-3 w-3" /> Auto-detected: {account.bankName}
                    </p>
                  )}
                </div>

                {/* Currency Selection */}
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Account Currency</Label>
                  <Select
                    value={account.statementCurrencyCode}
                    onValueChange={(val) => onAccountUpdate(idx, {
                      statementCurrencyCode: val,
                      currencyDetectionSource: 'manual',
                      currencyConfirmed: true,
                      exchangeRate: val === baseReportingCurrency ? 1 : account.exchangeRate,
                      exchangeRateEntered: val === baseReportingCurrency,
                    })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map(c => (
                        <SelectItem key={c.currency_code} value={c.currency_code}>
                          {c.symbol} {c.currency_code} — {c.currency_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {account.currencyDetectionSource === 'auto' && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Info className="h-3 w-3" /> Auto-detected
                    </p>
                  )}
                </div>
              </div>

              {/* Exchange Rate (for foreign currency accounts) */}
              {isForeign && (
                <>
                  <Separator />
                  <div className="bg-accent/5 border border-accent/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <ArrowRightLeft className="h-4 w-4 text-accent" />
                      <span className="text-sm font-medium">Currency Conversion</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-xs">From</Label>
                        <Input value={account.statementCurrencyCode} disabled className="mt-1 bg-muted" />
                      </div>
                      <div>
                        <Label className="text-xs">To</Label>
                        <Input value={baseReportingCurrency} disabled className="mt-1 bg-muted" />
                      </div>
                      <div>
                        <Label className="text-xs">Exchange Rate</Label>
                        <Input
                          type="number"
                          step="0.0001"
                          min="0.0001"
                          className="mt-1"
                          placeholder="e.g. 3.6725"
                          value={account.exchangeRate || ''}
                          onChange={e => {
                            const rate = parseFloat(e.target.value);
                            onAccountUpdate(idx, {
                              exchangeRate: isNaN(rate) ? 0 : rate,
                              exchangeRateEntered: !isNaN(rate) && rate > 0,
                            });
                          }}
                        />
                      </div>
                    </div>
                    {account.exchangeRateEntered && account.exchangeRate > 0 && (
                      <p className="text-xs text-muted-foreground mt-2">
                        1 {account.statementCurrencyCode} = {account.exchangeRate} {baseReportingCurrency}
                      </p>
                    )}
                    {!account.exchangeRateEntered && (
                      <p className="text-xs text-destructive mt-2 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Exchange rate is required for consolidated analysis
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* Account Number */}
              {account.accountNumber && (
                <p className="text-xs text-muted-foreground">Account: {account.accountNumber}</p>
              )}
            </CardContent>
          </Card>
        );
      })}

      {accounts.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground py-12">
            Upload bank statements first to configure account settings.
          </CardContent>
        </Card>
      )}
    </div>
  );
};
