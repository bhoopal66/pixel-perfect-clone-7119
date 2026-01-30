// Dashboard Types for Supervisor and Admin Dashboards

export type RAGStatus = 'green' | 'amber' | 'red';

export interface PipelineMetrics {
  draft: number;
  in_process: number;
  additional_info_required: number;
  submitted_to_lender: number;
  approved: number;
  declined: number;
  on_hold: number;
  dropped: number;
  closed: number;
}

export interface StageAgingRecord {
  case_id: string;
  case_number: string;
  company_name: string;
  agent_name: string;
  current_stage: string | null;
  status: string;
  days_in_stage: number;
  rag_status: RAGStatus;
  action_required_by: string | null;
  lender_name?: string;
}

export interface ROAccountability {
  ro_name: string;
  ro_email: string;
  pending_cases: number;
  avg_tat_days: number;
  red_cases: number;
  approval_rate: number;
}

export interface AgentProductivity {
  agent_id: string;
  agent_name: string;
  agent_code: string;
  cases_created: number;
  cases_submitted: number;
  cases_approved: number;
  avg_days_to_submit: number;
  drop_reasons: Record<string, number>;
}

export interface LenderPerformance {
  lender_id: string;
  lender_name: string;
  short_code: string;
  total_applications: number;
  approval_rate: number;
  avg_decision_tat: number;
  decline_reasons: Record<string, number>;
  drop_reasons: Record<string, number>;
}

export interface SupervisorPipeline {
  supervisor_id: string;
  supervisor_name: string;
  metrics: PipelineMetrics;
  avg_tat: number;
  red_cases: number;
}

// Lender Configuration Types
export interface LenderEligibilityRules {
  max_multiplier: number;
  min_loan_amount: number;
  max_loan_amount: number | null;
  pos_cap_percent: number;
  abcd_fee_percent: number;
  reduced_multiplier: number;
  min_turnover?: number;
  pos_variant?: 'RAK_POS' | 'WIO_POS' | 'STANDARD';
  eligibility_min_of?: string[];
  variance_thresholds?: {
    eligible: number;
    reduced: number;
  };
}

export interface LenderDocRequirements {
  mandatory: string[];
  optional: string[];
  conditional?: Record<string, string[]>;
}

export interface WorkflowStage {
  order: number;
  stage: string;
  sla_days: number;
  required_docs: string[];
}

export interface LenderWorkflow {
  id: string;
  lender_id: string;
  workflow_name: string;
  stages: WorkflowStage[];
  required_docs_by_stage: Record<string, string[]>;
  status_mappings: {
    pending_stages: string[];
    active_stages: string[];
    final_stages: string[];
  };
  include_account_opened: boolean;
}

export interface Lender {
  id: string;
  name: string;
  short_code: string;
  lender_type: 'bank' | 'fintech' | 'nbfc';
  is_active: boolean;
  logo_url: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  eligibility_rules: LenderEligibilityRules;
  document_requirements: LenderDocRequirements;
  created_at: string;
  updated_at: string;
}

// Stage display labels
export const PROCESS_STAGE_LABELS: Record<string, string> = {
  email_sent: 'Email Sent',
  ro_assigned: 'RO Assigned',
  link_shared: 'Link Shared',
  link_completed: 'Link Completed',
  video_verification: 'Video Verification',
  signature_submitted: 'Signature Submitted',
  ro_confirmation: 'RO Confirmation',
  account_opened: 'Account Opened'
};

export const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  in_process: 'In Process',
  additional_info_required: 'Additional Info Required',
  submitted_to_lender: 'Submitted to Lender',
  approved: 'Approved',
  declined: 'Declined',
  dropped: 'Dropped',
  on_hold: 'On Hold',
  closed: 'Closed'
};

// RAG status configuration
export const RAG_CONFIG = {
  default_sla: 3,
  amber_threshold: 1, // SLA + 1
  red_threshold: 2,   // SLA + 2
};

export function calculateRAGStatus(daysInStage: number, sla: number = RAG_CONFIG.default_sla): RAGStatus {
  if (daysInStage <= sla) return 'green';
  if (daysInStage <= sla + RAG_CONFIG.amber_threshold) return 'amber';
  return 'red';
}
