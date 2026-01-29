// Loan Eligibility Types

export type EligibilityStatus = 'Eligible' | 'Eligible (Reduced)' | 'Not Eligible' | 'Insufficient Data';
export type VarianceBucket = '<=10%' | '11%-25%' | '>25%' | 'N/A';
export type ProductType = 'standard' | 'rak_pos' | 'wio_pos';

export interface LoanEligibility {
  id: string;
  
  // Product type
  product_type: ProductType;
  
  // Input fields
  vat_turnover: number;
  declared_turnover: number;
  cash_adjustment: number;
  sister_concern_adjustment: number;
  pos_monthly_turnover: number;
  
  // Computed fields
  adjusted_turnover: number;
  variance_percent: number;
  variance_bucket: VarianceBucket;
  eligible_multiplier: number;
  eligibility_status: EligibilityStatus;
  eligible_loan_amount: number;
  
  // POS computed fields
  pos_cap_rate: number;
  pos_annual_turnover: number;
  pos_cap_adjusted: number;
  pos_cap_vat: number;
  pos_eligible_turnover: number;
  turnover_basis: number;
  
  // Metadata
  company_name?: string;
  period_start?: string;
  period_end?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface LoanEligibilityInput {
  product_type: ProductType;
  vat_turnover: number;
  declared_turnover: number;
  cash_adjustment: number;
  sister_concern_adjustment: number;
  pos_monthly_turnover: number;
  company_name?: string;
  period_start?: string;
  period_end?: string;
  notes?: string;
}

export interface EligibilityFilters {
  eligibility_status?: EligibilityStatus | 'all';
  variance_bucket?: VarianceBucket | 'all';
  product_type?: ProductType | 'all';
  date_from?: string;
  date_to?: string;
}

// Product type labels
export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  standard: 'Standard Loan',
  rak_pos: 'RAK POS Loan',
  wio_pos: 'WIO POS Loan'
};

// POS cap rates
export const POS_CAP_RATES: Record<ProductType, number> = {
  standard: 0,
  rak_pos: 0.40,
  wio_pos: 0.30
};

// Helper to get RAG color for status
export function getStatusColor(status: EligibilityStatus): 'success' | 'warning' | 'destructive' | 'muted' {
  switch (status) {
    case 'Eligible':
      return 'success';
    case 'Eligible (Reduced)':
      return 'warning';
    case 'Not Eligible':
      return 'destructive';
    case 'Insufficient Data':
    default:
      return 'muted';
  }
}

// Helper to get bucket color
export function getBucketColor(bucket: VarianceBucket): string {
  switch (bucket) {
    case '<=10%':
      return 'bg-success/20 text-success';
    case '11%-25%':
      return 'bg-warning/20 text-warning';
    case '>25%':
      return 'bg-destructive/20 text-destructive';
    case 'N/A':
    default:
      return 'bg-muted text-muted-foreground';
  }
}

// Check if product type is POS
export function isPOSProduct(productType: ProductType): boolean {
  return productType === 'rak_pos' || productType === 'wio_pos';
}
