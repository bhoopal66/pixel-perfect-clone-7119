import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { toast } from 'sonner';
import { 
  User, 
  FileText, 
  Calculator, 
  CheckCircle,
  ArrowLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CaseService } from '@/services/caseService';
import { Step1CreateCase } from './Step1CreateCase';
import { Step2StatementAnalysis } from './Step2StatementAnalysis';
import { Step3EligibilityCheck } from './Step3EligibilityCheck';
import { STATUS_CONFIG } from '@/types/case.types';
import type { Case, CaseCreateInput, CaseAnalysisInput, CaseEligibilityInput } from '@/types/case.types';

interface CaseWorkflowProps {
  caseId?: string;
  onComplete?: (caseData: Case) => void;
  onCancel?: () => void;
}

const STEPS = [
  { id: 1, name: 'Create Case', icon: User },
  { id: 2, name: 'Statement Analysis', icon: FileText },
  { id: 3, name: 'Eligibility Check', icon: Calculator }
];

export const CaseWorkflow: React.FC<CaseWorkflowProps> = ({
  caseId,
  onComplete,
  onCancel
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load existing case if caseId provided
  useEffect(() => {
    if (caseId) {
      loadCase(caseId);
    }
  }, [caseId]);

  const loadCase = async (id: string) => {
    setIsLoading(true);
    try {
      const data = await CaseService.getById(id);
      if (data) {
        setCaseData(data);
        // Determine starting step based on status
        if (data.status === 'Draft') {
          setCurrentStep(2); // Go to analysis
        } else if (data.status === 'Analysis Completed' || data.status === 'Statement Uploaded') {
          setCurrentStep(3); // Go to eligibility
        } else {
          setCurrentStep(3); // Default to last step
        }
      }
    } catch (error) {
      console.error('Failed to load case:', error);
      toast.error('Failed to load case');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 1: Create case
  const handleCreateCase = async (input: CaseCreateInput) => {
    setIsLoading(true);
    try {
      const newCase = await CaseService.create(input);
      setCaseData(newCase);
      setCurrentStep(2);
      toast.success('Case created successfully');
    } catch (error) {
      console.error('Failed to create case:', error);
      toast.error('Failed to create case');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Update analysis
  const handleUpdateAnalysis = async (input: CaseAnalysisInput) => {
    if (!caseData) return;
    setIsLoading(true);
    try {
      const updated = await CaseService.updateAnalysis(caseData.id, input);
      setCaseData(updated);
      toast.success('Analysis saved');
    } catch (error) {
      console.error('Failed to update analysis:', error);
      toast.error('Failed to save analysis');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAnalysisComplete = async () => {
    if (!caseData) return;
    setIsLoading(true);
    try {
      const updated = await CaseService.markAnalysisCompleted(caseData.id);
      setCaseData(updated);
      setCurrentStep(3);
      toast.success('Analysis completed');
    } catch (error) {
      console.error('Failed to mark analysis complete:', error);
      toast.error('Failed to complete analysis');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Update eligibility
  const handleUpdatePOS = async (input: CaseEligibilityInput) => {
    if (!caseData) return;
    setIsLoading(true);
    try {
      const updated = await CaseService.updateEligibility(caseData.id, input);
      setCaseData(updated);
      toast.success('Eligibility recalculated');
    } catch (error) {
      console.error('Failed to update eligibility:', error);
      toast.error('Failed to recalculate');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinalizeEligibility = async () => {
    if (!caseData) return;
    setIsLoading(true);
    try {
      const updated = await CaseService.finalizeEligibility(caseData.id);
      setCaseData(updated);
      toast.success('Eligibility finalized!');
      onComplete?.(updated);
    } catch (error) {
      console.error('Failed to finalize eligibility:', error);
      toast.error('Failed to finalize');
    } finally {
      setIsLoading(false);
    }
  };

  const progress = (currentStep / STEPS.length) * 100;

  return (
    <div className="space-y-6">
      {/* Header with Cancel */}
      {onCancel && (
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Cases
          </Button>
          {caseData && (
            <Badge className={STATUS_CONFIG[caseData.status]?.color || 'bg-muted'}>
              {caseData.status}
            </Badge>
          )}
        </div>
      )}

      {/* Stepper */}
      <Card>
        <CardContent className="pt-6">
          <div className="mb-4">
            <Progress value={progress} className="h-2" />
          </div>
          
          <div className="flex justify-between">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div
                  key={step.id}
                  className={cn(
                    "flex flex-col items-center gap-2 flex-1",
                    index > 0 && "border-l border-border"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors",
                    isActive && "border-primary bg-primary text-primary-foreground",
                    isCompleted && "border-success bg-success/10 text-success",
                    !isActive && !isCompleted && "border-muted-foreground/30 text-muted-foreground"
                  )}>
                    {isCompleted ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  <div className="text-center">
                    <p className={cn(
                      "text-sm font-medium",
                      isActive && "text-primary",
                      isCompleted && "text-success",
                      !isActive && !isCompleted && "text-muted-foreground"
                    )}>
                      Step {step.id}
                    </p>
                    <p className="text-xs text-muted-foreground hidden sm:block">
                      {step.name}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      {currentStep === 1 && (
        <Step1CreateCase
          onSubmit={handleCreateCase}
          isLoading={isLoading}
        />
      )}

      {currentStep === 2 && caseData && (
        <Step2StatementAnalysis
          caseData={caseData}
          onSubmit={handleUpdateAnalysis}
          onMarkComplete={handleMarkAnalysisComplete}
          onBack={() => setCurrentStep(1)}
          isLoading={isLoading}
        />
      )}

      {currentStep === 3 && caseData && (
        <Step3EligibilityCheck
          caseData={caseData}
          onUpdatePOS={handleUpdatePOS}
          onFinalize={handleFinalizeEligibility}
          onBack={() => setCurrentStep(2)}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};
