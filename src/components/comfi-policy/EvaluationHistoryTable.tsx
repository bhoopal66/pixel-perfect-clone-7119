import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { fetchEvaluationHistory } from '@/services/comfiPolicyService';

interface EvaluationHistoryTableProps {
  onViewDetail: (id: string) => void;
}

export function EvaluationHistoryTable({ onViewDetail }: EvaluationHistoryTableProps) {
  const { data: history, isLoading } = useQuery({
    queryKey: ['comfi-evaluation-history'],
    queryFn: () => fetchEvaluationHistory(30),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Evaluation History</CardTitle>
        <CardDescription>Previous COMFI policy evaluations</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        ) : !history?.length ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No evaluations recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead className="text-right">Adj. Turnover</TableHead>
                  <TableHead className="text-right">Eligible Finance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Override</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((h: any) => (
                  <TableRow key={h.id} className="cursor-pointer hover:bg-muted/50" onClick={() => onViewDetail(h.id)}>
                    <TableCell className="text-xs whitespace-nowrap">{new Date(h.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</TableCell>
                    <TableCell className="text-sm font-medium">{h.applicant_name}</TableCell>
                    <TableCell className="text-sm">{h.company_name}</TableCell>
                    <TableCell className="text-sm text-right font-mono">AED {Number(h.adjusted_turnover).toLocaleString()}</TableCell>
                    <TableCell className="text-sm text-right font-mono font-medium">AED {Number(h.eligible_finance).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={h.application_status === 'Rejected' ? 'destructive' : 'default'} className="text-xs">
                        {h.application_status === 'Eligible – Subject to Credit Review' ? 'Eligible' : h.application_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {h.override_status && (
                        <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-700 border-amber-200">{h.override_status}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
