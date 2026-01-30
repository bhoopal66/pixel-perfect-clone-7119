-- Drop the existing public delete policy
DROP POLICY IF EXISTS "Allow public delete" ON public.loan_eligibility;

-- Create new policy allowing only admins to delete
CREATE POLICY "Only admins can delete" 
ON public.loan_eligibility 
FOR DELETE 
USING (public.is_admin());