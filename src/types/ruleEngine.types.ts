// Rule Engine Types - Database-driven configurable lender rule engine

export interface LenderProduct {
  id: string;
  lender_id: string;
  product_code: string;
  product_name: string;
  product_type: string;
  is_active: boolean;
  min_limit: number | null;
  max_limit: number | null;
  min_tenure: number | null;
  max_tenure: number | null;
  created_at: string;
  updated_at: string;
}

export interface LenderRuleSet {
  id: string;
  lender_id: string;
  product_id: string;
  rule_set_name: string;
  version_no: number;
  is_active: boolean;
  effective_from: string | null;
  effective_to: string | null;
  remarks: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface LenderRule {
  id: string;
  rule_set_id: string;
  rule_code: string;
  rule_name: string;
  rule_category: string;
  field_name: string;
  operator: string;
  threshold_type: string;
  threshold_value: string | null;
  threshold_value_secondary: string | null;
  action_type: string;
  action_value: string | null;
  priority_order: number;
  severity: string;
  failure_message: string | null;
  review_message: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LenderFormulaConfig {
  id: string;
  rule_set_id: string;
  formula_name: string;
  formula_type: string;
  base_field: string;
  multiplier: number | null;
  cap_value: number | null;
  floor_value: number | null;
  formula_expression: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LenderDecisionMatrix {
  id: string;
  rule_set_id: string;
  min_major_failures: number;
  max_major_failures: number;
  min_minor_failures: number;
  max_minor_failures: number;
  decision_status: string;
  score_from: number | null;
  score_to: number | null;
  remarks: string | null;
  created_at: string;
  updated_at: string;
}

export interface LenderPolicyAuditEntry {
  id: string;
  lender_id: string | null;
  product_id: string | null;
  rule_set_id: string | null;
  action_done: string;
  old_value: any;
  new_value: any;
  changed_by: string | null;
  changed_at: string;
  change_reason: string | null;
}

export interface LenderExecutionResult {
  id: string;
  case_id: string;
  lender_id: string;
  product_id: string;
  rule_set_id: string;
  eligibility_status: string;
  recommended_limit: number;
  recommended_tenure: number | null;
  score: number;
  major_fail_count: number;
  minor_fail_count: number;
  risk_flags: string[];
  failed_rules: any[];
  decision_summary: string | null;
  pricing_band: string | null;
  executed_at: string;
  executed_by: string | null;
}

export interface LenderRuleResultDetail {
  id: string;
  execution_id: string;
  rule_id: string | null;
  rule_code: string | null;
  field_name: string | null;
  observed_value: string | null;
  operator: string | null;
  threshold_value: string | null;
  pass_fail_status: string;
  impact_type: string | null;
  impact_value: string | null;
  message: string | null;
  created_at: string;
}

export interface NormalizedFieldDef {
  key: string;
  label: string;
  type: 'currency' | 'percentage' | 'number' | 'days' | 'boolean' | 'text';
  source: string;
  description: string;
}

export type RuleOperator = '=' | '!=' | '>' | '>=' | '<' | '<=' | 'between' | 'in' | 'not_in' | 'contains' | 'not_contains' | 'is_true' | 'is_false' | 'exists' | 'not_exists' | 'percentage_gt' | 'percentage_lt';

export type RuleActionType = 'PASS' | 'FAIL' | 'WARNING' | 'REVIEW' | 'REJECT' | 'REDUCE_LIMIT' | 'CAP_LIMIT' | 'REDUCE_TENURE' | 'APPLY_HAIRCUT' | 'ADD_RISK_FLAG' | 'ADD_SCORE' | 'DEDUCT_SCORE' | 'OVERRIDE_FORMULA' | 'REQUIRE_MANUAL_APPROVAL';

export type RuleCategory = 'eligibility' | 'banking_conduct' | 'vat_consistency' | 'receivable_quality' | 'inventory' | 'product_specific' | 'affordability' | 'scoring' | 'downgrade' | 'limit_adjustment' | 'manual_review' | 'mandatory_document';

export type RuleSeverity = 'major' | 'minor' | 'critical';

export const RULE_OPERATORS: { value: RuleOperator; label: string }[] = [
  { value: '=', label: 'Equals (=)' },
  { value: '!=', label: 'Not Equals (≠)' },
  { value: '>', label: 'Greater Than (>)' },
  { value: '>=', label: 'Greater or Equal (≥)' },
  { value: '<', label: 'Less Than (<)' },
  { value: '<=', label: 'Less or Equal (≤)' },
  { value: 'between', label: 'Between' },
  { value: 'in', label: 'In List' },
  { value: 'not_in', label: 'Not In List' },
  { value: 'contains', label: 'Contains' },
  { value: 'not_contains', label: 'Does Not Contain' },
  { value: 'is_true', label: 'Is True' },
  { value: 'is_false', label: 'Is False' },
  { value: 'exists', label: 'Exists' },
  { value: 'not_exists', label: 'Does Not Exist' },
  { value: 'percentage_gt', label: '% Greater Than' },
  { value: 'percentage_lt', label: '% Less Than' },
];

export const RULE_ACTION_TYPES: { value: RuleActionType; label: string; description: string }[] = [
  { value: 'PASS', label: 'Pass', description: 'Rule passes - no impact' },
  { value: 'FAIL', label: 'Fail', description: 'Rule fails - counts toward failure tally' },
  { value: 'WARNING', label: 'Warning', description: 'Adds a warning flag' },
  { value: 'REVIEW', label: 'Review', description: 'Triggers manual review' },
  { value: 'REJECT', label: 'Reject', description: 'Hard reject - immediate disqualification' },
  { value: 'REDUCE_LIMIT', label: 'Reduce Limit', description: 'Reduces limit by action_value %' },
  { value: 'CAP_LIMIT', label: 'Cap Limit', description: 'Caps limit at action_value amount' },
  { value: 'REDUCE_TENURE', label: 'Reduce Tenure', description: 'Reduces tenure by action_value months' },
  { value: 'APPLY_HAIRCUT', label: 'Apply Haircut', description: 'Applies haircut % to limit' },
  { value: 'ADD_RISK_FLAG', label: 'Add Risk Flag', description: 'Adds risk flag with action_value text' },
  { value: 'ADD_SCORE', label: 'Add Score', description: 'Adds action_value to score' },
  { value: 'DEDUCT_SCORE', label: 'Deduct Score', description: 'Deducts action_value from score' },
  { value: 'OVERRIDE_FORMULA', label: 'Override Formula', description: 'Overrides formula with action_value' },
  { value: 'REQUIRE_MANUAL_APPROVAL', label: 'Require Manual Approval', description: 'Forces manual approval' },
];

export const RULE_CATEGORIES: { value: RuleCategory; label: string }[] = [
  { value: 'mandatory_document', label: 'Mandatory Document' },
  { value: 'eligibility', label: 'Eligibility' },
  { value: 'banking_conduct', label: 'Banking Conduct' },
  { value: 'vat_consistency', label: 'VAT Consistency' },
  { value: 'receivable_quality', label: 'Receivable Quality' },
  { value: 'inventory', label: 'Inventory' },
  { value: 'product_specific', label: 'Product Specific' },
  { value: 'affordability', label: 'Affordability' },
  { value: 'scoring', label: 'Scoring' },
  { value: 'downgrade', label: 'Downgrade' },
  { value: 'limit_adjustment', label: 'Limit Adjustment' },
  { value: 'manual_review', label: 'Manual Review' },
];

export const NORMALIZED_FIELDS: NormalizedFieldDef[] = [
  { key: 'avg_monthly_bank_credit', label: 'Avg Monthly Bank Credit', type: 'currency', source: 'bank_analysis', description: 'Average monthly credit from bank statements' },
  { key: 'avg_monthly_debit', label: 'Avg Monthly Debit', type: 'currency', source: 'bank_analysis', description: 'Average monthly debit from bank statements' },
  { key: 'avg_monthly_balance', label: 'Avg Monthly Balance', type: 'currency', source: 'bank_analysis', description: 'Average monthly closing balance' },
  { key: 'adjusted_monthly_turnover', label: 'Adjusted Monthly Turnover', type: 'currency', source: 'bank_analysis', description: 'Monthly turnover after exclusions' },
  { key: 'vat_monthly_sales', label: 'VAT Monthly Sales', type: 'currency', source: 'vat_analysis', description: 'Average monthly sales from VAT returns' },
  { key: 'bank_vat_variance', label: 'Bank-VAT Variance %', type: 'percentage', source: 'combined', description: 'Variance between bank credits and VAT sales' },
  { key: 'negative_balance_days', label: 'Negative Balance Days', type: 'days', source: 'bank_analysis', description: 'Total days with negative balance' },
  { key: 'returned_cheque_count', label: 'Returned Cheque Count', type: 'number', source: 'bank_analysis', description: 'Number of bounced cheques' },
  { key: 'cash_deposit_ratio', label: 'Cash Deposit Ratio %', type: 'percentage', source: 'bank_analysis', description: 'Cash deposits as % of total credits' },
  { key: 'internal_transfer_pct', label: 'Internal Transfer %', type: 'percentage', source: 'bank_analysis', description: 'Internal transfers as % of credits' },
  { key: 'one_off_credit_pct', label: 'One-Off Credit %', type: 'percentage', source: 'bank_analysis', description: 'One-off credits as % of total credits' },
  { key: 'business_vintage_months', label: 'Business Vintage (Months)', type: 'number', source: 'document', description: 'Age of business in months' },
  { key: 'statement_months_covered', label: 'Statement Months Covered', type: 'number', source: 'bank_analysis', description: 'Number of months of statements provided' },
  { key: 'vat_periods_covered', label: 'VAT Periods Covered', type: 'number', source: 'vat_analysis', description: 'Number of VAT periods provided' },
  { key: 'normalized_annual_turnover', label: 'Normalized Annual Turnover', type: 'currency', source: 'combined', description: 'Final normalized annual turnover' },
  { key: 'estimated_annual_turnover', label: 'Estimated Annual Turnover', type: 'currency', source: 'bank_analysis', description: 'Annual turnover estimate from bank' },
  { key: 'declared_vat_turnover', label: 'Declared VAT Turnover', type: 'currency', source: 'vat_analysis', description: 'Total declared sales from VAT' },
  { key: 'total_bank_credits', label: 'Total Bank Credits', type: 'currency', source: 'bank_analysis', description: 'Sum of all bank credits' },
  { key: 'total_bank_debits', label: 'Total Bank Debits', type: 'currency', source: 'bank_analysis', description: 'Sum of all bank debits' },
  { key: 'pos_monthly_settlement', label: 'POS Monthly Settlement', type: 'currency', source: 'pos', description: 'Average monthly POS settlement' },
  { key: 'ecommerce_monthly_settlement', label: 'E-commerce Monthly Settlement', type: 'currency', source: 'ecommerce', description: 'Average monthly e-commerce settlement' },
  { key: 'trade_license_valid', label: 'Trade License Valid', type: 'boolean', source: 'document', description: 'Whether trade license is valid' },
  { key: 'vat_trn_available', label: 'VAT TRN Available', type: 'boolean', source: 'vat_analysis', description: 'Whether VAT TRN number is available' },
  { key: 'vat_filed_regularly', label: 'VAT Filed Regularly', type: 'boolean', source: 'vat_analysis', description: 'Whether VAT returns are filed consistently' },
  { key: 'compliance_flag', label: 'Compliance Flag', type: 'boolean', source: 'combined', description: 'Whether compliance issues are detected' },
  { key: 'restricted_industry_flag', label: 'Restricted Industry', type: 'boolean', source: 'document', description: 'Whether business is in restricted industry' },
  { key: 'receivables_overdue_pct', label: 'Receivables Overdue %', type: 'percentage', source: 'receivables', description: 'Overdue receivables as % of total' },
  { key: 'repeat_buyer_ratio', label: 'Repeat Buyer Ratio', type: 'percentage', source: 'receivables', description: 'Repeat buyers as % of total customers' },
  { key: 'top_5_customer_concentration', label: 'Top 5 Customer Concentration %', type: 'percentage', source: 'receivables', description: 'Revenue from top 5 customers as %' },
  { key: 'inventory_value', label: 'Inventory Value', type: 'currency', source: 'inventory', description: 'Total inventory value' },
  { key: 'inventory_turn_days', label: 'Inventory Turn Days', type: 'days', source: 'inventory', description: 'Average days to turn inventory' },
  // Related Party fields
  { key: 'related_party_ratio', label: 'Related Party Ratio %', type: 'percentage', source: 'related_party', description: 'Related party credits as % of total bank credits' },
  { key: 'related_party_adjusted_turnover', label: 'RP-Adjusted Turnover', type: 'currency', source: 'related_party', description: 'Total credits minus related party credits' },
  { key: 'related_party_count', label: 'Related Party Count', type: 'number', source: 'related_party', description: 'Number of related entities detected' },
];

export const FORMULA_TYPES = [
  { value: 'limit', label: 'Limit Calculation' },
  { value: 'tenure', label: 'Tenure Calculation' },
  { value: 'haircut', label: 'Haircut Logic' },
  { value: 'scoring', label: 'Scoring Formula' },
  { value: 'cap', label: 'Cap Logic' },
];

export const DECISION_STATUSES = [
  { value: 'eligible', label: 'Eligible', color: 'bg-emerald-500' },
  { value: 'conditionally_eligible', label: 'Conditionally Eligible', color: 'bg-amber-500' },
  { value: 'review_required', label: 'Manual Review', color: 'bg-orange-500' },
  { value: 'not_eligible', label: 'Not Eligible', color: 'bg-destructive' },
];

export const PRODUCT_TYPES = [
  { value: 'business_loan', label: 'Business Loan' },
  { value: 'pos_financing', label: 'POS Financing' },
  { value: 'invoice_financing', label: 'Invoice Financing' },
  { value: 'revenue_based', label: 'Revenue Based Financing' },
  { value: 'overdraft', label: 'Overdraft' },
  { value: 'working_capital', label: 'Working Capital' },
];
