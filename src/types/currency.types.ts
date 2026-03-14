// Multi-currency assessment types

export interface AccountCurrencyConfig {
  documentId: string;
  fileName: string;
  bankId: string | null;
  bankName: string | null;
  bankNameConfirmed: string | null;
  bankDetectionSource: 'auto' | 'manual';
  accountNumber: string | null;
  statementCurrencyCode: string;
  currencyDetectionSource: 'auto' | 'manual';
  currencyConfirmed: boolean;
  bankConfirmed: boolean;
  exchangeRate: number;
  exchangeRateEntered: boolean;
}

export interface CurrencyConversionRate {
  id?: string;
  caseId: string;
  documentId: string | null;
  accountNumber: string | null;
  fromCurrency: string;
  toCurrency: string;
  exchangeRate: number;
  effectiveFromDate: string | null;
  effectiveToDate: string | null;
  conversionMethod: 'manual_fixed' | 'period_rate' | 'account_level';
  isActive: boolean;
  remarks: string | null;
}

export interface BankMasterEntry {
  id: string;
  bank_name: string;
  short_name: string | null;
  country: string;
  is_active: boolean;
}

export interface CurrencyMasterEntry {
  currency_code: string;
  currency_name: string;
  symbol: string;
  decimal_places: number;
  is_active: boolean;
}

export type CurrencyViewMode = 'original' | 'base';
