import { supabase } from '@/integrations/supabase/client';
import type { Case, CaseCreateInput, CaseAnalysisInput, CaseEligibilityInput, CaseStatus } from '@/types/case.types';

export const CaseService = {
  // Create a new case (Step 1)
  async create(input: CaseCreateInput): Promise<Case> {
    const { data, error } = await supabase
      .from('cases')
      .insert({
        client_name: input.client_name,
        bank_name: input.bank_name,
        product_type: input.product_type,
        agent_reference: input.agent_reference || '',
        status: 'Draft' as CaseStatus
      })
      .select()
      .single();
    
    if (error) throw error;
    return data as unknown as Case;
  },

  // Get unique agent references for autocomplete
  async getAgentReferences(): Promise<string[]> {
    const { data, error } = await supabase
      .from('cases')
      .select('agent_reference')
      .neq('agent_reference', '')
      .order('agent_reference');
    
    if (error) throw error;
    
    // Get unique values
    const uniqueRefs = [...new Set((data || []).map(d => d.agent_reference))];
    return uniqueRefs.filter(Boolean);
  },

  // Update case with analysis data (Step 2)
  async updateAnalysis(id: string, input: CaseAnalysisInput): Promise<Case> {
    const { data, error } = await supabase
      .from('cases')
      .update({
        statement_pdf_url: input.statement_pdf_url || null,
        statement_period_from: input.statement_period_from || null,
        statement_period_to: input.statement_period_to || null,
        vat_turnover: input.vat_turnover || 0,
        declared_turnover: input.declared_turnover || 0,
        cash_adjustment: input.cash_adjustment || 0,
        sister_concern_adjustment: input.sister_concern_adjustment || 0
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as unknown as Case;
  },

  // Mark analysis as completed
  async markAnalysisCompleted(id: string): Promise<Case> {
    const { data, error } = await supabase
      .from('cases')
      .update({ status: 'Analysis Completed' as CaseStatus })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as unknown as Case;
  },

  // Update eligibility inputs (Step 3) - includes EMI data
  async updateEligibility(id: string, input: CaseEligibilityInput): Promise<Case> {
    const { data, error } = await supabase
      .from('cases')
      .update({
        pos_monthly_turnover: input.pos_monthly_turnover || 0,
        interest_rate: input.interest_rate ?? 12,
        tenure_months: input.tenure_months ?? 12,
        monthly_emi: input.monthly_emi ?? 0,
        total_interest: input.total_interest ?? 0,
        total_payable: input.total_payable ?? 0
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as unknown as Case;
  },

  // Finalize eligibility
  async finalizeEligibility(id: string): Promise<Case> {
    const { data, error } = await supabase
      .from('cases')
      .update({ status: 'Eligibility Completed' as CaseStatus })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as unknown as Case;
  },

  // Update status
  async updateStatus(id: string, status: CaseStatus): Promise<Case> {
    const { data, error } = await supabase
      .from('cases')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as unknown as Case;
  },

  // Get all cases
  async getAll(): Promise<Case[]> {
    const { data, error } = await supabase
      .from('cases')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []) as unknown as Case[];
  },

  // Get case by ID
  async getById(id: string): Promise<Case | null> {
    const { data, error } = await supabase
      .from('cases')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) throw error;
    return data as unknown as Case | null;
  },

  // Delete case
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('cases')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};
