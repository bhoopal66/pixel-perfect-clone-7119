
-- COMFI Policy Evaluations table
CREATE TABLE public.comfi_policy_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  applicant_name text NOT NULL,
  company_name text NOT NULL,
  nationality text NOT NULL DEFAULT '',
  industry text NOT NULL DEFAULT '',
  gross_turnover numeric NOT NULL DEFAULT 0,
  vat_component numeric NOT NULL DEFAULT 0,
  adjusted_turnover numeric NOT NULL DEFAULT 0,
  average_sales numeric NOT NULL DEFAULT 0,
  current_payments numeric NOT NULL DEFAULT 0,
  outward_cheque_returns integer NOT NULL DEFAULT 0,
  existing_monthly_obligations numeric NOT NULL DEFAULT 0,
  eligible_sales numeric NOT NULL DEFAULT 0,
  eligible_finance numeric NOT NULL DEFAULT 0,
  application_status text NOT NULL DEFAULT 'Pending',
  reject_reason text,
  final_recommendation text,
  rule_log_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  analyst_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.comfi_policy_evaluations ENABLE ROW LEVEL SECURITY;

-- Policy: authenticated users can manage their own evaluations, staff can see all
CREATE POLICY "Users manage own comfi evaluations"
  ON public.comfi_policy_evaluations
  FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid()
    OR has_admin_privileges()
    OR is_supervisor()
    OR is_coordinator()
  )
  WITH CHECK (
    user_id = auth.uid()
    OR has_admin_privileges()
    OR is_supervisor()
    OR is_coordinator()
  );
