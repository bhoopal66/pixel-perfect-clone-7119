-- Add case_number column to cases table
ALTER TABLE public.cases 
ADD COLUMN IF NOT EXISTS case_number TEXT UNIQUE;

-- Create sequence for case numbers (resets daily tracking)
CREATE SEQUENCE IF NOT EXISTS public.case_number_seq START 1;

-- Function to generate case number in format TCR XXX DDMM/YY
CREATE OR REPLACE FUNCTION public.generate_case_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_date_part TEXT;
  v_seq_num INTEGER;
  v_case_number TEXT;
  v_today DATE;
  v_count INTEGER;
BEGIN
  -- Get today's date
  v_today := CURRENT_DATE;
  
  -- Format: DDMM/YY (e.g., 2901/25 for Jan 29, 2025)
  v_date_part := TO_CHAR(v_today, 'DDMM') || '/' || TO_CHAR(v_today, 'YY');
  
  -- Count existing cases for today to determine sequence
  SELECT COUNT(*) + 1 INTO v_count
  FROM public.cases
  WHERE DATE(created_at) = v_today
  AND case_number IS NOT NULL;
  
  -- Format sequence as 3 digits (001, 002, etc.)
  v_seq_num := v_count;
  
  -- Build case number: TCR XXX DDMM/YY
  v_case_number := 'TCR ' || LPAD(v_seq_num::TEXT, 3, '0') || ' ' || v_date_part;
  
  -- Ensure uniqueness by checking if this number exists
  WHILE EXISTS (SELECT 1 FROM public.cases WHERE case_number = v_case_number) LOOP
    v_seq_num := v_seq_num + 1;
    v_case_number := 'TCR ' || LPAD(v_seq_num::TEXT, 3, '0') || ' ' || v_date_part;
  END LOOP;
  
  NEW.case_number := v_case_number;
  RETURN NEW;
END;
$$;

-- Create trigger to auto-generate case number on insert
DROP TRIGGER IF EXISTS generate_case_number_trigger ON public.cases;
CREATE TRIGGER generate_case_number_trigger
  BEFORE INSERT ON public.cases
  FOR EACH ROW
  WHEN (NEW.case_number IS NULL)
  EXECUTE FUNCTION public.generate_case_number();

-- Backfill existing cases without case numbers
DO $$
DECLARE
  r RECORD;
  v_date_part TEXT;
  v_seq INTEGER;
  v_case_number TEXT;
BEGIN
  v_seq := 0;
  FOR r IN 
    SELECT id, created_at 
    FROM public.cases 
    WHERE case_number IS NULL 
    ORDER BY created_at ASC
  LOOP
    v_seq := v_seq + 1;
    v_date_part := TO_CHAR(r.created_at::DATE, 'DDMM') || '/' || TO_CHAR(r.created_at::DATE, 'YY');
    v_case_number := 'TCR ' || LPAD(v_seq::TEXT, 3, '0') || ' ' || v_date_part;
    
    UPDATE public.cases SET case_number = v_case_number WHERE id = r.id;
  END LOOP;
END $$;