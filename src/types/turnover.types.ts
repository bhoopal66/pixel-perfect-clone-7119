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

export const getDefaultConfiguration = (): TurnoverConfiguration => ({
  startDate: '2024-01-01',
  endDate: '2024-06-30',
  sisterCompanies: [...DEFAULT_SISTER_COMPANIES],
  keywords: {
    cashDeposits: [...DEFAULT_KEYWORDS.cashDeposits],
    sisterConcern: [...DEFAULT_KEYWORDS.sisterConcern]
  }
});

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
