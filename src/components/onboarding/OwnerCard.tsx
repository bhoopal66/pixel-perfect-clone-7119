import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { FormField } from './FormField';
import { OwnerDetails } from '@/types/onboarding.types';
import { Trash2, User } from 'lucide-react';

interface OwnerCardProps {
  owner: OwnerDetails;
  index: number;
  onUpdate: (data: Partial<OwnerDetails>) => void;
  onRemove: () => void;
  canRemove: boolean;
}

const NATIONALITIES = [
  'UAE',
  'Saudi Arabia',
  'India',
  'Pakistan',
  'Bangladesh',
  'Philippines',
  'Egypt',
  'Jordan',
  'Lebanon',
  'Syria',
  'United Kingdom',
  'United States',
  'Other'
];

const RESIDENT_STATUSES = [
  'UAE Resident',
  'Non-Resident',
  'GCC National'
];

export function OwnerCard({ owner, index, onUpdate, onRemove, canRemove }: OwnerCardProps) {
  return (
    <Card className="relative">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded-lg">
              <User className="h-4 w-4 text-primary" />
            </div>
            <span className="font-semibold">Owner / Partner {index + 1}</span>
          </div>
          {canRemove && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Owner Name" required>
            <Input
              placeholder="Full name as per passport"
              value={owner.ownerName}
              onChange={(e) => onUpdate({ ownerName: e.target.value })}
              className="h-11"
            />
          </FormField>

          <FormField label="Nationality" required>
            <Select
              value={owner.nationality}
              onValueChange={(value) => onUpdate({ nationality: value })}
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select nationality" />
              </SelectTrigger>
              <SelectContent>
                {NATIONALITIES.map((nat) => (
                  <SelectItem key={nat} value={nat}>
                    {nat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Emirates ID" required helperText="15-digit number">
            <Input
              placeholder="784-XXXX-XXXXXXX-X"
              value={owner.emiratesId}
              onChange={(e) => onUpdate({ emiratesId: e.target.value })}
              className="h-11"
            />
          </FormField>

          <FormField label="Passport Number" required>
            <Input
              placeholder="Passport number"
              value={owner.passportNumber}
              onChange={(e) => onUpdate({ passportNumber: e.target.value })}
              className="h-11"
            />
          </FormField>

          <FormField label="Shareholding %" required helperText="Must total 100% across all owners">
            <Input
              type="number"
              placeholder="e.g., 50"
              min="0"
              max="100"
              value={owner.shareholdingPercent || ''}
              onChange={(e) => onUpdate({ shareholdingPercent: parseFloat(e.target.value) || 0 })}
              className="h-11"
            />
          </FormField>

          <FormField label="Resident Status" required>
            <Select
              value={owner.residentStatus}
              onValueChange={(value) => onUpdate({ residentStatus: value })}
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {RESIDENT_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Mobile Number" required>
            <Input
              type="tel"
              placeholder="+971 XX XXX XXXX"
              value={owner.mobile}
              onChange={(e) => onUpdate({ mobile: e.target.value })}
              className="h-11"
            />
          </FormField>

          <FormField label="Email" required>
            <Input
              type="email"
              placeholder="email@example.com"
              value={owner.email}
              onChange={(e) => onUpdate({ email: e.target.value })}
              className="h-11"
            />
          </FormField>
        </div>
      </CardContent>
    </Card>
  );
}
