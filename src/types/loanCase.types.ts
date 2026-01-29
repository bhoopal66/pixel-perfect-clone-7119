// Cash Loans Case Management Types

export type LenderType = 'RAK' | 'WIO' | 'FLAPCAP' | 'CREDIBLEX' | 'COMFI' | 'HFS' | 'EFUNDER' | 'FUNDING_SOUQ';
export type ProductType = 'cash' | 'pos';
export type LoanStatus = 'draft' | 'submitted' | 'under_review' | 'approved' | 'disbursed' | 'rejected';

export interface LenderInfo {
  id: LenderType;
  name: string;
  shortName: string;
  logo?: string;
  productTypes: ProductType[];     // Available product types
  interestRate: number;            // Annual % rate
  minAmount: number;
  maxAmount: number;
  minTenure: number;               // Months
  maxTenure: number;
  processingFee: number;           // Percentage
  insuranceFee?: number;           // Percentage (optional)
  category: 'bank' | 'fintech';    // Lender category
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
  companyName: string;              // Renamed from employer
  agentReference: string;           // New field
  analystName: string;              // New field
  
  // Loan Details
  lender: LenderType;
  productType: ProductType;        // Cash or POS
  loanAmount: number;
  tenure: number;                  // Months
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
    shortName: 'RAK',
    productTypes: ['cash', 'pos'],
    interestRate: 4.99,
    minAmount: 5000,
    maxAmount: 1500000,
    minTenure: 6,
    maxTenure: 48,
    processingFee: 1.05,
    insuranceFee: 0.35,
    category: 'bank',
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
    shortName: 'Wio',
    productTypes: ['cash', 'pos'],
    interestRate: 3.99,
    minAmount: 2000,
    maxAmount: 500000,
    minTenure: 3,
    maxTenure: 36,
    processingFee: 0.99,
    category: 'bank',
    eligibility: {
      minSalary: 3000,
      minAge: 18,
      maxAge: 65,
      employmentYears: 0.5
    }
  },
  FLAPCAP: {
    id: 'FLAPCAP',
    name: 'Flapcap',
    shortName: 'Flapcap',
    productTypes: ['cash'],
    interestRate: 6.5,
    minAmount: 10000,
    maxAmount: 2000000,
    minTenure: 6,
    maxTenure: 36,
    processingFee: 1.5,
    category: 'fintech',
    eligibility: {
      minSalary: 0,
      minAge: 21,
      maxAge: 65,
      employmentYears: 0
    }
  },
  CREDIBLEX: {
    id: 'CREDIBLEX',
    name: 'CredibleX',
    shortName: 'CredibleX',
    productTypes: ['cash'],
    interestRate: 5.99,
    minAmount: 25000,
    maxAmount: 5000000,
    minTenure: 3,
    maxTenure: 24,
    processingFee: 2.0,
    category: 'fintech',
    eligibility: {
      minSalary: 0,
      minAge: 21,
      maxAge: 70,
      employmentYears: 0
    }
  },
  COMFI: {
    id: 'COMFI',
    name: 'Comfi',
    shortName: 'Comfi',
    productTypes: ['cash'],
    interestRate: 4.5,
    minAmount: 5000,
    maxAmount: 500000,
    minTenure: 3,
    maxTenure: 24,
    processingFee: 1.25,
    category: 'fintech',
    eligibility: {
      minSalary: 0,
      minAge: 21,
      maxAge: 65,
      employmentYears: 0
    }
  },
  HFS: {
    id: 'HFS',
    name: 'HFS',
    shortName: 'HFS',
    productTypes: ['cash'],
    interestRate: 7.0,
    minAmount: 50000,
    maxAmount: 3000000,
    minTenure: 6,
    maxTenure: 36,
    processingFee: 2.5,
    category: 'fintech',
    eligibility: {
      minSalary: 0,
      minAge: 21,
      maxAge: 65,
      employmentYears: 0
    }
  },
  EFUNDER: {
    id: 'EFUNDER',
    name: 'eFunder',
    shortName: 'eFunder',
    productTypes: ['cash'],
    interestRate: 5.5,
    minAmount: 20000,
    maxAmount: 1500000,
    minTenure: 6,
    maxTenure: 24,
    processingFee: 1.75,
    category: 'fintech',
    eligibility: {
      minSalary: 0,
      minAge: 21,
      maxAge: 65,
      employmentYears: 0
    }
  },
  FUNDING_SOUQ: {
    id: 'FUNDING_SOUQ',
    name: 'Funding Souq',
    shortName: 'F.Souq',
    productTypes: ['cash'],
    interestRate: 6.0,
    minAmount: 15000,
    maxAmount: 2500000,
    minTenure: 3,
    maxTenure: 36,
    processingFee: 2.0,
    category: 'fintech',
    eligibility: {
      minSalary: 0,
      minAge: 21,
      maxAge: 65,
      employmentYears: 0
    }
  }
};

// Get lenders by category
export const getLendersByCategory = (category: 'bank' | 'fintech'): LenderInfo[] => {
  return Object.values(LENDERS).filter(l => l.category === category);
};

// Get lenders that support a product type
export const getLendersByProductType = (productType: ProductType): LenderInfo[] => {
  return Object.values(LENDERS).filter(l => l.productTypes.includes(productType));
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
