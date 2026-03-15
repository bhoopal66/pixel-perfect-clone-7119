import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RuleSetService } from '@/services/ruleEngineCrud';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Copy, CheckCircle, Archive } from 'lucide-react';
import { toast } from 'sonner';
import { getDisplayError } from '@/utils/errorHandler';
import type { LenderRuleSet } from '@/types/ruleEngine.types';

interface Props {
  lenderId: string;
  productId: string;
  onSelectRuleSet: (id: string) => void;
}

export const RuleSetManager = ({ lenderId, productId, onSelectRuleSet }: Props) => {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ rule_set_name: '', remarks: '' });

  const { data: ruleSets, isLoading } = useQuery({
    queryKey: ['rule-sets', productId],
    queryFn: () => RuleSetService.getByProduct(productId),
    enabled: !!productId,
  });

  const createMut = useMutation({
    mutationFn: () => {
      const nextVersion = (ruleSets?.length || 0) + 1;
      return RuleSetService.create({
        lender_id: lenderId, product_id: productId,
        rule_set_name: form.rule_set_name, version_no: nextVersion,
        remarks: form.remarks || null,
      });
    },
    onSuccess: (data) => { qc.invalidateQueries({ queryKey: ['rule-sets'] }); setOpen(false); onSelectRuleSet(data.id); toast.success('Rule set created'); },
    onError: (e: any) => toast.error(getDisplayError(e)),
  });

  const duplicateMut = useMutation({
    mutationFn: (id: string) => RuleSetService.duplicate(id),
    onSuccess: (data) => { qc.invalidateQueries({ queryKey: ['rule-sets'] }); onSelectRuleSet(data.id); toast.success('Rule set duplicated'); },
    onError: (e: any) => toast.error(e.message),
  });

  const activateMut = useMutation({
    mutationFn: (id: string) => RuleSetService.activate(id, productId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['rule-sets'] }); toast.success('Rule set activated'); },
    onError: (e: any) => toast.error(e.message),
  });

  if (!productId) return <Card><CardContent className="py-10 text-center text-muted-foreground">Select a product to manage rule sets</CardContent></Card>;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Rule Set Versions</CardTitle>
        <Button size="sm" onClick={() => { setForm({ rule_set_name: '', remarks: '' }); setOpen(true); }}><Plus className="h-4 w-4 mr-1" />New Version</Button>
      </CardHeader>
      <CardContent>
        {isLoading ? <p className="text-muted-foreground">Loading…</p> : !ruleSets?.length ? (
          <p className="text-center text-muted-foreground py-8">No rule sets created yet.</p>
        ) : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>Name</TableHead><TableHead>Version</TableHead><TableHead>Status</TableHead>
              <TableHead>Effective</TableHead><TableHead>Remarks</TableHead><TableHead className="text-right">Actions</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {ruleSets.map(rs => (
                <TableRow key={rs.id} className="cursor-pointer hover:bg-muted/50" onClick={() => onSelectRuleSet(rs.id)}>
                  <TableCell className="font-medium">{rs.rule_set_name}</TableCell>
                  <TableCell><Badge variant="outline">v{rs.version_no}</Badge></TableCell>
                  <TableCell>
                    {rs.is_active
                      ? <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">Active</Badge>
                      : <Badge variant="secondary">Draft</Badge>}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {rs.effective_from ? new Date(rs.effective_from).toLocaleDateString() : '—'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{rs.remarks || '—'}</TableCell>
                  <TableCell className="text-right space-x-1">
                    {!rs.is_active && (
                      <Button variant="ghost" size="icon" title="Activate" onClick={e => { e.stopPropagation(); activateMut.mutate(rs.id); }}>
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" title="Duplicate" onClick={e => { e.stopPropagation(); duplicateMut.mutate(rs.id); }}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create New Rule Set</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><label className="text-sm font-medium text-foreground">Name</label><Input value={form.rule_set_name} onChange={e => setForm(f => ({ ...f, rule_set_name: e.target.value }))} placeholder="e.g. Standard Policy 2026" /></div>
            <div><label className="text-sm font-medium text-foreground">Remarks</label><Textarea value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} placeholder="Optional notes" /></div>
            <Button onClick={() => createMut.mutate()} disabled={!form.rule_set_name || createMut.isPending} className="w-full">
              {createMut.isPending ? 'Creating…' : 'Create Rule Set'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
