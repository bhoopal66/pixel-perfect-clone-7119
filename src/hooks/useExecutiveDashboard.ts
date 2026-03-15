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
  avgFraudScore: number;
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
  amount: number;
}

const SUCCESS_FEE_PCT = 0.02; // 2% success fee

function useKPIs() {
  return useQuery({
    queryKey: ['executive-kpis'],
    queryFn: async (): Promise<ExecutiveKPIs> => {
      const { data: cases, error } = await supabase
        .from('assessment_cases')
        .select('status, estimated_annual_turnover, normalized_turnover');

      if (error) throw error;
      const all = cases || [];

      const activeCases = all.filter(c =>
        !['approved', 'declined', 'closed'].includes(c.status)
      ).length;

      const submitted = all.filter(c =>
        ['submitted', 'under_review', 'approved', 'declined'].includes(c.status)
      ).length;

      const approved = all.filter(c => c.status === 'approved');

      const totalFunding = all.reduce(
        (sum, c) => sum + (c.estimated_annual_turnover || 0), 0
      );

      const approvedFunding = approved.reduce(
        (sum, c) => sum + (c.normalized_turnover || c.estimated_annual_turnover || 0), 0
      );

      const pipeline = all
        .filter(c => !['approved', 'declined', 'closed'].includes(c.status))
        .reduce((sum, c) => sum + (c.estimated_annual_turnover || 0), 0);

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

      const stageMap: Record<string, number> = {
        'New Case': 0,
        'Documents Uploaded': 0,
        'Analysis Complete': 0,
        'Lender Match': 0,
        'Submitted': 0,
        'Approved': 0,
      };

      for (const c of cases) {
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

      return Object.entries(stageMap).map(([stage, count]) => ({ stage, count }));
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
        const name = r.lender_name || 'Unknown';
        const entry = map.get(name) || { sent: 0, approved: 0 };
        entry.sent++;
        if (r.eligibility_status === 'eligible') entry.approved++;
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
      const [fraudRes, bankRes, caseRes] = await Promise.all([
        supabase.from('fraud_detection_results').select('fraud_risk_score, fraud_risk_category'),
        supabase.from('bank_analysis_consolidated').select('total_monthly_credit'),
        supabase.from('assessment_cases').select('estimated_annual_turnover'),
      ]);

      const fraudData = fraudRes.data || [];
      const bankData = bankRes.data || [];
      const caseData = caseRes.data || [];

      const avgFraud = fraudData.length > 0
        ? Math.round(fraudData.reduce((s, f) => s + (f.fraud_risk_score || 0), 0) / fraudData.length)
        : 0;

      const avgTurnover = bankData.length > 0
        ? Math.round(bankData.reduce((s, b) => s + (b.total_monthly_credit || 0), 0) / bankData.length)
        : 0;

      const amounts = caseData
        .map(c => c.estimated_annual_turnover || 0)
        .filter(a => a > 0);
      const avgLoan = amounts.length > 0
        ? Math.round(amounts.reduce((s, a) => s + a, 0) / amounts.length)
        : 0;

      const highRisk = fraudData.filter(f => f.fraud_risk_category === 'high').length;
      const alerts = fraudData.filter(f =>
        f.fraud_risk_category === 'high' || f.fraud_risk_category === 'critical'
      ).length;

      return { avgFraudScore: avgFraud, avgMonthlyTurnover: avgTurnover, avgLoanSize: avgLoan, highRiskCases: highRisk, fraudAlerts: alerts };
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

      const [casesRes, reportsRes, analysesRes] = await Promise.all([
        supabase.from('assessment_cases').select('id', { count: 'exact', head: true }).gte('created_at', todayISO),
        supabase.from('case_reports').select('id', { count: 'exact', head: true }).gte('generated_at', todayISO),
        supabase.from('bank_analysis_results').select('id', { count: 'exact', head: true }).gte('created_at', todayISO),
      ]);

      // Active users = distinct users who created cases (simplified)
      const { data: activeData } = await supabase
        .from('case_activity_log')
        .select('done_by')
        .gte('done_at', todayISO);

      const uniqueUsers = new Set((activeData || []).map(a => a.done_by).filter(Boolean));

      return {
        casesToday: casesRes.count || 0,
        reportsToday: reportsRes.count || 0,
        analysesToday: analysesRes.count || 0,
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
      const { data, error } = await supabase
        .from('assessment_cases')
        .select('id, company_name, estimated_annual_turnover, status')
        .order('estimated_annual_turnover', { ascending: false })
        .limit(10);

      if (error) throw error;

      // Get lender recommendations for these cases
      const caseIds = (data || []).map(c => c.id);
      const { data: lenderData } = caseIds.length > 0
        ? await supabase
            .from('assessment_lender_results')
            .select('case_id, lender_name, recommended_limit')
            .in('case_id', caseIds)
            .order('recommended_limit', { ascending: false })
        : { data: [] };

      const lenderMap = new Map<string, string>();
      for (const l of (lenderData || [])) {
        if (!lenderMap.has(l.case_id)) {
          lenderMap.set(l.case_id, l.lender_name);
        }
      }

      return (data || []).map(c => ({
        id: c.id,
        companyName: c.company_name || 'N/A',
        loanAmount: c.estimated_annual_turnover || 0,
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
        .order('created_at', { ascending: true });

      if (error) throw error;

      const monthMap = new Map<string, number>();
      for (const c of (data || [])) {
        const d = new Date(c.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthMap.set(key, (monthMap.get(key) || 0) + (c.estimated_annual_turnover || 0));
      }

      return Array.from(monthMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-12)
        .map(([month, amount]) => ({ month, amount }));
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

  const isLoading = kpis.isLoading || pipeline.isLoading || lenderPerformance.isLoading;

  return {
    kpis: kpis.data,
    pipeline: pipeline.data,
    lenderPerformance: lenderPerformance.data,
    riskMetrics: riskMetrics.data,
    opsActivity: opsActivity.data,
    topDeals: topDeals.data,
    monthlyFunding: monthlyFunding.data,
    isLoading,
  };
}
