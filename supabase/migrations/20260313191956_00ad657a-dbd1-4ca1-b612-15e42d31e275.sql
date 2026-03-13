
-- V7-M01: Remove duplicate FK constraint on related_party_transactions.related_party_id
-- Two constraints exist: related_party_transactions_party_id_fkey AND related_party_transactions_related_party_id_fkey
-- Keep the properly named one, drop the redundant one
ALTER TABLE public.related_party_transactions DROP CONSTRAINT IF EXISTS related_party_transactions_party_id_fkey;

-- V7-M02: Add ON DELETE SET NULL to lender_execution_results FK refs
-- These lack ON DELETE action, which blocks lender/product/rule_set deletion
ALTER TABLE public.lender_execution_results DROP CONSTRAINT lender_execution_results_lender_id_fkey;
ALTER TABLE public.lender_execution_results ADD CONSTRAINT lender_execution_results_lender_id_fkey 
  FOREIGN KEY (lender_id) REFERENCES onboarding_lenders(id) ON DELETE CASCADE;

ALTER TABLE public.lender_execution_results DROP CONSTRAINT lender_execution_results_product_id_fkey;
ALTER TABLE public.lender_execution_results ADD CONSTRAINT lender_execution_results_product_id_fkey 
  FOREIGN KEY (product_id) REFERENCES lender_products(id) ON DELETE CASCADE;

ALTER TABLE public.lender_execution_results DROP CONSTRAINT lender_execution_results_rule_set_id_fkey;
ALTER TABLE public.lender_execution_results ADD CONSTRAINT lender_execution_results_rule_set_id_fkey 
  FOREIGN KEY (rule_set_id) REFERENCES lender_rule_sets(id) ON DELETE SET NULL;

-- V7-M03: Add ON DELETE SET NULL to lender_policy_audit_log FK refs
ALTER TABLE public.lender_policy_audit_log DROP CONSTRAINT lender_policy_audit_log_lender_id_fkey;
ALTER TABLE public.lender_policy_audit_log ADD CONSTRAINT lender_policy_audit_log_lender_id_fkey 
  FOREIGN KEY (lender_id) REFERENCES onboarding_lenders(id) ON DELETE SET NULL;

ALTER TABLE public.lender_policy_audit_log DROP CONSTRAINT lender_policy_audit_log_product_id_fkey;
ALTER TABLE public.lender_policy_audit_log ADD CONSTRAINT lender_policy_audit_log_product_id_fkey 
  FOREIGN KEY (product_id) REFERENCES lender_products(id) ON DELETE SET NULL;

ALTER TABLE public.lender_policy_audit_log DROP CONSTRAINT lender_policy_audit_log_rule_set_id_fkey;
ALTER TABLE public.lender_policy_audit_log ADD CONSTRAINT lender_policy_audit_log_rule_set_id_fkey 
  FOREIGN KEY (rule_set_id) REFERENCES lender_rule_sets(id) ON DELETE SET NULL;

-- V7-L01: Add missing indexes for lender_match_results lookups
CREATE INDEX IF NOT EXISTS idx_lender_match_results_case_id ON public.lender_match_results(case_id);
CREATE INDEX IF NOT EXISTS idx_ai_credit_decision_results_case_id ON public.ai_credit_decision_results(case_id);
CREATE INDEX IF NOT EXISTS idx_case_activity_log_case_id ON public.case_activity_log(case_id);
CREATE INDEX IF NOT EXISTS idx_related_party_transactions_case_id ON public.related_party_transactions(case_id);
CREATE INDEX IF NOT EXISTS idx_related_party_flow_summary_case_id ON public.related_party_flow_summary(case_id);
CREATE INDEX IF NOT EXISTS idx_assessment_analyst_adjustments_case_id ON public.assessment_analyst_adjustments(case_id);
