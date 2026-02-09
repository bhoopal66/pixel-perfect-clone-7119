import { supabase } from '@/integrations/supabase/client';
import type { LoanEligibility, LoanEligibilityInput, EligibilityFilters } from '@/types/loanEligibility.types';

export const LoanEligibilityService = {
  // Create a new eligibility record
  async create(input: LoanEligibilityInput): Promise<LoanEligibility> {
    const { data, error } = await supabase
      .from('loan_eligibility')
      .insert({
        product_type: input.product_type || 'standard',
        vat_turnover: input.vat_turnover || 0,
        declared_turnover: input.declared_turnover || 0,
        cash_adjustment: input.cash_adjustment || 0,
        sister_concern_adjustment: input.sister_concern_adjustment || 0,
        pos_monthly_turnover: input.pos_monthly_turnover || 0,
        company_name: input.company_name || null,
        period_start: input.period_start || null,
        period_end: input.period_end || null,
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
        ...(input.product_type !== undefined && { product_type: input.product_type }),
        ...(input.vat_turnover !== undefined && { vat_turnover: input.vat_turnover }),
        ...(input.declared_turnover !== undefined && { declared_turnover: input.declared_turnover }),
        ...(input.cash_adjustment !== undefined && { cash_adjustment: input.cash_adjustment }),
        ...(input.sister_concern_adjustment !== undefined && { sister_concern_adjustment: input.sister_concern_adjustment }),
        ...(input.pos_monthly_turnover !== undefined && { pos_monthly_turnover: input.pos_monthly_turnover }),
        ...(input.company_name !== undefined && { company_name: input.company_name }),
        ...(input.period_start !== undefined && { period_start: input.period_start }),
        ...(input.period_end !== undefined && { period_end: input.period_end }),
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
      if (filters.product_type && filters.product_type !== 'all') {
        query = query.eq('product_type', filters.product_type);
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
      'Company Name',
      'Period Start',
      'Period End',
      'Product Type',
      'VAT Turnover',
      'Declared Turnover',
      'Cash Adjustment',
      'Sister Concern Adjustment',
      'POS Monthly Turnover',
      'Adjusted Turnover',
      'POS Cap Rate',
      'POS Annual Turnover',
      'POS Cap Adjusted',
      'POS Cap VAT',
      'POS Eligible Turnover',
      'Turnover Basis',
      'Variance %',
      'Variance Bucket',
      'Eligibility Status',
      'Eligibility Method',
      'Multiplier',
      'Eligible Loan Amount',
      'ABCT Fee Rate',
      'ABCT Fee Amount',
      'Total with ABCT',
      'Created At',
      'Updated At',
      'Notes'
    ];
    
    const rows = records.map(r => [
      r.id,
      r.company_name || '',
      r.period_start || '',
      r.period_end || '',
      r.product_type,
      r.vat_turnover.toString(),
      r.declared_turnover.toString(),
      r.cash_adjustment.toString(),
      r.sister_concern_adjustment.toString(),
      r.pos_monthly_turnover.toString(),
      r.adjusted_turnover.toString(),
      r.pos_cap_rate.toString(),
      r.pos_annual_turnover.toString(),
      r.pos_cap_adjusted.toString(),
      r.pos_cap_vat.toString(),
      r.pos_eligible_turnover.toString(),
      r.turnover_basis.toString(),
      r.variance_percent.toString(),
      r.variance_bucket,
      r.eligibility_status,
      r.eligibility_method || 'Standard',
      r.eligible_multiplier.toString(),
      r.eligible_loan_amount.toString(),
      r.abcd_fee_rate.toString(),
      r.abcd_fee_amount.toString(),
      r.total_with_abcd.toString(),
      r.created_at,
      r.updated_at,
      r.notes || ''
    ]);
    
    return [headers, ...rows];
  }
};
