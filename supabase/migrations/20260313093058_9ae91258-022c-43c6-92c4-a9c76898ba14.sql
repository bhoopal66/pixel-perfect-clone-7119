
-- =============================================
-- DECISION MATRICES FOR ALL LENDERS
-- =============================================

-- Helper: For each rule set, create 3 decision matrix entries (eligible, conditional, not_eligible)
-- Using a DO block for cleanliness

DO $$
DECLARE
  rs_record RECORD;
BEGIN
  FOR rs_record IN 
    SELECT rs.id as rule_set_id, l.short_code
    FROM lender_rule_sets rs 
    JOIN onboarding_lenders l ON l.id = rs.lender_id 
    WHERE l.short_code != 'HFS'
  LOOP
    -- Eligible: 0 major, up to 2 minor
    INSERT INTO public.lender_decision_matrix (rule_set_id, min_major_failures, max_major_failures, min_minor_failures, max_minor_failures, decision_status, remarks)
    VALUES (rs_record.rule_set_id, 0, 0, 0, 2, 'eligible', 'All major criteria met');
    
    -- Conditionally eligible: 1 major, up to 3 minor
    INSERT INTO public.lender_decision_matrix (rule_set_id, min_major_failures, max_major_failures, min_minor_failures, max_minor_failures, decision_status, remarks)
    VALUES (rs_record.rule_set_id, 1, 1, 0, 3, 'conditionally_eligible', 'One major criterion requires deviation');
    
    -- Review required: 0-1 major with many minor
    INSERT INTO public.lender_decision_matrix (rule_set_id, min_major_failures, max_major_failures, min_minor_failures, max_minor_failures, decision_status, remarks)
    VALUES (rs_record.rule_set_id, 0, 1, 3, 10, 'review_required', 'Multiple minor failures require manual review');
    
    -- Not eligible: 2+ major failures
    INSERT INTO public.lender_decision_matrix (rule_set_id, min_major_failures, max_major_failures, min_minor_failures, max_minor_failures, decision_status, remarks)
    VALUES (rs_record.rule_set_id, 2, 10, 0, 10, 'not_eligible', 'Multiple major criteria not met');
  END LOOP;
END $$;

-- =============================================
-- LIMIT FORMULAS FOR ALL LENDERS
-- =============================================

-- RAK Bank Term Loan: 8x adjusted monthly turnover
INSERT INTO public.lender_formula_configs (rule_set_id, formula_name, formula_type, base_field, multiplier, cap_value, floor_value, is_active)
SELECT rs.id, 'RAK 8x Turnover', 'limit', 'adjusted_monthly_turnover', 8, null, 100000, true
FROM lender_rule_sets rs JOIN onboarding_lenders l ON l.id = rs.lender_id WHERE l.short_code = 'RAK' AND rs.rule_set_name LIKE '%Term Loan%';

-- RAK Bank POS: 8x with POS cap
INSERT INTO public.lender_formula_configs (rule_set_id, formula_name, formula_type, base_field, multiplier, cap_value, floor_value, is_active)
SELECT rs.id, 'RAK POS 8x', 'limit', 'pos_monthly_settlement', 8, null, 50000, true
FROM lender_rule_sets rs JOIN onboarding_lenders l ON l.id = rs.lender_id WHERE l.short_code = 'RAK' AND rs.rule_set_name LIKE '%POS%';

-- Emirates NBD: 8x turnover
INSERT INTO public.lender_formula_configs (rule_set_id, formula_name, formula_type, base_field, multiplier, cap_value, floor_value, is_active)
SELECT rs.id, 'ENBD 8x Turnover', 'limit', 'adjusted_monthly_turnover', 8, null, 150000, true
FROM lender_rule_sets rs JOIN onboarding_lenders l ON l.id = rs.lender_id WHERE l.short_code = 'ENBD';

-- NBF: 8x turnover
INSERT INTO public.lender_formula_configs (rule_set_id, formula_name, formula_type, base_field, multiplier, cap_value, floor_value, is_active)
SELECT rs.id, 'NBF 8x Turnover', 'limit', 'adjusted_monthly_turnover', 8, null, 100000, true
FROM lender_rule_sets rs JOIN onboarding_lenders l ON l.id = rs.lender_id WHERE l.short_code = 'NBF';

-- CredibleX: 6x turnover, max 750k
INSERT INTO public.lender_formula_configs (rule_set_id, formula_name, formula_type, base_field, multiplier, cap_value, floor_value, is_active)
SELECT rs.id, 'CredibleX 6x Turnover', 'limit', 'avg_monthly_bank_credit', 6, 750000, 50000, true
FROM lender_rule_sets rs JOIN onboarding_lenders l ON l.id = rs.lender_id WHERE l.short_code = 'CREDX';

-- Comfi: 5x turnover, max 400k
INSERT INTO public.lender_formula_configs (rule_set_id, formula_name, formula_type, base_field, multiplier, cap_value, floor_value, is_active)
SELECT rs.id, 'Comfi 5x Turnover', 'limit', 'avg_monthly_bank_credit', 5, 400000, 25000, true
FROM lender_rule_sets rs JOIN onboarding_lenders l ON l.id = rs.lender_id WHERE l.short_code = 'COMFI';

-- Flapcap: 6x turnover, max 500k
INSERT INTO public.lender_formula_configs (rule_set_id, formula_name, formula_type, base_field, multiplier, cap_value, floor_value, is_active)
SELECT rs.id, 'Flapcap 6x Turnover', 'limit', 'avg_monthly_bank_credit', 6, 500000, 30000, true
FROM lender_rule_sets rs JOIN onboarding_lenders l ON l.id = rs.lender_id WHERE l.short_code = 'FLAP';

-- Flow48: 5x turnover, max 300k
INSERT INTO public.lender_formula_configs (rule_set_id, formula_name, formula_type, base_field, multiplier, cap_value, floor_value, is_active)
SELECT rs.id, 'Flow48 5x Turnover', 'limit', 'avg_monthly_bank_credit', 5, 300000, 25000, true
FROM lender_rule_sets rs JOIN onboarding_lenders l ON l.id = rs.lender_id WHERE l.short_code = 'FL48';

-- Funding Souq: 8x turnover, max 2M
INSERT INTO public.lender_formula_configs (rule_set_id, formula_name, formula_type, base_field, multiplier, cap_value, floor_value, is_active)
SELECT rs.id, 'Funding Souq 8x Turnover', 'limit', 'avg_monthly_bank_credit', 8, 2000000, 100000, true
FROM lender_rule_sets rs JOIN onboarding_lenders l ON l.id = rs.lender_id WHERE l.short_code = 'FSOUQ';

-- Upfront: 4x turnover, max 250k
INSERT INTO public.lender_formula_configs (rule_set_id, formula_name, formula_type, base_field, multiplier, cap_value, floor_value, is_active)
SELECT rs.id, 'Upfront 4x Turnover', 'limit', 'avg_monthly_bank_credit', 4, 250000, 15000, true
FROM lender_rule_sets rs JOIN onboarding_lenders l ON l.id = rs.lender_id WHERE l.short_code = 'UPFR';

-- Wio: 8x turnover
INSERT INTO public.lender_formula_configs (rule_set_id, formula_name, formula_type, base_field, multiplier, cap_value, floor_value, is_active)
SELECT rs.id, 'Wio 8x Turnover', 'limit', 'adjusted_monthly_turnover', 8, null, 50000, true
FROM lender_rule_sets rs JOIN onboarding_lenders l ON l.id = rs.lender_id WHERE l.short_code = 'WIO';

-- Zelo: 4x turnover, max 200k
INSERT INTO public.lender_formula_configs (rule_set_id, formula_name, formula_type, base_field, multiplier, cap_value, floor_value, is_active)
SELECT rs.id, 'Zelo 4x Turnover', 'limit', 'avg_monthly_bank_credit', 4, 200000, 20000, true
FROM lender_rule_sets rs JOIN onboarding_lenders l ON l.id = rs.lender_id WHERE l.short_code = 'ZELO';
