import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Plus, Search, Trash2, Edit, RefreshCw, Users, ArrowUpDown,
  AlertTriangle, TrendingUp, TrendingDown, Building2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  RelatedPartyService, ENTITY_TYPES,
  type RelatedParty, type RelatedPartyTransaction, type RelatedPartyFlowSummary,
} from '@/services/relatedPartyService';
import { CurrencyService } from '@/services/currencyService';

const fmt = (v: number) => CurrencyService.format(v, 'AED');
const pct = (v: number) => `${(v * 100).toFixed(1)}%`;

interface Props {
  caseId: string;
}

export const RelatedPartiesTab: React.FC<Props> = ({ caseId }) => {
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [editParty, setEditParty] = useState<RelatedParty | null>(null);
  const [form, setForm] = useState({
    entity_name: '',
    relationship_type: 'sister_concern',
    trade_license_no: '',
    relationship_description: '',
    shareholder_link: '',
    ownership_percentage: 0,
    shareholder_name: '',
    country: '',
    industry: '',
    remarks: '',
  });

  const { data: parties = [], isLoading: loadingParties } = useQuery({
    queryKey: ['related-parties', caseId],
    queryFn: () => RelatedPartyService.getParties(caseId),
  });

  const { data: summary } = useQuery({
    queryKey: ['related-party-summary', caseId],
    queryFn: () => RelatedPartyService.getFlowSummary(caseId),
  });

  const { data: detectedTxns = [] } = useQuery({
    queryKey: ['related-party-txns', caseId],
    queryFn: () => RelatedPartyService.getDetectedTransactions(caseId),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['related-parties', caseId] });
    qc.invalidateQueries({ queryKey: ['related-party-summary', caseId] });
    qc.invalidateQueries({ queryKey: ['related-party-txns', caseId] });
  };

  const addMutation = useMutation({
    mutationFn: () => RelatedPartyService.addParty(caseId, form),
    onSuccess: () => {
      toast.success('Related party added');
      setAddOpen(false);
      resetForm();
      invalidate();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: () => {
      if (!editParty) throw new Error('No party selected');
      return RelatedPartyService.updateParty(editParty.id, form);
    },
    onSuccess: () => {
      toast.success('Related party updated');
      setEditParty(null);
      resetForm();
      invalidate();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => RelatedPartyService.deleteParty(id),
    onSuccess: () => { toast.success('Related party removed'); invalidate(); },
    onError: (e: any) => toast.error(e.message),
  });

  const detectMutation = useMutation({
    mutationFn: () => RelatedPartyService.detectTransactions(caseId),
    onSuccess: (res) => {
      toast.success(`Detection complete: ${res.matched} transactions matched`);
      invalidate();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const resetForm = () => setForm({
    entity_name: '', relationship_type: 'sister_concern',
    trade_license_no: '', relationship_description: '', shareholder_link: '',
    ownership_percentage: 0, shareholder_name: '', country: '', industry: '', remarks: '',
  });

  const openEdit = (p: RelatedParty) => {
    setEditParty(p);
    setForm({
      entity_name: p.entity_name,
      entity_type: p.entity_type,
      trade_license_no: p.trade_license_no || '',
      relationship_description: p.relationship_description || '',
      shareholder_link: p.shareholder_link || '',
    });
  };

  const riskColor = (level: string) => {
    if (level === 'high') return 'text-destructive';
    if (level === 'medium') return 'text-warning';
    return 'text-success';
  };

  const riskBadge = (level: string) => {
    if (level === 'high') return <Badge variant="destructive" className="text-xs">High Risk</Badge>;
    if (level === 'medium') return <Badge className="bg-warning/10 text-warning border-warning/30 text-xs" variant="outline">Moderate</Badge>;
    return <Badge className="bg-success/10 text-success border-success/30 text-xs" variant="outline">Low</Badge>;
  };

  const PartyForm = (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-foreground">Entity Name *</label>
        <Input value={form.entity_name} onChange={e => setForm(f => ({ ...f, entity_name: e.target.value }))} placeholder="Company name" />
      </div>
      <div>
        <label className="text-sm font-medium text-foreground">Entity Type</label>
        <Select value={form.entity_type} onValueChange={v => setForm(f => ({ ...f, entity_type: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {ENTITY_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-sm font-medium text-foreground">Trade License No.</label>
        <Input value={form.trade_license_no} onChange={e => setForm(f => ({ ...f, trade_license_no: e.target.value }))} placeholder="Optional" />
      </div>
      <div>
        <label className="text-sm font-medium text-foreground">Relationship Description</label>
        <Input value={form.relationship_description} onChange={e => setForm(f => ({ ...f, relationship_description: e.target.value }))} placeholder="e.g. Same shareholder" />
      </div>
      <div>
        <label className="text-sm font-medium text-foreground">Shareholder Link</label>
        <Input value={form.shareholder_link} onChange={e => setForm(f => ({ ...f, shareholder_link: e.target.value }))} placeholder="Optional" />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-5 pb-4">
              <p className="text-xs font-medium text-muted-foreground">Related Inflows</p>
              <p className="text-lg font-bold text-foreground">{fmt(summary.total_related_inflows)}</p>
              <p className="text-xs text-muted-foreground mt-1">{pct(summary.inflow_ratio)} of credits</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-4">
              <p className="text-xs font-medium text-muted-foreground">Related Outflows</p>
              <p className="text-lg font-bold text-foreground">{fmt(summary.total_related_outflows)}</p>
              <p className="text-xs text-muted-foreground mt-1">{pct(summary.outflow_ratio)} of debits</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-4">
              <p className="text-xs font-medium text-muted-foreground">Overall Ratio</p>
              <p className={`text-lg font-bold ${riskColor(summary.risk_level)}`}>{pct(summary.overall_ratio)}</p>
              <div className="mt-1">{riskBadge(summary.risk_level)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-4">
              <p className="text-xs font-medium text-muted-foreground">Matches</p>
              <p className="text-lg font-bold text-foreground">{summary.transactions_matched}</p>
              <p className="text-xs text-muted-foreground mt-1">{summary.parties_detected} parties detected</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="register">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="register" className="text-xs gap-1"><Users className="h-3.5 w-3.5" /> Register</TabsTrigger>
          <TabsTrigger value="transactions" className="text-xs gap-1"><ArrowUpDown className="h-3.5 w-3.5" /> Detected Transactions</TabsTrigger>
        </TabsList>

        {/* Register Tab */}
        <TabsContent value="register">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" /> Related Party Register
              </CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => detectMutation.mutate()} disabled={detectMutation.isPending || parties.length === 0}>
                  <Search className="h-4 w-4 mr-1" />
                  {detectMutation.isPending ? 'Detecting...' : 'Detect Transactions'}
                </Button>
                <Dialog open={addOpen} onOpenChange={v => { setAddOpen(v); if (!v) resetForm(); }}>
                  <DialogTrigger asChild>
                    <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Party</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Add Related Party</DialogTitle></DialogHeader>
                    {PartyForm}
                    <DialogFooter>
                      <Button onClick={() => addMutation.mutate()} disabled={!form.entity_name || addMutation.isPending}>
                        {addMutation.isPending ? 'Adding...' : 'Add'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {parties.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No related parties registered yet.</p>
                  <p className="text-xs mt-1">Add sister concerns, group companies, or shareholder-linked entities.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Entity Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Trade License</TableHead>
                      <TableHead>Relationship</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-24">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parties.map(p => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.entity_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {ENTITY_TYPES.find(t => t.value === p.entity_type)?.label || p.entity_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{p.trade_license_no || '—'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{p.relationship_description || '—'}</TableCell>
                        <TableCell>
                          <Badge variant={p.is_active ? 'default' : 'secondary'} className="text-xs">
                            {p.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(p)}>
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(p.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Detected Transactions Tab */}
        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ArrowUpDown className="h-5 w-5 text-primary" /> Detected Related Party Transactions
                {detectedTxns.length > 0 && (
                  <Badge variant="secondary" className="ml-2">{detectedTxns.length}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {detectedTxns.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No related party transactions detected yet.</p>
                  <p className="text-xs mt-1">Add parties to the register and click "Detect Transactions".</p>
                </div>
              ) : (
                <div className="max-h-[500px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Credit</TableHead>
                        <TableHead className="text-right">Debit</TableHead>
                        <TableHead>Bank</TableHead>
                        <TableHead>Match Method</TableHead>
                        <TableHead>Confidence</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detectedTxns.map(t => (
                        <TableRow key={t.id}>
                          <TableCell className="text-sm">{t.txn_date || '—'}</TableCell>
                          <TableCell className="text-sm max-w-[200px] truncate">{t.description || '—'}</TableCell>
                          <TableCell className="text-right font-mono text-sm text-success">
                            {t.credit > 0 ? fmt(t.credit) : '—'}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm text-destructive">
                            {t.debit > 0 ? fmt(t.debit) : '—'}
                          </TableCell>
                          <TableCell className="text-sm">{t.bank_name || '—'}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {t.match_method === 'full_name_match' ? 'Full Match' : 'Token Match'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm font-mono">{(t.match_confidence * 100).toFixed(0)}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={!!editParty} onOpenChange={v => { if (!v) { setEditParty(null); resetForm(); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Related Party</DialogTitle></DialogHeader>
          {PartyForm}
          <DialogFooter>
            <Button onClick={() => updateMutation.mutate()} disabled={!form.entity_name || updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
