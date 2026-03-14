
-- 1. Bank Master table
CREATE TABLE public.bank_master (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_name text NOT NULL,
  short_name text,
  country text DEFAULT 'UAE',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bank_master ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view banks" ON public.bank_master
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins manage banks" ON public.bank_master
  FOR ALL TO authenticated
  USING (has_admin_privileges())
  WITH CHECK (has_admin_privileges());

-- Seed UAE banks
INSERT INTO public.bank_master (bank_name, short_name, country) VALUES
  ('Abu Dhabi Commercial Bank', 'ADCB', 'UAE'),
  ('Emirates NBD', 'ENBD', 'UAE'),
  ('First Abu Dhabi Bank', 'FAB', 'UAE'),
  ('Mashreq Bank', 'Mashreq', 'UAE'),
  ('RAK Bank', 'RAKBANK', 'UAE'),
  ('Dubai Islamic Bank', 'DIB', 'UAE'),
  ('Abu Dhabi Islamic Bank', 'ADIB', 'UAE'),
  ('Commercial Bank of Dubai', 'CBD', 'UAE'),
  ('Emirates Islamic', 'EI', 'UAE'),
  ('Sharjah Islamic Bank', 'SIB', 'UAE'),
  ('National Bank of Fujairah', 'NBF', 'UAE'),
  ('Ajman Bank', 'Ajman', 'UAE'),
  ('Al Hilal Bank', 'Al Hilal', 'UAE'),
  ('United Arab Bank', 'UAB', 'UAE'),
  ('Noor Bank', 'Noor', 'UAE'),
  ('HSBC UAE', 'HSBC', 'UAE'),
  ('Standard Chartered UAE', 'SCB', 'UAE'),
  ('Citibank UAE', 'Citi', 'UAE'),
  ('Bank of Baroda UAE', 'BoB', 'UAE'),
  ('Wio Bank', 'Wio', 'UAE');

-- 2. Currency Master table
CREATE TABLE public.currency_master (
  currency_code text PRIMARY KEY,
  currency_name text NOT NULL,
  symbol text NOT NULL,
  decimal_places integer NOT NULL DEFAULT 2,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.currency_master ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view currencies" ON public.currency_master
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins manage currencies" ON public.currency_master
  FOR ALL TO authenticated
  USING (has_admin_privileges())
  WITH CHECK (has_admin_privileges());

INSERT INTO public.currency_master (currency_code, currency_name, symbol, decimal_places) VALUES
  ('AED', 'UAE Dirham', 'د.إ', 2),
  ('USD', 'US Dollar', '$', 2),
  ('EUR', 'Euro', '€', 2),
  ('GBP', 'British Pound', '£', 2),
  ('SAR', 'Saudi Riyal', '﷼', 2),
  ('QAR', 'Qatari Riyal', 'ر.ق', 2),
  ('OMR', 'Omani Rial', 'ر.ع.', 3),
  ('KWD', 'Kuwaiti Dinar', 'د.ك', 3),
  ('BHD', 'Bahraini Dinar', 'د.ب', 3),
  ('INR', 'Indian Rupee', '₹', 2),
  ('PKR', 'Pakistani Rupee', '₨', 2),
  ('PHP', 'Philippine Peso', '₱', 2),
  ('EGP', 'Egyptian Pound', 'E£', 2),
  ('JOD', 'Jordanian Dinar', 'د.ا', 3),
  ('CHF', 'Swiss Franc', 'Fr', 2),
  ('JPY', 'Japanese Yen', '¥', 0),
  ('CNY', 'Chinese Yuan', '¥', 2),
  ('AUD', 'Australian Dollar', 'A$', 2),
  ('CAD', 'Canadian Dollar', 'C$', 2),
  ('SGD', 'Singapore Dollar', 'S$', 2),
  ('HKD', 'Hong Kong Dollar', 'HK$', 2);

-- 3. Case Currency Conversion Rates table
CREATE TABLE public.case_currency_conversion_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.assessment_cases(id) ON DELETE CASCADE,
  document_id uuid REFERENCES public.assessment_documents(id) ON DELETE SET NULL,
  account_number text,
  from_currency text NOT NULL,
  to_currency text NOT NULL,
  exchange_rate numeric NOT NULL,
  effective_from_date date,
  effective_to_date date,
  conversion_method text NOT NULL DEFAULT 'manual_fixed',
  is_active boolean NOT NULL DEFAULT true,
  remarks text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_case_fx_rates_case ON public.case_currency_conversion_rates(case_id);
CREATE INDEX idx_case_fx_rates_active ON public.case_currency_conversion_rates(case_id, is_active);

ALTER TABLE public.case_currency_conversion_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Access FX rates via case" ON public.case_currency_conversion_rates
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM assessment_cases c
    WHERE c.id = case_currency_conversion_rates.case_id
    AND (c.user_id = auth.uid() OR has_admin_privileges() OR is_supervisor() OR is_coordinator())
  ));

-- 4. Add currency columns to assessment_cases (base reporting currency)
ALTER TABLE public.assessment_cases
  ADD COLUMN IF NOT EXISTS base_reporting_currency text DEFAULT 'AED',
  ADD COLUMN IF NOT EXISTS multi_currency_flag boolean DEFAULT false;

-- 5. Add currency columns to assessment_documents (statement-level currency)
ALTER TABLE public.assessment_documents
  ADD COLUMN IF NOT EXISTS statement_currency_code text DEFAULT 'AED',
  ADD COLUMN IF NOT EXISTS currency_detection_source text DEFAULT 'auto',
  ADD COLUMN IF NOT EXISTS currency_confirmed_by uuid,
  ADD COLUMN IF NOT EXISTS currency_confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS bank_id uuid REFERENCES public.bank_master(id),
  ADD COLUMN IF NOT EXISTS bank_name_confirmed text,
  ADD COLUMN IF NOT EXISTS bank_detection_source text DEFAULT 'auto',
  ADD COLUMN IF NOT EXISTS bank_confirmed_by uuid,
  ADD COLUMN IF NOT EXISTS bank_confirmed_at timestamptz;

-- 6. Add currency columns to assessment_bank_transactions
ALTER TABLE public.assessment_bank_transactions
  ADD COLUMN IF NOT EXISTS original_currency_code text DEFAULT 'AED',
  ADD COLUMN IF NOT EXISTS original_debit numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS original_credit numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS original_balance numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS base_currency_code text DEFAULT 'AED',
  ADD COLUMN IF NOT EXISTS converted_debit numeric,
  ADD COLUMN IF NOT EXISTS converted_credit numeric,
  ADD COLUMN IF NOT EXISTS converted_balance numeric,
  ADD COLUMN IF NOT EXISTS applied_exchange_rate numeric DEFAULT 1,
  ADD COLUMN IF NOT EXISTS conversion_id uuid REFERENCES public.case_currency_conversion_rates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS conversion_status text DEFAULT 'not_required';

-- 7. Add currency columns to bank_analysis_results
ALTER TABLE public.bank_analysis_results
  ADD COLUMN IF NOT EXISTS account_currency_code text DEFAULT 'AED',
  ADD COLUMN IF NOT EXISTS base_currency_code text DEFAULT 'AED',
  ADD COLUMN IF NOT EXISTS exchange_rate_used numeric DEFAULT 1,
  ADD COLUMN IF NOT EXISTS converted_avg_monthly_credit numeric,
  ADD COLUMN IF NOT EXISTS converted_avg_monthly_debit numeric,
  ADD COLUMN IF NOT EXISTS converted_average_eod_balance numeric,
  ADD COLUMN IF NOT EXISTS converted_min_monthly_balance numeric,
  ADD COLUMN IF NOT EXISTS converted_max_monthly_balance numeric;

-- 8. Add currency columns to bank_analysis_consolidated
ALTER TABLE public.bank_analysis_consolidated
  ADD COLUMN IF NOT EXISTS base_currency_code text DEFAULT 'AED',
  ADD COLUMN IF NOT EXISTS multi_currency_flag boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS total_converted_monthly_credit numeric,
  ADD COLUMN IF NOT EXISTS total_converted_monthly_debit numeric,
  ADD COLUMN IF NOT EXISTS total_converted_average_balance numeric,
  ADD COLUMN IF NOT EXISTS fx_assumption_notes text;
