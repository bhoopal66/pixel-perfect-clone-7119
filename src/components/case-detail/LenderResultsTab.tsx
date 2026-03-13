import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Shield, CheckCircle2, XCircle, AlertTriangle, MinusCircle } from 'lucide-react';
import { format } from 'date-fns';

interface Props {
  caseId: string;
}

export const LenderResultsTab: React.FC<Props> = ({ caseId }) => {
  const { data: executions, isLoading } = useQuery({
    queryKey: ['lender-executions', caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lender_execution_results')
        .select('*')
        .eq('case_id', caseId)
        .order('executed_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: ruleDetails } = useQuery({
    queryKey: ['lender-rule-details', caseId],
    queryFn: async () => {
      if (!executions?.length) return [];
      const executionIds = executions.map((e: any) => e.id);
      const { data, error } = await supabase
        .from('lender_rule_result_details')
        .select('*')
        .in('execution_id', executionIds)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!executions?.length,
  });

  const statusConfig: Record<string, { icon: React.ReactNode; color: string }> = {
    eligible: { icon: <CheckCircle2 className="h-4 w-4" />, color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' },
    conditionally_eligible: { icon: <AlertTriangle className="h-4 w-4" />, color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' },
    review_required: { icon: <AlertTriangle className="h-4 w-4" />, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
    not_eligible: { icon: <XCircle className="h-4 w-4" />, color: 'bg-destructive/10 text-destructive' },
    pending: { icon: <MinusCircle className="h-4 w-4" />, color: 'bg-muted text-muted-foreground' },
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  // Group by active vs historical
  const activeRuns = executions?.filter((e: any) => e.is_active) || [];
  const historicalRuns = executions?.filter((e: any) => !e.is_active) || [];

  const getRulesForExecution = (execId: string) =>
    (ruleDetails || []).filter((r: any) => r.execution_id === execId);

  const renderExecution = (exec: any) => {
    const config = statusConfig[exec.eligibility_status] || statusConfig.pending;
    const rules = getRulesForExecution(exec.id);

    return (
      <AccordionItem key={exec.id} value={exec.id}>
        <AccordionTrigger className="hover:no-underline px-4">
          <div className="flex items-center gap-3 w-full">
            <div className="flex items-center gap-2 flex-1">
              {config.icon}
              <span className="font-medium text-sm">{exec.decision_summary || 'Lender Run'}</span>
            </div>
            <Badge className={config.color}>{exec.eligibility_status.replace(/_/g, ' ')}</Badge>
            <span className="text-xs text-muted-foreground">
              {exec.recommended_limit ? `AED ${exec.recommended_limit.toLocaleString()}` : '—'}
            </span>
            <span className="text-xs text-muted-foreground">
              {format(new Date(exec.executed_at), 'dd MMM yyyy HH:mm')}
            </span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4">
          <div className="grid grid-cols-4 gap-3 mb-4">
            <div className="p-2 rounded bg-muted/50 text-center">
              <p className="text-[10px] text-muted-foreground">Score</p>
              <p className="font-bold">{exec.score || 0}</p>
            </div>
            <div className="p-2 rounded bg-muted/50 text-center">
              <p className="text-[10px] text-muted-foreground">Major Fails</p>
              <p className="font-bold text-destructive">{exec.major_fail_count || 0}</p>
            </div>
            <div className="p-2 rounded bg-muted/50 text-center">
              <p className="text-[10px] text-muted-foreground">Minor Fails</p>
              <p className="font-bold text-amber-600">{exec.minor_fail_count || 0}</p>
            </div>
            <div className="p-2 rounded bg-muted/50 text-center">
              <p className="text-[10px] text-muted-foreground">Limit</p>
              <p className="font-bold text-primary">{exec.recommended_limit ? `AED ${exec.recommended_limit.toLocaleString()}` : '—'}</p>
            </div>
          </div>

          {rules.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Rule</TableHead>
                  <TableHead className="text-xs">Field</TableHead>
                  <TableHead className="text-xs">Observed</TableHead>
                  <TableHead className="text-xs">Threshold</TableHead>
                  <TableHead className="text-xs">Result</TableHead>
                  <TableHead className="text-xs">Impact</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule: any) => (
                  <TableRow key={rule.id}>
                    <TableCell className="text-xs font-medium">{(rule as any).rule_name || rule.rule_code || '—'}</TableCell>
                    <TableCell className="text-xs">{rule.field_name || '—'}</TableCell>
                    <TableCell className="text-xs">{rule.observed_value || '—'}</TableCell>
                    <TableCell className="text-xs">{rule.threshold_value || '—'}</TableCell>
                    <TableCell>
                      <Badge variant={rule.pass_fail_status === 'pass' ? 'default' : 'destructive'} className="text-[10px]">
                        {rule.pass_fail_status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{rule.impact_type || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </AccordionContent>
      </AccordionItem>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" />Current Lender Results</CardTitle>
          <CardDescription>{activeRuns.length} active lender evaluations</CardDescription>
        </CardHeader>
        <CardContent>
          {!activeRuns.length ? (
            <p className="text-sm text-muted-foreground text-center py-8">No lender results yet. Run the lender engine to generate results.</p>
          ) : (
            <Accordion type="multiple" className="w-full">
              {activeRuns.map(renderExecution)}
            </Accordion>
          )}
        </CardContent>
      </Card>

      {historicalRuns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Historical Runs</CardTitle>
            <CardDescription>{historicalRuns.length} prior evaluations</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="w-full">
              {historicalRuns.map(renderExecution)}
            </Accordion>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
