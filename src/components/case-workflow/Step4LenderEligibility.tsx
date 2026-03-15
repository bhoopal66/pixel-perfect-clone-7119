import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription } from '../ui/alert';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../ui/collapsible';
import {
  Shield, ArrowLeft, Play, RefreshCw, ChevronDown, ChevronRight,
  CheckCircle, XCircle, AlertTriangle, Eye, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { RuleEngineExecutor } from '@/services/ruleEngineExecutor';
import { CurrencyService } from '@/services/currencyService';
import type { Case } from '@/types/case.types';

interface Step4LenderEligibilityProps {
  caseData: Case;
  onBack: () => void;
  onComplete?: () => void;
  isLoading: boolean;
}

interface ExecutionResult {
  id: string;
  lender_name: string;
  product_name: string;
  eligibility_status: string;
  recommended_limit: number;
  recommended_tenure: number;
  score: number;
  major_fail_count: number;
  minor_fail_count: number;
  risk_flags: string[];
  failed_rules: any[];
  decision_summary: string;
  details?: RuleDetail[];
}

interface RuleDetail {
  rule_code: string;
  field_name: string;
  observed_value: string;
  operator: string;
  threshold_value: string;
  pass_fail_status: string;
  impact_type: string;
  impact_value: string;
  message: string;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  eligible: { bg: 'bg-success/10 border-success/30', text: 'text-success', icon: <CheckCircle className="h-5 w-5" /> },
  conditionally_eligible: { bg: 'bg-warning/10 border-warning/30', text: 'text-warning', icon: <AlertTriangle className="h-5 w-5" /> },
  review_required: { bg: 'bg-orange-50 dark:bg-orange-950/30 border-orange-300 dark:border-orange-700', text: 'text-orange-600', icon: <Eye className="h-5 w-5" /> },
  not_eligible: { bg: 'bg-destructive/10 border-destructive/30', text: 'text-destructive', icon: <XCircle className="h-5 w-5" /> },
};

const STATUS_LABELS: Record<string, string> = {
  eligible: 'Eligible',
  conditionally_eligible: 'Conditionally Eligible',
  review_required: 'Manual Review',
  not_eligible: 'Not Eligible',
  pending: 'Pending',
};

export const Step4LenderEligibility: React.FC<Step4LenderEligibilityProps> = ({
  caseData,
  onBack,
  onComplete,
  isLoading: parentLoading,
}) => {
  const [results, setResults] = useState<ExecutionResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [assessmentCaseId, setAssessmentCaseId] = useState<string | null>(null);
  const [expandedResult, setExpandedResult] = useState<string | null>(null);

  const formatCurrency = (v: number) => CurrencyService.format(v, 'AED');

  // Create or find matching assessment case for this workflow case
  const ensureAssessmentCase = useCallback(async (): Promise<string> => {
    if (assessmentCaseId) return assessmentCaseId;

    // Check if an assessment case already exists for this case number
    if (caseData.case_number) {
      const { data: existing } = await supabase
        .from('assessment_cases')
        .select('id')
        .eq('company_name', caseData.client_name)
        .eq('status', 'analysis_complete')
        .limit(1);

      if (existing?.length) {
        setAssessmentCaseId(existing[0].id);
        return existing[0].id;
      }
    }

    // Create a new assessment case from the workflow case data
    const monthsCovered = (() => {
      if (caseData.statement_period_from && caseData.statement_period_to) {
        const from = new Date(caseData.statement_period_from);
        const to = new Date(caseData.statement_period_to);
        return Math.max(1, Math.round((to.getTime() - from.getTime()) / (30.44 * 24 * 60 * 60 * 1000)));
      }
      return 6;
    })();

    const avgMonthlyCredit = caseData.declared_turnover / monthsCovered;
    const normalizedTurnover = caseData.adjusted_turnover;

    const { data: newCase, error } = await supabase
      .from('assessment_cases')
      .insert({
        company_name: caseData.client_name,
        status: 'analysis_complete',
        total_bank_credits: caseData.declared_turnover,
        total_bank_debits: 0,
        avg_monthly_credit: avgMonthlyCredit,
        avg_monthly_debit: 0,
        avg_monthly_balance: 0,
        estimated_annual_turnover: avgMonthlyCredit * 12,
        declared_vat_turnover: caseData.vat_turnover,
        bank_vat_variance_percent: caseData.variance_percent,
        normalized_turnover: normalizedTurnover,
        statement_months_covered: monthsCovered,
        vat_periods_covered: caseData.vat_turnover > 0 ? 4 : 0,
        variance_tag: caseData.variance_bucket,
        user_id: caseData.user_id,
      })
      .select('id')
      .single();

    if (error) throw error;
    setAssessmentCaseId(newCase.id);
    return newCase.id;
  }, [assessmentCaseId, caseData]);

  const runLenderEligibility = useCallback(async () => {
    setIsRunning(true);
    try {
      const acId = await ensureAssessmentCase();
      const execResults = await RuleEngineExecutor.executeAllLenders(acId);

      if (execResults.length === 0) {
        toast.info('No active lenders with configured rules found. Add lenders and rule sets in the Lender Policy Admin.');
        setResults([]);
        setHasRun(true);
        return;
      }

      // Load lender/product names and details
      const enriched: ExecutionResult[] = [];
      for (const r of execResults) {
        const [lenderRes, productRes, detailsRes] = await Promise.all([
          supabase.from('onboarding_lenders').select('name').eq('id', r.lender_id).single(),
          (supabase as any).from('lender_products').select('product_name').eq('id', r.product_id).single(),
          (supabase as any).from('lender_rule_result_details').select('*').eq('execution_id', r.id).order('created_at'),
        ]);

        enriched.push({
          id: r.id,
          lender_name: lenderRes.data?.name || 'Unknown Lender',
          product_name: productRes.data?.product_name || 'Default Product',
          eligibility_status: r.eligibility_status,
          recommended_limit: Number(r.recommended_limit) || 0,
          recommended_tenure: r.recommended_tenure || 0,
          score: Number(r.score) || 0,
          major_fail_count: r.major_fail_count || 0,
          minor_fail_count: r.minor_fail_count || 0,
          risk_flags: (r.risk_flags as string[]) || [],
          failed_rules: (r.failed_rules as any[]) || [],
          decision_summary: r.decision_summary || '',
          details: (detailsRes.data || []) as RuleDetail[],
        });
      }

      setResults(enriched);
      setHasRun(true);
      toast.success(`Eligibility checked across ${enriched.length} lender product(s)`);
    } catch (err: any) {
      console.error('Lender eligibility error:', err);
      toast.error(err.message || 'Failed to run lender eligibility');
    } finally {
      setIsRunning(false);
    }
  }, [ensureAssessmentCase]);

  // Load previous results on mount
  useEffect(() => {
    if (!assessmentCaseId) return;
    const loadPrevious = async () => {
      const { data } = await (supabase as any)
        .from('lender_execution_results')
        .select('*')
        .eq('case_id', assessmentCaseId);
      if (data?.length) {
        setHasRun(true);
        // Trigger full reload
        runLenderEligibility();
      }
    };
    loadPrevious();
  }, [assessmentCaseId]);

  const eligibleCount = results.filter(r => r.eligibility_status === 'eligible' || r.eligibility_status === 'conditionally_eligible').length;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Lender Eligibility Testing</CardTitle>
                <CardDescription>
                  Run {caseData.client_name}'s financial data against all configured lender rule engines
                </CardDescription>
              </div>
            </div>
            <Button
              onClick={runLenderEligibility}
              disabled={isRunning || parentLoading}
              size="lg"
            >
              {isRunning ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : hasRun ? (
                <RefreshCw className="mr-2 h-4 w-4" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              {hasRun ? 'Re-run All Lenders' : 'Run Lender Eligibility'}
            </Button>
          </div>
        </CardHeader>
        {hasRun && results.length > 0 && (
          <CardContent className="pt-0">
            <div className="flex gap-4 text-sm">
              <div className="px-3 py-1.5 rounded-md bg-muted">
                <span className="text-muted-foreground">Total: </span>
                <span className="font-semibold">{results.length}</span>
              </div>
              <div className="px-3 py-1.5 rounded-md bg-success/10">
                <span className="text-success">Eligible: </span>
                <span className="font-semibold text-success">{eligibleCount}</span>
              </div>
              <div className="px-3 py-1.5 rounded-md bg-destructive/10">
                <span className="text-destructive">Not Eligible: </span>
                <span className="font-semibold text-destructive">{results.length - eligibleCount}</span>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* No lenders configured */}
      {hasRun && results.length === 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            No active lenders with configured rule sets found. Navigate to <strong>Lender Policy Admin</strong> to add lenders, products, and rule sets.
          </AlertDescription>
        </Alert>
      )}

      {/* Results Cards */}
      {results.map((result) => {
        const style = STATUS_STYLES[result.eligibility_status] || STATUS_STYLES.not_eligible;
        const isExpanded = expandedResult === result.id;

        return (
          <Card key={result.id} className={cn('border', style.bg)}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={style.text}>{style.icon}</div>
                  <div>
                    <CardTitle className="text-base">{result.lender_name}</CardTitle>
                    <CardDescription>{result.product_name}</CardDescription>
                  </div>
                </div>
                <Badge className={cn('text-xs', style.text, style.bg.replace('border-', 'border '))}>
                  {STATUS_LABELS[result.eligibility_status] || result.eligibility_status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-background rounded-lg">
                  <p className="text-xs text-muted-foreground">Recommended Limit</p>
                  <p className="font-mono font-semibold text-sm">{formatCurrency(result.recommended_limit)}</p>
                </div>
                <div className="p-3 bg-background rounded-lg">
                  <p className="text-xs text-muted-foreground">Tenure</p>
                  <p className="font-mono font-semibold text-sm">{result.recommended_tenure} months</p>
                </div>
                <div className="p-3 bg-background rounded-lg">
                  <p className="text-xs text-muted-foreground">Score</p>
                  <p className="font-mono font-semibold text-sm">{result.score}/100</p>
                </div>
                <div className="p-3 bg-background rounded-lg">
                  <p className="text-xs text-muted-foreground">Failures</p>
                  <p className="text-sm">
                    <span className="text-destructive font-semibold">{result.major_fail_count}</span>
                    <span className="text-muted-foreground"> major, </span>
                    <span className="text-warning font-semibold">{result.minor_fail_count}</span>
                    <span className="text-muted-foreground"> minor</span>
                  </p>
                </div>
              </div>

              {/* Risk Flags */}
              {result.risk_flags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {result.risk_flags.map((flag, i) => (
                    <Badge key={i} variant="outline" className="text-xs text-warning border-warning/30">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      {flag}
                    </Badge>
                  ))}
                </div>
              )}

              {result.decision_summary && (
                <p className="text-sm text-muted-foreground italic">{result.decision_summary}</p>
              )}

              {/* Expandable Rule Details */}
              {result.details && result.details.length > 0 && (
                <Collapsible open={isExpanded} onOpenChange={() => setExpandedResult(isExpanded ? null : result.id)}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-full justify-between">
                      <span className="text-xs">View Rule Details ({result.details.length} rules)</span>
                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="mt-2 border rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-muted/50">
                              <th className="text-left p-2 font-medium">Rule</th>
                              <th className="text-left p-2 font-medium">Field</th>
                              <th className="text-left p-2 font-medium">Observed</th>
                              <th className="text-left p-2 font-medium">Threshold</th>
                              <th className="text-center p-2 font-medium">Result</th>
                              <th className="text-left p-2 font-medium">Impact</th>
                            </tr>
                          </thead>
                          <tbody>
                            {result.details.map((d, i) => (
                              <tr key={i} className={cn('border-t', d.pass_fail_status === 'fail' && 'bg-destructive/5')}>
                                <td className="p-2 font-mono">{d.rule_code || '—'}</td>
                                <td className="p-2">{d.field_name || '—'}</td>
                                <td className="p-2 font-mono">{d.observed_value}</td>
                                <td className="p-2 font-mono">{d.operator} {d.threshold_value || ''}</td>
                                <td className="p-2 text-center">
                                  {d.pass_fail_status === 'pass' ? (
                                    <CheckCircle className="h-3.5 w-3.5 text-success inline" />
                                  ) : (
                                    <XCircle className="h-3.5 w-3.5 text-destructive inline" />
                                  )}
                                </td>
                                <td className="p-2 text-muted-foreground">{d.message}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </CardContent>
          </Card>
        );
      })}

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack} disabled={parentLoading}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Eligibility
        </Button>
        {onComplete && hasRun && (
          <Button onClick={onComplete} disabled={parentLoading}>
            <CheckCircle className="mr-2 h-4 w-4" />
            Complete Case
          </Button>
        )}
      </div>
    </div>
  );
};
