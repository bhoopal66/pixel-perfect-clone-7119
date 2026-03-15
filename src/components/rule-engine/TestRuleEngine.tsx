import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { RuleEngineExecutor } from '@/services/ruleEngineExecutor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Play, CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getDisplayError } from '@/utils/errorHandler';
import { NORMALIZED_FIELDS, DECISION_STATUSES } from '@/types/ruleEngine.types';

interface Props {
  lenderId: string;
  productId: string;
  ruleSetId: string;
}

export const TestRuleEngine = ({ lenderId, productId, ruleSetId }: Props) => {
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [result, setResult] = useState<any>(null);

  const { data: cases } = useQuery({
    queryKey: ['assessment-cases-list'],
    queryFn: async () => {
      const { data } = await supabase.from('assessment_cases').select('id, case_number, company_name, status').order('created_at', { ascending: false }).limit(50);
      return data || [];
    },
  });

  const executeMut = useMutation({
    mutationFn: () => RuleEngineExecutor.executeForTest(selectedCaseId, lenderId, productId, ruleSetId),
    onSuccess: (data) => { setResult(data); toast.success('Test execution complete'); },
    onError: (e: any) => toast.error(e.message),
  });

  const canRun = selectedCaseId && lenderId && productId && ruleSetId;
  const statusConfig = (s: string) => DECISION_STATUSES.find(d => d.value === s);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Test Rule Engine</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-foreground mb-1.5 block">Select Case</label>
              <Select value={selectedCaseId} onValueChange={setSelectedCaseId}>
                <SelectTrigger><SelectValue placeholder="Choose an assessment case" /></SelectTrigger>
                <SelectContent>
                  {cases?.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.case_number || 'Draft'} — {c.company_name || 'Unnamed'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => executeMut.mutate()} disabled={!canRun || executeMut.isPending}>
              {executeMut.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Play className="h-4 w-4 mr-1" />}
              Run Test
            </Button>
          </div>
          {!lenderId && <p className="text-sm text-amber-600 mt-2">Select a lender, product, and rule set from the context selectors above.</p>}
        </CardContent>
      </Card>

      {result && (
        <>
          {/* Summary */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Execution Result</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Decision</p>
                  <Badge className={`${statusConfig(result.execution.eligibility_status)?.color || 'bg-muted'} text-white`}>
                    {statusConfig(result.execution.eligibility_status)?.label || result.execution.eligibility_status}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Recommended Limit</p>
                  <p className="text-xl font-bold text-foreground">AED {result.execution.recommended_limit?.toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Score</p>
                  <p className="text-xl font-bold text-foreground">{result.execution.score}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Tenure</p>
                  <p className="text-xl font-bold text-foreground">{result.execution.recommended_tenure} months</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Major Failures</p>
                  <p className="text-lg font-semibold text-destructive">{result.execution.major_fail_count}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Minor Failures</p>
                  <p className="text-lg font-semibold text-amber-600">{result.execution.minor_fail_count}</p>
                </div>
              </div>
              {result.execution.risk_flags?.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-foreground mb-2">Risk Flags</p>
                  <div className="flex flex-wrap gap-2">
                    {result.execution.risk_flags.map((f: string, i: number) => (
                      <Badge key={i} variant="outline" className="text-amber-600 border-amber-300">{f}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {result.execution.decision_summary && (
                <p className="text-sm text-muted-foreground mt-3 italic">{result.execution.decision_summary}</p>
              )}
            </CardContent>
          </Card>

          {/* Normalized Data */}
          <Accordion type="single" collapsible>
            <AccordionItem value="normalized">
              <AccordionTrigger className="px-4">Normalized Financial Data</AccordionTrigger>
              <AccordionContent className="px-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(result.normalizedData || {}).map(([key, value]) => {
                    const field = NORMALIZED_FIELDS.find(f => f.key === key);
                    return (
                      <div key={key} className="p-2 rounded border bg-muted/30">
                        <p className="text-xs text-muted-foreground">{field?.label || key}</p>
                        <p className="text-sm font-medium text-foreground">
                          {typeof value === 'boolean' ? (value ? 'Yes' : 'No') :
                           field?.type === 'currency' ? `AED ${Number(value).toLocaleString()}` :
                           field?.type === 'percentage' ? `${value}%` : String(value)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Rule Details */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Rule-by-Rule Results</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow>
                  <TableHead className="w-10" /><TableHead>Code</TableHead><TableHead>Field</TableHead>
                  <TableHead>Observed</TableHead><TableHead>Operator</TableHead><TableHead>Threshold</TableHead>
                  <TableHead>Impact</TableHead><TableHead>Message</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {result.details?.map((d: any, i: number) => (
                    <TableRow key={i} className={d.pass_fail_status === 'fail' ? 'bg-destructive/5' : ''}>
                      <TableCell>
                        {d.pass_fail_status === 'pass'
                          ? <CheckCircle className="h-4 w-4 text-emerald-500" />
                          : <XCircle className="h-4 w-4 text-destructive" />}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{d.rule_code}</TableCell>
                      <TableCell className="text-sm">{NORMALIZED_FIELDS.find(f => f.key === d.field_name)?.label || d.field_name}</TableCell>
                      <TableCell className="font-mono text-sm">{d.observed_value}</TableCell>
                      <TableCell className="font-mono text-sm">{d.operator}</TableCell>
                      <TableCell className="font-mono text-sm">{d.threshold_value || '—'}</TableCell>
                      <TableCell>
                        {d.impact_type !== 'none' && d.impact_type && (
                          <Badge variant="outline" className="text-xs">{d.impact_type}{d.impact_value ? `: ${d.impact_value}` : ''}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{d.message}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
