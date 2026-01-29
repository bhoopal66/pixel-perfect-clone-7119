// Cash Loans Case Management Types

export type LenderType = 'RAK' | 'WIO';
export type LoanStatus = 'draft' | 'submitted' | 'under_review' | 'approved' | 'disbursed' | 'rejected';

export interface LenderInfo {
  id: LenderType;
  name: string;
  logo?: string;
  interestRate: number;        // Annual % rate
  minAmount: number;
  maxAmount: number;
  minTenure: number;           // Months
  maxTenure: number;
  processingFee: number;       // Percentage
  insuranceFee?: number;       // Percentage (optional)
  eligibility: {
    minSalary: number;
    minAge: number;
    maxAge: number;
    employmentYears: number;
  };
}

export interface LoanCase {
  id: string;
  caseNumber: string;
  applicantName: string;
  applicantPhone: string;
  applicantEmail: string;
  monthlySalary: number;
  employer: string;
  
  // Loan Details
  lender: LenderType;
  loanAmount: number;
  tenure: number;              // Months
  purpose: string;
  interestRate: number;
  
  // Calculated
  emi: number;
  totalInterest: number;
  totalPayable: number;
  processingFee: number;
  
  // Status & Tracking
  status: LoanStatus;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  approvedAt?: string;
  disbursedAt?: string;
  notes: string;
  
  // Documents
  documents: LoanDocument[];
}

export interface LoanDocument {
  id: string;
  name: string;
  type: 'emirates_id' | 'salary_certificate' | 'bank_statement' | 'passport' | 'other';
  status: 'pending' | 'uploaded' | 'verified' | 'rejected';
  uploadedAt?: string;
}

// Default Lender Configurations
export const LENDERS: Record<LenderType, LenderInfo> = {
  RAK: {
    id: 'RAK',
    name: 'RAK Bank',
    interestRate: 4.99,
    minAmount: 5000,
    maxAmount: 1500000,
    minTenure: 6,
    maxTenure: 48,
    processingFee: 1.05,
    insuranceFee: 0.35,
    eligibility: {
      minSalary: 5000,
      minAge: 21,
      maxAge: 60,
      employmentYears: 1
    }
  },
  WIO: {
    id: 'WIO',
    name: 'Wio Bank',
    interestRate: 3.99,
    minAmount: 2000,
    maxAmount: 500000,
    minTenure: 3,
    maxTenure: 36,
    processingFee: 0.99,
    eligibility: {
      minSalary: 3000,
      minAge: 18,
      maxAge: 65,
      employmentYears: 0.5
    }
  }
};

// EMI Calculation
export function calculateEMI(principal: number, annualRate: number, tenureMonths: number): number {
  const monthlyRate = annualRate / 12 / 100;
  if (monthlyRate === 0) return principal / tenureMonths;
  const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) / 
              (Math.pow(1 + monthlyRate, tenureMonths) - 1);
  return Math.round(emi * 100) / 100;
}

export function calculateTotalInterest(principal: number, emi: number, tenureMonths: number): number {
  return Math.round((emi * tenureMonths - principal) * 100) / 100;
}

export function calculateProcessingFee(principal: number, feePercentage: number): number {
  return Math.round(principal * feePercentage / 100 * 100) / 100;
}
