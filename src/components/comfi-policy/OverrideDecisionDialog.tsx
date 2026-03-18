import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldAlert } from 'lucide-react';

interface OverrideDecisionDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (status: string, reason: string) => Promise<void>;
  currentStatus: string;
}

const OVERRIDE_STATUSES = [
  { value: 'Approved – Override', label: 'Approved – Override' },
  { value: 'Declined – Override', label: 'Declined – Override' },
  { value: 'Referred – Manual Review', label: 'Referred – Manual Review' },
];

export function OverrideDecisionDialog({ open, onClose, onConfirm, currentStatus }: OverrideDecisionDialogProps) {
  const [status, setStatus] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!status || !reason.trim()) return;
    setLoading(true);
    try {
      await onConfirm(status, reason.trim());
      setStatus('');
      setReason('');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-amber-500" />
            Override Decision
          </DialogTitle>
          <DialogDescription>
            Override the engine decision for this evaluation. This action is audited.
          </DialogDescription>
        </DialogHeader>

        <Alert className="bg-amber-500/10 border-amber-200 dark:border-amber-800">
          <AlertDescription className="text-xs text-amber-700 dark:text-amber-400">
            Current engine status: <strong>{currentStatus}</strong>. Your override will be recorded alongside the original engine result.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Override Status *</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue placeholder="Select override status" /></SelectTrigger>
              <SelectContent>
                {OVERRIDE_STATUSES.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Override Reason *</Label>
            <Textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Mandatory: explain the reason for this override..."
              rows={3}
              maxLength={500}
            />
            <p className="text-[10px] text-muted-foreground">{reason.length}/500 characters</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={!status || !reason.trim() || loading}>
            {loading ? 'Applying...' : 'Apply Override'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
