import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Receipt, TrendingUp, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CurrencyService } from '@/services/currencyService';
import type { VatPeriodAnalysis, ParsedVatFile } from '@/types/assessment.types';

interface VATAnalysisProps {
  vatAnalysis: VatPeriodAnalysis[];
  vatFiles: ParsedVatFile[];
}

const fmt = (v: number) => CurrencyService.format(v, 'AED');
const fmtShort = (v: number) => {
  if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `${(v / 1000).toFixed(0)}K`;
  return v.toFixed(0);
};

export const VATAnalysis: React.FC<VATAnalysisProps> = ({ vatAnalysis, vatFiles }) => {
  if (vatFiles.length === 0) {
    return (
      <Card className="border-warning/30">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-warning mb-4" />
            <h3 className="text-lg font-semibold mb-2">No VAT Returns Uploaded</h3>
            <p className="text-muted-foreground max-w-md">
              The assessment will proceed with bank-only analysis. 
              VAT returns help validate turnover and improve lender eligibility.
            </p>
            <Badge variant="outline" className="mt-4 border-warning text-warning">
              VAT not provided
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalSales = vatAnalysis.reduce((s, v) => s + v.vatSales, 0);
  const totalOutputVat = vatAnalysis.reduce((s, v) => s + v.outputVat, 0);
  const totalInputVat = vatAnalysis.reduce((s, v) => s + v.inputVat, 0);
  const avgEffRate = vatAnalysis.length > 0
    ? vatAnalysis.reduce((s, v) => s + v.effectiveVatRate, 0) / vatAnalysis.length
    : 0;
  const avgMonthlySales = vatAnalysis.length > 0
    ? vatAnalysis.reduce((s, v) => s + v.monthlyAvgSales, 0) / vatAnalysis.length
    : 0;

  const chartData = vatAnalysis.map((v, idx) => ({
    name: `Period ${idx + 1}`,
    Sales: v.vatSales,
    'Output VAT': v.outputVat,
  }));

  // Check for sales trend
  const salesValues = vatAnalysis.map(v => v.vatSales);
  const isGrowing = salesValues.length >= 2 && salesValues[salesValues.length - 1] > salesValues[0];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium text-muted-foreground mb-1">Total VAT Sales</p>
            <p className="text-xl font-bold">{fmt(totalSales)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium text-muted-foreground mb-1">Avg Monthly Sales</p>
            <p className="text-xl font-bold">{fmt(avgMonthlySales)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium text-muted-foreground mb-1">Avg Effective VAT Rate</p>
            <p className="text-xl font-bold">{avgEffRate.toFixed(2)}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium text-muted-foreground mb-1">Sales Trend</p>
            <div className="flex items-center gap-2">
              <TrendingUp className={`h-5 w-5 ${isGrowing ? 'text-success' : 'text-destructive'}`} />
              <Badge variant={isGrowing ? 'default' : 'destructive'}>
                {isGrowing ? 'Growing' : 'Declining'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Receipt className="h-5 w-5 text-accent" />
              Quarterly Sales Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis tickFormatter={fmtShort} className="text-xs" />
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Bar dataKey="Sales" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Period Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">VAT Period Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead className="text-right">Taxable Sales</TableHead>
                <TableHead className="text-right">Zero-Rated</TableHead>
                <TableHead className="text-right">Exempt</TableHead>
                <TableHead className="text-right">Output VAT</TableHead>
                <TableHead className="text-right">Input VAT</TableHead>
                <TableHead className="text-right">Net VAT</TableHead>
                <TableHead className="text-right">Eff. Rate</TableHead>
                <TableHead className="text-right">Monthly Avg</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vatAnalysis.map((v, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium text-sm">{v.periodLabel}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{fmt(v.taxableSupplies)}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{fmt(v.zeroRatedSupplies)}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{fmt(v.exemptSupplies)}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{fmt(v.outputVat)}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{fmt(v.inputVat)}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{fmt(v.netVatPayable)}</TableCell>
                  <TableCell className="text-right">{v.effectiveVatRate}%</TableCell>
                  <TableCell className="text-right font-mono text-sm">{fmt(v.monthlyAvgSales)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
