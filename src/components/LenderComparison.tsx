import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calculator, TrendingDown, Percent, Clock, DollarSign, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';
import { LENDERS, calculateEMI, calculateTotalInterest, calculateProcessingFee, type LenderType } from '../types/loanCase.types';
import { CurrencyService } from '../services/currencyService';

interface LenderComparisonProps {
  currency?: 'AED' | 'USD';
}

export const LenderComparison: React.FC<LenderComparisonProps> = ({ currency = 'AED' }) => {
  const [loanAmount, setLoanAmount] = useState(100000);
  const [tenure, setTenure] = useState(24);
  const [salary, setSalary] = useState(15000);

  const formatCurrency = (value: number) => CurrencyService.format(value, currency);

  const comparison = useMemo(() => {
    const results: Record<LenderType, {
      eligible: boolean;
      eligibilityIssues: string[];
      emi: number;
      totalInterest: number;
      totalPayable: number;
      processingFee: number;
      effectiveRate: number;
    }> = {} as any;

    (Object.keys(LENDERS) as LenderType[]).forEach(lenderId => {
      const lender = LENDERS[lenderId];
      const eligibilityIssues: string[] = [];

      // Check eligibility
      if (salary < lender.eligibility.minSalary) {
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

  // Find best option
  const bestOption = useMemo(() => {
    const eligible = (Object.entries(comparison) as [LenderType, typeof comparison.RAK][])
      .filter(([_, data]) => data.eligible);
    if (eligible.length === 0) return null;
    return eligible.reduce((best, current) => 
      current[1].totalPayable < best[1].totalPayable ? current : best
    )[0];
  }, [comparison]);

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

      {/* Lender Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {(Object.keys(LENDERS) as LenderType[]).map((lenderId) => {
          const lender = LENDERS[lenderId];
          const data = comparison[lenderId];
          const isBest = lenderId === bestOption;

          return (
            <motion.div
              key={lenderId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className={cn(
                "relative overflow-hidden",
                isBest && "ring-2 ring-primary",
                !data.eligible && "opacity-75"
              )}>
                {isBest && (
                  <div className="absolute top-0 right-0 px-3 py-1 bg-primary text-primary-foreground text-xs font-medium">
                    Best Option
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{lender.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {lender.interestRate}% p.a.
                      </p>
                    </div>
                    {data.eligible ? (
                      <Badge className="bg-success/20 text-success gap-1">
                        <CheckCircle className="h-3 w-3" /> Eligible
                      </Badge>
                    ) : (
                      <Badge className="bg-destructive/20 text-destructive gap-1">
                        <XCircle className="h-3 w-3" /> Not Eligible
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Eligibility Issues */}
                  {data.eligibilityIssues.length > 0 && (
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                      <p className="text-xs font-medium text-destructive mb-1">Eligibility Issues:</p>
                      <ul className="text-xs text-destructive/80 space-y-0.5">
                        {data.eligibilityIssues.map((issue, i) => (
                          <li key={i}>• {issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* EMI & Costs */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">Monthly EMI</p>
                      <p className="text-xl font-bold text-foreground">
                        {formatCurrency(data.emi)}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">Total Interest</p>
                      <p className="text-lg font-semibold text-destructive">
                        {formatCurrency(data.totalInterest)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">Processing Fee</p>
                      <p className="text-sm font-medium">
                        {formatCurrency(data.processingFee)}
                        <span className="text-xs text-muted-foreground ml-1">
                          ({lender.processingFee}%)
                        </span>
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-primary/10">
                      <p className="text-xs text-muted-foreground mb-1">Total Payable</p>
                      <p className="text-lg font-bold text-primary">
                        {formatCurrency(data.totalPayable)}
                      </p>
                    </div>
                  </div>

                  {/* Lender Details */}
                  <div className="pt-3 border-t">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Lender Terms</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Min Amount:</span>
                        <span>{formatCurrency(lender.minAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Max Amount:</span>
                        <span>{formatCurrency(lender.maxAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Min Salary:</span>
                        <span>{formatCurrency(lender.eligibility.minSalary)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tenure:</span>
                        <span>{lender.minTenure}-{lender.maxTenure} mo</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Savings Comparison */}
      {bestOption && comparison.RAK.eligible && comparison.WIO.eligible && (
        <Card className="bg-success/5 border-success/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <TrendingDown className="h-10 w-10 text-success" />
              <div>
                <p className="text-lg font-semibold text-foreground">
                  Choose {LENDERS[bestOption].name} to save{' '}
                  <span className="text-success">
                    {formatCurrency(Math.abs(comparison.RAK.totalPayable - comparison.WIO.totalPayable))}
                  </span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Lower EMI by {formatCurrency(Math.abs(comparison.RAK.emi - comparison.WIO.emi))}/month
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
