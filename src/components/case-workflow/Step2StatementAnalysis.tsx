import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { FileText, Calendar, DollarSign, ArrowRight, ArrowLeft, CheckCircle, AlertTriangle } from 'lucide-react';
import { CurrencyService } from '@/services/currencyService';
import type { Case, CaseAnalysisInput } from '@/types/case.types';

interface Step2StatementAnalysisProps {
  caseData: Case;
  onSubmit: (data: CaseAnalysisInput) => Promise<void>;
  onMarkComplete: () => Promise<void>;
  onBack: () => void;
  isLoading: boolean;
}

export const Step2StatementAnalysis: React.FC<Step2StatementAnalysisProps> = ({
  caseData,
  onSubmit,
  onMarkComplete,
  onBack,
  isLoading
}) => {
  const [statementPdfUrl, setStatementPdfUrl] = useState(caseData.statement_pdf_url || '');
  const [periodFrom, setPeriodFrom] = useState(caseData.statement_period_from || '');
  const [periodTo, setPeriodTo] = useState(caseData.statement_period_to || '');
  const [vatTurnover, setVatTurnover] = useState(caseData.vat_turnover?.toString() || '');
  const [declaredTurnover, setDeclaredTurnover] = useState(caseData.declared_turnover?.toString() || '');
  const [cashAdjustment, setCashAdjustment] = useState(caseData.cash_adjustment?.toString() || '');
  const [sisterConcernAdjustment, setSisterConcernAdjustment] = useState(caseData.sister_concern_adjustment?.toString() || '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);

  const formatCurrency = (value: number) => CurrencyService.format(value, 'AED');

  // Track changes
  useEffect(() => {
    const changed = 
      statementPdfUrl !== (caseData.statement_pdf_url || '') ||
      periodFrom !== (caseData.statement_period_from || '') ||
      periodTo !== (caseData.statement_period_to || '') ||
      vatTurnover !== (caseData.vat_turnover?.toString() || '') ||
      declaredTurnover !== (caseData.declared_turnover?.toString() || '') ||
      cashAdjustment !== (caseData.cash_adjustment?.toString() || '') ||
      sisterConcernAdjustment !== (caseData.sister_concern_adjustment?.toString() || '');
    setHasChanges(changed);
  }, [statementPdfUrl, periodFrom, periodTo, vatTurnover, declaredTurnover, cashAdjustment, sisterConcernAdjustment, caseData]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    const declared = parseFloat(declaredTurnover) || 0;
    if (declared <= 0) {
      newErrors.declared_turnover = 'Declared turnover must be greater than 0';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    await onSubmit({
      statement_pdf_url: statementPdfUrl || undefined,
      statement_period_from: periodFrom || undefined,
      statement_period_to: periodTo || undefined,
      vat_turnover: parseFloat(vatTurnover) || 0,
      declared_turnover: parseFloat(declaredTurnover) || 0,
      cash_adjustment: parseFloat(cashAdjustment) || 0,
      sister_concern_adjustment: parseFloat(sisterConcernAdjustment) || 0
    });
    setHasChanges(false);
  };

  const handleMarkComplete = async () => {
    if (!validate()) return;
    
    // Save first if there are changes
    if (hasChanges) {
      await handleSave();
    }
    
    await onMarkComplete();
  };

  // Calculate preview
  const declared = parseFloat(declaredTurnover) || 0;
  const cash = parseFloat(cashAdjustment) || 0;
  const sister = parseFloat(sisterConcernAdjustment) || 0;
  const adjustedPreview = Math.max(0, declared - cash - sister);

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Bank Statement Analysis
        </CardTitle>
        <CardDescription>
          Upload statement and enter turnover figures for {caseData.client_name}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Statement Upload Section */}
        <div className="p-4 bg-muted/30 rounded-lg border space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Statement Details
          </h3>
          
          <div className="space-y-2">
            <Label htmlFor="statement_pdf_url">Statement PDF URL</Label>
            <Input
              id="statement_pdf_url"
              type="url"
              placeholder="https://..."
              value={statementPdfUrl}
              onChange={(e) => setStatementPdfUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Paste link to uploaded bank statement PDF
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="period_from" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Period From
              </Label>
              <Input
                id="period_from"
                type="date"
                value={periodFrom}
                onChange={(e) => setPeriodFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="period_to" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Period To
              </Label>
              <Input
                id="period_to"
                type="date"
                value={periodTo}
                onChange={(e) => setPeriodTo(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Turnover Figures */}
        <div className="p-4 bg-primary/5 rounded-lg border border-primary/20 space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Turnover Analysis
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vat_turnover">VAT Turnover</Label>
              <Input
                id="vat_turnover"
                type="number"
                placeholder="0.00"
                value={vatTurnover}
                onChange={(e) => setVatTurnover(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="declared_turnover">Declared Turnover *</Label>
              <Input
                id="declared_turnover"
                type="number"
                placeholder="0.00"
                value={declaredTurnover}
                onChange={(e) => setDeclaredTurnover(e.target.value)}
                min="0"
                step="0.01"
                className={errors.declared_turnover ? 'border-destructive' : ''}
              />
              {errors.declared_turnover && (
                <p className="text-xs text-destructive">{errors.declared_turnover}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cash_adjustment">Cash Adjustment</Label>
              <Input
                id="cash_adjustment"
                type="number"
                placeholder="0.00"
                value={cashAdjustment}
                onChange={(e) => setCashAdjustment(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sister_concern_adjustment">Sister Concern Adjustment</Label>
              <Input
                id="sister_concern_adjustment"
                type="number"
                placeholder="0.00"
                value={sisterConcernAdjustment}
                onChange={(e) => setSisterConcernAdjustment(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>
          </div>

          {/* Preview */}
          {declared > 0 && (
            <div className="mt-4 p-3 bg-background rounded border">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Adjusted Turnover Preview:</span>
                <span className="font-mono font-semibold">{formatCurrency(adjustedPreview)}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                = {formatCurrency(declared)} - {formatCurrency(cash)} - {formatCurrency(sister)}
              </p>
            </div>
          )}
        </div>

        {/* Warnings */}
        {parseFloat(vatTurnover) === 0 && declared > 0 && (
          <Alert variant="default" className="border-warning/50 bg-warning/10">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <AlertDescription className="text-warning">
              VAT Turnover is 0 - variance calculation may be unreliable
            </AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          
          <Button
            type="button"
            variant="secondary"
            onClick={handleSave}
            disabled={isLoading || !hasChanges}
          >
            Save Progress
          </Button>
          
          <Button
            type="button"
            onClick={handleMarkComplete}
            disabled={isLoading}
            className="flex-1"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            {isLoading ? 'Saving...' : 'Mark Analysis Completed & Continue'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
