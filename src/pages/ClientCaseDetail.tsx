import { useParams } from 'react-router-dom';
import { useNavigateOnce } from '@/hooks/useNavigateOnce';
import { useState, useEffect } from 'react';
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
  User,
  Loader2,
  Landmark,
  Users,
  Calculator,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  getOnboardingCase,
  loadCompleteFormData,
  type OnboardingCase,
} from '@/services/onboardingService';
import { supabase } from '@/integrations/supabase/client';
import type { OnboardingFormData } from '@/types/onboarding.types';

const STATUS_STEPS = [
  { key: 'draft', label: 'Draft', icon: FileText },
  { key: 'in_process', label: 'In Process', icon: Send },
  { key: 'under_review', label: 'Under Review', icon: Clock },
  { key: 'decision', label: 'Decision', icon: CheckCircle2 }
];

export default function ClientCaseDetail() {
  const navigate = useNavigateOnce();
  const { id } = useParams<{ id: string }>();
  const [caseData, setCaseData] = useState<OnboardingCase | null>(null);
  const [formData, setFormData] = useState<OnboardingFormData | null>(null);
  const [eligibility, setEligibility] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!id) return;
      setIsLoading(true);
      const [caseResult, formResult] = await Promise.all([
        getOnboardingCase(id),
        loadCompleteFormData(id),
      ]);
      setCaseData(caseResult);
      setFormData(formResult);

      // Load eligibility data
      const { data: eligData } = await supabase
        .from('onboarding_eligibility')
        .select('*')
        .eq('case_id', id)
        .order('created_at', { ascending: false });
      setEligibility(eligData || []);

      setIsLoading(false);
    }
    load();
  }, [id]);

  const getCurrentStepIndex = (status: string) => {
    if (status === 'approved' || status === 'declined') return 3;
    if (status === 'eligible' || status === 'not_eligible') return 2;
    if (status === 'in_process' || status === 'submitted' || status === 'to_submit') return 1;
    return 0;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <FileText className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Case not found</h2>
        <Button variant="outline" onClick={() => navigate('/client-cases')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Cases
        </Button>
      </div>
    );
  }

  const currentStepIndex = getCurrentStepIndex(caseData.status);
  const bd = formData?.businessDetails;
  const owners = formData?.owners || [];
  const bt = formData?.bankingTurnover;
  const lr = formData?.loanRequirement;
  const docs = formData?.documents.filter(d => d.status === 'completed') || [];

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
                <h1 className="text-lg font-semibold">{bd?.companyLegalName || 'Unnamed Company'}</h1>
              </div>
              <p className="text-sm text-muted-foreground">{caseData.case_number || caseData.id}</p>
            </div>
            <Badge variant="outline" className="capitalize">{caseData.status.replace(/_/g, ' ')}</Badge>
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
                    <div className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center transition-all',
                      isCompleted && 'bg-primary text-primary-foreground',
                      isCurrent && !isDeclined && 'bg-primary text-primary-foreground ring-4 ring-primary/20',
                      isApproved && 'bg-primary text-primary-foreground',
                      isDeclined && 'bg-destructive text-destructive-foreground',
                      !isCompleted && !isCurrent && 'bg-muted text-muted-foreground'
                    )}>
                      {isDeclined ? <XCircle className="h-5 w-5" /> :
                       isCompleted || isApproved ? <CheckCircle2 className="h-5 w-5" /> :
                       <StepIcon className="h-5 w-5" />}
                    </div>
                    <span className={cn(
                      'mt-2 text-xs font-medium text-center',
                      isCurrent || isCompleted ? 'text-foreground' : 'text-muted-foreground'
                    )}>
                      {isApproved ? 'Approved' : isDeclined ? 'Declined' : step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Loan Summary */}
        {lr && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Loan Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Loan Type</p>
                  <p className="font-medium">{lr.loanType || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Requested Amount</p>
                  <p className="font-medium">
                    {lr.requiredLoanAmount > 0 ? `AED ${lr.requiredLoanAmount.toLocaleString()}` : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Purpose</p>
                  <p className="font-medium break-words">{lr.purpose || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Preferred Tenure</p>
                  <p className="font-medium">{lr.preferredTenure || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Submitted On</p>
                  <p className="font-medium">
                    {caseData.submitted_at ? format(new Date(caseData.submitted_at), 'dd MMM yyyy') : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="font-medium">{format(new Date(caseData.updated_at), 'dd MMM yyyy')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Business Details */}
        {bd && bd.companyLegalName && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">Business Details</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Company Name</p>
                  <p className="font-medium break-words">{bd.companyLegalName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Trade License No.</p>
                  <p className="font-medium">{bd.tradeLicenseNo || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Business Activity</p>
                  <p className="font-medium">{bd.businessActivity || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Legal Structure</p>
                  <p className="font-medium">{bd.legalStructure || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Emirate</p>
                  <p className="font-medium">{bd.emirate || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Year Established</p>
                  <p className="font-medium">{bd.yearOfEstablishment || '—'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Owners */}
        {owners.length > 0 && owners[0].ownerName && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">Owners / Partners</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {owners.filter(o => o.ownerName).map((owner, index) => (
                  <div key={owner.id}>
                    {index > 0 && <Separator className="my-3" />}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">Name</p>
                        <p className="font-medium break-words">{owner.ownerName}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Shareholding</p>
                        <p className="font-medium">{owner.shareholdingPercent}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Nationality</p>
                        <p className="font-medium">{owner.nationality || '—'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Contact</p>
                        <p className="font-medium break-words">{owner.email || '—'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Banking & Turnover */}
        {bt && bt.primaryOperatingBank && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Landmark className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">Banking & Turnover</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Primary Bank</p>
                  <p className="font-medium">{bt.primaryOperatingBank}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Monthly Avg Turnover</p>
                  <p className="font-medium">AED {bt.monthlyAvgTurnover.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">VAT Registered</p>
                  <p className="font-medium">{bt.vatRegistered ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">POS Machine</p>
                  <p className="font-medium">{bt.posMachine ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Documents */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Uploaded Documents</CardTitle>
            <CardDescription>Documents submitted with your application</CardDescription>
          </CardHeader>
          <CardContent>
            {docs.length > 0 ? (
              <div className="space-y-2">
                {docs.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{doc.fileName}</p>
                        <p className="text-xs text-muted-foreground capitalize">{doc.type.replace(/_/g, ' ')}</p>
                      </div>
                    </div>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No documents uploaded yet</p>
            )}
          </CardContent>
        </Card>

        {/* Dates */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Case Created</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(caseData.created_at), 'dd MMM yyyy, HH:mm')}
                  </p>
                </div>
              </div>
              {caseData.submitted_at && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Send className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Application Submitted</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(caseData.submitted_at), 'dd MMM yyyy, HH:mm')}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Last Updated</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(caseData.updated_at), 'dd MMM yyyy, HH:mm')}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
