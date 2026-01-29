// Case Types for Unified Case Workflow

export type CaseStatus = 'Draft' | 'Statement Uploaded' | 'Analysis Completed' | 'Eligibility Completed' | 'Submitted' | 'Closed';
export type ProductType = 'standard' | 'rak_pos' | 'wio_pos';
export type EligibilityMethod = 'Normal' | 'Reverse (ABCD 1%)';
export type EligibilityStatus = 'Pending' | 'Eligible' | 'Eligible (Reduced)' | 'Eligible (Reverse)';

export interface Case {
  id: string;
  
  // A) Case Core
  client_name: string;
  bank_name: string;
  product_type: ProductType;
  status: CaseStatus;
  
  // B) Bank Statement Analysis
  statement_pdf_url: string | null;
  statement_period_from: string | null;
  statement_period_to: string | null;
  vat_turnover: number;
  declared_turnover: number;
  cash_adjustment: number;
  sister_concern_adjustment: number;
  
  // C) Eligibility Inputs
  pos_monthly_turnover: number;
  
  // D) Eligibility Computed Outputs
  adjusted_turnover: number;
  variance_percent: number;
  variance_bucket: string;
  eligible_multiplier: number;
  pos_cap_rate: number;
  pos_annual_turnover: number;
  pos_eligible_turnover: number;
  turnover_basis: number;
  eligibility_method: EligibilityMethod;
  eligible_loan_amount: number;
  abcd_fee_amount: number;
  eligibility_status: EligibilityStatus;
  
  // Metadata
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CaseCreateInput {
  client_name: string;
  bank_name: string;
  product_type: ProductType;
}

export interface CaseAnalysisInput {
  statement_pdf_url?: string;
  statement_period_from?: string;
  statement_period_to?: string;
  vat_turnover: number;
  declared_turnover: number;
  cash_adjustment: number;
  sister_concern_adjustment: number;
}

export interface CaseEligibilityInput {
  pos_monthly_turnover: number;
}

// Bank options
export const BANK_OPTIONS = [
  'RAKBANK',
  'WIO',
  'Mashreq',
  'Emirates NBD',
  'ADCB',
  'FAB',
  'DIB',
  'CBD'
] as const;

// Product type labels
export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  standard: 'Standard Loan',
  rak_pos: 'RAK POS Loan (40% cap)',
  wio_pos: 'WIO POS Loan (30% cap)'
};

// Status labels with colors
export const STATUS_CONFIG: Record<CaseStatus, { label: string; color: string }> = {
  'Draft': { label: 'Draft', color: 'bg-muted text-muted-foreground' },
  'Statement Uploaded': { label: 'Statement Uploaded', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200' },
  'Analysis Completed': { label: 'Analysis Completed', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200' },
  'Eligibility Completed': { label: 'Eligibility Completed', color: 'bg-success/20 text-success' },
  'Submitted': { label: 'Submitted', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200' },
  'Closed': { label: 'Closed', color: 'bg-muted text-muted-foreground' }
};

// Eligibility status colors (RAG)
export function getEligibilityStatusColor(status: EligibilityStatus): string {
  switch (status) {
    case 'Eligible':
      return 'bg-success/20 text-success';
    case 'Eligible (Reduced)':
      return 'bg-warning/20 text-warning';
    case 'Eligible (Reverse)':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200';
    case 'Pending':
    default:
      return 'bg-muted text-muted-foreground';
  }
}

// Check if product type is POS
export function isPOSProduct(productType: ProductType): boolean {
  return productType === 'rak_pos' || productType === 'wio_pos';
}
