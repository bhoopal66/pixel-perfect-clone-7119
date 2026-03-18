import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { ComfiEvaluationResult } from '@/services/comfiPolicyService';

interface FinalDecisionCardProps {
  result: ComfiEvaluationResult | null;
  overrideStatus?: string | null;
}

export function FinalDecisionCard({ result, overrideStatus }: FinalDecisionCardProps) {
  const isRejected = result?.application_status === 'Rejected';
  const isEligible = result?.application_status.includes('Eligible');

  const borderClass = result
    ? isRejected ? 'border-destructive' : isEligible ? 'border-emerald-300 dark:border-emerald-700' : 'border-amber-300'
    : '';

  return (
    <Card className={borderClass}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Final Decision</CardTitle>
      </CardHeader>
      <CardContent>
        {!result ? (
          <p className="text-sm text-muted-foreground">Run the eligibility check to see results.</p>
        ) : (
          <div className="space-y-4">
            {/* Status indicator */}
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isRejected ? 'bg-destructive' : isEligible ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <Badge variant={isRejected ? 'destructive' : isEligible ? 'default' : 'secondary'} className="text-sm">
                {overrideStatus || result.application_status}
              </Badge>
            </div>

            {overrideStatus && (
              <div className="text-xs px-2 py-1 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                Original: {result.application_status} → Overridden to: {overrideStatus}
              </div>
            )}

            <Separator />

            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Final Recommendation</p>
                <p className="text-sm font-semibold text-foreground">{result.final_recommendation}</p>
              </div>

              {result.reject_reason && (
                <div>
                  <p className="text-xs text-muted-foreground">Reject Reason</p>
                  <p className="text-sm font-semibold text-destructive">{result.reject_reason}</p>
                </div>
              )}

              <Separator />

              <div>
                <p className="text-xs text-muted-foreground">Adjusted Turnover</p>
                <p className="text-lg font-bold text-foreground">AED {result.adjusted_turnover.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Eligible Sales</p>
                <p className="text-lg font-bold text-foreground">AED {result.eligible_sales.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Indicative Eligible Finance (60%)</p>
                <p className="text-2xl font-bold text-primary">AED {result.eligible_finance.toLocaleString()}</p>
              </div>

              <Separator />

              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Requires Manual Credit Review</span>
                <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-200 dark:text-amber-400 dark:border-amber-800">Yes</Badge>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
