-- Fix function search path for set_default_workflow
CREATE OR REPLACE FUNCTION public.set_default_workflow()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.workflow_id IS NULL THEN
    SELECT id INTO NEW.workflow_id
    FROM public.onboarding_lender_workflows
    WHERE lender_id = NEW.lender_id
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;