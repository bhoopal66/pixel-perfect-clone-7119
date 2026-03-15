import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProductService } from '@/services/ruleEngineCrud';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { getDisplayError } from '@/utils/errorHandler';
import { PRODUCT_TYPES } from '@/types/ruleEngine.types';
import type { LenderProduct } from '@/types/ruleEngine.types';

interface Props { lenderId: string; }

const emptyForm = { product_code: '', product_name: '', product_type: 'business_loan', min_limit: '', max_limit: '', min_tenure: '1', max_tenure: '60' };

export const LenderProductManager = ({ lenderId }: Props) => {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<LenderProduct | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: products, isLoading } = useQuery({
    queryKey: ['lender-products', lenderId],
    queryFn: () => ProductService.getByLender(lenderId),
    enabled: !!lenderId,
  });

  const saveMut = useMutation({
    mutationFn: () => {
      const payload = {
        product_code: form.product_code, product_name: form.product_name, product_type: form.product_type,
        min_limit: form.min_limit ? Number(form.min_limit) : 0,
        max_limit: form.max_limit ? Number(form.max_limit) : null,
        min_tenure: Number(form.min_tenure) || 1, max_tenure: Number(form.max_tenure) || 60,
      };
      return editing ? ProductService.update(editing.id, payload) : ProductService.create({ ...payload, lender_id: lenderId });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['lender-products'] }); setOpen(false); toast.success(editing ? 'Updated' : 'Created'); },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => ProductService.toggleActive(id, active),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lender-products'] }),
  });

  const openEdit = (p: LenderProduct) => {
    setEditing(p);
    setForm({ product_code: p.product_code, product_name: p.product_name, product_type: p.product_type, min_limit: String(p.min_limit || ''), max_limit: String(p.max_limit || ''), min_tenure: String(p.min_tenure || 1), max_tenure: String(p.max_tenure || 60) });
    setOpen(true);
  };

  if (!lenderId) return <Card><CardContent className="py-10 text-center text-muted-foreground">Select a lender to manage products</CardContent></Card>;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Products</CardTitle>
        <Button size="sm" onClick={() => { setEditing(null); setForm(emptyForm); setOpen(true); }}><Plus className="h-4 w-4 mr-1" />Add Product</Button>
      </CardHeader>
      <CardContent>
        {isLoading ? <p className="text-muted-foreground">Loading…</p> : !products?.length ? (
          <p className="text-center text-muted-foreground py-8">No products configured for this lender.</p>
        ) : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>Code</TableHead><TableHead>Name</TableHead><TableHead>Type</TableHead>
              <TableHead>Limit Range</TableHead><TableHead>Tenure</TableHead><TableHead>Active</TableHead><TableHead />
            </TableRow></TableHeader>
            <TableBody>
              {products.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-sm">{p.product_code}</TableCell>
                  <TableCell className="font-medium">{p.product_name}</TableCell>
                  <TableCell><Badge variant="outline">{PRODUCT_TYPES.find(t => t.value === p.product_type)?.label || p.product_type}</Badge></TableCell>
                  <TableCell className="text-sm">{(p.min_limit || 0).toLocaleString()} – {p.max_limit ? p.max_limit.toLocaleString() : '∞'}</TableCell>
                  <TableCell className="text-sm">{p.min_tenure}–{p.max_tenure} mo</TableCell>
                  <TableCell><Switch checked={p.is_active} onCheckedChange={active => toggleMut.mutate({ id: p.id, active })} /></TableCell>
                  <TableCell><Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Edit className="h-4 w-4" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit Product' : 'Add Product'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium text-foreground">Code</label><Input value={form.product_code} onChange={e => setForm(f => ({ ...f, product_code: e.target.value }))} placeholder="e.g. BL-001" /></div>
              <div><label className="text-sm font-medium text-foreground">Name</label><Input value={form.product_name} onChange={e => setForm(f => ({ ...f, product_name: e.target.value }))} /></div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Type</label>
              <Select value={form.product_type} onValueChange={v => setForm(f => ({ ...f, product_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PRODUCT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium text-foreground">Min Limit (AED)</label><Input type="number" value={form.min_limit} onChange={e => setForm(f => ({ ...f, min_limit: e.target.value }))} /></div>
              <div><label className="text-sm font-medium text-foreground">Max Limit (AED)</label><Input type="number" value={form.max_limit} onChange={e => setForm(f => ({ ...f, max_limit: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium text-foreground">Min Tenure (mo)</label><Input type="number" value={form.min_tenure} onChange={e => setForm(f => ({ ...f, min_tenure: e.target.value }))} /></div>
              <div><label className="text-sm font-medium text-foreground">Max Tenure (mo)</label><Input type="number" value={form.max_tenure} onChange={e => setForm(f => ({ ...f, max_tenure: e.target.value }))} /></div>
            </div>
            <Button onClick={() => saveMut.mutate()} disabled={!form.product_code || !form.product_name || saveMut.isPending} className="w-full">
              {saveMut.isPending ? 'Saving…' : editing ? 'Update Product' : 'Create Product'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
