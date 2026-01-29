import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Plus, 
  Download, 
  Trash2, 
  Filter, 
  RefreshCw,
  Calculator,
  CheckCircle,
  CreditCard,
  XCircle,
  AlertCircle,
  FileText,
  Pencil
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { CurrencyService } from '@/services/currencyService';
import { LoanEligibilityService } from '@/services/loanEligibilityService';
import { LoanEligibilityForm } from './LoanEligibilityForm';
import type { 
  LoanEligibility, 
  LoanEligibilityInput, 
  EligibilityFilters,
  EligibilityStatus,
  VarianceBucket,
  ProductType
} from '@/types/loanEligibility.types';
import { getStatusColor, getBucketColor, PRODUCT_TYPE_LABELS, isPOSProduct } from '@/types/loanEligibility.types';

interface LoanEligibilityDashboardProps {
  currency?: 'AED' | 'USD';
}

export const LoanEligibilityDashboard: React.FC<LoanEligibilityDashboardProps> = ({ 
  currency = 'AED' 
}) => {
  const [records, setRecords] = useState<LoanEligibility[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingRecord, setEditingRecord] = useState<LoanEligibility | null>(null);
  const [activeTab, setActiveTab] = useState('calculator');
  const [filters, setFilters] = useState<EligibilityFilters>({
    eligibility_status: 'all',
    variance_bucket: 'all',
    product_type: 'all'
  });

  const formatCurrency = (value: number) => CurrencyService.format(value, currency);

  // Load records
  const loadRecords = async () => {
    setIsLoading(true);
    try {
      const data = await LoanEligibilityService.getAll(filters);
      setRecords(data);
    } catch (error) {
      console.error('Failed to load records:', error);
      toast.error('Failed to load eligibility records');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, [filters]);

  // Create or update record
  const handleSubmit = async (input: LoanEligibilityInput): Promise<LoanEligibility> => {
    setIsSaving(true);
    try {
      let result: LoanEligibility;
      if (editingRecord) {
        result = await LoanEligibilityService.update(editingRecord.id, input);
        toast.success('Eligibility record updated');
        setEditingRecord(null);
      } else {
        result = await LoanEligibilityService.create(input);
        toast.success('Eligibility record saved');
      }
      loadRecords();
      return result;
    } catch (error) {
      console.error('Failed to save record:', error);
      toast.error('Failed to save eligibility record');
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  // Edit record
  const handleEdit = (record: LoanEligibility) => {
    setEditingRecord(record);
    setActiveTab('calculator');
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingRecord(null);
  };

  // Delete record
  const handleDelete = async (id: string) => {
    try {
      await LoanEligibilityService.delete(id);
      toast.success('Record deleted');
      loadRecords();
    } catch (error) {
      console.error('Failed to delete record:', error);
      toast.error('Failed to delete record');
    }
  };

  // Export to CSV
  const handleExport = () => {
    const csvData = LoanEligibilityService.exportToCSV(records);
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `loan-eligibility-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('Export downloaded');
  };

  // Stats
  const stats = useMemo(() => {
    const eligible = records.filter(r => r.eligibility_status === 'Eligible').length;
    const reduced = records.filter(r => r.eligibility_status === 'Eligible (Reduced)').length;
    const notEligible = records.filter(r => r.eligibility_status === 'Not Eligible').length;
    const totalAmount = records.reduce((sum, r) => sum + r.eligible_loan_amount, 0);
    const standard = records.filter(r => r.product_type === 'standard').length;
    const pos = records.filter(r => isPOSProduct(r.product_type)).length;
    
    return { eligible, reduced, notEligible, total: records.length, totalAmount, standard, pos };
  }, [records]);

  const getStatusBadge = (status: EligibilityStatus) => {
    const color = getStatusColor(status);
    const styles: Record<string, string> = {
      success: 'bg-success/20 text-success',
      warning: 'bg-warning/20 text-warning',
      destructive: 'bg-destructive/20 text-destructive',
      muted: 'bg-muted text-muted-foreground'
    };
    return <Badge className={styles[color]}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Loan Eligibility</h1>
          <p className="text-sm text-muted-foreground">Calculate and track loan eligibility based on turnover variance</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Records</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Standard</p>
                <p className="text-2xl font-bold">{stats.standard}</p>
              </div>
              <Calculator className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">POS Loans</p>
                <p className="text-2xl font-bold text-primary">{stats.pos}</p>
              </div>
              <CreditCard className="h-8 w-8 text-primary/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Eligible</p>
                <p className="text-2xl font-bold text-success">{stats.eligible}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-success/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Reduced</p>
                <p className="text-2xl font-bold text-warning">{stats.reduced}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-warning/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Not Eligible</p>
                <p className="text-2xl font-bold text-destructive">{stats.notEligible}</p>
              </div>
              <XCircle className="h-8 w-8 text-destructive/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div>
              <p className="text-xs text-muted-foreground">Total Eligible Amount</p>
              <p className="text-lg font-bold">{formatCurrency(stats.totalAmount)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="calculator">
            <Calculator className="h-4 w-4 mr-2" />
            {editingRecord ? 'Edit Record' : 'Calculator'}
          </TabsTrigger>
          <TabsTrigger value="records">
            <FileText className="h-4 w-4 mr-2" />
            Records ({records.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calculator" className="mt-4">
          <LoanEligibilityForm 
            onSubmit={handleSubmit} 
            initialData={editingRecord || undefined}
            isLoading={isSaving}
            currency={currency}
            onCancel={editingRecord ? handleCancelEdit : undefined}
          />
        </TabsContent>

        <TabsContent value="records" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <CardTitle className="text-base">Eligibility Records</CardTitle>
                <div className="flex flex-wrap gap-2">
                  <Select 
                    value={filters.eligibility_status || 'all'} 
                    onValueChange={(v) => setFilters(prev => ({ 
                      ...prev, 
                      eligibility_status: v as EligibilityStatus | 'all' 
                    }))}
                  >
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border shadow-lg z-50">
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="Eligible">Eligible</SelectItem>
                      <SelectItem value="Eligible (Reduced)">Eligible (Reduced)</SelectItem>
                      <SelectItem value="Not Eligible">Not Eligible</SelectItem>
                      <SelectItem value="Insufficient Data">Insufficient Data</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select 
                    value={filters.variance_bucket || 'all'} 
                    onValueChange={(v) => setFilters(prev => ({ 
                      ...prev, 
                      variance_bucket: v as VarianceBucket | 'all' 
                    }))}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Variance" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border shadow-lg z-50">
                      <SelectItem value="all">All Buckets</SelectItem>
                      <SelectItem value="<=10%">≤10%</SelectItem>
                      <SelectItem value="11%-25%">11%-25%</SelectItem>
                      <SelectItem value=">25%">&gt;25%</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select 
                    value={filters.product_type || 'all'} 
                    onValueChange={(v) => setFilters(prev => ({ 
                      ...prev, 
                      product_type: v as ProductType | 'all' 
                    }))}
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Product Type" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border shadow-lg z-50">
                      <SelectItem value="all">All Products</SelectItem>
                      <SelectItem value="standard">Standard Loan</SelectItem>
                      <SelectItem value="rak_pos">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-3.5 w-3.5" />
                          RAK POS Loan
                        </div>
                      </SelectItem>
                      <SelectItem value="wio_pos">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-3.5 w-3.5" />
                          WIO POS Loan
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      className="w-[140px]"
                      placeholder="From"
                      onChange={(e) => setFilters(prev => ({ 
                        ...prev, 
                        date_from: e.target.value || undefined 
                      }))}
                    />
                    <Input
                      type="date"
                      className="w-[140px]"
                      placeholder="To"
                      onChange={(e) => setFilters(prev => ({ 
                        ...prev, 
                        date_to: e.target.value || undefined 
                      }))}
                    />
                  </div>
                  <Button variant="outline" size="icon" onClick={loadRecords}>
                    <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                  </Button>
                  <Button variant="outline" onClick={handleExport} disabled={records.length === 0}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {records.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No eligibility records yet</p>
                  <p className="text-sm">Use the Calculator tab to create one</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">VAT Turnover</TableHead>
                        <TableHead className="text-right">Declared</TableHead>
                        <TableHead className="text-right">Adjusted</TableHead>
                        <TableHead className="text-right">Variance</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Eligible Amount</TableHead>
                        <TableHead className="text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {records.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(record.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "text-xs",
                                isPOSProduct(record.product_type) && "border-primary/50 bg-primary/5"
                              )}
                            >
                              {isPOSProduct(record.product_type) && (
                                <CreditCard className="h-3 w-3 mr-1" />
                              )}
                              {PRODUCT_TYPE_LABELS[record.product_type] || record.product_type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatCurrency(record.vat_turnover)}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatCurrency(record.declared_turnover)}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatCurrency(record.adjusted_turnover)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <span className="font-mono">{record.variance_percent}%</span>
                              <Badge className={getBucketColor(record.variance_bucket)}>
                                {record.variance_bucket}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(record.eligibility_status)}</TableCell>
                          <TableCell className="text-right font-mono font-semibold">
                            {formatCurrency(record.eligible_loan_amount)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(record)}
                                title="Edit record"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(record.id)}
                                className="text-destructive hover:text-destructive"
                                title="Delete record"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
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
    </div>
  );
};
