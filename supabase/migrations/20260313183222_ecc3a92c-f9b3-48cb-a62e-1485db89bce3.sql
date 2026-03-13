
-- Add FK constraint on related_party_transactions.case_id -> assessment_cases.id
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'related_party_transactions_case_id_fkey' AND table_name = 'related_party_transactions') THEN
    ALTER TABLE public.related_party_transactions ADD CONSTRAINT related_party_transactions_case_id_fkey FOREIGN KEY (case_id) REFERENCES public.assessment_cases(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'related_party_flow_summary_case_id_fkey' AND table_name = 'related_party_flow_summary') THEN
    ALTER TABLE public.related_party_flow_summary ADD CONSTRAINT related_party_flow_summary_case_id_fkey FOREIGN KEY (case_id) REFERENCES public.assessment_cases(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'extraction_runs_case_id_fkey' AND table_name = 'extraction_runs') THEN
    ALTER TABLE public.extraction_runs ADD CONSTRAINT extraction_runs_case_id_fkey FOREIGN KEY (case_id) REFERENCES public.assessment_cases(id) ON DELETE CASCADE;
  END IF;
END $$;
