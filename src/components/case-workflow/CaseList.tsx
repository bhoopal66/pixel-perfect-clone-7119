import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { 
  Plus, 
  Search, 
  RefreshCw, 
  Pencil, 
  Trash2,
  Building2,
  CreditCard,
  FileText,
  Download,
  FileSpreadsheet,
  FileDown,
  Hash,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CalendarIcon,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { CurrencyService } from '@/services/currencyService';
import { CaseService } from '@/services/caseService';
import { exportCasesToCSV, exportCasesToExcel } from '@/services/caseExportService';
import { 
  STATUS_CONFIG, 
  PRODUCT_TYPE_LABELS, 
  isPOSProduct,
  getEligibilityStatusColor 
} from '@/types/case.types';
import { useAuth } from '@/hooks/useAuth';
import type { Case, EligibilityStatus } from '@/types/case.types';

type SortDirection = 'asc' | 'desc' | null;

interface CaseListProps {
  onNewCase: () => void;
  onEditCase: (id: string) => void;
}

export const CaseList: React.FC<CaseListProps> = ({ onNewCase, onEditCase }) => {
  const { isAdmin } = useAuth();
  const [cases, setCases] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [caseNumberFilter, setCaseNumberFilter] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [caseNumberSort, setCaseNumberSort] = useState<SortDirection>(null);
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  const formatCurrency = (value: number) => CurrencyService.format(value, 'AED');

  const loadCases = async () => {
    setIsLoading(true);
    try {
      const data = await CaseService.getAll();
      setCases(data);
    } catch (error) {
      console.error('Failed to load cases:', error);
      toast.error('Failed to load cases');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCases();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this case?')) return;
    try {
      await CaseService.delete(id);
      toast.success('Case deleted');
      loadCases();
    } catch (error) {
      console.error('Failed to delete case:', error);
      toast.error('Failed to delete case');
    }
  };

  const handleExportCSV = () => {
    if (cases.length === 0) {
      toast.error('No cases to export');
      return;
    }
    const filename = `cases_${new Date().toISOString().split('T')[0]}.csv`;
    exportCasesToCSV(cases, filename);
    toast.success('CSV exported successfully');
  };

  const handleExportExcel = async () => {
    if (cases.length === 0) {
      toast.error('No cases to export');
      return;
    }
    setIsExporting(true);
    try {
      const filename = `cases_${new Date().toISOString().split('T')[0]}.xlsx`;
      await exportCasesToExcel(cases, filename);
      toast.success('Excel exported successfully');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export Excel');
    } finally {
      setIsExporting(false);
    }
  };

  const toggleCaseNumberSort = () => {
    setCaseNumberSort(prev => {
      if (prev === null) return 'asc';
      if (prev === 'asc') return 'desc';
      return null;
    });
  };

  const filteredCases = cases
    .filter(c => {
      const matchesSearch = 
        c.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.bank_name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCaseNumber = !caseNumberFilter || 
        (c.case_number && c.case_number.toLowerCase().includes(caseNumberFilter.toLowerCase()));
      
      const caseDate = new Date(c.created_at);
      const matchesDateFrom = !dateFrom || caseDate >= dateFrom;
      const matchesDateTo = !dateTo || caseDate <= new Date(dateTo.getTime() + 24 * 60 * 60 * 1000 - 1);
      
      return matchesSearch && matchesCaseNumber && matchesDateFrom && matchesDateTo;
    })
    .sort((a, b) => {
      if (caseNumberSort === null) return 0;
      const aNum = a.case_number || '';
      const bNum = b.case_number || '';
      const comparison = aNum.localeCompare(bNum, undefined, { numeric: true });
      return caseNumberSort === 'asc' ? comparison : -comparison;
    });

  // Stats
  const stats = {
    total: cases.length,
    draft: cases.filter(c => c.status === 'Draft').length,
    completed: cases.filter(c => c.status === 'Eligibility Completed').length,
    totalAmount: cases.reduce((sum, c) => sum + c.eligible_loan_amount, 0)
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Case Management</h1>
          <p className="text-sm text-muted-foreground">
            Unified workflow for bank statement analysis and loan eligibility
          </p>
        </div>
        <div className="flex gap-2">
          {/* Export Button - Admin Only */}
          {isAdmin && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={isExporting || cases.length === 0}>
                  <Download className={cn("mr-2 h-4 w-4", isExporting && "animate-spin")} />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportCSV}>
                  <FileDown className="mr-2 h-4 w-4" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportExcel}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Export as Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button onClick={onNewCase}>
            <Plus className="mr-2 h-4 w-4" />
            New Case
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                <p className="text-xs text-muted-foreground">Draft</p>
                <p className="text-2xl font-bold text-muted-foreground">{stats.draft}</p>
              </div>
              <Pencil className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-success">{stats.completed}</p>
              </div>
              <FileText className="h-8 w-8 text-success/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div>
              <p className="text-xs text-muted-foreground">Total Eligible</p>
              <p className="text-lg font-bold">{formatCurrency(stats.totalAmount)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Case Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="text-base">All Cases</CardTitle>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Case number..."
                  className="pl-9 w-[160px] font-mono text-sm"
                  value={caseNumberFilter}
                  onChange={(e) => setCaseNumberFilter(e.target.value)}
                />
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Client or bank..."
                  className="pl-9 w-[180px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon" onClick={loadCases}>
                <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[130px] justify-start text-left font-normal text-xs",
                      !dateFrom && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-1 h-3 w-3" />
                    {dateFrom ? format(dateFrom, "MMM d, yyyy") : "From"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[130px] justify-start text-left font-normal text-xs",
                      !dateTo && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-1 h-3 w-3" />
                    {dateTo ? format(dateTo, "MMM d, yyyy") : "To"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              {(dateFrom || dateTo) && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => { setDateFrom(undefined); setDateTo(undefined); }}
                  title="Clear date filter"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredCases.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No cases found</p>
              <p className="text-sm">Create a new case to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 select-none"
                      onClick={toggleCaseNumberSort}
                    >
                      <div className="flex items-center gap-1">
                        Case #
                        {caseNumberSort === null && <ArrowUpDown className="h-3 w-3 text-muted-foreground" />}
                        {caseNumberSort === 'asc' && <ArrowUp className="h-3 w-3" />}
                        {caseNumberSort === 'desc' && <ArrowDown className="h-3 w-3" />}
                      </div>
                    </TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Bank</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Eligibility</TableHead>
                    <TableHead className="text-right">Loan Amount</TableHead>
                    <TableHead className="text-right">Created</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCases.map((caseItem) => (
                    <TableRow key={caseItem.id}>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {caseItem.case_number || '—'}
                      </TableCell>
                      <TableCell className="font-medium">{caseItem.client_name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Building2 className="h-3 w-3 text-muted-foreground" />
                          {caseItem.bank_name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-xs",
                            isPOSProduct(caseItem.product_type) && "border-primary/50 bg-primary/5"
                          )}
                        >
                          {isPOSProduct(caseItem.product_type) && (
                            <CreditCard className="h-3 w-3 mr-1" />
                          )}
                          {PRODUCT_TYPE_LABELS[caseItem.product_type] || caseItem.product_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={STATUS_CONFIG[caseItem.status]?.color || 'bg-muted'}>
                          {caseItem.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {caseItem.eligibility_status !== 'Pending' && (
                          <Badge className={getEligibilityStatusColor(caseItem.eligibility_status as EligibilityStatus)}>
                            {caseItem.eligibility_status}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {caseItem.eligible_loan_amount > 0 
                          ? formatCurrency(caseItem.eligible_loan_amount)
                          : '—'
                        }
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {new Date(caseItem.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEditCase(caseItem.id)}
                            title="Edit case"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(caseItem.id)}
                              className="text-destructive hover:text-destructive"
                              title="Delete case"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
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
    </div>
  );
};
