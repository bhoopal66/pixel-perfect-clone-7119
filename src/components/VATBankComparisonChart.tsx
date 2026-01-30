import React from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  LabelList
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { AlertTriangle, CheckCircle, TrendingDown, TrendingUp, BarChart3, Scale } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CurrencyService, type CurrencyCode } from '@/services/currencyService';

interface VATBankComparisonChartProps {
  vatTurnover: number;
  bankCredits: number; // Declared turnover (total bank credits)
  adjustedTurnover: number;
  variancePercent: number;
  currency?: CurrencyCode;
}

export const VATBankComparisonChart: React.FC<VATBankComparisonChartProps> = ({
  vatTurnover,
  bankCredits,
  adjustedTurnover,
  variancePercent,
  currency = 'AED'
}) => {
  const formatCurrency = (value: number) => CurrencyService.format(value, currency);
  const formatCompact = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return value.toFixed(0);
  };

  // Calculate the difference
  const difference = Math.abs(vatTurnover - adjustedTurnover);
  const isVATHigher = vatTurnover > adjustedTurnover;
  const varianceStatus = variancePercent <= 10 
    ? 'good' 
    : variancePercent <= 25 
      ? 'warning' 
      : 'critical';

  // Data for the comparison chart
  const comparisonData = [
    {
      name: 'VAT Sales',
      value: vatTurnover,
      fill: 'hsl(var(--primary))',
      description: 'Declared VAT turnover from FTA returns'
    },
    {
      name: 'Bank Credits',
      value: bankCredits,
      fill: 'hsl(var(--muted-foreground))',
      description: 'Total credits from bank statements'
    },
    {
      name: 'Adjusted Turnover',
      value: adjustedTurnover,
      fill: 'hsl(var(--success))',
      description: 'Bank credits minus exclusions'
    }
  ];

  // Data for the variance visualization
  const varianceData = [
    { name: 'VAT', value: vatTurnover, type: 'vat' },
    { name: 'Bank', value: adjustedTurnover, type: 'bank' }
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const data = payload[0].payload;
    return (
      <div className="bg-card border border-border rounded-lg shadow-lg p-3 text-sm">
        <p className="font-semibold text-foreground mb-1">{data.name}</p>
        <p className="text-lg font-mono font-bold text-primary">
          {formatCurrency(data.value)}
        </p>
        {data.description && (
          <p className="text-xs text-muted-foreground mt-1">{data.description}</p>
        )}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Scale className="h-5 w-5 text-primary" />
                VAT vs Bank Turnover Comparison
              </CardTitle>
              <CardDescription>
                Variance analysis between declared VAT and bank statement credits
              </CardDescription>
            </div>
            <Badge 
              variant="outline" 
              className={cn(
                "gap-1",
                varianceStatus === 'good' 
                  ? "text-success border-success/30 bg-success/10" 
                  : varianceStatus === 'warning'
                    ? "text-warning border-warning/30 bg-warning/10"
                    : "text-destructive border-destructive/30 bg-destructive/10"
              )}
            >
              {varianceStatus === 'good' ? (
                <CheckCircle className="h-3 w-3" />
              ) : varianceStatus === 'warning' ? (
                <AlertTriangle className="h-3 w-3" />
              ) : (
                <AlertTriangle className="h-3 w-3" />
              )}
              {variancePercent.toFixed(1)}% Variance
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Main Comparison Chart */}
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={comparisonData} 
                layout="vertical"
                margin={{ top: 10, right: 80, left: 100, bottom: 10 }}
                barSize={32}
              >
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="hsl(var(--border))" 
                  horizontal={false}
                />
                <XAxis 
                  type="number"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatCompact}
                />
                <YAxis 
                  type="category"
                  dataKey="name"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  width={90}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted) / 0.3)' }} />
                <Bar 
                  dataKey="value" 
                  radius={[0, 4, 4, 0]}
                >
                  {comparisonData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                  <LabelList 
                    dataKey="value" 
                    position="right" 
                    formatter={formatCompact}
                    fill="hsl(var(--foreground))"
                    fontSize={12}
                    fontWeight={600}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Variance Indicator */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
            <div className="text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">VAT Sales</p>
              <p className="font-mono font-bold text-lg text-primary">{formatCompact(vatTurnover)}</p>
            </div>
            <div className="text-center border-x border-border">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Variance</p>
              <div className="flex items-center justify-center gap-1">
                {isVATHigher ? (
                  <TrendingUp className={cn(
                    "h-4 w-4",
                    varianceStatus === 'good' ? "text-success" : varianceStatus === 'warning' ? "text-warning" : "text-destructive"
                  )} />
                ) : (
                  <TrendingDown className={cn(
                    "h-4 w-4",
                    varianceStatus === 'good' ? "text-success" : varianceStatus === 'warning' ? "text-warning" : "text-destructive"
                  )} />
                )}
                <span className={cn(
                  "font-mono font-bold text-lg",
                  varianceStatus === 'good' ? "text-success" : varianceStatus === 'warning' ? "text-warning" : "text-destructive"
                )}>
                  {variancePercent.toFixed(1)}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatCompact(difference)} {isVATHigher ? 'over' : 'under'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Adjusted Bank</p>
              <p className="font-mono font-bold text-lg text-success">{formatCompact(adjustedTurnover)}</p>
            </div>
          </div>

          {/* Variance Scale Visualization */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span>10%</span>
              <span>25%</span>
              <span>50%+</span>
            </div>
            <div className="h-3 w-full bg-gradient-to-r from-success via-warning to-destructive rounded-full relative overflow-hidden">
              {/* Marker for current variance */}
              <motion.div
                initial={{ left: 0 }}
                animate={{ left: `${Math.min(variancePercent * 2, 100)}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="absolute top-0 h-full w-1 bg-foreground rounded-full"
                style={{ transform: 'translateX(-50%)' }}
              />
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-success font-medium">Good</span>
              <span className="text-warning font-medium">Caution</span>
              <span className="text-destructive font-medium">High Risk</span>
            </div>
          </div>

          {/* Interpretation Note */}
          <div className={cn(
            "p-3 rounded-lg border text-sm",
            varianceStatus === 'good' 
              ? "bg-success/10 border-success/30 text-success-foreground" 
              : varianceStatus === 'warning'
                ? "bg-warning/10 border-warning/30 text-warning-foreground"
                : "bg-destructive/10 border-destructive/30 text-destructive-foreground"
          )}>
            <p className="flex items-start gap-2">
              {varianceStatus === 'good' ? (
                <>
                  <CheckCircle className="h-4 w-4 mt-0.5 shrink-0 text-success" />
                  <span><strong>Low Variance:</strong> VAT and bank turnover are well-aligned, indicating consistent revenue reporting.</span>
                </>
              ) : varianceStatus === 'warning' ? (
                <>
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-warning" />
                  <span><strong>Moderate Variance:</strong> Some discrepancy between VAT and bank records. May require explanation for loan eligibility.</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-destructive" />
                  <span><strong>High Variance:</strong> Significant gap between declared VAT and bank credits. This may trigger Reverse method for RAK POS or reduce eligibility multiplier.</span>
                </>
              )}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
