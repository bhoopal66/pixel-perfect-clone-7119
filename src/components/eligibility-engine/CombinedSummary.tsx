import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Building2, TrendingUp, TrendingDown, AlertTriangle, ShieldCheck, Scale, Download, ArrowUpDown } from 'lucide-react';
import { CurrencyService } from '@/services/currencyService';
import { saveAndDownloadReport } from '@/services/persistentReportService';
import { toast } from 'sonner';
import ExcelJS from 'exceljs';
import type { CombinedFinancialSummary as SummaryType } from '@/types/assessment.types';

interface CombinedSummaryProps {
  summary: SummaryType | null;
  caseNumber: string | null;
  caseId?: string | null;
}

const fmt = (v: number) => CurrencyService.format(v, 'AED');

const varianceTagConfig = {
  strong_match: { label: 'Strong Match', color: 'bg-success/10 text-success border-success/30' },
  moderate_variance: { label: 'Moderate Variance', color: 'bg-warning/10 text-warning border-warning/30' },
  high_variance: { label: 'High Variance', color: 'bg-destructive/10 text-destructive border-destructive/30' },
  manual_review: { label: 'Manual Review Needed', color: 'bg-destructive/10 text-destructive border-destructive/30' },
};

export const CombinedSummary: React.FC<CombinedSummaryProps> = ({ summary, caseNumber, caseId }) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportSummary = async () => {
    if (!summary || !caseId) return;
    setIsExporting(true);
    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Taamul Case Management';
      const sheet = workbook.addWorksheet('Financial Summary');
      sheet.columns = [
        { header: 'Metric', key: 'metric', width: 35 },
        { header: 'Value', key: 'value', width: 25 },
      ];
      sheet.addRows([
        { metric: 'Company', value: summary.companyName || 'N/A' },
        { metric: 'Case Number', value: caseNumber || 'N/A' },
        { metric: 'Est. Annual Turnover (Bank)', value: summary.estimatedAnnualTurnover },
        { metric: 'Avg Monthly Credit', value: summary.avgMonthlyCredit },
        { metric: 'Avg Monthly Debit', value: summary.avgMonthlyDebit },
        { metric: 'Avg Monthly Balance', value: summary.avgMonthlyBalance },
        { metric: 'Declared VAT Turnover', value: summary.declaredVatTurnover },
        { metric: 'Bank-VAT Variance %', value: `${summary.variancePercent.toFixed(2)}%` },
        { metric: 'Normalized Turnover', value: summary.normalizedTurnover },
        { metric: 'Variance Tag', value: summary.varianceTag },
        { metric: 'Statement Months', value: summary.statementMonthsCovered },
        { metric: 'VAT Periods', value: summary.vatPeriodsCovered },
      ]);
      sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const fileName = `financial_summary_${(summary.companyName || 'case').replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;

      await saveAndDownloadReport(caseId, 'combined_financial_summary_report', `Financial Summary - ${summary.companyName || caseNumber}`, blob, fileName, 'xlsx');
      toast.success('Financial summary report saved & downloaded');
    } catch (err) {
      console.error('Export failed:', err);
      toast.error('Failed to export financial summary');
    } finally {
      setIsExporting(false);
    }
  };
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
            <div className="flex items-center gap-2">
              <Badge className={tagConfig.color}>{tagConfig.label}</Badge>
              {caseId && (
                <Button variant="outline" size="sm" onClick={handleExportSummary} disabled={isExporting} className="gap-1.5">
                  <Download className="h-3.5 w-3.5" />
                  {isExporting ? 'Exporting...' : 'Export'}
                </Button>
              )}
            </div>
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
