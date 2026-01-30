/**
 * Frontend TypeScript types matching the Supabase database schema.
 * These provide type-safe interfaces for all database tables.
 */

import type { Database } from '@/integrations/supabase/types';

// =====================================================
// ENUM TYPES (from database)
// =====================================================

export type CaseStatus = Database['public']['Enums']['case_status'];
export type ProcessStage = Database['public']['Enums']['process_stage'];
export type RAGStatus = Database['public']['Enums']['rag_status'];
export type DocumentStatus = Database['public']['Enums']['document_status'];
export type LenderType = Database['public']['Enums']['lender_type'];
export type ActionRequiredBy = Database['public']['Enums']['action_required_by'];
export type AppRole = Database['public']['Enums']['app_role'];

// Enum value arrays for UI selects/dropdowns
export const CASE_STATUS_VALUES: CaseStatus[] = [
  'draft',
  'in_process',
  'additional_info_required',
  'submitted_to_lender',
  'approved',
  'declined',
  'dropped',
  'on_hold',
  'closed'
];

export const PROCESS_STAGE_VALUES: ProcessStage[] = [
  'email_sent',
  'ro_assigned',
  'link_shared',
  'link_completed',
  'video_verification',
  'signature_submitted',
  'ro_confirmation',
  'account_opened'
];

export const RAG_STATUS_VALUES: RAGStatus[] = ['green', 'amber', 'red'];

export const DOCUMENT_STATUS_VALUES: DocumentStatus[] = ['pending', 'uploaded', 'verified', 'rejected'];

export const LENDER_TYPE_VALUES: LenderType[] = ['bank', 'fintech', 'nbfc'];

export const ACTION_REQUIRED_BY_VALUES: ActionRequiredBy[] = ['client', 'agent', 'bank', 'supervisor', 'none'];

export const APP_ROLE_VALUES: AppRole[] = ['admin', 'user', 'super_admin', 'supervisor', 'coordinator'];

// =====================================================
// TABLE ROW TYPES (direct from database)
// =====================================================

export type AgentRow = Database['public']['Tables']['agents']['Row'];
export type AgentInsert = Database['public']['Tables']['agents']['Insert'];
export type AgentUpdate = Database['public']['Tables']['agents']['Update'];

export type ApplicantBusinessRow = Database['public']['Tables']['applicant_businesses']['Row'];
export type ApplicantBusinessInsert = Database['public']['Tables']['applicant_businesses']['Insert'];
export type ApplicantBusinessUpdate = Database['public']['Tables']['applicant_businesses']['Update'];

export type BusinessOwnerRow = Database['public']['Tables']['business_owners']['Row'];
export type BusinessOwnerInsert = Database['public']['Tables']['business_owners']['Insert'];
export type BusinessOwnerUpdate = Database['public']['Tables']['business_owners']['Update'];

export type CaseLenderApplicationRow = Database['public']['Tables']['case_lender_applications']['Row'];
export type CaseLenderApplicationInsert = Database['public']['Tables']['case_lender_applications']['Insert'];
export type CaseLenderApplicationUpdate = Database['public']['Tables']['case_lender_applications']['Update'];

export type CaseRow = Database['public']['Tables']['cases']['Row'];
export type CaseInsert = Database['public']['Tables']['cases']['Insert'];
export type CaseUpdate = Database['public']['Tables']['cases']['Update'];

export type FinancialInputRow = Database['public']['Tables']['financial_inputs']['Row'];
export type FinancialInputInsert = Database['public']['Tables']['financial_inputs']['Insert'];
export type FinancialInputUpdate = Database['public']['Tables']['financial_inputs']['Update'];

export type LoanCaseRow = Database['public']['Tables']['loan_cases']['Row'];
export type LoanCaseInsert = Database['public']['Tables']['loan_cases']['Insert'];
export type LoanCaseUpdate = Database['public']['Tables']['loan_cases']['Update'];

export type LoanEligibilityRow = Database['public']['Tables']['loan_eligibility']['Row'];
export type LoanEligibilityInsert = Database['public']['Tables']['loan_eligibility']['Insert'];
export type LoanEligibilityUpdate = Database['public']['Tables']['loan_eligibility']['Update'];

export type OnboardingCaseRow = Database['public']['Tables']['onboarding_cases']['Row'];
export type OnboardingCaseInsert = Database['public']['Tables']['onboarding_cases']['Insert'];
export type OnboardingCaseUpdate = Database['public']['Tables']['onboarding_cases']['Update'];

export type OnboardingDocumentRow = Database['public']['Tables']['onboarding_documents']['Row'];
export type OnboardingDocumentInsert = Database['public']['Tables']['onboarding_documents']['Insert'];
export type OnboardingDocumentUpdate = Database['public']['Tables']['onboarding_documents']['Update'];

export type OnboardingEligibilityRow = Database['public']['Tables']['onboarding_eligibility']['Row'];
export type OnboardingEligibilityInsert = Database['public']['Tables']['onboarding_eligibility']['Insert'];
export type OnboardingEligibilityUpdate = Database['public']['Tables']['onboarding_eligibility']['Update'];

export type OnboardingLenderWorkflowRow = Database['public']['Tables']['onboarding_lender_workflows']['Row'];
export type OnboardingLenderWorkflowInsert = Database['public']['Tables']['onboarding_lender_workflows']['Insert'];
export type OnboardingLenderWorkflowUpdate = Database['public']['Tables']['onboarding_lender_workflows']['Update'];

export type OnboardingLenderRow = Database['public']['Tables']['onboarding_lenders']['Row'];
export type OnboardingLenderInsert = Database['public']['Tables']['onboarding_lenders']['Insert'];
export type OnboardingLenderUpdate = Database['public']['Tables']['onboarding_lenders']['Update'];

export type OnboardingLoanRequirementRow = Database['public']['Tables']['onboarding_loan_requirements']['Row'];
export type OnboardingLoanRequirementInsert = Database['public']['Tables']['onboarding_loan_requirements']['Insert'];
export type OnboardingLoanRequirementUpdate = Database['public']['Tables']['onboarding_loan_requirements']['Update'];

export type OnboardingStageHistoryRow = Database['public']['Tables']['onboarding_stage_history']['Row'];
export type OnboardingStageHistoryInsert = Database['public']['Tables']['onboarding_stage_history']['Insert'];

export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export type UserRoleRow = Database['public']['Tables']['user_roles']['Row'];
export type UserRoleInsert = Database['public']['Tables']['user_roles']['Insert'];
export type UserRoleUpdate = Database['public']['Tables']['user_roles']['Update'];

// =====================================================
// FRONTEND-FRIENDLY INTERFACES
// =====================================================

/** Agent with formatted fields for UI */
export interface Agent {
  id: string;
  agentCode: string;
  fullName: string;
  email: string;
  telephone: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
}

/** Onboarding case with related data */
export interface OnboardingCase {
  id: string;
  caseNumber: string | null;
  status: CaseStatus;
  processStage: ProcessStage | null;
  ragStatus: RAGStatus | null;
  userId: string | null;
  agentId: string | null;
  supervisorId: string | null;
  actionRequiredBy: ActionRequiredBy | null;
  daysInCurrentStage: number;
  stageEnteredAt: Date | null;
  submittedAt: Date | null;
  decisionAt: Date | null;
  isUrgent: boolean;
  hasMissingDocs: boolean;
  hasValidationErrors: boolean;
  remarks: string | null;
  internalNotes: string | null;
  clientNotes: string | null;
  dropReason: string | null;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

/** Applicant business details */
export interface ApplicantBusiness {
  id: string;
  caseId: string;
  companyLegalName: string;
  tradeLicenseNo: string;
  licenseIssuingAuthority: string;
  tlExpiryDate: string;
  businessActivity: string;
  legalStructure: string;
  yearOfEstablishment: number | null;
  officeAddress: string;
  emirate: string;
  ejariAvailable: boolean | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Business owner details */
export interface BusinessOwner {
  id: string;
  caseId: string;
  ownerName: string;
  nationality: string;
  emiratesId: string;
  passportNumber: string;
  shareholdingPercent: number;
  residentStatus: string;
  mobile: string;
  email: string;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

/** Financial inputs for eligibility */
export interface FinancialInput {
  id: string;
  caseId: string;
  existingBankAccounts: string[];
  primaryOperatingBank: string;
  monthlyAvgTurnover: number;
  declaredTurnover: number;
  adjustedTurnover: number;
  vatRegistered: boolean | null;
  annualVatTurnover: number | null;
  posMachine: boolean | null;
  posMonthlyTurnover: number | null;
  posAnnualTurnover: number;
  cashIntensive: boolean | null;
  cashAdjustment: number;
  sisterConcernExists: boolean | null;
  sisterConcernAdjustment: number;
  createdAt: Date;
  updatedAt: Date;
}

/** Loan requirements */
export interface LoanRequirement {
  id: string;
  caseId: string;
  loanType: string;
  requiredLoanAmount: number;
  purpose: string | null;
  preferredTenure: string | null;
  urgentFunding: boolean | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Uploaded document */
export interface OnboardingDocument {
  id: string;
  caseId: string;
  documentType: string;
  fileName: string;
  filePath: string;
  fileSize: number | null;
  mimeType: string | null;
  status: DocumentStatus;
  isMandatory: boolean;
  uploadedBy: string | null;
  verifiedBy: string | null;
  verifiedAt: Date | null;
  rejectionReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Eligibility calculation result */
export interface OnboardingEligibility {
  id: string;
  caseId: string;
  lenderId: string | null;
  vatTurnover: number;
  adjustedTurnover: number;
  variancePercent: number;
  varianceBucket: string | null;
  eligibleMultiplier: number;
  baseMultiplier: number;
  posCapPercent: number;
  posAnnualTurnover: number;
  posCapAdjusted: number;
  posCapVat: number;
  posEligibleTurnover: number;
  turnoverBasis: number;
  eligibilityMethod: string;
  eligibilityStatus: string;
  eligibleLoanAmount: number;
  abcdFeePercent: number;
  abcdFeeAmount: number;
  totalWithAbcd: number;
  eligibilityBasis: string | null;
  recommendedLenders: unknown[];
  flags: unknown[];
  calculatedBy: string | null;
  calculatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Lender configuration */
export interface Lender {
  id: string;
  name: string;
  shortCode: string;
  lenderType: LenderType;
  isActive: boolean;
  logoUrl: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  eligibilityRules: LenderEligibilityRules;
  documentRequirements: LenderDocumentRequirements;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Lender eligibility rules JSON structure */
export interface LenderEligibilityRules {
  max_multiplier: number;
  min_loan_amount: number;
  max_loan_amount: number | null;
  pos_cap_percent: number;
  abcd_fee_percent: number;
  reduced_multiplier: number;
  min_turnover?: number;
  pos_variant?: 'RAK_POS' | 'WIO_POS' | 'STANDARD';
  variance_thresholds?: {
    eligible: number;
    reduced: number;
  };
}

/** Lender document requirements JSON structure */
export interface LenderDocumentRequirements {
  mandatory: string[];
  optional: string[];
  conditional?: Record<string, string[]>;
}

/** Lender workflow configuration */
export interface LenderWorkflow {
  id: string;
  lenderId: string;
  workflowName: string | null;
  stages: WorkflowStage[];
  requiredDocsByStage: Record<string, string[]>;
  statusMappings: WorkflowStatusMappings;
  includeAccountOpened: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** Single workflow stage */
export interface WorkflowStage {
  order: number;
  stage: ProcessStage;
  sla_days: number;
  required_docs: string[];
}

/** Workflow status mappings */
export interface WorkflowStatusMappings {
  pending_stages: string[];
  active_stages: string[];
  final_stages: string[];
}

/** Case lender application */
export interface CaseLenderApplication {
  id: string;
  caseId: string;
  lenderId: string;
  workflowId: string | null;
  lenderStage: ProcessStage | null;
  lenderStatus: string;
  ragStatus: RAGStatus;
  daysInStage: number;
  stageEnteredAt: Date | null;
  requestedAmount: number | null;
  approvedAmount: number | null;
  interestRate: number | null;
  tenureMonths: number | null;
  assignedRoName: string | null;
  assignedRoEmail: string | null;
  assignedRoPhone: string | null;
  submissionDate: Date | null;
  decision: string | null;
  decisionDate: Date | null;
  lenderRemarks: string | null;
  internalRemarks: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Stage history entry */
export interface StageHistoryEntry {
  id: string;
  caseId: string;
  lenderApplicationId: string | null;
  fieldChanged: string;
  oldValue: string | null;
  newValue: string | null;
  changeType: string | null;
  changeReason: string | null;
  changedBy: string | null;
  changedAt: Date;
  metadata: Record<string, unknown>;
}

/** User profile */
export interface Profile {
  id: string;
  userId: string;
  email: string | null;
  fullName: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/** User with role */
export interface UserWithRole {
  userId: string;
  email: string;
  fullName: string;
  role: AppRole;
  createdAt: Date;
}

// =====================================================
// DISPLAY LABELS
// =====================================================

export const CASE_STATUS_LABELS: Record<CaseStatus, string> = {
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

export const PROCESS_STAGE_LABELS: Record<ProcessStage, string> = {
  email_sent: 'Email Sent',
  ro_assigned: 'RO Assigned',
  link_shared: 'Link Shared',
  link_completed: 'Link Completed',
  video_verification: 'Video Verification',
  signature_submitted: 'Signature Submitted',
  ro_confirmation: 'RO Confirmation',
  account_opened: 'Account Opened'
};

export const RAG_STATUS_LABELS: Record<RAGStatus, string> = {
  green: 'On Track',
  amber: 'At Risk',
  red: 'Overdue'
};

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  pending: 'Pending',
  uploaded: 'Uploaded',
  verified: 'Verified',
  rejected: 'Rejected'
};

export const LENDER_TYPE_LABELS: Record<LenderType, string> = {
  bank: 'Bank',
  fintech: 'Fintech',
  nbfc: 'NBFC'
};

export const APP_ROLE_LABELS: Record<AppRole, string> = {
  user: 'User',
  coordinator: 'Coordinator',
  supervisor: 'Supervisor',
  admin: 'Admin',
  super_admin: 'Super Admin'
};

// =====================================================
// COLOR UTILITIES
// =====================================================

export function getCaseStatusColor(status: CaseStatus): string {
  const colors: Record<CaseStatus, string> = {
    draft: 'bg-muted text-muted-foreground',
    in_process: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
    additional_info_required: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200',
    submitted_to_lender: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200',
    approved: 'bg-success/20 text-success',
    declined: 'bg-destructive/20 text-destructive',
    dropped: 'bg-muted text-muted-foreground',
    on_hold: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200',
    closed: 'bg-muted text-muted-foreground'
  };
  return colors[status];
}

export function getRAGStatusColor(status: RAGStatus): string {
  const colors: Record<RAGStatus, string> = {
    green: 'bg-success/20 text-success',
    amber: 'bg-warning/20 text-warning',
    red: 'bg-destructive/20 text-destructive'
  };
  return colors[status];
}

export function getDocumentStatusColor(status: DocumentStatus): string {
  const colors: Record<DocumentStatus, string> = {
    pending: 'bg-muted text-muted-foreground',
    uploaded: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
    verified: 'bg-success/20 text-success',
    rejected: 'bg-destructive/20 text-destructive'
  };
  return colors[status];
}
