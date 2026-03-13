import { supabase } from '@/integrations/supabase/client';
import type {
  ExtractionRun,
  CombinedFinancialSummary,
  AiCreditDecisionResult,
  CaseReport,
  CaseActivityLog,
  CaseActivityType,
  CaseReportType,
} from '@/types/permanentStorage.types';

// ============================================================
// ACTIVITY LOG SERVICE
// ============================================================
export const ActivityLogService = {
  async log(
    caseId: string,
    activityType: CaseActivityType,
    description: string,
    referenceTable?: string,
    referenceId?: string
  ): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('case_activity_log').insert({
      case_id: caseId,
      activity_type: activityType,
      activity_description: description,
      reference_table: referenceTable || null,
      reference_id: referenceId || null,
      done_by: user?.id || null,
    } as any);
  },

  async getByCase(caseId: string): Promise<CaseActivityLog[]> {
    const { data, error } = await supabase
      .from('case_activity_log')
      .select('*')
      .eq('case_id', caseId)
      .order('done_at', { ascending: false });
    if (error) throw error;
    return (data || []) as unknown as CaseActivityLog[];
  },
};

// ============================================================
// EXTRACTION RUN SERVICE
// ============================================================
export const ExtractionRunService = {
  async create(caseId: string, documentId: string, extractionType: string): Promise<ExtractionRun> {
    const { data, error } = await supabase
      .from('extraction_runs')
      .insert({
        case_id: caseId,
        document_id: documentId,
        extraction_type: extractionType,
        extraction_status: 'in_progress',
        started_at: new Date().toISOString(),
      } as any)
      .select()
      .single();
    if (error) throw error;

    await ActivityLogService.log(caseId, 'extraction_started' as CaseActivityType, `Extraction started for ${extractionType}`, 'extraction_runs', data.id);
    return data as unknown as ExtractionRun;
  },

  async complete(id: string, caseId: string, confidence: number, engine: string): Promise<void> {
    await supabase
      .from('extraction_runs')
      .update({
        extraction_status: 'completed',
        confidence_score: confidence,
        extracted_by_engine: engine,
        completed_at: new Date().toISOString(),
      } as any)
      .eq('id', id);

    await ActivityLogService.log(caseId, 'extraction_completed', `Extraction completed with ${(confidence * 100).toFixed(0)}% confidence`);
  },

  async getByCase(caseId: string): Promise<ExtractionRun[]> {
    const { data, error } = await supabase
      .from('extraction_runs')
      .select('*')
      .eq('case_id', caseId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as unknown as ExtractionRun[];
  },
};

// ============================================================
// COMBINED FINANCIAL SUMMARY SERVICE
// ============================================================
export const FinancialSummaryService = {
  async create(caseId: string, summaryData: Partial<CombinedFinancialSummary>): Promise<CombinedFinancialSummary> {
    const { data: { user } } = await supabase.auth.getUser();

    // Get next version number
    const { data: existing } = await supabase
      .from('combined_financial_summary')
      .select('summary_version')
      .eq('case_id', caseId)
      .order('summary_version', { ascending: false })
      .limit(1);

    const nextVersion = (existing?.[0]?.summary_version || 0) + 1;

    // Mark prior versions as inactive
    if (nextVersion > 1) {
      await supabase
        .from('combined_financial_summary')
        .update({ is_active: false } as any)
        .eq('case_id', caseId);
    }

    const { data, error } = await supabase
      .from('combined_financial_summary')
      .insert({
        ...summaryData,
        case_id: caseId,
        summary_version: nextVersion,
        created_by: user?.id || null,
        is_active: true,
      } as any)
      .select()
      .single();

    if (error) throw error;

    await ActivityLogService.log(caseId, 'summary_created', `Financial summary v${nextVersion} created`, 'combined_financial_summary', data.id);
    return data as unknown as CombinedFinancialSummary;
  },

  async getActive(caseId: string): Promise<CombinedFinancialSummary | null> {
    const { data, error } = await supabase
      .from('combined_financial_summary')
      .select('*')
      .eq('case_id', caseId)
      .eq('is_active', true)
      .maybeSingle();
    if (error) throw error;
    return data as unknown as CombinedFinancialSummary | null;
  },

  async getAllVersions(caseId: string): Promise<CombinedFinancialSummary[]> {
    const { data, error } = await supabase
      .from('combined_financial_summary')
      .select('*')
      .eq('case_id', caseId)
      .order('summary_version', { ascending: false });
    if (error) throw error;
    return (data || []) as unknown as CombinedFinancialSummary[];
  },

  async approve(id: string, caseId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase
      .from('combined_financial_summary')
      .update({
        approved_by: user?.id || null,
        approved_at: new Date().toISOString(),
      } as any)
      .eq('id', id);

    await ActivityLogService.log(caseId, 'summary_approved', 'Financial summary approved', 'combined_financial_summary', id);
  },
};

// ============================================================
// AI CREDIT DECISION SERVICE
// ============================================================
export const AiDecisionService = {
  async save(caseId: string, result: Partial<AiCreditDecisionResult>): Promise<AiCreditDecisionResult> {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('ai_credit_decision_results')
      .insert({
        ...result,
        case_id: caseId,
        created_by: user?.id || null,
      } as any)
      .select()
      .single();

    if (error) throw error;

    await ActivityLogService.log(caseId, 'ai_matching_run', `AI credit decision generated: ${result.credit_rating || 'N/A'}`, 'ai_credit_decision_results', data.id);

    // Mark case as AI matching completed
    await supabase
      .from('assessment_cases')
      .update({ ai_matching_completed: true } as any)
      .eq('id', caseId);

    return data as unknown as AiCreditDecisionResult;
  },

  async getByCase(caseId: string): Promise<AiCreditDecisionResult[]> {
    const { data, error } = await supabase
      .from('ai_credit_decision_results')
      .select('*')
      .eq('case_id', caseId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as unknown as AiCreditDecisionResult[];
  },
};

// ============================================================
// CASE REPORT SERVICE
// ============================================================
export const CaseReportService = {
  async saveReport(
    caseId: string,
    reportType: CaseReportType,
    reportName: string,
    file: Blob,
    fileName: string,
    format: 'xlsx' | 'pdf' | 'csv',
    summaryId?: string,
    executionId?: string,
    remarks?: string
  ): Promise<CaseReport> {
    const { data: { user } } = await supabase.auth.getUser();

    // Get next version
    const { data: existing } = await supabase
      .from('case_reports')
      .select('report_version')
      .eq('case_id', caseId)
      .eq('report_type', reportType)
      .order('report_version', { ascending: false })
      .limit(1);

    const nextVersion = (existing?.[0]?.report_version || 0) + 1;

    // Mark prior versions as not latest
    if (nextVersion > 1) {
      await supabase
        .from('case_reports')
        .update({ is_latest: false } as any)
        .eq('case_id', caseId)
        .eq('report_type', reportType);
    }

    // Upload file to storage
    const filePath = `${caseId}/${reportType}/v${nextVersion}_${fileName}`;
    const { error: uploadError } = await supabase.storage
      .from('case-reports')
      .upload(filePath, file, { upsert: false });

    if (uploadError) throw uploadError;

    // Create report record
    const { data, error } = await supabase
      .from('case_reports')
      .insert({
        case_id: caseId,
        report_type: reportType,
        report_name: reportName,
        report_version: nextVersion,
        file_name: fileName,
        file_path: filePath,
        report_format: format,
        based_on_summary_id: summaryId || null,
        based_on_execution_id: executionId || null,
        generated_by: user?.id || null,
        is_latest: true,
        remarks: remarks || null,
      } as any)
      .select()
      .single();

    if (error) throw error;

    // Update case latest report version
    await supabase
      .from('assessment_cases')
      .update({ latest_report_version: nextVersion } as any)
      .eq('id', caseId);

    await ActivityLogService.log(caseId, 'report_generated', `${reportName} v${nextVersion} generated (${format})`, 'case_reports', data.id);

    return data as unknown as CaseReport;
  },

  async getByCase(caseId: string, reportType?: CaseReportType): Promise<CaseReport[]> {
    let query = supabase
      .from('case_reports')
      .select('*')
      .eq('case_id', caseId)
      .order('generated_at', { ascending: false });

    if (reportType) {
      query = query.eq('report_type', reportType);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as unknown as CaseReport[];
  },

  async getLatest(caseId: string, reportType: CaseReportType): Promise<CaseReport | null> {
    const { data, error } = await supabase
      .from('case_reports')
      .select('*')
      .eq('case_id', caseId)
      .eq('report_type', reportType)
      .eq('is_latest', true)
      .maybeSingle();
    if (error) throw error;
    return data as unknown as CaseReport | null;
  },

  async downloadReport(filePath: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from('case-reports')
      .createSignedUrl(filePath, 3600); // 1hr signed URL
    if (error) throw error;
    return data.signedUrl;
  },
};
