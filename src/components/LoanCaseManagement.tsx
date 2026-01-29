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
  Calculator
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { cn } from '@/lib/utils';
import type { LoanCase, LoanStatus, LenderType } from '../types/loanCase.types';
import { LENDERS } from '../types/loanCase.types';
import { LenderComparison } from './LenderComparison';
import { NewLoanCaseDialog } from './NewLoanCaseDialog';
import { LoanCaseDetail } from './LoanCaseDetail';
import { CurrencyService } from '../services/currencyService';

interface LoanCaseManagementProps {
  currency?: 'AED' | 'USD';
}

export const LoanCaseManagement: React.FC<LoanCaseManagementProps> = ({ currency = 'AED' }) => {
  const [cases, setCases] = useState<LoanCase[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<LoanStatus | 'all'>('all');
  const [lenderFilter, setLenderFilter] = useState<LenderType | 'all'>('all');
  const [showNewCaseDialog, setShowNewCaseDialog] = useState(false);
  const [selectedCase, setSelectedCase] = useState<LoanCase | null>(null);

  const formatCurrency = (value: number) => CurrencyService.format(value, currency);

  // Filter cases
  const filteredCases = useMemo(() => {
    return cases.filter(c => {
      const matchesSearch = 
        c.caseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.applicantName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
      const matchesLender = lenderFilter === 'all' || c.lender === lenderFilter;
      return matchesSearch && matchesStatus && matchesLender;
    });
  }, [cases, searchQuery, statusFilter, lenderFilter]);

  // Statistics
  const stats = useMemo(() => ({
    total: cases.length,
    pending: cases.filter(c => ['draft', 'submitted', 'under_review'].includes(c.status)).length,
    approved: cases.filter(c => c.status === 'approved').length,
    disbursed: cases.filter(c => c.status === 'disbursed').length,
    rejected: cases.filter(c => c.status === 'rejected').length,
    totalAmount: cases.filter(c => c.status === 'disbursed').reduce((sum, c) => sum + c.loanAmount, 0)
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
          <p className="text-sm text-muted-foreground">Track and manage loan applications</p>
        </div>
        <Button onClick={() => setShowNewCaseDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Loan Case
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
        <Card className="col-span-2 md:col-span-1">
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
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">EMI</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
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
                              <p className="text-xs text-muted-foreground">{loanCase.employer}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <Badge variant="outline" className="w-fit">{LENDERS[loanCase.lender].shortName}</Badge>
                              <span className="text-[10px] text-muted-foreground mt-0.5 uppercase">{loanCase.productType}</span>
                            </div>
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
