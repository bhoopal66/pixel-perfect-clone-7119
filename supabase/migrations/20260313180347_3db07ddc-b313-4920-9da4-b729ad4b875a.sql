
-- Fraud Detection Config (admin-configurable thresholds)
CREATE TABLE public.fraud_detection_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_name text NOT NULL DEFAULT 'default',
  cash_ratio_threshold numeric NOT NULL DEFAULT 30,
  revenue_mismatch_threshold numeric NOT NULL DEFAULT 25,
  circular_transaction_time_window integer NOT NULL DEFAULT 1,
  window_dressing_period integer NOT NULL DEFAULT 3,
  structured_transaction_count integer NOT NULL DEFAULT 5,
  rapid_outflow_hours integer NOT NULL DEFAULT 48,
  circular_deduction integer NOT NULL DEFAULT 10,
  round_tripping_deduction integer NOT NULL DEFAULT 15,
  artificial_turnover_deduction integer NOT NULL DEFAULT 15,
  cash_rotation_deduction integer NOT NULL DEFAULT 10,
  window_dressing_deduction integer NOT NULL DEFAULT 10,
  structured_txn_deduction integer NOT NULL DEFAULT 5,
  rapid_outflow_deduction integer NOT NULL DEFAULT 10,
  related_party_rotation_deduction integer NOT NULL DEFAULT 10,
  suspicious_counterparty_deduction integer NOT NULL DEFAULT 5,
  revenue_mismatch_deduction integer NOT NULL DEFAULT 10,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.fraud_detection_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage fraud config" ON public.fraud_detection_config
  FOR ALL TO authenticated
  USING (has_admin_privileges())
  WITH CHECK (has_admin_privileges());

CREATE POLICY "Staff view fraud config" ON public.fraud_detection_config
  FOR SELECT TO authenticated
  USING (has_admin_privileges() OR is_supervisor() OR is_coordinator());

-- Fraud Detection Results
CREATE TABLE public.fraud_detection_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.assessment_cases(id) ON DELETE CASCADE,
  circular_transaction_count integer DEFAULT 0,
  circular_transaction_value numeric DEFAULT 0,
  round_tripping_flag boolean DEFAULT false,
  round_tripping_count integer DEFAULT 0,
  artificial_turnover_flag boolean DEFAULT false,
  artificial_turnover_value numeric DEFAULT 0,
  cash_rotation_flag boolean DEFAULT false,
  cash_deposit_ratio numeric DEFAULT 0,
  window_dressing_flag boolean DEFAULT false,
  window_dressing_count integer DEFAULT 0,
  structured_transaction_flag boolean DEFAULT false,
  structured_transaction_count integer DEFAULT 0,
  rapid_outflow_flag boolean DEFAULT false,
  rapid_outflow_count integer DEFAULT 0,
  related_party_rotation_flag boolean DEFAULT false,
  suspicious_counterparty_flag boolean DEFAULT false,
  suspicious_counterparty_count integer DEFAULT 0,
  revenue_mismatch_flag boolean DEFAULT false,
  revenue_mismatch_percent numeric DEFAULT 0,
  fraud_risk_score integer NOT NULL DEFAULT 100,
  fraud_risk_category text NOT NULL DEFAULT 'low',
  risk_flags_json jsonb DEFAULT '[]'::jsonb,
  flagged_transactions_json jsonb DEFAULT '[]'::jsonb,
  analyst_remarks text DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.fraud_detection_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Access fraud results via case" ON public.fraud_detection_results
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM assessment_cases c
    WHERE c.id = fraud_detection_results.case_id
    AND (c.user_id = auth.uid() OR has_admin_privileges() OR is_supervisor() OR is_coordinator())
  ));

-- Insert default config
INSERT INTO public.fraud_detection_config (config_name) VALUES ('default');
