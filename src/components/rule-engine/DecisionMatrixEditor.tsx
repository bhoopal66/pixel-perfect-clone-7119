import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DecisionMatrixService } from '@/services/ruleEngineCrud';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { getDisplayError } from '@/utils/errorHandler';
import { DECISION_STATUSES } from '@/types/ruleEngine.types';
import type { LenderDecisionMatrix } from '@/types/ruleEngine.types';

interface Props { ruleSetId: string; }

const emptyForm = { min_major: '0', max_major: '0', min_minor: '0', max_minor: '0', decision_status: 'eligible', score_from: '', score_to: '', remarks: '' };

export const DecisionMatrixEditor = ({ ruleSetId }: Props) => {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<LenderDecisionMatrix | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: rows, isLoading } = useQuery({
    queryKey: ['decision-matrix', ruleSetId],
    queryFn: () => DecisionMatrixService.getByRuleSet(ruleSetId),
    enabled: !!ruleSetId,
  });

  const saveMut = useMutation({
    mutationFn: () => {
      const payload = {
        min_major_failures: Number(form.min_major), max_major_failures: Number(form.max_major),
        min_minor_failures: Number(form.min_minor), max_minor_failures: Number(form.max_minor),
        decision_status: form.decision_status,
        score_from: form.score_from ? Number(form.score_from) : null,
        score_to: form.score_to ? Number(form.score_to) : null,
        remarks: form.remarks || null,
      };
      return editing ? DecisionMatrixService.update(editing.id, payload) : DecisionMatrixService.create({ ...payload, rule_set_id: ruleSetId });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['decision-matrix'] }); setOpen(false); toast.success('Saved'); },
    onError: (e: any) => toast.error(getDisplayError(e)),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => DecisionMatrixService.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['decision-matrix'] }); toast.success('Deleted'); },
  });

  const openEdit = (r: LenderDecisionMatrix) => {
    setEditing(r);
    setForm({
      min_major: String(r.min_major_failures), max_major: String(r.max_major_failures),
      min_minor: String(r.min_minor_failures), max_minor: String(r.max_minor_failures),
      decision_status: r.decision_status, score_from: r.score_from !== null ? String(r.score_from) : '',
      score_to: r.score_to !== null ? String(r.score_to) : '', remarks: r.remarks || '',
    });
    setOpen(true);
  };

  const upd = (key: string, val: string) => setForm(prev => ({ ...prev, [key]: val }));
  const statusConfig = (s: string) => DECISION_STATUSES.find(d => d.value === s);

  if (!ruleSetId) return <Card><CardContent className="py-10 text-center text-muted-foreground">Select a rule set</CardContent></Card>;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Decision Matrix</CardTitle>
        <Button size="sm" onClick={() => { setEditing(null); setForm(emptyForm); setOpen(true); }}><Plus className="h-4 w-4 mr-1" />Add Row</Button>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">Define how failure counts and scores map to eligibility decisions.</p>
        {isLoading ? <p>Loading…</p> : !rows?.length ? (
          <p className="text-center text-muted-foreground py-8">No decision matrix defined. Default logic will apply.</p>
        ) : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>Major Fails</TableHead><TableHead>Minor Fails</TableHead>
              <TableHead>Score Range</TableHead><TableHead>Decision</TableHead><TableHead>Remarks</TableHead><TableHead />
            </TableRow></TableHeader>
            <TableBody>
              {rows.map(r => {
                const sc = statusConfig(r.decision_status);
                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-sm">{r.min_major_failures}–{r.max_major_failures}</TableCell>
                    <TableCell className="font-mono text-sm">{r.min_minor_failures}–{r.max_minor_failures}</TableCell>
                    <TableCell className="text-sm">{r.score_from !== null ? `${r.score_from}–${r.score_to}` : 'Any'}</TableCell>
                    <TableCell>
                      <Badge className={`${sc?.color || 'bg-muted'} text-white`}>{sc?.label || r.decision_status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">{r.remarks || '—'}</TableCell>
                    <TableCell className="space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(r)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteMut.mutate(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit Decision Row' : 'Add Decision Row'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium text-foreground">Min Major Fails</label><Input type="number" value={form.min_major} onChange={e => upd('min_major', e.target.value)} /></div>
              <div><label className="text-sm font-medium text-foreground">Max Major Fails</label><Input type="number" value={form.max_major} onChange={e => upd('max_major', e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium text-foreground">Min Minor Fails</label><Input type="number" value={form.min_minor} onChange={e => upd('min_minor', e.target.value)} /></div>
              <div><label className="text-sm font-medium text-foreground">Max Minor Fails</label><Input type="number" value={form.max_minor} onChange={e => upd('max_minor', e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium text-foreground">Score From</label><Input type="number" value={form.score_from} onChange={e => upd('score_from', e.target.value)} placeholder="Any" /></div>
              <div><label className="text-sm font-medium text-foreground">Score To</label><Input type="number" value={form.score_to} onChange={e => upd('score_to', e.target.value)} placeholder="Any" /></div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Decision Status</label>
              <Select value={form.decision_status} onValueChange={v => upd('decision_status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{DECISION_STATUSES.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><label className="text-sm font-medium text-foreground">Remarks</label><Input value={form.remarks} onChange={e => upd('remarks', e.target.value)} placeholder="Optional" /></div>
            <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending} className="w-full">
              {saveMut.isPending ? 'Saving…' : editing ? 'Update' : 'Add Row'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
