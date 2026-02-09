import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Badge } from './ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { Building2, Wallet, Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LoanCase, LenderType, ProductType } from '../types/loanCase.types';
import { LENDERS, calculateEMI, calculateTotalInterest, calculateProcessingFee } from '../types/loanCase.types';
import { CurrencyService } from '../services/currencyService';

interface NewLoanCaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (loanCase: LoanCase) => void;
  currency?: 'AED' | 'USD';
  existingAnalysts?: string[];
  existingAgentRefs?: string[];
  existingCompanyNames?: string[];
}

export const NewLoanCaseDialog: React.FC<NewLoanCaseDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  currency = 'AED',
  existingAnalysts = [],
  existingAgentRefs = [],
  existingCompanyNames = []
}) => {
  const [analystOpen, setAnalystOpen] = useState(false);
  const [agentRefOpen, setAgentRefOpen] = useState(false);
  const [companyNameOpen, setCompanyNameOpen] = useState(false);
  const [formData, setFormData] = useState({
    applicantName: '',
    applicantPhone: '',
    applicantEmail: '',
    monthlySalary: 0,
    companyName: '',
    agentReference: '',
    analystName: '',
    lender: 'RAK' as LenderType,
    productType: 'cash' as ProductType,
    loanAmount: 50000,
    tenure: 24,
    purpose: '',
    notes: '',
    // POS eligibility inputs
    vatTurnover: 0,
    adjustedTurnover: 0,
    posMonthlyTurnover: 0,
  });

  const formatCurrency = (value: number) => CurrencyService.format(value, currency);

  // Get available product types for selected lender
  const availableProductTypes = useMemo(() => {
    return LENDERS[formData.lender].productTypes;
  }, [formData.lender]);

  // Reset product type if not available for selected lender
  useMemo(() => {
    if (!availableProductTypes.includes(formData.productType)) {
      setFormData(prev => ({ ...prev, productType: availableProductTypes[0] }));
    }
  }, [availableProductTypes, formData.productType]);

  // Check if RAK POS Loan is selected
  const isRakPosLoan = formData.lender === 'RAK' && formData.productType === 'pos';

  // Calculate EMI and costs
  const calculations = useMemo(() => {
    const lender = LENDERS[formData.lender];
    const emi = calculateEMI(formData.loanAmount, lender.interestRate, formData.tenure);
    const totalInterest = calculateTotalInterest(formData.loanAmount, emi, formData.tenure);
    const processingFee = calculateProcessingFee(formData.loanAmount, lender.processingFee);
    const totalPayable = formData.loanAmount + totalInterest + processingFee;

    return { emi, totalInterest, processingFee, totalPayable, interestRate: lender.interestRate };
  }, [formData.lender, formData.loanAmount, formData.tenure]);

  // POS Eligibility calculations (for RAK POS Loan)
  const posEligibilityCalcs = useMemo(() => {
    if (!isRakPosLoan) {
      return {
        posAnnualTurnover: 0,
        posCapAdjusted: 0,
        posCapVat: 0,
        posEligibleTurnover: 0,
        turnoverBasis: 0,
        variancePercent: 0,
        eligibleMultiplier: 0,
        eligibleLoanAmount: 0,
        abcdFeeRate: 0.01,
        abcdFeeAmount: 0,
        totalWithAbcd: 0,
        isReverseMethod: false,
      };
    }

    // Step 1: Calculate POS Eligible Turnover
    const posAnnualTurnover = formData.posMonthlyTurnover * 12;
    const posCapAdjusted = formData.adjustedTurnover * 0.40;
    const posCapVat = formData.vatTurnover * 0.40;
    const posEligibleTurnover = Math.min(posAnnualTurnover, posCapAdjusted, posCapVat);

    // Calculate variance percent
    const maxTurnover = Math.max(formData.vatTurnover, formData.adjustedTurnover);
    const variancePercent = maxTurnover === 0 ? 0 : 
      Math.round(Math.abs(formData.vatTurnover - formData.adjustedTurnover) / maxTurnover * 100 * 100) / 100;

    // Determine multiplier based on variance (for normal method)
    let normalMultiplier = 0;
    if (variancePercent <= 10) {
      normalMultiplier = 8;
    } else if (variancePercent <= 25) {
      normalMultiplier = 8 / 6;
    }

    // Determine which method to use
    const useNormalMethod = variancePercent <= 25 && normalMultiplier > 0;
    const isReverseMethod = !useNormalMethod;

    let eligibleLoanAmount: number;
    let abcdFeeAmount: number;
    let turnoverBasis: number;
    let eligibleMultiplier: number;
    const abcdFeeRate = 0.01;

    if (useNormalMethod) {
      // NORMAL Method: Eligible Loan = POS Eligible Turnover × Multiplier
      turnoverBasis = posEligibleTurnover;
      eligibleMultiplier = normalMultiplier;
      eligibleLoanAmount = turnoverBasis * eligibleMultiplier;
      abcdFeeAmount = eligibleLoanAmount * abcdFeeRate;
    } else {
      // REVERSE Method: Loan capped at Adjusted Turnover, ABCD = 1% of Adjusted
      turnoverBasis = formData.adjustedTurnover;
      eligibleMultiplier = 1; // No multiplier, direct cap
      eligibleLoanAmount = formData.adjustedTurnover;
      abcdFeeAmount = formData.adjustedTurnover * abcdFeeRate;
    }

    const totalWithAbcd = eligibleLoanAmount + abcdFeeAmount;

    return {
      posAnnualTurnover,
      posCapAdjusted,
      posCapVat,
      posEligibleTurnover,
      turnoverBasis,
      variancePercent,
      eligibleMultiplier,
      eligibleLoanAmount,
      abcdFeeRate,
      abcdFeeAmount,
      totalWithAbcd,
      isReverseMethod,
    };
  }, [isRakPosLoan, formData.posMonthlyTurnover, formData.adjustedTurnover, formData.vatTurnover]);

  const handleSubmit = () => {
    const caseNumber = `CL-${Date.now().toString().slice(-6)}`;
    const newCase: LoanCase = {
      id: `case-${Date.now()}`,
      caseNumber,
      applicantName: formData.applicantName,
      applicantPhone: formData.applicantPhone,
      applicantEmail: formData.applicantEmail,
      monthlySalary: formData.monthlySalary,
      companyName: formData.companyName,
      agentReference: formData.agentReference,
      analystName: formData.analystName,
      lender: formData.lender,
      productType: formData.productType,
      loanAmount: formData.loanAmount,
      tenure: formData.tenure,
      purpose: formData.purpose,
      interestRate: calculations.interestRate,
      emi: calculations.emi,
      totalInterest: calculations.totalInterest,
      totalPayable: calculations.totalPayable,
      processingFee: calculations.processingFee,
      // POS eligibility fields
      vatTurnover: formData.vatTurnover,
      adjustedTurnover: formData.adjustedTurnover,
      posMonthlyTurnover: formData.posMonthlyTurnover,
      posAnnualTurnover: posEligibilityCalcs.posAnnualTurnover,
      posCapAdjusted: posEligibilityCalcs.posCapAdjusted,
      posCapVat: posEligibilityCalcs.posCapVat,
      posEligibleTurnover: posEligibilityCalcs.posEligibleTurnover,
      turnoverBasis: posEligibilityCalcs.turnoverBasis,
      variancePercent: posEligibilityCalcs.variancePercent,
      eligibleMultiplier: posEligibilityCalcs.eligibleMultiplier,
      eligibleLoanAmount: posEligibilityCalcs.eligibleLoanAmount,
      // ABCD fee fields
      abcdFeeRate: posEligibilityCalcs.abcdFeeRate,
      abcdFeeAmount: posEligibilityCalcs.abcdFeeAmount,
      totalWithAbcd: posEligibilityCalcs.totalWithAbcd,
      // Status
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: formData.notes,
      documents: [
        { id: '1', name: 'Emirates ID', type: 'emirates_id', status: 'pending' },
        { id: '2', name: 'Salary Certificate', type: 'salary_certificate', status: 'pending' },
        { id: '3', name: 'Bank Statement', type: 'bank_statement', status: 'pending' },
        { id: '4', name: 'Passport Copy', type: 'passport', status: 'pending' }
      ]
    };
    onSubmit(newCase);
    // Reset form
    setFormData({
      applicantName: '',
      applicantPhone: '',
      applicantEmail: '',
      monthlySalary: 0,
      companyName: '',
      agentReference: '',
      analystName: '',
      lender: 'RAK',
      productType: 'cash',
      loanAmount: 50000,
      tenure: 24,
      purpose: '',
      notes: '',
      vatTurnover: 0,
      adjustedTurnover: 0,
      posMonthlyTurnover: 0,
    });
  };

  // Validation - also require POS fields if RAK POS is selected
  const isValid = formData.applicantName && 
    formData.loanAmount > 0 && 
    formData.tenure > 0 && 
    formData.agentReference.trim() !== '' && 
    formData.analystName.trim() !== '' &&
    (!isRakPosLoan || (formData.posMonthlyTurnover > 0 && formData.vatTurnover > 0 && formData.adjustedTurnover > 0));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Cash Loan Application</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Applicant Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Applicant Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input
                  value={formData.applicantName}
                  onChange={(e) => setFormData({ ...formData, applicantName: e.target.value })}
                  placeholder="Enter full name"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input
                  value={formData.applicantPhone}
                  onChange={(e) => setFormData({ ...formData, applicantPhone: e.target.value })}
                  placeholder="+971 50 xxx xxxx"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.applicantEmail}
                  onChange={(e) => setFormData({ ...formData, applicantEmail: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Monthly Salary</Label>
                <Input
                  type="number"
                  value={formData.monthlySalary || ''}
                  onChange={(e) => setFormData({ ...formData, monthlySalary: Number(e.target.value) })}
                  placeholder="15000"
                />
              </div>
              <div className="space-y-2">
                <Label>Company Name</Label>
                <Popover open={companyNameOpen} onOpenChange={setCompanyNameOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={companyNameOpen}
                      className="w-full justify-between font-normal"
                    >
                      {formData.companyName || "Select or type company name..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput 
                        placeholder="Search or type new company..." 
                        value={formData.companyName}
                        onValueChange={(value) => setFormData({ ...formData, companyName: value })}
                      />
                      <CommandList>
                        <CommandEmpty>
                          <span className="text-muted-foreground text-sm">
                            Press enter to use "{formData.companyName}"
                          </span>
                        </CommandEmpty>
                        <CommandGroup heading="Existing Companies">
                          {existingCompanyNames.map((company) => (
                            <CommandItem
                              key={company}
                              value={company}
                              onSelect={(currentValue) => {
                                setFormData({ ...formData, companyName: currentValue });
                                setCompanyNameOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.companyName === company ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {company}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Agent Reference *</Label>
                <Popover open={agentRefOpen} onOpenChange={setAgentRefOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={agentRefOpen}
                      className="w-full justify-between font-normal"
                    >
                      {formData.agentReference || "Select or type agent reference..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput 
                        placeholder="Search or type new reference..." 
                        value={formData.agentReference}
                        onValueChange={(value) => setFormData({ ...formData, agentReference: value })}
                      />
                      <CommandList>
                        <CommandEmpty>
                          <span className="text-muted-foreground text-sm">
                            Press enter to use "{formData.agentReference}"
                          </span>
                        </CommandEmpty>
                        <CommandGroup heading="Existing References">
                          {existingAgentRefs.map((ref) => (
                            <CommandItem
                              key={ref}
                              value={ref}
                              onSelect={(currentValue) => {
                                setFormData({ ...formData, agentReference: currentValue });
                                setAgentRefOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.agentReference === ref ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {ref}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Analyst Name *</Label>
                <Popover open={analystOpen} onOpenChange={setAnalystOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={analystOpen}
                      className="w-full justify-between font-normal"
                    >
                      {formData.analystName || "Select or type analyst name..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput 
                        placeholder="Search or type new analyst..." 
                        value={formData.analystName}
                        onValueChange={(value) => setFormData({ ...formData, analystName: value })}
                      />
                      <CommandList>
                        <CommandEmpty>
                          <span className="text-muted-foreground text-sm">
                            Press enter to use "{formData.analystName}"
                          </span>
                        </CommandEmpty>
                        <CommandGroup heading="Existing Analysts">
                          {existingAnalysts.map((analyst) => (
                            <CommandItem
                              key={analyst}
                              value={analyst}
                              onSelect={(currentValue) => {
                                setFormData({ ...formData, analystName: currentValue });
                                setAnalystOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.analystName === analyst ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {analyst}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Lender Selection */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Select Lender</h3>
            
            {/* Banks Section */}
            <div>
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <Building2 className="h-3 w-3" /> Banks
              </p>
              <RadioGroup
                value={formData.lender}
                onValueChange={(v) => setFormData({ ...formData, lender: v as LenderType })}
                className="grid grid-cols-2 gap-3"
              >
                {(Object.keys(LENDERS) as LenderType[])
                  .filter(id => LENDERS[id].category === 'bank')
                  .map((lenderId) => {
                    const lender = LENDERS[lenderId];
                    const isSelected = formData.lender === lenderId;
                    return (
                      <div
                        key={lenderId}
                        className={cn(
                          "relative flex items-start p-3 rounded-lg border-2 cursor-pointer transition-colors",
                          isSelected ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50"
                        )}
                      >
                        <RadioGroupItem value={lenderId} id={lenderId} className="mt-0.5" />
                        <Label htmlFor={lenderId} className="flex-1 ml-2 cursor-pointer">
                          <p className="font-semibold text-sm">{lender.name}</p>
                          <p className="text-xs text-muted-foreground">{lender.interestRate}% p.a.</p>
                          {lender.productTypes.length > 1 && (
                            <div className="mt-1 flex gap-1">
                              {lender.productTypes.map(pt => (
                                <Badge key={pt} variant="outline" className="text-[10px] px-1.5 py-0">
                                  {pt.toUpperCase()}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </Label>
                      </div>
                    );
                  })}
              </RadioGroup>
            </div>
            
            {/* Fintech Section */}
            <div>
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <Wallet className="h-3 w-3" /> Fintech Lenders
              </p>
              <RadioGroup
                value={formData.lender}
                onValueChange={(v) => setFormData({ ...formData, lender: v as LenderType })}
                className="grid grid-cols-3 gap-2"
              >
                {(Object.keys(LENDERS) as LenderType[])
                  .filter(id => LENDERS[id].category === 'fintech')
                  .map((lenderId) => {
                    const lender = LENDERS[lenderId];
                    const isSelected = formData.lender === lenderId;
                    return (
                      <div
                        key={lenderId}
                        className={cn(
                          "relative flex items-center gap-2 p-2 rounded-lg border-2 cursor-pointer transition-colors",
                          isSelected ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50"
                        )}
                      >
                        <RadioGroupItem value={lenderId} id={lenderId} className="h-3 w-3" />
                        <Label htmlFor={lenderId} className="cursor-pointer text-xs">
                          <p className="font-medium">{lender.shortName}</p>
                          <p className="text-muted-foreground">{lender.interestRate}%</p>
                        </Label>
                      </div>
                    );
                  })}
              </RadioGroup>
            </div>
          </div>

          {/* Product Type Selection (if lender supports multiple) */}
          {availableProductTypes.length > 1 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">Product Type</h3>
              <div className="flex gap-3">
                {availableProductTypes.map((pt) => (
                  <Button
                    key={pt}
                    type="button"
                    variant={formData.productType === pt ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFormData({ ...formData, productType: pt })}
                    className="flex-1"
                  >
                    {pt === 'cash' ? 'Cash Loan' : 'POS Financing'}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* RAK POS Loan Eligibility Inputs */}
          {isRakPosLoan && (
            <div className="space-y-4 p-4 rounded-lg border-2 border-primary/20 bg-primary/5">
              <h3 className="text-sm font-medium text-primary flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">RAK POS</Badge>
                POS Eligibility Inputs
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>POS Monthly Turnover *</Label>
                  <Input
                    type="number"
                    value={formData.posMonthlyTurnover || ''}
                    onChange={(e) => setFormData({ ...formData, posMonthlyTurnover: Number(e.target.value) })}
                    placeholder="e.g., 100000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>VAT Turnover *</Label>
                  <Input
                    type="number"
                    value={formData.vatTurnover || ''}
                    onChange={(e) => setFormData({ ...formData, vatTurnover: Number(e.target.value) })}
                    placeholder="e.g., 1200000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Adjusted Turnover *</Label>
                  <Input
                    type="number"
                    value={formData.adjustedTurnover || ''}
                    onChange={(e) => setFormData({ ...formData, adjustedTurnover: Number(e.target.value) })}
                    placeholder="e.g., 1100000"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Loan Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Loan Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Loan Amount *</Label>
                <Input
                  type="number"
                  value={formData.loanAmount || ''}
                  onChange={(e) => setFormData({ ...formData, loanAmount: Number(e.target.value) })}
                  placeholder="100000"
                />
              </div>
              <div className="space-y-2">
                <Label>Tenure (months) *</Label>
                <Input
                  type="number"
                  value={formData.tenure || ''}
                  onChange={(e) => setFormData({ ...formData, tenure: Number(e.target.value) })}
                  placeholder="24"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Loan Purpose</Label>
                <Select
                  value={formData.purpose}
                  onValueChange={(v) => setFormData({ ...formData, purpose: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select purpose" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal">Personal Expenses</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="medical">Medical</SelectItem>
                    <SelectItem value="home_improvement">Home Improvement</SelectItem>
                    <SelectItem value="wedding">Wedding</SelectItem>
                    <SelectItem value="travel">Travel</SelectItem>
                    <SelectItem value="debt_consolidation">Debt Consolidation</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* EMI Preview */}
          <div className="p-4 rounded-lg bg-muted/50 border">
            <h3 className="text-sm font-medium mb-3">Loan Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Monthly EMI</p>
                <p className="text-lg font-bold text-primary">{formatCurrency(calculations.emi)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Interest Rate</p>
                <p className="text-lg font-semibold">{calculations.interestRate}%</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Interest</p>
                <p className="text-lg font-semibold text-destructive">{formatCurrency(calculations.totalInterest)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Payable</p>
                <p className="text-lg font-bold">{formatCurrency(calculations.totalPayable)}</p>
              </div>
            </div>
          </div>

          {/* RAK POS Eligibility Summary */}
          {isRakPosLoan && (formData.posMonthlyTurnover > 0 || formData.vatTurnover > 0 || formData.adjustedTurnover > 0) && (
            <div className={cn(
              "p-4 rounded-lg border-2",
              posEligibilityCalcs.isReverseMethod 
                ? "border-warning/40 bg-warning/5" 
                : "border-primary/30 bg-primary/5"
            )}>
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">RAK POS</Badge>
                <Badge 
                  variant={posEligibilityCalcs.isReverseMethod ? "outline" : "default"} 
                  className={cn(
                    "text-xs",
                    posEligibilityCalcs.isReverseMethod 
                      ? "border-warning text-warning" 
                      : ""
                  )}
                >
                  {posEligibilityCalcs.isReverseMethod ? "REVERSE Method" : "NORMAL Method"}
                </Badge>
                POS Eligibility Calculation
              </h3>
              
              {/* Method explanation */}
              {posEligibilityCalcs.isReverseMethod && (
                <div className="mb-4 p-2 bg-warning/10 rounded border border-warning/30 text-xs text-warning">
                  ⚠️ Variance &gt; 25% — Using REVERSE method: Loan capped at Adjusted Turnover, ABCD = 1% of Adjusted Turnover
                </div>
              )}
              
              {/* Turnover Breakdown */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-4">
                <div className="p-2 bg-background rounded border">
                  <p className="text-xs text-muted-foreground">POS Annual Turnover</p>
                  <p className="font-semibold">{formatCurrency(posEligibilityCalcs.posAnnualTurnover)}</p>
                  <p className="text-[10px] text-muted-foreground">Monthly × 12</p>
                </div>
                <div className="p-2 bg-background rounded border">
                  <p className="text-xs text-muted-foreground">40% Adjusted Cap</p>
                  <p className="font-semibold">{formatCurrency(posEligibilityCalcs.posCapAdjusted)}</p>
                  <p className="text-[10px] text-muted-foreground">Adjusted × 0.40</p>
                </div>
                <div className="p-2 bg-background rounded border">
                  <p className="text-xs text-muted-foreground">40% VAT Cap</p>
                  <p className="font-semibold">{formatCurrency(posEligibilityCalcs.posCapVat)}</p>
                  <p className="text-[10px] text-muted-foreground">VAT × 0.40</p>
                </div>
                <div className={cn(
                  "p-2 rounded border",
                  posEligibilityCalcs.isReverseMethod 
                    ? "bg-muted/50 border-muted-foreground/30" 
                    : "bg-primary/10 border-primary/30"
                )}>
                  <p className="text-xs text-muted-foreground">POS Eligible Turnover</p>
                  <p className={cn(
                    "font-bold",
                    posEligibilityCalcs.isReverseMethod ? "text-muted-foreground" : "text-primary"
                  )}>{formatCurrency(posEligibilityCalcs.posEligibleTurnover)}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {posEligibilityCalcs.isReverseMethod ? "Not used (reverse)" : "MIN of above"}
                  </p>
                </div>
              </div>

              {/* Eligibility Results */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="p-2 bg-background rounded border">
                  <p className="text-xs text-muted-foreground">Variance</p>
                  <p className={cn(
                    "font-semibold",
                    posEligibilityCalcs.variancePercent <= 10 ? "text-success" :
                    posEligibilityCalcs.variancePercent <= 25 ? "text-warning" : "text-destructive"
                  )}>
                    {posEligibilityCalcs.variancePercent.toFixed(2)}%
                  </p>
                </div>
                <div className="p-2 bg-background rounded border">
                  <p className="text-xs text-muted-foreground">
                    {posEligibilityCalcs.isReverseMethod ? "Basis" : "Multiplier"}
                  </p>
                  <p className="font-semibold">
                    {posEligibilityCalcs.isReverseMethod 
                      ? "Adjusted T/O" 
                      : `${posEligibilityCalcs.eligibleMultiplier.toFixed(2)}x`
                    }
                  </p>
                </div>
                <div className="p-2 bg-success/10 rounded border border-success/30">
                  <p className="text-xs text-muted-foreground">Eligible Loan Amount</p>
                  <p className="font-bold text-success">{formatCurrency(posEligibilityCalcs.eligibleLoanAmount)}</p>
                </div>
                <div className="p-2 bg-warning/10 rounded border border-warning/30">
                  <p className="text-xs text-muted-foreground">ABCD Fee (1%)</p>
                  <p className="font-semibold text-warning">{formatCurrency(posEligibilityCalcs.abcdFeeAmount)}</p>
                </div>
              </div>

              {/* Total with ABCD */}
              <div className="mt-3 p-3 bg-primary/20 rounded-lg border border-primary/40">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Including ABCD Fee</span>
                  <span className="text-xl font-bold text-primary">{formatCurrency(posEligibilityCalcs.totalWithAbcd)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!isValid}>Create Case</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
