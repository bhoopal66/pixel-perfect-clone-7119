// Loan Eligibility Types

export type EligibilityStatus = 'Eligible' | 'Eligible (Reduced)' | 'Not Eligible' | 'Insufficient Data';
export type VarianceBucket = '<=10%' | '11%-25%' | '>25%' | 'N/A';

export interface LoanEligibility {
  id: string;
  
  // Input fields
  vat_turnover: number;
  declared_turnover: number;
  cash_adjustment: number;
  sister_concern_adjustment: number;
  
  // Computed fields
  adjusted_turnover: number;
  variance_percent: number;
  variance_bucket: VarianceBucket;
  eligible_multiplier: number;
  eligibility_status: EligibilityStatus;
  eligible_loan_amount: number;
  
  // Metadata
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface LoanEligibilityInput {
  vat_turnover: number;
  declared_turnover: number;
  cash_adjustment: number;
  sister_concern_adjustment: number;
  notes?: string;
}

export interface EligibilityFilters {
  eligibility_status?: EligibilityStatus | 'all';
  variance_bucket?: VarianceBucket | 'all';
  date_from?: string;
  date_to?: string;
}

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
