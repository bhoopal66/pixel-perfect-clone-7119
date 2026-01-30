-- Add agent reference field to cases table
ALTER TABLE public.cases 
ADD COLUMN agent_reference text DEFAULT '' NOT NULL;

COMMENT ON COLUMN public.cases.agent_reference IS 'Agent or broker reference for the case';