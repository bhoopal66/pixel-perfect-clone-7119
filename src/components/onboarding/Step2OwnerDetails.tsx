import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { OwnerCard } from './OwnerCard';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Users, Plus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';

export function Step2OwnerDetails() {
  const { formData, updateOwner, addOwner, removeOwner, moveOwner, getTotalShareholding } = useOnboarding();
  const totalShareholding = getTotalShareholding();
  const isShareholdingValid = totalShareholding === 100;

  // Duplicate detection
  const duplicateWarningsMap = useMemo(() => {
    const warnings: Record<string, string[]> = {};
    formData.owners.forEach(o => { warnings[o.id] = []; });

    formData.owners.forEach((owner, i) => {
      if (owner.emiratesId && owner.emiratesId.trim()) {
        const dupes = formData.owners.filter((o, j) => j !== i && o.emiratesId.trim() === owner.emiratesId.trim());
        if (dupes.length > 0) warnings[owner.id].push('Duplicate Emirates ID detected');
      }
      if (owner.passportNumber && owner.passportNumber.trim()) {
        const dupes = formData.owners.filter((o, j) => j !== i && o.passportNumber.trim() === owner.passportNumber.trim());
        if (dupes.length > 0) warnings[owner.id].push('Duplicate Passport Number detected');
      }
    });
    return warnings;
  }, [formData.owners]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Owners / Partners / Shareholders</CardTitle>
              <CardDescription>Add all partners, shareholders, and beneficial owners. Total shareholding must equal 100%.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Alert
            className={cn(
              'mb-6',
              isShareholdingValid
                ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                : totalShareholding > 100
                ? 'border-destructive bg-destructive/10'
                : 'border-amber-500 bg-amber-50 dark:bg-amber-950/20'
            )}
          >
            <div className="flex items-center gap-2">
              {isShareholdingValid ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className={cn('h-4 w-4', totalShareholding > 100 ? 'text-destructive' : 'text-amber-600')} />
              )}
              <AlertDescription
                className={cn(
                  'font-medium',
                  isShareholdingValid
                    ? 'text-green-700 dark:text-green-400'
                    : totalShareholding > 100
                    ? 'text-destructive'
                    : 'text-amber-700 dark:text-amber-400'
                )}
              >
                Total Shareholding: {totalShareholding}%
                {!isShareholdingValid && (
                  <span className="font-normal ml-2">
                    {totalShareholding > 100 ? '(Exceeds 100%)' : `(${100 - totalShareholding}% remaining)`}
                  </span>
                )}
                {' · '}{formData.owners.length} owner{formData.owners.length !== 1 ? 's' : ''}
              </AlertDescription>
            </div>
          </Alert>

          <div className="space-y-4">
            {formData.owners.map((owner, index) => (
              <OwnerCard
                key={owner.id}
                owner={owner}
                index={index}
                totalOwners={formData.owners.length}
                onUpdate={(data) => updateOwner(owner.id, data)}
                onRemove={() => removeOwner(owner.id)}
                onMoveUp={() => moveOwner(index, index - 1)}
                onMoveDown={() => moveOwner(index, index + 1)}
                canRemove={formData.owners.length > 1}
                duplicateWarnings={duplicateWarningsMap[owner.id] || []}
              />
            ))}

            <Button variant="outline" onClick={addOwner} className="w-full h-12 border-dashed">
              <Plus className="h-4 w-4 mr-2" />
              Add Owner / Partner
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
