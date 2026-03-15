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
  AlertTriangle, TrendingUp, TrendingDown, Building2, FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import { getDisplayError } from '@/utils/errorHandler';
import {
  RelatedPartyService, ENTITY_TYPES,
  type RelatedParty, type RelatedPartyTransaction, type RelatedPartyFlowSummary,
  type RelatedPartyCrossRef,
} from '@/services/relatedPartyService';
import { CurrencyService } from '@/services/currencyService';
import { Separator } from '@/components/ui/separator';

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

  const { data: crossRef } = useQuery({
    queryKey: ['related-party-crossref', caseId],
    queryFn: () => RelatedPartyService.getCrossReference(caseId),
    enabled: !!summary,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['related-parties', caseId] });
    qc.invalidateQueries({ queryKey: ['related-party-summary', caseId] });
    qc.invalidateQueries({ queryKey: ['related-party-txns', caseId] });
    qc.invalidateQueries({ queryKey: ['related-party-crossref', caseId] });
  };

  const addMutation = useMutation({
    mutationFn: () => RelatedPartyService.addParty(caseId, form),
    onSuccess: () => {
      toast.success('Related party added');
      setAddOpen(false);
      resetForm();
      invalidate();
    },
    onError: (e: any) => toast.error(getDisplayError(e)),
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
    onError: (e: any) => toast.error(getDisplayError(e)),
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
      relationship_type: p.relationship_type,
      trade_license_no: p.trade_license_no || '',
      relationship_description: p.relationship_description || '',
      shareholder_link: p.shareholder_link || '',
      ownership_percentage: p.ownership_percentage || 0,
      shareholder_name: p.shareholder_name || '',
      country: p.country || '',
      industry: p.industry || '',
      remarks: p.remarks || '',
    });
  };

  const riskColor = (level: string) => {
    if (level === 'high') return 'text-destructive';
    if (level === 'moderate') return 'text-warning';
    return 'text-success';
  };

  const riskBadge = (level: string) => {
    if (level === 'high') return <Badge variant="destructive" className="text-xs">High Risk</Badge>;
    if (level === 'moderate') return <Badge className="bg-warning/10 text-warning border-warning/30 text-xs" variant="outline">Moderate</Badge>;
    return <Badge className="bg-success/10 text-success border-success/30 text-xs" variant="outline">Normal</Badge>;
  };

  const PartyForm = (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
      <div>
        <label className="text-sm font-medium text-foreground">Entity Name *</label>
        <Input value={form.entity_name} onChange={e => setForm(f => ({ ...f, entity_name: e.target.value }))} placeholder="Company name" />
      </div>
      <div>
        <label className="text-sm font-medium text-foreground">Relationship Type</label>
        <Select value={form.relationship_type} onValueChange={v => setForm(f => ({ ...f, relationship_type: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {ENTITY_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-foreground">Ownership %</label>
          <Input type="number" min={0} max={100} value={form.ownership_percentage} onChange={e => setForm(f => ({ ...f, ownership_percentage: parseFloat(e.target.value) || 0 }))} />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground">Shareholder Name</label>
          <Input value={form.shareholder_name} onChange={e => setForm(f => ({ ...f, shareholder_name: e.target.value }))} placeholder="Optional" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-foreground">Country</label>
          <Input value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} placeholder="e.g. UAE" />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground">Industry</label>
          <Input value={form.industry} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))} placeholder="e.g. Trading" />
        </div>
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
        <label className="text-sm font-medium text-foreground">Remarks</label>
        <Input value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} placeholder="Optional notes" />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Related Party Analysis Summary */}
      {summary && (
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Related Party Analysis
              <div className="ml-auto">{riskBadge(summary.risk_flag)}</div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Related Entities Identified */}
            {parties.filter(p => p.active_status).length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">Related Entities Identified</h4>
                <div className="space-y-1.5 pl-1">
                  {parties.filter(p => p.active_status).map((p, idx) => (
                    <div key={p.id} className="flex items-center gap-2 text-sm">
                      <span className="font-mono text-xs text-muted-foreground w-5 text-right flex-shrink-0">{idx + 1}.</span>
                      <span className="font-medium text-foreground">{p.entity_name}</span>
                      <span className="text-muted-foreground">–</span>
                      <Badge variant="outline" className="text-xs font-normal">
                        {ENTITY_TYPES.find(t => t.value === p.relationship_type)?.label || p.relationship_type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Total Related Inflows</p>
                <p className="text-lg font-bold text-success">{fmt(summary.total_related_credit)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Total Related Outflows</p>
                <p className="text-lg font-bold text-destructive">{fmt(summary.total_related_debit)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Related Party Ratio</p>
                <p className={`text-lg font-bold ${riskColor(summary.risk_flag)}`}>{pct(summary.related_party_ratio)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Risk Classification</p>
                <p className={`text-lg font-bold ${riskColor(summary.risk_flag)}`}>
                  {summary.risk_flag === 'high' ? 'High' : summary.risk_flag === 'moderate' ? 'Moderate' : 'Normal'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="register">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="register" className="text-xs gap-1"><Users className="h-3.5 w-3.5" /> Register</TabsTrigger>
          <TabsTrigger value="transactions" className="text-xs gap-1"><ArrowUpDown className="h-3.5 w-3.5" /> Detected Transactions</TabsTrigger>
          <TabsTrigger value="impact" className="text-xs gap-1"><TrendingDown className="h-3.5 w-3.5" /> Financial Impact</TabsTrigger>
          <TabsTrigger value="crossref" className="text-xs gap-1"><FileText className="h-3.5 w-3.5" /> Document Cross-Reference</TabsTrigger>
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
                      <TableHead>Ownership %</TableHead>
                      <TableHead>Shareholder</TableHead>
                      <TableHead>Country</TableHead>
                      <TableHead>Industry</TableHead>
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
                            {ENTITY_TYPES.find(t => t.value === p.relationship_type)?.label || p.relationship_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm font-mono">{p.ownership_percentage > 0 ? `${p.ownership_percentage}%` : '—'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{p.shareholder_name || '—'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{p.country || '—'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{p.industry || '—'}</TableCell>
                        <TableCell>
                          <Badge variant={p.active_status ? 'default' : 'secondary'} className="text-xs">
                            {p.active_status ? 'Active' : 'Inactive'}
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
                          <TableCell className="text-sm">{t.transaction_date || '—'}</TableCell>
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
                              {t.detected_by?.includes('full_name') ? 'Full Match' : 'Token Match'}
                              {t.detected_by?.includes('shareholder') ? ' (Shareholder)' : t.detected_by?.includes('group') ? ' (Group Co.)' : ''}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm font-mono">{(t.mapping_confidence * 100).toFixed(0)}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financial Impact Tab */}
        <TabsContent value="impact">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-primary" /> Financial Impact Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!crossRef ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No cross-reference data available.</p>
                  <p className="text-xs mt-1">Run detection first to see financial impact.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Turnover Impact */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Original Turnover</p>
                      <p className="text-lg font-bold text-foreground">{fmt(crossRef.originalTurnover)}</p>
                      <p className="text-xs text-muted-foreground">Total bank credits</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">RP Credits (Excluded)</p>
                      <p className="text-lg font-bold text-destructive">{fmt(crossRef.relatedPartyCredits)}</p>
                      <p className="text-xs text-muted-foreground">{crossRef.turnoverImpactPct.toFixed(1)}% of total</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">RP-Adjusted Turnover</p>
                      <p className="text-lg font-bold text-success">{fmt(crossRef.adjustedTurnover)}</p>
                      <p className="text-xs text-muted-foreground">Credits minus RP</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Adjusted vs VAT Variance</p>
                      <p className={`text-lg font-bold ${crossRef.adjustedVsVatVariance > 25 ? 'text-destructive' : crossRef.adjustedVsVatVariance > 10 ? 'text-warning' : 'text-success'}`}>
                        {crossRef.adjustedVsVatVariance.toFixed(1)}%
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {crossRef.adjustedVsVatVariance <= 10 ? 'Strong Match' : crossRef.adjustedVsVatVariance <= 25 ? 'Moderate' : 'High Variance'}
                      </Badge>
                    </div>
                  </div>

                  <Separator />

                  {/* Entity Breakdown */}
                  {crossRef.entityBreakdown.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-foreground mb-3">Entity-wise Flow Breakdown</h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Entity</TableHead>
                            <TableHead className="text-right">Credits</TableHead>
                            <TableHead className="text-right">Debits</TableHead>
                            <TableHead className="text-right">% of Total Credits</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {crossRef.entityBreakdown.map((e, i) => (
                            <TableRow key={i}>
                              <TableCell className="font-medium text-sm">{e.entity}</TableCell>
                              <TableCell className="text-right font-mono text-sm text-success">{fmt(e.credit)}</TableCell>
                              <TableCell className="text-right font-mono text-sm text-destructive">{fmt(e.debit)}</TableCell>
                              <TableCell className="text-right font-mono text-sm">{(e.ratio * 100).toFixed(1)}%</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Document Cross-Reference Tab */}
        <TabsContent value="crossref">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" /> Document Cross-Reference
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Cross-reference related party declarations against supporting documents to verify legitimacy.
              </p>
              <div className="space-y-4">
                {parties.filter(p => p.active_status).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Add related parties first to enable document cross-referencing.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Entity</TableHead>
                        <TableHead>Trade License</TableHead>
                        <TableHead>Shareholder Registry</TableHead>
                        <TableHead>MOA / AOA</TableHead>
                        <TableHead>Bank Txn Match</TableHead>
                        <TableHead>Verification</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parties.filter(p => p.active_status).map(p => {
                        const hasTxns = detectedTxns.some(t => t.related_party_id === p.id);
                        const hasTL = !!p.trade_license_no;
                        const hasShareholder = !!p.shareholder_name || !!p.shareholder_link;
                        const hasDescription = !!p.relationship_description;
                        const verifiedCount = [hasTL, hasShareholder, hasDescription, hasTxns].filter(Boolean).length;
                        const verificationStatus = verifiedCount >= 3 ? 'verified' : verifiedCount >= 2 ? 'partial' : 'unverified';

                        return (
                          <TableRow key={p.id}>
                            <TableCell className="font-medium text-sm">{p.entity_name}</TableCell>
                            <TableCell>
                              {hasTL ? (
                                <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/30">
                                  {p.trade_license_no}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs text-muted-foreground">Missing</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {hasShareholder ? (
                                <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/30">
                                  {p.shareholder_name || p.shareholder_link || 'Linked'}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs text-muted-foreground">Missing</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {hasDescription ? (
                                <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/30">
                                  Documented
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs text-muted-foreground">Missing</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {hasTxns ? (
                                <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
                                  Detected
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs text-muted-foreground">None</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={verificationStatus === 'verified' ? 'default' : 'outline'}
                                className={`text-xs ${
                                  verificationStatus === 'verified' ? 'bg-success text-success-foreground' :
                                  verificationStatus === 'partial' ? 'bg-warning/10 text-warning border-warning/30' :
                                  'text-destructive border-destructive/30'
                                }`}
                              >
                                {verificationStatus === 'verified' ? 'Verified' : verificationStatus === 'partial' ? 'Partial' : 'Unverified'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </div>
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
