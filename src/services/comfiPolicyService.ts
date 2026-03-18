/**
 * COMFI Policy Evaluation Service
 * 
 * Production-grade evaluation engine for the COMFI financing product.
 * Designed to plug into the existing Taamul rule-engine architecture.
 * 
 * To add future lender policies:
 * 1. Create a new service file (e.g., rakPolicyService.ts)
 * 2. Implement the same interface pattern: evaluate(), persist(), override()
 * 3. Register the new policy in a policy registry if needed
 */

import { supabase } from '@/integrations/supabase/client';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ComfiPolicyInput {
  applicant_name: string;
  company_name: string;
  nationality: string;
  industry: string;
  gross_turnover: number;
  vat_component: number;
  turnover_already_excludes_vat: boolean;
  average_sales: number;
  current_payments: number;
  outward_cheque_returns: number;
  existing_monthly_obligations: number;
  analyst_notes: string;
  case_id?: string;
}

export interface ComfiRuleLogEntry {
  rule_code: string;
  rule_name: string;
  sequence: number;
  status: 'Passed' | 'Failed' | 'Not Applicable' | 'Applied' | 'Completed' | 'Allowed';
  message: string;
  input_value?: Record<string, any>;
  output_value?: Record<string, any>;
  threshold?: Record<string, any>;
  is_hard_decline: boolean;
}

export interface ComfiEvaluationResult {
  product_code: 'COMFI';
  policy_name: 'COMFI Policy';
  application_status: string;
  engine_status: 'Completed' | 'Error';
  final_recommendation: string;
  reject_reason: string | null;
  adjusted_turnover: number;
  eligible_sales: number;
  eligible_finance: number;
  rule_log: ComfiRuleLogEntry[];
}

export interface ComfiOverrideInput {
  evaluation_id: string;
  override_status: string;
  override_reason: string;
}

// ─── Validation ──────────────────────────────────────────────────────────────

function validateInput(input: ComfiPolicyInput): string[] {
  const errors: string[] = [];
  if (!input.applicant_name?.trim()) errors.push('Applicant name is required');
  if (!input.company_name?.trim()) errors.push('Company name is required');
  if (input.gross_turnover < 0) errors.push('Gross turnover cannot be negative');
  if (input.vat_component < 0) errors.push('VAT component cannot be negative');
  if (input.average_sales < 0) errors.push('Average sales cannot be negative');
  if (input.current_payments < 0) errors.push('Current payments cannot be negative');
  if (!Number.isInteger(input.outward_cheque_returns) || input.outward_cheque_returns < 0) {
    errors.push('Outward cheque returns must be a non-negative integer');
  }
  if (input.gross_turnover === 0 && !input.turnover_already_excludes_vat) {
    errors.push('Gross turnover is required');
  }
  return errors;
}

// ─── Core Engine ─────────────────────────────────────────────────────────────

export function evaluateComfiPolicy(input: ComfiPolicyInput): ComfiEvaluationResult {
  const ruleLog: ComfiRuleLogEntry[] = [];
  let seq = 0;

  // 1. Compute adjusted turnover
  const adjusted_turnover = input.turnover_already_excludes_vat
    ? round2(input.gross_turnover)
    : round2(input.gross_turnover - (input.vat_component || 0));

  ruleLog.push({
    rule_code: 'VAT_EXCLUSION',
    rule_name: 'VAT Exclusion Rule',
    sequence: ++seq,
    status: 'Applied',
    message: input.turnover_already_excludes_vat
      ? 'Turnover treated as already net of VAT'
      : `VAT of ${fmt(input.vat_component)} excluded from gross turnover of ${fmt(input.gross_turnover)}`,
    input_value: { gross_turnover: input.gross_turnover, vat_component: input.vat_component, turnover_already_excludes_vat: input.turnover_already_excludes_vat },
    output_value: { adjusted_turnover },
    is_hard_decline: false,
  });

  // 2. Compute eligible sales
  const eligible_sales = round2(input.average_sales - input.current_payments);

  ruleLog.push({
    rule_code: 'SALES_ASSESSMENT',
    rule_name: 'Sales Assessment Rule',
    sequence: ++seq,
    status: 'Completed',
    message: `Eligible sales = Average sales (${fmt(input.average_sales)}) − Current payments (${fmt(input.current_payments)}) = ${fmt(eligible_sales)}`,
    input_value: { average_sales: input.average_sales, current_payments: input.current_payments },
    output_value: { eligible_sales },
    is_hard_decline: false,
  });

  // 3. Cheque return check (HARD DECLINE)
  const chequeStatus = input.outward_cheque_returns > 3 ? 'Failed' : 'Passed';
  ruleLog.push({
    rule_code: 'CHEQUE_RETURN_CHECK',
    rule_name: 'Outward Cheque Return Check',
    sequence: ++seq,
    status: chequeStatus,
    message: chequeStatus === 'Failed'
      ? `Outward cheque returns (${input.outward_cheque_returns}) exceed maximum of 3 — hard decline triggered`
      : `Outward cheque returns (${input.outward_cheque_returns}) within policy limit of 3`,
    input_value: { outward_cheque_returns: input.outward_cheque_returns },
    threshold: { max_allowed: 3 },
    is_hard_decline: true,
  });

  // 4. DBR — not applicable
  ruleLog.push({
    rule_code: 'DBR_RULE',
    rule_name: 'DBR Rule',
    sequence: ++seq,
    status: 'Not Applicable',
    message: 'Debt Burden Ratio is not considered for COMFI product',
    is_hard_decline: false,
  });

  // 5. Finance limit calculation
  const eligible_finance = round2(adjusted_turnover * 0.60);
  ruleLog.push({
    rule_code: 'FINANCE_LIMIT',
    rule_name: 'Finance Limit Calculation',
    sequence: ++seq,
    status: 'Completed',
    message: `Eligible finance = ${fmt(adjusted_turnover)} × 60% = ${fmt(eligible_finance)}`,
    input_value: { adjusted_turnover },
    output_value: { eligible_finance, multiplier: 0.60 },
    is_hard_decline: false,
  });

  // 6. Industry check
  ruleLog.push({
    rule_code: 'INDUSTRY_RULE',
    rule_name: 'Industry Check',
    sequence: ++seq,
    status: 'Allowed',
    message: `Industry "${input.industry || 'N/A'}" is eligible — no industry restrictions`,
    input_value: { industry: input.industry },
    is_hard_decline: false,
  });

  // 7. Nationality check
  ruleLog.push({
    rule_code: 'NATIONALITY_RULE',
    rule_name: 'Nationality Check',
    sequence: ++seq,
    status: 'Allowed',
    message: `Nationality "${input.nationality || 'N/A'}" is eligible — no nationality restrictions`,
    input_value: { nationality: input.nationality },
    is_hard_decline: false,
  });

  // Final decision
  if (chequeStatus === 'Failed') {
    return {
      product_code: 'COMFI',
      policy_name: 'COMFI Policy',
      application_status: 'Rejected',
      engine_status: 'Completed',
      final_recommendation: 'Decline',
      reject_reason: 'More than three outward cheque returns',
      adjusted_turnover,
      eligible_sales,
      eligible_finance,
      rule_log: ruleLog,
    };
  }

  return {
    product_code: 'COMFI',
    policy_name: 'COMFI Policy',
    application_status: 'Eligible – Subject to Credit Review',
    engine_status: 'Completed',
    final_recommendation: 'Proceed to Credit Review',
    reject_reason: null,
    adjusted_turnover,
    eligible_sales,
    eligible_finance,
    rule_log: ruleLog,
  };
}

// ─── Persistence ─────────────────────────────────────────────────────────────

export async function persistEvaluation(
  input: ComfiPolicyInput,
  result: ComfiEvaluationResult,
  userId: string
): Promise<string> {
  // Validate
  const errors = validateInput(input);
  if (errors.length > 0) throw new Error(errors.join('; '));

  // Insert evaluation
  const { data: evaluation, error: evalError } = await (supabase as any)
    .from('policy_evaluations')
    .insert({
      case_id: input.case_id || null,
      product_code: 'COMFI',
      policy_name: 'COMFI Policy',
      applicant_name: input.applicant_name.trim(),
      company_name: input.company_name.trim(),
      nationality: input.nationality?.trim() || null,
      industry: input.industry?.trim() || null,
      gross_turnover: input.gross_turnover,
      vat_component: input.vat_component,
      turnover_already_excludes_vat: input.turnover_already_excludes_vat,
      adjusted_turnover: result.adjusted_turnover,
      average_sales: input.average_sales,
      current_payments: input.current_payments,
      existing_monthly_obligations: input.existing_monthly_obligations || 0,
      outward_cheque_returns: input.outward_cheque_returns,
      eligible_sales: result.eligible_sales,
      eligible_finance: result.eligible_finance,
      application_status: result.application_status,
      final_recommendation: result.final_recommendation,
      reject_reason: result.reject_reason,
      engine_version: '1.0',
      engine_status: result.engine_status,
      analyst_notes: input.analyst_notes?.trim() || null,
      created_by: userId,
      updated_by: userId,
    })
    .select('id')
    .single();

  if (evalError) throw evalError;
  const evaluationId = evaluation.id;

  // Insert rule logs
  const ruleLogs = result.rule_log.map(r => ({
    evaluation_id: evaluationId,
    rule_code: r.rule_code,
    rule_name: r.rule_name,
    sequence_no: r.sequence,
    status: r.status,
    message: r.message,
    input_value_json: r.input_value || null,
    output_value_json: r.output_value || null,
    threshold_json: r.threshold || null,
    is_hard_decline: r.is_hard_decline,
  }));

  const { error: logError } = await (supabase as any)
    .from('policy_evaluation_rule_logs')
    .insert(ruleLogs);
  if (logError) console.error('Rule log save error:', logError);

  // Insert audit log
  await (supabase as any)
    .from('policy_evaluation_audit_logs')
    .insert({
      evaluation_id: evaluationId,
      case_id: input.case_id || null,
      action_type: 'evaluation_created',
      action_label: 'Evaluation Created',
      new_value_json: {
        application_status: result.application_status,
        eligible_finance: result.eligible_finance,
        reject_reason: result.reject_reason,
      },
      action_by: userId,
      remarks: `COMFI policy evaluation completed — ${result.application_status}`,
    });

  return evaluationId;
}

// ─── Override ────────────────────────────────────────────────────────────────

export async function overrideEvaluation(
  evaluationId: string,
  overrideStatus: string,
  overrideReason: string,
  userId: string
): Promise<void> {
  // Get current evaluation for audit
  const { data: current, error: fetchErr } = await (supabase as any)
    .from('policy_evaluations')
    .select('application_status, override_status')
    .eq('id', evaluationId)
    .single();
  if (fetchErr) throw fetchErr;

  const { error } = await (supabase as any)
    .from('policy_evaluations')
    .update({
      override_status: overrideStatus,
      override_reason: overrideReason,
      overridden_by: userId,
      overridden_at: new Date().toISOString(),
      updated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', evaluationId);
  if (error) throw error;

  // Audit log for override
  await (supabase as any)
    .from('policy_evaluation_audit_logs')
    .insert({
      evaluation_id: evaluationId,
      action_type: 'override_applied',
      action_label: 'Manual Override Applied',
      old_value_json: { application_status: current.application_status, override_status: current.override_status },
      new_value_json: { override_status: overrideStatus, override_reason: overrideReason },
      action_by: userId,
      remarks: `Override: ${overrideStatus} — ${overrideReason}`,
    });
}

// ─── Data Fetching ───────────────────────────────────────────────────────────

export async function fetchEvaluationHistory(limit = 50) {
  const { data, error } = await (supabase as any)
    .from('policy_evaluations')
    .select('*')
    .eq('product_code', 'COMFI')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function fetchEvaluationDetail(evaluationId: string) {
  const [{ data: evaluation, error: evalErr }, { data: ruleLogs, error: logErr }, { data: auditLogs, error: auditErr }] = await Promise.all([
    (supabase as any).from('policy_evaluations').select('*').eq('id', evaluationId).single(),
    (supabase as any).from('policy_evaluation_rule_logs').select('*').eq('evaluation_id', evaluationId).order('sequence_no', { ascending: true }),
    (supabase as any).from('policy_evaluation_audit_logs').select('*').eq('evaluation_id', evaluationId).order('action_at', { ascending: true }),
  ]);
  if (evalErr) throw evalErr;
  return { evaluation, ruleLogs: ruleLogs || [], auditLogs: auditLogs || [] };
}

export async function fetchEvaluationsByCase(caseId: string) {
  const { data, error } = await (supabase as any)
    .from('policy_evaluations')
    .select('*')
    .eq('case_id', caseId)
    .eq('product_code', 'COMFI')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

// ─── Export ──────────────────────────────────────────────────────────────────

export function buildExportPayload(
  input: ComfiPolicyInput,
  result: ComfiEvaluationResult,
  evaluationId?: string
) {
  return {
    product_code: 'COMFI',
    policy_name: 'COMFI Policy',
    evaluation_id: evaluationId || null,
    case_id: input.case_id || null,
    application_status: result.application_status,
    engine_status: result.engine_status,
    final_recommendation: result.final_recommendation,
    reject_reason: result.reject_reason,
    override_status: null,
    override_reason: null,
    inputs: {
      applicant_name: input.applicant_name,
      company_name: input.company_name,
      nationality: input.nationality,
      industry: input.industry,
      gross_turnover: input.gross_turnover,
      vat_component: input.vat_component,
      turnover_already_excludes_vat: input.turnover_already_excludes_vat,
      average_sales: input.average_sales,
      current_payments: input.current_payments,
      outward_cheque_returns: input.outward_cheque_returns,
      existing_monthly_obligations: input.existing_monthly_obligations,
    },
    calculations: {
      adjusted_turnover: result.adjusted_turnover,
      eligible_sales: result.eligible_sales,
      eligible_finance: result.eligible_finance,
    },
    rule_log: result.rule_log,
    generated_at: new Date().toISOString(),
  };
}

export function downloadExportJson(payload: any, applicantName: string) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `comfi-decision-${applicantName.replace(/\s+/g, '_')}-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function fmt(n: number): string {
  return n.toLocaleString('en-AE', { maximumFractionDigits: 2 });
}
