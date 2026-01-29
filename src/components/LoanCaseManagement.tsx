import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  FileText,
  Search,
  Filter,
  Building2,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight,
  Eye,
  Trash2,
  Calculator,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  FileSpreadsheet,
  LogOut
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { LoanCase, LoanStatus, LenderType, ProductType } from '../types/loanCase.types';
import { LENDERS } from '../types/loanCase.types';
import { LenderComparison } from './LenderComparison';
import { NewLoanCaseDialog } from './NewLoanCaseDialog';
import { LoanCaseDetail } from './LoanCaseDetail';
import { CurrencyService } from '../services/currencyService';
import { useAuth } from '@/hooks/useAuth';
import { exportToCSV, exportToExcel } from '@/services/exportService';
import { toast } from 'sonner';

interface LoanCaseManagementProps {
  currency?: 'AED' | 'USD';
}

export const LoanCaseManagement: React.FC<LoanCaseManagementProps> = ({ currency = 'AED' }) => {
  const { isAdmin, signOut, user } = useAuth();
  const [cases, setCases] = useState<LoanCase[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<LoanStatus | 'all'>('all');
  const [lenderFilter, setLenderFilter] = useState<LenderType | 'all'>('all');
  const [productFilter, setProductFilter] = useState<ProductType | 'all'>('all');
  const [showNewCaseDialog, setShowNewCaseDialog] = useState(false);
  const [selectedCase, setSelectedCase] = useState<LoanCase | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  
  // Sorting state
  type SortField = 'date' | 'amount' | 'status' | null;
  type SortDirection = 'asc' | 'desc';
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const formatCurrency = (value: number) => CurrencyService.format(value, currency);

  // Export handlers
  const handleExportCSV = () => {
    if (cases.length === 0) {
      toast.error('No cases to export');
      return;
    }
    setIsExporting(true);
    try {
      exportToCSV(cases, `loan_cases_${new Date().toISOString().split('T')[0]}.csv`);
      toast.success('CSV exported successfully');
    } catch (err) {
      toast.error('Failed to export CSV');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = async () => {
    if (cases.length === 0) {
      toast.error('No cases to export');
      return;
    }
    setIsExporting(true);
    try {
      await exportToExcel(cases, `loan_cases_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Excel file exported successfully');
    } catch (err) {
      toast.error('Failed to export Excel file');
    } finally {
      setIsExporting(false);
    }
  };

  // Status order for sorting
  const statusOrder: Record<LoanStatus, number> = {
    draft: 0,
    submitted: 1,
    under_review: 2,
    approved: 3,
    disbursed: 4,
    rejected: 5
  };

  // Handle sort toggle
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Sort icon component
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-3 w-3 ml-1" />
      : <ArrowDown className="h-3 w-3 ml-1" />;
  };

  // Filter and sort cases
  const filteredCases = useMemo(() => {
    let result = cases.filter(c => {
      const matchesSearch = 
        c.caseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.applicantName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
      const matchesLender = lenderFilter === 'all' || c.lender === lenderFilter;
      const matchesProduct = productFilter === 'all' || c.productType === productFilter;
      return matchesSearch && matchesStatus && matchesLender && matchesProduct;
    });

    // Apply sorting
    if (sortField) {
      result = [...result].sort((a, b) => {
        let comparison = 0;
        
        switch (sortField) {
          case 'date':
            comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            break;
          case 'amount':
            comparison = a.loanAmount - b.loanAmount;
            break;
          case 'status':
            comparison = statusOrder[a.status] - statusOrder[b.status];
            break;
        }
        
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return result;
  }, [cases, searchQuery, statusFilter, lenderFilter, productFilter, sortField, sortDirection]);

  // Statistics
  const stats = useMemo(() => ({
    total: cases.length,
    pending: cases.filter(c => ['draft', 'submitted', 'under_review'].includes(c.status)).length,
    approved: cases.filter(c => c.status === 'approved').length,
    disbursed: cases.filter(c => c.status === 'disbursed').length,
    rejected: cases.filter(c => c.status === 'rejected').length,
    totalAmount: cases.filter(c => c.status === 'disbursed').reduce((sum, c) => sum + c.loanAmount, 0),
    cashLoans: cases.filter(c => c.productType === 'cash').length,
    posLoans: cases.filter(c => c.productType === 'pos').length
  }), [cases]);

  const handleAddCase = (newCase: LoanCase) => {
    setCases(prev => [...prev, newCase]);
    setShowNewCaseDialog(false);
  };

  const handleUpdateCase = (updatedCase: LoanCase) => {
    setCases(prev => prev.map(c => c.id === updatedCase.id ? updatedCase : c));
    setSelectedCase(updatedCase);
  };

  const handleDeleteCase = (id: string) => {
    setCases(prev => prev.filter(c => c.id !== id));
    setSelectedCase(null);
  };

  const getStatusBadge = (status: LoanStatus) => {
    const styles: Record<LoanStatus, string> = {
      draft: 'bg-muted text-muted-foreground',
      submitted: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      under_review: 'bg-warning/20 text-warning',
      approved: 'bg-success/20 text-success',
      disbursed: 'bg-primary/20 text-primary',
      rejected: 'bg-destructive/20 text-destructive'
    };
    const labels: Record<LoanStatus, string> = {
      draft: 'Draft',
      submitted: 'Submitted',
      under_review: 'Under Review',
      approved: 'Approved',
      disbursed: 'Disbursed',
      rejected: 'Rejected'
    };
    return <Badge className={styles[status]}>{labels[status]}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cash Loans Case Management</h1>
          <p className="text-sm text-muted-foreground">
            Track and manage loan applications
            {isAdmin && <Badge variant="secondary" className="ml-2 text-[10px]">ADMIN</Badge>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Export Button - Available to all users */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2" disabled={isExporting || cases.length === 0}>
                <Download className="h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportCSV}>
                <FileText className="h-4 w-4 mr-2" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportExcel}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export as Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={() => setShowNewCaseDialog(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            New Loan Case
          </Button>
          <Button variant="ghost" size="icon" onClick={signOut} title="Sign out">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Cases</p>
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
                <p className="text-xs text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-warning">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-warning/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold text-success">{stats.approved}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-success/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Disbursed</p>
                <p className="text-2xl font-bold text-primary">{stats.disbursed}</p>
              </div>
              <Building2 className="h-8 w-8 text-primary/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div>
              <p className="text-xs text-muted-foreground">By Product Type</p>
              <div className="flex items-center gap-3 mt-1">
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">CASH</Badge>
                  <span className="text-lg font-bold">{stats.cashLoans}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">POS</Badge>
                  <span className="text-lg font-bold">{stats.posLoans}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div>
              <p className="text-xs text-muted-foreground">Total Disbursed</p>
              <p className="text-lg font-bold">{formatCurrency(stats.totalAmount)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="cases" className="w-full">
        <TabsList>
          <TabsTrigger value="cases">All Cases</TabsTrigger>
          <TabsTrigger value="compare">Compare Lenders</TabsTrigger>
        </TabsList>

        <TabsContent value="cases" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <CardTitle className="text-base">Loan Applications</CardTitle>
                <div className="flex flex-wrap gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search cases..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 w-[200px]"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as LoanStatus | 'all')}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="submitted">Submitted</SelectItem>
                      <SelectItem value="under_review">Under Review</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="disbursed">Disbursed</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={lenderFilter} onValueChange={(v) => setLenderFilter(v as LenderType | 'all')}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Lender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Lenders</SelectItem>
                      {(Object.keys(LENDERS) as LenderType[]).map(lenderId => (
                        <SelectItem key={lenderId} value={lenderId}>
                          {LENDERS[lenderId].name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={productFilter} onValueChange={(v) => setProductFilter(v as ProductType | 'all')}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Product" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="cash">Cash Loan</SelectItem>
                      <SelectItem value="pos">POS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredCases.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No loan cases yet</p>
                  <p className="text-sm">Click "New Loan Case" to create one</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Case #</TableHead>
                        <TableHead>Applicant</TableHead>
                        <TableHead>Lender</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead 
                          className="text-right cursor-pointer hover:bg-muted/50 select-none"
                          onClick={() => handleSort('amount')}
                        >
                          <div className="flex items-center justify-end">
                            Amount
                            <SortIcon field="amount" />
                          </div>
                        </TableHead>
                        <TableHead className="text-right">EMI</TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/50 select-none"
                          onClick={() => handleSort('status')}
                        >
                          <div className="flex items-center">
                            Status
                            <SortIcon field="status" />
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/50 select-none"
                          onClick={() => handleSort('date')}
                        >
                          <div className="flex items-center">
                            Date
                            <SortIcon field="date" />
                          </div>
                        </TableHead>
                        <TableHead className="text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCases.map((loanCase) => (
                        <TableRow key={loanCase.id} className="cursor-pointer hover:bg-muted/50">
                          <TableCell className="font-mono text-sm">{loanCase.caseNumber}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{loanCase.applicantName}</p>
                              <p className="text-xs text-muted-foreground">{loanCase.companyName}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="w-fit">{LENDERS[loanCase.lender].shortName}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={loanCase.productType === 'pos' ? 'secondary' : 'outline'} className="text-xs uppercase">
                              {loanCase.productType}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatCurrency(loanCase.loanAmount)}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatCurrency(loanCase.emi)}/mo
                          </TableCell>
                          <TableCell>{getStatusBadge(loanCase.status)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(loanCase.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setSelectedCase(loanCase)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteCase(loanCase.id)}
                                className="text-destructive hover:text-destructive"
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

        <TabsContent value="compare" className="mt-4">
          <LenderComparison currency={currency} />
        </TabsContent>
      </Tabs>

      {/* New Case Dialog */}
      <NewLoanCaseDialog
        open={showNewCaseDialog}
        onOpenChange={setShowNewCaseDialog}
        onSubmit={handleAddCase}
        currency={currency}
      />

      {/* Case Detail Sheet */}
      <LoanCaseDetail
        loanCase={selectedCase}
        open={!!selectedCase}
        onOpenChange={(open) => !open && setSelectedCase(null)}
        onUpdate={handleUpdateCase}
        currency={currency}
      />
    </div>
  );
};
