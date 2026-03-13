
-- Add missing foreign key constraints for referential integrity

-- related_party_flow_summary → assessment_cases
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'related_party_flow_summary_case_id_fkey'
  ) THEN
    ALTER TABLE public.related_party_flow_summary 
      ADD CONSTRAINT related_party_flow_summary_case_id_fkey 
      FOREIGN KEY (case_id) REFERENCES public.assessment_cases(id) ON DELETE CASCADE;
  END IF;
END $$;

-- related_party_transactions → assessment_cases
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'related_party_transactions_case_id_fkey'
  ) THEN
    ALTER TABLE public.related_party_transactions 
      ADD CONSTRAINT related_party_transactions_case_id_fkey 
      FOREIGN KEY (case_id) REFERENCES public.assessment_cases(id) ON DELETE CASCADE;
  END IF;
END $$;

-- related_party_transactions → case_related_parties
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'related_party_transactions_party_id_fkey'
  ) THEN
    ALTER TABLE public.related_party_transactions 
      ADD CONSTRAINT related_party_transactions_party_id_fkey 
      FOREIGN KEY (related_party_id) REFERENCES public.case_related_parties(id) ON DELETE CASCADE;
  END IF;
END $$;

-- extraction_runs → assessment_cases
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'extraction_runs_case_id_fkey'
  ) THEN
    ALTER TABLE public.extraction_runs 
      ADD CONSTRAINT extraction_runs_case_id_fkey 
      FOREIGN KEY (case_id) REFERENCES public.assessment_cases(id) ON DELETE CASCADE;
  END IF;
END $$;

-- extraction_runs → assessment_documents
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'extraction_runs_document_id_fkey'
  ) THEN
    ALTER TABLE public.extraction_runs 
      ADD CONSTRAINT extraction_runs_document_id_fkey 
      FOREIGN KEY (document_id) REFERENCES public.assessment_documents(id) ON DELETE SET NULL;
  END IF;
END $$;

-- fraud_detection_results → assessment_cases
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fraud_detection_results_case_id_fkey'
  ) THEN
    ALTER TABLE public.fraud_detection_results 
      ADD CONSTRAINT fraud_detection_results_case_id_fkey 
      FOREIGN KEY (case_id) REFERENCES public.assessment_cases(id) ON DELETE CASCADE;
  END IF;
END $$;

-- assessment_bank_summaries → assessment_cases
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'assessment_bank_summaries_case_id_fkey'
  ) THEN
    ALTER TABLE public.assessment_bank_summaries 
      ADD CONSTRAINT assessment_bank_summaries_case_id_fkey 
      FOREIGN KEY (case_id) REFERENCES public.assessment_cases(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add index on frequently-queried columns where missing
CREATE INDEX IF NOT EXISTS idx_bank_analysis_results_case_id ON public.bank_analysis_results(case_id);
CREATE INDEX IF NOT EXISTS idx_bank_analysis_consolidated_case_id ON public.bank_analysis_consolidated(case_id);
CREATE INDEX IF NOT EXISTS idx_related_party_flow_summary_case_id ON public.related_party_flow_summary(case_id);
CREATE INDEX IF NOT EXISTS idx_related_party_transactions_case_id ON public.related_party_transactions(case_id);
CREATE INDEX IF NOT EXISTS idx_extraction_runs_case_id ON public.extraction_runs(case_id);
CREATE INDEX IF NOT EXISTS idx_fraud_detection_results_case_id ON public.fraud_detection_results(case_id);
CREATE INDEX IF NOT EXISTS idx_lender_execution_results_case_id ON public.lender_execution_results(case_id);
CREATE INDEX IF NOT EXISTS idx_lender_execution_results_active ON public.lender_execution_results(case_id, is_active);
CREATE INDEX IF NOT EXISTS idx_combined_financial_summary_active ON public.combined_financial_summary(case_id, is_active);
CREATE INDEX IF NOT EXISTS idx_case_reports_latest ON public.case_reports(case_id, report_type, is_latest);
