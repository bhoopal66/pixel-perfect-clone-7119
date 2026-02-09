-- ============================================================
-- LENDERS TABLE (Configurable Multi-Lender Support)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.onboarding_lenders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  short_code TEXT NOT NULL UNIQUE,
  lender_type lender_type NOT NULL DEFAULT 'bank',
  is_active BOOLEAN NOT NULL DEFAULT true,
  logo_url TEXT,
  
  -- Configurable Eligibility Rules (JSON for flexibility)
  eligibility_rules JSONB NOT NULL DEFAULT '{
    "max_multiplier": 8,
    "reduced_multiplier": 1.33,
    "pos_cap_percent": 0.40,
    "abcd_fee_percent": 0.01,
    "variance_thresholds": {
      "eligible": 10,
      "reduced": 25
    },
    "min_turnover": 0,
    "max_loan_amount": null,
    "min_loan_amount": 50000
  }'::jsonb,
  
  -- Document Requirements per lender
  document_requirements JSONB NOT NULL DEFAULT '{
    "mandatory": ["trade_license", "owner_passport", "bank_statements"],
    "conditional": {
      "vat_registered": ["vat_certificate"],
      "pos_machine": ["pos_statements"]
    },
    "optional": ["moa_aoa", "tenancy_contract", "audited_financials"]
  }'::jsonb,
  
  -- Contact Info
  contact_email TEXT,
  contact_phone TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- LENDER WORKFLOWS TABLE
CREATE TABLE IF NOT EXISTS public.onboarding_lender_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lender_id UUID NOT NULL REFERENCES public.onboarding_lenders(id) ON DELETE CASCADE,
  
  -- Ordered stages with SLA and requirements
  stages JSONB NOT NULL DEFAULT '[
    {"stage": "email_sent", "order": 1, "sla_days": 1, "required_docs": []},
    {"stage": "ro_assigned", "order": 2, "sla_days": 2, "required_docs": []},
    {"stage": "link_shared", "order": 3, "sla_days": 1, "required_docs": []},
    {"stage": "link_completed", "order": 4, "sla_days": 3, "required_docs": ["bank_statements"]},
    {"stage": "video_verification", "order": 5, "sla_days": 2, "required_docs": ["owner_passport"]},
    {"stage": "signature_submitted", "order": 6, "sla_days": 2, "required_docs": []},
    {"stage": "ro_confirmation", "order": 7, "sla_days": 3, "required_docs": []}
  ]'::jsonb,
  
  -- Status mappings
  status_mappings JSONB NOT NULL DEFAULT '{
    "pending_stages": ["email_sent", "ro_assigned", "link_shared"],
    "active_stages": ["link_completed", "video_verification", "signature_submitted"],
    "final_stages": ["ro_confirmation", "account_opened"]
  }'::jsonb,
  
  -- Include account_opened stage (for account products)
  include_account_opened BOOLEAN NOT NULL DEFAULT false,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(lender_id)
);

-- Enable RLS
ALTER TABLE public.onboarding_lenders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_lender_workflows ENABLE ROW LEVEL SECURITY;

-- Lenders: Everyone can view active lenders, only admins can modify
CREATE POLICY "Anyone can view active lenders"
ON public.onboarding_lenders
FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "Admins can manage lenders"
ON public.onboarding_lenders
FOR ALL
TO authenticated
USING (public.has_admin_privileges())
WITH CHECK (public.has_admin_privileges());

-- Lender Workflows: Same as lenders
CREATE POLICY "Staff can view workflows"
ON public.onboarding_lender_workflows
FOR SELECT
TO authenticated
USING (
  public.has_admin_privileges()
  OR public.is_supervisor()
  OR public.is_coordinator()
);

CREATE POLICY "Admins can manage workflows"
ON public.onboarding_lender_workflows
FOR ALL
TO authenticated
USING (public.has_admin_privileges())
WITH CHECK (public.has_admin_privileges());

-- Add foreign key to case_lender_applications and eligibility
ALTER TABLE public.case_lender_applications
DROP CONSTRAINT IF EXISTS case_lender_applications_lender_id_fkey;

ALTER TABLE public.case_lender_applications
ADD CONSTRAINT case_lender_applications_lender_id_fkey
FOREIGN KEY (lender_id) REFERENCES public.onboarding_lenders(id);

ALTER TABLE public.onboarding_eligibility
ADD CONSTRAINT onboarding_eligibility_lender_id_fkey
FOREIGN KEY (lender_id) REFERENCES public.onboarding_lenders(id);

-- Timestamps trigger
CREATE TRIGGER trg_onboarding_lenders_updated_at
  BEFORE UPDATE ON public.onboarding_lenders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_onboarding_lender_workflows_updated_at
  BEFORE UPDATE ON public.onboarding_lender_workflows
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- SEED DEFAULT LENDERS
-- ============================================================

INSERT INTO public.onboarding_lenders (name, short_code, lender_type, eligibility_rules) VALUES
('RAK Bank', 'RAK', 'bank', '{
  "max_multiplier": 8,
  "reduced_multiplier": 1.33,
  "pos_cap_percent": 0.40,
  "abcd_fee_percent": 0.01,
  "variance_thresholds": {"eligible": 10, "reduced": 25},
  "min_turnover": 100000,
  "product_types": ["term_loan", "pos_finance"]
}'::jsonb),
('Wio Bank', 'WIO', 'fintech', '{
  "max_multiplier": 8,
  "reduced_multiplier": 1.33,
  "pos_cap_percent": 0.30,
  "abcd_fee_percent": 0.01,
  "variance_thresholds": {"eligible": 10, "reduced": 25},
  "min_turnover": 50000,
  "product_types": ["term_loan", "pos_finance", "working_capital"]
}'::jsonb),
('Emirates NBD', 'ENBD', 'bank', '{
  "max_multiplier": 8,
  "reduced_multiplier": 1.33,
  "pos_cap_percent": 0.35,
  "abcd_fee_percent": 0.01,
  "variance_thresholds": {"eligible": 10, "reduced": 25},
  "min_turnover": 150000,
  "product_types": ["term_loan", "overdraft", "working_capital"]
}'::jsonb)
ON CONFLICT (short_code) DO NOTHING;

-- Create default workflows for seeded lenders
INSERT INTO public.onboarding_lender_workflows (lender_id, stages)
SELECT id, '[
  {"stage": "email_sent", "order": 1, "sla_days": 1},
  {"stage": "ro_assigned", "order": 2, "sla_days": 2},
  {"stage": "link_shared", "order": 3, "sla_days": 1},
  {"stage": "link_completed", "order": 4, "sla_days": 3},
  {"stage": "video_verification", "order": 5, "sla_days": 2},
  {"stage": "signature_submitted", "order": 6, "sla_days": 2},
  {"stage": "ro_confirmation", "order": 7, "sla_days": 3}
]'::jsonb
FROM public.onboarding_lenders
ON CONFLICT (lender_id) DO NOTHING;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_onboarding_lenders_active ON public.onboarding_lenders(is_active);
CREATE INDEX IF NOT EXISTS idx_onboarding_lenders_short_code ON public.onboarding_lenders(short_code);