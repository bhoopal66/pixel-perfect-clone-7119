import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Play, RotateCcw, Download, CheckCircle, XCircle, AlertTriangle,
  Minus, User, Building2, ArrowLeft, History, FileText
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface ComfiInput {
  applicant_name: string;
  company_name: string;
  nationality: string;
  industry: string;
  gross_turnover: string;
  vat_component: string;
  average_sales: string;
  current_payments: string;
  outward_cheque_returns: string;
  existing_monthly_obligations: string;
  analyst_notes: string;
}

interface RuleLogEntry {
  rule_name: string;
  rule_code: string;
  status: 'Passed' | 'Failed' | 'Not Applicable' | 'Applied' | 'Completed' | 'Allowed';
  detail: string;
}

interface EvaluationResult {
  application_status: string;
  reject_reason: string | null;
  final_recommendation: string;
  adjusted_turnover: number;
  eligible_sales: number;
  eligible_finance: number;
  rule_log: RuleLogEntry[];
}

const INITIAL_INPUT: ComfiInput = {
  applicant_name: '',
  company_name: '',
  nationality: '',
  industry: '',
  gross_turnover: '',
  vat_component: '',
  average_sales: '',
  current_payments: '',
  outward_cheque_returns: '',
  existing_monthly_obligations: '',
  analyst_notes: '',
};

const SAMPLE_INPUT: ComfiInput = {
  applicant_name: 'Ahmed Khan',
  company_name: 'Alpha Technical Services LLC',
  nationality: 'Pakistani',
  industry: 'Technical Services',
  gross_turnover: '1000000',
  vat_component: '50000',
  average_sales: '200000',
  current_payments: '40000',
  outward_cheque_returns: '2',
  existing_monthly_obligations: '0',
  analyst_notes: 'Sample test case for COMFI policy evaluation.',
};

function evaluateComfiPolicy(input: ComfiInput): EvaluationResult {
  const grossTurnover = Number(input.gross_turnover) || 0;
  const vatComponent = Number(input.vat_component) || 0;
  const averageSales = Number(input.average_sales) || 0;
  const currentPayments = Number(input.current_payments) || 0;
  const chequeReturns = Number(input.outward_cheque_returns) || 0;

  const ruleLog: RuleLogEntry[] = [];

  // Rule 1: Outward Cheque Return
  if (chequeReturns > 3) {
    ruleLog.push({
      rule_name: 'Outward Cheque Return Check',
      rule_code: 'COMFI-R01',
      status: 'Failed',
      detail: `Outward cheque returns: ${chequeReturns} (> 3). Application rejected.`,
    });
    return {
      application_status: 'Rejected',
      reject_reason: 'More than three outward cheque returns',
      final_recommendation: 'Decline',
      adjusted_turnover: 0,
      eligible_sales: 0,
      eligible_finance: 0,
      rule_log: ruleLog,
    };
  }
  ruleLog.push({
    rule_name: 'Outward Cheque Return Check',
    rule_code: 'COMFI-R01',
    status: 'Passed',
    detail: `Outward cheque returns: ${chequeReturns} (≤ 3). Passed.`,
  });

  // Rule 2: DBR — Not Applicable
  ruleLog.push({
    rule_name: 'DBR Rule',
    rule_code: 'COMFI-R02',
    status: 'Not Applicable',
    detail: 'Debt Burden Ratio is not applicable for COMFI product.',
  });

  // Rule 3: VAT Exclusion
  const adjustedTurnover = grossTurnover - vatComponent;
  ruleLog.push({
    rule_name: 'VAT Exclusion',
    rule_code: 'COMFI-R03',
    status: 'Applied',
    detail: `Adjusted Turnover = ${grossTurnover.toLocaleString()} − ${vatComponent.toLocaleString()} = ${adjustedTurnover.toLocaleString()}`,
  });

  // Rule 4: Sales Assessment
  const eligibleSales = averageSales - currentPayments;
  ruleLog.push({
    rule_name: 'Eligible Sales Calculation',
    rule_code: 'COMFI-R04',
    status: 'Completed',
    detail: `Eligible Sales = ${averageSales.toLocaleString()} − ${currentPayments.toLocaleString()} = ${eligibleSales.toLocaleString()}`,
  });

  // Rule 5: Finance Limit
  const eligibleFinance = adjustedTurnover * 0.60;
  ruleLog.push({
    rule_name: 'Finance Limit Calculation',
    rule_code: 'COMFI-R05',
    status: 'Completed',
    detail: `Eligible Finance = ${adjustedTurnover.toLocaleString()} × 60% = ${eligibleFinance.toLocaleString()}`,
  });

  // Rule 6: Industry Check
  ruleLog.push({
    rule_name: 'Industry Check',
    rule_code: 'COMFI-R06',
    status: 'Allowed',
    detail: `Industry "${input.industry || 'N/A'}" is allowed. All industries eligible.`,
  });

  // Rule 7: Nationality Check
  ruleLog.push({
    rule_name: 'Nationality Check',
    rule_code: 'COMFI-R07',
    status: 'Allowed',
    detail: `Nationality "${input.nationality || 'N/A'}" is allowed. No nationality restrictions.`,
  });

  return {
    application_status: 'Eligible – Subject to Credit Review',
    reject_reason: null,
    final_recommendation: 'Proceed to Credit Review',
    adjusted_turnover: adjustedTurnover,
    eligible_sales: eligibleSales,
    eligible_finance: eligibleFinance,
    rule_log: ruleLog,
  };
}

function getStatusColor(status: string) {
  if (status === 'Rejected') return 'destructive';
  if (status.includes('Eligible')) return 'default';
  return 'secondary';
}

function getRuleStatusIcon(status: string) {
  switch (status) {
    case 'Passed':
    case 'Applied':
    case 'Completed':
    case 'Allowed':
      return <CheckCircle className="h-4 w-4 text-emerald-500" />;
    case 'Failed':
      return <XCircle className="h-4 w-4 text-destructive" />;
    case 'Not Applicable':
      return <Minus className="h-4 w-4 text-muted-foreground" />;
    default:
      return <AlertTriangle className="h-4 w-4 text-amber-500" />;
  }
}

function getRuleStatusBadgeClass(status: string) {
  switch (status) {
    case 'Passed':
    case 'Applied':
    case 'Completed':
    case 'Allowed':
      return 'bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:text-emerald-400';
    case 'Failed':
      return 'bg-destructive/10 text-destructive border-destructive/20';
    case 'Not Applicable':
      return 'bg-muted text-muted-foreground border-border';
    default:
      return 'bg-amber-500/10 text-amber-700 border-amber-200';
  }
}

export default function ComfiPolicyEngine() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [input, setInput] = useState<ComfiInput>(INITIAL_INPUT);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const { data: history, refetch: refetchHistory } = useQuery({
    queryKey: ['comfi-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comfi_policy_evaluations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
    enabled: showHistory,
  });

  const saveMutation = useMutation({
    mutationFn: async (evalResult: EvaluationResult) => {
      const { error } = await supabase.from('comfi_policy_evaluations').insert({
        user_id: user?.id,
        applicant_name: input.applicant_name,
        company_name: input.company_name,
        nationality: input.nationality,
        industry: input.industry,
        gross_turnover: Number(input.gross_turnover) || 0,
        vat_component: Number(input.vat_component) || 0,
        adjusted_turnover: evalResult.adjusted_turnover,
        average_sales: Number(input.average_sales) || 0,
        current_payments: Number(input.current_payments) || 0,
        outward_cheque_returns: Number(input.outward_cheque_returns) || 0,
        existing_monthly_obligations: Number(input.existing_monthly_obligations) || 0,
        eligible_sales: evalResult.eligible_sales,
        eligible_finance: evalResult.eligible_finance,
        application_status: evalResult.application_status,
        reject_reason: evalResult.reject_reason,
        final_recommendation: evalResult.final_recommendation,
        rule_log_json: evalResult.rule_log as any,
        analyst_notes: input.analyst_notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Evaluation saved to database');
      if (showHistory) refetchHistory();
    },
    onError: (e: any) => toast.error(`Save failed: ${e.message}`),
  });

  const handleRun = () => {
    if (!input.applicant_name || !input.company_name) {
      toast.error('Applicant Name and Company Name are required.');
      return;
    }
    const evalResult = evaluateComfiPolicy(input);
    setResult(evalResult);
    saveMutation.mutate(evalResult);
  };

  const handleReset = () => {
    setInput(INITIAL_INPUT);
    setResult(null);
  };

  const handleLoadSample = () => {
    setInput(SAMPLE_INPUT);
    setResult(null);
    toast.info('Sample test case loaded');
  };

  const handleExport = () => {
    if (!result) return;
    const exportData = {
      timestamp: new Date().toISOString(),
      applicant: { name: input.applicant_name, company: input.company_name, nationality: input.nationality, industry: input.industry },
      financials: {
        gross_turnover: Number(input.gross_turnover) || 0,
        vat_component: Number(input.vat_component) || 0,
        adjusted_turnover: result.adjusted_turnover,
        average_sales: Number(input.average_sales) || 0,
        current_payments: Number(input.current_payments) || 0,
        outward_cheque_returns: Number(input.outward_cheque_returns) || 0,
      },
      decision: {
        application_status: result.application_status,
        reject_reason: result.reject_reason,
        final_recommendation: result.final_recommendation,
        eligible_sales: result.eligible_sales,
        eligible_finance: result.eligible_finance,
      },
      rule_log: result.rule_log,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comfi-decision-${input.applicant_name.replace(/\s+/g, '_')}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Decision summary exported');
  };

  const updateField = (field: keyof ComfiInput, value: string) => setInput(prev => ({ ...prev, [field]: value }));

  const isRejected = result?.application_status === 'Rejected';
  const isEligible = result?.application_status.includes('Eligible');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">COMFI Policy Engine</h1>
              <p className="text-sm text-muted-foreground">Business Rules-Driven Eligibility Assessment</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowHistory(!showHistory)}>
              <History className="h-4 w-4 mr-1" />
              {showHistory ? 'Hide History' : 'History'}
            </Button>
            <Button variant="outline" size="sm" onClick={handleLoadSample}>
              <FileText className="h-4 w-4 mr-1" />
              Load Sample
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Reject Alert */}
        {isRejected && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Application Rejected</AlertTitle>
            <AlertDescription>{result?.reject_reason}</AlertDescription>
          </Alert>
        )}

        {/* Eligible Alert */}
        {isEligible && (
          <Alert className="border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800">
            <CheckCircle className="h-4 w-4 text-emerald-600" />
            <AlertTitle className="text-emerald-800 dark:text-emerald-400">Eligible – Subject to Credit Review</AlertTitle>
            <AlertDescription className="text-emerald-700 dark:text-emerald-300">{result?.final_recommendation}</AlertDescription>
          </Alert>
        )}

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
                    <Label>Applicant Name *</Label>
                    <Input value={input.applicant_name} onChange={e => updateField('applicant_name', e.target.value)} placeholder="Full name" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Company Name *</Label>
                    <Input value={input.company_name} onChange={e => updateField('company_name', e.target.value)} placeholder="Company legal name" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Nationality</Label>
                    <Input value={input.nationality} onChange={e => updateField('nationality', e.target.value)} placeholder="Nationality" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Industry</Label>
                    <Input value={input.industry} onChange={e => updateField('industry', e.target.value)} placeholder="e.g. Trading, Technical Services" />
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
                    <Label>Gross Turnover (AED)</Label>
                    <Input type="number" value={input.gross_turnover} onChange={e => updateField('gross_turnover', e.target.value)} placeholder="0" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>VAT Component (AED)</Label>
                    <Input type="number" value={input.vat_component} onChange={e => updateField('vat_component', e.target.value)} placeholder="0" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Adjusted Turnover</Label>
                    <Input readOnly value={((Number(input.gross_turnover) || 0) - (Number(input.vat_component) || 0)).toLocaleString()} className="bg-muted" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Average Sales (AED)</Label>
                    <Input type="number" value={input.average_sales} onChange={e => updateField('average_sales', e.target.value)} placeholder="0" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Current Payments (AED)</Label>
                    <Input type="number" value={input.current_payments} onChange={e => updateField('current_payments', e.target.value)} placeholder="0" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Outward Cheque Returns</Label>
                    <Input type="number" value={input.outward_cheque_returns} onChange={e => updateField('outward_cheque_returns', e.target.value)} placeholder="0" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Existing Monthly Obligations (AED)</Label>
                    <Input type="number" value={input.existing_monthly_obligations} onChange={e => updateField('existing_monthly_obligations', e.target.value)} placeholder="0" />
                  </div>
                </div>
                <Separator className="my-4" />
                <div className="space-y-1.5">
                  <Label>Analyst Notes / Comments</Label>
                  <Textarea value={input.analyst_notes} onChange={e => updateField('analyst_notes', e.target.value)} placeholder="Additional notes..." rows={3} />
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <Button onClick={handleRun} className="bg-primary hover:bg-primary/90">
                <Play className="h-4 w-4 mr-1" /> Run Eligibility Check
              </Button>
              <Button variant="outline" onClick={handleReset}>
                <RotateCcw className="h-4 w-4 mr-1" /> Reset
              </Button>
              {result && (
                <Button variant="outline" onClick={handleExport}>
                  <Download className="h-4 w-4 mr-1" /> Export Decision Summary
                </Button>
              )}
            </div>

            {/* Rule Log Table */}
            {result && (
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base">Decision Log — Rule-by-Rule</CardTitle>
                  <CardDescription>Complete audit trail of the COMFI policy evaluation</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10" />
                        <TableHead>Rule Code</TableHead>
                        <TableHead>Rule Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Detail</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.rule_log.map((entry, i) => (
                        <TableRow key={i} className={entry.status === 'Failed' ? 'bg-destructive/5' : ''}>
                          <TableCell>{getRuleStatusIcon(entry.status)}</TableCell>
                          <TableCell className="font-mono text-xs">{entry.rule_code}</TableCell>
                          <TableCell className="text-sm font-medium">{entry.rule_name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getRuleStatusBadgeClass(entry.status)}>{entry.status}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-xs">{entry.detail}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>

          {/* RIGHT: Decision Card */}
          <div className="space-y-6">
            {/* Final Decision */}
            <Card className={result ? (isRejected ? 'border-destructive' : isEligible ? 'border-emerald-300 dark:border-emerald-700' : 'border-amber-300') : ''}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Final Decision</CardTitle>
              </CardHeader>
              <CardContent>
                {!result ? (
                  <p className="text-sm text-muted-foreground">Run the eligibility check to see results.</p>
                ) : (
                  <div className="space-y-4">
                    {/* Status indicator */}
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${isRejected ? 'bg-destructive' : isEligible ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      <Badge variant={getStatusColor(result.application_status)} className="text-sm">
                        {result.application_status}
                      </Badge>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Final Recommendation</p>
                        <p className="text-sm font-semibold text-foreground">{result.final_recommendation}</p>
                      </div>

                      {result.reject_reason && (
                        <div>
                          <p className="text-xs text-muted-foreground">Reject Reason</p>
                          <p className="text-sm font-semibold text-destructive">{result.reject_reason}</p>
                        </div>
                      )}

                      <Separator />

                      <div>
                        <p className="text-xs text-muted-foreground">Adjusted Turnover</p>
                        <p className="text-lg font-bold text-foreground">AED {result.adjusted_turnover.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Eligible Sales</p>
                        <p className="text-lg font-bold text-foreground">AED {result.eligible_sales.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Indicative Eligible Finance (60%)</p>
                        <p className="text-2xl font-bold text-primary">AED {result.eligible_finance.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Auto-Calculated Fields</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Adjusted Turnover</span>
                  <span className="font-medium text-foreground">AED {((Number(input.gross_turnover) || 0) - (Number(input.vat_component) || 0)).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Eligible Sales</span>
                  <span className="font-medium text-foreground">AED {((Number(input.average_sales) || 0) - (Number(input.current_payments) || 0)).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Eligible Finance (60%)</span>
                  <span className="font-bold text-primary">AED {(((Number(input.gross_turnover) || 0) - (Number(input.vat_component) || 0)) * 0.6).toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            {/* Cheque Alert */}
            {Number(input.outward_cheque_returns) > 3 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Warning</AlertTitle>
                <AlertDescription>Outward cheque returns exceed 3. Application will be rejected.</AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        {/* History */}
        {showHistory && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Evaluation History</CardTitle>
              <CardDescription>Recent COMFI policy evaluations</CardDescription>
            </CardHeader>
            <CardContent>
              {!history?.length ? (
                <p className="text-sm text-muted-foreground">No evaluations yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Applicant</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Adj. Turnover</TableHead>
                      <TableHead>Eligible Finance</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((h: any) => (
                      <TableRow key={h.id}>
                        <TableCell className="text-xs">{new Date(h.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-sm">{h.applicant_name}</TableCell>
                        <TableCell className="text-sm">{h.company_name}</TableCell>
                        <TableCell className="text-sm">AED {Number(h.adjusted_turnover).toLocaleString()}</TableCell>
                        <TableCell className="text-sm font-medium">AED {Number(h.eligible_finance).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={h.application_status === 'Rejected' ? 'destructive' : 'default'} className="text-xs">
                            {h.application_status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
