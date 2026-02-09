-- ================================================
-- SCHEMA ALIGNMENT MIGRATION
-- Match JSON specification for Business Loan Onboarding
-- ================================================

-- 1. Add missing columns to onboarding_cases
ALTER TABLE public.onboarding_cases 
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS remarks text;

-- 2. Add workflow_name to onboarding_lender_workflows  
ALTER TABLE public.onboarding_lender_workflows
ADD COLUMN IF NOT EXISTS workflow_name text DEFAULT 'Default Loan Submission',
ADD COLUMN IF NOT EXISTS required_docs_by_stage jsonb DEFAULT '{}'::jsonb;

-- 3. Add workflow_id to case_lender_applications for tracking which workflow is used
ALTER TABLE public.case_lender_applications
ADD COLUMN IF NOT EXISTS workflow_id uuid REFERENCES public.onboarding_lender_workflows(id) ON DELETE SET NULL;

-- 4. Add pos_variant to onboarding_lenders eligibility_rules (update default)
-- This is handled via JSONB, no schema change needed

-- 5. Rename columns in financial_inputs for clarity (if not already matching)
-- monthly_avg_turnover already exists, just ensure annual calculations are clear

-- 6. Add computed_at alias column to onboarding_eligibility (already have calculated_at, add alias view or ensure naming)

-- 7. Add eligibility_amount_aed as alias (we have eligible_loan_amount)

-- 8. Ensure onboarding_stage_history has all required fields
-- Already has: case_id, changed_at, changed_by, field_changed, old_value, new_value, change_reason

-- 9. Add base_multiplier to onboarding_eligibility if not exists  
ALTER TABLE public.onboarding_eligibility
ADD COLUMN IF NOT EXISTS base_multiplier numeric DEFAULT 8;

-- 10. Update onboarding_documents to match doc_type enum style
-- Current: document_type text - matches spec's doc_type

-- 11. Add mobile_number consistency - business_owners.mobile matches spec's mobile_number

-- 12. Update lender workflows with required_docs_by_stage examples
UPDATE public.onboarding_lender_workflows
SET required_docs_by_stage = '{
  "link_completed": ["trade_license", "owner_passport", "bank_statements"],
  "video_verification": ["owner_passport"],
  "signature_submitted": [],
  "ro_confirmation": ["moa_aoa", "tenancy_contract"]
}'::jsonb
WHERE required_docs_by_stage = '{}'::jsonb;

-- 13. Add pos_variant to lender eligibility_rules for RAK and WIO
UPDATE public.onboarding_lenders
SET eligibility_rules = eligibility_rules || '{"pos_variant": "RAK_POS", "eligibility_min_of": ["POS_100", "POS_PERCENT_ADJ_TURNOVER", "POS_PERCENT_VAT_TURNOVER"]}'::jsonb
WHERE short_code = 'RAK';

UPDATE public.onboarding_lenders
SET eligibility_rules = eligibility_rules || '{"pos_variant": "WIO_POS", "eligibility_min_of": ["POS_100", "POS_PERCENT_ADJ_TURNOVER", "POS_PERCENT_VAT_TURNOVER"]}'::jsonb
WHERE short_code = 'WIO';

UPDATE public.onboarding_lenders
SET eligibility_rules = eligibility_rules || '{"pos_variant": "STANDARD", "eligibility_min_of": ["POS_100", "POS_PERCENT_ADJ_TURNOVER", "POS_PERCENT_VAT_TURNOVER"]}'::jsonb
WHERE short_code = 'ENBD';

-- 14. Create index for faster tag searches
CREATE INDEX IF NOT EXISTS idx_onboarding_cases_tags ON public.onboarding_cases USING GIN(tags);

-- 15. Create index for faster workflow lookups
CREATE INDEX IF NOT EXISTS idx_case_lender_applications_workflow ON public.case_lender_applications(workflow_id);

-- 16. Add trigger to auto-set workflow_id from lender when creating case_lender_application
CREATE OR REPLACE FUNCTION public.set_default_workflow()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.workflow_id IS NULL THEN
    SELECT id INTO NEW.workflow_id
    FROM public.onboarding_lender_workflows
    WHERE lender_id = NEW.lender_id
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_default_workflow_trigger ON public.case_lender_applications;
CREATE TRIGGER set_default_workflow_trigger
BEFORE INSERT ON public.case_lender_applications
FOR EACH ROW
EXECUTE FUNCTION public.set_default_workflow();