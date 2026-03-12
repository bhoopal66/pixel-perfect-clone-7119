import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FormulaService } from '@/services/ruleEngineCrud';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { NORMALIZED_FIELDS, FORMULA_TYPES } from '@/types/ruleEngine.types';
import type { LenderFormulaConfig } from '@/types/ruleEngine.types';

interface Props { ruleSetId: string; }

const emptyForm = { formula_name: '', formula_type: 'limit', base_field: '', multiplier: '1', cap_value: '', floor_value: '0', formula_expression: '' };

export const FormulaBuilder = ({ ruleSetId }: Props) => {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<LenderFormulaConfig | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: formulas, isLoading } = useQuery({
    queryKey: ['lender-formulas', ruleSetId],
    queryFn: () => FormulaService.getByRuleSet(ruleSetId),
    enabled: !!ruleSetId,
  });

  const saveMut = useMutation({
    mutationFn: () => {
      const payload = {
        formula_name: form.formula_name, formula_type: form.formula_type, base_field: form.base_field,
        multiplier: Number(form.multiplier) || 1,
        cap_value: form.cap_value ? Number(form.cap_value) : null,
        floor_value: Number(form.floor_value) || 0,
        formula_expression: form.formula_expression || null,
      };
      return editing ? FormulaService.update(editing.id, payload) : FormulaService.create({ ...payload, rule_set_id: ruleSetId });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['lender-formulas'] }); setOpen(false); toast.success(editing ? 'Updated' : 'Created'); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => FormulaService.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['lender-formulas'] }); toast.success('Deleted'); },
  });

  const openEdit = (f: LenderFormulaConfig) => {
    setEditing(f);
    setForm({
      formula_name: f.formula_name, formula_type: f.formula_type, base_field: f.base_field,
      multiplier: String(f.multiplier ?? 1), cap_value: String(f.cap_value ?? ''),
      floor_value: String(f.floor_value ?? 0), formula_expression: f.formula_expression || '',
    });
    setOpen(true);
  };

  const upd = (key: string, val: string) => setForm(prev => ({ ...prev, [key]: val }));

  if (!ruleSetId) return <Card><CardContent className="py-10 text-center text-muted-foreground">Select a rule set</CardContent></Card>;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Formulas</CardTitle>
        <Button size="sm" onClick={() => { setEditing(null); setForm(emptyForm); setOpen(true); }}><Plus className="h-4 w-4 mr-1" />Add Formula</Button>
      </CardHeader>
      <CardContent>
        {isLoading ? <p className="text-muted-foreground">Loading…</p> : !formulas?.length ? (
          <p className="text-center text-muted-foreground py-8">No formulas configured. Add a limit or tenure formula.</p>
        ) : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>Name</TableHead><TableHead>Type</TableHead><TableHead>Base Field</TableHead>
              <TableHead>Multiplier</TableHead><TableHead>Cap</TableHead><TableHead>Floor</TableHead>
              <TableHead>Expression</TableHead><TableHead />
            </TableRow></TableHeader>
            <TableBody>
              {formulas.map(f => (
                <TableRow key={f.id}>
                  <TableCell className="font-medium">{f.formula_name}</TableCell>
                  <TableCell><Badge variant="outline">{FORMULA_TYPES.find(t => t.value === f.formula_type)?.label || f.formula_type}</Badge></TableCell>
                  <TableCell className="text-sm">{NORMALIZED_FIELDS.find(nf => nf.key === f.base_field)?.label || f.base_field}</TableCell>
                  <TableCell className="font-mono text-sm">{f.multiplier ?? '—'}</TableCell>
                  <TableCell className="text-sm">{f.cap_value ? Number(f.cap_value).toLocaleString() : '—'}</TableCell>
                  <TableCell className="text-sm">{f.floor_value ? Number(f.floor_value).toLocaleString() : '—'}</TableCell>
                  <TableCell className="font-mono text-xs max-w-[200px] truncate">{f.formula_expression || '—'}</TableCell>
                  <TableCell className="space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(f)}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteMut.mutate(f.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Edit Formula' : 'Add Formula'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><label className="text-sm font-medium text-foreground">Name</label><Input value={form.formula_name} onChange={e => upd('formula_name', e.target.value)} placeholder="e.g. Standard Limit Calc" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground">Type</label>
                <Select value={form.formula_type} onValueChange={v => upd('formula_type', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{FORMULA_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Base Field</label>
                <Select value={form.base_field} onValueChange={v => upd('base_field', v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{NORMALIZED_FIELDS.map(nf => <SelectItem key={nf.key} value={nf.key}>{nf.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="text-sm font-medium text-foreground">Multiplier</label><Input type="number" step="0.01" value={form.multiplier} onChange={e => upd('multiplier', e.target.value)} /></div>
              <div><label className="text-sm font-medium text-foreground">Cap (AED)</label><Input type="number" value={form.cap_value} onChange={e => upd('cap_value', e.target.value)} placeholder="No cap" /></div>
              <div><label className="text-sm font-medium text-foreground">Floor (AED)</label><Input type="number" value={form.floor_value} onChange={e => upd('floor_value', e.target.value)} /></div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Formula Expression (optional)</label>
              <Textarea value={form.formula_expression} onChange={e => upd('formula_expression', e.target.value)}
                placeholder="e.g. min(avg_monthly_bank_credit * 12, declared_vat_turnover) * 0.4" className="font-mono text-sm" />
              <p className="text-xs text-muted-foreground mt-1">Supports field names, +, -, *, /, min(), max(). Overrides base_field × multiplier when set.</p>
            </div>
            <Button onClick={() => saveMut.mutate()} disabled={!form.formula_name || !form.base_field || saveMut.isPending} className="w-full">
              {saveMut.isPending ? 'Saving…' : editing ? 'Update' : 'Create'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
