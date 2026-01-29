-- Drop overly permissive INSERT policy and replace with authenticated users only
DROP POLICY IF EXISTS "Allow public insert" ON public.loan_eligibility;
CREATE POLICY "Authenticated users can insert" 
ON public.loan_eligibility 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Drop overly permissive UPDATE policy and replace with authenticated users only
DROP POLICY IF EXISTS "Allow public update" ON public.loan_eligibility;
CREATE POLICY "Authenticated users can update" 
ON public.loan_eligibility 
FOR UPDATE 
TO authenticated
USING (true);