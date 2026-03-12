
-- Add description to existing lenders table
ALTER TABLE public.onboarding_lenders ADD COLUMN IF NOT EXISTS description text;

-- 1. Lender Products
CREATE TABLE IF NOT EXISTS public.lender_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lender_id uuid NOT NULL REFERENCES public.onboarding_lenders(id) ON DELETE CASCADE,
  product_code text NOT NULL,
  product_name text NOT NULL,
  product_type text NOT NULL DEFAULT 'business_loan',
  is_active boolean NOT NULL DEFAULT true,
  min_limit numeric DEFAULT 0,
  max_limit numeric,
  min_tenure integer DEFAULT 1,
  max_tenure integer DEFAULT 60,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(lender_id, product_code)
);

-- 2. Rule Sets (versioned)
CREATE TABLE IF NOT EXISTS public.lender_rule_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lender_id uuid NOT NULL REFERENCES public.onboarding_lenders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.lender_products(id) ON DELETE CASCADE,
  rule_set_name text NOT NULL,
  version_no integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT false,
  effective_from date,
  effective_to date,
  remarks text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Rules
CREATE TABLE IF NOT EXISTS public.lender_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_set_id uuid NOT NULL REFERENCES public.lender_rule_sets(id) ON DELETE CASCADE,
  rule_code text NOT NULL,
  rule_name text NOT NULL,
  rule_category text NOT NULL DEFAULT 'eligibility',
  field_name text NOT NULL,
  operator text NOT NULL DEFAULT '>=',
  threshold_type text NOT NULL DEFAULT 'static',
  threshold_value text,
  threshold_value_secondary text,
  action_type text NOT NULL DEFAULT 'FAIL',
  action_value text,
  priority_order integer NOT NULL DEFAULT 100,
  severity text NOT NULL DEFAULT 'minor',
  failure_message text,
  review_message text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Formula Configs
CREATE TABLE IF NOT EXISTS public.lender_formula_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_set_id uuid NOT NULL REFERENCES public.lender_rule_sets(id) ON DELETE CASCADE,
  formula_name text NOT NULL,
  formula_type text NOT NULL DEFAULT 'limit',
  base_field text NOT NULL,
  multiplier numeric DEFAULT 1,
  cap_value numeric,
  floor_value numeric DEFAULT 0,
  formula_expression text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Decision Matrix
CREATE TABLE IF NOT EXISTS public.lender_decision_matrix (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_set_id uuid NOT NULL REFERENCES public.lender_rule_sets(id) ON DELETE CASCADE,
  min_major_failures integer NOT NULL DEFAULT 0,
  max_major_failures integer NOT NULL DEFAULT 0,
  min_minor_failures integer NOT NULL DEFAULT 0,
  max_minor_failures integer NOT NULL DEFAULT 0,
  decision_status text NOT NULL DEFAULT 'eligible',
  score_from numeric,
  score_to numeric,
  remarks text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 6. Policy Audit Log
CREATE TABLE IF NOT EXISTS public.lender_policy_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lender_id uuid REFERENCES public.onboarding_lenders(id),
  product_id uuid REFERENCES public.lender_products(id),
  rule_set_id uuid REFERENCES public.lender_rule_sets(id),
  action_done text NOT NULL,
  old_value jsonb,
  new_value jsonb,
  changed_by uuid,
  changed_at timestamptz NOT NULL DEFAULT now(),
  change_reason text
);

-- 7. Execution Results
CREATE TABLE IF NOT EXISTS public.lender_execution_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.assessment_cases(id) ON DELETE CASCADE,
  lender_id uuid NOT NULL REFERENCES public.onboarding_lenders(id),
  product_id uuid NOT NULL REFERENCES public.lender_products(id),
  rule_set_id uuid NOT NULL REFERENCES public.lender_rule_sets(id),
  eligibility_status text NOT NULL DEFAULT 'pending',
  recommended_limit numeric DEFAULT 0,
  recommended_tenure integer,
  score numeric DEFAULT 0,
  major_fail_count integer DEFAULT 0,
  minor_fail_count integer DEFAULT 0,
  risk_flags jsonb DEFAULT '[]'::jsonb,
  failed_rules jsonb DEFAULT '[]'::jsonb,
  decision_summary text,
  executed_at timestamptz NOT NULL DEFAULT now(),
  executed_by uuid
);

-- 8. Rule Result Details
CREATE TABLE IF NOT EXISTS public.lender_rule_result_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id uuid NOT NULL REFERENCES public.lender_execution_results(id) ON DELETE CASCADE,
  rule_id uuid REFERENCES public.lender_rules(id),
  rule_code text,
  field_name text,
  observed_value text,
  operator text,
  threshold_value text,
  pass_fail_status text NOT NULL DEFAULT 'pending',
  impact_type text,
  impact_value text,
  message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lender_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lender_rule_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lender_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lender_formula_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lender_decision_matrix ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lender_policy_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lender_execution_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lender_rule_result_details ENABLE ROW LEVEL SECURITY;

-- Products RLS
CREATE POLICY "Admins manage products" ON public.lender_products FOR ALL TO authenticated USING (has_admin_privileges()) WITH CHECK (has_admin_privileges());
CREATE POLICY "Staff view products" ON public.lender_products FOR SELECT TO authenticated USING (has_admin_privileges() OR is_supervisor() OR is_coordinator());

-- Rule Sets RLS
CREATE POLICY "Admins manage rule sets" ON public.lender_rule_sets FOR ALL TO authenticated USING (has_admin_privileges()) WITH CHECK (has_admin_privileges());
CREATE POLICY "Staff view rule sets" ON public.lender_rule_sets FOR SELECT TO authenticated USING (has_admin_privileges() OR is_supervisor() OR is_coordinator());

-- Rules RLS
CREATE POLICY "Admins manage rules" ON public.lender_rules FOR ALL TO authenticated USING (has_admin_privileges()) WITH CHECK (has_admin_privileges());
CREATE POLICY "Staff view rules" ON public.lender_rules FOR SELECT TO authenticated USING (has_admin_privileges() OR is_supervisor() OR is_coordinator());

-- Formula RLS
CREATE POLICY "Admins manage formulas" ON public.lender_formula_configs FOR ALL TO authenticated USING (has_admin_privileges()) WITH CHECK (has_admin_privileges());
CREATE POLICY "Staff view formulas" ON public.lender_formula_configs FOR SELECT TO authenticated USING (has_admin_privileges() OR is_supervisor() OR is_coordinator());

-- Decision Matrix RLS
CREATE POLICY "Admins manage decisions" ON public.lender_decision_matrix FOR ALL TO authenticated USING (has_admin_privileges()) WITH CHECK (has_admin_privileges());
CREATE POLICY "Staff view decisions" ON public.lender_decision_matrix FOR SELECT TO authenticated USING (has_admin_privileges() OR is_supervisor() OR is_coordinator());

-- Audit Log RLS
CREATE POLICY "Staff view audit" ON public.lender_policy_audit_log FOR SELECT TO authenticated USING (has_admin_privileges() OR is_supervisor());
CREATE POLICY "Admins insert audit" ON public.lender_policy_audit_log FOR INSERT TO authenticated WITH CHECK (has_admin_privileges());

-- Execution Results RLS
CREATE POLICY "Access results via case" ON public.lender_execution_results FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM assessment_cases c WHERE c.id = lender_execution_results.case_id AND (c.user_id = auth.uid() OR has_admin_privileges() OR is_supervisor() OR is_coordinator())));

-- Result Details RLS
CREATE POLICY "Access details via execution" ON public.lender_rule_result_details FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM lender_execution_results e JOIN assessment_cases c ON c.id = e.case_id WHERE e.id = lender_rule_result_details.execution_id AND (c.user_id = auth.uid() OR has_admin_privileges() OR is_supervisor() OR is_coordinator())));
