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

const SUCCESS_FEE_PCT = 0.02;

function useKPIs() {
  return useQuery({
    queryKey: ['executive-kpis'],
    queryFn: async (): Promise<ExecutiveKPIs> => {
      const { data, error } = await supabase.rpc('get_executive_kpis');
      if (error) throw error;
      const d = data as any;
      const approvedFunding = d.approved_funding ?? 0;
      return {
        totalCases: d.total_cases ?? 0,
        activeCases: d.active_cases ?? 0,
        casesSubmitted: d.cases_submitted ?? 0,
        approvals: d.approvals ?? 0,
        totalFundingRequested: d.total_funding_requested ?? 0,
        fundingPipeline: d.funding_pipeline ?? 0,
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
      const { data, error } = await supabase.rpc('get_executive_pipeline');
      if (error) throw error;
      return ((data as any[]) || []).map((r: any) => ({
        stage: r.stage,
        count: r.count ?? 0,
      }));
    },
    staleTime: 60_000,
  });
}

function useLenderPerformance() {
  return useQuery({
    queryKey: ['executive-lender-performance'],
    queryFn: async (): Promise<LenderPerformance[]> => {
      const { data, error } = await supabase.rpc('get_executive_lender_performance');
      if (error) throw error;
      return ((data as any[]) || []).map((r: any) => ({
        lenderName: r.lender_name,
        casesSent: r.cases_sent ?? 0,
        approvals: r.approvals ?? 0,
        approvalRate: r.approval_rate ?? 0,
      }));
    },
    staleTime: 60_000,
  });
}

function useRiskMetrics() {
  return useQuery({
    queryKey: ['executive-risk-metrics'],
    queryFn: async (): Promise<RiskMetrics> => {
      const { data, error } = await supabase.rpc('get_executive_risk_metrics');
      if (error) throw error;
      const d = data as any;
      return {
        avgBBRSScore: d.avg_bbrs_score ?? 0,
        avgMonthlyTurnover: d.avg_monthly_turnover ?? 0,
        avgLoanSize: d.avg_loan_size ?? 0,
        highRiskCases: d.high_risk_cases ?? 0,
        fraudAlerts: d.fraud_alerts ?? 0,
      };
    },
    staleTime: 60_000,
  });
}

function useOperationalActivity() {
  return useQuery({
    queryKey: ['executive-ops-activity'],
    queryFn: async (): Promise<OperationalActivity> => {
      const { data, error } = await supabase.rpc('get_executive_ops_activity');
      if (error) throw error;
      const d = data as any;
      return {
        casesToday: d.cases_today ?? 0,
        reportsToday: d.reports_today ?? 0,
        analysesToday: d.analyses_today ?? 0,
        activeUsers: d.active_users ?? 0,
      };
    },
    staleTime: 30_000,
  });
}

function useTopDeals() {
  return useQuery({
    queryKey: ['executive-top-deals'],
    queryFn: async (): Promise<TopDeal[]> => {
      const { data, error } = await supabase.rpc('get_executive_top_deals');
      if (error) throw error;
      return ((data as any[]) || []).map((r: any) => ({
        id: r.id,
        companyName: r.company_name ?? 'Unnamed Company',
        loanAmount: r.loan_amount ?? 0,
        recommendedLender: r.recommended_lender ?? '—',
        status: r.status,
      }));
    },
    staleTime: 60_000,
  });
}

function useMonthlyFunding() {
  return useQuery({
    queryKey: ['executive-monthly-funding'],
    queryFn: async (): Promise<MonthlyFunding[]> => {
      const { data, error } = await supabase.rpc('get_executive_monthly_funding');
      if (error) throw error;
      return ((data as any[]) || []).map((r: any) => ({
        month: r.month,
        label: r.label,
        amount: r.amount ?? 0,
      }));
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
