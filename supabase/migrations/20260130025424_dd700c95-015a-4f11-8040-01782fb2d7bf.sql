-- Update DELETE policy on agents to only allow super_admin
DROP POLICY IF EXISTS "Only admins can delete agents" ON public.agents;

CREATE POLICY "Only super_admins can delete agents" 
ON public.agents 
FOR DELETE 
USING (is_super_admin());

-- Update DELETE policy on cases to only allow super_admin
DROP POLICY IF EXISTS "Only admins can delete cases" ON public.cases;

CREATE POLICY "Only super_admins can delete cases" 
ON public.cases 
FOR DELETE 
USING (is_super_admin());

-- Update DELETE policy on loan_cases to only allow super_admin
DROP POLICY IF EXISTS "Only admins can delete loan cases" ON public.loan_cases;

CREATE POLICY "Only super_admins can delete loan_cases" 
ON public.loan_cases 
FOR DELETE 
USING (is_super_admin());

-- Update DELETE policy on loan_eligibility to only allow super_admin
DROP POLICY IF EXISTS "Only admins can delete" ON public.loan_eligibility;

CREATE POLICY "Only super_admins can delete loan_eligibility" 
ON public.loan_eligibility 
FOR DELETE 
USING (is_super_admin());