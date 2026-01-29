import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { 
  Calculator, 
  CreditCard, 
  CheckCircle, 
  ArrowLeft, 
  RefreshCw,
  AlertCircle,
  Download,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { CurrencyService } from '@/services/currencyService';
import { useAuth } from '@/hooks/useAuth';
import { exportSingleCaseToExcel, exportSingleCaseToPDF } from '@/services/caseExportService';
import { 
  isPOSProduct, 
  PRODUCT_TYPE_LABELS, 
  getEligibilityStatusColor,
  BANK_INTEREST_RATES,
  getDefaultInterestRate
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
  const { isAdmin } = useAuth();
  const [posMonthlyTurnover, setPosMonthlyTurnover] = useState(
    caseData.pos_monthly_turnover?.toString() || ''
  );
  const [hasChanges, setHasChanges] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  // EMI Calculator state - initialize from case data or bank default
  const defaultBankRate = getDefaultInterestRate(caseData.bank_name);
  const [interestRate, setInterestRate] = useState(
    caseData.interest_rate && caseData.interest_rate !== 12 
      ? caseData.interest_rate.toString() 
      : defaultBankRate.toString()
  );
  const [tenure, setTenure] = useState(
    caseData.tenure_months?.toString() || '12'
  );
  const [emiHasChanges, setEmiHasChanges] = useState(false);

  const formatCurrency = (value: number) => CurrencyService.format(value, 'AED');
  const isPOS = isPOSProduct(caseData.product_type);
  const isReverse = caseData.eligibility_method === 'Reverse (ABCT 1%)';

  // EMI Calculation
  const calculateEMI = () => {
    const principal = caseData.eligible_loan_amount;
    const rate = parseFloat(interestRate) || 0;
    const months = parseInt(tenure) || 1;
    
    if (principal <= 0 || rate <= 0 || months <= 0) {
      return { emi: 0, totalInterest: 0, totalPayable: 0 };
    }
    
    const monthlyRate = rate / 12 / 100;
    const emi = principal * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1);
    const totalPayable = emi * months;
    const totalInterest = totalPayable - principal;
    
    return {
      emi: isNaN(emi) ? 0 : emi,
      totalInterest: isNaN(totalInterest) ? 0 : totalInterest,
      totalPayable: isNaN(totalPayable) ? 0 : totalPayable
    };
  };

  const emiData = calculateEMI();

  useEffect(() => {
    setHasChanges(posMonthlyTurnover !== (caseData.pos_monthly_turnover?.toString() || ''));
  }, [posMonthlyTurnover, caseData.pos_monthly_turnover]);

  // Track EMI changes
  useEffect(() => {
    const currentRate = parseFloat(interestRate) || 12;
    const currentTenure = parseInt(tenure) || 12;
    const savedRate = caseData.interest_rate || 12;
    const savedTenure = caseData.tenure_months || 12;
    
    setEmiHasChanges(currentRate !== savedRate || currentTenure !== savedTenure);
  }, [interestRate, tenure, caseData.interest_rate, caseData.tenure_months]);

  const handleUpdatePOS = async () => {
    const emiCalc = calculateEMI();
    await onUpdatePOS({
      pos_monthly_turnover: parseFloat(posMonthlyTurnover) || 0,
      interest_rate: parseFloat(interestRate) || 12,
      tenure_months: parseInt(tenure) || 12,
      monthly_emi: emiCalc.emi,
      total_interest: emiCalc.totalInterest,
      total_payable: emiCalc.totalPayable
    });
    setHasChanges(false);
    setEmiHasChanges(false);
  };

  const handleSaveEMI = async () => {
    const emiCalc = calculateEMI();
    await onUpdatePOS({
      pos_monthly_turnover: parseFloat(posMonthlyTurnover) || 0,
      interest_rate: parseFloat(interestRate) || 12,
      tenure_months: parseInt(tenure) || 12,
      monthly_emi: emiCalc.emi,
      total_interest: emiCalc.totalInterest,
      total_payable: emiCalc.totalPayable
    });
    setEmiHasChanges(false);
    toast.success('EMI details saved');
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      await exportSingleCaseToExcel(caseData);
      toast.success('Excel report exported successfully');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export Excel report');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = () => {
    try {
      exportSingleCaseToPDF(caseData);
      toast.success('PDF report opened for printing');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to generate PDF report');
    }
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

          {/* EMI Calculator */}
          {caseData.eligible_loan_amount > 0 && (
            <div className="p-4 bg-muted/30 rounded-lg border">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  EMI Calculator
                </h4>
                {emiHasChanges && (
                  <Button 
                    size="sm" 
                    onClick={handleSaveEMI}
                    disabled={isLoading}
                  >
                    <RefreshCw className={cn("h-3 w-3 mr-1", isLoading && "animate-spin")} />
                    Save EMI
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <Label htmlFor="interest_rate">
                    Annual Interest Rate (%)
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      {caseData.bank_name} default: {defaultBankRate}%
                    </span>
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="interest_rate"
                      type="number"
                      placeholder="12"
                      value={interestRate}
                      onChange={(e) => setInterestRate(e.target.value)}
                      min="0"
                      max="50"
                      step="0.1"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setInterestRate(defaultBankRate.toString())}
                      className="text-xs whitespace-nowrap"
                    >
                      Reset
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[8, 10, 12, 15, 18].map((rate) => (
                      <Button
                        key={rate}
                        type="button"
                        variant={parseFloat(interestRate) === rate ? "default" : "outline"}
                        size="sm"
                        onClick={() => setInterestRate(rate.toString())}
                        className="h-7 px-2.5 text-xs"
                      >
                        {rate}%
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tenure">Tenure (Months)</Label>
                  <Input
                    id="tenure"
                    type="number"
                    placeholder="12"
                    value={tenure}
                    onChange={(e) => setTenure(e.target.value)}
                    min="1"
                    max="360"
                    step="1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-background rounded-lg">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Monthly EMI</p>
                  <p className="text-xl font-bold font-mono text-primary">
                    {formatCurrency(emiData.emi)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Interest</p>
                  <p className="text-lg font-semibold font-mono text-muted-foreground">
                    {formatCurrency(emiData.totalInterest)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Payable</p>
                  <p className="text-lg font-semibold font-mono">
                    {formatCurrency(emiData.totalPayable)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            
            {/* Export Button - Admin Only */}
            {isAdmin && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" disabled={isExporting}>
                    <Download className={cn("mr-2 h-4 w-4", isExporting && "animate-spin")} />
                    Export Report
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={handleExportExcel}>
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Export as Excel
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportPDF}>
                    <FileText className="mr-2 h-4 w-4" />
                    Export as PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            
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
