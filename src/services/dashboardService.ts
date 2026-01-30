import { supabase } from '@/integrations/supabase/client';
import type { 
  PipelineMetrics, 
  StageAgingRecord, 
  AgentProductivity, 
  LenderPerformance,
  SupervisorPipeline,
  ROAccountability,
  calculateRAGStatus 
} from '@/types/dashboard.types';

export const DashboardService = {
  // Get pipeline metrics for cases
  async getPipelineMetrics(supervisorId?: string): Promise<PipelineMetrics> {
    let query = supabase.from('onboarding_cases').select('status');
    
    if (supervisorId) {
      query = query.eq('supervisor_id', supervisorId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    
    const metrics: PipelineMetrics = {
      draft: 0,
      in_process: 0,
      additional_info_required: 0,
      submitted_to_lender: 0,
      approved: 0,
      declined: 0,
      on_hold: 0,
      dropped: 0,
      closed: 0
    };
    
    (data || []).forEach(row => {
      const status = row.status as keyof PipelineMetrics;
      if (status in metrics) {
        metrics[status]++;
      }
    });
    
    return metrics;
  },

  // Get stage aging with RAG status
  async getStageAging(supervisorId?: string): Promise<StageAgingRecord[]> {
    let query = supabase
      .from('onboarding_cases')
      .select(`
        id,
        case_number,
        status,
        process_stage,
        days_in_current_stage,
        rag_status,
        action_required_by,
        agent_id,
        agents!onboarding_cases_agent_id_fkey(full_name),
        applicant_businesses(company_legal_name)
      `)
      .not('status', 'in', '("closed","approved","declined","dropped")');
    
    if (supervisorId) {
      query = query.eq('supervisor_id', supervisorId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    
    return (data || []).map(row => ({
      case_id: row.id,
      case_number: row.case_number || 'N/A',
      company_name: (row.applicant_businesses as any)?.company_legal_name || 'Unknown',
      agent_name: (row.agents as any)?.full_name || 'Unassigned',
      current_stage: row.process_stage,
      status: row.status,
      days_in_stage: row.days_in_current_stage || 0,
      rag_status: (row.rag_status || 'green') as 'green' | 'amber' | 'red',
      action_required_by: row.action_required_by
    }));
  },

  // Get RO accountability metrics
  async getROAccountability(): Promise<ROAccountability[]> {
    const { data, error } = await supabase
      .from('case_lender_applications')
      .select(`
        assigned_ro_name,
        assigned_ro_email,
        lender_status,
        decision,
        days_in_stage
      `)
      .not('assigned_ro_name', 'is', null);
    
    if (error) throw error;
    
    // Group by RO
    const roMap = new Map<string, {
      pending: number;
      tatDays: number[];
      red: number;
      approved: number;
      total: number;
      email: string;
    }>();
    
    (data || []).forEach(row => {
      const roName = row.assigned_ro_name;
      if (!roName) return;
      
      if (!roMap.has(roName)) {
        roMap.set(roName, { 
          pending: 0, 
          tatDays: [], 
          red: 0, 
          approved: 0, 
          total: 0,
          email: row.assigned_ro_email || ''
        });
      }
      
      const ro = roMap.get(roName)!;
      ro.total++;
      
      if (!['Approved', 'Declined', 'Dropped'].includes(row.lender_status || '')) {
        ro.pending++;
      }
      
      if (row.days_in_stage) {
        ro.tatDays.push(row.days_in_stage);
        if (row.days_in_stage > 5) ro.red++; // Red if > 5 days
      }
      
      if (row.decision === 'Approved') {
        ro.approved++;
      }
    });
    
    return Array.from(roMap.entries()).map(([name, data]) => ({
      ro_name: name,
      ro_email: data.email,
      pending_cases: data.pending,
      avg_tat_days: data.tatDays.length > 0 
        ? Math.round(data.tatDays.reduce((a, b) => a + b, 0) / data.tatDays.length * 10) / 10
        : 0,
      red_cases: data.red,
      approval_rate: data.total > 0 ? Math.round(data.approved / data.total * 100) : 0
    }));
  },

  // Get agent productivity
  async getAgentProductivity(supervisorId?: string): Promise<AgentProductivity[]> {
    // Get all agents
    const { data: agents, error: agentError } = await supabase
      .from('agents')
      .select('id, full_name, agent_code')
      .eq('is_active', true);
    
    if (agentError) throw agentError;
    
    // Get cases with agent assignments
    let casesQuery = supabase
      .from('onboarding_cases')
      .select('agent_id, status, created_at, submitted_at, drop_reason');
    
    if (supervisorId) {
      casesQuery = casesQuery.eq('supervisor_id', supervisorId);
    }
    
    const { data: cases, error: caseError } = await casesQuery;
    if (caseError) throw caseError;
    
    // Calculate metrics per agent
    return (agents || []).map(agent => {
      const agentCases = (cases || []).filter(c => c.agent_id === agent.id);
      const submittedCases = agentCases.filter(c => c.submitted_at);
      const approvedCases = agentCases.filter(c => c.status === 'approved');
      const droppedCases = agentCases.filter(c => c.status === 'dropped');
      
      // Calculate avg days to submit
      const submitDays = submittedCases
        .filter(c => c.created_at && c.submitted_at)
        .map(c => {
          const created = new Date(c.created_at);
          const submitted = new Date(c.submitted_at!);
          return Math.ceil((submitted.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
        });
      
      // Count drop reasons
      const dropReasons: Record<string, number> = {};
      droppedCases.forEach(c => {
        const reason = c.drop_reason || 'Unspecified';
        dropReasons[reason] = (dropReasons[reason] || 0) + 1;
      });
      
      return {
        agent_id: agent.id,
        agent_name: agent.full_name,
        agent_code: agent.agent_code,
        cases_created: agentCases.length,
        cases_submitted: submittedCases.length,
        cases_approved: approvedCases.length,
        avg_days_to_submit: submitDays.length > 0
          ? Math.round(submitDays.reduce((a, b) => a + b, 0) / submitDays.length * 10) / 10
          : 0,
        drop_reasons: dropReasons
      };
    });
  },

  // Get lender performance (Admin only)
  async getLenderPerformance(): Promise<LenderPerformance[]> {
    // Get lenders
    const { data: lenders, error: lenderError } = await supabase
      .from('onboarding_lenders')
      .select('id, name, short_code')
      .eq('is_active', true);
    
    if (lenderError) throw lenderError;
    
    // Get lender applications
    const { data: applications, error: appError } = await supabase
      .from('case_lender_applications')
      .select('lender_id, decision, lender_remarks, days_in_stage, created_at, decision_date');
    
    if (appError) throw appError;
    
    return (lenders || []).map(lender => {
      const lenderApps = (applications || []).filter(a => a.lender_id === lender.id);
      const decidedApps = lenderApps.filter(a => a.decision);
      const approvedApps = decidedApps.filter(a => a.decision === 'Approved');
      const declinedApps = decidedApps.filter(a => a.decision === 'Declined');
      const droppedApps = decidedApps.filter(a => a.decision === 'Dropped');
      
      // Calculate TAT for decided applications
      const tatDays = decidedApps
        .filter(a => a.created_at && a.decision_date)
        .map(a => {
          const created = new Date(a.created_at);
          const decided = new Date(a.decision_date!);
          return Math.ceil((decided.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
        });
      
      // Group decline/drop reasons
      const declineReasons: Record<string, number> = {};
      declinedApps.forEach(a => {
        const reason = a.lender_remarks || 'Unspecified';
        declineReasons[reason] = (declineReasons[reason] || 0) + 1;
      });
      
      const dropReasons: Record<string, number> = {};
      droppedApps.forEach(a => {
        const reason = a.lender_remarks || 'Unspecified';
        dropReasons[reason] = (dropReasons[reason] || 0) + 1;
      });
      
      return {
        lender_id: lender.id,
        lender_name: lender.name,
        short_code: lender.short_code,
        total_applications: lenderApps.length,
        approval_rate: decidedApps.length > 0
          ? Math.round(approvedApps.length / decidedApps.length * 100)
          : 0,
        avg_decision_tat: tatDays.length > 0
          ? Math.round(tatDays.reduce((a, b) => a + b, 0) / tatDays.length * 10) / 10
          : 0,
        decline_reasons: declineReasons,
        drop_reasons: dropReasons
      };
    });
  },

  // Get supervisor pipelines (Admin only)
  async getSupervisorPipelines(): Promise<SupervisorPipeline[]> {
    // Get all supervisors from profiles with supervisor role
    const { data: supervisors, error: supError } = await supabase
      .from('profiles')
      .select('user_id, full_name');
    
    if (supError) throw supError;
    
    // For each supervisor, get their pipeline
    const pipelines: SupervisorPipeline[] = [];
    
    for (const sup of (supervisors || [])) {
      const { data: cases } = await supabase
        .from('onboarding_cases')
        .select('status, days_in_current_stage, rag_status')
        .eq('supervisor_id', sup.user_id);
      
      if (!cases || cases.length === 0) continue;
      
      const metrics: PipelineMetrics = {
        draft: 0,
        in_process: 0,
        additional_info_required: 0,
        submitted_to_lender: 0,
        approved: 0,
        declined: 0,
        on_hold: 0,
        dropped: 0,
        closed: 0
      };
      
      let totalDays = 0;
      let redCount = 0;
      
      cases.forEach(c => {
        const status = c.status as keyof PipelineMetrics;
        if (status in metrics) metrics[status]++;
        totalDays += c.days_in_current_stage || 0;
        if (c.rag_status === 'red') redCount++;
      });
      
      pipelines.push({
        supervisor_id: sup.user_id,
        supervisor_name: sup.full_name || 'Unknown',
        metrics,
        avg_tat: cases.length > 0 ? Math.round(totalDays / cases.length * 10) / 10 : 0,
        red_cases: redCount
      });
    }
    
    return pipelines.filter(p => 
      Object.values(p.metrics).some(v => v > 0)
    );
  }
};
