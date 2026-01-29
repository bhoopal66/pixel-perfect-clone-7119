import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Calculator, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Save,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CurrencyService } from '@/services/currencyService';
import type { LoanEligibility, LoanEligibilityInput, EligibilityStatus, VarianceBucket } from '@/types/loanEligibility.types';
import { getStatusColor, getBucketColor } from '@/types/loanEligibility.types';

interface LoanEligibilityFormProps {
  onSubmit: (input: LoanEligibilityInput) => Promise<LoanEligibility>;
  initialData?: LoanEligibility;
  isLoading?: boolean;
  currency?: 'AED' | 'USD';
}

interface CalculatedValues {
  adjusted_turnover: number;
  variance_percent: number;
  variance_bucket: VarianceBucket;
  eligibility_status: EligibilityStatus;
  eligible_multiplier: number;
  eligible_loan_amount: number;
}

export const LoanEligibilityForm: React.FC<LoanEligibilityFormProps> = ({
  onSubmit,
  initialData,
  isLoading = false,
  currency = 'AED'
}) => {
  const [vatTurnover, setVatTurnover] = useState<string>(initialData?.vat_turnover?.toString() || '');
  const [declaredTurnover, setDeclaredTurnover] = useState<string>(initialData?.declared_turnover?.toString() || '');
  const [cashAdjustment, setCashAdjustment] = useState<string>(initialData?.cash_adjustment?.toString() || '');
  const [sisterConcernAdjustment, setSisterConcernAdjustment] = useState<string>(initialData?.sister_concern_adjustment?.toString() || '');
  const [notes, setNotes] = useState<string>(initialData?.notes || '');
  const [calculated, setCalculated] = useState<CalculatedValues | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  const formatCurrency = (value: number) => CurrencyService.format(value, currency);

  // Calculate values on input change
  useEffect(() => {
    const vat = parseFloat(vatTurnover) || 0;
    const declared = parseFloat(declaredTurnover) || 0;
    const cash = parseFloat(cashAdjustment) || 0;
    const sister = parseFloat(sisterConcernAdjustment) || 0;
    
    const newWarnings: string[] = [];

    // Calculate adjusted turnover
    let adjustedTurnover = declared - cash - sister;
    if (adjustedTurnover < 0) {
      adjustedTurnover = 0;
      newWarnings.push('Adjusted turnover was negative and has been set to 0');
    }

    // Check for insufficient data
    if (declared === 0) {
      setCalculated({
        adjusted_turnover: adjustedTurnover,
        variance_percent: 0,
        variance_bucket: 'N/A',
        eligibility_status: 'Insufficient Data',
        eligible_multiplier: 0,
        eligible_loan_amount: 0
      });
      setWarnings(newWarnings);
      return;
    }

    // Check for missing VAT
    if (vat === 0) {
      newWarnings.push('VAT Missing – variance may be unreliable');
    }

    // Calculate variance %
    const maxTurnover = Math.max(vat, adjustedTurnover);
    let variancePercent = 0;
    if (maxTurnover > 0) {
      variancePercent = Math.round(Math.abs(vat - adjustedTurnover) / maxTurnover * 10000) / 100;
    }

    // Determine bucket and eligibility
    let eligibleMultiplier: number;
    let eligibilityStatus: EligibilityStatus;
    let varianceBucket: VarianceBucket;

    if (variancePercent <= 10) {
      eligibleMultiplier = 8;
      eligibilityStatus = 'Eligible';
      varianceBucket = '<=10%';
    } else if (variancePercent <= 25) {
      eligibleMultiplier = 8 / 6;
      eligibilityStatus = 'Eligible (Reduced)';
      varianceBucket = '11%-25%';
    } else {
      eligibleMultiplier = 0;
      eligibilityStatus = 'Not Eligible';
      varianceBucket = '>25%';
    }

    // Calculate eligible loan amount
    const eligibleLoanAmount = eligibleMultiplier > 0 ? adjustedTurnover * eligibleMultiplier : 0;

    setCalculated({
      adjusted_turnover: adjustedTurnover,
      variance_percent: variancePercent,
      variance_bucket: varianceBucket,
      eligibility_status: eligibilityStatus,
      eligible_multiplier: eligibleMultiplier,
      eligible_loan_amount: eligibleLoanAmount
    });
    setWarnings(newWarnings);
  }, [vatTurnover, declaredTurnover, cashAdjustment, sisterConcernAdjustment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const input: LoanEligibilityInput = {
      vat_turnover: parseFloat(vatTurnover) || 0,
      declared_turnover: parseFloat(declaredTurnover) || 0,
      cash_adjustment: parseFloat(cashAdjustment) || 0,
      sister_concern_adjustment: parseFloat(sisterConcernAdjustment) || 0,
      notes: notes || undefined
    };
    
    await onSubmit(input);
  };

  const handleReset = () => {
    setVatTurnover('');
    setDeclaredTurnover('');
    setCashAdjustment('');
    setSisterConcernAdjustment('');
    setNotes('');
  };

  const getStatusIcon = (status: EligibilityStatus) => {
    switch (status) {
      case 'Eligible':
        return <CheckCircle className="h-5 w-5 text-success" />;
      case 'Eligible (Reduced)':
        return <AlertCircle className="h-5 w-5 text-warning" />;
      case 'Not Eligible':
        return <XCircle className="h-5 w-5 text-destructive" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadgeClass = (status: EligibilityStatus) => {
    const color = getStatusColor(status);
    switch (color) {
      case 'success':
        return 'bg-success/20 text-success border-success/30';
      case 'warning':
        return 'bg-warning/20 text-warning border-warning/30';
      case 'destructive':
        return 'bg-destructive/20 text-destructive border-destructive/30';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Loan Eligibility Calculator
            </CardTitle>
            <CardDescription>
              Enter turnover figures to calculate eligibility
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
                required
              />
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

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>

            {/* Warnings */}
            {warnings.length > 0 && (
              <div className="space-y-2">
                {warnings.map((warning, i) => (
                  <Alert key={i} variant="default" className="border-warning/50 bg-warning/10">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    <AlertDescription className="text-warning">{warning}</AlertDescription>
                  </Alert>
                ))}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={isLoading} className="flex-1">
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? 'Saving...' : 'Save Eligibility'}
              </Button>
              <Button type="button" variant="outline" onClick={handleReset}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Card */}
        <Card className={cn(
          "border-2 transition-colors",
          calculated?.eligibility_status === 'Eligible' && "border-success/50",
          calculated?.eligibility_status === 'Eligible (Reduced)' && "border-warning/50",
          calculated?.eligibility_status === 'Not Eligible' && "border-destructive/50"
        )}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Eligibility Summary</span>
              {calculated && getStatusIcon(calculated.eligibility_status)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {calculated && (
              <>
                {/* Adjusted Turnover */}
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm text-muted-foreground">Adjusted Turnover</span>
                  <span className="font-mono font-semibold">
                    {formatCurrency(calculated.adjusted_turnover)}
                  </span>
                </div>

                {/* Variance */}
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm text-muted-foreground">Variance</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold">
                      {calculated.variance_percent.toFixed(2)}%
                    </span>
                    <Badge className={getBucketColor(calculated.variance_bucket)}>
                      {calculated.variance_bucket}
                    </Badge>
                  </div>
                </div>

                {/* Eligibility Status */}
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm text-muted-foreground">Eligibility Status</span>
                  <Badge className={getStatusBadgeClass(calculated.eligibility_status)}>
                    {calculated.eligibility_status}
                  </Badge>
                </div>

                {/* Multiplier */}
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm text-muted-foreground">Multiplier</span>
                  <span className="font-mono font-semibold">
                    {calculated.eligible_multiplier > 0 
                      ? `${calculated.eligible_multiplier.toFixed(2)}x` 
                      : '—'}
                  </span>
                </div>

                {/* Eligible Loan Amount */}
                <div className={cn(
                  "p-4 rounded-lg text-center mt-4",
                  calculated.eligibility_status === 'Eligible' && "bg-success/10 border border-success/30",
                  calculated.eligibility_status === 'Eligible (Reduced)' && "bg-warning/10 border border-warning/30",
                  calculated.eligibility_status === 'Not Eligible' && "bg-destructive/10 border border-destructive/30",
                  calculated.eligibility_status === 'Insufficient Data' && "bg-muted"
                )}>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    Eligible Loan Amount
                  </p>
                  <p className="text-2xl font-bold font-mono">
                    {formatCurrency(calculated.eligible_loan_amount)}
                  </p>
                </div>

                {/* Formula explanation */}
                <div className="text-xs text-muted-foreground p-3 bg-muted/30 rounded-lg space-y-1">
                  <p><strong>Formula:</strong></p>
                  <p>Adjusted = Declared − Cash − Sister Concern</p>
                  <p>Variance% = |VAT − Adjusted| / MAX(VAT, Adjusted) × 100</p>
                  <p>Eligible Amount = Adjusted × Multiplier</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </form>
  );
};
