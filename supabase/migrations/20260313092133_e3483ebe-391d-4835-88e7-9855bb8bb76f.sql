
-- Insert HFS lender
INSERT INTO public.onboarding_lenders (name, short_code, lender_type, is_active, description, eligibility_rules)
VALUES (
  'HFS', 'HFS', 'fintech', true,
  'Revenue-based financing for B2B businesses in UAE with AED 50k-750k monthly revenue',
  '{
    "min_turnover": 600000,
    "max_multiplier": 6,
    "min_loan_amount": 100000,
    "max_loan_amount": null,
    "pos_cap_percent": 0,
    "abcd_fee_percent": 0,
    "reduced_multiplier": 3,
    "variance_thresholds": {"eligible": 15, "reduced": 30},
    "min_statement_months": 6,
    "max_bounce_count": 2,
    "max_cash_deposit_ratio": 30,
    "min_avg_daily_balance": 25000,
    "max_negative_balance_days": 5,
    "max_variance_percent": 30,
    "min_monthly_revenue": 50000,
    "max_monthly_revenue": 750000,
    "min_receivable_days": 15,
    "min_uae_revenue_pct": 80,
    "min_b2b_revenue_pct": 80,
    "min_gross_margin_pct": 10,
    "max_existing_debt": 0,
    "require_past_breakeven": true,
    "require_proceeds_for_cogs": true
  }'::jsonb
);

-- Create HFS product
INSERT INTO public.lender_products (lender_id, product_code, product_name, product_type, min_limit, max_limit, min_tenure, max_tenure, is_active)
SELECT id, 'HFS-RBF-001', 'Revenue-Based Financing', 'revenue_based_financing', 100000, 5000000, 3, 12, true
FROM public.onboarding_lenders WHERE short_code = 'HFS';

-- Create HFS rule set
INSERT INTO public.lender_rule_sets (lender_id, product_id, rule_set_name, version_no, is_active, remarks)
SELECT l.id, p.id, 'HFS RBF Selection Criteria v1', 1, true, 'HFS selection criteria: revenue size, B2B clients, credit terms, profitability, use of proceeds, no debt'
FROM public.onboarding_lenders l
JOIN public.lender_products p ON p.lender_id = l.id AND p.product_code = 'HFS-RBF-001'
WHERE l.short_code = 'HFS';

-- Create HFS rules
-- Rule 1: Monthly Revenue Min (AED 50k)
INSERT INTO public.lender_rules (rule_set_id, rule_code, rule_name, rule_category, field_name, operator, threshold_value, severity, action_type, priority_order, failure_message, review_message)
SELECT rs.id, 'HFS-REV-MIN', 'Minimum Monthly Revenue', 'eligibility', 'avg_monthly_bank_credit', '>=', '50000', 'major', 'FAIL', 10,
  'Monthly revenue below AED 50,000 minimum', 'Monthly revenue near minimum threshold'
FROM public.lender_rule_sets rs
JOIN public.onboarding_lenders l ON l.id = rs.lender_id
WHERE l.short_code = 'HFS' AND rs.is_active = true;

-- Rule 2: Monthly Revenue Max (AED 750k)
INSERT INTO public.lender_rules (rule_set_id, rule_code, rule_name, rule_category, field_name, operator, threshold_value, severity, action_type, priority_order, failure_message, review_message)
SELECT rs.id, 'HFS-REV-MAX', 'Maximum Monthly Revenue', 'eligibility', 'avg_monthly_bank_credit', '<=', '750000', 'major', 'FAIL', 11,
  'Monthly revenue exceeds AED 750,000 cap', 'Monthly revenue near maximum threshold'
FROM public.lender_rule_sets rs
JOIN public.onboarding_lenders l ON l.id = rs.lender_id
WHERE l.short_code = 'HFS' AND rs.is_active = true;

-- Rule 3: UAE Revenue >= 80%
INSERT INTO public.lender_rules (rule_set_id, rule_code, rule_name, rule_category, field_name, operator, threshold_value, severity, action_type, priority_order, failure_message, review_message)
SELECT rs.id, 'HFS-UAE-REV', 'UAE Revenue Concentration', 'eligibility', 'uae_revenue_pct', '>=', '80', 'major', 'FAIL', 20,
  'UAE revenue below 80% requirement', 'UAE revenue concentration near threshold'
FROM public.lender_rule_sets rs
JOIN public.onboarding_lenders l ON l.id = rs.lender_id
WHERE l.short_code = 'HFS' AND rs.is_active = true;

-- Rule 4: B2B Revenue >= 80%
INSERT INTO public.lender_rules (rule_set_id, rule_code, rule_name, rule_category, field_name, operator, threshold_value, severity, action_type, priority_order, failure_message, review_message)
SELECT rs.id, 'HFS-B2B', 'B2B Revenue Requirement', 'eligibility', 'b2b_revenue_pct', '>=', '80', 'major', 'FAIL', 21,
  'B2B revenue below 80% requirement', 'B2B revenue near threshold'
FROM public.lender_rule_sets rs
JOIN public.onboarding_lenders l ON l.id = rs.lender_id
WHERE l.short_code = 'HFS' AND rs.is_active = true;

-- Rule 5: Credit Terms >= 15 days
INSERT INTO public.lender_rules (rule_set_id, rule_code, rule_name, rule_category, field_name, operator, threshold_value, severity, action_type, priority_order, failure_message, review_message)
SELECT rs.id, 'HFS-CREDIT-TERMS', 'Minimum Credit Terms', 'eligibility', 'receivable_days', '>=', '15', 'major', 'FAIL', 30,
  'Average credit terms below 15 days minimum', 'Credit terms near minimum threshold'
FROM public.lender_rule_sets rs
JOIN public.onboarding_lenders l ON l.id = rs.lender_id
WHERE l.short_code = 'HFS' AND rs.is_active = true;

-- Rule 6: No Cash Collections (cash deposit ratio < 20%)
INSERT INTO public.lender_rules (rule_set_id, rule_code, rule_name, rule_category, field_name, operator, threshold_value, severity, action_type, priority_order, failure_message, review_message)
SELECT rs.id, 'HFS-NO-CASH', 'Non-Cash Collections', 'risk', 'cash_deposit_ratio', '<=', '20', 'major', 'FAIL', 31,
  'Cash deposit ratio too high - collections must not be in cash', 'High cash collection ratio detected'
FROM public.lender_rule_sets rs
JOIN public.onboarding_lenders l ON l.id = rs.lender_id
WHERE l.short_code = 'HFS' AND rs.is_active = true;

-- Rule 7: Gross Margin >= 10%
INSERT INTO public.lender_rules (rule_set_id, rule_code, rule_name, rule_category, field_name, operator, threshold_value, severity, action_type, priority_order, failure_message, review_message)
SELECT rs.id, 'HFS-MARGIN', 'Minimum Gross Margin', 'financial', 'gross_margin_pct', '>=', '10', 'major', 'FAIL', 40,
  'Gross margin below 10% per month of cash conversion cycle', 'Gross margin near minimum threshold'
FROM public.lender_rule_sets rs
JOIN public.onboarding_lenders l ON l.id = rs.lender_id
WHERE l.short_code = 'HFS' AND rs.is_active = true;

-- Rule 8: Past Breakeven
INSERT INTO public.lender_rules (rule_set_id, rule_code, rule_name, rule_category, field_name, operator, threshold_value, severity, action_type, priority_order, failure_message, review_message)
SELECT rs.id, 'HFS-BREAKEVEN', 'Past Breakeven', 'financial', 'past_breakeven', '=', 'true', 'major', 'FAIL', 41,
  'Business has not reached breakeven', 'Breakeven status requires verification'
FROM public.lender_rule_sets rs
JOIN public.onboarding_lenders l ON l.id = rs.lender_id
WHERE l.short_code = 'HFS' AND rs.is_active = true;

-- Rule 9: Use of Proceeds for COGS
INSERT INTO public.lender_rules (rule_set_id, rule_code, rule_name, rule_category, field_name, operator, threshold_value, severity, action_type, priority_order, failure_message, review_message)
SELECT rs.id, 'HFS-PROCEEDS', 'Use of Proceeds for COGS', 'eligibility', 'proceeds_for_cogs', '=', 'true', 'major', 'FAIL', 50,
  'Capital must be used for COGS in new orders generating immediate revenue uplift', 'Verify use of proceeds is for COGS'
FROM public.lender_rule_sets rs
JOIN public.onboarding_lenders l ON l.id = rs.lender_id
WHERE l.short_code = 'HFS' AND rs.is_active = true;

-- Rule 10: No Existing Debt
INSERT INTO public.lender_rules (rule_set_id, rule_code, rule_name, rule_category, field_name, operator, threshold_value, severity, action_type, priority_order, failure_message, review_message)
SELECT rs.id, 'HFS-NO-DEBT', 'No Existing Debt', 'financial', 'existing_debt_count', '=', '0', 'major', 'FAIL', 60,
  'Business must have no existing debt obligations', 'Existing debt detected - verify status'
FROM public.lender_rule_sets rs
JOIN public.onboarding_lenders l ON l.id = rs.lender_id
WHERE l.short_code = 'HFS' AND rs.is_active = true;

-- Create decision matrix for HFS
INSERT INTO public.lender_decision_matrix (rule_set_id, min_major_failures, max_major_failures, min_minor_failures, max_minor_failures, decision_status, remarks)
SELECT rs.id, 0, 0, 0, 2, 'eligible', 'All major criteria met'
FROM public.lender_rule_sets rs
JOIN public.onboarding_lenders l ON l.id = rs.lender_id
WHERE l.short_code = 'HFS' AND rs.is_active = true;

INSERT INTO public.lender_decision_matrix (rule_set_id, min_major_failures, max_major_failures, min_minor_failures, max_minor_failures, decision_status, remarks)
SELECT rs.id, 1, 1, 0, 3, 'conditionally_eligible', 'One major criterion requires deviation'
FROM public.lender_rule_sets rs
JOIN public.onboarding_lenders l ON l.id = rs.lender_id
WHERE l.short_code = 'HFS' AND rs.is_active = true;

INSERT INTO public.lender_decision_matrix (rule_set_id, min_major_failures, max_major_failures, min_minor_failures, max_minor_failures, decision_status, remarks)
SELECT rs.id, 2, 10, 0, 10, 'not_eligible', 'Multiple selection criteria not met'
FROM public.lender_rule_sets rs
JOIN public.onboarding_lenders l ON l.id = rs.lender_id
WHERE l.short_code = 'HFS' AND rs.is_active = true;

-- Create limit formula for HFS (6x monthly revenue)
INSERT INTO public.lender_formula_configs (rule_set_id, formula_name, formula_type, base_field, multiplier, cap_value, floor_value, is_active)
SELECT rs.id, 'HFS Revenue Multiplier', 'limit', 'avg_monthly_bank_credit', 6, 5000000, 100000, true
FROM public.lender_rule_sets rs
JOIN public.onboarding_lenders l ON l.id = rs.lender_id
WHERE l.short_code = 'HFS' AND rs.is_active = true;
