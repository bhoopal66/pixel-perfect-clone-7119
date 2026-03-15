import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
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
import { MAX_LENGTHS, clampString, clampNumber, isValidEmail, isValidPhone } from '@/utils/validation';

interface OnboardingContextType {
  caseId: string | null;
  caseNumber: string | null;
  isLoading: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  formData: OnboardingFormData;
  updateBusinessDetails: (data: Partial<BusinessDetails>) => void;
  updateOwner: (id: string, data: Partial<OwnerDetails>) => void;
  addOwner: () => void;
  removeOwner: (id: string) => void;
  moveOwner: (fromIndex: number, toIndex: number) => void;
  updateBankingTurnover: (data: Partial<BankingTurnover>) => void;
  updateLoanRequirement: (data: Partial<LoanRequirement>) => void;
  uploadDocument: (file: File, documentType: string) => Promise<DocumentUpload | null>;
  removeDocument: (id: string) => Promise<boolean>;
  refreshDocuments: () => Promise<void>;
  setDeclarationConfirmed: (confirmed: boolean) => void;
  setAuthorizationConfirmed: (confirmed: boolean) => void;
  getTotalShareholding: () => number;
  isStepValid: (step: number) => boolean;
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

  // Track pending debounce data for flush-on-unmount
  const pendingDataRef = useRef<OnboardingFormData | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  // Flush pending save on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (pendingDataRef.current) {
        // Fire-and-forget flush
        updateFormData(pendingDataRef.current);
        pendingDataRef.current = null;
      }
    };
  }, [updateFormData]);

  const setCurrentStep = useCallback((step: number) => {
    // Flush pending save before navigating steps
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    if (pendingDataRef.current) {
      updateFormData(pendingDataRef.current);
      pendingDataRef.current = null;
    }
    setCurrentStepState(step);
  }, [updateFormData]);

  // Debounced auto-save with flush support
  const scheduleSyncToDatabase = useCallback((data: OnboardingFormData) => {
    pendingDataRef.current = data;
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      if (pendingDataRef.current) {
        updateFormData(pendingDataRef.current);
        pendingDataRef.current = null;
      }
    }, 1000);
  }, [updateFormData]);

  const updateBusinessDetails = useCallback((data: Partial<BusinessDetails>) => {
    setLocalFormData(prev => {
      // Enforce length limits on input
      const sanitized = { ...data };
      if (sanitized.companyLegalName !== undefined) sanitized.companyLegalName = clampString(sanitized.companyLegalName, MAX_LENGTHS.companyName);
      if (sanitized.officeAddress !== undefined) sanitized.officeAddress = clampString(sanitized.officeAddress, MAX_LENGTHS.address);
      if (sanitized.tradeLicenseNo !== undefined) sanitized.tradeLicenseNo = clampString(sanitized.tradeLicenseNo, MAX_LENGTHS.tradeLicenseNo);
      if (sanitized.licenseIssuingAuthority !== undefined) sanitized.licenseIssuingAuthority = clampString(sanitized.licenseIssuingAuthority, MAX_LENGTHS.licenseAuthority);
      if (sanitized.businessActivity !== undefined) sanitized.businessActivity = clampString(sanitized.businessActivity, MAX_LENGTHS.businessActivity);

      const updated = {
        ...prev,
        businessDetails: { ...prev.businessDetails, ...sanitized }
      };
      scheduleSyncToDatabase(updated);
      return updated;
    });
  }, [scheduleSyncToDatabase]);

  const updateOwner = useCallback((id: string, data: Partial<OwnerDetails>) => {
    setLocalFormData(prev => {
      // Enforce limits
      const sanitized = { ...data };
      if (sanitized.ownerName !== undefined) sanitized.ownerName = clampString(sanitized.ownerName, MAX_LENGTHS.ownerName);
      if (sanitized.email !== undefined) sanitized.email = clampString(sanitized.email, MAX_LENGTHS.email);
      if (sanitized.mobile !== undefined) sanitized.mobile = clampString(sanitized.mobile, MAX_LENGTHS.phone);
      if (sanitized.address !== undefined) sanitized.address = clampString(sanitized.address, MAX_LENGTHS.address);
      if (sanitized.emiratesId !== undefined) sanitized.emiratesId = clampString(sanitized.emiratesId, MAX_LENGTHS.emiratesId);
      if (sanitized.passportNumber !== undefined) sanitized.passportNumber = clampString(sanitized.passportNumber, MAX_LENGTHS.passportNumber);
      if (sanitized.nationality !== undefined) sanitized.nationality = clampString(sanitized.nationality, MAX_LENGTHS.nationality);
      if (sanitized.shareholdingPercent !== undefined) sanitized.shareholdingPercent = clampNumber(sanitized.shareholdingPercent, 0, 100);

      const updated = {
        ...prev,
        owners: prev.owners.map(owner =>
          owner.id === id ? { ...owner, ...sanitized } : owner
        )
      };
      scheduleSyncToDatabase(updated);
      return updated;
    });
  }, [scheduleSyncToDatabase]);

  const addOwner = useCallback(() => {
    setLocalFormData(prev => {
      const updated = {
        ...prev,
        owners: [...prev.owners, createEmptyOwner()]
      };
      scheduleSyncToDatabase(updated);
      return updated;
    });
  }, [scheduleSyncToDatabase]);

  const removeOwner = useCallback((id: string) => {
    setLocalFormData(prev => {
      const updated = {
        ...prev,
        owners: prev.owners.filter(owner => owner.id !== id)
      };
      scheduleSyncToDatabase(updated);
      return updated;
    });
  }, [scheduleSyncToDatabase]);

  // Proper owner reorder that actually swaps array positions
  const moveOwner = useCallback((fromIndex: number, toIndex: number) => {
    setLocalFormData(prev => {
      if (toIndex < 0 || toIndex >= prev.owners.length) return prev;
      const newOwners = [...prev.owners];
      const [moved] = newOwners.splice(fromIndex, 1);
      newOwners.splice(toIndex, 0, moved);
      const updated = { ...prev, owners: newOwners };
      scheduleSyncToDatabase(updated);
      return updated;
    });
  }, [scheduleSyncToDatabase]);

  const updateBankingTurnover = useCallback((data: Partial<BankingTurnover>) => {
    setLocalFormData(prev => {
      // Clamp numeric values
      const sanitized = { ...data };
      if (sanitized.monthlyAvgTurnover !== undefined) sanitized.monthlyAvgTurnover = Math.max(sanitized.monthlyAvgTurnover, 0);
      if (sanitized.annualVatTurnover !== undefined && sanitized.annualVatTurnover !== null) sanitized.annualVatTurnover = Math.max(sanitized.annualVatTurnover, 0);
      if (sanitized.posMonthlyTurnover !== undefined && sanitized.posMonthlyTurnover !== null) sanitized.posMonthlyTurnover = Math.max(sanitized.posMonthlyTurnover, 0);

      const updated = {
        ...prev,
        bankingTurnover: { ...prev.bankingTurnover, ...sanitized }
      };
      scheduleSyncToDatabase(updated);
      return updated;
    });
  }, [scheduleSyncToDatabase]);

  const updateLoanRequirement = useCallback((data: Partial<LoanRequirement>) => {
    setLocalFormData(prev => {
      const sanitized = { ...data };
      if (sanitized.requiredLoanAmount !== undefined) sanitized.requiredLoanAmount = clampNumber(sanitized.requiredLoanAmount, 0, 500_000_000);
      if (sanitized.purpose !== undefined) sanitized.purpose = clampString(sanitized.purpose, MAX_LENGTHS.purpose);

      const updated = {
        ...prev,
        loanRequirement: { ...prev.loanRequirement, ...sanitized }
      };
      scheduleSyncToDatabase(updated);
      return updated;
    });
  }, [scheduleSyncToDatabase]);

  const uploadDocumentHandler = useCallback(async (file: File, documentType: string): Promise<DocumentUpload | null> => {
    const doc = await uploadDoc(file, documentType);
    if (doc) {
      setLocalFormData(prev => {
        // Deduplicate by id
        const existingIds = new Set(prev.documents.map(d => d.id));
        if (existingIds.has(doc.id)) return prev;
        return {
          ...prev,
          documents: [...prev.documents, doc]
        };
      });
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
            owner.shareholdingPercent > 0 &&
            owner.residentStatus &&
            owner.mobile &&
            owner.email &&
            isValidEmail(owner.email) &&
            isValidPhone(owner.mobile)
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
          lr.requiredLoanAmount <= 500_000_000 &&
          lr.purpose &&
          lr.preferredTenure &&
          lr.urgentFunding !== null
        );
      }
      case 5: {
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
        moveOwner,
        updateBankingTurnover,
        updateLoanRequirement,
        uploadDocument: uploadDocumentHandler,
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

export function useOnboarding(): OnboardingContextType {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}
