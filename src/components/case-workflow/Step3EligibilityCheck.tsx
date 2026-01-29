import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Calculator, 
  CreditCard, 
  CheckCircle, 
  ArrowLeft, 
  RefreshCw,
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CurrencyService } from '@/services/currencyService';
import { 
  isPOSProduct, 
  PRODUCT_TYPE_LABELS, 
  getEligibilityStatusColor 
} from '@/types/case.types';
import type { Case, CaseEligibilityInput, EligibilityStatus } from '@/types/case.types';

interface Step3EligibilityCheckProps {
  caseData: Case;
  onUpdatePOS: (data: CaseEligibilityInput) => Promise<void>;
  onFinalize: () => Promise<void>;
  onBack: () => void;
  isLoading: boolean;
}

export const Step3EligibilityCheck: React.FC<Step3EligibilityCheckProps> = ({
  caseData,
  onUpdatePOS,
  onFinalize,
  onBack,
  isLoading
}) => {
  const [posMonthlyTurnover, setPosMonthlyTurnover] = useState(
    caseData.pos_monthly_turnover?.toString() || ''
  );
  const [hasChanges, setHasChanges] = useState(false);

  const formatCurrency = (value: number) => CurrencyService.format(value, 'AED');
  const isPOS = isPOSProduct(caseData.product_type);
  const isReverse = caseData.eligibility_method === 'Reverse (ABCT 1%)';

  useEffect(() => {
    setHasChanges(posMonthlyTurnover !== (caseData.pos_monthly_turnover?.toString() || ''));
  }, [posMonthlyTurnover, caseData.pos_monthly_turnover]);

  const handleUpdatePOS = async () => {
    await onUpdatePOS({
      pos_monthly_turnover: parseFloat(posMonthlyTurnover) || 0
    });
    setHasChanges(false);
  };

  const getStatusIcon = (status: EligibilityStatus) => {
    switch (status) {
      case 'Eligible':
        return <CheckCircle className="h-5 w-5 text-success" />;
      case 'Eligible (Reduced)':
        return <AlertCircle className="h-5 w-5 text-warning" />;
      case 'Eligible (Reverse)':
        return <RefreshCw className="h-5 w-5 text-orange-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* POS Input Section - Only for POS products */}
      {isPOS && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              POS Monthly Turnover
            </CardTitle>
            <CardDescription>
              Enter monthly POS transaction volume for {PRODUCT_TYPE_LABELS[caseData.product_type]}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="flex-1 space-y-2">
                <Label htmlFor="pos_monthly_turnover">Monthly POS Turnover *</Label>
                <Input
                  id="pos_monthly_turnover"
                  type="number"
                  placeholder="0.00"
                  value={posMonthlyTurnover}
                  onChange={(e) => setPosMonthlyTurnover(e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>
              <Button 
                onClick={handleUpdatePOS} 
                disabled={isLoading || !hasChanges}
                variant="secondary"
              >
                <RefreshCw className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")} />
                Recalculate
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Eligibility Summary Card */}
      <Card className={cn(
        "border-2",
        caseData.eligibility_status === 'Eligible' && "border-success/50",
        caseData.eligibility_status === 'Eligible (Reduced)' && "border-warning/50",
        caseData.eligibility_status === 'Eligible (Reverse)' && "border-orange-500/50"
      )}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Eligibility Summary
            </CardTitle>
            <div className="flex items-center gap-2">
              {getStatusIcon(caseData.eligibility_status as EligibilityStatus)}
              <Badge className={getEligibilityStatusColor(caseData.eligibility_status as EligibilityStatus)}>
                {caseData.eligibility_status}
              </Badge>
            </div>
          </div>
          <CardDescription>
            {caseData.client_name} • {caseData.bank_name} • {PRODUCT_TYPE_LABELS[caseData.product_type]}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Reverse Method Alert */}
          {isReverse && (
            <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950/30">
              <RefreshCw className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800 dark:text-orange-200">
                <div className="space-y-2">
                  <p className="font-semibold">🔄 Reverse (ABCT 1%) Method Applied</p>
                  <p className="text-sm">
                    Normal eligibility failed (variance {caseData.variance_percent.toFixed(2)}% &gt; 25%). 
                    Using ABCT reversal: <strong>Loan = Adjusted Turnover</strong>
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Summary Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Column - Turnover Analysis */}
            <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
              <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                Turnover Analysis
              </h4>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Declared Turnover:</span>
                  <span className="font-mono">{formatCurrency(caseData.declared_turnover)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cash Adjustment:</span>
                  <span className="font-mono text-destructive">-{formatCurrency(caseData.cash_adjustment)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sister Concern:</span>
                  <span className="font-mono text-destructive">-{formatCurrency(caseData.sister_concern_adjustment)}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t">
                  <span className="font-medium">Adjusted Turnover:</span>
                  <span className="font-mono font-semibold">{formatCurrency(caseData.adjusted_turnover)}</span>
                </div>
              </div>
            </div>

            {/* Right Column - Variance */}
            <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
              <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                Variance Analysis
              </h4>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">VAT Turnover:</span>
                  <span className="font-mono">{formatCurrency(caseData.vat_turnover)}</span>
                </div>
                <div className="flex justify-between text-sm items-center">
                  <span className="text-muted-foreground">Variance:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono">{caseData.variance_percent.toFixed(2)}%</span>
                    <Badge variant="outline" className="text-xs">
                      {caseData.variance_bucket}
                    </Badge>
                  </div>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t">
                  <span className="font-medium">Multiplier:</span>
                  <span className="font-mono font-semibold">
                    {caseData.eligible_multiplier > 0 ? `${caseData.eligible_multiplier.toFixed(2)}x` : '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* POS Calculations - Only for POS products */}
          {isPOS && (
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <h4 className="font-semibold text-sm uppercase tracking-wider text-primary mb-3">
                POS Calculations ({(caseData.pos_cap_rate * 100).toFixed(0)}% Cap)
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Annual POS:</p>
                  <p className="font-mono font-semibold">{formatCurrency(caseData.pos_annual_turnover)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Cap (Adjusted):</p>
                  <p className="font-mono">{formatCurrency(caseData.adjusted_turnover * caseData.pos_cap_rate)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Cap (VAT):</p>
                  <p className="font-mono">{formatCurrency(caseData.vat_turnover * caseData.pos_cap_rate)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">POS Eligible:</p>
                  <p className="font-mono font-semibold text-primary">{formatCurrency(caseData.pos_eligible_turnover)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Eligibility Method & Turnover Basis */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">Eligibility Method:</span>
              <Badge 
                className={isReverse 
                  ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200" 
                  : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200"
                }
              >
                {caseData.eligibility_method}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Turnover Basis:</span>
              <span className="font-mono font-semibold">{formatCurrency(caseData.turnover_basis)}</span>
            </div>
          </div>

          {/* Final Amounts */}
          <div className={cn(
            "p-6 rounded-lg text-center",
            caseData.eligibility_status === 'Eligible' && "bg-success/10 border border-success/30",
            caseData.eligibility_status === 'Eligible (Reduced)' && "bg-warning/10 border border-warning/30",
            caseData.eligibility_status === 'Eligible (Reverse)' && "bg-orange-50 dark:bg-orange-950/30 border border-orange-300 dark:border-orange-700"
          )}>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                  Eligible Loan Amount
                </p>
                <p className="text-3xl font-bold font-mono">
                  {formatCurrency(caseData.eligible_loan_amount)}
                </p>
              </div>
              
              <div className="flex justify-center gap-8 text-sm">
                <div>
                  <p className="text-muted-foreground">ABCT Fee (1%):</p>
                  <p className="font-mono font-semibold">{formatCurrency(caseData.abcd_fee_amount)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Payable:</p>
                  <p className="font-mono font-bold text-lg">
                    {formatCurrency(caseData.eligible_loan_amount + caseData.abcd_fee_amount)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            
            <Button
              type="button"
              onClick={onFinalize}
              disabled={isLoading}
              className="flex-1"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              {isLoading ? 'Finalizing...' : 'Finalize Eligibility'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
