import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from './FormField';
import { OwnerDetails, OWNER_ROLES } from '@/types/onboarding.types';
import { MAX_LENGTHS, isValidEmail, isValidPhone } from '@/utils/validation';
import { Trash2, User, GripVertical, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface OwnerCardProps {
  owner: OwnerDetails;
  index: number;
  totalOwners: number;
  onUpdate: (data: Partial<OwnerDetails>) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canRemove: boolean;
  duplicateWarnings: string[];
}

const NATIONALITIES = [
  'UAE', 'Saudi Arabia', 'India', 'Pakistan', 'Bangladesh',
  'Philippines', 'Egypt', 'Jordan', 'Lebanon', 'Syria',
  'United Kingdom', 'United States', 'Other'
];

const RESIDENT_STATUSES = ['UAE Resident', 'Non-Resident', 'GCC National'];

export function OwnerCard({ owner, index, totalOwners, onUpdate, onRemove, onMoveUp, onMoveDown, canRemove, duplicateWarnings }: OwnerCardProps) {
  const [emailTouched, setEmailTouched] = useState(false);
  const [phoneTouched, setPhoneTouched] = useState(false);

  const emailError = emailTouched && owner.email && !isValidEmail(owner.email) ? 'Please enter a valid email address' : '';
  const phoneError = phoneTouched && owner.mobile && !isValidPhone(owner.mobile) ? 'Please enter a valid phone number' : '';

  return (
    <Card className="relative">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex flex-col gap-0.5">
              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={onMoveUp} disabled={index === 0}>
                <ChevronUp className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={onMoveDown} disabled={index === totalOwners - 1}>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </div>
            <div className="p-1.5 bg-primary/10 rounded-lg">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">Owner / Partner {index + 1}</span>
              {owner.role && <Badge variant="secondary" className="text-xs">{owner.role}</Badge>}
              {owner.isSignatory && <Badge variant="outline" className="text-xs border-blue-500 text-blue-600">Signatory</Badge>}
              {owner.isUbo && <Badge variant="outline" className="text-xs border-amber-500 text-amber-600">UBO</Badge>}
            </div>
          </div>
          {canRemove && (
            <Button variant="ghost" size="sm" onClick={onRemove} className="text-destructive hover:text-destructive hover:bg-destructive/10">
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
        {duplicateWarnings.length > 0 && (
          <div className="mt-2 space-y-1">
            {duplicateWarnings.map((w, i) => (
              <p key={i} className="text-xs text-destructive">{w}</p>
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <FormField label="Full Name" required>
            <Input placeholder="Full name as per passport" value={owner.ownerName} onChange={(e) => onUpdate({ ownerName: e.target.value })} maxLength={MAX_LENGTHS.ownerName} className="h-11" />
          </FormField>

          <FormField label="Role" required>
            <Select value={owner.role} onValueChange={(value) => onUpdate({ role: value })}>
              <SelectTrigger className="h-11"><SelectValue placeholder="Select role" /></SelectTrigger>
              <SelectContent>
                {OWNER_ROLES.map((role) => (<SelectItem key={role} value={role}>{role}</SelectItem>))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Ownership %" required helperText="Must total 100%">
            <Input type="number" placeholder="e.g., 50" min="0" max="100" value={owner.shareholdingPercent || ''} onChange={(e) => onUpdate({ shareholdingPercent: parseFloat(e.target.value) || 0 })} className="h-11" />
          </FormField>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <FormField label="Nationality" required>
            <Select value={owner.nationality} onValueChange={(value) => onUpdate({ nationality: value })}>
              <SelectTrigger className="h-11"><SelectValue placeholder="Select nationality" /></SelectTrigger>
              <SelectContent>
                {NATIONALITIES.map((nat) => (<SelectItem key={nat} value={nat}>{nat}</SelectItem>))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Resident Status" required>
            <Select value={owner.residentStatus} onValueChange={(value) => onUpdate({ residentStatus: value })}>
              <SelectTrigger className="h-11"><SelectValue placeholder="Select status" /></SelectTrigger>
              <SelectContent>
                {RESIDENT_STATUSES.map((status) => (<SelectItem key={status} value={status}>{status}</SelectItem>))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Emirates ID" helperText="784-XXXX-XXXXXXX-X">
            <Input placeholder="784-XXXX-XXXXXXX-X" value={owner.emiratesId} onChange={(e) => onUpdate({ emiratesId: e.target.value })} maxLength={MAX_LENGTHS.emiratesId} className="h-11" />
          </FormField>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <FormField label="Passport Number">
            <Input placeholder="Passport number" value={owner.passportNumber} onChange={(e) => onUpdate({ passportNumber: e.target.value })} maxLength={MAX_LENGTHS.passportNumber} className="h-11" />
          </FormField>

          <FormField label="Mobile Number" required>
            <Input type="tel" placeholder="+971 XX XXX XXXX" value={owner.mobile} onChange={(e) => onUpdate({ mobile: e.target.value })} onBlur={() => setPhoneTouched(true)} maxLength={MAX_LENGTHS.phone} className="h-11" />
            {phoneError && <p className="text-xs text-destructive mt-1">{phoneError}</p>}
          </FormField>

          <FormField label="Email" required>
            <Input type="email" placeholder="email@example.com" value={owner.email} onChange={(e) => onUpdate({ email: e.target.value })} onBlur={() => setEmailTouched(true)} maxLength={MAX_LENGTHS.email} className="h-11" />
            {emailError && <p className="text-xs text-destructive mt-1">{emailError}</p>}
          </FormField>
        </div>

        <FormField label="Address">
          <div className="relative">
            <Textarea placeholder="Full address" value={owner.address} onChange={(e) => onUpdate({ address: e.target.value })} maxLength={MAX_LENGTHS.address} className="min-h-[60px]" />
            <span className="absolute bottom-1.5 right-2 text-xs text-muted-foreground">
              {(owner.address || '').length}/{MAX_LENGTHS.address}
            </span>
          </div>
        </FormField>

        <div className="flex items-center gap-8 pt-2">
          <div className="flex items-center gap-2">
            <Switch checked={owner.isSignatory} onCheckedChange={(checked) => onUpdate({ isSignatory: checked })} />
            <Label className="text-sm">Authorized Signatory</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={owner.isUbo} onCheckedChange={(checked) => onUpdate({ isUbo: checked })} />
            <Label className="text-sm">Ultimate Beneficial Owner (UBO)</Label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
