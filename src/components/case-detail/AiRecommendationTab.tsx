import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, Star, AlertTriangle, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

interface Props {
  caseId: string;
}

export const AiRecommendationTab: React.FC<Props> = ({ caseId }) => {
  const { data: decisions, isLoading } = useQuery({
    queryKey: ['ai-decisions', caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_credit_decision_results')
        .select('*')
        .eq('case_id', caseId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  if (isLoading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  const latest = decisions?.[0];
  const history = decisions?.slice(1) || [];

  const ratingColor = (rating: string | null) => {
    if (!rating) return 'bg-muted text-muted-foreground';
    const r = rating.toLowerCase();
    if (r.includes('a')) return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
    if (r.includes('b')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    if (r.includes('c')) return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
    return 'bg-destructive/10 text-destructive';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Brain className="h-5 w-5" />AI Credit Decision</CardTitle>
          <CardDescription>
            {latest ? `Generated ${format(new Date(latest.created_at), 'dd MMM yyyy HH:mm')}` : 'No AI recommendation available'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!latest ? (
            <p className="text-sm text-muted-foreground text-center py-8">No AI credit decision has been generated for this case yet.</p>
          ) : (
            <div className="space-y-6">
              {/* Score & Rating */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 text-center">
                  <p className="text-xs text-muted-foreground">Taamul Score</p>
                  <p className="text-3xl font-bold text-primary mt-1">{latest.taamul_credit_score || 0}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 text-center">
                  <p className="text-xs text-muted-foreground">Credit Rating</p>
                  <Badge className={`mt-2 text-lg px-3 py-1 ${ratingColor(latest.credit_rating)}`}>
                    {latest.credit_rating || 'N/A'}
                  </Badge>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 text-center">
                  <p className="text-xs text-muted-foreground">Recommended Limit</p>
                  <p className="text-lg font-bold mt-1">AED {(latest.recommended_limit || 0).toLocaleString()}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 text-center">
                  <p className="text-xs text-muted-foreground">Approval Probability</p>
                  <p className="text-lg font-bold mt-1">{((latest.approval_probability || 0) * 100).toFixed(0)}%</p>
                </div>
              </div>

              {/* Strengths */}
              {(latest.key_strengths_json as any[])?.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Star className="h-3 w-3" /> Key Strengths
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {(latest.key_strengths_json as any[]).map((s: string, i: number) => (
                      <Badge key={i} variant="outline" className="text-xs bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-300">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Risk Flags */}
              {(latest.risk_flags_json as any[])?.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> Risk Flags
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {(latest.risk_flags_json as any[]).map((f: string, i: number) => (
                      <Badge key={i} variant="outline" className="text-xs border-amber-200 text-amber-700 dark:border-amber-800 dark:text-amber-300">
                        {f}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Decision Notes */}
              {latest.decision_notes && (
                <div className="p-3 rounded-lg bg-muted/30 border">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Decision Notes</p>
                  <p className="text-sm">{latest.decision_notes}</p>
                </div>
              )}

              {latest.model_version && (
                <p className="text-xs text-muted-foreground">Model: {latest.model_version}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* History */}
      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4" />Score History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {history.map((d: any) => (
                <div key={d.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-primary">{d.taamul_credit_score || 0}</span>
                    <Badge className={ratingColor(d.credit_rating)}>{d.credit_rating || 'N/A'}</Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{format(new Date(d.created_at), 'dd MMM yyyy HH:mm')}</p>
                    <p className="text-xs">AED {(d.recommended_limit || 0).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
