import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { BarChart3, CheckCircle2, Clock, TrendingUp, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

interface Props {
  caseId: string;
}

export const FinancialSummaryTab: React.FC<Props> = ({ caseId }) => {
  const { data: summaries, isLoading } = useQuery({
    queryKey: ['financial-summaries', caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('combined_financial_summary')
        .select('*')
        .eq('case_id', caseId)
        .order('summary_version', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: adjustments } = useQuery({
    queryKey: ['analyst-adjustments', caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assessment_analyst_adjustments')
        .select('*')
        .eq('case_id', caseId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  if (isLoading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  const activeSummary = summaries?.find((s: any) => s.is_active);
  const priorVersions = summaries?.filter((s: any) => !s.is_active) || [];

  const MetricCard = ({ label, value, suffix }: { label: string; value: number | string | null | undefined; suffix?: string }) => (
    <div className="p-3 rounded-lg bg-muted/50">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold mt-0.5">
        {value != null ? (typeof value === 'number' ? value.toLocaleString() : value) : '—'}
        {suffix && <span className="text-xs font-normal text-muted-foreground ml-1">{suffix}</span>}
      </p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Active Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" />Active Financial Summary</CardTitle>
              <CardDescription>
                {activeSummary
                  ? `Version ${activeSummary.summary_version} • Created ${format(new Date(activeSummary.created_at), 'dd MMM yyyy')}`
                  : 'No summary available'}
              </CardDescription>
            </div>
            {activeSummary?.approved_at && (
              <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                <CheckCircle2 className="h-3 w-3 mr-1" /> Approved
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!activeSummary ? (
            <p className="text-sm text-muted-foreground text-center py-8">No financial summary generated yet. Run analysis to create one.</p>
          ) : (
            <div className="space-y-4">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Banking Metrics</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <MetricCard label="Avg Monthly Credit" value={activeSummary.avg_monthly_bank_credit} suffix="AED" />
                <MetricCard label="Avg Monthly Debit" value={activeSummary.avg_monthly_debit} suffix="AED" />
                <MetricCard label="Avg Monthly Balance" value={activeSummary.avg_monthly_balance} suffix="AED" />
                <MetricCard label="Bank-VAT Variance" value={activeSummary.bank_vat_variance} suffix="%" />
              </div>

              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Turnover</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <MetricCard label="Adj. Monthly Turnover" value={activeSummary.adjusted_monthly_turnover} suffix="AED" />
                <MetricCard label="Adj. Annual Turnover" value={activeSummary.adjusted_annual_turnover} suffix="AED" />
                <MetricCard label="VAT Monthly Sales" value={activeSummary.vat_monthly_sales} suffix="AED" />
                <MetricCard label="Gross Margin" value={activeSummary.gross_margin_percentage} suffix="%" />
              </div>

              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Risk Indicators</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <MetricCard label="Negative Balance Days" value={activeSummary.negative_balance_days} />
                <MetricCard label="Returned Cheques" value={activeSummary.returned_cheque_count} />
                <MetricCard label="Cash Deposit Ratio" value={activeSummary.cash_deposit_ratio} suffix="%" />
                <MetricCard label="AECB Score" value={activeSummary.aecb_score} />
              </div>

              {activeSummary.risk_flags_json && (activeSummary.risk_flags_json as any[]).length > 0 && (
                <div className="mt-4 p-3 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-800">
                  <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1 mb-2">
                    <AlertTriangle className="h-3 w-3" /> Risk Flags
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {(activeSummary.risk_flags_json as any[]).map((flag: string, i: number) => (
                      <Badge key={i} variant="outline" className="text-xs border-amber-300 text-amber-700 dark:text-amber-300">
                        {flag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Prior Versions */}
      {priorVersions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2"><Clock className="h-4 w-4" />Prior Summary Versions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {priorVersions.map((v: any) => (
                <div key={v.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <span className="text-sm font-medium">Version {v.summary_version}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {format(new Date(v.created_at), 'dd MMM yyyy HH:mm')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      Annual: AED {v.adjusted_annual_turnover?.toLocaleString() || 0}
                    </span>
                    <Badge variant="outline" className="text-xs">Superseded</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analyst Adjustments */}
      {adjustments && adjustments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4" />Analyst Adjustments</CardTitle>
            <CardDescription>{adjustments.length} adjustments recorded</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {adjustments.map((adj: any) => (
                <div key={adj.id} className="p-3 rounded-lg border text-sm">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs">{adj.adjustment_type.replace(/_/g, ' ')}</Badge>
                    <span className="text-xs text-muted-foreground">{format(new Date(adj.created_at), 'dd MMM yyyy HH:mm')}</span>
                  </div>
                  {adj.field_name && (
                    <p className="mt-1 text-xs">
                      <span className="text-muted-foreground">{adj.field_name}:</span>{' '}
                      <span className="line-through text-destructive">{adj.original_value}</span>{' → '}
                      <span className="text-emerald-600 font-medium">{adj.adjusted_value}</span>
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">{adj.reason}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
