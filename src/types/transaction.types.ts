export interface BankStatement {
  month: string;
  year: number;
  openingBalance: number;
  closingBalance: number;
  averageBalance: number;
  totalDebits: number;
  totalCredits: number;
  debitCount: number;
  creditCount: number;
  days: number;
  transactions: Transaction[];
}

export interface Transaction {
  date: string;
  valueDate?: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  category: TransactionCategory;
  reference?: string;
}

export enum TransactionCategory {
  CASH_DEPOSIT = 'Cash Deposit',
  CASH_WITHDRAWAL = 'Cash Withdrawal',
  CHEQUE_PAYMENT = 'Cheque Payment',
  CHEQUE_DEPOSIT = 'Cheque Deposit',
  BANK_TRANSFER_IN = 'Bank Transfer (Inward)',
  BANK_TRANSFER_OUT = 'Bank Transfer (Outward)',
  BILL_PAYMENT = 'Bill Payments',
  SALARY_PAYMENT = 'Salary Payments',
  LOAN_PAYMENT = 'Loan Payment',
  BANK_CHARGES = 'Bank Charges & Fees',
  TAX_PAYMENT = 'Tax Payment',
  FREIGHT = 'Freight Charges',
  COMMODITY = 'Commodity Purchase',
  OTHER_CREDIT = 'Other Credit',
  OTHER_DEBIT = 'Other Debit'
}

export interface AnalysisReport {
  accountInfo: AccountInfo;
  summary: SixMonthSummary;
  monthlyBalances: MonthlyBalance[];
  dailyBalances: DailyBalance[];
  transactions: Transaction[];
  categoryAnalysis: CategorySummary[];
  chequeAnalysis: ChequeAnalysis;
  monthWiseSummary: MonthSummary[];
}

export interface AccountInfo {
  accountName: string;
  accountNumber: string;
  iban: string;
  bank: string;
  period: string;
}

export interface SixMonthSummary {
  openingBalance: number;
  closingBalance: number;
  netChange: number;
  totalCredits: number;
  totalDebits: number;
  creditCount: number;
  debitCount: number;
  averageMonthlyBalance: number;
}

export interface MonthlyBalance {
  month: string;
  average: number;
  days: number;
  opening: number;
  closing: number;
}

export interface DailyBalance {
  date: string;
  balance: number;
  month: string;
}

export interface CategorySummary {
  category: string;
  count: number;
  totalDebit: number;
  totalCredit: number;
}

export interface ChequeAnalysis {
  monthlyData: {
    month: string;
    payments: number;
    deposits: number;
  }[];
  returns: {
    inward: number;
    outward: number;
  };
}

export interface MonthSummary {
  month: string;
  opening: number;
  closing: number;
  totalCredits: number;
  totalDebits: number;
  creditCount: number;
  debitCount: number;
  netChange: number;
  average: number;
}

export interface AnalysisStep {
  id: string;
  label: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
}

export type AppState = 'upload' | 'analyzing' | 'results';
