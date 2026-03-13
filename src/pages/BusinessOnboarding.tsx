import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingProvider, useOnboarding } from '@/contexts/OnboardingContext';
import {
  OnboardingProgress,
  OnboardingNavigation,
  Step1BusinessDetails,
  Step2OwnerDetails,
  Step3BankingTurnover,
  Step4LoanRequirement,
  Step5DocumentUpload,
  Step6Review
} from '@/components/onboarding';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

const STEP_LABELS = [
  'Business Details',
  'Owner Details',
  'Banking & Turnover',
  'Loan Requirement',
  'Documents',
  'Review & Submit'
];

function OnboardingContent() {
  const navigate = useNavigate();
  const { currentStep, setCurrentStep, isStepValid, resetForm, formData } = useOnboarding();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNext = () => {
    if (!isStepValid(currentStep)) {
      toast.error('Please complete all required fields before proceeding');
      return;
    }
    if (currentStep < 6) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleSubmit = async () => {
    if (!formData.declarationConfirmed || !formData.authorizationConfirmed) {
      toast.error('Please confirm both declarations to submit');
      return;
    }

    setIsSubmitting(true);
    
    // Simulate submission
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast.success('Application submitted successfully! Redirecting to Eligibility Engine…');
    resetForm();
    navigate('/eligibility-engine');
    
    setIsSubmitting(false);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1: return <Step1BusinessDetails />;
      case 2: return <Step2OwnerDetails />;
      case 3: return <Step3BankingTurnover />;
      case 4: return <Step4LoanRequirement />;
      case 5: return <Step5DocumentUpload />;
      case 6: return <Step6Review />;
      default: return <Step1BusinessDetails />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background border-b">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>
            <h1 className="text-lg font-semibold">Business Loan Application</h1>
          </div>
          <OnboardingProgress
            currentStep={currentStep}
            totalSteps={6}
            stepLabels={STEP_LABELS}
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-6">
        {renderStep()}
      </main>

      {/* Navigation */}
      <OnboardingNavigation
        currentStep={currentStep}
        totalSteps={6}
        onBack={handleBack}
        onNext={handleNext}
        onSubmit={handleSubmit}
        isNextDisabled={!isStepValid(currentStep)}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}

export default function BusinessOnboarding() {
  return (
    <OnboardingProvider>
      <OnboardingContent />
    </OnboardingProvider>
  );
}
