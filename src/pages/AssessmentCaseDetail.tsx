import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  ArrowLeft, FileText, Eye, BarChart3, Shield, Brain, Download, Clock, Building2, Users, ShieldAlert,
} from 'lucide-react';
import { DocumentsTab } from '@/components/case-detail/DocumentsTab';
import { ExtractionTab } from '@/components/case-detail/ExtractionTab';
import { FinancialSummaryTab } from '@/components/case-detail/FinancialSummaryTab';
import { LenderResultsTab } from '@/components/case-detail/LenderResultsTab';
import { AiRecommendationTab } from '@/components/case-detail/AiRecommendationTab';
import { ReportsTab } from '@/components/case-detail/ReportsTab';
import { TimelineTab } from '@/components/case-detail/TimelineTab';
import { RelatedPartiesTab } from '@/components/case-detail/RelatedPartiesTab';
import { FraudDetectionTab } from '@/components/case-detail/FraudDetectionTab';

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  analyzing: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  review: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
};

const TABS = [
  { key: 'documents', label: 'Documents', icon: FileText },
  { key: 'extraction', label: 'Extraction', icon: Eye },
  { key: 'summary', label: 'Financial Summary', icon: BarChart3 },
  { key: 'related_parties', label: 'Related Parties', icon: Users },
  { key: 'fraud', label: 'Fraud Detection', icon: ShieldAlert },
  { key: 'lenders', label: 'Lender Results', icon: Shield },
  { key: 'ai', label: 'AI Recommendation', icon: Brain },
  { key: 'reports', label: 'Reports', icon: Download },
  { key: 'timeline', label: 'Timeline', icon: Clock },
];

export default function AssessmentCaseDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const { data: caseData, isLoading } = useQuery({
    queryKey: ['assessment-case', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assessment_cases')
        .select('*')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <p className="text-muted-foreground">Case not found</p>
        <Button variant="outline" onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-background/80 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Building2 className="h-5 w-5 text-primary" />
              <div>
                <h1 className="text-lg font-semibold leading-tight">
                  {caseData.company_name || 'Untitled Case'}
                </h1>
                <p className="text-xs text-muted-foreground">
                  {caseData.case_number || caseData.id.slice(0, 8)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge className={STATUS_COLORS[caseData.status] || STATUS_COLORS.draft}>
                {caseData.status}
              </Badge>
              {(caseData as any).analysis_completed && (
                <Badge variant="outline" className="text-emerald-600 border-emerald-300">Analysis ✓</Badge>
              )}
              {(caseData as any).lenders_run_completed && (
                <Badge variant="outline" className="text-blue-600 border-blue-300">Lenders ✓</Badge>
              )}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Tabbed Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs defaultValue="documents" className="space-y-6">
          <TabsList className="grid w-full grid-cols-8 h-auto p-1">
            {TABS.map((tab) => (
              <TabsTrigger
                key={tab.key}
                value={tab.key}
                className="flex items-center gap-1.5 text-xs sm:text-sm py-2"
              >
                <tab.icon className="h-4 w-4 hidden sm:block" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="documents">
            <DocumentsTab caseId={id!} />
          </TabsContent>
          <TabsContent value="extraction">
            <ExtractionTab caseId={id!} />
          </TabsContent>
          <TabsContent value="summary">
            <FinancialSummaryTab caseId={id!} />
          </TabsContent>
          <TabsContent value="related_parties">
            <RelatedPartiesTab caseId={id!} />
          </TabsContent>
          <TabsContent value="lenders">
            <LenderResultsTab caseId={id!} />
          </TabsContent>
          <TabsContent value="ai">
            <AiRecommendationTab caseId={id!} />
          </TabsContent>
          <TabsContent value="reports">
            <ReportsTab caseId={id!} />
          </TabsContent>
          <TabsContent value="timeline">
            <TimelineTab caseId={id!} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
