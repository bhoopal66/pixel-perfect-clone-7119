-- Create updated_at function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create loan_cases table
CREATE TABLE public.loan_cases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_number TEXT NOT NULL,
  applicant_name TEXT NOT NULL,
  applicant_phone TEXT NOT NULL,
  applicant_email TEXT NOT NULL,
  monthly_salary NUMERIC NOT NULL DEFAULT 0,
  company_name TEXT NOT NULL,
  agent_reference TEXT NOT NULL,
  analyst_name TEXT NOT NULL,
  
  -- Loan Details
  lender TEXT NOT NULL,
  product_type TEXT NOT NULL DEFAULT 'cash',
  loan_amount NUMERIC NOT NULL DEFAULT 0,
  tenure INTEGER NOT NULL DEFAULT 12,
  purpose TEXT,
  interest_rate NUMERIC NOT NULL DEFAULT 0,
  
  -- Calculated fields
  emi NUMERIC NOT NULL DEFAULT 0,
  total_interest NUMERIC NOT NULL DEFAULT 0,
  total_payable NUMERIC NOT NULL DEFAULT 0,
  processing_fee NUMERIC NOT NULL DEFAULT 0,
  
  -- Status & Tracking
  status TEXT NOT NULL DEFAULT 'draft',
  notes TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  disbursed_at TIMESTAMP WITH TIME ZONE,
  
  -- Documents stored as JSONB
  documents JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- User tracking
  user_id UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.loan_cases ENABLE ROW LEVEL SECURITY;

-- RLS Policies - authenticated users can manage all cases
CREATE POLICY "Authenticated users can view all loan cases"
  ON public.loan_cases FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert loan cases"
  ON public.loan_cases FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update loan cases"
  ON public.loan_cases FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can delete loan cases"
  ON public.loan_cases FOR DELETE
  TO authenticated
  USING (is_admin());

-- Create updated_at trigger
CREATE TRIGGER update_loan_cases_updated_at
  BEFORE UPDATE ON public.loan_cases
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for common queries
CREATE INDEX idx_loan_cases_status ON public.loan_cases(status);
CREATE INDEX idx_loan_cases_lender ON public.loan_cases(lender);
CREATE INDEX idx_loan_cases_analyst ON public.loan_cases(analyst_name);
CREATE INDEX idx_loan_cases_created_at ON public.loan_cases(created_at DESC);