import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Alert, AlertDescription } from './ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  Calculator, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Save,
  RefreshCw,
  CreditCard
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CurrencyService } from '@/services/currencyService';
import type { 
  LoanEligibility, 
  LoanEligibilityInput, 
  EligibilityStatus, 
  VarianceBucket,
  ProductType 
} from '@/types/loanEligibility.types';
import { 
  getStatusColor, 
  getBucketColor, 
  PRODUCT_TYPE_LABELS, 
  POS_CAP_RATES,
  isPOSProduct 
} from '@/types/loanEligibility.types';

interface LoanEligibilityFormProps {
  onSubmit: (input: LoanEligibilityInput) => Promise<LoanEligibility>;
  initialData?: LoanEligibility;
  isLoading?: boolean;
  currency?: 'AED' | 'USD';
  onCancel?: () => void;
}

interface CalculatedValues {
  adjusted_turnover: number;
  variance_percent: number;
  variance_bucket: VarianceBucket;
  eligibility_status: EligibilityStatus;
  eligible_multiplier: number;
  eligible_loan_amount: number;
  // POS fields
  pos_cap_rate: number;
  pos_annual_turnover: number;
  pos_cap_adjusted: number;
  pos_cap_vat: number;
  pos_eligible_turnover: number;
  turnover_basis: number;
  // ABCT fee fields
  abcd_fee_rate: number;
  abcd_fee_amount: number;
  total_with_abcd: number;
  // Eligibility method
  eligibility_method: 'Standard' | 'Alternative';
}

export const LoanEligibilityForm: React.FC<LoanEligibilityFormProps> = ({
  onSubmit,
  initialData,
  isLoading = false,
  currency = 'AED',
  onCancel
}) => {
  const [productType, setProductType] = useState<ProductType>(initialData?.product_type || 'standard');
  const [vatTurnover, setVatTurnover] = useState<string>(initialData?.vat_turnover?.toString() || '');
  const [declaredTurnover, setDeclaredTurnover] = useState<string>(initialData?.declared_turnover?.toString() || '');
  const [cashAdjustment, setCashAdjustment] = useState<string>(initialData?.cash_adjustment?.toString() || '');
  const [sisterConcernAdjustment, setSisterConcernAdjustment] = useState<string>(initialData?.sister_concern_adjustment?.toString() || '');
  const [posMonthlyTurnover, setPosMonthlyTurnover] = useState<string>(initialData?.pos_monthly_turnover?.toString() || '');
  const [companyName, setCompanyName] = useState<string>(initialData?.company_name || '');
  const [periodStart, setPeriodStart] = useState<string>(initialData?.period_start || '');
  const [periodEnd, setPeriodEnd] = useState<string>(initialData?.period_end || '');
  const [notes, setNotes] = useState<string>(initialData?.notes || '');
  const [calculated, setCalculated] = useState<CalculatedValues | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  const formatCurrency = (value: number) => CurrencyService.format(value, currency);
  const isPOS = isPOSProduct(productType);
  const isRAKPOS = productType === 'rak_pos';
  const isEditing = !!initialData;

  // Reset form when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData) {
      setProductType(initialData.product_type || 'standard');
      setVatTurnover(initialData.vat_turnover?.toString() || '');
      setDeclaredTurnover(initialData.declared_turnover?.toString() || '');
      setCashAdjustment(initialData.cash_adjustment?.toString() || '');
      setSisterConcernAdjustment(initialData.sister_concern_adjustment?.toString() || '');
      setPosMonthlyTurnover(initialData.pos_monthly_turnover?.toString() || '');
      setCompanyName(initialData.company_name || '');
      setPeriodStart(initialData.period_start || '');
      setPeriodEnd(initialData.period_end || '');
      setNotes(initialData.notes || '');
    } else {
      handleReset();
    }
  }, [initialData?.id]);

  // Calculate values on input change
  useEffect(() => {
    const vat = parseFloat(vatTurnover) || 0;
    const declared = parseFloat(declaredTurnover) || 0;
    const cash = parseFloat(cashAdjustment) || 0;
    const sister = parseFloat(sisterConcernAdjustment) || 0;
    const posMonthly = parseFloat(posMonthlyTurnover) || 0;
    
    const newWarnings: string[] = [];

    // Calculate adjusted turnover
    let adjustedTurnover = declared - cash - sister;
    if (adjustedTurnover < 0) {
      adjustedTurnover = 0;
      newWarnings.push('Adjusted turnover was negative and has been set to 0');
    }

    // POS calculations
    const posCapRate = POS_CAP_RATES[productType];
    const posAnnualTurnover = posMonthly * 12;
    const posCapAdjusted = adjustedTurnover * posCapRate;
    const posCapVat = vat * posCapRate;
    
    let posEligibleTurnover = 0;
    if (isPOS) {
      posEligibleTurnover = Math.min(posAnnualTurnover, posCapAdjusted, posCapVat);
    }

    // Determine turnover basis
    const turnoverBasis = isPOS ? posEligibleTurnover : adjustedTurnover;

    // Check for insufficient data
    if (declared === 0) {
      setCalculated({
        adjusted_turnover: adjustedTurnover,
        variance_percent: 0,
        variance_bucket: 'N/A',
        eligibility_status: 'Insufficient Data',
        eligible_multiplier: 0,
        eligible_loan_amount: 0,
        pos_cap_rate: posCapRate,
        pos_annual_turnover: posAnnualTurnover,
        pos_cap_adjusted: posCapAdjusted,
        pos_cap_vat: posCapVat,
        pos_eligible_turnover: posEligibleTurnover,
        turnover_basis: turnoverBasis,
        abcd_fee_rate: 0,
        abcd_fee_amount: 0,
        total_with_abcd: 0,
        eligibility_method: 'Standard'
      });
      setWarnings(newWarnings);
      return;
    }

    // Check for missing VAT
    if (vat === 0) {
      newWarnings.push('VAT Missing – variance may be unreliable');
    }

    // Check for missing POS monthly turnover when POS product is selected
    if (isPOS && posMonthly === 0) {
      newWarnings.push('POS Monthly Turnover is required for POS products');
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
    let eligibilityMethod: 'Standard' | 'Alternative' = 'Standard';

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

    // Calculate eligible loan amount and ABCD fee
    let eligibleLoanAmount = 0;
    let abcdFeeRate = 0;
    let abcdFeeAmount = 0;
    let totalWithAbcd = 0;

    // Check for Alternative Eligibility (RAK POS only, variance > 25%)
    if (productType === 'rak_pos' && variancePercent > 25 && adjustedTurnover > 0) {
      // Alternative method: Loan = Adjusted Turnover, ABCD = 1% of Adjusted
      eligibilityMethod = 'Alternative';
      eligibilityStatus = 'Eligible (Alternative)';
      eligibleLoanAmount = adjustedTurnover;
      abcdFeeRate = 0.01;
      abcdFeeAmount = Math.round(adjustedTurnover * 0.01 * 100) / 100;
      totalWithAbcd = eligibleLoanAmount + abcdFeeAmount;
    } else if (eligibleMultiplier > 0) {
      // Standard method
      eligibleLoanAmount = turnoverBasis * eligibleMultiplier;
      
      // ABCD fee for RAK POS only
      if (productType === 'rak_pos' && eligibleLoanAmount > 0) {
        abcdFeeRate = 0.01;
        abcdFeeAmount = Math.round(eligibleLoanAmount * abcdFeeRate * 100) / 100;
        totalWithAbcd = eligibleLoanAmount + abcdFeeAmount;
      } else {
        totalWithAbcd = eligibleLoanAmount;
      }
    }

    setCalculated({
      adjusted_turnover: adjustedTurnover,
      variance_percent: variancePercent,
      variance_bucket: varianceBucket,
      eligibility_status: eligibilityStatus,
      eligible_multiplier: eligibleMultiplier,
      eligible_loan_amount: eligibleLoanAmount,
      pos_cap_rate: posCapRate,
      pos_annual_turnover: posAnnualTurnover,
      pos_cap_adjusted: posCapAdjusted,
      pos_cap_vat: posCapVat,
      pos_eligible_turnover: posEligibleTurnover,
      turnover_basis: turnoverBasis,
      abcd_fee_rate: abcdFeeRate,
      abcd_fee_amount: abcdFeeAmount,
      total_with_abcd: totalWithAbcd,
      eligibility_method: eligibilityMethod
    });
    setWarnings(newWarnings);
  }, [vatTurnover, declaredTurnover, cashAdjustment, sisterConcernAdjustment, posMonthlyTurnover, productType, isPOS]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const input: LoanEligibilityInput = {
      product_type: productType,
      vat_turnover: parseFloat(vatTurnover) || 0,
      declared_turnover: parseFloat(declaredTurnover) || 0,
      cash_adjustment: parseFloat(cashAdjustment) || 0,
      sister_concern_adjustment: parseFloat(sisterConcernAdjustment) || 0,
      pos_monthly_turnover: parseFloat(posMonthlyTurnover) || 0,
      company_name: companyName || undefined,
      period_start: periodStart || undefined,
      period_end: periodEnd || undefined,
      notes: notes || undefined
    };
    
    await onSubmit(input);
  };

  const handleReset = () => {
    setProductType('standard');
    setVatTurnover('');
    setDeclaredTurnover('');
    setCashAdjustment('');
    setSisterConcernAdjustment('');
    setPosMonthlyTurnover('');
    setCompanyName('');
    setPeriodStart('');
    setPeriodEnd('');
    setNotes('');
  };

  const getStatusIcon = (status: EligibilityStatus) => {
    switch (status) {
      case 'Eligible':
        return <CheckCircle className="h-5 w-5 text-success" />;
      case 'Eligible (Reduced)':
        return <AlertCircle className="h-5 w-5 text-warning" />;
      case 'Eligible (Alternative)':
        return <RefreshCw className="h-5 w-5 text-orange-500" />;
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
      case 'alternative':
        return 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-200 dark:border-orange-700';
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
            {/* Company Name & Period Fields */}
            <div className="space-y-4 p-3 bg-muted/30 rounded-lg border border-border">
              <div className="space-y-2">
                <Label htmlFor="company_name">Company Name</Label>
                <Input
                  id="company_name"
                  type="text"
                  placeholder="Enter company name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  maxLength={100}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="period_start">Period Start</Label>
                  <Input
                    id="period_start"
                    type="date"
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="period_end">Period End</Label>
                  <Input
                    id="period_end"
                    type="date"
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Product Type Dropdown */}
            <div className="space-y-2">
              <Label htmlFor="product_type">Product Type *</Label>
              <Select value={productType} onValueChange={(v) => setProductType(v as ProductType)}>
                <SelectTrigger id="product_type">
                  <SelectValue placeholder="Select product type" />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-lg z-50">
                  {(Object.keys(PRODUCT_TYPE_LABELS) as ProductType[]).map((type) => (
                    <SelectItem key={type} value={type}>
                      <div className="flex items-center gap-2">
                        {isPOSProduct(type) && <CreditCard className="h-3.5 w-3.5" />}
                        {PRODUCT_TYPE_LABELS[type]}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isPOS && (
                <p className="text-xs text-muted-foreground">
                  Cap Rate: {(POS_CAP_RATES[productType] * 100).toFixed(0)}%
                </p>
              )}
            </div>

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

            {/* POS Monthly Turnover - Only visible for POS products */}
            {isPOS && (
              <div className="space-y-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
                <Label htmlFor="pos_monthly_turnover" className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  POS Monthly Turnover *
                </Label>
                <Input
                  id="pos_monthly_turnover"
                  type="number"
                  placeholder="0.00"
                  value={posMonthlyTurnover}
                  onChange={(e) => setPosMonthlyTurnover(e.target.value)}
                  min="0"
                  step="0.01"
                  required={isPOS}
                />
                <p className="text-xs text-muted-foreground">
                  Monthly POS transaction volume
                </p>
              </div>
            )}

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
                {isLoading ? 'Saving...' : isEditing ? 'Update Eligibility' : 'Save Eligibility'}
              </Button>
              {onCancel ? (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              ) : (
                <Button type="button" variant="outline" onClick={handleReset}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Results Card */}
        <Card className={cn(
          "border-2 transition-colors",
          calculated?.eligibility_status === 'Eligible' && "border-success/50",
          calculated?.eligibility_status === 'Eligible (Reduced)' && "border-warning/50",
          calculated?.eligibility_status === 'Eligible (Alternative)' && "border-orange-500/50",
          calculated?.eligibility_status === 'Not Eligible' && "border-destructive/50"
        )}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Eligibility Summary</span>
              {calculated && getStatusIcon(calculated.eligibility_status)}
            </CardTitle>
            {isPOS && (
              <Badge variant="secondary" className="w-fit">
                <CreditCard className="h-3 w-3 mr-1" />
                {PRODUCT_TYPE_LABELS[productType]}
              </Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {calculated && (
              <>
                {/* Alternative Method Alert - RAK POS Only */}
                {isRAKPOS && calculated.eligibility_method === 'Alternative' && (
                  <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950/30">
                    <RefreshCw className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-orange-800 dark:text-orange-200">
                      <div className="space-y-2">
                        <p className="font-semibold">🔄 Alternative Eligibility Method</p>
                        <p className="text-sm">
                          Normal eligibility failed (variance {calculated.variance_percent.toFixed(2)}% &gt; 25%). 
                          Using <strong>ABCT reversal calculation</strong>:
                        </p>
                        <div className="text-xs space-y-1 p-2 bg-orange-100 dark:bg-orange-900/50 rounded font-mono">
                          <p>Loan Amount = Adjusted Turnover = {formatCurrency(calculated.adjusted_turnover)}</p>
                          <p>ABCT Fee = Adjusted × 1% = {formatCurrency(calculated.abcd_fee_amount)}</p>
                          <p className="font-bold">Total = {formatCurrency(calculated.total_with_abcd)}</p>
                        </div>
                        <p className="text-xs italic">
                          Since ABCT = 1% of Adjusted Turnover AND ABCT = 1% of Loan, therefore Loan = Adjusted Turnover
                        </p>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Adjusted Turnover */}
                {/* Adjusted Turnover */}
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm text-muted-foreground">Adjusted Turnover</span>
                  <span className="font-mono font-semibold">
                    {formatCurrency(calculated.adjusted_turnover)}
                  </span>
                </div>

                {/* POS Calculations - Only show for POS products */}
                {isPOS && (
                  <div className="space-y-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
                    <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">
                      POS Calculations
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Cap Rate:</span>
                        <span className="font-mono">{(calculated.pos_cap_rate * 100).toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Annual POS:</span>
                        <span className="font-mono">{formatCurrency(calculated.pos_annual_turnover)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Cap (Adjusted):</span>
                        <span className="font-mono">{formatCurrency(calculated.pos_cap_adjusted)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Cap (VAT):</span>
                        <span className="font-mono">{formatCurrency(calculated.pos_cap_vat)}</span>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-primary/20 mt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">POS Eligible Turnover</span>
                        <span className="font-mono font-semibold text-primary">
                          {formatCurrency(calculated.pos_eligible_turnover)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        MIN(Annual POS, Cap Adjusted, Cap VAT)
                      </p>
                    </div>
                  </div>
                )}

                {/* Turnover Basis */}
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm text-muted-foreground">
                    Turnover Basis
                    {isPOS && <span className="text-xs ml-1">(POS)</span>}
                  </span>
                  <span className="font-mono font-semibold">
                    {formatCurrency(calculated.turnover_basis)}
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

                {/* Visual Variance Meter */}
                <div className="p-3 bg-muted/30 rounded-lg">
                  <div className="flex justify-between text-xs text-muted-foreground mb-2">
                    <span>0%</span>
                    <span className="font-medium">Variance Scale</span>
                    <span>30%+</span>
                  </div>
                  <div className="relative h-10 flex rounded-lg overflow-hidden border border-border">
                    <div className="flex-1 bg-gradient-to-r from-success/80 to-success flex items-center justify-center text-white text-xs font-bold">
                      ≤10%
                      <br />
                      <span className="text-[10px] font-normal">8×</span>
                    </div>
                    <div className="flex-1 bg-gradient-to-r from-warning/80 to-warning flex items-center justify-center text-white text-xs font-bold">
                      11-25%
                      <br />
                      <span className="text-[10px] font-normal">1.33×</span>
                    </div>
                    <div className="flex-1 bg-gradient-to-r from-destructive/80 to-destructive flex items-center justify-center text-white text-xs font-bold">
                      &gt;25%
                      <br />
                      <span className="text-[10px] font-normal">0×</span>
                    </div>
                    {/* Pointer */}
                    <div 
                      className="absolute -top-1 transform -translate-x-1/2 text-2xl text-primary drop-shadow-md transition-all duration-300"
                      style={{ left: `${Math.min((calculated.variance_percent / 30) * 100, 100)}%` }}
                    >
                      ▼
                    </div>
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
                  calculated.eligibility_status === 'Eligible (Alternative)' && "bg-orange-50 dark:bg-orange-950/30 border border-orange-300 dark:border-orange-700",
                  calculated.eligibility_status === 'Not Eligible' && "bg-destructive/10 border border-destructive/30",
                  calculated.eligibility_status === 'Insufficient Data' && "bg-muted"
                )}>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    Eligible Loan Amount
                    {calculated.eligibility_method === 'Alternative' && (
                      <span className="ml-2 text-orange-600">(Alternative)</span>
                    )}
                  </p>
                  <p className="text-2xl font-bold font-mono">
                    {formatCurrency(calculated.eligible_loan_amount)}
                  </p>
                </div>

                {/* ABCT Fee Section - Only for RAK POS */}
                {isRAKPOS && calculated.eligible_loan_amount > 0 && (
                  <div className="space-y-2 p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-300 dark:border-amber-700 mt-4">
                    <p className="text-xs font-semibold text-amber-800 dark:text-amber-200 uppercase tracking-wider mb-2">
                      ABCT Fee (RAK POS Only)
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-amber-700 dark:text-amber-300">ABCT Fee Rate:</span>
                        <span className="font-mono font-semibold text-amber-800 dark:text-amber-200">
                          {(calculated.abcd_fee_rate * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-amber-700 dark:text-amber-300">ABCT Fee Amount:</span>
                        <span className="font-mono font-semibold text-amber-800 dark:text-amber-200">
                          {formatCurrency(calculated.abcd_fee_amount)}
                        </span>
                      </div>
                      <div className="pt-2 border-t border-amber-300 dark:border-amber-700">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-amber-800 dark:text-amber-200">Total with ABCT Fee:</span>
                          <span className="font-mono font-bold text-lg text-amber-900 dark:text-amber-100">
                            {formatCurrency(calculated.total_with_abcd)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Formula explanation */}
                <div className="text-xs text-muted-foreground p-3 bg-muted/30 rounded-lg space-y-1">
                  <p><strong>Formula:</strong></p>
                  <p>Adjusted = Declared − Cash − Sister Concern</p>
                  {isPOS && (
                    <>
                      <p>POS Annual = POS Monthly × 12</p>
                      <p>POS Cap (Adj) = Adjusted × {(POS_CAP_RATES[productType] * 100).toFixed(0)}%</p>
                      <p>POS Cap (VAT) = VAT × {(POS_CAP_RATES[productType] * 100).toFixed(0)}%</p>
                      <p>Turnover Basis = MIN(POS Annual, Cap Adj, Cap VAT)</p>
                    </>
                  )}
                  <p>Variance% = |VAT − Adjusted| / MAX(VAT, Adjusted) × 100</p>
                  <p>Eligible Amount = Turnover Basis × Multiplier</p>
                  {isRAKPOS && calculated.eligibility_method === 'Standard' && (
                    <p>Total = Eligible Amount + (Eligible Amount × 1% ABCT Fee)</p>
                  )}
                  {isRAKPOS && calculated.eligibility_method === 'Alternative' && (
                    <p className="text-orange-600 font-semibold">Alternative: Loan = Adjusted Turnover, ABCT = Adjusted × 1%</p>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </form>
  );
};
