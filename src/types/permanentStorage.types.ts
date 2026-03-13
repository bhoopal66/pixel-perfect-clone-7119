// Permanent Storage Types for Taamul Case Management

export interface ExtractionRun {
  id: string;
  case_id: string;
  document_id: string | null;
  extraction_type: string;
  extraction_status: 'pending' | 'in_progress' | 'completed' | 'failed';
  extracted_by_engine: string | null;
  confidence_score: number;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface CombinedFinancialSummary {
  id: string;
  case_id: string;
  summary_version: number;
  period_from: string | null;
  period_to: string | null;
  avg_monthly_bank_credit: number;
  avg_monthly_debit: number;
  avg_monthly_balance: number;
  adjusted_monthly_turnover: number;
  adjusted_annual_turnover: number;
  vat_monthly_sales: number;
  bank_vat_variance: number;
  negative_balance_days: number;
  returned_cheque_count: number;
  cash_deposit_ratio: number;
  internal_transfer_percentage: number;
  one_off_credit_percentage: number;
  business_vintage_months: number;
  top_5_customer_concentration: number;
  receivable_days: number;
  receivable_overdue_percent: number;
  repeat_buyer_ratio: number;
  inventory_value: number;
  inventory_turn_days: number;
  pos_monthly_settlement: number;
  ecommerce_monthly_settlement: number;
  gross_margin_percentage: number;
  break_even_status: boolean;
  uae_client_percentage: number;
  client_type: string | null;
  average_client_credit_days: number;
  existing_debt: number;
  use_of_proceeds: string | null;
  profitability_last_12_months: number;
  shareholder_management_tenure_months: number;
  aecb_score: number | null;
  risk_flags_json: string[];
  created_by: string | null;
  created_at: string;
  approved_by: string | null;
  approved_at: string | null;
  is_active: boolean;
}

export interface AiCreditDecisionResult {
  id: string;
  case_id: string;
  summary_id: string | null;
  taamul_credit_score: number;
  credit_rating: string | null;
  recommended_lender_id: string | null;
  recommended_product_id: string | null;
  recommended_limit: number;
  approval_probability: number;
  key_strengths_json: string[];
  risk_flags_json: string[];
  decision_notes: string | null;
  model_version: string | null;
  created_at: string;
  created_by: string | null;
}

export interface CaseReport {
  id: string;
  case_id: string;
  report_type: CaseReportType;
  report_name: string;
  report_version: number;
  file_name: string;
  file_path: string | null;
  file_url: string | null;
  report_format: 'xlsx' | 'pdf' | 'csv';
  based_on_summary_id: string | null;
  based_on_execution_id: string | null;
  generated_by: string | null;
  generated_at: string;
  is_latest: boolean;
  remarks: string | null;
}

export type CaseReportType =
  | 'bank_analysis_report'
  | 'vat_analysis_report'
  | 'combined_financial_summary_report'
  | 'lender_eligibility_report'
  | 'lender_comparison_report'
  | 'ai_credit_decision_report'
  | 'full_case_report'
  | 'excel_export'
  | 'pdf_export';

export interface CaseActivityLog {
  id: string;
  case_id: string;
  activity_type: CaseActivityType;
  activity_description: string | null;
  reference_table: string | null;
  reference_id: string | null;
  done_by: string | null;
  done_at: string;
}

export type CaseActivityType =
  | 'document_uploaded'
  | 'extraction_completed'
  | 'analyst_adjustment'
  | 'summary_created'
  | 'summary_approved'
  | 'lender_engine_run'
  | 'ai_matching_run'
  | 'report_generated'
  | 'report_regenerated'
  | 'policy_version_changed'
  | 'case_approved'
  | 'case_status_changed'
  | 'document_archived';

export type CaseDocumentType =
  | 'bank_statement'
  | 'vat_return'
  | 'trade_license'
  | 'moa'
  | 'aoa'
  | 'poa'
  | 'emirates_id'
  | 'audit_report'
  | 'management_accounts'
  | 'ageing_report'
  | 'inventory_report'
  | 'invoice_file'
  | 'pos_report'
  | 'other_supporting_document';
