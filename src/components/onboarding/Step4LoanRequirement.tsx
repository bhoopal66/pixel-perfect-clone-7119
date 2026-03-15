import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from './FormField';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { LOAN_TYPES, TENURE_OPTIONS } from '@/types/onboarding.types';
import { MAX_LENGTHS } from '@/utils/validation';
import { FileText } from 'lucide-react';

export function Step4LoanRequirement() {
  const { formData, updateLoanRequirement } = useOnboarding();
  const lr = formData.loanRequirement;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Loan Requirement</CardTitle>
              <CardDescription>Tell us about your funding needs</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <FormField label="Loan Type" required>
              <Select
                value={lr.loanType}
                onValueChange={(value) => updateLoanRequirement({ loanType: value })}
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select loan type" />
                </SelectTrigger>
                <SelectContent>
                  {LOAN_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Required Loan Amount (AED)" required>
              <Input
                type="number"
                placeholder="e.g., 500000"
                value={lr.requiredLoanAmount || ''}
                onChange={(e) => updateLoanRequirement({ requiredLoanAmount: parseFloat(e.target.value) || 0 })}
                min="0"
                max="999999999"
                className="h-12"
              />
            </FormField>

            <FormField label="Purpose" required className="md:col-span-2">
              <div className="relative">
                <Textarea
                  placeholder="Describe the purpose of the loan (e.g., working capital, expansion, equipment purchase)"
                  value={lr.purpose}
                  onChange={(e) => updateLoanRequirement({ purpose: e.target.value })}
                  maxLength={MAX_LENGTHS.purpose}
                  rows={3}
                />
                <span className="absolute bottom-1.5 right-2 text-xs text-muted-foreground">
                  {lr.purpose.length}/{MAX_LENGTHS.purpose}
                </span>
              </div>
            </FormField>

            <FormField label="Preferred Tenure" required>
              <Select
                value={lr.preferredTenure}
                onValueChange={(value) => updateLoanRequirement({ preferredTenure: value })}
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select tenure" />
                </SelectTrigger>
                <SelectContent>
                  {TENURE_OPTIONS.map((tenure) => (
                    <SelectItem key={tenure} value={tenure}>
                      {tenure}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Urgent Funding Required?" required>
              <RadioGroup
                value={lr.urgentFunding === null ? '' : lr.urgentFunding ? 'yes' : 'no'}
                onValueChange={(value) => updateLoanRequirement({ urgentFunding: value === 'yes' })}
                className="flex gap-6 pt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="urgent-yes" />
                  <Label htmlFor="urgent-yes" className="cursor-pointer">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="urgent-no" />
                  <Label htmlFor="urgent-no" className="cursor-pointer">No</Label>
                </div>
              </RadioGroup>
            </FormField>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
