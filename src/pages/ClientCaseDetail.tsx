import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ArrowLeft,
  Building2,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  Send,
  Download,
  MessageSquare,
  User
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

// Mock case detail data
const MOCK_CASE_DETAIL = {
  id: '1',
  caseId: 'BL-2024-001',
  companyName: 'Tech Solutions LLC',
  loanType: 'Term Loan',
  loanAmount: 500000,
  status: 'under_review',
  createdAt: '2024-01-10T08:00:00Z',
  updatedAt: '2024-01-15T10:30:00Z',
  submittedAt: '2024-01-12T14:00:00Z',
  documents: [
    { id: '1', name: 'Trade_License.pdf', type: 'trade_license', uploadedAt: '2024-01-11T10:00:00Z' },
    { id: '2', name: 'Owner_Passport_EID.pdf', type: 'owner_passport', uploadedAt: '2024-01-11T10:05:00Z' },
    { id: '3', name: 'Bank_Statements_6m.pdf', type: 'bank_statements', uploadedAt: '2024-01-11T10:10:00Z' },
    { id: '4', name: 'VAT_Certificate.pdf', type: 'vat_certificate', uploadedAt: '2024-01-11T10:15:00Z' }
  ],
  timeline: [
    {
      id: '1',
      type: 'status_change',
      title: 'Application Created',
      description: 'Started new loan application',
      timestamp: '2024-01-10T08:00:00Z',
      user: 'You'
    },
    {
      id: '2',
      type: 'document',
      title: 'Documents Uploaded',
      description: '4 documents uploaded successfully',
      timestamp: '2024-01-11T10:15:00Z',
      user: 'You'
    },
    {
      id: '3',
      type: 'status_change',
      title: 'Application Submitted',
      description: 'Submitted for bank review',
      timestamp: '2024-01-12T14:00:00Z',
      user: 'You'
    },
    {
      id: '4',
      type: 'message',
      title: 'Message from Relationship Manager',
      description: 'Your application is being reviewed. We may contact you for additional information.',
      timestamp: '2024-01-14T09:30:00Z',
      user: 'Ahmed Hassan (RM)'
    },
    {
      id: '5',
      type: 'status_change',
      title: 'Under Review',
      description: 'Credit team is reviewing your application',
      timestamp: '2024-01-15T10:30:00Z',
      user: 'System'
    }
  ]
};

const STATUS_STEPS = [
  { key: 'draft', label: 'Draft', icon: FileText },
  { key: 'submitted', label: 'Submitted', icon: Send },
  { key: 'under_review', label: 'Under Review', icon: Clock },
  { key: 'decision', label: 'Decision', icon: CheckCircle2 }
];

export default function ClientCaseDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  
  // In real app, fetch case by id
  const caseData = MOCK_CASE_DETAIL;

  const getCurrentStepIndex = (status: string) => {
    if (status === 'approved' || status === 'declined') return 3;
    const index = STATUS_STEPS.findIndex(s => s.key === status);
    return index >= 0 ? index : 0;
  };

  const currentStepIndex = getCurrentStepIndex(caseData.status);

  const getTimelineIcon = (type: string) => {
    switch (type) {
      case 'status_change': return <Clock className="h-4 w-4" />;
      case 'document': return <FileText className="h-4 w-4" />;
      case 'message': return <MessageSquare className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/client-cases')}
              className="gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <h1 className="text-lg font-semibold">{caseData.companyName}</h1>
              </div>
              <p className="text-sm text-muted-foreground">{caseData.caseId}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Status Tracker */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Application Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between relative">
              {/* Progress Line */}
              <div className="absolute top-5 left-0 right-0 h-1 bg-muted" />
              <div
                className="absolute top-5 left-0 h-1 bg-primary transition-all duration-500"
                style={{ width: `${(currentStepIndex / (STATUS_STEPS.length - 1)) * 100}%` }}
              />

              {STATUS_STEPS.map((step, index) => {
                const isCompleted = index < currentStepIndex;
                const isCurrent = index === currentStepIndex;
                const isDeclined = caseData.status === 'declined' && index === 3;
                const isApproved = caseData.status === 'approved' && index === 3;
                const StepIcon = step.icon;

                return (
                  <div key={step.key} className="flex flex-col items-center relative z-10">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center transition-all',
                        isCompleted && 'bg-primary text-primary-foreground',
                        isCurrent && !isDeclined && 'bg-primary text-primary-foreground ring-4 ring-primary/20',
                        isApproved && 'bg-primary text-primary-foreground',
                        isDeclined && 'bg-destructive text-destructive-foreground',
                        !isCompleted && !isCurrent && 'bg-muted text-muted-foreground'
                      )}
                    >
                      {isDeclined ? (
                        <XCircle className="h-5 w-5" />
                      ) : isCompleted || isApproved ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <StepIcon className="h-5 w-5" />
                      )}
                    </div>
                    <span
                      className={cn(
                        'mt-2 text-xs font-medium text-center',
                        isCurrent || isCompleted ? 'text-foreground' : 'text-muted-foreground'
                      )}
                    >
                      {isApproved ? 'Approved' : isDeclined ? 'Declined' : step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Loan Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Loan Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Loan Type</p>
                <p className="font-medium">{caseData.loanType}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Requested Amount</p>
                <p className="font-medium">AED {caseData.loanAmount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Submitted On</p>
                <p className="font-medium">
                  {caseData.submittedAt ? format(new Date(caseData.submittedAt), 'dd MMM yyyy') : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="font-medium">{format(new Date(caseData.updatedAt), 'dd MMM yyyy')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documents */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Uploaded Documents</CardTitle>
            <CardDescription>Documents submitted with your application</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {caseData.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Uploaded {format(new Date(doc.uploadedAt), 'dd MMM yyyy')}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Activity Timeline</CardTitle>
            <CardDescription>Track the progress of your application</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {caseData.timeline.slice().reverse().map((event, index) => (
                  <div key={event.id} className="flex gap-4">
                    <div className="relative">
                      <div className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center',
                        event.type === 'message' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' : 'bg-muted'
                      )}>
                        {getTimelineIcon(event.type)}
                      </div>
                      {index < caseData.timeline.length - 1 && (
                        <div className="absolute top-8 left-1/2 -translate-x-1/2 w-px h-8 bg-border" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm">{event.title}</p>
                          <p className="text-sm text-muted-foreground mt-0.5">{event.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span>{event.user}</span>
                        <span>•</span>
                        <span>{format(new Date(event.timestamp), 'dd MMM yyyy, HH:mm')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
