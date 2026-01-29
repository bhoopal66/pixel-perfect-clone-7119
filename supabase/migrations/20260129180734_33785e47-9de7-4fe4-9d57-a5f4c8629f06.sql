-- Drop existing function if exists
DROP FUNCTION IF EXISTS public.generate_case_number() CASCADE;

-- Create updated case number generator with CASE-YYYY-NNN format
CREATE OR REPLACE FUNCTION public.generate_case_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_year TEXT;
  v_seq_num INTEGER;
  v_case_number TEXT;
  v_prefix TEXT := 'CASE';
BEGIN
  -- Get current year
  v_year := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  -- Count existing cases for this year to determine sequence
  SELECT COUNT(*) + 1 INTO v_seq_num
  FROM public.cases
  WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
  AND case_number IS NOT NULL;
  
  -- Build case number: CASE-YYYY-NNN (e.g., CASE-2025-001)
  v_case_number := v_prefix || '-' || v_year || '-' || LPAD(v_seq_num::TEXT, 3, '0');
  
  -- Ensure uniqueness by checking if this number exists
  WHILE EXISTS (SELECT 1 FROM public.cases WHERE case_number = v_case_number) LOOP
    v_seq_num := v_seq_num + 1;
    v_case_number := v_prefix || '-' || v_year || '-' || LPAD(v_seq_num::TEXT, 3, '0');
  END LOOP;
  
  NEW.case_number := v_case_number;
  RETURN NEW;
END;
$function$;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_generate_case_number ON public.cases;

-- Create trigger to auto-generate case number on insert
CREATE TRIGGER trigger_generate_case_number
  BEFORE INSERT ON public.cases
  FOR EACH ROW
  WHEN (NEW.case_number IS NULL)
  EXECUTE FUNCTION public.generate_case_number();