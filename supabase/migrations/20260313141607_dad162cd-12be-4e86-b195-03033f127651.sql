
-- Related Party Register
CREATE TABLE public.case_related_parties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID NOT NULL REFERENCES public.assessment_cases(id) ON DELETE CASCADE,
  entity_name TEXT NOT NULL,
  entity_type TEXT NOT NULL DEFAULT 'sister_concern',
  trade_license_no TEXT,
  relationship_description TEXT,
  shareholder_link TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  added_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.case_related_parties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Access related parties via case" ON public.case_related_parties
FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM assessment_cases c
  WHERE c.id = case_related_parties.case_id
  AND (c.user_id = auth.uid() OR has_admin_privileges() OR is_supervisor() OR is_coordinator())
));

-- Related Party Transactions (detected matches)
CREATE TABLE public.related_party_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID NOT NULL REFERENCES public.assessment_cases(id) ON DELETE CASCADE,
  related_party_id UUID NOT NULL REFERENCES public.case_related_parties(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES public.assessment_bank_transactions(id),
  txn_date DATE,
  description TEXT,
  debit NUMERIC DEFAULT 0,
  credit NUMERIC DEFAULT 0,
  bank_name TEXT,
  account_number TEXT,
  match_method TEXT DEFAULT 'name_match',
  match_confidence NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.related_party_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Access related party txns via case" ON public.related_party_transactions
FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM assessment_cases c
  WHERE c.id = related_party_transactions.case_id
  AND (c.user_id = auth.uid() OR has_admin_privileges() OR is_supervisor() OR is_coordinator())
));

-- Related Party Flow Summary
CREATE TABLE public.related_party_flow_summary (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID NOT NULL REFERENCES public.assessment_cases(id) ON DELETE CASCADE,
  total_related_inflows NUMERIC DEFAULT 0,
  total_related_outflows NUMERIC DEFAULT 0,
  total_bank_credits NUMERIC DEFAULT 0,
  total_bank_debits NUMERIC DEFAULT 0,
  inflow_ratio NUMERIC DEFAULT 0,
  outflow_ratio NUMERIC DEFAULT 0,
  overall_ratio NUMERIC DEFAULT 0,
  risk_level TEXT DEFAULT 'low',
  parties_detected INTEGER DEFAULT 0,
  transactions_matched INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(case_id)
);

ALTER TABLE public.related_party_flow_summary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Access related party summary via case" ON public.related_party_flow_summary
FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM assessment_cases c
  WHERE c.id = related_party_flow_summary.case_id
  AND (c.user_id = auth.uid() OR has_admin_privileges() OR is_supervisor() OR is_coordinator())
));
