
-- =====================================================
-- COMFI Policy Engine: Production Tables
-- Scalable for future lender product rule engines
-- =====================================================

-- 1. Policy Evaluations (main evaluations table)
CREATE TABLE public.policy_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid REFERENCES public.assessment_cases(id) ON DELETE SET NULL,
  product_code text NOT NULL DEFAULT 'COMFI',
  policy_name text NOT NULL DEFAULT 'COMFI Policy',
  applicant_name text NOT NULL,
  company_name text NOT NULL,
  nationality text,
  industry text,
  gross_turnover numeric NOT NULL DEFAULT 0,
  vat_component numeric NOT NULL DEFAULT 0,
  turnover_already_excludes_vat boolean NOT NULL DEFAULT false,
  adjusted_turnover numeric NOT NULL DEFAULT 0,
  average_sales numeric NOT NULL DEFAULT 0,
  current_payments numeric NOT NULL DEFAULT 0,
  existing_monthly_obligations numeric DEFAULT 0,
  outward_cheque_returns integer NOT NULL DEFAULT 0,
  eligible_sales numeric NOT NULL DEFAULT 0,
  eligible_finance numeric NOT NULL DEFAULT 0,
  application_status text NOT NULL DEFAULT 'Pending',
  final_recommendation text,
  reject_reason text,
  engine_version text DEFAULT '1.0',
  engine_status text DEFAULT 'pending',
  override_status text,
  override_reason text,
  overridden_by uuid,
  overridden_at timestamptz,
  analyst_notes text,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_policy_evaluations_case_id ON public.policy_evaluations(case_id);
CREATE INDEX idx_policy_evaluations_product_code ON public.policy_evaluations(product_code);
CREATE INDEX idx_policy_evaluations_status ON public.policy_evaluations(application_status);
CREATE INDEX idx_policy_evaluations_created_at ON public.policy_evaluations(created_at DESC);

-- RLS
ALTER TABLE public.policy_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage policy evaluations"
  ON public.policy_evaluations FOR ALL TO authenticated
  USING (has_admin_privileges() OR is_supervisor() OR is_coordinator() OR created_by = auth.uid())
  WITH CHECK (has_admin_privileges() OR is_supervisor() OR is_coordinator() OR created_by = auth.uid());

-- 2. Policy Evaluation Rule Logs
CREATE TABLE public.policy_evaluation_rule_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id uuid NOT NULL REFERENCES public.policy_evaluations(id) ON DELETE CASCADE,
  rule_code text NOT NULL,
  rule_name text NOT NULL,
  sequence_no integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'Pending',
  message text,
  input_value_json jsonb,
  output_value_json jsonb,
  threshold_json jsonb,
  is_hard_decline boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_rule_logs_evaluation_id ON public.policy_evaluation_rule_logs(evaluation_id);

ALTER TABLE public.policy_evaluation_rule_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Access rule logs via evaluation"
  ON public.policy_evaluation_rule_logs FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.policy_evaluations e
    WHERE e.id = policy_evaluation_rule_logs.evaluation_id
    AND (e.created_by = auth.uid() OR has_admin_privileges() OR is_supervisor() OR is_coordinator())
  ));

-- 3. Policy Evaluation Audit Logs
CREATE TABLE public.policy_evaluation_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id uuid NOT NULL REFERENCES public.policy_evaluations(id) ON DELETE CASCADE,
  case_id uuid,
  action_type text NOT NULL,
  action_label text,
  old_value_json jsonb,
  new_value_json jsonb,
  action_by uuid,
  action_at timestamptz NOT NULL DEFAULT now(),
  remarks text
);

CREATE INDEX idx_audit_logs_evaluation_id ON public.policy_evaluation_audit_logs(evaluation_id);
CREATE INDEX idx_audit_logs_case_id ON public.policy_evaluation_audit_logs(case_id);

ALTER TABLE public.policy_evaluation_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Access audit logs via evaluation"
  ON public.policy_evaluation_audit_logs FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.policy_evaluations e
    WHERE e.id = policy_evaluation_audit_logs.evaluation_id
    AND (e.created_by = auth.uid() OR has_admin_privileges() OR is_supervisor() OR is_coordinator())
  ));
