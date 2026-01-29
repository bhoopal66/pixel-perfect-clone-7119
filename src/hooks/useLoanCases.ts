import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { LoanCase, LoanDocument, LenderType, ProductType, LoanStatus } from '@/types/loanCase.types';
import { toast } from 'sonner';

interface DbLoanCase {
  id: string;
  case_number: string;
  applicant_name: string;
  applicant_phone: string;
  applicant_email: string;
  monthly_salary: number;
  company_name: string;
  agent_reference: string;
  analyst_name: string;
  lender: string;
  product_type: string;
  loan_amount: number;
  tenure: number;
  purpose: string | null;
  interest_rate: number;
  emi: number;
  total_interest: number;
  total_payable: number;
  processing_fee: number;
  // POS eligibility fields
  vat_turnover: number;
  adjusted_turnover: number;
  pos_monthly_turnover: number;
  pos_annual_turnover: number;
  pos_cap_adjusted: number;
  pos_cap_vat: number;
  pos_eligible_turnover: number;
  turnover_basis: number;
  variance_percent: number;
  eligible_multiplier: number;
  eligible_loan_amount: number;
  // ABCD fee fields
  abcd_fee_rate: number;
  abcd_fee_amount: number;
  total_with_abcd: number;
  // Status & tracking
  status: string;
  notes: string | null;
  submitted_at: string | null;
  approved_at: string | null;
  disbursed_at: string | null;
  documents: LoanDocument[];
  created_at: string;
  updated_at: string;
  user_id: string | null;
}

// Convert DB format to app format
const fromDbFormat = (dbCase: DbLoanCase): LoanCase => ({
  id: dbCase.id,
  caseNumber: dbCase.case_number,
  applicantName: dbCase.applicant_name,
  applicantPhone: dbCase.applicant_phone,
  applicantEmail: dbCase.applicant_email,
  monthlySalary: dbCase.monthly_salary,
  companyName: dbCase.company_name,
  agentReference: dbCase.agent_reference,
  analystName: dbCase.analyst_name,
  lender: dbCase.lender as LenderType,
  productType: dbCase.product_type as ProductType,
  loanAmount: dbCase.loan_amount,
  tenure: dbCase.tenure,
  purpose: dbCase.purpose || '',
  interestRate: dbCase.interest_rate,
  emi: dbCase.emi,
  totalInterest: dbCase.total_interest,
  totalPayable: dbCase.total_payable,
  processingFee: dbCase.processing_fee,
  // POS eligibility fields
  vatTurnover: dbCase.vat_turnover || 0,
  adjustedTurnover: dbCase.adjusted_turnover || 0,
  posMonthlyTurnover: dbCase.pos_monthly_turnover || 0,
  posAnnualTurnover: dbCase.pos_annual_turnover || 0,
  posCapAdjusted: dbCase.pos_cap_adjusted || 0,
  posCapVat: dbCase.pos_cap_vat || 0,
  posEligibleTurnover: dbCase.pos_eligible_turnover || 0,
  turnoverBasis: dbCase.turnover_basis || 0,
  variancePercent: dbCase.variance_percent || 0,
  eligibleMultiplier: dbCase.eligible_multiplier || 0,
  eligibleLoanAmount: dbCase.eligible_loan_amount || 0,
  // ABCD fee fields
  abcdFeeRate: dbCase.abcd_fee_rate || 0.01,
  abcdFeeAmount: dbCase.abcd_fee_amount || 0,
  totalWithAbcd: dbCase.total_with_abcd || 0,
  // Status
  status: dbCase.status as LoanStatus,
  notes: dbCase.notes || '',
  submittedAt: dbCase.submitted_at || undefined,
  approvedAt: dbCase.approved_at || undefined,
  disbursedAt: dbCase.disbursed_at || undefined,
  documents: dbCase.documents || [],
  createdAt: dbCase.created_at,
  updatedAt: dbCase.updated_at,
});

// Convert app format to DB format
const toDbFormat = (loanCase: LoanCase): Omit<DbLoanCase, 'created_at' | 'updated_at' | 'user_id'> => ({
  id: loanCase.id,
  case_number: loanCase.caseNumber,
  applicant_name: loanCase.applicantName,
  applicant_phone: loanCase.applicantPhone,
  applicant_email: loanCase.applicantEmail,
  monthly_salary: loanCase.monthlySalary,
  company_name: loanCase.companyName,
  agent_reference: loanCase.agentReference,
  analyst_name: loanCase.analystName,
  lender: loanCase.lender,
  product_type: loanCase.productType,
  loan_amount: loanCase.loanAmount,
  tenure: loanCase.tenure,
  purpose: loanCase.purpose || null,
  interest_rate: loanCase.interestRate,
  emi: loanCase.emi,
  total_interest: loanCase.totalInterest,
  total_payable: loanCase.totalPayable,
  processing_fee: loanCase.processingFee,
  // POS eligibility fields
  vat_turnover: loanCase.vatTurnover || 0,
  adjusted_turnover: loanCase.adjustedTurnover || 0,
  pos_monthly_turnover: loanCase.posMonthlyTurnover || 0,
  pos_annual_turnover: loanCase.posAnnualTurnover || 0,
  pos_cap_adjusted: loanCase.posCapAdjusted || 0,
  pos_cap_vat: loanCase.posCapVat || 0,
  pos_eligible_turnover: loanCase.posEligibleTurnover || 0,
  turnover_basis: loanCase.turnoverBasis || 0,
  variance_percent: loanCase.variancePercent || 0,
  eligible_multiplier: loanCase.eligibleMultiplier || 0,
  eligible_loan_amount: loanCase.eligibleLoanAmount || 0,
  // ABCD fee fields
  abcd_fee_rate: loanCase.abcdFeeRate || 0.01,
  abcd_fee_amount: loanCase.abcdFeeAmount || 0,
  total_with_abcd: loanCase.totalWithAbcd || 0,
  // Status
  status: loanCase.status,
  notes: loanCase.notes || null,
  submitted_at: loanCase.submittedAt || null,
  approved_at: loanCase.approvedAt || null,
  disbursed_at: loanCase.disbursedAt || null,
  documents: loanCase.documents || [],
});

export function useLoanCases() {
  const [cases, setCases] = useState<LoanCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all cases
  const fetchCases = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('loan_cases')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const formattedCases = (data || []).map((row) => fromDbFormat(row as unknown as DbLoanCase));
      setCases(formattedCases);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch loan cases';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Add a new case
  const addCase = useCallback(async (newCase: LoanCase): Promise<boolean> => {
    try {
      const dbData = toDbFormat(newCase);
      
      const { error: insertError } = await supabase
        .from('loan_cases')
        .insert(dbData as any);

      if (insertError) throw insertError;

      // Add to local state
      setCases(prev => [newCase, ...prev]);
      toast.success('Loan case created successfully');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create loan case';
      toast.error(message);
      return false;
    }
  }, []);

  // Update a case
  const updateCase = useCallback(async (updatedCase: LoanCase): Promise<boolean> => {
    try {
      const dbData = toDbFormat(updatedCase);
      
      const { error: updateError } = await supabase
        .from('loan_cases')
        .update(dbData as any)
        .eq('id', updatedCase.id);

      if (updateError) throw updateError;

      // Update local state
      setCases(prev => prev.map(c => c.id === updatedCase.id ? updatedCase : c));
      toast.success('Loan case updated successfully');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update loan case';
      toast.error(message);
      return false;
    }
  }, []);

  // Delete a case
  const deleteCase = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('loan_cases')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      // Remove from local state
      setCases(prev => prev.filter(c => c.id !== id));
      toast.success('Loan case deleted successfully');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete loan case';
      toast.error(message);
      return false;
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  return {
    cases,
    isLoading,
    error,
    fetchCases,
    addCase,
    updateCase,
    deleteCase,
  };
}
