import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ExecutiveKPIs {
  totalCases: number;
  activeCases: number;
  casesSubmitted: number;
  approvals: number;
  totalFundingRequested: number;
  fundingPipeline: number;
  estimatedRevenue: number;
}

export interface PipelineStage {
  stage: string;
  count: number;
}

export interface LenderPerformance {
  lenderName: string;
  casesSent: number;
  approvals: number;
  approvalRate: number;
}

export interface RiskMetrics {
  avgBBRSScore: number;
  avgMonthlyTurnover: number;
  avgLoanSize: number;
  highRiskCases: number;
  fraudAlerts: number;
}

export interface OperationalActivity {
  casesToday: number;
  reportsToday: number;
  analysesToday: number;
  activeUsers: number;
}

export interface TopDeal {
  id: string;
  companyName: string;
  loanAmount: number;
  recommendedLender: string;
  status: string;
}

export interface MonthlyFunding {
  month: string;
  label: string;
  amount: number;
}

const SUCCESS_FEE_PCT = 0.02; // 2% success fee

// Terminal statuses that are no longer active in the pipeline
const TERMINAL_STATUSES = ['approved', 'declined', 'closed', 'dropped'];

function useKPIs() {
  return useQuery({
    queryKey: ['executive-kpis'],
    queryFn: async (): Promise<ExecutiveKPIs> => {
      // Fetch cases and lender results in parallel for accurate funding data
      const [casesRes, lenderRes] = await Promise.all([
        supabase
          .from('assessment_cases')
          .select('id, status, estimated_annual_turnover, normalized_turnover'),
        supabase
          .from('assessment_lender_results')
          .select('case_id, recommended_limit, eligibility_status'),
      ]);

      if (casesRes.error) throw casesRes.error;
      const all = casesRes.data || [];
      const lenderResults = lenderRes.data || [];

      // Build a map of best recommended limit per case
      const bestLimitPerCase = new Map<string, number>();
      for (const lr of lenderResults) {
        const current = bestLimitPerCase.get(lr.case_id) || 0;
        const limit = lr.recommended_limit ?? 0;
        if (limit > current) bestLimitPerCase.set(lr.case_id, limit);
      }

      // Active = not in terminal status
      const activeCases = all.filter(c => !TERMINAL_STATUSES.includes(c.status)).length;

      // Submitted = cases that have reached submission stage or beyond
      const submitted = all.filter(c =>
        ['submitted', 'under_review', 'approved', 'declined'].includes(c.status)
      ).length;

      // Approvals
      const approved = all.filter(c => c.status === 'approved');

      // Total funding requested = sum of best available amount per case
      const getFundingAmount = (c: typeof all[0]) => {
        const lenderLimit = bestLimitPerCase.get(c.id) || 0;
        return Math.max(
          lenderLimit,
          c.normalized_turnover ?? 0,
          c.estimated_annual_turnover ?? 0
        );
      };

      const totalFunding = all.reduce((sum, c) => sum + getFundingAmount(c), 0);

      // Pipeline = active cases funding
      const pipeline = all
        .filter(c => !TERMINAL_STATUSES.includes(c.status))
        .reduce((sum, c) => sum + getFundingAmount(c), 0);

      // Approved funding for revenue calc
      const approvedFunding = approved.reduce((sum, c) => sum + getFundingAmount(c), 0);

      return {
        totalCases: all.length,
        activeCases,
        casesSubmitted: submitted,
        approvals: approved.length,
        totalFundingRequested: totalFunding,
        fundingPipeline: pipeline,
        estimatedRevenue: approvedFunding * SUCCESS_FEE_PCT,
      };
    },
    staleTime: 60_000,
  });
}

function usePipeline() {
  return useQuery({
    queryKey: ['executive-pipeline'],
    queryFn: async (): Promise<PipelineStage[]> => {
      const { data, error } = await supabase
        .from('assessment_cases')
        .select('status, analysis_completed, lenders_run_completed, ai_matching_completed');

      if (error) throw error;
      const cases = data || [];

      // Ordered stages for the funnel
      const stages = [
        'New Case',
        'Documents Uploaded',
        'Analysis Complete',
        'Lender Match',
        'Submitted',
        'Approved',
      ];
      const stageMap: Record<string, number> = {};
      for (const s of stages) stageMap[s] = 0;

      for (const c of cases) {
        // Terminal negative statuses are excluded from pipeline funnel
        if (['declined', 'closed', 'dropped'].includes(c.status)) continue;

        if (c.status === 'approved') {
          stageMap['Approved']++;
        } else if (['submitted', 'under_review'].includes(c.status)) {
          stageMap['Submitted']++;
        } else if (c.lenders_run_completed || c.ai_matching_completed) {
          stageMap['Lender Match']++;
        } else if (c.analysis_completed) {
          stageMap['Analysis Complete']++;
        } else if (c.status === 'in_progress') {
          stageMap['Documents Uploaded']++;
        } else {
          stageMap['New Case']++;
        }
      }

      return stages.map(stage => ({ stage, count: stageMap[stage] }));
    },
    staleTime: 60_000,
  });
}

function useLenderPerformance() {
  return useQuery({
    queryKey: ['executive-lender-performance'],
    queryFn: async (): Promise<LenderPerformance[]> => {
      const { data, error } = await supabase
        .from('assessment_lender_results')
        .select('lender_name, eligibility_status');

      if (error) throw error;
      const results = data || [];

      const map = new Map<string, { sent: number; approved: number }>();
      for (const r of results) {
        const name = (r.lender_name || '').trim();
        if (!name) continue; // Skip records with empty lender name

        const entry = map.get(name) || { sent: 0, approved: 0 };
        entry.sent++;
        // Check eligibility_status case-insensitively
        const status = (r.eligibility_status || '').toLowerCase();
        if (status === 'eligible' || status === 'approved') {
          entry.approved++;
        }
        map.set(name, entry);
      }

      return Array.from(map.entries())
        .map(([lenderName, { sent, approved }]) => ({
          lenderName,
          casesSent: sent,
          approvals: approved,
          approvalRate: sent > 0 ? Math.round((approved / sent) * 100) : 0,
        }))
        .sort((a, b) => b.casesSent - a.casesSent);
    },
    staleTime: 60_000,
  });
}

function useRiskMetrics() {
  return useQuery({
    queryKey: ['executive-risk-metrics'],
    queryFn: async (): Promise<RiskMetrics> => {
      const [fraudRes, bankRes, lenderRes] = await Promise.all([
        supabase.from('fraud_detection_results').select('fraud_risk_score, fraud_risk_category'),
        supabase.from('bank_analysis_consolidated').select('total_monthly_credit'),
        supabase.from('assessment_lender_results').select('recommended_limit'),
      ]);

      const fraudData = (fraudRes.data || []).filter(f => f.fraud_risk_score != null);
      const bankData = (bankRes.data || []).filter(b => (b.total_monthly_credit ?? 0) > 0);
      const lenderData = (lenderRes.data || []).filter(l => (l.recommended_limit ?? 0) > 0);

      // BBRS: fraud_risk_score is 0-100, higher = safer
      const avgBBRS = fraudData.length > 0
        ? Math.round(fraudData.reduce((s, f) => s + (f.fraud_risk_score ?? 0), 0) / fraudData.length)
        : 0;

      const avgTurnover = bankData.length > 0
        ? Math.round(bankData.reduce((s, b) => s + (b.total_monthly_credit ?? 0), 0) / bankData.length)
        : 0;

      // Average loan size from lender recommended limits
      const avgLoan = lenderData.length > 0
        ? Math.round(lenderData.reduce((s, l) => s + (l.recommended_limit ?? 0), 0) / lenderData.length)
        : 0;

      const highRisk = fraudData.filter(f =>
        f.fraud_risk_category === 'high' || f.fraud_risk_category === 'critical'
      ).length;
      const alerts = fraudData.filter(f => f.fraud_risk_category === 'critical').length;

      return {
        avgBBRSScore: avgBBRS,
        avgMonthlyTurnover: avgTurnover,
        avgLoanSize: avgLoan,
        highRiskCases: highRisk,
        fraudAlerts: alerts,
      };
    },
    staleTime: 60_000,
  });
}

function useOperationalActivity() {
  return useQuery({
    queryKey: ['executive-ops-activity'],
    queryFn: async (): Promise<OperationalActivity> => {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayISO = todayStart.toISOString();

      const [casesRes, reportsRes, analysesRes, activityRes] = await Promise.all([
        supabase.from('assessment_cases').select('id', { count: 'exact', head: true }).gte('created_at', todayISO),
        supabase.from('case_reports').select('id', { count: 'exact', head: true }).gte('generated_at', todayISO),
        supabase.from('bank_analysis_results').select('id', { count: 'exact', head: true }).gte('created_at', todayISO),
        supabase.from('case_activity_log').select('done_by').gte('done_at', todayISO),
      ]);

      const uniqueUsers = new Set(
        (activityRes.data || []).map(a => a.done_by).filter(Boolean)
      );

      return {
        casesToday: casesRes.count ?? 0,
        reportsToday: reportsRes.count ?? 0,
        analysesToday: analysesRes.count ?? 0,
        activeUsers: uniqueUsers.size,
      };
    },
    staleTime: 30_000,
  });
}

function useTopDeals() {
  return useQuery({
    queryKey: ['executive-top-deals'],
    queryFn: async (): Promise<TopDeal[]> => {
      // Fetch cases with positive turnover, ordered desc
      const { data, error } = await supabase
        .from('assessment_cases')
        .select('id, company_name, estimated_annual_turnover, normalized_turnover, status')
        .not('estimated_annual_turnover', 'is', null)
        .gt('estimated_annual_turnover', 0)
        .order('estimated_annual_turnover', { ascending: false })
        .limit(10);

      if (error) throw error;
      const cases = data || [];
      if (cases.length === 0) return [];

      // Get best lender recommendation per case
      const caseIds = cases.map(c => c.id);
      const { data: lenderData } = await supabase
        .from('assessment_lender_results')
        .select('case_id, lender_name, recommended_limit')
        .in('case_id', caseIds)
        .order('recommended_limit', { ascending: false });

      const lenderMap = new Map<string, string>();
      for (const l of (lenderData || [])) {
        if (!lenderMap.has(l.case_id)) {
          lenderMap.set(l.case_id, l.lender_name || '—');
        }
      }

      return cases.map(c => ({
        id: c.id,
        companyName: c.company_name || 'Unnamed Company',
        loanAmount: c.normalized_turnover ?? c.estimated_annual_turnover ?? 0,
        recommendedLender: lenderMap.get(c.id) || '—',
        status: c.status,
      }));
    },
    staleTime: 60_000,
  });
}

function useMonthlyFunding() {
  return useQuery({
    queryKey: ['executive-monthly-funding'],
    queryFn: async (): Promise<MonthlyFunding[]> => {
      const { data, error } = await supabase
        .from('assessment_cases')
        .select('created_at, estimated_annual_turnover')
        .not('estimated_annual_turnover', 'is', null)
        .gt('estimated_annual_turnover', 0)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const monthMap = new Map<string, number>();
      for (const c of (data || [])) {
        const d = new Date(c.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthMap.set(key, (monthMap.get(key) || 0) + (c.estimated_annual_turnover ?? 0));
      }

      const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      return Array.from(monthMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-12)
        .map(([month, amount]) => {
          const [year, m] = month.split('-');
          return {
            month,
            label: `${MONTH_NAMES[parseInt(m, 10) - 1]} ${year.slice(2)}`,
            amount,
          };
        });
    },
    staleTime: 60_000,
  });
}

export function useExecutiveDashboard() {
  const kpis = useKPIs();
  const pipeline = usePipeline();
  const lenderPerformance = useLenderPerformance();
  const riskMetrics = useRiskMetrics();
  const opsActivity = useOperationalActivity();
  const topDeals = useTopDeals();
  const monthlyFunding = useMonthlyFunding();

  const isLoading =
    kpis.isLoading ||
    pipeline.isLoading ||
    lenderPerformance.isLoading ||
    riskMetrics.isLoading ||
    opsActivity.isLoading ||
    topDeals.isLoading ||
    monthlyFunding.isLoading;

  const hasError =
    kpis.isError ||
    pipeline.isError ||
    lenderPerformance.isError;

  return {
    kpis: kpis.data,
    pipeline: pipeline.data,
    lenderPerformance: lenderPerformance.data,
    riskMetrics: riskMetrics.data,
    opsActivity: opsActivity.data,
    topDeals: topDeals.data,
    monthlyFunding: monthlyFunding.data,
    isLoading,
    hasError,
    refetch: () => {
      kpis.refetch();
      pipeline.refetch();
      lenderPerformance.refetch();
      riskMetrics.refetch();
      opsActivity.refetch();
      topDeals.refetch();
      monthlyFunding.refetch();
    },
  };
}
