import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface CalculatedMetricsCardProps {
  grossTurnover: number;
  vatComponent: number;
  turnoverExcludesVat: boolean;
  averageSales: number;
  currentPayments: number;
  outwardChequeReturns: number;
}

export function CalculatedMetricsCard({
  grossTurnover, vatComponent, turnoverExcludesVat,
  averageSales, currentPayments, outwardChequeReturns
}: CalculatedMetricsCardProps) {
  const adjustedTurnover = turnoverExcludesVat ? grossTurnover : grossTurnover - vatComponent;
  const eligibleSales = averageSales - currentPayments;
  const eligibleFinance = adjustedTurnover * 0.60;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Auto-Calculated Fields</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Adjusted Turnover</span>
            <span className="font-medium text-foreground font-mono">AED {adjustedTurnover.toLocaleString()}</span>
          </div>
          <p className="text-[10px] text-muted-foreground -mt-1">
            {turnoverExcludesVat ? 'Turnover treated as net of VAT' : `= Gross Turnover − VAT Component`}
          </p>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Eligible Sales</span>
            <span className="font-medium text-foreground font-mono">AED {eligibleSales.toLocaleString()}</span>
          </div>
          <p className="text-[10px] text-muted-foreground -mt-1">= Average Sales − Current Payments</p>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Eligible Finance (60%)</span>
            <span className="font-bold text-primary font-mono">AED {eligibleFinance.toLocaleString()}</span>
          </div>
          <p className="text-[10px] text-muted-foreground -mt-1">= Adjusted Turnover × 60%</p>
        </CardContent>
      </Card>

      {outwardChequeReturns > 3 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Hard Decline Warning</AlertTitle>
          <AlertDescription>
            Outward cheque returns ({outwardChequeReturns}) exceed maximum of 3. Application will be rejected.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
