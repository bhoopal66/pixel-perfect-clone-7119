-- Create agents table for agent registration
CREATE TABLE public.agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_code text UNIQUE NOT NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  telephone text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view agents"
ON public.agents FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert agents"
ON public.agents FOR INSERT
WITH CHECK (true);

CREATE POLICY "Authenticated users can update agents"
ON public.agents FOR UPDATE
USING (true);

CREATE POLICY "Only admins can delete agents"
ON public.agents FOR DELETE
USING (is_admin());

-- Function to auto-generate agent code (AGT-YYYY-NNN format)
CREATE OR REPLACE FUNCTION public.generate_agent_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_year TEXT;
  v_seq_num INTEGER;
  v_agent_code TEXT;
  v_prefix TEXT := 'AGT';
BEGIN
  -- Get current year
  v_year := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  -- Count existing agents for this year
  SELECT COUNT(*) + 1 INTO v_seq_num
  FROM public.agents
  WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
  AND agent_code IS NOT NULL;
  
  -- Build agent code: AGT-YYYY-NNN (e.g., AGT-2026-001)
  v_agent_code := v_prefix || '-' || v_year || '-' || LPAD(v_seq_num::TEXT, 3, '0');
  
  -- Ensure uniqueness
  WHILE EXISTS (SELECT 1 FROM public.agents WHERE agent_code = v_agent_code) LOOP
    v_seq_num := v_seq_num + 1;
    v_agent_code := v_prefix || '-' || v_year || '-' || LPAD(v_seq_num::TEXT, 3, '0');
  END LOOP;
  
  NEW.agent_code := v_agent_code;
  RETURN NEW;
END;
$$;

-- Create trigger for auto-generating agent code
CREATE TRIGGER trigger_generate_agent_code
BEFORE INSERT ON public.agents
FOR EACH ROW
WHEN (NEW.agent_code IS NULL OR NEW.agent_code = '')
EXECUTE FUNCTION public.generate_agent_code();

-- Create trigger for updating updated_at
CREATE TRIGGER update_agents_updated_at
BEFORE UPDATE ON public.agents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_agents_agent_code ON public.agents(agent_code);
CREATE INDEX idx_agents_is_active ON public.agents(is_active);
CREATE INDEX idx_agents_full_name ON public.agents(full_name);