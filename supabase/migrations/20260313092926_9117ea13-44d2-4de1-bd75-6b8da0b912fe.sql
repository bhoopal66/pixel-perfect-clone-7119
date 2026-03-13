
-- =============================================
-- RULES FOR RAK BANK TERM LOAN
-- =============================================
INSERT INTO public.lender_rules (rule_set_id, rule_code, rule_name, rule_category, field_name, operator, threshold_value, severity, action_type, priority_order, failure_message)
SELECT rs.id, 'RAK-MIN-TURN', 'Minimum Turnover', 'eligibility', 'avg_monthly_bank_credit', '>=', '100000', 'major', 'FAIL', 10, 'Monthly turnover below AED 100,000'
FROM lender_rule_sets rs JOIN onboarding_lenders l ON l.id = rs.lender_id WHERE l.short_code = 'RAK' AND rs.rule_set_name LIKE '%Term Loan%';

INSERT INTO public.lender_rules (rule_set_id, rule_code, rule_name, rule_category, field_name, operator, threshold_value, severity, action_type, priority_order, failure_message)
SELECT rs.id, 'RAK-STMT-COV', 'Statement Coverage', 'eligibility', 'statement_months_covered', '>=', '6', 'major', 'FAIL', 20, 'Less than 6 months of statements'
FROM lender_rule_sets rs JOIN onboarding_lenders l ON l.id = rs.lender_id WHERE l.short_code = 'RAK' AND rs.rule_set_name LIKE '%Term Loan%';

INSERT INTO public.lender_rules (rule_set_id, rule_code, rule_name, rule_category, field_name, operator, threshold_value, severity, action_type, priority_order, failure_message)
SELECT rs.id, 'RAK-VARIANCE', 'Bank-VAT Variance', 'eligibility', 'bank_vat_variance', '<=', '25', 'major', 'FAIL', 30, 'Bank-VAT variance exceeds 25%'
FROM lender_rule_sets rs JOIN onboarding_lenders l ON l.id = rs.lender_id WHERE l.short_code = 'RAK' AND rs.rule_set_name LIKE '%Term Loan%';

INSERT INTO public.lender_rules (rule_set_id, rule_code, rule_name, rule_category, field_name, operator, threshold_value, severity, action_type, priority_order, failure_message)
SELECT rs.id, 'RAK-BOUNCE', 'Cheque Returns', 'risk', 'returned_cheque_count', '<=', '3', 'minor', 'FAIL', 40, 'More than 3 cheque returns'
FROM lender_rule_sets rs JOIN onboarding_lenders l ON l.id = rs.lender_id WHERE l.short_code = 'RAK' AND rs.rule_set_name LIKE '%Term Loan%';

INSERT INTO public.lender_rules (rule_set_id, rule_code, rule_name, rule_category, field_name, operator, threshold_value, severity, action_type, priority_order, failure_message)
SELECT rs.id, 'RAK-NEGBAL', 'Negative Balance', 'risk', 'negative_balance_days', '<=', '10', 'minor', 'FAIL', 50, 'Excessive negative balance days'
FROM lender_rule_sets rs JOIN onboarding_lenders l ON l.id = rs.lender_id WHERE l.short_code = 'RAK' AND rs.rule_set_name LIKE '%Term Loan%';

INSERT INTO public.lender_rules (rule_set_id, rule_code, rule_name, rule_category, field_name, operator, threshold_value, severity, action_type, priority_order, failure_message)
SELECT rs.id, 'RAK-CASH', 'Cash Deposit Ratio', 'risk', 'cash_deposit_ratio', '<=', '40', 'minor', 'FAIL', 60, 'Cash deposits exceed 40% of credits'
FROM lender_rule_sets rs JOIN onboarding_lenders l ON l.id = rs.lender_id WHERE l.short_code = 'RAK' AND rs.rule_set_name LIKE '%Term Loan%';

-- =============================================
-- RULES FOR RAK BANK POS FINANCE
-- =============================================
INSERT INTO public.lender_rules (rule_set_id, rule_code, rule_name, rule_category, field_name, operator, threshold_value, severity, action_type, priority_order, failure_message)
SELECT rs.id, 'RAK-POS-TURN', 'Minimum Turnover', 'eligibility', 'avg_monthly_bank_credit', '>=', '100000', 'major', 'FAIL', 10, 'Monthly turnover below AED 100,000'
FROM lender_rule_sets rs JOIN onboarding_lenders l ON l.id = rs.lender_id WHERE l.short_code = 'RAK' AND rs.rule_set_name LIKE '%POS%';

INSERT INTO public.lender_rules (rule_set_id, rule_code, rule_name, rule_category, field_name, operator, threshold_value, severity, action_type, priority_order, failure_message)
SELECT rs.id, 'RAK-POS-STMT', 'Statement Coverage', 'eligibility', 'statement_months_covered', '>=', '6', 'major', 'FAIL', 20, 'Less than 6 months of statements'
FROM lender_rule_sets rs JOIN onboarding_lenders l ON l.id = rs.lender_id WHERE l.short_code = 'RAK' AND rs.rule_set_name LIKE '%POS%';

INSERT INTO public.lender_rules (rule_set_id, rule_code, rule_name, rule_category, field_name, operator, threshold_value, severity, action_type, priority_order, failure_message)
SELECT rs.id, 'RAK-POS-POS', 'POS Settlement Required', 'eligibility', 'pos_monthly_settlement', '>', '0', 'major', 'FAIL', 25, 'No POS settlement detected'
FROM lender_rule_sets rs JOIN onboarding_lenders l ON l.id = rs.lender_id WHERE l.short_code = 'RAK' AND rs.rule_set_name LIKE '%POS%';

INSERT INTO public.lender_rules (rule_set_id, rule_code, rule_name, rule_category, field_name, operator, threshold_value, severity, action_type, priority_order, failure_message)
SELECT rs.id, 'RAK-POS-VAR', 'Bank-VAT Variance', 'eligibility', 'bank_vat_variance', '<=', '25', 'major', 'FAIL', 30, 'Variance exceeds 25%'
FROM lender_rule_sets rs JOIN onboarding_lenders l ON l.id = rs.lender_id WHERE l.short_code = 'RAK' AND rs.rule_set_name LIKE '%POS%';

INSERT INTO public.lender_rules (rule_set_id, rule_code, rule_name, rule_category, field_name, operator, threshold_value, severity, action_type, priority_order, failure_message)
SELECT rs.id, 'RAK-POS-BNC', 'Cheque Returns', 'risk', 'returned_cheque_count', '<=', '3', 'minor', 'FAIL', 40, 'More than 3 cheque returns'
FROM lender_rule_sets rs JOIN onboarding_lenders l ON l.id = rs.lender_id WHERE l.short_code = 'RAK' AND rs.rule_set_name LIKE '%POS%';

-- =============================================
-- RULES FOR EMIRATES NBD
-- =============================================
INSERT INTO public.lender_rules (rule_set_id, rule_code, rule_name, rule_category, field_name, operator, threshold_value, severity, action_type, priority_order, failure_message)
SELECT rs.id, 'ENBD-MIN-TURN', 'Minimum Turnover', 'eligibility', 'avg_monthly_bank_credit', '>=', '150000', 'major', 'FAIL', 10, 'Monthly turnover below AED 150,000'
FROM lender_rule_sets rs JOIN onboarding_lenders l ON l.id = rs.lender_id WHERE l.short_code = 'ENBD';

INSERT INTO public.lender_rules (rule_set_id, rule_code, rule_name, rule_category, field_name, operator, threshold_value, severity, action_type, priority_order, failure_message)
SELECT rs.id, 'ENBD-STMT', 'Statement Coverage', 'eligibility', 'statement_months_covered', '>=', '6', 'major', 'FAIL', 20, 'Less than 6 months of statements'
FROM lender_rule_sets rs JOIN onboarding_lenders l ON l.id = rs.lender_id WHERE l.short_code = 'ENBD';

INSERT INTO public.lender_rules (rule_set_id, rule_code, rule_name, rule_category, field_name, operator, threshold_value, severity, action_type, priority_order, failure_message)
SELECT rs.id, 'ENBD-VAR', 'Bank-VAT Variance', 'eligibility', 'bank_vat_variance', '<=', '25', 'major', 'FAIL', 30, 'Variance exceeds 25%'
FROM lender_rule_sets rs JOIN onboarding_lenders l ON l.id = rs.lender_id WHERE l.short_code = 'ENBD';

INSERT INTO public.lender_rules (rule_set_id, rule_code, rule_name, rule_category, field_name, operator, threshold_value, severity, action_type, priority_order, failure_message)
SELECT rs.id, 'ENBD-VAT', 'VAT Registration', 'eligibility', 'vat_trn_available', '=', 'true', 'major', 'FAIL', 35, 'VAT registration required'
FROM lender_rule_sets rs JOIN onboarding_lenders l ON l.id = rs.lender_id WHERE l.short_code = 'ENBD';

INSERT INTO public.lender_rules (rule_set_id, rule_code, rule_name, rule_category, field_name, operator, threshold_value, severity, action_type, priority_order, failure_message)
SELECT rs.id, 'ENBD-BOUNCE', 'Cheque Returns', 'risk', 'returned_cheque_count', '<=', '2', 'minor', 'FAIL', 40, 'More than 2 cheque returns'
FROM lender_rule_sets rs JOIN onboarding_lenders l ON l.id = rs.lender_id WHERE l.short_code = 'ENBD';

INSERT INTO public.lender_rules (rule_set_id, rule_code, rule_name, rule_category, field_name, operator, threshold_value, severity, action_type, priority_order, failure_message)
SELECT rs.id, 'ENBD-NEGBAL', 'Negative Balance', 'risk', 'negative_balance_days', '<=', '5', 'minor', 'FAIL', 50, 'More than 5 negative balance days'
FROM lender_rule_sets rs JOIN onboarding_lenders l ON l.id = rs.lender_id WHERE l.short_code = 'ENBD';

INSERT INTO public.lender_rules (rule_set_id, rule_code, rule_name, rule_category, field_name, operator, threshold_value, severity, action_type, priority_order, failure_message)
SELECT rs.id, 'ENBD-CASH', 'Cash Deposit Ratio', 'risk', 'cash_deposit_ratio', '<=', '35', 'minor', 'FAIL', 60, 'Cash deposits exceed 35%'
FROM lender_rule_sets rs JOIN onboarding_lenders l ON l.id = rs.lender_id WHERE l.short_code = 'ENBD';

-- =============================================
-- RULES FOR NBF
-- =============================================
INSERT INTO public.lender_rules (rule_set_id, rule_code, rule_name, rule_category, field_name, operator, threshold_value, severity, action_type, priority_order, failure_message)
SELECT rs.id, 'NBF-MIN-TURN', 'Minimum Turnover', 'eligibility', 'avg_monthly_bank_credit', '>=', '200000', 'major', 'FAIL', 10, 'Monthly turnover below AED 200,000'
FROM lender_rule_sets rs JOIN onboarding_lenders l ON l.id = rs.lender_id WHERE l.short_code = 'NBF';

INSERT INTO public.lender_rules (rule_set_id, rule_code, rule_name, rule_category, field_name, operator, threshold_value, severity, action_type, priority_order, failure_message)
SELECT rs.id, 'NBF-STMT', 'Statement Coverage', 'eligibility', 'statement_months_covered', '>=', '6', 'major', 'FAIL', 20, 'Less than 6 months of statements'
FROM lender_rule_sets rs JOIN onboarding_lenders l ON l.id = rs.lender_id WHERE l.short_code = 'NBF';

INSERT INTO public.lender_rules (rule_set_id, rule_code, rule_name, rule_category, field_name, operator, threshold_value, severity, action_type, priority_order, failure_message)
SELECT rs.id, 'NBF-VINTAGE', 'Business Vintage', 'eligibility', 'business_vintage_months', '>=', '12', 'major', 'FAIL', 25, 'Business vintage less than 12 months'
FROM lender_rule_sets rs JOIN onboarding_lenders l ON l.id = rs.lender_id WHERE l.short_code = 'NBF';

INSERT INTO public.lender_rules (rule_set_id, rule_code, rule_name, rule_category, field_name, operator, threshold_value, severity, action_type, priority_order, failure_message)
SELECT rs.id, 'NBF-VAR', 'Bank-VAT Variance', 'eligibility', 'bank_vat_variance', '<=', '25', 'major', 'FAIL', 30, 'Variance exceeds 25%'
FROM lender_rule_sets rs JOIN onboarding_lenders l ON l.id = rs.lender_id WHERE l.short_code = 'NBF';

INSERT INTO public.lender_rules (rule_set_id, rule_code, rule_name, rule_category, field_name, operator, threshold_value, severity, action_type, priority_order, failure_message)
SELECT rs.id, 'NBF-BOUNCE', 'Cheque Returns', 'risk', 'returned_cheque_count', '<=', '3', 'minor', 'FAIL', 40, 'More than 3 cheque returns'
FROM lender_rule_sets rs JOIN onboarding_lenders l ON l.id = rs.lender_id WHERE l.short_code = 'NBF';

INSERT INTO public.lender_rules (rule_set_id, rule_code, rule_name, rule_category, field_name, operator, threshold_value, severity, action_type, priority_order, failure_message)
SELECT rs.id, 'NBF-NEGBAL', 'Negative Balance', 'risk', 'negative_balance_days', '<=', '10', 'minor', 'FAIL', 50, 'Excessive negative balance days'
FROM lender_rule_sets rs JOIN onboarding_lenders l ON l.id = rs.lender_id WHERE l.short_code = 'NBF';

-- =============================================
-- RULES FOR CREDIBLEX
-- =============================================
INSERT INTO public.lender_rules (rule_set_id, rule_code, rule_name, rule_category, field_name, operator, threshold_value, severity, action_type, priority_order, failure_message)
SELECT rs.id, 'CREDX-MIN-TURN', 'Minimum Turnover', 'eligibility', 'avg_monthly_bank_credit', '>=', '150000', 'major', 'FAIL', 10, 'Monthly turnover below AED 150,000'
FROM lender_rule_sets rs JOIN onboarding_lenders l ON l.id = rs.lender_id WHERE l.short_code = 'CREDX';

INSERT INTO public.lender_rules (rule_set_id, rule_code, rule_name, rule_category, field_name, operator, threshold_value, severity, action_type, priority_order, failure_message)
SELECT rs.id, 'CREDX-STMT', 'Statement Coverage', 'eligibility', 'statement_months_covered', '>=', '6', 'major', 'FAIL', 20, 'Less than 6 months of statements'
FROM lender_rule_sets rs JOIN onboarding_lenders l ON l.id = rs.lender_id WHERE l.short_code = 'CREDX';

INSERT INTO public.lender_rules (rule_set_id, rule_code, rule_name, rule_category, field_name, operator, threshold_value, severity, action_type, priority_order, failure_message)
SELECT rs.id, 'CREDX-VINTAGE', 'Business Vintage', 'eligibility', 'business_vintage_months', '>=', '6', 'major', 'FAIL', 25, 'Business vintage less than 6 months'
FROM lender_rule_sets rs JOIN onboarding_lenders l ON l.id = rs.lender_id WHERE l.short_code = 'CREDX';

INSERT INTO public.lender_rules (rule_set_id, rule_code, rule_name, rule_category, field_name, operator, threshold_value, severity, action_type, priority_order, failure_message)
SELECT rs.id, 'CREDX-BOUNCE', 'Cheque Returns', 'risk', 'returned_cheque_count', '<=', '2', 'minor', 'FAIL', 40, 'More than 2 cheque returns'
FROM lender_rule_sets rs JOIN onboarding_lenders l ON l.id = rs.lender_id WHERE l.short_code = 'CREDX';

INSERT INTO public.lender_rules (rule_set_id, rule_code, rule_name, rule_category, field_name, operator, threshold_value, severity, action_type, priority_order, failure_message)
SELECT rs.id, 'CREDX-CASH', 'Cash Deposit Ratio', 'risk', 'cash_deposit_ratio', '<=', '30', 'minor', 'FAIL', 50, 'Cash deposits exceed 30%'
FROM lender_rule_sets rs JOIN onboarding_lenders l ON l.id = rs.lender_id WHERE l.short_code = 'CREDX';

INSERT INTO public.lender_rules (rule_set_id, rule_code, rule_name, rule_category, field_name, operator, threshold_value, severity, action_type, priority_order, failure_message)
SELECT rs.id, 'CREDX-NEGBAL', 'Negative Balance', 'risk', 'negative_balance_days', '<=', '7', 'minor', 'FAIL', 60, 'More than 7 negative balance days'
FROM lender_rule_sets rs JOIN onboarding_lenders l ON l.id = rs.lender_id WHERE l.short_code = 'CREDX';

-- =============================================
-- RULES FOR COMFI
-- =============================================
INSERT INTO public.lender_rules (rule_set_id, rule_code, rule_name, rule_category, field_name, operator, threshold_value, severity, action_type, priority_order, failure_message)
SELECT rs.id, 'COMFI-MIN-TURN', 'Minimum Turnover', 'eligibility', 'avg_monthly_bank_credit', '>=', '75000', 'major', 'FAIL', 10, 'Monthly turnover below AED 75,000'
FROM lender_rule_sets rs JOIN onboarding_lenders l ON l.id = rs.lender_id WHERE l.short_code = 'COMFI';

INSERT INTO public.lender_rules (rule_set_id, rule_code, rule_name, rule_category, field_name, operator, threshold_value, severity, action_type, priority_order, failure_message)
SELECT rs.id, 'COMFI-STMT', 'Statement Coverage', 'eligibility', 'statement_months_covered', '>=', '6', 'major', 'FAIL', 20, 'Less than 6 months of statements'
FROM lender_rule_sets rs JOIN onboarding_lenders l ON l.id = rs.lender_id WHERE l.short_code = 'COMFI';

INSERT INTO public.lender_rules (rule_set_id, rule_code, rule_name, rule_category, field_name, operator, threshold_value, severity, action_type, priority_order, failure_message)
SELECT rs.id, 'COMFI-VINTAGE', 'Business Vintage', 'eligibility', 'business_vintage_months', '>=', '6', 'major', 'FAIL', 25, 'Business vintage less than 6 months'
FROM lender_rule_sets rs JOIN onboarding_lenders l ON l.id = rs.lender_id WHERE l.short_code = 'COMFI';

INSERT INTO public.lender_rules (rule_set_id, rule_code, rule_name, rule_category, field_name, operator, threshold_value, severity, action_type, priority_order, failure_message)
SELECT rs.id, 'COMFI-BOUNCE', 'Cheque Returns', 'risk', 'returned_cheque_count', '<=', '3', 'minor', 'FAIL', 40, 'More than 3 cheque returns'
FROM lender_rule_sets rs JOIN onboarding_lenders l ON l.id = rs.lender_id WHERE l.short_code = 'COMFI';

INSERT INTO public.lender_rules (rule_set_id, rule_code, rule_name, rule_category, field_name, operator, threshold_value, severity, action_type, priority_order, failure_message)
SELECT rs.id, 'COMFI-CASH', 'Cash Deposit Ratio', 'risk', 'cash_deposit_ratio', '<=', '35', 'minor', 'FAIL', 50, 'Cash deposits exceed 35%'
FROM lender_rule_sets rs JOIN onboarding_lenders l ON l.id = rs.lender_id WHERE l.short_code = 'COMFI';

-- =============================================
-- RULES FOR FLAPCAP
-- =============================================
INSERT INTO public.lender_rules (rule_set_id, rule_code, rule_name, rule_category, field_name, operator, threshold_value, severity, action_type, priority_order, failure_message)
SELECT rs.id, 'FLAP-MIN-TURN', 'Minimum Turnover', 'eligibility', 'avg_monthly_bank_credit', '>=', '100000', 'major', 'FAIL', 10, 'Monthly turnover below AED 100,000'
FROM lender_rule_sets rs JOIN onboarding_lenders l ON l.id = rs.lender_id WHERE l.short_code = 'FLAP';

INSERT INTO public.lender_rules (rule_set_id, rule_code, rule_name, rule_category, field_name, operator, threshold_value, severity, action_type, priority_order, failure_message)
SELECT rs.id, 'FLAP-STMT', 'Statement Coverage', 'eligibility', 'statement_months_covered', '>=', '6', 'major', 'FAIL', 20, 'Less than 6 months of statements'
FROM lender_rule_sets rs JOIN onboarding_lenders l ON l.id = rs.lender_id WHERE l.short_code = 'FLAP';

INSERT INTO public.lender_rules (rule_set_id, rule_code, rule_name, rule_category, field_name, operator, threshold_value, severity, action_type, priority_order, failure_message)
SELECT rs.id, 'FLAP-VINTAGE', 'Business Vintage', 'eligibility', 'business_vintage_months', '>=', '6', 'major', 'FAIL', 25, 'Business vintage less than 6 months'
FROM lender_rule_sets rs JOIN onboarding_lenders l ON l.id = rs.lender_id WHERE l.short_code = 'FLAP';

INSERT INTO public.lender_rules (rule_set_id, rule_code, rule_name, rule_category, field_name, operator, threshold_value, severity, action_type, priority_order, failure_message)
SELECT rs.id, 'FLAP-BOUNCE', 'Cheque Returns', 'risk', 'returned_cheque_count', '<=', '3', 'minor', 'FAIL', 40, 'More than 3 cheque returns'
FROM lender_rule_sets rs JOIN onboarding_lenders l ON l.id = rs.lender_id WHERE l.short_code = 'FLAP';

INSERT INTO public.lender_rules (rule_set_id, rule_code, rule_name, rule_category, field_name, operator, threshold_value, severity, action_type, priority_order, failure_message)
SELECT rs.id, 'FLAP-NEGBAL', 'Negative Balance', 'risk', 'negative_balance_days', '<=', '10', 'minor', 'FAIL', 50, 'Excessive negative balance days'
FROM lender_rule_sets rs JOIN onboarding_lenders l ON l.id = rs.lender_id WHERE l.short_code = 'FLAP';

-- =============================================
-- RULES FOR FLOW48
-- =============================================
INSERT INTO public.lender_rules (rule_set_id, rule_code, rule_name, rule_category, field_name, operator, threshold_value, severity, action_type, priority_order, failure_message)
SELECT rs.id, 'FL48-MIN-TURN', 'Minimum Turnover', 'eligibility', 'avg_monthly_bank_credit', '>=', '80000', 'major', 'FAIL', 10, 'Monthly turnover below AED 80,000'
FROM lender_rule_sets rs JOIN onboarding_lenders l ON l.id = rs.lender_id WHERE l.short_code = 'FL48';

INSERT INTO public.lender_rules (rule_set_id, rule_code, rule_name, rule_category, field_name, operator, threshold_value, severity, action_type, priority_order, failure_message)
SELECT rs.id, 'FL48-STMT', 'Statement Coverage', 'eligibility', 'statement_months_covered', '>=', '6', 'major', 'FAIL', 20, 'Less than 6 months of statements'
FROM lender_rule_sets rs JOIN onboarding_lenders l ON l.id = rs.lender_id WHERE l.short_code = 'FL48';

INSERT INTO public.lender_rules (rule_set_id, rule_code, rule_name, rule_category, field_name, operator, threshold_value, severity, action_type, priority_order, failure_message)
SELECT rs.id, 'FL48-VINTAGE', 'Business Vintage', 'eligibility', 'business_vintage_months', '>=', '12', 'major', 'FAIL', 25, 'Business vintage less than 12 months'
FROM lender_rule_sets rs JOIN onboarding_lenders l ON l.id = rs.lender_id WHERE l.short_code = 'FL48';

INSERT INTO public.lender_rules (rule_set_id, rule_code, rule_name, rule_category, field_name, operator, threshold_value, severity, action_type, priority_order, failure_message)
SELECT rs.id, 'FL48-BOUNCE', 'Cheque Returns', 'risk', 'returned_cheque_count', '<=', '3', 'minor', 'FAIL', 40, 'More than 3 cheque returns'
FROM lender_rule_sets rs JOIN onboarding_lenders l ON l.id = rs.lender_id WHERE l.short_code = 'FL48';

INSERT INTO public.lender_rules (rule_set_id, rule_code, rule_name, rule_category, field_name, operator, threshold_value, severity, action_type, priority_order, failure_message)
SELECT rs.id, 'FL48-CASH', 'Cash Deposit Ratio', 'risk', 'cash_deposit_ratio', '<=', '30', 'minor', 'FAIL', 50, 'Cash deposits exceed 30%'
FROM lender_rule_sets rs JOIN onboarding_lenders l ON l.id = rs.lender_id WHERE l.short_code = 'FL48';

-- =============================================
-- RULES FOR FUNDING SOUQ
-- =============================================
INSERT INTO public.lender_rules (rule_set_id, rule_code, rule_name, rule_category, field_name, operator, threshold_value, severity, action_type, priority_order, failure_message)
SELECT rs.id, 'FSOUQ-MIN-TURN', 'Minimum Turnover', 'eligibility', 'avg_monthly_bank_credit', '>=', '500000', 'major', 'FAIL', 10, 'Monthly turnover below AED 500,000'
FROM lender_rule_sets rs JOIN onboarding_lenders l ON l.id = rs.lender_id WHERE l.short_code = 'FSOUQ';

INSERT INTO public.lender_rules (rule_set_id, rule_code, rule_name, rule_category, field_name, operator, threshold_value, severity, action_type, priority_order, failure_message)
SELECT rs.id, 'FSOUQ-STMT', 'Statement Coverage', 'eligibility', 'statement_months_covered', '>=', '6', 'major', 'FAIL', 20, 'Less than 6 months of statements'
FROM lender_rule_sets rs JOIN onboarding_lenders l ON l.id = rs.lender_id WHERE l.short_code = 'FSOUQ';

INSERT INTO public.lender_rules (rule_set_id, rule_code, rule_name, rule_category, field_name, operator, threshold_value, severity, action_type, priority_order, failure_message)
SELECT rs.id, 'FSOUQ-VINTAGE', 'Business Vintage', 'eligibility', 'business_vintage_months', '>=', '24', 'major', 'FAIL', 25, 'Business vintage less than 24 months'
FROM lender_rule_sets rs JOIN onboarding_lenders l ON l.id = rs.lender_id WHERE l.short_code = 'FSOUQ';

INSERT INTO public.lender_rules (rule_set_id, rule_code, rule_name, rule_category, field_name, operator, threshold_value, severity, action_type, priority_order, failure_message)
SELECT rs.id, 'FSOUQ-VAR', 'Bank-VAT Variance', 'eligibility', 'bank_vat_variance', '<=', '25', 'major', 'FAIL', 30, 'Variance exceeds 25%'
FROM lender_rule_sets rs JOIN onboarding_lenders l ON l.id = rs.lender_id WHERE l.short_code = 'FSOUQ';

INSERT INTO public.lender_rules (rule_set_id, rule_code, rule_name, rule_category, field_name, operator, threshold_value, severity, action_type, priority_order, failure_message)
SELECT rs.id, 'FSOUQ-VAT', 'VAT Registration', 'eligibility', 'vat_trn_available', '=', 'true', 'major', 'FAIL', 35, 'VAT registration required'
FROM lender_rule_sets rs JOIN onboarding_lenders l ON l.id = rs.lender_id WHERE l.short_code = 'FSOUQ';

INSERT INTO public.lender_rules (rule_set_id, rule_code, rule_name, rule_category, field_name, operator, threshold_value, severity, action_type, priority_order, failure_message)
SELECT rs.id, 'FSOUQ-BOUNCE', 'Cheque Returns', 'risk', 'returned_cheque_count', '<=', '2', 'minor', 'FAIL', 40, 'More than 2 cheque returns'
FROM lender_rule_sets rs JOIN onboarding_lenders l ON l.id = rs.lender_id WHERE l.short_code = 'FSOUQ';

INSERT INTO public.lender_rules (rule_set_id, rule_code, rule_name, rule_category, field_name, operator, threshold_value, severity, action_type, priority_order, failure_message)
SELECT rs.id, 'FSOUQ-NEGBAL', 'Negative Balance', 'risk', 'negative_balance_days', '<=', '5', 'minor', 'FAIL', 50, 'More than 5 negative balance days'
FROM lender_rule_sets rs JOIN onboarding_lenders l ON l.id = rs.lender_id WHERE l.short_code = 'FSOUQ';

-- =============================================
-- RULES FOR UPFRONT
-- =============================================
INSERT INTO public.lender_rules (rule_set_id, rule_code, rule_name, rule_category, field_name, operator, threshold_value, severity, action_type, priority_order, failure_message)
SELECT rs.id, 'UPFR-MIN-TURN', 'Minimum Turnover', 'eligibility', 'avg_monthly_bank_credit', '>=', '40000', 'major', 'FAIL', 10, 'Monthly turnover below AED 40,000'
FROM lender_rule_sets rs JOIN onboarding_lenders l ON l.id = rs.lender_id WHERE l.short_code = 'UPFR';

INSERT INTO public.lender_rules (rule_set_id, rule_code, rule_name, rule_category, field_name, operator, threshold_value, severity, action_type, priority_order, failure_message)
SELECT rs.id, 'UPFR-STMT', 'Statement Coverage', 'eligibility', 'statement_months_covered', '>=', '3', 'major', 'FAIL', 20, 'Less than 3 months of statements'
FROM lender_rule_sets rs JOIN onboarding_lenders l ON l.id = rs.lender_id WHERE l.short_code = 'UPFR';

INSERT INTO public.lender_rules (rule_set_id, rule_code, rule_name, rule_category, field_name, operator, threshold_value, severity, action_type, priority_order, failure_message)
SELECT rs.id, 'UPFR-VINTAGE', 'Business Vintage', 'eligibility', 'business_vintage_months', '>=', '3', 'major', 'FAIL', 25, 'Business vintage less than 3 months'
FROM lender_rule_sets rs JOIN onboarding_lenders l ON l.id = rs.lender_id WHERE l.short_code = 'UPFR';

INSERT INTO public.lender_rules (rule_set_id, rule_code, rule_name, rule_category, field_name, operator, threshold_value, severity, action_type, priority_order, failure_message)
SELECT rs.id, 'UPFR-BOUNCE', 'Cheque Returns', 'risk', 'returned_cheque_count', '<=', '5', 'minor', 'FAIL', 40, 'More than 5 cheque returns'
FROM lender_rule_sets rs JOIN onboarding_lenders l ON l.id = rs.lender_id WHERE l.short_code = 'UPFR';

-- =============================================
-- RULES FOR WIO BANK
-- =============================================
INSERT INTO public.lender_rules (rule_set_id, rule_code, rule_name, rule_category, field_name, operator, threshold_value, severity, action_type, priority_order, failure_message)
SELECT rs.id, 'WIO-MIN-TURN', 'Minimum Turnover', 'eligibility', 'avg_monthly_bank_credit', '>=', '50000', 'major', 'FAIL', 10, 'Monthly turnover below AED 50,000'
FROM lender_rule_sets rs JOIN onboarding_lenders l ON l.id = rs.lender_id WHERE l.short_code = 'WIO';

INSERT INTO public.lender_rules (rule_set_id, rule_code, rule_name, rule_category, field_name, operator, threshold_value, severity, action_type, priority_order, failure_message)
SELECT rs.id, 'WIO-STMT', 'Statement Coverage', 'eligibility', 'statement_months_covered', '>=', '6', 'major', 'FAIL', 20, 'Less than 6 months of statements'
FROM lender_rule_sets rs JOIN onboarding_lenders l ON l.id = rs.lender_id WHERE l.short_code = 'WIO';

INSERT INTO public.lender_rules (rule_set_id, rule_code, rule_name, rule_category, field_name, operator, threshold_value, severity, action_type, priority_order, failure_message)
SELECT rs.id, 'WIO-VAR', 'Bank-VAT Variance', 'eligibility', 'bank_vat_variance', '<=', '25', 'major', 'FAIL', 30, 'Variance exceeds 25%'
FROM lender_rule_sets rs JOIN onboarding_lenders l ON l.id = rs.lender_id WHERE l.short_code = 'WIO';

INSERT INTO public.lender_rules (rule_set_id, rule_code, rule_name, rule_category, field_name, operator, threshold_value, severity, action_type, priority_order, failure_message)
SELECT rs.id, 'WIO-BOUNCE', 'Cheque Returns', 'risk', 'returned_cheque_count', '<=', '3', 'minor', 'FAIL', 40, 'More than 3 cheque returns'
FROM lender_rule_sets rs JOIN onboarding_lenders l ON l.id = rs.lender_id WHERE l.short_code = 'WIO';

INSERT INTO public.lender_rules (rule_set_id, rule_code, rule_name, rule_category, field_name, operator, threshold_value, severity, action_type, priority_order, failure_message)
SELECT rs.id, 'WIO-NEGBAL', 'Negative Balance', 'risk', 'negative_balance_days', '<=', '10', 'minor', 'FAIL', 50, 'Excessive negative balance days'
FROM lender_rule_sets rs JOIN onboarding_lenders l ON l.id = rs.lender_id WHERE l.short_code = 'WIO';

INSERT INTO public.lender_rules (rule_set_id, rule_code, rule_name, rule_category, field_name, operator, threshold_value, severity, action_type, priority_order, failure_message)
SELECT rs.id, 'WIO-CASH', 'Cash Deposit Ratio', 'risk', 'cash_deposit_ratio', '<=', '35', 'minor', 'FAIL', 60, 'Cash deposits exceed 35%'
FROM lender_rule_sets rs JOIN onboarding_lenders l ON l.id = rs.lender_id WHERE l.short_code = 'WIO';

-- =============================================
-- RULES FOR ZELO
-- =============================================
INSERT INTO public.lender_rules (rule_set_id, rule_code, rule_name, rule_category, field_name, operator, threshold_value, severity, action_type, priority_order, failure_message)
SELECT rs.id, 'ZELO-MIN-TURN', 'Minimum Turnover', 'eligibility', 'avg_monthly_bank_credit', '>=', '50000', 'major', 'FAIL', 10, 'Monthly turnover below AED 50,000'
FROM lender_rule_sets rs JOIN onboarding_lenders l ON l.id = rs.lender_id WHERE l.short_code = 'ZELO';

INSERT INTO public.lender_rules (rule_set_id, rule_code, rule_name, rule_category, field_name, operator, threshold_value, severity, action_type, priority_order, failure_message)
SELECT rs.id, 'ZELO-STMT', 'Statement Coverage', 'eligibility', 'statement_months_covered', '>=', '3', 'major', 'FAIL', 20, 'Less than 3 months of statements'
FROM lender_rule_sets rs JOIN onboarding_lenders l ON l.id = rs.lender_id WHERE l.short_code = 'ZELO';

INSERT INTO public.lender_rules (rule_set_id, rule_code, rule_name, rule_category, field_name, operator, threshold_value, severity, action_type, priority_order, failure_message)
SELECT rs.id, 'ZELO-VINTAGE', 'Business Vintage', 'eligibility', 'business_vintage_months', '>=', '3', 'major', 'FAIL', 25, 'Business vintage less than 3 months'
FROM lender_rule_sets rs JOIN onboarding_lenders l ON l.id = rs.lender_id WHERE l.short_code = 'ZELO';

INSERT INTO public.lender_rules (rule_set_id, rule_code, rule_name, rule_category, field_name, operator, threshold_value, severity, action_type, priority_order, failure_message)
SELECT rs.id, 'ZELO-BOUNCE', 'Cheque Returns', 'risk', 'returned_cheque_count', '<=', '5', 'minor', 'FAIL', 40, 'More than 5 cheque returns'
FROM lender_rule_sets rs JOIN onboarding_lenders l ON l.id = rs.lender_id WHERE l.short_code = 'ZELO';
