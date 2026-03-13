import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Upload, Eye, BarChart3, Receipt, Layers, Shield, Edit3,
  ArrowLeft, RotateCcw, Briefcase, Trophy
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  UploadDocuments,
  ExtractionReview,
  BankAnalysis,
  VATAnalysis,
  CombinedSummary,
  LenderResults,
  ManualReview,
} from '@/components/eligibility-engine';
import { useEligibilityAssessment } from '@/hooks/useEligibilityAssessment';
import type { AssessmentStep } from '@/types/assessment.types';

const STEPS: { key: AssessmentStep; label: string; icon: React.ReactNode; requiresAnalysis: boolean }[] = [
  { key: 'upload', label: 'Upload', icon: <Upload className="h-4 w-4" />, requiresAnalysis: false },
  { key: 'extraction', label: 'Extraction', icon: <Eye className="h-4 w-4" />, requiresAnalysis: true },
  { key: 'bank_analysis', label: 'Bank Analysis', icon: <BarChart3 className="h-4 w-4" />, requiresAnalysis: true },
  { key: 'vat_analysis', label: 'VAT Analysis', icon: <Receipt className="h-4 w-4" />, requiresAnalysis: true },
  { key: 'combined_summary', label: 'Summary', icon: <Layers className="h-4 w-4" />, requiresAnalysis: true },
  { key: 'lender_results', label: 'Lender Results', icon: <Shield className="h-4 w-4" />, requiresAnalysis: true },
  { key: 'manual_review', label: 'Review', icon: <Edit3 className="h-4 w-4" />, requiresAnalysis: true },
];

const EligibilityEngine: React.FC = () => {
  const navigate = useNavigate();
  const assessment = useEligibilityAssessment();
  const hasAnalysis = assessment.monthlySummaries.length > 0 || assessment.caseId !== null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-background/80 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="p-2 rounded-xl gradient-accent">
                <Shield className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">Eligibility Assessment</h1>
                <p className="text-xs text-muted-foreground">
                  {assessment.caseNumber
                    ? `Case: ${assessment.caseNumber}`
                    : 'Upload documents to begin'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {hasAnalysis && (
                <Button variant="outline" size="sm" onClick={assessment.resetAssessment}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  New Assessment
                </Button>
              )}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs
          value={assessment.currentStep}
          onValueChange={(v) => {
            const step = STEPS.find(s => s.key === v);
            if (step && (!step.requiresAnalysis || hasAnalysis)) {
              assessment.setCurrentStep(v as AssessmentStep);
            }
          }}
        >
          <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
            {STEPS.map((step) => {
              const disabled = step.requiresAnalysis && !hasAnalysis;
              return (
                <TabsTrigger
                  key={step.key}
                  value={step.key}
                  disabled={disabled}
                  className="flex items-center gap-1.5 text-xs sm:text-sm data-[state=active]:bg-background"
                >
                  {step.icon}
                  <span className="hidden sm:inline">{step.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          <div className="mt-6">
            <TabsContent value="upload">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <UploadDocuments
                  companyName={assessment.companyName}
                  onCompanyNameChange={assessment.setCompanyName}
                  bankFiles={assessment.bankFiles}
                  vatFiles={assessment.vatFiles}
                  onBankFiles={assessment.handleBankFiles}
                  onVatFiles={assessment.handleVatFiles}
                  onRemoveBankFile={assessment.removeBankFile}
                  onRemoveVatFile={assessment.removeVatFile}
                  onProceed={assessment.runAnalysis}
                  isProcessing={assessment.isProcessing}
                />
              </motion.div>
            </TabsContent>

            <TabsContent value="extraction">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <ExtractionReview
                  bankFiles={assessment.bankFiles}
                  vatFiles={assessment.vatFiles}
                />
              </motion.div>
            </TabsContent>

            <TabsContent value="bank_analysis">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <BankAnalysis
                  monthlySummaries={assessment.monthlySummaries}
                  bankFiles={assessment.bankFiles}
                />
              </motion.div>
            </TabsContent>

            <TabsContent value="vat_analysis">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <VATAnalysis
                  vatAnalysis={assessment.vatAnalysis}
                  vatFiles={assessment.vatFiles}
                />
              </motion.div>
            </TabsContent>

            <TabsContent value="combined_summary">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <CombinedSummary
                  summary={assessment.combinedSummary}
                  caseNumber={assessment.caseNumber}
                />
              </motion.div>
            </TabsContent>

            <TabsContent value="lender_results">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <LenderResults results={assessment.lenderResults} />
              </motion.div>
            </TabsContent>

            <TabsContent value="manual_review">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <ManualReview
                  caseId={assessment.caseId}
                  summary={assessment.combinedSummary}
                />
              </motion.div>
            </TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  );
};

export default EligibilityEngine;
