import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FormField } from './FormField';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { UAE_BANKS } from '@/types/onboarding.types';
import { Landmark, Info } from 'lucide-react';

export function Step3BankingTurnover() {
  const { formData, updateBankingTurnover } = useOnboarding();
  const bt = formData.bankingTurnover;

  const handleBankToggle = (bank: string, checked: boolean) => {
    const current = bt.existingBankAccounts || [];
    if (checked) {
      updateBankingTurnover({ existingBankAccounts: [...current, bank] });
    } else {
      updateBankingTurnover({ existingBankAccounts: current.filter(b => b !== bank) });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Landmark className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Banking & Turnover</CardTitle>
              <CardDescription>Provide your banking relationships and financial details</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Existing Bank Accounts */}
          <FormField label="Existing Bank Accounts" helperText="Select all banks where you have accounts">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-2">
              {UAE_BANKS.map((bank) => (
                <div key={bank} className="flex items-center space-x-2">
                  <Checkbox
                    id={`bank-${bank}`}
                    checked={bt.existingBankAccounts?.includes(bank)}
                    onCheckedChange={(checked) => handleBankToggle(bank, checked as boolean)}
                  />
                  <Label htmlFor={`bank-${bank}`} className="text-sm cursor-pointer">
                    {bank}
                  </Label>
                </div>
              ))}
            </div>
          </FormField>

          <div className="grid gap-6 md:grid-cols-2">
            <FormField label="Primary Operating Bank" required>
              <Select
                value={bt.primaryOperatingBank}
                onValueChange={(value) => updateBankingTurnover({ primaryOperatingBank: value })}
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select primary bank" />
                </SelectTrigger>
                <SelectContent>
                  {UAE_BANKS.map((bank) => (
                    <SelectItem key={bank} value={bank}>
                      {bank}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Monthly Avg Turnover (AED)" required>
              <Input
                type="number"
                placeholder="e.g., 500000"
                value={bt.monthlyAvgTurnover || ''}
                onChange={(e) => updateBankingTurnover({ monthlyAvgTurnover: parseFloat(e.target.value) || 0 })}
                className="h-12"
              />
            </FormField>
          </div>

          {/* VAT Section */}
          <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
            <FormField label="VAT Registered?" required>
              <RadioGroup
                value={bt.vatRegistered === null ? '' : bt.vatRegistered ? 'yes' : 'no'}
                onValueChange={(value) => updateBankingTurnover({
                  vatRegistered: value === 'yes',
                  annualVatTurnover: value === 'no' ? null : bt.annualVatTurnover
                })}
                className="flex gap-6 pt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="vat-yes" />
                  <Label htmlFor="vat-yes" className="cursor-pointer">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="vat-no" />
                  <Label htmlFor="vat-no" className="cursor-pointer">No</Label>
                </div>
              </RadioGroup>
            </FormField>

            {bt.vatRegistered && (
              <FormField label="Annual VAT Turnover (AED)" required>
                <Input
                  type="number"
                  placeholder="As per VAT returns"
                  value={bt.annualVatTurnover || ''}
                  onChange={(e) => updateBankingTurnover({ annualVatTurnover: parseFloat(e.target.value) || 0 })}
                  className="h-12"
                />
              </FormField>
            )}
          </div>

          {/* POS Section */}
          <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
            <FormField label="POS Machine?" required>
              <RadioGroup
                value={bt.posMachine === null ? '' : bt.posMachine ? 'yes' : 'no'}
                onValueChange={(value) => updateBankingTurnover({
                  posMachine: value === 'yes',
                  posMonthlyTurnover: value === 'no' ? null : bt.posMonthlyTurnover
                })}
                className="flex gap-6 pt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="pos-yes" />
                  <Label htmlFor="pos-yes" className="cursor-pointer">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="pos-no" />
                  <Label htmlFor="pos-no" className="cursor-pointer">No</Label>
                </div>
              </RadioGroup>
            </FormField>

            {bt.posMachine && (
              <FormField label="POS Monthly Turnover (AED)" required>
                <Input
                  type="number"
                  placeholder="Average monthly POS volume"
                  value={bt.posMonthlyTurnover || ''}
                  onChange={(e) => updateBankingTurnover({ posMonthlyTurnover: parseFloat(e.target.value) || 0 })}
                  className="h-12"
                />
              </FormField>
            )}
          </div>

          {/* Additional Questions */}
          <div className="grid gap-6 md:grid-cols-2">
            <FormField label="Cash Intensive Business?">
              <RadioGroup
                value={bt.cashIntensive === null ? '' : bt.cashIntensive ? 'yes' : 'no'}
                onValueChange={(value) => updateBankingTurnover({ cashIntensive: value === 'yes' })}
                className="flex gap-6 pt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="cash-yes" />
                  <Label htmlFor="cash-yes" className="cursor-pointer">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="cash-no" />
                  <Label htmlFor="cash-no" className="cursor-pointer">No</Label>
                </div>
              </RadioGroup>
            </FormField>

            <FormField label="Sister Concern Exists?">
              <RadioGroup
                value={bt.sisterConcernExists === null ? '' : bt.sisterConcernExists ? 'yes' : 'no'}
                onValueChange={(value) => updateBankingTurnover({ sisterConcernExists: value === 'yes' })}
                className="flex gap-6 pt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="sister-yes" />
                  <Label htmlFor="sister-yes" className="cursor-pointer">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="sister-no" />
                  <Label htmlFor="sister-no" className="cursor-pointer">No</Label>
                </div>
              </RadioGroup>
            </FormField>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Figures must match bank statements & VAT returns. Any discrepancy may delay your application.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
