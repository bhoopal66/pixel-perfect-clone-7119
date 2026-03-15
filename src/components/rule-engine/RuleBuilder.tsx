import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RuleService } from '@/services/ruleEngineCrud';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { getDisplayError } from '@/utils/errorHandler';
import { NORMALIZED_FIELDS, RULE_OPERATORS, RULE_ACTION_TYPES, RULE_CATEGORIES } from '@/types/ruleEngine.types';
import type { LenderRule } from '@/types/ruleEngine.types';

interface Props { ruleSetId: string; }

const emptyForm = {
  rule_code: '', rule_name: '', rule_category: 'eligibility', field_name: '',
  operator: '>=', threshold_type: 'static', threshold_value: '', threshold_value_secondary: '',
  action_type: 'FAIL', action_value: '', priority_order: '100', severity: 'minor',
  failure_message: '', review_message: '',
};

export const RuleBuilder = ({ ruleSetId }: Props) => {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<LenderRule | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: rules, isLoading } = useQuery({
    queryKey: ['lender-rules', ruleSetId],
    queryFn: () => RuleService.getByRuleSet(ruleSetId),
    enabled: !!ruleSetId,
  });

  const saveMut = useMutation({
    mutationFn: () => {
      const payload = {
        rule_code: form.rule_code, rule_name: form.rule_name, rule_category: form.rule_category,
        field_name: form.field_name, operator: form.operator, threshold_type: form.threshold_type,
        threshold_value: form.threshold_value || null, threshold_value_secondary: form.threshold_value_secondary || null,
        action_type: form.action_type, action_value: form.action_value || null,
        priority_order: Number(form.priority_order) || 100, severity: form.severity,
        failure_message: form.failure_message || null, review_message: form.review_message || null,
      };
      return editing ? RuleService.update(editing.id, payload) : RuleService.create({ ...payload, rule_set_id: ruleSetId });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['lender-rules'] }); setOpen(false); toast.success(editing ? 'Updated' : 'Created'); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => RuleService.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['lender-rules'] }); toast.success('Rule deleted'); },
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => RuleService.toggleActive(id, active),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lender-rules'] }),
  });

  const openEdit = (r: LenderRule) => {
    setEditing(r);
    setForm({
      rule_code: r.rule_code, rule_name: r.rule_name, rule_category: r.rule_category,
      field_name: r.field_name, operator: r.operator, threshold_type: r.threshold_type,
      threshold_value: r.threshold_value || '', threshold_value_secondary: r.threshold_value_secondary || '',
      action_type: r.action_type, action_value: r.action_value || '',
      priority_order: String(r.priority_order), severity: r.severity,
      failure_message: r.failure_message || '', review_message: r.review_message || '',
    });
    setOpen(true);
  };

  const f = (key: string, val: string) => setForm(prev => ({ ...prev, [key]: val }));
  const needsSecondary = form.operator === 'between';
  const selectedField = NORMALIZED_FIELDS.find(nf => nf.key === form.field_name);

  if (!ruleSetId) return <Card><CardContent className="py-10 text-center text-muted-foreground">Select a rule set</CardContent></Card>;

  const severityColor = (s: string) => s === 'critical' ? 'bg-destructive/10 text-destructive' : s === 'major' ? 'bg-orange-500/10 text-orange-600' : 'bg-muted text-muted-foreground';

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Rules ({rules?.length || 0})</CardTitle>
        <Button size="sm" onClick={() => { setEditing(null); setForm(emptyForm); setOpen(true); }}><Plus className="h-4 w-4 mr-1" />Add Rule</Button>
      </CardHeader>
      <CardContent>
        {isLoading ? <p className="text-muted-foreground">Loading…</p> : !rules?.length ? (
          <p className="text-center text-muted-foreground py-8">No rules defined yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow>
                <TableHead className="w-[50px]">#</TableHead><TableHead>Code</TableHead><TableHead>Name</TableHead>
                <TableHead>Field</TableHead><TableHead>Condition</TableHead><TableHead>Action</TableHead>
                <TableHead>Severity</TableHead><TableHead>Active</TableHead><TableHead />
              </TableRow></TableHeader>
              <TableBody>
                {rules.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="text-muted-foreground text-sm">{r.priority_order}</TableCell>
                    <TableCell className="font-mono text-xs">{r.rule_code}</TableCell>
                    <TableCell className="font-medium text-sm">{r.rule_name}</TableCell>
                    <TableCell className="text-sm">{NORMALIZED_FIELDS.find(nf => nf.key === r.field_name)?.label || r.field_name}</TableCell>
                    <TableCell className="text-sm font-mono">{r.operator} {r.threshold_value}{r.threshold_value_secondary ? `–${r.threshold_value_secondary}` : ''}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{r.action_type}</Badge></TableCell>
                    <TableCell><Badge className={`text-xs ${severityColor(r.severity)}`}>{r.severity}</Badge></TableCell>
                    <TableCell><Switch checked={r.is_active} onCheckedChange={active => toggleMut.mutate({ id: r.id, active })} /></TableCell>
                    <TableCell className="space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(r)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteMut.mutate(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Edit Rule' : 'Add Rule'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div><label className="text-sm font-medium text-foreground">Code</label><Input value={form.rule_code} onChange={e => f('rule_code', e.target.value)} placeholder="e.g. ELG-001" /></div>
              <div className="col-span-2"><label className="text-sm font-medium text-foreground">Name</label><Input value={form.rule_name} onChange={e => f('rule_name', e.target.value)} placeholder="Rule description" /></div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground">Category</label>
                <Select value={form.rule_category} onValueChange={v => f('rule_category', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{RULE_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Field</label>
                <Select value={form.field_name} onValueChange={v => f('field_name', v)}>
                  <SelectTrigger><SelectValue placeholder="Select field" /></SelectTrigger>
                  <SelectContent>{NORMALIZED_FIELDS.map(nf => <SelectItem key={nf.key} value={nf.key}>{nf.label}</SelectItem>)}</SelectContent>
                </Select>
                {selectedField && <p className="text-xs text-muted-foreground mt-1">{selectedField.description}</p>}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground">Operator</label>
                <Select value={form.operator} onValueChange={v => f('operator', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{RULE_OPERATORS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Threshold</label>
                <Input value={form.threshold_value} onChange={e => f('threshold_value', e.target.value)} placeholder="Value" />
              </div>
              {needsSecondary && (
                <div>
                  <label className="text-sm font-medium text-foreground">Upper Bound</label>
                  <Input value={form.threshold_value_secondary} onChange={e => f('threshold_value_secondary', e.target.value)} />
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground">Action Type</label>
                <Select value={form.action_type} onValueChange={v => f('action_type', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{RULE_ACTION_TYPES.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Action Value</label>
                <Input value={form.action_value} onChange={e => f('action_value', e.target.value)} placeholder="Optional" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Severity</label>
                <Select value={form.severity} onValueChange={v => f('severity', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minor">Minor</SelectItem>
                    <SelectItem value="major">Major</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Priority Order</label>
              <Input type="number" value={form.priority_order} onChange={e => f('priority_order', e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium text-foreground">Failure Message</label><Input value={form.failure_message} onChange={e => f('failure_message', e.target.value)} placeholder="Shown when rule fails" /></div>
              <div><label className="text-sm font-medium text-foreground">Review Message</label><Input value={form.review_message} onChange={e => f('review_message', e.target.value)} placeholder="Analyst guidance" /></div>
            </div>

            <Button onClick={() => saveMut.mutate()} disabled={!form.rule_code || !form.rule_name || !form.field_name || saveMut.isPending} className="w-full">
              {saveMut.isPending ? 'Saving…' : editing ? 'Update Rule' : 'Create Rule'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
