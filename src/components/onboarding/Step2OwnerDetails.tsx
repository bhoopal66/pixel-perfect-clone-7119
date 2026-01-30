import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { OwnerCard } from './OwnerCard';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Users, Plus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Step2OwnerDetails() {
  const { formData, updateOwner, addOwner, removeOwner, getTotalShareholding } = useOnboarding();
  const totalShareholding = getTotalShareholding();
  const isShareholdingValid = totalShareholding === 100;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Owner / Partner Details</CardTitle>
              <CardDescription>Add all shareholders and their details</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Shareholding indicator */}
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
              </AlertDescription>
            </div>
          </Alert>

          <div className="space-y-4">
            {formData.owners.map((owner, index) => (
              <OwnerCard
                key={owner.id}
                owner={owner}
                index={index}
                onUpdate={(data) => updateOwner(owner.id, data)}
                onRemove={() => removeOwner(owner.id)}
                canRemove={formData.owners.length > 1}
              />
            ))}

            <Button
              variant="outline"
              onClick={addOwner}
              className="w-full h-12 border-dashed"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Another Owner
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
