import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from './FormField';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { EMIRATES, LEGAL_STRUCTURES } from '@/types/onboarding.types';
import { MAX_LENGTHS } from '@/utils/validation';
import { Building2 } from 'lucide-react';

export function Step1BusinessDetails() {
  const { formData, updateBusinessDetails } = useOnboarding();
  const bd = formData.businessDetails;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Business Details</CardTitle>
              <CardDescription>Enter your company information as per Trade License</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <FormField label="Company Legal Name" required>
              <Input
                placeholder="Enter company name"
                value={bd.companyLegalName}
                onChange={(e) => updateBusinessDetails({ companyLegalName: e.target.value })}
                maxLength={MAX_LENGTHS.companyName}
                className="h-12"
              />
            </FormField>

            <FormField label="Trade License No." required>
              <Input
                placeholder="e.g., 123456"
                value={bd.tradeLicenseNo}
                onChange={(e) => updateBusinessDetails({ tradeLicenseNo: e.target.value })}
                maxLength={MAX_LENGTHS.tradeLicenseNo}
                className="h-12"
              />
            </FormField>

            <FormField label="License Issuing Authority" required>
              <Input
                placeholder="e.g., DED, DMCC, JAFZA"
                value={bd.licenseIssuingAuthority}
                onChange={(e) => updateBusinessDetails({ licenseIssuingAuthority: e.target.value })}
                maxLength={MAX_LENGTHS.licenseAuthority}
                className="h-12"
              />
            </FormField>

            <FormField label="TL Expiry Date" required>
              <Input
                type="date"
                value={bd.tlExpiryDate}
                onChange={(e) => updateBusinessDetails({ tlExpiryDate: e.target.value })}
                className="h-12"
              />
            </FormField>

            <FormField label="Business Activity" required className="md:col-span-2">
              <Input
                placeholder="Main business activity as per license"
                value={bd.businessActivity}
                onChange={(e) => updateBusinessDetails({ businessActivity: e.target.value })}
                maxLength={MAX_LENGTHS.businessActivity}
                className="h-12"
              />
            </FormField>

            <FormField label="Legal Structure" required>
              <Select
                value={bd.legalStructure}
                onValueChange={(value) => updateBusinessDetails({ legalStructure: value })}
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select legal structure" />
                </SelectTrigger>
                <SelectContent>
                  {LEGAL_STRUCTURES.map((structure) => (
                    <SelectItem key={structure} value={structure}>
                      {structure}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Year of Establishment" required>
              <Input
                type="number"
                placeholder="e.g., 2020"
                min="1900"
                max={new Date().getFullYear()}
                value={bd.yearOfEstablishment}
                onChange={(e) => updateBusinessDetails({ yearOfEstablishment: e.target.value })}
                className="h-12"
              />
            </FormField>

            <FormField label="Office Address" required className="md:col-span-2">
              <div className="relative">
                <Textarea
                  placeholder="Full office address including building, street, area"
                  value={bd.officeAddress}
                  onChange={(e) => updateBusinessDetails({ officeAddress: e.target.value })}
                  maxLength={MAX_LENGTHS.address}
                  rows={3}
                />
                <span className="absolute bottom-1.5 right-2 text-xs text-muted-foreground">
                  {bd.officeAddress.length}/{MAX_LENGTHS.address}
                </span>
              </div>
            </FormField>

            <FormField label="Emirate" required>
              <Select
                value={bd.emirate}
                onValueChange={(value) => updateBusinessDetails({ emirate: value })}
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select emirate" />
                </SelectTrigger>
                <SelectContent>
                  {EMIRATES.map((emirate) => (
                    <SelectItem key={emirate} value={emirate}>
                      {emirate}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Ejari Available?" required>
              <RadioGroup
                value={bd.ejariAvailable === null ? '' : bd.ejariAvailable ? 'yes' : 'no'}
                onValueChange={(value) => updateBusinessDetails({ ejariAvailable: value === 'yes' })}
                className="flex gap-6 pt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="ejari-yes" />
                  <Label htmlFor="ejari-yes" className="cursor-pointer">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="ejari-no" />
                  <Label htmlFor="ejari-no" className="cursor-pointer">No</Label>
                </div>
              </RadioGroup>
            </FormField>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
