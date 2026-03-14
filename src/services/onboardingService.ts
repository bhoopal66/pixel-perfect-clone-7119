import { supabase } from '@/integrations/supabase/client';
import type { 
  OnboardingFormData, 
  BusinessDetails, 
  OwnerDetails, 
  BankingTurnover, 
  LoanRequirement,
  DocumentUpload 
} from '@/types/onboarding.types';
import type { Database } from '@/integrations/supabase/types';

type CaseStatus = Database['public']['Enums']['case_status'];

export interface OnboardingCase {
  id: string;
  case_number: string | null;
  status: CaseStatus;
  user_id: string | null;
  agent_id: string | null;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
}

export interface SaveResult {
  success: boolean;
  caseId?: string;
  error?: string;
}

// =====================================================
// CASE MANAGEMENT
// =====================================================

export async function createOnboardingCase(): Promise<SaveResult> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { success: false, error: 'User not authenticated' };
  }

  const { data, error } = await supabase
    .from('onboarding_cases')
    .insert({
      user_id: user.id,
      status: 'draft' as CaseStatus
    })
    .select('id, case_number')
    .single();

  if (error) {
    console.error('Error creating case:', error);
    return { success: false, error: error.message };
  }

  return { success: true, caseId: data.id };
}

export async function getOnboardingCase(caseId: string): Promise<OnboardingCase | null> {
  const { data, error } = await supabase
    .from('onboarding_cases')
    .select('*')
    .eq('id', caseId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching case:', error);
    return null;
  }

  return data;
}

export async function getUserDraftCase(): Promise<OnboardingCase | null> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  const { data, error } = await supabase
    .from('onboarding_cases')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'draft')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error fetching draft case:', error);
    return null;
  }

  return data;
}

export async function updateCaseStatus(caseId: string, status: CaseStatus): Promise<SaveResult> {
  const { error } = await supabase
    .from('onboarding_cases')
    .update({ 
      status,
      submitted_at: status === 'in_process' ? new Date().toISOString() : undefined
    })
    .eq('id', caseId);

  if (error) {
    console.error('Error updating case status:', error);
    return { success: false, error: error.message };
  }

  return { success: true, caseId };
}

// =====================================================
// BUSINESS DETAILS (applicant_businesses table)
// =====================================================

export async function saveBusinessDetails(caseId: string, data: BusinessDetails): Promise<SaveResult> {
  const payload = {
    case_id: caseId,
    company_legal_name: data.companyLegalName,
    trade_license_no: data.tradeLicenseNo,
    license_issuing_authority: data.licenseIssuingAuthority,
    tl_expiry_date: data.tlExpiryDate || null,
    business_activity: data.businessActivity,
    legal_structure: data.legalStructure,
    year_of_establishment: data.yearOfEstablishment ? parseInt(data.yearOfEstablishment) : null,
    office_address: data.officeAddress,
    emirate: data.emirate,
    ejari_available: data.ejariAvailable
  };

  // Check if record exists
  const { data: existing } = await supabase
    .from('applicant_businesses')
    .select('id')
    .eq('case_id', caseId)
    .maybeSingle();

  let result;
  if (existing) {
    result = await supabase
      .from('applicant_businesses')
      .update(payload)
      .eq('case_id', caseId);
  } else {
    result = await supabase
      .from('applicant_businesses')
      .insert(payload);
  }

  if (result.error) {
    console.error('Error saving business details:', result.error);
    return { success: false, error: result.error.message };
  }

  return { success: true, caseId };
}

export async function getBusinessDetails(caseId: string): Promise<BusinessDetails | null> {
  const { data, error } = await supabase
    .from('applicant_businesses')
    .select('*')
    .eq('case_id', caseId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    companyLegalName: data.company_legal_name,
    tradeLicenseNo: data.trade_license_no,
    licenseIssuingAuthority: data.license_issuing_authority,
    tlExpiryDate: data.tl_expiry_date,
    businessActivity: data.business_activity,
    legalStructure: data.legal_structure,
    yearOfEstablishment: data.year_of_establishment?.toString() || '',
    officeAddress: data.office_address,
    emirate: data.emirate,
    ejariAvailable: data.ejari_available
  };
}

// =====================================================
// OWNERS (business_owners table)
// =====================================================

export async function saveOwners(caseId: string, owners: OwnerDetails[]): Promise<SaveResult> {
  // Delete existing owners first
  await supabase
    .from('business_owners')
    .delete()
    .eq('case_id', caseId);

  if (owners.length === 0) {
    return { success: true, caseId };
  }

  const payload = owners.map((owner, index) => ({
    case_id: caseId,
    owner_name: owner.ownerName,
    role: owner.role || 'Partner',
    nationality: owner.nationality,
    emirates_id: owner.emiratesId,
    passport_number: owner.passportNumber,
    shareholding_percent: owner.shareholdingPercent,
    resident_status: owner.residentStatus,
    mobile: owner.mobile,
    email: owner.email,
    address: owner.address || '',
    is_signatory: owner.isSignatory || false,
    is_ubo: owner.isUbo || false,
    display_order: index + 1
  }));

  const { error } = await supabase
    .from('business_owners')
    .insert(payload);

  if (error) {
    console.error('Error saving owners:', error);
    return { success: false, error: error.message };
  }

  return { success: true, caseId };
}

export async function getOwners(caseId: string): Promise<OwnerDetails[]> {
  const { data, error } = await supabase
    .from('business_owners')
    .select('*')
    .eq('case_id', caseId)
    .order('display_order', { ascending: true });

  if (error || !data) {
    return [];
  }

  return data.map(owner => ({
    id: owner.id,
    ownerName: owner.owner_name,
    nationality: owner.nationality,
    emiratesId: owner.emirates_id,
    passportNumber: owner.passport_number,
    shareholdingPercent: Number(owner.shareholding_percent),
    residentStatus: owner.resident_status,
    mobile: owner.mobile,
    email: owner.email
  }));
}

// =====================================================
// FINANCIAL INPUTS (financial_inputs table)
// =====================================================

export async function saveFinancialInputs(caseId: string, data: BankingTurnover): Promise<SaveResult> {
  const payload = {
    case_id: caseId,
    existing_bank_accounts: data.existingBankAccounts || [],
    primary_operating_bank: data.primaryOperatingBank,
    monthly_avg_turnover: data.monthlyAvgTurnover || 0,
    declared_turnover: (data.monthlyAvgTurnover || 0) * 12, // Annual declared turnover
    vat_registered: data.vatRegistered,
    annual_vat_turnover: data.annualVatTurnover,
    pos_machine: data.posMachine,
    pos_monthly_turnover: data.posMonthlyTurnover,
    cash_intensive: data.cashIntensive,
    sister_concern_exists: data.sisterConcernExists
  };

  // Check if record exists
  const { data: existing } = await supabase
    .from('financial_inputs')
    .select('id')
    .eq('case_id', caseId)
    .maybeSingle();

  let result;
  if (existing) {
    result = await supabase
      .from('financial_inputs')
      .update(payload)
      .eq('case_id', caseId);
  } else {
    result = await supabase
      .from('financial_inputs')
      .insert(payload);
  }

  if (result.error) {
    console.error('Error saving financial inputs:', result.error);
    return { success: false, error: result.error.message };
  }

  return { success: true, caseId };
}

export async function getFinancialInputs(caseId: string): Promise<BankingTurnover | null> {
  const { data, error } = await supabase
    .from('financial_inputs')
    .select('*')
    .eq('case_id', caseId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    existingBankAccounts: data.existing_bank_accounts || [],
    primaryOperatingBank: data.primary_operating_bank,
    monthlyAvgTurnover: Number(data.monthly_avg_turnover),
    vatRegistered: data.vat_registered,
    annualVatTurnover: data.annual_vat_turnover ? Number(data.annual_vat_turnover) : null,
    posMachine: data.pos_machine,
    posMonthlyTurnover: data.pos_monthly_turnover ? Number(data.pos_monthly_turnover) : null,
    cashIntensive: data.cash_intensive,
    sisterConcernExists: data.sister_concern_exists
  };
}

// =====================================================
// LOAN REQUIREMENTS (onboarding_loan_requirements table)
// =====================================================

export async function saveLoanRequirements(caseId: string, data: LoanRequirement): Promise<SaveResult> {
  const payload = {
    case_id: caseId,
    loan_type: data.loanType,
    required_loan_amount: data.requiredLoanAmount,
    purpose: data.purpose,
    preferred_tenure: data.preferredTenure,
    urgent_funding: data.urgentFunding
  };

  // Check if record exists
  const { data: existing } = await supabase
    .from('onboarding_loan_requirements')
    .select('id')
    .eq('case_id', caseId)
    .maybeSingle();

  let result;
  if (existing) {
    result = await supabase
      .from('onboarding_loan_requirements')
      .update(payload)
      .eq('case_id', caseId);
  } else {
    result = await supabase
      .from('onboarding_loan_requirements')
      .insert(payload);
  }

  if (result.error) {
    console.error('Error saving loan requirements:', result.error);
    return { success: false, error: result.error.message };
  }

  return { success: true, caseId };
}

export async function getLoanRequirements(caseId: string): Promise<LoanRequirement | null> {
  const { data, error } = await supabase
    .from('onboarding_loan_requirements')
    .select('*')
    .eq('case_id', caseId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    loanType: data.loan_type,
    requiredLoanAmount: Number(data.required_loan_amount),
    purpose: data.purpose || '',
    preferredTenure: data.preferred_tenure || '',
    urgentFunding: data.urgent_funding
  };
}

// =====================================================
// DOCUMENTS (onboarding_documents table + storage)
// =====================================================

export async function uploadDocument(
  caseId: string, 
  file: File, 
  documentType: string,
  onProgress?: (progress: number) => void
): Promise<{ success: boolean; document?: DocumentUpload; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { success: false, error: 'User not authenticated' };
  }

  // Generate unique file path
  const fileExt = file.name.split('.').pop();
  const fileName = `${caseId}/${documentType}/${Date.now()}.${fileExt}`;

  // Upload to storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('case-documents')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (uploadError) {
    console.error('Error uploading file:', uploadError);
    return { success: false, error: uploadError.message };
  }

  // Create document record
  const { data: docData, error: docError } = await supabase
    .from('onboarding_documents')
    .insert({
      case_id: caseId,
      document_type: documentType,
      file_name: file.name,
      file_path: uploadData.path,
      file_size: file.size,
      mime_type: file.type,
      status: 'uploaded',
      uploaded_by: user.id,
      is_mandatory: ['trade_license', 'owner_passport', 'bank_statements', 'vat_certificate'].includes(documentType)
    })
    .select()
    .single();

  if (docError) {
    console.error('Error saving document record:', docError);
    return { success: false, error: docError.message };
  }

  return {
    success: true,
    document: {
      id: docData.id,
      type: docData.document_type,
      fileName: docData.file_name,
      fileSize: docData.file_size || 0,
      uploadProgress: 100,
      status: 'completed',
      url: uploadData.path
    }
  };
}

export async function deleteDocument(documentId: string): Promise<SaveResult> {
  // Get document path first
  const { data: doc } = await supabase
    .from('onboarding_documents')
    .select('file_path')
    .eq('id', documentId)
    .single();

  if (doc?.file_path) {
    // Delete from storage
    await supabase.storage
      .from('case-documents')
      .remove([doc.file_path]);
  }

  // Delete record
  const { error } = await supabase
    .from('onboarding_documents')
    .delete()
    .eq('id', documentId);

  if (error) {
    console.error('Error deleting document:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function getDocuments(caseId: string): Promise<DocumentUpload[]> {
  const { data, error } = await supabase
    .from('onboarding_documents')
    .select('*')
    .eq('case_id', caseId)
    .order('created_at', { ascending: true });

  if (error || !data) {
    return [];
  }

  return data.map(doc => ({
    id: doc.id,
    type: doc.document_type,
    fileName: doc.file_name,
    fileSize: doc.file_size || 0,
    uploadProgress: 100,
    status: doc.status === 'uploaded' || doc.status === 'verified' ? 'completed' : 
           doc.status === 'rejected' ? 'error' : 'pending',
    url: doc.file_path
  }));
}

// =====================================================
// COMPLETE FORM DATA OPERATIONS
// =====================================================

export async function loadCompleteFormData(caseId: string): Promise<OnboardingFormData | null> {
  try {
    const [businessDetails, owners, financialInputs, loanRequirements, documents] = await Promise.all([
      getBusinessDetails(caseId),
      getOwners(caseId),
      getFinancialInputs(caseId),
      getLoanRequirements(caseId),
      getDocuments(caseId)
    ]);

    // Import the factory functions
    const { createEmptyBusinessDetails, createEmptyBankingTurnover, createEmptyLoanRequirement, createEmptyOwner } = await import('@/types/onboarding.types');

    return {
      businessDetails: businessDetails || createEmptyBusinessDetails(),
      owners: owners.length > 0 ? owners : [createEmptyOwner()],
      bankingTurnover: financialInputs || createEmptyBankingTurnover(),
      loanRequirement: loanRequirements || createEmptyLoanRequirement(),
      documents: documents,
      declarationConfirmed: false,
      authorizationConfirmed: false
    };
  } catch (error) {
    console.error('Error loading complete form data:', error);
    return null;
  }
}

export async function saveCompleteFormData(caseId: string, formData: OnboardingFormData): Promise<SaveResult> {
  try {
    const results = await Promise.all([
      saveBusinessDetails(caseId, formData.businessDetails),
      saveOwners(caseId, formData.owners),
      saveFinancialInputs(caseId, formData.bankingTurnover),
      saveLoanRequirements(caseId, formData.loanRequirement)
    ]);

    const failed = results.find(r => !r.success);
    if (failed) {
      return failed;
    }

    return { success: true, caseId };
  } catch (error) {
    console.error('Error saving complete form data:', error);
    return { success: false, error: 'Failed to save form data' };
  }
}

export async function submitOnboardingCase(caseId: string): Promise<SaveResult> {
  const { error } = await supabase
    .from('onboarding_cases')
    .update({ 
      status: 'in_process' as CaseStatus,
      submitted_at: new Date().toISOString()
    })
    .eq('id', caseId);

  if (error) {
    console.error('Error submitting case:', error);
    return { success: false, error: error.message };
  }

  return { success: true, caseId };
}

// =====================================================
// GET USER CASES
// =====================================================

export interface OnboardingCaseSummary {
  id: string;
  caseNumber: string | null;
  companyName: string;
  loanType: string;
  loanAmount: number;
  status: CaseStatus;
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
}

export async function getUserCases(): Promise<OnboardingCaseSummary[]> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return [];

  const { data: cases, error } = await supabase
    .from('onboarding_cases')
    .select(`
      id,
      case_number,
      status,
      created_at,
      updated_at,
      submitted_at,
      applicant_businesses (company_legal_name),
      onboarding_loan_requirements (loan_type, required_loan_amount)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user cases:', error);
    return [];
  }

  return cases.map(c => ({
    id: c.id,
    caseNumber: c.case_number,
    companyName: (c.applicant_businesses as any)?.company_legal_name || 'Unnamed Company',
    loanType: (c.onboarding_loan_requirements as any)?.loan_type || 'Not specified',
    loanAmount: Number((c.onboarding_loan_requirements as any)?.required_loan_amount) || 0,
    status: c.status,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
    submittedAt: c.submitted_at
  }));
}
