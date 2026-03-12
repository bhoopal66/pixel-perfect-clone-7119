import { useQuery } from '@tanstack/react-query';
import { AuditService } from '@/services/ruleEngineCrud';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';

interface Props { lenderId: string; }

export const PolicyAuditLog = ({ lenderId }: Props) => {
  const { data: entries, isLoading } = useQuery({
    queryKey: ['policy-audit', lenderId],
    queryFn: () => lenderId ? AuditService.getByLender(lenderId) : AuditService.getAll(),
  });

  const actionColor = (action: string) => {
    if (action.includes('created')) return 'bg-emerald-500/10 text-emerald-600';
    if (action.includes('deleted')) return 'bg-destructive/10 text-destructive';
    if (action.includes('activated')) return 'bg-blue-500/10 text-blue-600';
    return 'bg-muted text-muted-foreground';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Policy Change Audit Log</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? <p className="text-muted-foreground">Loading…</p> : !entries?.length ? (
          <p className="text-center text-muted-foreground py-8">No audit entries found.</p>
        ) : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>Timestamp</TableHead><TableHead>Action</TableHead>
              <TableHead>Changed By</TableHead><TableHead>Reason</TableHead>
              <TableHead>Details</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {entries.map(e => (
                <TableRow key={e.id}>
                  <TableCell className="text-sm whitespace-nowrap">{format(new Date(e.changed_at), 'dd MMM yyyy HH:mm')}</TableCell>
                  <TableCell><Badge className={actionColor(e.action_done)}>{e.action_done.replace(/_/g, ' ')}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{e.changed_by || 'System'}</TableCell>
                  <TableCell className="text-sm">{e.change_reason || '—'}</TableCell>
                  <TableCell className="text-xs font-mono max-w-[200px] truncate">
                    {e.new_value ? JSON.stringify(e.new_value).substring(0, 80) + '…' : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
