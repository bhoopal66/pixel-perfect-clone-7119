import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { 
  ClipboardCheck, 
  Building2, 
  Users, 
  Landmark, 
  FileText, 
  File, 
  Pencil,
  CheckCircle2
} from 'lucide-react';
import { format } from 'date-fns';

interface SummaryBlockProps {
  icon: React.ReactNode;
  title: string;
  step: number;
  children: React.ReactNode;
  onEdit: () => void;
}

function SummaryBlock({ icon, title, step, children, onEdit }: SummaryBlockProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <CardTitle className="text-base">{title}</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={onEdit} className="h-8">
            <Pencil className="h-3 w-3 mr-1" />
            Edit
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {children}
      </CardContent>
    </Card>
  );
}

function DataRow({ label, value }: { label: string; value: string | number | boolean | null | undefined }) {
  let displayValue = value;
  
  if (typeof value === 'boolean') {
    displayValue = value ? 'Yes' : 'No';
  } else if (value === null || value === undefined || value === '') {
    displayValue = '-';
  } else if (typeof value === 'number') {
    displayValue = value.toLocaleString();
  }

  return (
    <div className="flex justify-between py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right max-w-[60%]">{String(displayValue)}</span>
    </div>
  );
}

export function Step6Review() {
  const { 
    formData, 
    setCurrentStep, 
    setDeclarationConfirmed, 
    setAuthorizationConfirmed 
  } = useOnboarding();

  const { businessDetails, owners, bankingTurnover, loanRequirement, documents } = formData;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      return format(new Date(dateStr), 'dd MMM yyyy');
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <ClipboardCheck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Review & Submit</CardTitle>
              <CardDescription>Please review all information before submitting</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Step 1: Business Details */}
      <SummaryBlock
        icon={<Building2 className="h-4 w-4 text-primary" />}
        title="Business Details"
        step={1}
        onEdit={() => setCurrentStep(1)}
      >
        <div className="space-y-1">
          <DataRow label="Company Name" value={businessDetails.companyLegalName} />
          <DataRow label="Trade License No." value={businessDetails.tradeLicenseNo} />
          <DataRow label="Issuing Authority" value={businessDetails.licenseIssuingAuthority} />
          <DataRow label="TL Expiry Date" value={formatDate(businessDetails.tlExpiryDate)} />
          <DataRow label="Business Activity" value={businessDetails.businessActivity} />
          <DataRow label="Legal Structure" value={businessDetails.legalStructure} />
          <DataRow label="Year Established" value={businessDetails.yearOfEstablishment} />
          <DataRow label="Emirate" value={businessDetails.emirate} />
          <DataRow label="Ejari Available" value={businessDetails.ejariAvailable} />
        </div>
      </SummaryBlock>

      {/* Step 2: Owner Details */}
      <SummaryBlock
        icon={<Users className="h-4 w-4 text-primary" />}
        title="Owner / Partner Details"
        step={2}
        onEdit={() => setCurrentStep(2)}
      >
        <div className="space-y-4">
          {owners.map((owner, index) => (
            <div key={owner.id}>
              {index > 0 && <Separator className="my-3" />}
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="text-xs">Owner {index + 1}</Badge>
                <span className="font-medium text-sm">{owner.ownerName}</span>
              </div>
              <div className="space-y-1 text-sm">
                <DataRow label="Nationality" value={owner.nationality} />
                <DataRow label="Emirates ID" value={owner.emiratesId} />
                <DataRow label="Shareholding" value={`${owner.shareholdingPercent}%`} />
                <DataRow label="Mobile" value={owner.mobile} />
                <DataRow label="Email" value={owner.email} />
              </div>
            </div>
          ))}
        </div>
      </SummaryBlock>

      {/* Step 3: Banking & Turnover */}
      <SummaryBlock
        icon={<Landmark className="h-4 w-4 text-primary" />}
        title="Banking & Turnover"
        step={3}
        onEdit={() => setCurrentStep(3)}
      >
        <div className="space-y-1">
          <DataRow label="Primary Bank" value={bankingTurnover.primaryOperatingBank} />
          <DataRow label="Monthly Avg Turnover" value={`AED ${bankingTurnover.monthlyAvgTurnover.toLocaleString()}`} />
          <DataRow label="VAT Registered" value={bankingTurnover.vatRegistered} />
          {bankingTurnover.vatRegistered && (
            <DataRow label="Annual VAT Turnover" value={`AED ${bankingTurnover.annualVatTurnover?.toLocaleString()}`} />
          )}
          <DataRow label="POS Machine" value={bankingTurnover.posMachine} />
          {bankingTurnover.posMachine && (
            <DataRow label="POS Monthly Turnover" value={`AED ${bankingTurnover.posMonthlyTurnover?.toLocaleString()}`} />
          )}
          <DataRow label="Cash Intensive" value={bankingTurnover.cashIntensive} />
          <DataRow label="Sister Concern" value={bankingTurnover.sisterConcernExists} />
        </div>
      </SummaryBlock>

      {/* Step 4: Loan Requirement */}
      <SummaryBlock
        icon={<FileText className="h-4 w-4 text-primary" />}
        title="Loan Requirement"
        step={4}
        onEdit={() => setCurrentStep(4)}
      >
        <div className="space-y-1">
          <DataRow label="Loan Type" value={loanRequirement.loanType} />
          <DataRow label="Required Amount" value={`AED ${loanRequirement.requiredLoanAmount.toLocaleString()}`} />
          <DataRow label="Purpose" value={loanRequirement.purpose} />
          <DataRow label="Preferred Tenure" value={loanRequirement.preferredTenure} />
          <DataRow label="Urgent Funding" value={loanRequirement.urgentFunding} />
        </div>
      </SummaryBlock>

      {/* Step 5: Documents */}
      <SummaryBlock
        icon={<File className="h-4 w-4 text-primary" />}
        title="Uploaded Documents"
        step={5}
        onEdit={() => setCurrentStep(5)}
      >
        <div className="space-y-2">
          {documents.filter(d => d.status === 'completed').map((doc) => (
            <div key={doc.id} className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>{doc.fileName}</span>
            </div>
          ))}
          {documents.filter(d => d.status === 'completed').length === 0 && (
            <span className="text-muted-foreground text-sm">No documents uploaded</span>
          )}
        </div>
      </SummaryBlock>

      {/* Declaration */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6 space-y-4">
          <h4 className="font-semibold">Declaration</h4>
          
          <div className="flex items-start space-x-3">
            <Checkbox
              id="declaration"
              checked={formData.declarationConfirmed}
              onCheckedChange={(checked) => setDeclarationConfirmed(checked as boolean)}
            />
            <Label htmlFor="declaration" className="text-sm leading-relaxed cursor-pointer">
              I confirm that all information provided in this application is true, complete, and correct to the best of my knowledge. I understand that providing false information may result in the rejection of my application.
            </Label>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox
              id="authorization"
              checked={formData.authorizationConfirmed}
              onCheckedChange={(checked) => setAuthorizationConfirmed(checked as boolean)}
            />
            <Label htmlFor="authorization" className="text-sm leading-relaxed cursor-pointer">
              I authorize the sharing of my application and documents with partner banks and financial institutions for the purpose of loan processing and credit evaluation.
            </Label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
