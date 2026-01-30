-- ============================================================
-- SECURITY FIX: Remove overly permissive RLS policies (USING/WITH CHECK true)
-- ============================================================

-- ------------------------------
-- agents
-- ------------------------------
DROP POLICY IF EXISTS "Authenticated users can insert agents" ON public.agents;
DROP POLICY IF EXISTS "Authenticated users can update agents" ON public.agents;
DROP POLICY IF EXISTS "Authenticated users can view agents" ON public.agents;

CREATE POLICY "Staff can view agents"
ON public.agents
FOR SELECT
TO authenticated
USING (public.has_admin_privileges() OR public.is_supervisor() OR public.is_coordinator());

CREATE POLICY "Supervisors can insert agents"
ON public.agents
FOR INSERT
TO authenticated
WITH CHECK (public.has_admin_privileges() OR public.is_supervisor());

CREATE POLICY "Supervisors can update agents"
ON public.agents
FOR UPDATE
TO authenticated
USING (public.has_admin_privileges() OR public.is_supervisor())
WITH CHECK (public.has_admin_privileges() OR public.is_supervisor());

-- ------------------------------
-- cases (legacy)
-- ------------------------------
DROP POLICY IF EXISTS "Authenticated users can insert cases" ON public.cases;
DROP POLICY IF EXISTS "Authenticated users can update cases" ON public.cases;
DROP POLICY IF EXISTS "Authenticated users can view all cases" ON public.cases;

CREATE POLICY "Users can view cases"
ON public.cases
FOR SELECT
TO authenticated
USING (
  public.has_admin_privileges()
  OR public.is_supervisor()
  OR public.is_coordinator()
  OR (user_id = auth.uid())
);

CREATE POLICY "Users can insert cases"
ON public.cases
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_admin_privileges()
  OR public.is_supervisor()
  OR public.is_coordinator()
  OR (user_id = auth.uid())
);

CREATE POLICY "Users can update cases"
ON public.cases
FOR UPDATE
TO authenticated
USING (
  public.has_admin_privileges()
  OR public.is_supervisor()
  OR public.is_coordinator()
  OR (user_id = auth.uid())
)
WITH CHECK (
  public.has_admin_privileges()
  OR public.is_supervisor()
  OR public.is_coordinator()
  OR (user_id = auth.uid())
);

-- ------------------------------
-- loan_cases
-- ------------------------------
DROP POLICY IF EXISTS "Authenticated users can insert loan cases" ON public.loan_cases;
DROP POLICY IF EXISTS "Authenticated users can update loan cases" ON public.loan_cases;
DROP POLICY IF EXISTS "Authenticated users can view all loan cases" ON public.loan_cases;

CREATE POLICY "Users can view loan cases"
ON public.loan_cases
FOR SELECT
TO authenticated
USING (
  public.has_admin_privileges()
  OR public.is_supervisor()
  OR public.is_coordinator()
  OR (user_id = auth.uid())
);

CREATE POLICY "Users can insert loan cases"
ON public.loan_cases
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_admin_privileges()
  OR public.is_supervisor()
  OR public.is_coordinator()
  OR (user_id = auth.uid())
);

CREATE POLICY "Users can update loan cases"
ON public.loan_cases
FOR UPDATE
TO authenticated
USING (
  public.has_admin_privileges()
  OR public.is_supervisor()
  OR public.is_coordinator()
  OR (user_id = auth.uid())
)
WITH CHECK (
  public.has_admin_privileges()
  OR public.is_supervisor()
  OR public.is_coordinator()
  OR (user_id = auth.uid())
);

-- ------------------------------
-- loan_eligibility
-- ------------------------------
DROP POLICY IF EXISTS "Allow public read" ON public.loan_eligibility;
DROP POLICY IF EXISTS "Authenticated users can insert" ON public.loan_eligibility;
DROP POLICY IF EXISTS "Authenticated users can update" ON public.loan_eligibility;

CREATE POLICY "Authenticated users can view loan eligibility"
ON public.loan_eligibility
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Staff can insert loan eligibility"
ON public.loan_eligibility
FOR INSERT
TO authenticated
WITH CHECK (public.has_admin_privileges() OR public.is_supervisor() OR public.is_coordinator());

CREATE POLICY "Staff can update loan eligibility"
ON public.loan_eligibility
FOR UPDATE
TO authenticated
USING (public.has_admin_privileges() OR public.is_supervisor() OR public.is_coordinator())
WITH CHECK (public.has_admin_privileges() OR public.is_supervisor() OR public.is_coordinator());

-- ------------------------------
-- onboarding_cases (new module)
-- ------------------------------
DROP POLICY IF EXISTS "Users can create cases" ON public.onboarding_cases;

CREATE POLICY "Users can create cases"
ON public.onboarding_cases
FOR INSERT
TO authenticated
WITH CHECK (
  user_id IS NOT NULL
  AND (
    user_id = auth.uid()
    OR public.has_admin_privileges()
    OR public.is_supervisor()
    OR public.is_coordinator()
  )
);

-- ------------------------------
-- onboarding_stage_history (new module)
-- ------------------------------
DROP POLICY IF EXISTS "System can insert history" ON public.onboarding_stage_history;

CREATE POLICY "Staff can insert onboarding history"
ON public.onboarding_stage_history
FOR INSERT
TO authenticated
WITH CHECK (public.has_admin_privileges() OR public.is_supervisor() OR public.is_coordinator());
