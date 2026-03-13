
-- Table to store match configuration (weights and risk deductions)
CREATE TABLE public.lender_match_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_name text NOT NULL DEFAULT 'default',
  eligibility_weight numeric NOT NULL DEFAULT 40,
  rule_pass_weight numeric NOT NULL DEFAULT 20,
  limit_weight numeric NOT NULL DEFAULT 20,
  risk_weight numeric NOT NULL DEFAULT 20,
  -- Risk deduction values
  cheque_return_deduction numeric NOT NULL DEFAULT 3,
  negative_balance_deduction numeric NOT NULL DEFAULT 2,
  vat_mismatch_deduction numeric NOT NULL DEFAULT 3,
  customer_concentration_deduction numeric NOT NULL DEFAULT 2,
  -- Probability multiplier
  base_probability_factor numeric NOT NULL DEFAULT 0.9,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lender_match_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage match config" ON public.lender_match_config
  FOR ALL TO authenticated
  USING (has_admin_privileges())
  WITH CHECK (has_admin_privileges());

CREATE POLICY "Staff view match config" ON public.lender_match_config
  FOR SELECT TO authenticated
  USING (has_admin_privileges() OR is_supervisor() OR is_coordinator());

-- Table to store lender match results per case
CREATE TABLE public.lender_match_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.assessment_cases(id) ON DELETE CASCADE,
  lender_id uuid NOT NULL REFERENCES public.onboarding_lenders(id),
  product_id uuid NOT NULL REFERENCES public.lender_products(id),
  execution_result_id uuid REFERENCES public.lender_execution_results(id) ON DELETE CASCADE,
  match_score numeric NOT NULL DEFAULT 0,
  eligibility_score numeric NOT NULL DEFAULT 0,
  rule_pass_score numeric NOT NULL DEFAULT 0,
  limit_score numeric NOT NULL DEFAULT 0,
  risk_score numeric NOT NULL DEFAULT 0,
  approval_probability numeric NOT NULL DEFAULT 0,
  rank_position integer NOT NULL DEFAULT 0,
  recommended_limit numeric NOT NULL DEFAULT 0,
  recommended_tenure integer,
  decision_status text NOT NULL DEFAULT 'pending',
  lender_name text NOT NULL,
  product_name text,
  risk_flags jsonb DEFAULT '[]'::jsonb,
  recommendation_reasons jsonb DEFAULT '[]'::jsonb,
  sales_pitch text,
  is_best_match boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lender_match_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Access match results via case" ON public.lender_match_results
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM assessment_cases c
      WHERE c.id = lender_match_results.case_id
      AND (c.user_id = auth.uid() OR has_admin_privileges() OR is_supervisor() OR is_coordinator())
    )
  );

-- Insert default config
INSERT INTO public.lender_match_config (config_name) VALUES ('default');
