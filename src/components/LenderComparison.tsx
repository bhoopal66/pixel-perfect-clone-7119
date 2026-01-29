import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calculator, TrendingDown, Percent, Clock, DollarSign, CheckCircle, XCircle, Building2, Wallet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { cn } from '@/lib/utils';
import { LENDERS, calculateEMI, calculateTotalInterest, calculateProcessingFee, type LenderType } from '../types/loanCase.types';
import { CurrencyService } from '../services/currencyService';

interface LenderComparisonProps {
  currency?: 'AED' | 'USD';
}

interface LenderCalculation {
  eligible: boolean;
  eligibilityIssues: string[];
  emi: number;
  totalInterest: number;
  totalPayable: number;
  processingFee: number;
  effectiveRate: number;
}

export const LenderComparison: React.FC<LenderComparisonProps> = ({ currency = 'AED' }) => {
  const [loanAmount, setLoanAmount] = useState(100000);
  const [tenure, setTenure] = useState(24);
  const [salary, setSalary] = useState(15000);
  const [category, setCategory] = useState<'all' | 'bank' | 'fintech'>('all');

  const formatCurrency = (value: number) => CurrencyService.format(value, currency);

  const comparison = useMemo(() => {
    const results: Record<LenderType, LenderCalculation> = {} as any;

    (Object.keys(LENDERS) as LenderType[]).forEach(lenderId => {
      const lender = LENDERS[lenderId];
      const eligibilityIssues: string[] = [];

      // Check eligibility
      if (lender.eligibility.minSalary > 0 && salary < lender.eligibility.minSalary) {
        eligibilityIssues.push(`Min salary: ${formatCurrency(lender.eligibility.minSalary)}`);
      }
      if (loanAmount < lender.minAmount) {
        eligibilityIssues.push(`Min amount: ${formatCurrency(lender.minAmount)}`);
      }
      if (loanAmount > lender.maxAmount) {
        eligibilityIssues.push(`Max amount: ${formatCurrency(lender.maxAmount)}`);
      }
      if (tenure < lender.minTenure) {
        eligibilityIssues.push(`Min tenure: ${lender.minTenure} months`);
      }
      if (tenure > lender.maxTenure) {
        eligibilityIssues.push(`Max tenure: ${lender.maxTenure} months`);
      }

      const emi = calculateEMI(loanAmount, lender.interestRate, tenure);
      const totalInterest = calculateTotalInterest(loanAmount, emi, tenure);
      const processingFee = calculateProcessingFee(loanAmount, lender.processingFee);
      const totalPayable = loanAmount + totalInterest + processingFee;
      const effectiveRate = ((totalPayable - loanAmount) / loanAmount / (tenure / 12)) * 100;

      results[lenderId] = {
        eligible: eligibilityIssues.length === 0,
        eligibilityIssues,
        emi,
        totalInterest,
        totalPayable,
        processingFee,
        effectiveRate
      };
    });

    return results;
  }, [loanAmount, tenure, salary]);

  // Filter lenders by category
  const filteredLenders = useMemo(() => {
    return (Object.keys(LENDERS) as LenderType[]).filter(id => {
      if (category === 'all') return true;
      return LENDERS[id].category === category;
    });
  }, [category]);

  // Find best option among eligible lenders
  const bestOption = useMemo(() => {
    const eligible = filteredLenders
      .filter(id => comparison[id].eligible)
      .map(id => ({ id, data: comparison[id] }));
    if (eligible.length === 0) return null;
    return eligible.reduce((best, current) => 
      current.data.totalPayable < best.data.totalPayable ? current : best
    ).id;
  }, [comparison, filteredLenders]);

  return (
    <div className="space-y-6">
      {/* Calculator Inputs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            EMI Calculator & Lender Comparison
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <Label>Loan Amount: {formatCurrency(loanAmount)}</Label>
              <Slider
                value={[loanAmount]}
                onValueChange={([v]) => setLoanAmount(v)}
                min={2000}
                max={1500000}
                step={5000}
              />
              <Input
                type="number"
                value={loanAmount}
                onChange={(e) => setLoanAmount(Number(e.target.value))}
                className="mt-2"
              />
            </div>
            <div className="space-y-3">
              <Label>Tenure: {tenure} months</Label>
              <Slider
                value={[tenure]}
                onValueChange={([v]) => setTenure(v)}
                min={3}
                max={48}
                step={1}
              />
              <Input
                type="number"
                value={tenure}
                onChange={(e) => setTenure(Number(e.target.value))}
                className="mt-2"
              />
            </div>
            <div className="space-y-3">
              <Label>Monthly Salary: {formatCurrency(salary)}</Label>
              <Slider
                value={[salary]}
                onValueChange={([v]) => setSalary(v)}
                min={2000}
                max={100000}
                step={1000}
              />
              <Input
                type="number"
                value={salary}
                onChange={(e) => setSalary(Number(e.target.value))}
                className="mt-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Filter */}
      <div className="flex justify-center">
        <Tabs value={category} onValueChange={(v) => setCategory(v as 'all' | 'bank' | 'fintech')}>
          <TabsList>
            <TabsTrigger value="all">All Lenders</TabsTrigger>
            <TabsTrigger value="bank" className="gap-1">
              <Building2 className="h-3 w-3" /> Banks
            </TabsTrigger>
            <TabsTrigger value="fintech" className="gap-1">
              <Wallet className="h-3 w-3" /> Fintech
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Lender Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredLenders.map((lenderId) => {
          const lender = LENDERS[lenderId];
          const data = comparison[lenderId];
          const isBest = lenderId === bestOption;

          return (
            <motion.div
              key={lenderId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              layout
            >
              <Card className={cn(
                "relative overflow-hidden h-full",
                isBest && "ring-2 ring-primary",
                !data.eligible && "opacity-75"
              )}>
                {isBest && (
                  <div className="absolute top-0 right-0 px-2 py-0.5 bg-primary text-primary-foreground text-[10px] font-medium">
                    Best
                  </div>
                )}
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">{lender.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-muted-foreground">
                          {lender.interestRate}% p.a.
                        </span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {lender.category}
                        </Badge>
                      </div>
                    </div>
                    {data.eligible ? (
                      <CheckCircle className="h-5 w-5 text-success" />
                    ) : (
                      <XCircle className="h-5 w-5 text-destructive" />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-2">
                  {/* Eligibility Issues */}
                  {data.eligibilityIssues.length > 0 && (
                    <div className="p-2 rounded bg-destructive/10 border border-destructive/20">
                      <ul className="text-[10px] text-destructive space-y-0.5">
                        {data.eligibilityIssues.map((issue, i) => (
                          <li key={i}>• {issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* EMI & Costs */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-2 rounded bg-muted/50">
                      <span className="text-xs text-muted-foreground">Monthly EMI</span>
                      <span className="text-sm font-bold text-primary">{formatCurrency(data.emi)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 rounded bg-muted/30">
                        <p className="text-muted-foreground">Interest</p>
                        <p className="font-medium text-destructive">{formatCurrency(data.totalInterest)}</p>
                      </div>
                      <div className="p-2 rounded bg-muted/30">
                        <p className="text-muted-foreground">Processing</p>
                        <p className="font-medium">{formatCurrency(data.processingFee)}</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded bg-primary/10">
                      <span className="text-xs font-medium">Total Payable</span>
                      <span className="text-sm font-bold">{formatCurrency(data.totalPayable)}</span>
                    </div>
                  </div>

                  {/* Product Types */}
                  <div className="flex gap-1">
                    {lender.productTypes.map(pt => (
                      <Badge key={pt} variant="secondary" className="text-[10px]">
                        {pt.toUpperCase()}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Best Option Summary */}
      {bestOption && (
        <Card className="bg-success/5 border-success/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <TrendingDown className="h-10 w-10 text-success" />
              <div>
                <p className="text-lg font-semibold text-foreground">
                  Best Option: <span className="text-success">{LENDERS[bestOption].name}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Lowest total payable at {formatCurrency(comparison[bestOption].totalPayable)} with {formatCurrency(comparison[bestOption].emi)}/month EMI
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
