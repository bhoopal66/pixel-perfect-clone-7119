// CORRECT Turnover Analysis Types
// Turnover = Total Credits (simple sum of all credit transactions)
// Average Balance = Average of all EOD (End of Day) balances
// Avg Balance % = (Average Balance / Turnover) × 100

import type { CurrencyCode } from '../services/currencyService';

export interface TurnoverAnalysis {
  turnover: number;           // Total credits (THIS is turnover)
  totalDebits: number;        // For reference only
  averageBalance: number;     // Average of all EOD balances
  avgBalancePercentage: number; // (Average Balance / Turnover) × 100
  days: number;
  openingBalance: number;
  closingBalance: number;
}

export interface MonthlyTurnoverAnalysis extends TurnoverAnalysis {
  month: string;
}

export interface QuarterlyTurnoverAnalysis extends TurnoverAnalysis {
  quarter: string;
  months: string[];
}

export interface HalfYearlyTurnoverAnalysis extends TurnoverAnalysis {
  period: 'H1' | 'H2';
  year: number;
  months: string[];
}

export interface YearlyTurnoverAnalysis extends TurnoverAnalysis {
  year: number;
  h1: HalfYearlyTurnoverAnalysis | null;
  h2: HalfYearlyTurnoverAnalysis | null;
  quarters: QuarterlyTurnoverAnalysis[];
}

export interface TurnoverAnalysisSummary {
  monthly: MonthlyTurnoverAnalysis[];
  quarterly: QuarterlyTurnoverAnalysis[];
  halfYearly: {
    h1: HalfYearlyTurnoverAnalysis | null;
    h2: HalfYearlyTurnoverAnalysis | null;
  };
  yearly: YearlyTurnoverAnalysis | null;
  currency: CurrencyCode;
}

// VAT Return Types
export interface VATReturn {
  id: string;
  period: string;              // e.g., "Q1 2024"
  startDate: string;
  endDate: string;
  taxableSales: number;
  zeroRatedSales: number;
  exemptSales: number;
  outputVAT: number;           // VAT on sales
  inputVAT: number;            // VAT on purchases
  netVAT: number;              // Output VAT - Input VAT
  fileName: string;
  uploadDate: string;
  status: 'submitted' | 'pending' | 'approved';
}

export interface VATBankComparison {
  period: string;
  vatTaxableSales: number;
  bankTurnover: number;
  difference: number;
  matchPercentage: number;
  hasSignificantMismatch: boolean;
}

// Color coding thresholds for Avg Balance %
export function getAvgBalanceColorClass(percentage: number): 'high' | 'medium' | 'low' {
  if (percentage >= 100) return 'high';    // Green - good coverage (balance exceeds turnover)
  if (percentage >= 50) return 'medium';   // Yellow - moderate
  return 'low';                             // Red - low coverage
}
