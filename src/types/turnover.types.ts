import type { Transaction } from './transaction.types';

export interface SisterCompany {
  id: string;
  name: string;
  active: boolean;
  notes: string;
}

export interface TransactionKeywords {
  cashDeposits: string[];
  sisterConcern: string[];
}

export interface TurnoverConfiguration {
  startDate: string;
  endDate: string;
  sisterCompanies: SisterCompany[];
  keywords: TransactionKeywords;
  
  // User-controlled toggles (when allowed)
  excludeCashDeposits: boolean;
  excludeSisterConcern: boolean;
  
  // Threshold values (default: 20%, 20%, 25%)
  cashDepositThreshold: number;
  sisterConcernThreshold: number;
  vatVarianceThreshold: number;
}

// Exclusion status with mandatory enforcement
export interface ExclusionStatus {
  cashDeposits: {
    amount: number;
    percentage: number;
    excluded: boolean;
    mandatory: boolean;
    reason: string;
  };
  sisterConcern: {
    amount: number;
    percentage: number;
    excluded: boolean;
    mandatory: boolean;
    reason: string;
  };
  vatVariance: {
    bankTurnover: number;
    vatSales: number;
    variance: number;
    percentageVariance: number;
    mandatory: boolean;
    reason: string;
  };
}

// Turnover calculation result with exclusion details
export interface TurnoverResult {
  totalCredits: number;
  totalDebits: number;
  cashDeposits: number;
  cashDepositsExcluded: boolean;
  sisterConcern: number;
  sisterConcernExcluded: boolean;
  businessTurnover: number;
  exclusionRate: number;
}

export interface TransactionClassification {
  type: 'business' | 'cash-deposit' | 'sister-concern';
  excluded: boolean;
  reason?: string;
}

export interface ClassifiedTransaction extends Transaction {
  classification: TransactionClassification;
}

export interface MonthlyTurnover {
  month: string;
  totalCredits: number;
  cashDeposits: number;
  sisterConcern: number;
  businessTurnover: number;
  percentageOfTotal: number;
  exclusionRate: number;
}

export interface TurnoverSummary {
  totalCredits: number;
  cashDeposits: number;
  sisterConcern: number;
  businessTurnover: number;
  exclusionRate: number;
  monthlyData: MonthlyTurnover[];
  excludedTransactions: ClassifiedTransaction[];
}

// Default configuration
export const DEFAULT_SISTER_COMPANIES: SisterCompany[] = [
  { id: '1', name: 'MUSAB BEH R', active: true, notes: 'Related party' },
  { id: '2', name: 'AHMAD HUSS', active: true, notes: 'Related party' },
  { id: '3', name: 'MOHANNAD AHMAD HAMADE', active: true, notes: 'Related party' },
];

export const DEFAULT_KEYWORDS: TransactionKeywords = {
  cashDeposits: ['CDM', 'CASH DEPOSIT', 'CDM-CASH DEPOSIT', 'CASH DEP', 'ATM DEPOSIT'],
  sisterConcern: ['MUSAB BEH', 'AHMAD HUSS', 'MOHANNAD', 'RELATED PARTY', 'INTER COMPANY', 'SISTER CONCERN']
};

// Default thresholds for mandatory exclusion
export const DEFAULT_THRESHOLDS = {
  cashDeposit: 20, // >20% triggers mandatory exclusion
  sisterConcern: 20, // >20% triggers mandatory exclusion
  vatVariance: 25 // >25% triggers mandatory exclusion of both
};

export const getDefaultConfiguration = (): TurnoverConfiguration => ({
  startDate: '2024-01-01',
  endDate: '2024-06-30',
  sisterCompanies: [...DEFAULT_SISTER_COMPANIES],
  keywords: {
    cashDeposits: [...DEFAULT_KEYWORDS.cashDeposits],
    sisterConcern: [...DEFAULT_KEYWORDS.sisterConcern]
  },
  excludeCashDeposits: true,
  excludeSisterConcern: true,
  cashDepositThreshold: DEFAULT_THRESHOLDS.cashDeposit,
  sisterConcernThreshold: DEFAULT_THRESHOLDS.sisterConcern,
  vatVarianceThreshold: DEFAULT_THRESHOLDS.vatVariance
});

// ===== CORRECT TURNOVER DEFINITIONS =====
// Turnover = Total Credits (simple sum of all credit transactions)
// Average Balance = Average of all EOD (End of Day) balances
// Avg Balance % = (Average Balance / Turnover) × 100

// Monthly Turnover & Balance Analysis
export interface MonthlyTurnoverBalance {
  month: string; // e.g., "Jan-24"
  turnover: number; // Sum of credits for the month
  averageBalance: number; // Average of daily EOD balances
  avgBalancePercentage: number; // (Average Balance / Turnover) × 100
  days: number;
  openingBalance: number;
  closingBalance: number;
  totalDebits: number; // For reference
  transactionCount: number;
}

// Quarterly Analysis
export interface QuarterlyTurnoverBalance {
  quarter: string; // e.g., "Q1 2024"
  months: string[];
  turnover: number;
  averageBalance: number;
  avgBalancePercentage: number;
  days: number;
}

// Half-Yearly Analysis
export interface HalfYearlyTurnoverBalance {
  period: string; // "H1 2024" or "H2 2024"
  months: string[];
  turnover: number;
  averageBalance: number;
  avgBalancePercentage: number;
  days: number;
}

// Yearly Analysis
export interface YearlyTurnoverBalance {
  year: string;
  turnover: number;
  averageBalance: number;
  avgBalancePercentage: number;
  days: number;
  h1: HalfYearlyTurnoverBalance | null;
  h2: HalfYearlyTurnoverBalance | null;
}

// Complete Turnover & Average Balance Report
export interface TurnoverBalanceReport {
  // Period info
  companyName?: string;
  analysisStartDate: string;
  analysisEndDate: string;
  totalDays: number;
  
  // Overall totals
  totalTurnover: number; // Sum of all credits
  totalDebits: number; // For reference
  overallAverageBalance: number;
  overallAvgBalancePercentage: number;
  
  // Breakdowns
  monthly: MonthlyTurnoverBalance[];
  quarterly: QuarterlyTurnoverBalance[];
  halfYearly: HalfYearlyTurnoverBalance[];
  yearly: YearlyTurnoverBalance | null;
  
  // Balance coverage assessment
  balanceCoverage: 'excellent' | 'good' | 'moderate' | 'low';
}

// Extended Monthly Turnover (legacy compatibility)
export interface ExtendedMonthlyTurnover extends MonthlyTurnover {
  totalDebits: number;
  totalTurnover: number;
  ranking: number;
  activityLevel: 'high' | 'medium' | 'low';
}

// Legacy Turnover Analysis Report (for backward compatibility)
export interface TurnoverAnalysisReport {
  companyName?: string;
  analysisStartDate: string;
  analysisEndDate: string;
  periodMonths: number;
  totalTurnover: number;
  totalCredits: number;
  totalDebits: number;
  averageMonthlyTurnover: number;
  volatility: {
    standardDeviation: number;
    volatilityPercent: number;
    assessment: 'low' | 'moderate' | 'moderate-high' | 'high';
  };
  monthlyBreakdown: ExtendedMonthlyTurnover[];
  highActivityMonths: ExtendedMonthlyTurnover[];
  mediumActivityMonths: ExtendedMonthlyTurnover[];
  lowActivityMonths: ExtendedMonthlyTurnover[];
  highestMonth: ExtendedMonthlyTurnover | null;
  lowestMonth: ExtendedMonthlyTurnover | null;
  percentageRange: { min: number; max: number; spread: number };
  expectedEvenDistribution: number;
}

// VAT Return types
export interface VATReturn {
  id: string;
  period: string;
  startDate: string;
  endDate: string;
  taxableSales: number;
  zeroRatedSales: number;
  exemptSales: number;
  outputVAT: number;
  inputVAT: number;
  netVAT?: number;
  fileName?: string;
  uploadDate?: string;
  status: 'draft' | 'submitted' | 'filed' | 'approved' | 'pending';
}
