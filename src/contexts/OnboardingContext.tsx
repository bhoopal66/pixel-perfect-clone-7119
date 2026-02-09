import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  OnboardingFormData,
  BusinessDetails,
  OwnerDetails,
  BankingTurnover,
  LoanRequirement,
  DocumentUpload,
  createEmptyFormData,
  createEmptyOwner
} from '@/types/onboarding.types';
import { useOnboardingPersistence } from '@/hooks/useOnboardingPersistence';
import { useDebouncedCallback } from '@/hooks/useDebounce';

interface OnboardingContextType {
  // Case info
  caseId: string | null;
  caseNumber: string | null;
  isLoading: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
  
  // Step management
  currentStep: number;
  setCurrentStep: (step: number) => void;
  
  // Form data
  formData: OnboardingFormData;
  updateBusinessDetails: (data: Partial<BusinessDetails>) => void;
  updateOwner: (id: string, data: Partial<OwnerDetails>) => void;
  addOwner: () => void;
  removeOwner: (id: string) => void;
  updateBankingTurnover: (data: Partial<BankingTurnover>) => void;
  updateLoanRequirement: (data: Partial<LoanRequirement>) => void;
  
  // Document management
  uploadDocument: (file: File, documentType: string) => Promise<DocumentUpload | null>;
  removeDocument: (id: string) => Promise<boolean>;
  refreshDocuments: () => Promise<void>;
  
  // Confirmations
  setDeclarationConfirmed: (confirmed: boolean) => void;
  setAuthorizationConfirmed: (confirmed: boolean) => void;
  
  // Validation
  getTotalShareholding: () => number;
  isStepValid: (step: number) => boolean;
  
  // Actions
  saveCurrentStep: () => Promise<boolean>;
  submitApplication: () => Promise<boolean>;
  resetForm: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

const STEP_KEY = 'onboarding_current_step';

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const {
    caseId,
    caseNumber,
    isLoading,
    isSaving,
    lastSaved,
    formData: persistedFormData,
    initializeCase,
    saveStep,
    submitCase,
    uploadDoc,
    removeDoc,
    updateFormData,
    refreshDocuments
  } = useOnboardingPersistence();

  const [currentStep, setCurrentStepState] = useState(() => {
    const saved = localStorage.getItem(STEP_KEY);
    return saved ? parseInt(saved, 10) : 1;
  });
  
  const [localFormData, setLocalFormData] = useState<OnboardingFormData>(createEmptyFormData());
  const [declarationConfirmed, setDeclarationConfirmedState] = useState(false);
  const [authorizationConfirmed, setAuthorizationConfirmedState] = useState(false);

  // Sync persisted form data to local state
  useEffect(() => {
    if (persistedFormData) {
      setLocalFormData(persistedFormData);
    }
  }, [persistedFormData]);

  // Save step to localStorage
  useEffect(() => {
    localStorage.setItem(STEP_KEY, currentStep.toString());
  }, [currentStep]);

  const setCurrentStep = useCallback((step: number) => {
    setCurrentStepState(step);
  }, []);

  // Debounced auto-save to database
  const debouncedSyncToDatabase = useDebouncedCallback((data: OnboardingFormData) => {
    updateFormData(data);
  }, 1000);

  const updateBusinessDetails = useCallback((data: Partial<BusinessDetails>) => {
    setLocalFormData(prev => {
      const updated = {
        ...prev,
        businessDetails: { ...prev.businessDetails, ...data }
      };
      debouncedSyncToDatabase(updated);
      return updated;
    });
  }, [debouncedSyncToDatabase]);

  const updateOwner = useCallback((id: string, data: Partial<OwnerDetails>) => {
    setLocalFormData(prev => {
      const updated = {
        ...prev,
        owners: prev.owners.map(owner =>
          owner.id === id ? { ...owner, ...data } : owner
        )
      };
      debouncedSyncToDatabase(updated);
      return updated;
    });
  }, [debouncedSyncToDatabase]);

  const addOwner = useCallback(() => {
    setLocalFormData(prev => {
      const updated = {
        ...prev,
        owners: [...prev.owners, createEmptyOwner()]
      };
      debouncedSyncToDatabase(updated);
      return updated;
    });
  }, [debouncedSyncToDatabase]);

  const removeOwner = useCallback((id: string) => {
    setLocalFormData(prev => {
      const updated = {
        ...prev,
        owners: prev.owners.filter(owner => owner.id !== id)
      };
      debouncedSyncToDatabase(updated);
      return updated;
    });
  }, [debouncedSyncToDatabase]);

  const updateBankingTurnover = useCallback((data: Partial<BankingTurnover>) => {
    setLocalFormData(prev => {
      const updated = {
        ...prev,
        bankingTurnover: { ...prev.bankingTurnover, ...data }
      };
      debouncedSyncToDatabase(updated);
      return updated;
    });
  }, [debouncedSyncToDatabase]);

  const updateLoanRequirement = useCallback((data: Partial<LoanRequirement>) => {
    setLocalFormData(prev => {
      const updated = {
        ...prev,
        loanRequirement: { ...prev.loanRequirement, ...data }
      };
      debouncedSyncToDatabase(updated);
      return updated;
    });
  }, [debouncedSyncToDatabase]);

  const uploadDocument = useCallback(async (file: File, documentType: string): Promise<DocumentUpload | null> => {
    const doc = await uploadDoc(file, documentType);
    if (doc) {
      setLocalFormData(prev => ({
        ...prev,
        documents: [...prev.documents, doc]
      }));
    }
    return doc;
  }, [uploadDoc]);

  const removeDocument = useCallback(async (id: string): Promise<boolean> => {
    const success = await removeDoc(id);
    if (success) {
      setLocalFormData(prev => ({
        ...prev,
        documents: prev.documents.filter(doc => doc.id !== id)
      }));
    }
    return success;
  }, [removeDoc]);

  const setDeclarationConfirmed = useCallback((confirmed: boolean) => {
    setDeclarationConfirmedState(confirmed);
    setLocalFormData(prev => ({ ...prev, declarationConfirmed: confirmed }));
  }, []);

  const setAuthorizationConfirmed = useCallback((confirmed: boolean) => {
    setAuthorizationConfirmedState(confirmed);
    setLocalFormData(prev => ({ ...prev, authorizationConfirmed: confirmed }));
  }, []);

  const getTotalShareholding = useCallback(() => {
    return localFormData.owners.reduce((sum, owner) => sum + (owner.shareholdingPercent || 0), 0);
  }, [localFormData.owners]);

  const isStepValid = useCallback((step: number): boolean => {
    switch (step) {
      case 1: {
        const bd = localFormData.businessDetails;
        return !!(
          bd.companyLegalName &&
          bd.tradeLicenseNo &&
          bd.licenseIssuingAuthority &&
          bd.tlExpiryDate &&
          bd.businessActivity &&
          bd.legalStructure &&
          bd.yearOfEstablishment &&
          bd.officeAddress &&
          bd.emirate &&
          bd.ejariAvailable !== null
        );
      }
      case 2: {
        const totalShareholding = getTotalShareholding();
        return (
          localFormData.owners.length > 0 &&
          localFormData.owners.every(owner =>
            owner.ownerName &&
            owner.nationality &&
            owner.emiratesId &&
            owner.passportNumber &&
            owner.shareholdingPercent > 0 &&
            owner.residentStatus &&
            owner.mobile &&
            owner.email
          ) &&
          totalShareholding === 100
        );
      }
      case 3: {
        const bt = localFormData.bankingTurnover;
        const vatValid = bt.vatRegistered === false || (bt.vatRegistered === true && bt.annualVatTurnover && bt.annualVatTurnover > 0);
        const posValid = bt.posMachine === false || (bt.posMachine === true && bt.posMonthlyTurnover && bt.posMonthlyTurnover > 0);
        return !!(
          bt.primaryOperatingBank &&
          bt.monthlyAvgTurnover > 0 &&
          bt.vatRegistered !== null &&
          vatValid &&
          bt.posMachine !== null &&
          posValid
        );
      }
      case 4: {
        const lr = localFormData.loanRequirement;
        return !!(
          lr.loanType &&
          lr.requiredLoanAmount > 0 &&
          lr.purpose &&
          lr.preferredTenure &&
          lr.urgentFunding !== null
        );
      }
      case 5: {
        // Check mandatory documents
        const mandatoryTypes = ['trade_license', 'owner_passport', 'bank_statements'];
        if (localFormData.bankingTurnover.vatRegistered) {
          mandatoryTypes.push('vat_certificate');
        }
        return mandatoryTypes.every(type =>
          localFormData.documents.some(doc => doc.type === type && doc.status === 'completed')
        );
      }
      case 6:
        return declarationConfirmed && authorizationConfirmed;
      default:
        return false;
    }
  }, [localFormData, getTotalShareholding, declarationConfirmed, authorizationConfirmed]);

  const saveCurrentStep = useCallback(async (): Promise<boolean> => {
    return saveStep(currentStep);
  }, [saveStep, currentStep]);

  const submitApplication = useCallback(async (): Promise<boolean> => {
    return submitCase();
  }, [submitCase]);

  const resetForm = useCallback(() => {
    setLocalFormData(createEmptyFormData());
    setCurrentStepState(1);
    setDeclarationConfirmedState(false);
    setAuthorizationConfirmedState(false);
    localStorage.removeItem(STEP_KEY);
  }, []);

  // Merge local confirmations into formData for consumers
  const formDataWithConfirmations = {
    ...localFormData,
    declarationConfirmed,
    authorizationConfirmed
  };

  return (
    <OnboardingContext.Provider
      value={{
        caseId,
        caseNumber,
        isLoading,
        isSaving,
        lastSaved,
        currentStep,
        setCurrentStep,
        formData: formDataWithConfirmations,
        updateBusinessDetails,
        updateOwner,
        addOwner,
        removeOwner,
        updateBankingTurnover,
        updateLoanRequirement,
        uploadDocument,
        removeDocument,
        refreshDocuments,
        setDeclarationConfirmed,
        setAuthorizationConfirmed,
        getTotalShareholding,
        isStepValid,
        saveCurrentStep,
        submitApplication,
        resetForm
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}
