import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  Trash2,
  Eye,
  Download,
  Plus,
  X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from './ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { cn } from '@/lib/utils';
import type { VATReturn } from '../types/turnoverAnalysis.types';
import type { CurrencyCode } from '../services/currencyService';
import { CurrencyService } from '../services/currencyService';

interface VATReturnsUploadProps {
  vatReturns: VATReturn[];
  onVATReturnsChange: (returns: VATReturn[]) => void;
  currency?: CurrencyCode;
}

export const VATReturnsUpload: React.FC<VATReturnsUploadProps> = ({
  vatReturns,
  onVATReturnsChange,
  currency = 'AED'
}) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newReturn, setNewReturn] = useState<Partial<VATReturn>>({
    period: '',
    startDate: '',
    endDate: '',
    taxableSales: 0,
    zeroRatedSales: 0,
    exemptSales: 0,
    outputVAT: 0,
    inputVAT: 0,
    status: 'submitted'
  });

  const formatCurrency = (value: number) => CurrencyService.format(value, currency);

  const handleAddReturn = () => {
    if (!newReturn.period || !newReturn.startDate || !newReturn.endDate) return;

    const vatReturn: VATReturn = {
      id: `vat-${Date.now()}`,
      period: newReturn.period || '',
      startDate: newReturn.startDate || '',
      endDate: newReturn.endDate || '',
      taxableSales: newReturn.taxableSales || 0,
      zeroRatedSales: newReturn.zeroRatedSales || 0,
      exemptSales: newReturn.exemptSales || 0,
      outputVAT: newReturn.outputVAT || 0,
      inputVAT: newReturn.inputVAT || 0,
      netVAT: (newReturn.outputVAT || 0) - (newReturn.inputVAT || 0),
      fileName: 'Manual Entry',
      uploadDate: new Date().toISOString(),
      status: newReturn.status as 'submitted' | 'pending' | 'approved' || 'submitted'
    };

    onVATReturnsChange([...vatReturns, vatReturn]);
    setIsAddDialogOpen(false);
    setNewReturn({
      period: '',
      startDate: '',
      endDate: '',
      taxableSales: 0,
      zeroRatedSales: 0,
      exemptSales: 0,
      outputVAT: 0,
      inputVAT: 0,
      status: 'submitted'
    });
  };

  const handleDeleteReturn = (id: string) => {
    onVATReturnsChange(vatReturns.filter(r => r.id !== id));
  };

  const totalOutputVAT = vatReturns.reduce((sum, r) => sum + r.outputVAT, 0);
  const totalInputVAT = vatReturns.reduce((sum, r) => sum + r.inputVAT, 0);
  const netVAT = totalOutputVAT - totalInputVAT;
  const totalTaxableSales = vatReturns.reduce((sum, r) => sum + r.taxableSales, 0);

  const getStatusBadge = (status: VATReturn['status']) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-success/20 text-success border-success/30">Approved</Badge>;
      case 'pending':
        return <Badge className="bg-warning/20 text-warning border-warning/30">Pending</Badge>;
      default:
        return <Badge className="bg-primary/20 text-primary border-primary/30">Submitted</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-muted-foreground mb-1">Total Output VAT</p>
            <p className="text-2xl font-bold text-destructive">{formatCurrency(totalOutputVAT)}</p>
            <p className="text-xs text-muted-foreground">VAT collected on sales</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-muted-foreground mb-1">Total Input VAT</p>
            <p className="text-2xl font-bold text-success">{formatCurrency(totalInputVAT)}</p>
            <p className="text-xs text-muted-foreground">VAT paid on purchases</p>
          </CardContent>
        </Card>

        <Card className={cn(netVAT >= 0 ? 'border-destructive/30' : 'border-success/30')}>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-muted-foreground mb-1">Net VAT Position</p>
            <p className={cn("text-2xl font-bold", netVAT >= 0 ? 'text-destructive' : 'text-success')}>
              {formatCurrency(Math.abs(netVAT))}
            </p>
            <p className="text-xs text-muted-foreground">
              {netVAT >= 0 ? 'Payable to FTA' : 'Refundable from FTA'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-muted-foreground mb-1">Returns Submitted</p>
            <p className="text-2xl font-bold text-foreground">{vatReturns.length}</p>
            <p className="text-xs text-muted-foreground">periods covered</p>
          </CardContent>
        </Card>
      </div>

      {/* VAT Returns Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            VAT Returns
          </CardTitle>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Add VAT Return
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add VAT Return</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Period</Label>
                    <Input
                      placeholder="e.g., Q1 2024"
                      value={newReturn.period || ''}
                      onChange={(e) => setNewReturn({ ...newReturn, period: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={newReturn.status}
                      onValueChange={(value) => setNewReturn({ ...newReturn, status: value as VATReturn['status'] })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="submitted">Submitted</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={newReturn.startDate || ''}
                      onChange={(e) => setNewReturn({ ...newReturn, startDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={newReturn.endDate || ''}
                      onChange={(e) => setNewReturn({ ...newReturn, endDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Taxable Sales</Label>
                    <Input
                      type="number"
                      value={newReturn.taxableSales || ''}
                      onChange={(e) => setNewReturn({ ...newReturn, taxableSales: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Zero-Rated Sales</Label>
                    <Input
                      type="number"
                      value={newReturn.zeroRatedSales || ''}
                      onChange={(e) => setNewReturn({ ...newReturn, zeroRatedSales: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Output VAT</Label>
                    <Input
                      type="number"
                      value={newReturn.outputVAT || ''}
                      onChange={(e) => setNewReturn({ ...newReturn, outputVAT: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Input VAT</Label>
                    <Input
                      type="number"
                      value={newReturn.inputVAT || ''}
                      onChange={(e) => setNewReturn({ ...newReturn, inputVAT: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleAddReturn}>Add Return</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {vatReturns.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No VAT returns added yet</p>
              <p className="text-sm">Add your VAT returns to track and compare with bank turnover</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead className="text-right">Taxable Sales</TableHead>
                    <TableHead className="text-right">Output VAT</TableHead>
                    <TableHead className="text-right">Input VAT</TableHead>
                    <TableHead className="text-right">Net VAT</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vatReturns.map((vat) => (
                    <TableRow key={vat.id}>
                      <TableCell className="font-medium">{vat.period}</TableCell>
                      <TableCell>{new Date(vat.startDate).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(vat.endDate).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(vat.taxableSales)}</TableCell>
                      <TableCell className="text-right font-mono text-destructive">{formatCurrency(vat.outputVAT)}</TableCell>
                      <TableCell className="text-right font-mono text-success">{formatCurrency(vat.inputVAT)}</TableCell>
                      <TableCell className={cn(
                        "text-right font-mono font-semibold",
                        vat.netVAT >= 0 ? 'text-destructive' : 'text-success'
                      )}>
                        {formatCurrency(Math.abs(vat.netVAT))}
                        <span className="text-xs ml-1">
                          {vat.netVAT >= 0 ? '(Pay)' : '(Refund)'}
                        </span>
                      </TableCell>
                      <TableCell>{getStatusBadge(vat.status)}</TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteReturn(vat.id)}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow className="bg-muted/50 font-semibold">
                    <TableCell colSpan={3}>Total</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(totalTaxableSales)}</TableCell>
                    <TableCell className="text-right font-mono text-destructive">{formatCurrency(totalOutputVAT)}</TableCell>
                    <TableCell className="text-right font-mono text-success">{formatCurrency(totalInputVAT)}</TableCell>
                    <TableCell className={cn(
                      "text-right font-mono font-bold",
                      netVAT >= 0 ? 'text-destructive' : 'text-success'
                    )}>
                      {formatCurrency(Math.abs(netVAT))}
                    </TableCell>
                    <TableCell colSpan={2}></TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
