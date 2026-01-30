import { supabase } from '@/integrations/supabase/client';
import type { 
  Lender, 
  LenderWorkflow, 
  LenderEligibilityRules, 
  LenderDocRequirements,
  WorkflowStage 
} from '@/types/dashboard.types';

export const LenderService = {
  // Get all lenders
  async getAll(): Promise<Lender[]> {
    const { data, error } = await supabase
      .from('onboarding_lenders')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return (data || []).map(row => ({
      ...row,
      eligibility_rules: row.eligibility_rules as unknown as LenderEligibilityRules,
      document_requirements: row.document_requirements as unknown as LenderDocRequirements
    })) as Lender[];
  },

  // Get active lenders only
  async getActive(): Promise<Lender[]> {
    const { data, error } = await supabase
      .from('onboarding_lenders')
      .select('*')
      .eq('is_active', true)
      .order('name');
    
    if (error) throw error;
    return (data || []).map(row => ({
      ...row,
      eligibility_rules: row.eligibility_rules as unknown as LenderEligibilityRules,
      document_requirements: row.document_requirements as unknown as LenderDocRequirements
    })) as Lender[];
  },

  // Get lender by ID
  async getById(id: string): Promise<Lender | null> {
    const { data, error } = await supabase
      .from('onboarding_lenders')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) throw error;
    if (!data) return null;
    
    return {
      ...data,
      eligibility_rules: data.eligibility_rules as unknown as LenderEligibilityRules,
      document_requirements: data.document_requirements as unknown as LenderDocRequirements
    } as Lender;
  },

  // Create new lender
  async create(input: {
    name: string;
    short_code: string;
    lender_type: 'bank' | 'fintech' | 'nbfc';
    eligibility_rules?: Partial<LenderEligibilityRules>;
    document_requirements?: Partial<LenderDocRequirements>;
    contact_email?: string;
    contact_phone?: string;
  }): Promise<Lender> {
    const defaultRules: LenderEligibilityRules = {
      max_multiplier: 8,
      min_loan_amount: 50000,
      max_loan_amount: null,
      pos_cap_percent: 0.40,
      abcd_fee_percent: 0.01,
      reduced_multiplier: 1.33,
      variance_thresholds: { eligible: 10, reduced: 25 }
    };

    const defaultDocs: LenderDocRequirements = {
      mandatory: ['trade_license', 'owner_passport', 'bank_statements'],
      optional: ['moa_aoa', 'tenancy_contract', 'audited_financials'],
      conditional: {
        vat_registered: ['vat_certificate'],
        pos_machine: ['pos_statements']
      }
    };

    const insertData = {
      name: input.name,
      short_code: input.short_code,
      lender_type: input.lender_type,
      eligibility_rules: { ...defaultRules, ...input.eligibility_rules },
      document_requirements: { ...defaultDocs, ...input.document_requirements },
      contact_email: input.contact_email || null,
      contact_phone: input.contact_phone || null,
      is_active: true
    };

    const { data, error } = await supabase
      .from('onboarding_lenders')
      .insert(insertData as any)
      .select()
      .single();
    
    if (error) throw error;
    
    // Create default workflow for the lender
    await this.createDefaultWorkflow(data.id);
    
    return {
      ...data,
      eligibility_rules: data.eligibility_rules as unknown as LenderEligibilityRules,
      document_requirements: data.document_requirements as unknown as LenderDocRequirements
    } as Lender;
  },

  // Update lender
  async update(id: string, input: Partial<{
    name: string;
    short_code: string;
    lender_type: 'bank' | 'fintech' | 'nbfc';
    is_active: boolean;
    eligibility_rules: LenderEligibilityRules;
    document_requirements: LenderDocRequirements;
    contact_email: string;
    contact_phone: string;
  }>): Promise<Lender> {
    const updateData: Record<string, unknown> = {};
    
    if (input.name !== undefined) updateData.name = input.name;
    if (input.short_code !== undefined) updateData.short_code = input.short_code;
    if (input.lender_type !== undefined) updateData.lender_type = input.lender_type;
    if (input.is_active !== undefined) updateData.is_active = input.is_active;
    if (input.eligibility_rules !== undefined) updateData.eligibility_rules = input.eligibility_rules;
    if (input.document_requirements !== undefined) updateData.document_requirements = input.document_requirements;
    if (input.contact_email !== undefined) updateData.contact_email = input.contact_email;
    if (input.contact_phone !== undefined) updateData.contact_phone = input.contact_phone;
    
    const { data, error } = await supabase
      .from('onboarding_lenders')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return {
      ...data,
      eligibility_rules: data.eligibility_rules as unknown as LenderEligibilityRules,
      document_requirements: data.document_requirements as unknown as LenderDocRequirements
    } as Lender;
  },

  // Toggle lender active status
  async toggleActive(id: string, isActive: boolean): Promise<void> {
    const { error } = await supabase
      .from('onboarding_lenders')
      .update({ is_active: isActive })
      .eq('id', id);
    
    if (error) throw error;
  },

  // Get workflow for a lender
  async getWorkflow(lenderId: string): Promise<LenderWorkflow | null> {
    const { data, error } = await supabase
      .from('onboarding_lender_workflows')
      .select('*')
      .eq('lender_id', lenderId)
      .maybeSingle();
    
    if (error) throw error;
    if (!data) return null;
    
    return {
      id: data.id,
      lender_id: data.lender_id,
      workflow_name: data.workflow_name || 'Default Workflow',
      stages: (data.stages as unknown as WorkflowStage[]) || [],
      required_docs_by_stage: (data.required_docs_by_stage as unknown as Record<string, string[]>) || {},
      status_mappings: data.status_mappings as unknown as {
        pending_stages: string[];
        active_stages: string[];
        final_stages: string[];
      },
      include_account_opened: data.include_account_opened
    };
  },

  // Create default workflow for a lender
  async createDefaultWorkflow(lenderId: string): Promise<LenderWorkflow> {
    const defaultStages: WorkflowStage[] = [
      { order: 1, stage: 'email_sent', sla_days: 1, required_docs: [] },
      { order: 2, stage: 'ro_assigned', sla_days: 2, required_docs: [] },
      { order: 3, stage: 'link_shared', sla_days: 1, required_docs: [] },
      { order: 4, stage: 'link_completed', sla_days: 3, required_docs: ['bank_statements'] },
      { order: 5, stage: 'video_verification', sla_days: 2, required_docs: ['owner_passport'] },
      { order: 6, stage: 'signature_submitted', sla_days: 2, required_docs: [] },
      { order: 7, stage: 'ro_confirmation', sla_days: 3, required_docs: [] }
    ];

    const insertData = {
      lender_id: lenderId,
      workflow_name: 'Default Loan Submission',
      stages: defaultStages,
      required_docs_by_stage: {
        link_completed: ['trade_license', 'owner_passport', 'bank_statements'],
        video_verification: ['owner_passport'],
        signature_submitted: [],
        ro_confirmation: ['moa_aoa', 'tenancy_contract']
      }
    };

    const { data, error } = await supabase
      .from('onboarding_lender_workflows')
      .insert(insertData as any)
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      lender_id: data.lender_id,
      workflow_name: data.workflow_name || 'Default Workflow',
      stages: (data.stages as unknown as WorkflowStage[]) || [],
      required_docs_by_stage: (data.required_docs_by_stage as unknown as Record<string, string[]>) || {},
      status_mappings: data.status_mappings as unknown as {
        pending_stages: string[];
        active_stages: string[];
        final_stages: string[];
      },
      include_account_opened: data.include_account_opened
    };
  },

  // Update workflow
  async updateWorkflow(id: string, input: Partial<{
    workflow_name: string;
    stages: WorkflowStage[];
    required_docs_by_stage: Record<string, string[]>;
    include_account_opened: boolean;
  }>): Promise<void> {
    const updateData: Record<string, unknown> = {};
    
    if (input.workflow_name !== undefined) updateData.workflow_name = input.workflow_name;
    if (input.stages !== undefined) updateData.stages = input.stages;
    if (input.required_docs_by_stage !== undefined) updateData.required_docs_by_stage = input.required_docs_by_stage;
    if (input.include_account_opened !== undefined) updateData.include_account_opened = input.include_account_opened;
    
    const { error } = await supabase
      .from('onboarding_lender_workflows')
      .update(updateData)
      .eq('id', id);
    
    if (error) throw error;
  }
};
