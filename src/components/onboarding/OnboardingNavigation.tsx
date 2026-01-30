import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Send, Loader2 } from 'lucide-react';

interface OnboardingNavigationProps {
  currentStep: number;
  totalSteps: number;
  onBack: () => void;
  onNext: () => void;
  onSubmit?: () => void;
  isNextDisabled?: boolean;
  isSubmitting?: boolean;
}

export function OnboardingNavigation({
  currentStep,
  totalSteps,
  onBack,
  onNext,
  onSubmit,
  isNextDisabled = false,
  isSubmitting = false
}: OnboardingNavigationProps) {
  const isLastStep = currentStep === totalSteps;
  const isFirstStep = currentStep === 1;

  return (
    <div className="sticky bottom-0 left-0 right-0 bg-background border-t p-4 mt-auto">
      <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isFirstStep}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back</span>
        </Button>

        <div className="flex-1 text-center text-sm text-muted-foreground">
          Auto-saved
        </div>

        {isLastStep ? (
          <Button
            onClick={onSubmit}
            disabled={isNextDisabled || isSubmitting}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span>Submit Application</span>
          </Button>
        ) : (
          <Button
            onClick={onNext}
            disabled={isNextDisabled}
            className="flex items-center gap-2"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
