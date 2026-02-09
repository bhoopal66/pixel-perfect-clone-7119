-- ============================================================
-- BUSINESS LOAN ONBOARDING MODULE - COMPLETE SCHEMA
-- ============================================================

-- 1. ENUMS (only create if not exist)
DO $$ BEGIN
  CREATE TYPE public.case_status AS ENUM (
    'draft', 'in_process', 'additional_info_required', 'submitted_to_lender',
    'approved', 'declined', 'dropped', 'on_hold', 'closed'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.process_stage AS ENUM (
    'email_sent', 'ro_assigned', 'link_shared', 'link_completed',
    'video_verification', 'signature_submitted', 'ro_confirmation', 'account_opened'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.lender_type AS ENUM ('bank', 'fintech', 'nbfc');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.document_status AS ENUM ('pending', 'uploaded', 'verified', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.rag_status AS ENUM ('green', 'amber', 'red');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.action_required_by AS ENUM ('client', 'agent', 'bank', 'supervisor', 'none');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. ONBOARDING CASES (Main Table) - Create if not exists
CREATE TABLE IF NOT EXISTS public.onboarding_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_number TEXT UNIQUE,
  status case_status NOT NULL DEFAULT 'draft',
  process_stage process_stage,
  last_valid_process_stage process_stage,
  user_id UUID REFERENCES auth.users(id),
  agent_id UUID REFERENCES public.agents(id),
  supervisor_id UUID,
  rag_status rag_status DEFAULT 'green',
  action_required_by action_required_by DEFAULT 'client',
  days_in_current_stage INTEGER DEFAULT 0,
  stage_entered_at TIMESTAMPTZ DEFAULT now(),
  is_urgent BOOLEAN DEFAULT false,
  has_missing_docs BOOLEAN DEFAULT false,
  has_validation_errors BOOLEAN DEFAULT false,
  internal_notes TEXT,
  client_notes TEXT,
  drop_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at TIMESTAMPTZ,
  decision_at TIMESTAMPTZ
);

-- 3. APPLICANT BUSINESSES
CREATE TABLE IF NOT EXISTS public.applicant_businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.onboarding_cases(id) ON DELETE CASCADE,
  company_legal_name TEXT NOT NULL,
  trade_license_no TEXT NOT NULL,
  license_issuing_authority TEXT NOT NULL,
  tl_expiry_date DATE NOT NULL,
  business_activity TEXT NOT NULL,
  legal_structure TEXT NOT NULL,
  year_of_establishment INTEGER,
  office_address TEXT NOT NULL,
  emirate TEXT NOT NULL,
  ejari_available BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(case_id)
);

-- 4. BUSINESS OWNERS
CREATE TABLE IF NOT EXISTS public.business_owners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.onboarding_cases(id) ON DELETE CASCADE,
  owner_name TEXT NOT NULL,
  nationality TEXT NOT NULL,
  emirates_id TEXT NOT NULL,
  passport_number TEXT NOT NULL,
  shareholding_percent NUMERIC(5,2) NOT NULL CHECK (shareholding_percent >= 0 AND shareholding_percent <= 100),
  resident_status TEXT NOT NULL,
  mobile TEXT NOT NULL,
  email TEXT NOT NULL,
  display_order INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. FINANCIAL INPUTS
CREATE TABLE IF NOT EXISTS public.financial_inputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.onboarding_cases(id) ON DELETE CASCADE,
  existing_bank_accounts TEXT[] DEFAULT '{}',
  primary_operating_bank TEXT NOT NULL,
  monthly_avg_turnover NUMERIC(15,2) NOT NULL DEFAULT 0,
  declared_turnover NUMERIC(15,2) NOT NULL DEFAULT 0,
  vat_registered BOOLEAN,
  annual_vat_turnover NUMERIC(15,2),
  pos_machine BOOLEAN,
  pos_monthly_turnover NUMERIC(15,2),
  cash_adjustment NUMERIC(15,2) DEFAULT 0,
  sister_concern_adjustment NUMERIC(15,2) DEFAULT 0,
  cash_intensive BOOLEAN DEFAULT false,
  sister_concern_exists BOOLEAN DEFAULT false,
  adjusted_turnover NUMERIC(15,2) DEFAULT 0,
  pos_annual_turnover NUMERIC(15,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(case_id)
);

-- 6. CASE DOCUMENTS (using document_status type)
CREATE TABLE IF NOT EXISTS public.onboarding_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.onboarding_cases(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  status document_status NOT NULL DEFAULT 'pending',
  is_mandatory BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  rejection_reason TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. ELIGIBILITY RESULTS
CREATE TABLE IF NOT EXISTS public.onboarding_eligibility (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.onboarding_cases(id) ON DELETE CASCADE,
  lender_id UUID,
  vat_turnover NUMERIC(15,2) DEFAULT 0,
  adjusted_turnover NUMERIC(15,2) DEFAULT 0,
  pos_annual_turnover NUMERIC(15,2) DEFAULT 0,
  variance_percent NUMERIC(5,2) DEFAULT 0,
  variance_bucket TEXT,
  pos_cap_percent NUMERIC(5,2) DEFAULT 0,
  pos_cap_adjusted NUMERIC(15,2) DEFAULT 0,
  pos_cap_vat NUMERIC(15,2) DEFAULT 0,
  pos_eligible_turnover NUMERIC(15,2) DEFAULT 0,
  turnover_basis NUMERIC(15,2) DEFAULT 0,
  eligible_multiplier NUMERIC(5,2) DEFAULT 0,
  eligible_loan_amount NUMERIC(15,2) DEFAULT 0,
  abcd_fee_percent NUMERIC(5,4) DEFAULT 0.01,
  abcd_fee_amount NUMERIC(15,2) DEFAULT 0,
  total_with_abcd NUMERIC(15,2) DEFAULT 0,
  eligibility_method TEXT DEFAULT 'Standard',
  eligibility_status TEXT DEFAULT 'Pending',
  eligibility_basis TEXT,
  flags JSONB DEFAULT '[]'::jsonb,
  recommended_lenders JSONB DEFAULT '[]'::jsonb,
  calculated_at TIMESTAMPTZ DEFAULT now(),
  calculated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. LOAN REQUIREMENTS
CREATE TABLE IF NOT EXISTS public.onboarding_loan_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.onboarding_cases(id) ON DELETE CASCADE,
  loan_type TEXT NOT NULL,
  required_loan_amount NUMERIC(15,2) NOT NULL,
  purpose TEXT,
  preferred_tenure TEXT,
  urgent_funding BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(case_id)
);

-- 9. CASE LENDER APPLICATIONS
CREATE TABLE IF NOT EXISTS public.case_lender_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.onboarding_cases(id) ON DELETE CASCADE,
  lender_id UUID NOT NULL,
  submission_date TIMESTAMPTZ,
  requested_amount NUMERIC(15,2),
  lender_status TEXT DEFAULT 'pending',
  lender_stage process_stage,
  stage_entered_at TIMESTAMPTZ DEFAULT now(),
  assigned_ro_name TEXT,
  assigned_ro_email TEXT,
  assigned_ro_phone TEXT,
  decision TEXT,
  decision_date TIMESTAMPTZ,
  approved_amount NUMERIC(15,2),
  interest_rate NUMERIC(5,2),
  tenure_months INTEGER,
  lender_remarks TEXT,
  internal_remarks TEXT,
  rag_status rag_status DEFAULT 'green',
  days_in_stage INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(case_id, lender_id)
);

-- 10. CASE STAGE HISTORY
CREATE TABLE IF NOT EXISTS public.onboarding_stage_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.onboarding_cases(id) ON DELETE CASCADE,
  lender_application_id UUID REFERENCES public.case_lender_applications(id) ON DELETE CASCADE,
  field_changed TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  change_reason TEXT,
  change_type TEXT,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- ============================================================
-- TRIGGERS & FUNCTIONS
-- ============================================================

-- Generate Case Number
CREATE OR REPLACE FUNCTION public.generate_onboarding_case_number()
RETURNS TRIGGER AS $$
DECLARE
  v_year TEXT;
  v_seq_num INTEGER;
  v_case_number TEXT;
BEGIN
  IF NEW.case_number IS NULL THEN
    v_year := TO_CHAR(CURRENT_DATE, 'YYYY');
    SELECT COUNT(*) + 1 INTO v_seq_num
    FROM public.onboarding_cases
    WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
    AND case_number IS NOT NULL;
    v_case_number := 'BL-' || v_year || '-' || LPAD(v_seq_num::TEXT, 4, '0');
    WHILE EXISTS (SELECT 1 FROM public.onboarding_cases WHERE case_number = v_case_number) LOOP
      v_seq_num := v_seq_num + 1;
      v_case_number := 'BL-' || v_year || '-' || LPAD(v_seq_num::TEXT, 4, '0');
    END LOOP;
    NEW.case_number := v_case_number;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_generate_onboarding_case_number ON public.onboarding_cases;
CREATE TRIGGER trg_generate_onboarding_case_number
  BEFORE INSERT ON public.onboarding_cases
  FOR EACH ROW EXECUTE FUNCTION public.generate_onboarding_case_number();

-- Validate Status/Stage Rules
CREATE OR REPLACE FUNCTION public.validate_case_status_stage()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('on_hold', 'dropped', 'declined', 'closed') THEN
    IF NEW.process_stage IS NOT NULL THEN
      NEW.last_valid_process_stage := NEW.process_stage;
    END IF;
    NEW.process_stage := NULL;
  END IF;
  
  IF OLD.status IN ('on_hold', 'dropped', 'declined', 'closed') 
     AND NEW.status = 'in_process' 
     AND NEW.process_stage IS NULL 
     AND NEW.last_valid_process_stage IS NOT NULL THEN
    NEW.process_stage := NEW.last_valid_process_stage;
  END IF;
  
  IF OLD.process_stage IS DISTINCT FROM NEW.process_stage 
     OR OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.stage_entered_at := now();
    NEW.days_in_current_stage := 0;
  END IF;
  
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_validate_case_status_stage ON public.onboarding_cases;
CREATE TRIGGER trg_validate_case_status_stage
  BEFORE UPDATE ON public.onboarding_cases
  FOR EACH ROW EXECUTE FUNCTION public.validate_case_status_stage();

-- Calculate Financial Inputs
CREATE OR REPLACE FUNCTION public.calculate_financial_inputs()
RETURNS TRIGGER AS $$
BEGIN
  NEW.adjusted_turnover := GREATEST(0, 
    COALESCE(NEW.declared_turnover, 0) 
    - COALESCE(NEW.cash_adjustment, 0) 
    - COALESCE(NEW.sister_concern_adjustment, 0)
  );
  NEW.pos_annual_turnover := COALESCE(NEW.pos_monthly_turnover, 0) * 12;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_calculate_financial_inputs ON public.financial_inputs;
CREATE TRIGGER trg_calculate_financial_inputs
  BEFORE INSERT OR UPDATE ON public.financial_inputs
  FOR EACH ROW EXECUTE FUNCTION public.calculate_financial_inputs();

-- Validate TL Expiry
CREATE OR REPLACE FUNCTION public.validate_business_tl_expiry()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tl_expiry_date <= CURRENT_DATE THEN
    RAISE EXCEPTION 'Trade License expiry date must be a future date';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_validate_business_tl_expiry ON public.applicant_businesses;
CREATE TRIGGER trg_validate_business_tl_expiry
  BEFORE INSERT OR UPDATE ON public.applicant_businesses
  FOR EACH ROW EXECUTE FUNCTION public.validate_business_tl_expiry();

-- Validate Shareholding
CREATE OR REPLACE FUNCTION public.validate_shareholding_total()
RETURNS TRIGGER AS $$
DECLARE
  v_total NUMERIC;
BEGIN
  SELECT COALESCE(SUM(shareholding_percent), 0) INTO v_total
  FROM public.business_owners
  WHERE case_id = NEW.case_id AND id != NEW.id;
  v_total := v_total + COALESCE(NEW.shareholding_percent, 0);
  IF v_total > 100 THEN
    RAISE EXCEPTION 'Total shareholding cannot exceed 100 percent. Current total: %', v_total;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_validate_shareholding ON public.business_owners;
CREATE TRIGGER trg_validate_shareholding
  BEFORE INSERT OR UPDATE ON public.business_owners
  FOR EACH ROW EXECUTE FUNCTION public.validate_shareholding_total();

-- Record Stage History
CREATE OR REPLACE FUNCTION public.record_onboarding_stage_history()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.onboarding_stage_history (case_id, field_changed, old_value, new_value, change_type, changed_by)
    VALUES (NEW.id, 'status', OLD.status::TEXT, NEW.status::TEXT, 'status_change', auth.uid());
  END IF;
  IF OLD.process_stage IS DISTINCT FROM NEW.process_stage THEN
    INSERT INTO public.onboarding_stage_history (case_id, field_changed, old_value, new_value, change_type, changed_by)
    VALUES (NEW.id, 'process_stage', OLD.process_stage::TEXT, NEW.process_stage::TEXT, 'stage_change', auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_record_onboarding_stage_history ON public.onboarding_cases;
CREATE TRIGGER trg_record_onboarding_stage_history
  AFTER UPDATE ON public.onboarding_cases
  FOR EACH ROW EXECUTE FUNCTION public.record_onboarding_stage_history();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.onboarding_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applicant_businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_inputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_eligibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_lender_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_stage_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_loan_requirements ENABLE ROW LEVEL SECURITY;

-- Onboarding Cases
CREATE POLICY "Users can view own cases" ON public.onboarding_cases FOR SELECT 
  USING (user_id = auth.uid() OR public.has_admin_privileges() OR public.is_supervisor());
CREATE POLICY "Users can create cases" ON public.onboarding_cases FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own cases" ON public.onboarding_cases FOR UPDATE 
  USING (user_id = auth.uid() OR public.has_admin_privileges() OR public.is_supervisor());
CREATE POLICY "Admins can delete cases" ON public.onboarding_cases FOR DELETE USING (public.is_super_admin());

-- Child tables with case access
CREATE POLICY "Access via case" ON public.applicant_businesses FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.onboarding_cases c WHERE c.id = case_id AND (c.user_id = auth.uid() OR public.has_admin_privileges() OR public.is_supervisor())));

CREATE POLICY "Access via case" ON public.business_owners FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.onboarding_cases c WHERE c.id = case_id AND (c.user_id = auth.uid() OR public.has_admin_privileges() OR public.is_supervisor())));

CREATE POLICY "Access via case" ON public.financial_inputs FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.onboarding_cases c WHERE c.id = case_id AND (c.user_id = auth.uid() OR public.has_admin_privileges() OR public.is_supervisor())));

CREATE POLICY "Access via case" ON public.onboarding_documents FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.onboarding_cases c WHERE c.id = case_id AND (c.user_id = auth.uid() OR public.has_admin_privileges() OR public.is_supervisor())));

CREATE POLICY "Access via case" ON public.onboarding_eligibility FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.onboarding_cases c WHERE c.id = case_id AND (c.user_id = auth.uid() OR public.has_admin_privileges() OR public.is_supervisor())));

CREATE POLICY "Access via case" ON public.case_lender_applications FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.onboarding_cases c WHERE c.id = case_id AND (c.user_id = auth.uid() OR public.has_admin_privileges() OR public.is_supervisor())));

CREATE POLICY "View history via case" ON public.onboarding_stage_history FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.onboarding_cases c WHERE c.id = case_id AND (c.user_id = auth.uid() OR public.has_admin_privileges() OR public.is_supervisor())));
CREATE POLICY "System can insert history" ON public.onboarding_stage_history FOR INSERT WITH CHECK (true);

CREATE POLICY "Access via case" ON public.onboarding_loan_requirements FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.onboarding_cases c WHERE c.id = case_id AND (c.user_id = auth.uid() OR public.has_admin_privileges() OR public.is_supervisor())));

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_onboarding_cases_status ON public.onboarding_cases(status);
CREATE INDEX IF NOT EXISTS idx_onboarding_cases_user_id ON public.onboarding_cases(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_cases_agent_id ON public.onboarding_cases(agent_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_cases_created_at ON public.onboarding_cases(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_case_lender_apps_case ON public.case_lender_applications(case_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_stage_history_case ON public.onboarding_stage_history(case_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_documents_case ON public.onboarding_documents(case_id);