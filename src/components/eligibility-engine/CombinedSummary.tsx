import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Building2, TrendingUp, TrendingDown, AlertTriangle, ShieldCheck, Scale } from 'lucide-react';
import { CurrencyService } from '@/services/currencyService';
import type { CombinedFinancialSummary as SummaryType } from '@/types/assessment.types';

interface CombinedSummaryProps {
  summary: SummaryType | null;
  caseNumber: string | null;
}

const fmt = (v: number) => CurrencyService.format(v, 'AED');

const varianceTagConfig = {
  strong_match: { label: 'Strong Match', color: 'bg-success/10 text-success border-success/30' },
  moderate_variance: { label: 'Moderate Variance', color: 'bg-warning/10 text-warning border-warning/30' },
  high_variance: { label: 'High Variance', color: 'bg-destructive/10 text-destructive border-destructive/30' },
  manual_review: { label: 'Manual Review Needed', color: 'bg-destructive/10 text-destructive border-destructive/30' },
};

export const CombinedSummary: React.FC<CombinedSummaryProps> = ({ summary, caseNumber }) => {
  if (!summary) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground py-12">
          No analysis data available. Please run the analysis first.
        </CardContent>
      </Card>
    );
  }

  const tagConfig = varianceTagConfig[summary.varianceTag];

  return (
    <div className="space-y-6">
      {/* Case Header */}
      <Card className="border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Building2 className="h-6 w-6 text-primary" />
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    {summary.companyName || 'Unnamed Applicant'}
                  </h2>
                  {caseNumber && (
                    <p className="text-sm text-muted-foreground">Case: {caseNumber}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2 flex-wrap mt-3">
                {summary.banksUsed.map(bank => (
                  <Badge key={bank} variant="secondary">{bank}</Badge>
                ))}
                <Badge variant="outline">{summary.statementMonthsCovered} months coverage</Badge>
                {summary.vatPeriodsCovered > 0 && (
                  <Badge variant="outline">{summary.vatPeriodsCovered} VAT period(s)</Badge>
                )}
              </div>
            </div>
            <Badge className={tagConfig.color}>{tagConfig.label}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-success/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">Est. Annual Turnover (Bank)</p>
              <TrendingUp className="h-4 w-4 text-success" />
            </div>
            <p className="text-2xl font-bold">{fmt(summary.estimatedAnnualTurnover)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Avg monthly credit: {fmt(summary.avgMonthlyCredit)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-accent/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">Declared VAT Turnover</p>
              <Scale className="h-4 w-4 text-accent" />
            </div>
            <p className="text-2xl font-bold">
              {summary.declaredVatTurnover > 0 ? fmt(summary.declaredVatTurnover) : 'N/A'}
            </p>
            {summary.vatPeriodsCovered === 0 && (
              <p className="text-xs text-warning mt-1">No VAT returns provided</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">Normalized Turnover</p>
              <ShieldCheck className="h-4 w-4 text-primary" />
            </div>
            <p className="text-2xl font-bold">{fmt(summary.normalizedTurnover)}</p>
            <p className="text-xs text-muted-foreground mt-1">Used for lender testing</p>
          </CardContent>
        </Card>
      </div>

      {/* Variance & Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Banking Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Avg Monthly Credit</span>
              <span className="font-mono text-sm font-medium">{fmt(summary.avgMonthlyCredit)}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Avg Monthly Debit</span>
              <span className="font-mono text-sm font-medium">{fmt(summary.avgMonthlyDebit)}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Avg Monthly Balance</span>
              <span className="font-mono text-sm font-medium">{fmt(summary.avgMonthlyBalance)}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Cash Deposit Ratio</span>
              <span className="font-mono text-sm font-medium">{summary.cashDepositRatio}%</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Cheque Returns</span>
              <span className="font-mono text-sm font-medium">{summary.totalBounces}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Negative Balance Days</span>
              <span className="font-mono text-sm font-medium">{summary.negativeBalanceDays}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Variance Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Bank Turnover (Annual)</span>
              <span className="font-mono text-sm font-medium">{fmt(summary.estimatedAnnualTurnover)}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">VAT Turnover (Annual)</span>
              <span className="font-mono text-sm font-medium">
                {summary.declaredVatTurnover > 0 ? fmt(summary.declaredVatTurnover) : 'N/A'}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Variance</span>
              <Badge className={tagConfig.color}>
                {summary.variancePercent}% — {tagConfig.label}
              </Badge>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Statement Coverage</span>
              <span className="font-mono text-sm font-medium">{summary.statementMonthsCovered} months</span>
            </div>

            {/* Risk Flags */}
            {summary.riskFlags.length > 0 && (
              <>
                <Separator />
                <div>
                  <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4 text-warning" /> Risk Flags
                  </p>
                  <div className="space-y-1">
                    {summary.riskFlags.map((flag, idx) => (
                      <p key={idx} className="text-xs text-warning bg-warning/5 px-2 py-1 rounded">
                        {flag}
                      </p>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
