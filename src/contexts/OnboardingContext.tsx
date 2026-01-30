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

interface OnboardingContextType {
  currentStep: number;
  setCurrentStep: (step: number) => void;
  formData: OnboardingFormData;
  updateBusinessDetails: (data: Partial<BusinessDetails>) => void;
  updateOwner: (id: string, data: Partial<OwnerDetails>) => void;
  addOwner: () => void;
  removeOwner: (id: string) => void;
  updateBankingTurnover: (data: Partial<BankingTurnover>) => void;
  updateLoanRequirement: (data: Partial<LoanRequirement>) => void;
  addDocument: (doc: DocumentUpload) => void;
  removeDocument: (id: string) => void;
  updateDocument: (id: string, data: Partial<DocumentUpload>) => void;
  setDeclarationConfirmed: (confirmed: boolean) => void;
  setAuthorizationConfirmed: (confirmed: boolean) => void;
  getTotalShareholding: () => number;
  isStepValid: (step: number) => boolean;
  resetForm: () => void;
  saveProgress: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

const STORAGE_KEY = 'onboarding_form_data';
const STEP_KEY = 'onboarding_current_step';

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [currentStep, setCurrentStep] = useState(() => {
    const saved = localStorage.getItem(STEP_KEY);
    return saved ? parseInt(saved, 10) : 1;
  });
  
  const [formData, setFormData] = useState<OnboardingFormData>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return createEmptyFormData();
      }
    }
    return createEmptyFormData();
  });

  // Autosave on form data change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
  }, [formData]);

  useEffect(() => {
    localStorage.setItem(STEP_KEY, currentStep.toString());
  }, [currentStep]);

  const saveProgress = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    localStorage.setItem(STEP_KEY, currentStep.toString());
  }, [formData, currentStep]);

  const updateBusinessDetails = useCallback((data: Partial<BusinessDetails>) => {
    setFormData(prev => ({
      ...prev,
      businessDetails: { ...prev.businessDetails, ...data }
    }));
  }, []);

  const updateOwner = useCallback((id: string, data: Partial<OwnerDetails>) => {
    setFormData(prev => ({
      ...prev,
      owners: prev.owners.map(owner =>
        owner.id === id ? { ...owner, ...data } : owner
      )
    }));
  }, []);

  const addOwner = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      owners: [...prev.owners, createEmptyOwner()]
    }));
  }, []);

  const removeOwner = useCallback((id: string) => {
    setFormData(prev => ({
      ...prev,
      owners: prev.owners.filter(owner => owner.id !== id)
    }));
  }, []);

  const updateBankingTurnover = useCallback((data: Partial<BankingTurnover>) => {
    setFormData(prev => ({
      ...prev,
      bankingTurnover: { ...prev.bankingTurnover, ...data }
    }));
  }, []);

  const updateLoanRequirement = useCallback((data: Partial<LoanRequirement>) => {
    setFormData(prev => ({
      ...prev,
      loanRequirement: { ...prev.loanRequirement, ...data }
    }));
  }, []);

  const addDocument = useCallback((doc: DocumentUpload) => {
    setFormData(prev => ({
      ...prev,
      documents: [...prev.documents, doc]
    }));
  }, []);

  const removeDocument = useCallback((id: string) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter(doc => doc.id !== id)
    }));
  }, []);

  const updateDocument = useCallback((id: string, data: Partial<DocumentUpload>) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.map(doc =>
        doc.id === id ? { ...doc, ...data } : doc
      )
    }));
  }, []);

  const setDeclarationConfirmed = useCallback((confirmed: boolean) => {
    setFormData(prev => ({ ...prev, declarationConfirmed: confirmed }));
  }, []);

  const setAuthorizationConfirmed = useCallback((confirmed: boolean) => {
    setFormData(prev => ({ ...prev, authorizationConfirmed: confirmed }));
  }, []);

  const getTotalShareholding = useCallback(() => {
    return formData.owners.reduce((sum, owner) => sum + (owner.shareholdingPercent || 0), 0);
  }, [formData.owners]);

  const isStepValid = useCallback((step: number): boolean => {
    switch (step) {
      case 1: {
        const bd = formData.businessDetails;
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
          formData.owners.length > 0 &&
          formData.owners.every(owner =>
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
        const bt = formData.bankingTurnover;
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
        const lr = formData.loanRequirement;
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
        if (formData.bankingTurnover.vatRegistered) {
          mandatoryTypes.push('vat_certificate');
        }
        return mandatoryTypes.every(type =>
          formData.documents.some(doc => doc.type === type && doc.status === 'completed')
        );
      }
      case 6:
        return formData.declarationConfirmed && formData.authorizationConfirmed;
      default:
        return false;
    }
  }, [formData, getTotalShareholding]);

  const resetForm = useCallback(() => {
    setFormData(createEmptyFormData());
    setCurrentStep(1);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STEP_KEY);
  }, []);

  return (
    <OnboardingContext.Provider
      value={{
        currentStep,
        setCurrentStep,
        formData,
        updateBusinessDetails,
        updateOwner,
        addOwner,
        removeOwner,
        updateBankingTurnover,
        updateLoanRequirement,
        addDocument,
        removeDocument,
        updateDocument,
        setDeclarationConfirmed,
        setAuthorizationConfirmed,
        getTotalShareholding,
        isStepValid,
        resetForm,
        saveProgress
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
