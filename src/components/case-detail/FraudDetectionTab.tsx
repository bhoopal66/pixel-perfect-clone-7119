import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  ShieldAlert, ShieldCheck, AlertTriangle, RefreshCw, Eye,
  TrendingDown, ArrowRightLeft, Banknote, Timer, Split, Users, Search, BarChart3,
} from 'lucide-react';
import { toast } from 'sonner';
import { getDisplayError } from '@/utils/errorHandler';
import { FraudDetectionEngine, type FraudDetectionResult, type RiskFlag, type FlaggedTransaction } from '@/services/fraudDetectionEngine';
import { CurrencyService } from '@/services/currencyService';

const fmt = (v: number) => CurrencyService.format(v, 'AED');

interface Props { caseId: string; }

const MODULE_ICONS: Record<string, React.ReactNode> = {
  'Circular Transactions': <ArrowRightLeft className="h-4 w-4" />,
  'Round Tripping': <RefreshCw className="h-4 w-4" />,
  'Artificial Turnover': <TrendingDown className="h-4 w-4" />,
  'Cash Rotation': <Banknote className="h-4 w-4" />,
  'Window Dressing': <Eye className="h-4 w-4" />,
  'Split Transactions': <Split className="h-4 w-4" />,
  'Rapid In-Out Flows': <Timer className="h-4 w-4" />,
  'Related Party Rotation': <Users className="h-4 w-4" />,
  'Suspicious Counterparties': <Search className="h-4 w-4" />,
  'Revenue Inconsistency': <BarChart3 className="h-4 w-4" />,
};

const SEVERITY_COLORS: Record<string, string> = {
  low: 'bg-success/10 text-success border-success/30',
  moderate: 'bg-warning/10 text-warning border-warning/30',
  high: 'bg-destructive/10 text-destructive border-destructive/30',
  severe: 'bg-destructive text-destructive-foreground',
};

const CATEGORY_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  low: { label: 'Low Risk', color: 'text-success', icon: <ShieldCheck className="h-8 w-8 text-success" /> },
  moderate: { label: 'Moderate Risk', color: 'text-warning', icon: <AlertTriangle className="h-8 w-8 text-warning" /> },
  high: { label: 'High Risk', color: 'text-destructive', icon: <ShieldAlert className="h-8 w-8 text-destructive" /> },
  severe: { label: 'Severe Risk', color: 'text-destructive', icon: <ShieldAlert className="h-8 w-8 text-destructive animate-pulse" /> },
};

export const FraudDetectionTab: React.FC<Props> = ({ caseId }) => {
  const qc = useQueryClient();

  const { data: result, isLoading } = useQuery({
    queryKey: ['fraud-detection', caseId],
    queryFn: () => FraudDetectionEngine.getResults(caseId),
  });

  const runMutation = useMutation({
    mutationFn: () => FraudDetectionEngine.runDetection(caseId),
    onSuccess: () => {
      toast.success('Fraud detection analysis complete');
      qc.invalidateQueries({ queryKey: ['fraud-detection', caseId] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const riskFlags: RiskFlag[] = result
    ? (typeof result.risk_flags_json === 'string'
        ? JSON.parse(result.risk_flags_json)
        : result.risk_flags_json || [])
    : [];

  const flaggedTxns: FlaggedTransaction[] = result
    ? (typeof result.flagged_transactions_json === 'string'
        ? JSON.parse(result.flagged_transactions_json)
        : result.flagged_transactions_json || [])
    : [];

  const catConfig = CATEGORY_CONFIG[result?.fraud_risk_category || 'low'];
  const scoreColor = result
    ? result.fraud_risk_score >= 80 ? 'text-success'
    : result.fraud_risk_score >= 60 ? 'text-warning'
    : 'text-destructive'
    : 'text-muted-foreground';

  if (isLoading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header with Run Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Fraud & Manipulation Detection</h3>
          <p className="text-sm text-muted-foreground">Automated detection of suspicious banking behavior patterns</p>
        </div>
        <Button
          onClick={() => runMutation.mutate()}
          disabled={runMutation.isPending}
          variant={result ? 'outline' : 'default'}
        >
          <ShieldAlert className="h-4 w-4 mr-2" />
          {runMutation.isPending ? 'Analyzing...' : result ? 'Re-run Detection' : 'Run Fraud Detection'}
        </Button>
      </div>

      {!result ? (
        <Card>
          <CardContent className="py-16 text-center">
            <ShieldAlert className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-30" />
            <p className="text-sm text-muted-foreground">No fraud analysis has been run yet.</p>
            <p className="text-xs text-muted-foreground mt-1">Click "Run Fraud Detection" to analyze transaction patterns.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Score & Category Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="md:col-span-1">
              <CardContent className="pt-6 pb-4 flex flex-col items-center text-center">
                {catConfig.icon}
                <p className={`text-4xl font-bold mt-3 ${scoreColor}`}>{result.fraud_risk_score}</p>
                <p className="text-xs font-medium text-muted-foreground mt-1">Fraud Risk Score</p>
                <Badge variant="outline" className={`mt-2 text-xs ${SEVERITY_COLORS[result.fraud_risk_category]}`}>
                  {catConfig.label}
                </Badge>
                <Progress value={result.fraud_risk_score} className="mt-4 h-2" />
                <div className="flex justify-between w-full text-[10px] text-muted-foreground mt-1">
                  <span>Severe</span><span>High</span><span>Moderate</span><span>Low</span>
                </div>
              </CardContent>
            </Card>

            {/* Indicator Summary */}
            <Card className="md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Detection Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {[
                    { label: 'Circular', flag: result.circular_transaction_count > 0, val: result.circular_transaction_count },
                    { label: 'Round Trip', flag: result.round_tripping_flag, val: result.round_tripping_count },
                    { label: 'Artificial TO', flag: result.artificial_turnover_flag },
                    { label: 'Cash Rotation', flag: result.cash_rotation_flag, val: `${result.cash_deposit_ratio}%` },
                    { label: 'Window Dress', flag: result.window_dressing_flag, val: result.window_dressing_count },
                    { label: 'Split Txns', flag: result.structured_transaction_flag, val: result.structured_transaction_count },
                    { label: 'Rapid In-Out', flag: result.rapid_outflow_flag, val: result.rapid_outflow_count },
                    { label: 'RP Rotation', flag: result.related_party_rotation_flag },
                    { label: 'Suspicious CP', flag: result.suspicious_counterparty_flag, val: result.suspicious_counterparty_count },
                    { label: 'Rev. Mismatch', flag: result.revenue_mismatch_flag, val: `${result.revenue_mismatch_percent}%` },
                  ].map((item, i) => (
                    <div key={i} className={`rounded-lg border p-2.5 text-center ${
                      item.flag ? 'border-destructive/30 bg-destructive/5' : 'border-border bg-muted/30'
                    }`}>
                      <div className={`text-xs font-medium ${item.flag ? 'text-destructive' : 'text-muted-foreground'}`}>
                        {item.label}
                      </div>
                      {item.flag ? (
                        <div className="text-sm font-bold text-destructive mt-0.5">
                          {item.val !== undefined ? item.val : '⚠'}
                        </div>
                      ) : (
                        <div className="text-sm font-bold text-success mt-0.5">✓</div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detected Risk Flags */}
          {riskFlags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Detected Indicators ({riskFlags.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {riskFlags.map((flag, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                      <div className="mt-0.5 text-muted-foreground">
                        {MODULE_ICONS[flag.module] || <AlertTriangle className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">{flag.module}</span>
                          <Badge variant="outline" className={`text-[10px] ${SEVERITY_COLORS[flag.severity]}`}>
                            {flag.severity.toUpperCase()}
                          </Badge>
                          <span className="text-xs text-destructive font-mono ml-auto">-{flag.deduction} pts</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{flag.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Flagged Transaction Examples */}
          {flaggedTxns.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" />
                  Flagged Transaction Examples ({flaggedTxns.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-[400px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Module</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Credit</TableHead>
                        <TableHead className="text-right">Debit</TableHead>
                        <TableHead>Reason</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {flaggedTxns.map((t, i) => (
                        <TableRow key={i}>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px]">{t.module}</Badge>
                          </TableCell>
                          <TableCell className="text-xs font-mono">{t.date || '—'}</TableCell>
                          <TableCell className="text-xs max-w-[180px] truncate">{t.description || '—'}</TableCell>
                          <TableCell className="text-right font-mono text-xs text-success">
                            {t.credit > 0 ? fmt(t.credit) : '—'}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs text-destructive">
                            {t.debit > 0 ? fmt(t.debit) : '—'}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[200px]">{t.reason}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Clean Summary when no flags */}
          {riskFlags.length === 0 && (
            <Card className="border-success/30">
              <CardContent className="py-12 text-center">
                <ShieldCheck className="h-12 w-12 mx-auto mb-3 text-success" />
                <p className="text-lg font-semibold text-success">No Suspicious Patterns Detected</p>
                <p className="text-sm text-muted-foreground mt-1">All 10 fraud detection modules passed without flags.</p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};
