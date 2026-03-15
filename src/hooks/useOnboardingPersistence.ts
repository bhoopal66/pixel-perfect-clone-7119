import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  createOnboardingCase,
  getUserDraftCase,
  loadCompleteFormData,
  saveBusinessDetails,
  saveOwners,
  saveFinancialInputs,
  saveLoanRequirements,
  saveCompleteFormData,
  submitOnboardingCase,
  uploadDocument,
  deleteDocument,
  getDocuments,
  type OnboardingCase,
  type SaveResult
} from '@/services/onboardingService';
import type { 
  OnboardingFormData, 
  BusinessDetails, 
  OwnerDetails, 
  BankingTurnover, 
  LoanRequirement,
  DocumentUpload
} from '@/types/onboarding.types';
import { createEmptyFormData } from '@/types/onboarding.types';
import { toast } from 'sonner';
import { SaveMutex } from '@/utils/saveMutex';
import { validateFile } from '@/utils/validation';

interface UseOnboardingPersistenceReturn {
  caseId: string | null;
  caseNumber: string | null;
  isLoading: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
  formData: OnboardingFormData;
  initializeCase: () => Promise<string | null>;
  saveStep: (step: number) => Promise<boolean>;
  submitCase: () => Promise<boolean>;
  uploadDoc: (file: File, documentType: string) => Promise<DocumentUpload | null>;
  removeDoc: (documentId: string) => Promise<boolean>;
  updateFormData: (updates: Partial<OnboardingFormData>) => void;
  refreshDocuments: () => Promise<void>;
}

// Singleton save mutex to serialize all save operations
const saveMutex = new SaveMutex();

export function useOnboardingPersistence(): UseOnboardingPersistenceReturn {
  const { user } = useAuth();
  const [caseId, setCaseId] = useState<string | null>(null);
  const [caseNumber, setCaseNumber] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [formData, setFormData] = useState<OnboardingFormData>(createEmptyFormData());
  
  // Ref-based submission lock to prevent double submits
  const isSubmittingRef = useRef(false);

  // Initialize or load existing draft case
  const initializeCase = useCallback(async (): Promise<string | null> => {
    if (!user) {
      setIsLoading(false);
      return null;
    }

    setIsLoading(true);
    try {
      const existingCase = await getUserDraftCase();
      
      if (existingCase) {
        setCaseId(existingCase.id);
        setCaseNumber(existingCase.case_number);
        
        const loadedData = await loadCompleteFormData(existingCase.id);
        if (loadedData) {
          setFormData(loadedData);
        }
        
        setIsLoading(false);
        return existingCase.id;
      }

      const result = await createOnboardingCase();
      if (result.success && result.caseId) {
        setCaseId(result.caseId);
        const caseData = await getUserDraftCase();
        if (caseData) {
          setCaseNumber(caseData.case_number);
        }
        setIsLoading(false);
        return result.caseId;
      }

      setIsLoading(false);
      return null;
    } catch (error) {
      console.error('Error initializing case:', error);
      setIsLoading(false);
      return null;
    }
  }, [user]);

  // Save specific step data — serialized through mutex
  const saveStep = useCallback(async (step: number): Promise<boolean> => {
    if (!caseId) {
      toast.error('No active case to save');
      return false;
    }

    let success = false;

    await saveMutex.run(async () => {
      setIsSaving(true);
      let result: SaveResult;

      try {
        switch (step) {
          case 1:
            result = await saveBusinessDetails(caseId, formData.businessDetails);
            break;
          case 2:
            result = await saveOwners(caseId, formData.owners);
            break;
          case 3:
            result = await saveFinancialInputs(caseId, formData.bankingTurnover);
            break;
          case 4:
            result = await saveLoanRequirements(caseId, formData.loanRequirement);
            break;
          case 5:
            result = { success: true };
            break;
          case 6:
            result = await saveCompleteFormData(caseId, formData);
            break;
          default:
            result = { success: true };
        }

        if (result.success) {
          setLastSaved(new Date());
          success = true;
        } else {
          toast.error(result.error || 'Unable to save changes. Please try again.');
        }
      } catch (error) {
        console.error('Error saving step:', error);
        toast.error('Unable to save changes. Please try again.');
      } finally {
        setIsSaving(false);
      }
    });

    return success;
  }, [caseId, formData]);

  // Submit the case — with ref-based double-submit guard
  const submitCase = useCallback(async (): Promise<boolean> => {
    if (!caseId) {
      toast.error('No active case to submit');
      return false;
    }

    // Double-submit guard
    if (isSubmittingRef.current) {
      return false;
    }
    isSubmittingRef.current = true;

    setIsSaving(true);
    try {
      // Save all data first (sequential)
      const saveResult = await saveCompleteFormData(caseId, formData);
      if (!saveResult.success) {
        toast.error(saveResult.error || 'Unable to save before submission. Please try again.');
        return false;
      }

      const submitResult = await submitOnboardingCase(caseId);
      if (submitResult.success) {
        toast.success('Application submitted successfully!');
        return true;
      } else {
        toast.error(submitResult.error || 'Unable to submit application. Please try again.');
        return false;
      }
    } catch (error) {
      console.error('Error submitting case:', error);
      toast.error('Unable to submit application. Please try again.');
      return false;
    } finally {
      setIsSaving(false);
      isSubmittingRef.current = false;
    }
  }, [caseId, formData]);

  // Upload document — with file validation
  const uploadDoc = useCallback(async (file: File, documentType: string): Promise<DocumentUpload | null> => {
    if (!caseId) {
      toast.error('No active case for document upload');
      return null;
    }

    // Validate file before upload
    const validation = validateFile(file);
    if (!validation.valid) {
      toast.error(validation.error || 'Invalid file');
      return null;
    }

    const result = await uploadDocument(caseId, file, documentType);
    if (result.success && result.document) {
      setFormData(prev => {
        // Deduplicate: prevent adding same doc id twice
        const existingIds = new Set(prev.documents.map(d => d.id));
        if (existingIds.has(result.document!.id)) return prev;
        return {
          ...prev,
          documents: [...prev.documents, result.document!]
        };
      });
      toast.success('Document uploaded successfully');
      return result.document;
    } else {
      toast.error(result.error || 'Unable to upload document. Please try again.');
      return null;
    }
  }, [caseId]);

  // Remove document
  const removeDoc = useCallback(async (documentId: string): Promise<boolean> => {
    const result = await deleteDocument(documentId);
    if (result.success) {
      setFormData(prev => ({
        ...prev,
        documents: prev.documents.filter(d => d.id !== documentId)
      }));
      toast.success('Document removed');
      return true;
    } else {
      toast.error(result.error || 'Unable to remove document. Please try again.');
      return false;
    }
  }, []);

  // Refresh documents from database (deduplicated)
  const refreshDocuments = useCallback(async (): Promise<void> => {
    if (!caseId) return;
    
    const docs = await getDocuments(caseId);
    setFormData(prev => ({
      ...prev,
      documents: docs // DB is single source of truth
    }));
  }, [caseId]);

  // Update form data locally
  const updateFormData = useCallback((updates: Partial<OnboardingFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  // Auto-initialize on mount when user is available
  useEffect(() => {
    if (user && !caseId) {
      initializeCase();
    }
  }, [user, caseId, initializeCase]);

  return {
    caseId,
    caseNumber,
    isLoading,
    isSaving,
    lastSaved,
    formData,
    initializeCase,
    saveStep,
    submitCase,
    uploadDoc,
    removeDoc,
    updateFormData,
    refreshDocuments
  };
}
