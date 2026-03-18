import { useState, useMemo, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Play, RotateCcw, Download, XCircle, CheckCircle, User, Building2,
  ArrowLeft, History, FileText, ShieldAlert, Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/ThemeToggle';

import {
  RuleResultsPanel,
  FinalDecisionCard,
  EvaluationHistoryTable,
  AuditTimeline,
  OverrideDecisionDialog,
  CalculatedMetricsCard,
} from '@/components/comfi-policy';

import {
  evaluateComfiPolicy,
  persistEvaluation,
  overrideEvaluation,
  buildExportPayload,
  downloadExportJson,
  fetchEvaluationDetail,
  type ComfiPolicyInput,
  type ComfiEvaluationResult,
} from '@/services/comfiPolicyService';

// ─── Form State ──────────────────────────────────────────────────────────────

interface FormState {
  applicant_name: string;
  company_name: string;
  nationality: string;
  industry: string;
  gross_turnover: string;
  vat_component: string;
  turnover_already_excludes_vat: boolean;
  average_sales: string;
  current_payments: string;
  outward_cheque_returns: string;
  existing_monthly_obligations: string;
  analyst_notes: string;
}

const INITIAL_FORM: FormState = {
  applicant_name: '', company_name: '', nationality: '', industry: '',
  gross_turnover: '', vat_component: '', turnover_already_excludes_vat: false,
  average_sales: '', current_payments: '', outward_cheque_returns: '',
  existing_monthly_obligations: '', analyst_notes: '',
};

const SAMPLE_FORM: FormState = {
  applicant_name: 'Ahmed Khan',
  company_name: 'Alpha Technical Services LLC',
  nationality: 'Pakistani',
  industry: 'Technical Services',
  gross_turnover: '1000000',
  vat_component: '50000',
  turnover_already_excludes_vat: false,
  average_sales: '200000',
  current_payments: '40000',
  outward_cheque_returns: '2',
  existing_monthly_obligations: '25000',
  analyst_notes: 'Sample test case for COMFI policy evaluation.',
};

function formToInput(form: FormState): ComfiPolicyInput {
  return {
    applicant_name: form.applicant_name,
    company_name: form.company_name,
    nationality: form.nationality,
    industry: form.industry,
    gross_turnover: Number(form.gross_turnover) || 0,
    vat_component: Number(form.vat_component) || 0,
    turnover_already_excludes_vat: form.turnover_already_excludes_vat,
    average_sales: Number(form.average_sales) || 0,
    current_payments: Number(form.current_payments) || 0,
    outward_cheque_returns: Math.max(0, Math.floor(Number(form.outward_cheque_returns) || 0)),
    existing_monthly_obligations: Number(form.existing_monthly_obligations) || 0,
    analyst_notes: form.analyst_notes,
  };
}

// ─── Page Component ──────────────────────────────────────────────────────────

export default function ComfiPolicyEngine() {
  const navigate = useNavigate();
  const { user, hasAdminPrivileges, isSupervisor, isCoordinator } = useAuth();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [result, setResult] = useState<ComfiEvaluationResult | null>(null);
  const [evaluationId, setEvaluationId] = useState<string | null>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [showOverride, setShowOverride] = useState(false);
  const [overrideStatus, setOverrideStatus] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('evaluate');

  const canEdit = isCoordinator || isSupervisor || hasAdminPrivileges;
  const canOverride = hasAdminPrivileges;

  // Parsed numeric values for live calculations
  const numericValues = useMemo(() => ({
    grossTurnover: Number(form.gross_turnover) || 0,
    vatComponent: Number(form.vat_component) || 0,
    averageSales: Number(form.average_sales) || 0,
    currentPayments: Number(form.current_payments) || 0,
    outwardChequeReturns: Math.max(0, Math.floor(Number(form.outward_cheque_returns) || 0)),
  }), [form.gross_turnover, form.vat_component, form.average_sales, form.current_payments, form.outward_cheque_returns]);

  const updateField = useCallback((field: keyof FormState, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  // ─── Run Evaluation ─────────────────────────────────────────────────

  const runMutation = useMutation({
    mutationFn: async () => {
      const input = formToInput(form);
      const evalResult = evaluateComfiPolicy(input);
      const id = await persistEvaluation(input, evalResult, user!.id);
      return { evalResult, id };
    },
    onSuccess: async ({ evalResult, id }) => {
      setResult(evalResult);
      setEvaluationId(id);
      setOverrideStatus(null);
      toast.success(`Evaluation complete — ${evalResult.application_status}`);
      queryClient.invalidateQueries({ queryKey: ['comfi-evaluation-history'] });

      // Fetch audit logs
      try {
        const detail = await fetchEvaluationDetail(id);
        setAuditLogs(detail.auditLogs);
      } catch { /* ignore */ }
    },
    onError: (e: any) => toast.error(`Evaluation failed: ${e.message}`),
  });

  const handleRun = () => {
    if (!form.applicant_name.trim() || !form.company_name.trim()) {
      toast.error('Applicant Name and Company Name are required.');
      return;
    }
    if (!form.gross_turnover && !form.turnover_already_excludes_vat) {
      toast.error('Gross Turnover is required.');
      return;
    }
    runMutation.mutate();
  };

  const handleReset = () => {
    setForm(INITIAL_FORM);
    setResult(null);
    setEvaluationId(null);
    setAuditLogs([]);
    setOverrideStatus(null);
  };

  const handleLoadSample = () => {
    setForm(SAMPLE_FORM);
    setResult(null);
    setEvaluationId(null);
    toast.info('Sample test case loaded');
  };

  const handleExport = () => {
    if (!result) return;
    const payload = buildExportPayload(formToInput(form), result, evaluationId || undefined);
    downloadExportJson(payload, form.applicant_name);
    toast.success('Decision summary exported');
  };

  const handleOverride = async (status: string, reason: string) => {
    if (!evaluationId) return;
    await overrideEvaluation(evaluationId, status, reason, user!.id);
    setOverrideStatus(status);
    toast.success('Override applied successfully');
    queryClient.invalidateQueries({ queryKey: ['comfi-evaluation-history'] });

    // Refresh audit logs
    try {
      const detail = await fetchEvaluationDetail(evaluationId);
      setAuditLogs(detail.auditLogs);
    } catch { /* ignore */ }
  };

  const handleViewHistoryDetail = async (id: string) => {
    try {
      const detail = await fetchEvaluationDetail(id);
      const ev = detail.evaluation;

      // Populate form from history
      setForm({
        applicant_name: ev.applicant_name || '',
        company_name: ev.company_name || '',
        nationality: ev.nationality || '',
        industry: ev.industry || '',
        gross_turnover: String(ev.gross_turnover || 0),
        vat_component: String(ev.vat_component || 0),
        turnover_already_excludes_vat: ev.turnover_already_excludes_vat || false,
        average_sales: String(ev.average_sales || 0),
        current_payments: String(ev.current_payments || 0),
        outward_cheque_returns: String(ev.outward_cheque_returns || 0),
        existing_monthly_obligations: String(ev.existing_monthly_obligations || 0),
        analyst_notes: ev.analyst_notes || '',
      });

      // Rebuild result from stored data
      setResult({
        product_code: 'COMFI',
        policy_name: 'COMFI Policy',
        application_status: ev.application_status,
        engine_status: ev.engine_status || 'Completed',
        final_recommendation: ev.final_recommendation || '',
        reject_reason: ev.reject_reason || null,
        adjusted_turnover: Number(ev.adjusted_turnover) || 0,
        eligible_sales: Number(ev.eligible_sales) || 0,
        eligible_finance: Number(ev.eligible_finance) || 0,
        rule_log: detail.ruleLogs.map((r: any) => ({
          rule_code: r.rule_code,
          rule_name: r.rule_name,
          sequence: r.sequence_no,
          status: r.status,
          message: r.message || '',
          input_value: r.input_value_json,
          output_value: r.output_value_json,
          threshold: r.threshold_json,
          is_hard_decline: r.is_hard_decline,
        })),
      });

      setEvaluationId(id);
      setOverrideStatus(ev.override_status || null);
      setAuditLogs(detail.auditLogs);
      setActiveTab('evaluate');
      toast.info('Historical evaluation loaded');
    } catch (e: any) {
      toast.error(`Failed to load evaluation: ${e.message}`);
    }
  };

  const isRejected = result?.application_status === 'Rejected';
  const isEligible = result?.application_status?.includes('Eligible') ?? false;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-background/80 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-lg font-bold text-foreground">COMFI Policy Evaluation</h1>
                <p className="text-xs text-muted-foreground">Internal Credit Screening — Lender Rule Engine</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {result && (
                <Badge
                  variant={isRejected ? 'destructive' : isEligible ? 'default' : 'secondary'}
                  className="hidden sm:flex"
                >
                  {overrideStatus || result.application_status}
                </Badge>
              )}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Status Alerts */}
        {isRejected && (
          <Alert variant="destructive" className="mb-6">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Application Rejected</AlertTitle>
            <AlertDescription>{result?.reject_reason}</AlertDescription>
          </Alert>
        )}
        {isEligible && (
          <Alert className="mb-6 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800">
            <CheckCircle className="h-4 w-4 text-emerald-600" />
            <AlertTitle className="text-emerald-800 dark:text-emerald-400">Eligible – Subject to Credit Review</AlertTitle>
            <AlertDescription className="text-emerald-700 dark:text-emerald-300">{result?.final_recommendation}</AlertDescription>
          </Alert>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="evaluate" className="gap-1.5">
              <Play className="h-3.5 w-3.5" /> Evaluate
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1.5">
              <History className="h-3.5 w-3.5" /> History
            </TabsTrigger>
            {auditLogs.length > 0 && (
              <TabsTrigger value="audit" className="gap-1.5">
                <Clock className="h-3.5 w-3.5" /> Audit Trail
              </TabsTrigger>
            )}
          </TabsList>

          {/* ─── EVALUATE TAB ─────────────────────────────────────────── */}
          <TabsContent value="evaluate">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* LEFT: Input Form */}
              <div className="lg:col-span-2 space-y-6">
                {/* Applicant Info */}
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base flex items-center gap-2">
                      <User className="h-4 w-4" /> Applicant Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label>Applicant Name <span className="text-destructive">*</span></Label>
                        <Input value={form.applicant_name} onChange={e => updateField('applicant_name', e.target.value)} placeholder="Full name" maxLength={200} disabled={!canEdit} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Company Name <span className="text-destructive">*</span></Label>
                        <Input value={form.company_name} onChange={e => updateField('company_name', e.target.value)} placeholder="Company legal name" maxLength={200} disabled={!canEdit} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Nationality</Label>
                        <Input value={form.nationality} onChange={e => updateField('nationality', e.target.value)} placeholder="e.g. Pakistani, Indian, Emirati" disabled={!canEdit} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Industry</Label>
                        <Input value={form.industry} onChange={e => updateField('industry', e.target.value)} placeholder="e.g. Trading, Technical Services" disabled={!canEdit} />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Financial Inputs */}
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Building2 className="h-4 w-4" /> Business Financial Inputs
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <Label>Gross Turnover (AED) <span className="text-destructive">*</span></Label>
                        <Input type="number" min="0" value={form.gross_turnover} onChange={e => updateField('gross_turnover', e.target.value)} placeholder="0" disabled={!canEdit} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>VAT Component (AED)</Label>
                        <Input
                          type="number" min="0"
                          value={form.vat_component}
                          onChange={e => updateField('vat_component', e.target.value)}
                          placeholder="0"
                          disabled={!canEdit || form.turnover_already_excludes_vat}
                        />
                      </div>
                      <div className="space-y-1.5 flex items-end">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={form.turnover_already_excludes_vat}
                            onCheckedChange={v => updateField('turnover_already_excludes_vat', v)}
                            disabled={!canEdit}
                          />
                          <Label className="text-xs cursor-pointer">Turnover already excludes VAT</Label>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Average Sales (AED) <span className="text-destructive">*</span></Label>
                        <Input type="number" min="0" value={form.average_sales} onChange={e => updateField('average_sales', e.target.value)} placeholder="0" disabled={!canEdit} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Current Payments (AED)</Label>
                        <Input type="number" min="0" value={form.current_payments} onChange={e => updateField('current_payments', e.target.value)} placeholder="0" disabled={!canEdit} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Outward Cheque Returns <span className="text-destructive">*</span></Label>
                        <Input type="number" min="0" step="1" value={form.outward_cheque_returns} onChange={e => updateField('outward_cheque_returns', e.target.value)} placeholder="0" disabled={!canEdit} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Existing Monthly Obligations (AED)</Label>
                        <Input type="number" min="0" value={form.existing_monthly_obligations} onChange={e => updateField('existing_monthly_obligations', e.target.value)} placeholder="0" disabled={!canEdit} />
                      </div>
                    </div>
                    <Separator className="my-4" />
                    <div className="space-y-1.5">
                      <Label>Analyst Notes / Comments</Label>
                      <Textarea
                        value={form.analyst_notes}
                        onChange={e => updateField('analyst_notes', e.target.value)}
                        placeholder="Additional observations, context, or recommendations..."
                        rows={3}
                        maxLength={500}
                        disabled={!canEdit}
                      />
                      <p className="text-[10px] text-muted-foreground">{form.analyst_notes.length}/500 characters</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 flex-wrap">
                  <Button onClick={handleRun} disabled={runMutation.isPending || !canEdit} className="gap-1.5">
                    <Play className="h-4 w-4" />
                    {runMutation.isPending ? 'Running...' : 'Run Eligibility Check'}
                  </Button>
                  <Button variant="outline" onClick={handleReset} disabled={runMutation.isPending}>
                    <RotateCcw className="h-4 w-4 mr-1" /> Reset
                  </Button>
                  <Button variant="outline" onClick={handleLoadSample} disabled={runMutation.isPending}>
                    <FileText className="h-4 w-4 mr-1" /> Load Sample
                  </Button>
                  {result && (
                    <Button variant="outline" onClick={handleExport}>
                      <Download className="h-4 w-4 mr-1" /> Export Decision
                    </Button>
                  )}
                  {result && canOverride && evaluationId && (
                    <Button variant="outline" onClick={() => setShowOverride(true)} className="border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-950/30">
                      <ShieldAlert className="h-4 w-4 mr-1" /> Override
                    </Button>
                  )}
                </div>

                {/* Rule Results */}
                {result && <RuleResultsPanel ruleLog={result.rule_log} />}
              </div>

              {/* RIGHT: Decision + Metrics */}
              <div className="space-y-6">
                <FinalDecisionCard result={result} overrideStatus={overrideStatus} />
                <CalculatedMetricsCard
                  grossTurnover={numericValues.grossTurnover}
                  vatComponent={numericValues.vatComponent}
                  turnoverExcludesVat={form.turnover_already_excludes_vat}
                  averageSales={numericValues.averageSales}
                  currentPayments={numericValues.currentPayments}
                  outwardChequeReturns={numericValues.outwardChequeReturns}
                />
                {auditLogs.length > 0 && <AuditTimeline auditLogs={auditLogs} />}
              </div>
            </div>
          </TabsContent>

          {/* ─── HISTORY TAB ──────────────────────────────────────────── */}
          <TabsContent value="history">
            <EvaluationHistoryTable onViewDetail={handleViewHistoryDetail} />
          </TabsContent>

          {/* ─── AUDIT TAB ────────────────────────────────────────────── */}
          <TabsContent value="audit">
            <AuditTimeline auditLogs={auditLogs} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Override Dialog */}
      <OverrideDecisionDialog
        open={showOverride}
        onClose={() => setShowOverride(false)}
        onConfirm={handleOverride}
        currentStatus={result?.application_status || ''}
      />
    </div>
  );
}
