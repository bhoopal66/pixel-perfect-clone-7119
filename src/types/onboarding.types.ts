// Business Loan Onboarding Types

export interface BusinessDetails {
  companyLegalName: string;
  tradeLicenseNo: string;
  licenseIssuingAuthority: string;
  tlExpiryDate: string;
  businessActivity: string;
  legalStructure: string;
  yearOfEstablishment: string;
  officeAddress: string;
  emirate: string;
  ejariAvailable: boolean | null;
}

export interface OwnerDetails {
  id: string;
  ownerName: string;
  role: string;
  nationality: string;
  emiratesId: string;
  passportNumber: string;
  shareholdingPercent: number;
  residentStatus: string;
  mobile: string;
  email: string;
  address: string;
  isSignatory: boolean;
  isUbo: boolean;
}

export const OWNER_ROLES = [
  'Partner',
  'Shareholder',
  'Director',
  'Managing Partner',
  'Authorized Signatory',
  'POA Holder',
  'Ultimate Beneficial Owner (UBO)'
] as const;

export interface BankingTurnover {
  existingBankAccounts: string[];
  primaryOperatingBank: string;
  monthlyAvgTurnover: number;
  vatRegistered: boolean | null;
  annualVatTurnover: number | null;
  posMachine: boolean | null;
  posMonthlyTurnover: number | null;
  cashIntensive: boolean | null;
  sisterConcernExists: boolean | null;
}

export interface LoanRequirement {
  loanType: string;
  requiredLoanAmount: number;
  purpose: string;
  preferredTenure: string;
  urgentFunding: boolean | null;
}

export interface DocumentUpload {
  id: string;
  type: string;
  fileName: string;
  fileSize: number;
  uploadProgress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  url?: string;
}

export interface OnboardingFormData {
  businessDetails: BusinessDetails;
  owners: OwnerDetails[];
  bankingTurnover: BankingTurnover;
  loanRequirement: LoanRequirement;
  documents: DocumentUpload[];
  declarationConfirmed: boolean;
  authorizationConfirmed: boolean;
}

export interface OnboardingApplication {
  id: string;
  caseId: string;
  companyName: string;
  loanType: string;
  loanAmount: number;
  status: 'draft' | 'in_process' | 'submitted' | 'under_review' | 'approved' | 'declined';
  currentStep: number;
  formData: OnboardingFormData;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
}

export const EMIRATES = [
  'Abu Dhabi',
  'Dubai',
  'Sharjah',
  'Ajman',
  'Umm Al Quwain',
  'Ras Al Khaimah',
  'Fujairah'
];

export const LEGAL_STRUCTURES = [
  'Sole Proprietorship',
  'Limited Liability Company (LLC)',
  'Partnership',
  'Free Zone Company',
  'Branch of Foreign Company',
  'Civil Company',
  'Public Joint Stock Company',
  'Private Joint Stock Company'
];

export const LOAN_TYPES = [
  'Term Loan',
  'POS Finance',
  'Working Capital',
  'Overdraft'
];

export const TENURE_OPTIONS = [
  '6 months',
  '12 months',
  '24 months',
  '36 months',
  '48 months',
  '60 months'
];

export const UAE_BANKS = [
  'Emirates NBD',
  'First Abu Dhabi Bank (FAB)',
  'Abu Dhabi Commercial Bank (ADCB)',
  'Abu Dhabi Islamic Bank (ADIB)',
  'Dubai Islamic Bank',
  'Mashreq Bank',
  'RAKBANK',
  'Commercial Bank of Dubai',
  'Emirates Islamic',
  'Sharjah Islamic Bank',
  'National Bank of Fujairah',
  'Ajman Bank',
  'Al Hilal Bank',
  'United Arab Bank',
  'Dubai Bank',
  'Noor Bank',
  'HSBC UAE',
  'Standard Chartered UAE',
  'Citibank UAE',
  'Bank of Baroda UAE'
];

export const DOCUMENT_TYPES = {
  mandatory: [
    { id: 'trade_license', label: 'Trade License', description: 'Valid Trade License copy' },
    { id: 'owner_passport', label: 'Owner Passport + EID', description: 'All owners passport and Emirates ID' },
    { id: 'bank_statements', label: 'Bank Statements (Monthly)', description: 'Upload up to 12 monthly PDF statements', multiFile: true, maxFiles: 12 },
    { id: 'vat_certificate', label: 'VAT Certificate', description: 'Required if VAT registered', conditional: true },
    { id: 'vat_returns', label: 'VAT Returns (Quarterly)', description: 'Upload 4 or 8 quarterly VAT return PDFs', conditional: true, multiFile: true, maxFiles: 8 }
  ],
  optional: [
    { id: 'moa_aoa', label: 'MOA/AOA', description: 'Memorandum & Articles of Association' },
    { id: 'tenancy_contract', label: 'Tenancy Contract', description: 'Office tenancy agreement' },
    { id: 'pos_statements', label: 'POS Statements', description: 'Point of Sale transaction reports' },
    { id: 'audited_financials', label: 'Audited Financials', description: 'Latest audited financial statements' }
  ]
};

export const createEmptyBusinessDetails = (): BusinessDetails => ({
  companyLegalName: '',
  tradeLicenseNo: '',
  licenseIssuingAuthority: '',
  tlExpiryDate: '',
  businessActivity: '',
  legalStructure: '',
  yearOfEstablishment: '',
  officeAddress: '',
  emirate: '',
  ejariAvailable: null
});

export const createEmptyOwner = (): OwnerDetails => ({
  id: crypto.randomUUID(),
  ownerName: '',
  nationality: '',
  emiratesId: '',
  passportNumber: '',
  shareholdingPercent: 0,
  residentStatus: '',
  mobile: '',
  email: ''
});

export const createEmptyBankingTurnover = (): BankingTurnover => ({
  existingBankAccounts: [],
  primaryOperatingBank: '',
  monthlyAvgTurnover: 0,
  vatRegistered: null,
  annualVatTurnover: null,
  posMachine: null,
  posMonthlyTurnover: null,
  cashIntensive: null,
  sisterConcernExists: null
});

export const createEmptyLoanRequirement = (): LoanRequirement => ({
  loanType: '',
  requiredLoanAmount: 0,
  purpose: '',
  preferredTenure: '',
  urgentFunding: null
});

export const createEmptyFormData = (): OnboardingFormData => ({
  businessDetails: createEmptyBusinessDetails(),
  owners: [createEmptyOwner()],
  bankingTurnover: createEmptyBankingTurnover(),
  loanRequirement: createEmptyLoanRequirement(),
  documents: [],
  declarationConfirmed: false,
  authorizationConfirmed: false
});
