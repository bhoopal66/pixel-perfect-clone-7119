// Assessment Engine Types

export interface AssessmentCase {
  id: string;
  case_number: string | null;
  company_name: string | null;
  user_id: string | null;
  status: 'draft' | 'analyzing' | 'review' | 'completed';
  created_at: string;
  updated_at: string;
  analyst_notes: string | null;
  approved_by: string | null;
  approved_at: string | null;
  total_bank_credits: number;
  total_bank_debits: number;
  avg_monthly_credit: number;
  avg_monthly_debit: number;
  avg_monthly_balance: number;
  estimated_annual_turnover: number;
  declared_vat_turnover: number;
  bank_vat_variance_percent: number;
  normalized_turnover: number;
  variance_tag: string | null;
  risk_flags: string[];
  statement_months_covered: number;
  vat_periods_covered: number;
  // HFS manual-input fields
  receivable_days: number;
  gross_margin_pct: number;
  existing_debt_count: number;
  uae_revenue_pct: number;
  b2b_revenue_pct: number;
  cash_collection_pct: number;
  proceeds_for_cogs: boolean;
  past_breakeven: boolean;
}

export interface AssessmentDocument {
  id: string;
  case_id: string;
  document_type: 'bank_statement' | 'vat_return';
  file_name: string;
  file_path: string | null;
  file_size: number | null;
  bank_name: string | null;
  account_holder: string | null;
  account_number: string | null;
  period_from: string | null;
  period_to: string | null;
  is_duplicate: boolean;
  is_password_protected: boolean;
  validation_status: 'pending' | 'valid' | 'invalid' | 'duplicate';
  validation_message: string | null;
  uploaded_by: string | null;
  created_at: string;
}

export interface AssessmentBankTransaction {
  id: string;
  case_id: string;
  document_id: string | null;
  txn_date: string | null;
  description: string | null;
  cheque_no: string | null;
  debit: number;
  credit: number;
  balance: number;
  month: number | null;
  year: number | null;
  bank_name: string | null;
  account_name: string | null;
  category: string | null;
  is_excluded: boolean;
  exclusion_reason: string | null;
  is_recurring: boolean;
  is_related_party: boolean;
  created_at: string;
}

export interface AssessmentBankSummary {
  id: string;
  case_id: string;
  bank_name: string | null;
  account_number: string | null;
  month: number;
  year: number;
  total_credits: number;
  total_debits: number;
  credit_count: number;
  debit_count: number;
  highest_credit: number;
  lowest_balance: number;
  avg_daily_balance: number;
  closing_balance: number;
  cash_deposit_total: number;
  negative_balance_days: number;
  bounce_count: number;
  created_at: string;
}

export interface AssessmentVatReturn {
  id: string;
  case_id: string;
  document_id: string | null;
  tax_period_from: string | null;
  tax_period_to: string | null;
  vat_sales: number;
  taxable_supplies: number;
  zero_rated_supplies: number;
  exempt_supplies: number;
  output_vat: number;
  input_vat: number;
  net_vat_payable: number;
  filing_date: string | null;
  trn: string | null;
  source_file: string | null;
  is_edited: boolean;
  original_values: Record<string, unknown> | null;
  created_at: string;
}

export interface AssessmentLenderResult {
  id: string;
  case_id: string;
  lender_id: string;
  lender_name: string;
  product_name: string | null;
  eligibility_status: 'eligible' | 'conditionally_eligible' | 'review_required' | 'not_eligible' | 'pending';
  recommended_limit: number;
  limit_basis: string | null;
  tenure_months: number | null;
  pricing_band: string | null;
  key_reasons: string[];
  failed_rules: RuleResult[];
  risk_flags: string[];
  passed_rules: RuleResult[];
  required_deviations: string[];
  rule_details: RuleResult[];
  created_at: string;
  updated_at: string;
}

export interface RuleResult {
  rule_name: string;
  rule_description: string;
  passed: boolean;
  value?: number | string;
  threshold?: number | string;
  message: string;
}

export interface AssessmentAnalystAdjustment {
  id: string;
  case_id: string;
  adjustment_type: 'exclude_transaction' | 'edit_vat' | 'override_turnover' | 'mark_non_operating' | 'remark';
  target_entity: string | null;
  target_id: string | null;
  field_name: string | null;
  original_value: string | null;
  adjusted_value: string | null;
  reason: string;
  adjusted_by: string | null;
  created_at: string;
}

// Local state types for the workflow
export interface ParsedBankFile {
  file: File;
  fileName: string;
  bankName: string | null;
  accountHolder: string | null;
  accountNumber: string | null;
  periodFrom: string | null;
  periodTo: string | null;
  transactions: ParsedTransaction[];
  totalCredits: number;
  totalDebits: number;
  isDuplicate: boolean;
  isValid: boolean;
  validationMessage: string | null;
  // Currency fields
  detectedCurrency: string;
  documentId?: string;
}

export interface ParsedTransaction {
  date: string;
  description: string;
  chequeNo?: string;
  debit: number;
  credit: number;
  balance: number;
  category?: string;
}

export interface ParsedVatFile {
  file: File;
  fileName: string;
  taxPeriodFrom: string | null;
  taxPeriodTo: string | null;
  vatSales: number;
  taxableSupplies: number;
  zeroRatedSupplies: number;
  exemptSupplies: number;
  outputVat: number;
  inputVat: number;
  netVatPayable: number;
  trn: string | null;
  isValid: boolean;
  validationMessage: string | null;
  confidence: 'high' | 'medium' | 'low';
}

export interface BankMonthlyAnalysis {
  month: number;
  year: number;
  monthLabel: string;
  totalCredits: number;
  totalDebits: number;
  creditCount: number;
  debitCount: number;
  highestCredit: number;
  lowestBalance: number;
  avgDailyBalance: number;
  closingBalance: number;
  cashDepositTotal: number;
  negativeBalanceDays: number;
  bounceCount: number;
}

export interface VatPeriodAnalysis {
  periodFrom: string;
  periodTo: string;
  periodLabel: string;
  vatSales: number;
  taxableSupplies: number;
  zeroRatedSupplies: number;
  exemptSupplies: number;
  outputVat: number;
  inputVat: number;
  netVatPayable: number;
  effectiveVatRate: number;
  monthlyAvgSales: number;
}

export interface CombinedFinancialSummary {
  companyName: string | null;
  banksUsed: string[];
  totalStatementPeriod: { from: string; to: string } | null;
  totalVatPeriods: number;
  avgMonthlyCredit: number;
  avgMonthlyDebit: number;
  avgMonthlyBalance: number;
  estimatedAnnualTurnover: number;
  declaredVatTurnover: number;
  variancePercent: number;
  varianceTag: 'strong_match' | 'moderate_variance' | 'high_variance' | 'manual_review';
  riskFlags: string[];
  normalizedTurnover: number;
  statementMonthsCovered: number;
  vatPeriodsCovered: number;
  totalBounces: number;
  negativeBalanceDays: number;
  cashDepositRatio: number;
  // Multi-currency fields
  baseReportingCurrency?: string;
  multiCurrencyFlag?: boolean;
  currenciesUsed?: string[];
  conversionNotes?: string;
}

export type AssessmentStep = 
  | 'upload'
  | 'extraction'
  | 'bank_analysis'
  | 'vat_analysis'
  | 'combined_summary'
  | 'lender_results'
  | 'manual_review';
