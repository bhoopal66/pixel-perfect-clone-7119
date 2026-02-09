import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Receipt, 
  Calculator,
  FileCheck,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { cn } from '@/lib/utils';
import type { VATReturn } from '../types/turnover.types';
import type { CurrencyCode } from '../services/currencyService';
import { CurrencyService } from '../services/currencyService';

interface VATStatisticsSectionProps {
  vatReturns: VATReturn[];
  currency?: CurrencyCode;
}

export const VATStatisticsSection: React.FC<VATStatisticsSectionProps> = ({
  vatReturns,
  currency = 'AED'
}) => {
  const formatCurrency = (value: number) => CurrencyService.format(value, currency);
  
  // Calculate all statistics
  const totalOutputVAT = vatReturns.reduce((sum, r) => sum + r.outputVAT, 0);
  const totalInputVAT = vatReturns.reduce((sum, r) => sum + r.inputVAT, 0);
  const netVAT = totalOutputVAT - totalInputVAT;
  const totalTaxableSales = vatReturns.reduce((sum, r) => sum + r.taxableSales, 0);
  const totalZeroRatedSales = vatReturns.reduce((sum, r) => sum + r.zeroRatedSales, 0);
  const totalExemptSales = vatReturns.reduce((sum, r) => sum + r.exemptSales, 0);
  const totalSales = totalTaxableSales + totalZeroRatedSales + totalExemptSales;
  
  // Calculate averages
  const avgOutputVAT = vatReturns.length > 0 ? totalOutputVAT / vatReturns.length : 0;
  const avgInputVAT = vatReturns.length > 0 ? totalInputVAT / vatReturns.length : 0;
  
  // Calculate effective VAT rate
  const effectiveVATRate = totalTaxableSales > 0 ? (totalOutputVAT / totalTaxableSales) * 100 : 0;
  
  // Status breakdown
  const approvedCount = vatReturns.filter(r => r.status === 'approved').length;
  const pendingCount = vatReturns.filter(r => r.status === 'pending').length;
  const submittedCount = vatReturns.filter(r => r.status === 'submitted').length;

  if (vatReturns.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Receipt className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">VAT Statistics Summary</h3>
          <p className="text-sm text-muted-foreground">
            Analysis of {vatReturns.length} VAT return{vatReturns.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Primary Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-destructive/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <ArrowUpRight className="h-4 w-4 text-destructive" />
              <p className="text-sm font-medium text-muted-foreground">Output VAT</p>
            </div>
            <p className="text-2xl font-bold text-destructive">{formatCurrency(totalOutputVAT)}</p>
            <p className="text-xs text-muted-foreground mt-1">VAT collected on sales</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-success/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <ArrowDownRight className="h-4 w-4 text-success" />
              <p className="text-sm font-medium text-muted-foreground">Input VAT</p>
            </div>
            <p className="text-2xl font-bold text-success">{formatCurrency(totalInputVAT)}</p>
            <p className="text-xs text-muted-foreground mt-1">VAT paid on purchases</p>
          </CardContent>
        </Card>

        <Card className={cn(
          "relative overflow-hidden",
          netVAT >= 0 ? 'border-destructive/30' : 'border-success/30'
        )}>
          <div className={cn(
            "absolute top-0 right-0 w-20 h-20 rounded-full -translate-y-1/2 translate-x-1/2",
            netVAT >= 0 ? "bg-destructive/5" : "bg-success/5"
          )} />
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="h-4 w-4 text-foreground" />
              <p className="text-sm font-medium text-muted-foreground">Net VAT</p>
            </div>
            <p className={cn("text-2xl font-bold", netVAT >= 0 ? 'text-destructive' : 'text-success')}>
              {formatCurrency(Math.abs(netVAT))}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {netVAT >= 0 ? 'Payable to FTA' : 'Refundable from FTA'}
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <FileCheck className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium text-muted-foreground">Returns Filed</p>
            </div>
            <p className="text-2xl font-bold text-foreground">{vatReturns.length}</p>
            <p className="text-xs text-muted-foreground mt-1">periods covered</p>
          </CardContent>
        </Card>
      </div>

      {/* Sales Breakdown Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Sales Type Breakdown */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Sales Breakdown
            </CardTitle>
            <CardDescription>Distribution by VAT category</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Taxable Sales */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Taxable Sales (5%)</span>
                <span className="text-sm font-bold">{formatCurrency(totalTaxableSales)}</span>
              </div>
              <Progress 
                value={totalSales > 0 ? (totalTaxableSales / totalSales) * 100 : 0} 
                className="h-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {totalSales > 0 ? ((totalTaxableSales / totalSales) * 100).toFixed(1) : 0}% of total sales
              </p>
            </div>

            {/* Zero-Rated Sales */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Zero-Rated Sales</span>
                <span className="text-sm font-bold">{formatCurrency(totalZeroRatedSales)}</span>
              </div>
              <Progress 
                value={totalSales > 0 ? (totalZeroRatedSales / totalSales) * 100 : 0} 
                className="h-2 [&>div]:bg-accent"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {totalSales > 0 ? ((totalZeroRatedSales / totalSales) * 100).toFixed(1) : 0}% of total sales
              </p>
            </div>

            {/* Exempt Sales */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Exempt Sales</span>
                <span className="text-sm font-bold">{formatCurrency(totalExemptSales)}</span>
              </div>
              <Progress 
                value={totalSales > 0 ? (totalExemptSales / totalSales) * 100 : 0} 
                className="h-2 [&>div]:bg-muted-foreground"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {totalSales > 0 ? ((totalExemptSales / totalSales) * 100).toFixed(1) : 0}% of total sales
              </p>
            </div>

            {/* Total */}
            <div className="pt-3 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Total Sales</span>
                <span className="text-lg font-bold">{formatCurrency(totalSales)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* VAT Analysis */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calculator className="h-4 w-4 text-primary" />
              VAT Analysis
            </CardTitle>
            <CardDescription>Key metrics and rates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Effective VAT Rate */}
            <div className="p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Effective VAT Rate</span>
                <Badge variant="outline" className="font-mono">
                  {effectiveVATRate.toFixed(2)}%
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Calculated as Output VAT / Taxable Sales
              </p>
            </div>

            {/* Average per Period */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-destructive/5 rounded-lg border border-destructive/20">
                <p className="text-xs text-muted-foreground mb-1">Avg Output VAT</p>
                <p className="font-semibold text-destructive">{formatCurrency(avgOutputVAT)}</p>
                <p className="text-xs text-muted-foreground">per period</p>
              </div>
              <div className="p-3 bg-success/5 rounded-lg border border-success/20">
                <p className="text-xs text-muted-foreground mb-1">Avg Input VAT</p>
                <p className="font-semibold text-success">{formatCurrency(avgInputVAT)}</p>
                <p className="text-xs text-muted-foreground">per period</p>
              </div>
            </div>

            {/* Filing Status */}
            <div className="pt-3 border-t">
              <p className="text-sm font-medium mb-3">Filing Status</p>
              <div className="flex items-center gap-2 flex-wrap">
                {approvedCount > 0 && (
                  <Badge className="bg-success/20 text-success border-success/30 gap-1">
                    <FileCheck className="h-3 w-3" />
                    {approvedCount} Approved
                  </Badge>
                )}
                {submittedCount > 0 && (
                  <Badge className="bg-primary/20 text-primary border-primary/30 gap-1">
                    {submittedCount} Submitted
                  </Badge>
                )}
                {pendingCount > 0 && (
                  <Badge className="bg-warning/20 text-warning border-warning/30 gap-1">
                    {pendingCount} Pending
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};
