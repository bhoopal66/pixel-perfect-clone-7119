import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './ui/sheet';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  User, 
  Phone, 
  Mail, 
  Building2, 
  Calendar, 
  FileText, 
  CheckCircle,
  Clock,
  Upload,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LoanCase, LoanStatus, LoanDocument } from '../types/loanCase.types';
import { LENDERS } from '../types/loanCase.types';
import { CurrencyService } from '../services/currencyService';

interface LoanCaseDetailProps {
  loanCase: LoanCase | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (loanCase: LoanCase) => void;
  currency?: 'AED' | 'USD';
}

export const LoanCaseDetail: React.FC<LoanCaseDetailProps> = ({
  loanCase,
  open,
  onOpenChange,
  onUpdate,
  currency = 'AED'
}) => {
  if (!loanCase) return null;

  const formatCurrency = (value: number) => CurrencyService.format(value, currency);
  const lender = LENDERS[loanCase.lender];

  const handleStatusChange = (newStatus: LoanStatus) => {
    const updates: Partial<LoanCase> = {
      status: newStatus,
      updatedAt: new Date().toISOString()
    };

    if (newStatus === 'submitted' && !loanCase.submittedAt) {
      updates.submittedAt = new Date().toISOString();
    }
    if (newStatus === 'approved' && !loanCase.approvedAt) {
      updates.approvedAt = new Date().toISOString();
    }
    if (newStatus === 'disbursed' && !loanCase.disbursedAt) {
      updates.disbursedAt = new Date().toISOString();
    }

    onUpdate({ ...loanCase, ...updates });
  };

  const handleDocumentStatusChange = (docId: string, status: LoanDocument['status']) => {
    const updatedDocs = loanCase.documents.map(doc =>
      doc.id === docId ? { ...doc, status, uploadedAt: status === 'uploaded' ? new Date().toISOString() : doc.uploadedAt } : doc
    );
    onUpdate({ ...loanCase, documents: updatedDocs, updatedAt: new Date().toISOString() });
  };

  const getStatusIcon = (status: LoanDocument['status']) => {
    switch (status) {
      case 'verified': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'uploaded': return <Clock className="h-4 w-4 text-warning" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-destructive" />;
      default: return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle>Case {loanCase.caseNumber}</SheetTitle>
            <Badge variant="outline">{lender.name}</Badge>
          </div>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Status */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <Select value={loanCase.status} onValueChange={handleStatusChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="disbursed">Disbursed</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Applicant Info */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">Applicant</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{loanCase.applicantName}</span>
              </div>
              {loanCase.applicantPhone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{loanCase.applicantPhone}</span>
                </div>
              )}
              {loanCase.applicantEmail && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{loanCase.applicantEmail}</span>
                </div>
              )}
              {loanCase.companyName && (
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span>{loanCase.companyName}</span>
                </div>
              )}
              {loanCase.agentReference && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Agent Ref: </span>
                  <span className="font-medium">{loanCase.agentReference}</span>
                </div>
              )}
              {loanCase.analystName && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Analyst: </span>
                  <span className="font-medium">{loanCase.analystName}</span>
                </div>
              )}
              {loanCase.monthlySalary > 0 && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Salary: </span>
                  <span className="font-medium">{formatCurrency(loanCase.monthlySalary)}/mo</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Loan Details */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">Loan Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Loan Amount</p>
                <p className="text-lg font-bold">{formatCurrency(loanCase.loanAmount)}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Monthly EMI</p>
                <p className="text-lg font-bold text-primary">{formatCurrency(loanCase.emi)}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Tenure</p>
                <p className="font-medium">{loanCase.tenure} months</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Interest Rate</p>
                <p className="font-medium">{loanCase.interestRate}% p.a.</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Total Interest</p>
                <p className="font-medium text-destructive">{formatCurrency(loanCase.totalInterest)}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Total Payable</p>
                <p className="font-medium">{formatCurrency(loanCase.totalPayable)}</p>
              </div>
            </div>
            {loanCase.purpose && (
              <div className="text-sm">
                <span className="text-muted-foreground">Purpose: </span>
                <span className="capitalize">{loanCase.purpose.replace('_', ' ')}</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Documents */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">Required Documents</h3>
            <div className="space-y-2">
              {loanCase.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-2">
                    {getStatusIcon(doc.status)}
                    <span className="text-sm">{doc.name}</span>
                  </div>
                  <Select
                    value={doc.status}
                    onValueChange={(v) => handleDocumentStatusChange(doc.id, v as LoanDocument['status'])}
                  >
                    <SelectTrigger className="w-[120px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="uploaded">Uploaded</SelectItem>
                      <SelectItem value="verified">Verified</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Timeline */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">Timeline</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{new Date(loanCase.createdAt).toLocaleString()}</span>
              </div>
              {loanCase.submittedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Submitted</span>
                  <span>{new Date(loanCase.submittedAt).toLocaleString()}</span>
                </div>
              )}
              {loanCase.approvedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Approved</span>
                  <span>{new Date(loanCase.approvedAt).toLocaleString()}</span>
                </div>
              )}
              {loanCase.disbursedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Disbursed</span>
                  <span>{new Date(loanCase.disbursedAt).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {loanCase.notes && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground">Notes</h3>
                <p className="text-sm text-muted-foreground">{loanCase.notes}</p>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
