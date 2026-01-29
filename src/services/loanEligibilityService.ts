import { supabase } from '@/integrations/supabase/client';
import type { LoanEligibility, LoanEligibilityInput, EligibilityFilters } from '@/types/loanEligibility.types';

export const LoanEligibilityService = {
  // Create a new eligibility record
  async create(input: LoanEligibilityInput): Promise<LoanEligibility> {
    const { data, error } = await supabase
      .from('loan_eligibility')
      .insert({
        vat_turnover: input.vat_turnover || 0,
        declared_turnover: input.declared_turnover || 0,
        cash_adjustment: input.cash_adjustment || 0,
        sister_concern_adjustment: input.sister_concern_adjustment || 0,
        notes: input.notes || null,
      })
      .select()
      .single();
    
    if (error) throw error;
    return data as LoanEligibility;
  },

  // Update an existing eligibility record
  async update(id: string, input: Partial<LoanEligibilityInput>): Promise<LoanEligibility> {
    const { data, error } = await supabase
      .from('loan_eligibility')
      .update({
        ...(input.vat_turnover !== undefined && { vat_turnover: input.vat_turnover }),
        ...(input.declared_turnover !== undefined && { declared_turnover: input.declared_turnover }),
        ...(input.cash_adjustment !== undefined && { cash_adjustment: input.cash_adjustment }),
        ...(input.sister_concern_adjustment !== undefined && { sister_concern_adjustment: input.sister_concern_adjustment }),
        ...(input.notes !== undefined && { notes: input.notes }),
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as LoanEligibility;
  },

  // Get all eligibility records with filters
  async getAll(filters?: EligibilityFilters): Promise<LoanEligibility[]> {
    let query = supabase
      .from('loan_eligibility')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (filters) {
      if (filters.eligibility_status && filters.eligibility_status !== 'all') {
        query = query.eq('eligibility_status', filters.eligibility_status);
      }
      if (filters.variance_bucket && filters.variance_bucket !== 'all') {
        query = query.eq('variance_bucket', filters.variance_bucket);
      }
      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to);
      }
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return (data || []) as LoanEligibility[];
  },

  // Get a single eligibility record
  async getById(id: string): Promise<LoanEligibility | null> {
    const { data, error } = await supabase
      .from('loan_eligibility')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) throw error;
    return data as LoanEligibility | null;
  },

  // Delete an eligibility record
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('loan_eligibility')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Export data as CSV-ready array
  exportToCSV(records: LoanEligibility[]): string[][] {
    const headers = [
      'ID',
      'VAT Turnover',
      'Declared Turnover',
      'Cash Adjustment',
      'Sister Concern Adjustment',
      'Adjusted Turnover',
      'Variance %',
      'Variance Bucket',
      'Eligibility Status',
      'Eligible Loan Amount',
      'Created At',
      'Updated At',
      'Notes'
    ];
    
    const rows = records.map(r => [
      r.id,
      r.vat_turnover.toString(),
      r.declared_turnover.toString(),
      r.cash_adjustment.toString(),
      r.sister_concern_adjustment.toString(),
      r.adjusted_turnover.toString(),
      r.variance_percent.toString(),
      r.variance_bucket,
      r.eligibility_status,
      r.eligible_loan_amount.toString(),
      r.created_at,
      r.updated_at,
      r.notes || ''
    ]);
    
    return [headers, ...rows];
  }
};
