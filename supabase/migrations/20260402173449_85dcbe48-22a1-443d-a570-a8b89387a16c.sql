
-- RPC 1: Executive KPIs
CREATE OR REPLACE FUNCTION public.get_executive_kpis()
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH lender_best AS (
    SELECT case_id, MAX(COALESCE(recommended_limit, 0)) AS best_limit
    FROM assessment_lender_results
    GROUP BY case_id
  ),
  case_funding AS (
    SELECT
      c.id,
      c.status,
      GREATEST(
        COALESCE(lb.best_limit, 0),
        COALESCE(c.normalized_turnover, 0),
        COALESCE(c.estimated_annual_turnover, 0)
      ) AS funding_amount
    FROM assessment_cases c
    LEFT JOIN lender_best lb ON lb.case_id = c.id
  )
  SELECT json_build_object(
    'total_cases', (SELECT COUNT(*) FROM assessment_cases),
    'active_cases', (SELECT COUNT(*) FROM assessment_cases WHERE status NOT IN ('approved','declined','closed','dropped')),
    'cases_submitted', (SELECT COUNT(*) FROM assessment_cases WHERE status IN ('submitted','under_review','approved','declined')),
    'approvals', (SELECT COUNT(*) FROM assessment_cases WHERE status = 'approved'),
    'total_funding_requested', (SELECT COALESCE(SUM(funding_amount), 0) FROM case_funding),
    'funding_pipeline', (SELECT COALESCE(SUM(funding_amount), 0) FROM case_funding WHERE status NOT IN ('approved','declined','closed','dropped')),
    'approved_funding', (SELECT COALESCE(SUM(funding_amount), 0) FROM case_funding WHERE status = 'approved'),
    'success_fee_rate', 0.02
  );
$$;

-- RPC 2: Pipeline counts
CREATE OR REPLACE FUNCTION public.get_executive_pipeline()
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH classified AS (
    SELECT
      CASE
        WHEN status = 'approved' THEN 'Approved'
        WHEN status IN ('submitted','under_review') THEN 'Submitted'
        WHEN lenders_run_completed OR ai_matching_completed THEN 'Lender Match'
        WHEN analysis_completed THEN 'Analysis Complete'
        WHEN status = 'in_progress' THEN 'Documents Uploaded'
        ELSE 'New Case'
      END AS stage
    FROM assessment_cases
    WHERE status NOT IN ('declined','closed','dropped')
  )
  SELECT json_agg(json_build_object('stage', s.stage, 'count', COALESCE(c.cnt, 0)))
  FROM (VALUES ('New Case'),('Documents Uploaded'),('Analysis Complete'),('Lender Match'),('Submitted'),('Approved')) AS s(stage)
  LEFT JOIN (SELECT stage, COUNT(*)::int AS cnt FROM classified GROUP BY stage) c ON c.stage = s.stage;
$$;

-- RPC 3: Lender performance
CREATE OR REPLACE FUNCTION public.get_executive_lender_performance()
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.cases_sent DESC), '[]'::json)
  FROM (
    SELECT
      lender_name,
      COUNT(*)::int AS cases_sent,
      COUNT(*) FILTER (WHERE LOWER(eligibility_status) IN ('eligible','approved'))::int AS approvals,
      CASE WHEN COUNT(*) > 0
        THEN ROUND(COUNT(*) FILTER (WHERE LOWER(eligibility_status) IN ('eligible','approved'))::numeric / COUNT(*) * 100)::int
        ELSE 0
      END AS approval_rate
    FROM assessment_lender_results
    WHERE TRIM(lender_name) != ''
    GROUP BY lender_name
  ) t;
$$;

-- RPC 4: Risk metrics
CREATE OR REPLACE FUNCTION public.get_executive_risk_metrics()
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'avg_bbrs_score', COALESCE((SELECT ROUND(AVG(fraud_risk_score)::numeric) FROM fraud_detection_results WHERE fraud_risk_score IS NOT NULL), 0),
    'avg_monthly_turnover', COALESCE((SELECT ROUND(AVG(total_monthly_credit)::numeric) FROM bank_analysis_consolidated WHERE total_monthly_credit > 0), 0),
    'avg_loan_size', COALESCE((SELECT ROUND(AVG(recommended_limit)::numeric) FROM assessment_lender_results WHERE recommended_limit > 0), 0),
    'high_risk_cases', (SELECT COUNT(*)::int FROM fraud_detection_results WHERE fraud_risk_category IN ('high','critical')),
    'fraud_alerts', (SELECT COUNT(*)::int FROM fraud_detection_results WHERE fraud_risk_category = 'critical')
  );
$$;

-- RPC 5: Operational activity (today)
CREATE OR REPLACE FUNCTION public.get_executive_ops_activity()
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'cases_today', (SELECT COUNT(*)::int FROM assessment_cases WHERE created_at >= CURRENT_DATE),
    'reports_today', (SELECT COUNT(*)::int FROM case_reports WHERE generated_at >= CURRENT_DATE),
    'analyses_today', (SELECT COUNT(*)::int FROM bank_analysis_results WHERE created_at >= CURRENT_DATE),
    'active_users', (SELECT COUNT(DISTINCT done_by)::int FROM case_activity_log WHERE done_at >= CURRENT_DATE)
  );
$$;

-- RPC 6: Top deals
CREATE OR REPLACE FUNCTION public.get_executive_top_deals()
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
  FROM (
    SELECT
      c.id,
      COALESCE(c.company_name, 'Unnamed Company') AS company_name,
      COALESCE(c.normalized_turnover, c.estimated_annual_turnover, 0) AS loan_amount,
      COALESCE(lr.lender_name, '—') AS recommended_lender,
      c.status
    FROM assessment_cases c
    LEFT JOIN LATERAL (
      SELECT lender_name FROM assessment_lender_results
      WHERE case_id = c.id ORDER BY COALESCE(recommended_limit,0) DESC LIMIT 1
    ) lr ON true
    WHERE c.estimated_annual_turnover > 0
    ORDER BY c.estimated_annual_turnover DESC
    LIMIT 10
  ) t;
$$;

-- RPC 7: Monthly funding trend
CREATE OR REPLACE FUNCTION public.get_executive_monthly_funding()
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.month), '[]'::json)
  FROM (
    SELECT
      TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS month,
      TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YY') AS label,
      COALESCE(SUM(estimated_annual_turnover), 0)::numeric AS amount
    FROM assessment_cases
    WHERE estimated_annual_turnover > 0
      AND created_at >= NOW() - INTERVAL '12 months'
    GROUP BY DATE_TRUNC('month', created_at)
  ) t;
$$;
