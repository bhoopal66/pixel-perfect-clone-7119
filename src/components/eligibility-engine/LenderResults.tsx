import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  CheckCircle, XCircle, AlertTriangle, ChevronDown, ChevronUp,
  Building2, TrendingUp, Shield, AlertCircle, Download
} from 'lucide-react';
import { CurrencyService } from '@/services/currencyService';
import { saveAndDownloadReport } from '@/services/persistentReportService';
import { toast } from 'sonner';
import ExcelJS from 'exceljs';
import type { AssessmentLenderResult, RuleResult } from '@/types/assessment.types';

type LenderResult = Omit<AssessmentLenderResult, 'id' | 'case_id' | 'created_at' | 'updated_at'>;

interface LenderResultsProps {
  results: LenderResult[];
  caseId?: string | null;
}

const fmt = (v: number) => CurrencyService.format(v, 'AED');

const statusConfig = {
  eligible: {
    label: 'Eligible',
    icon: CheckCircle,
    color: 'bg-success/10 text-success border-success/30',
    bg: 'border-success/20',
  },
  conditionally_eligible: {
    label: 'Conditional',
    icon: AlertTriangle,
    color: 'bg-warning/10 text-warning border-warning/30',
    bg: 'border-warning/20',
  },
  review_required: {
    label: 'Review Required',
    icon: AlertCircle,
    color: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
    bg: 'border-amber-500/20',
  },
  not_eligible: {
    label: 'Not Eligible',
    icon: XCircle,
    color: 'bg-destructive/10 text-destructive border-destructive/30',
    bg: 'border-destructive/20',
  },
  pending: {
    label: 'Pending',
    icon: AlertCircle,
    color: 'bg-muted text-muted-foreground border-border',
    bg: 'border-border',
  },
};

const RuleRow: React.FC<{ rule: RuleResult }> = ({ rule }) => (
  <div className={`flex items-start gap-3 px-3 py-2 rounded-lg ${rule.passed ? 'bg-success/5' : 'bg-destructive/5'}`}>
    {rule.passed ? (
      <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
    ) : (
      <XCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
    )}
    <div className="min-w-0 flex-1">
      <p className="text-sm font-medium text-foreground">{rule.rule_name}</p>
      <p className="text-xs text-muted-foreground">{rule.message}</p>
    </div>
  </div>
);

const LenderCard: React.FC<{ result: LenderResult }> = ({ result }) => {
  const [isOpen, setIsOpen] = useState(false);
  const config = statusConfig[result.eligibility_status] || statusConfig.pending;
  const StatusIcon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className={`${config.bg} transition-shadow hover:shadow-md`}>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer select-none">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{result.lender_name}</CardTitle>
                    {result.product_name && (
                      <p className="text-xs text-muted-foreground">{result.product_name}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {result.recommended_limit > 0 && (
                    <div className="text-right">
                      <p className="text-sm font-bold text-foreground">{fmt(result.recommended_limit)}</p>
                      <p className="text-xs text-muted-foreground">Limit</p>
                    </div>
                  )}
                  <Badge className={config.color}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {config.label}
                  </Badge>
                  {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="pt-0 space-y-4">
              {/* Limit Basis */}
              {result.limit_basis && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Basis of Calculation</p>
                  <p className="text-sm text-foreground">{result.limit_basis}</p>
                </div>
              )}

              {/* Key Reasons */}
              {result.key_reasons.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Key Reasons</p>
                  <div className="space-y-1">
                    {result.key_reasons.map((reason, idx) => (
                      <p key={idx} className="text-sm text-foreground">• {reason}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Rule-by-Rule Breakdown */}
              {result.rule_details.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Rule Assessment ({result.passed_rules.length} passed, {result.failed_rules.length} failed)
                  </p>
                  <div className="space-y-1.5">
                    {result.rule_details.map((rule, idx) => (
                      <RuleRow key={idx} rule={rule} />
                    ))}
                  </div>
                </div>
              )}

              {/* Risk Flags */}
              {result.risk_flags.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 text-warning" /> Risk Flags
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.risk_flags.map((flag, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs border-warning text-warning">
                        {flag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Deviations */}
              {result.required_deviations.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Required Deviations</p>
                  <div className="space-y-1">
                    {result.required_deviations.map((dev, idx) => (
                      <p key={idx} className="text-xs text-warning bg-warning/5 px-2 py-1 rounded">
                        {dev}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Additional Info */}
              <div className="flex gap-4 text-xs text-muted-foreground">
                {result.tenure_months && <span>Max Tenure: {result.tenure_months} months</span>}
                {result.pricing_band && <span>Pricing: {result.pricing_band}</span>}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </motion.div>
  );
};

export const LenderResults: React.FC<LenderResultsProps> = ({ results, caseId }) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportLenderResults = async () => {
    if (!caseId || results.length === 0) return;
    setIsExporting(true);
    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Taamul Case Management';
      const sheet = workbook.addWorksheet('Lender Results');
      sheet.columns = [
        { header: 'Lender', key: 'lender', width: 25 },
        { header: 'Product', key: 'product', width: 20 },
        { header: 'Status', key: 'status', width: 18 },
        { header: 'Recommended Limit', key: 'limit', width: 20 },
        { header: 'Pricing Band', key: 'pricing', width: 15 },
        { header: 'Passed Rules', key: 'passed', width: 12 },
        { header: 'Failed Rules', key: 'failed', width: 12 },
      ];
      results.forEach(r => {
        sheet.addRow({
          lender: r.lender_name,
          product: r.product_name || 'N/A',
          status: r.eligibility_status,
          limit: r.recommended_limit || 0,
          pricing: r.pricing_band || 'N/A',
          passed: r.passed_rules?.length || 0,
          failed: r.failed_rules?.length || 0,
        });
      });
      sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const fileName = `lender_results_${new Date().toISOString().split('T')[0]}.xlsx`;

      await saveAndDownloadReport(caseId, 'lender_eligibility_report', 'Lender Eligibility Results', blob, fileName, 'xlsx');
      toast.success('Lender results report saved & downloaded');
    } catch (err) {
      console.error('Export failed:', err);
      toast.error('Failed to export lender results');
    } finally {
      setIsExporting(false);
    }
  };
  if (results.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center py-12">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Lender Results</h3>
          <p className="text-muted-foreground">
            No active lenders configured. Add lenders in the admin dashboard.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Sort: eligible first, then conditional, then review, then not eligible
  const sortOrder = { eligible: 0, conditionally_eligible: 1, review_required: 2, not_eligible: 3, pending: 4 };
  const sorted = [...results].sort((a, b) =>
    (sortOrder[a.eligibility_status] || 4) - (sortOrder[b.eligibility_status] || 4)
  );

  const counts = {
    eligible: results.filter(r => r.eligibility_status === 'eligible').length,
    conditional: results.filter(r => r.eligibility_status === 'conditionally_eligible').length,
    review: results.filter(r => r.eligibility_status === 'review_required').length,
    notEligible: results.filter(r => r.eligibility_status === 'not_eligible').length,
  };

  return (
    <div className="space-y-6">
      {/* Header with Export */}
      {caseId && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={handleExportLenderResults} disabled={isExporting} className="gap-1.5">
            <Download className="h-3.5 w-3.5" />
            {isExporting ? 'Exporting...' : 'Export Results'}
          </Button>
        </div>
      )}
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-success/20">
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-success">{counts.eligible}</p>
            <p className="text-xs text-muted-foreground">Eligible</p>
          </CardContent>
        </Card>
        <Card className="border-warning/20">
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-warning">{counts.conditional}</p>
            <p className="text-xs text-muted-foreground">Conditional</p>
          </CardContent>
        </Card>
        <Card className="border-amber-500/20">
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-amber-600">{counts.review}</p>
            <p className="text-xs text-muted-foreground">Review Required</p>
          </CardContent>
        </Card>
        <Card className="border-destructive/20">
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-destructive">{counts.notEligible}</p>
            <p className="text-xs text-muted-foreground">Not Eligible</p>
          </CardContent>
        </Card>
      </div>

      {/* Lender Cards */}
      <div className="space-y-4">
        {sorted.map((result, idx) => (
          <LenderCard key={idx} result={result} />
        ))}
      </div>
    </div>
  );
};
