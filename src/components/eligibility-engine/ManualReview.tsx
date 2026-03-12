import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, Edit3, Plus, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CurrencyService } from '@/services/currencyService';
import type { CombinedFinancialSummary } from '@/types/assessment.types';

interface ManualReviewProps {
  caseId: string | null;
  summary: CombinedFinancialSummary | null;
}

const fmt = (v: number) => CurrencyService.format(v, 'AED');

export const ManualReview: React.FC<ManualReviewProps> = ({ caseId, summary }) => {
  const [adjustmentType, setAdjustmentType] = useState('remark');
  const [reason, setReason] = useState('');
  const [fieldName, setFieldName] = useState('');
  const [adjustedValue, setAdjustedValue] = useState('');
  const [analystNotes, setAnalystNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  const handleAddAdjustment = async () => {
    if (!caseId || !reason.trim()) {
      toast.error('Please provide a reason for the adjustment');
      return;
    }

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('assessment_analyst_adjustments').insert({
        case_id: caseId,
        adjustment_type: adjustmentType,
        field_name: fieldName || null,
        adjusted_value: adjustedValue || null,
        reason: reason.trim(),
        adjusted_by: user?.id || null,
      });
      toast.success('Adjustment recorded');
      setReason('');
      setFieldName('');
      setAdjustedValue('');
    } catch (error) {
      toast.error('Failed to save adjustment');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!caseId) return;
    setIsSaving(true);
    try {
      await supabase.from('assessment_cases').update({
        analyst_notes: analystNotes,
      }).eq('id', caseId);
      toast.success('Notes saved');
    } catch {
      toast.error('Failed to save notes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleApproveCase = async () => {
    if (!caseId) return;
    setIsApproving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('assessment_cases').update({
        status: 'completed',
        approved_by: user?.id || null,
        approved_at: new Date().toISOString(),
      }).eq('id', caseId);
      toast.success('Case approved and finalized');
    } catch {
      toast.error('Failed to approve case');
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary for reference */}
      {summary && (
        <Card className="border-primary/20">
          <CardContent className="pt-6">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Normalized Turnover</p>
                <p className="font-bold">{fmt(summary.normalizedTurnover)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Variance</p>
                <p className="font-bold">{summary.variancePercent}%</p>
              </div>
              <div>
                <p className="text-muted-foreground">Risk Flags</p>
                <p className="font-bold">{summary.riskFlags.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Adjustment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Edit3 className="h-5 w-5 text-primary" />
            Add Adjustment / Override
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Adjustment Type</Label>
              <Select value={adjustmentType} onValueChange={setAdjustmentType}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="remark">General Remark</SelectItem>
                  <SelectItem value="exclude_transaction">Exclude Transaction</SelectItem>
                  <SelectItem value="edit_vat">Edit VAT Value</SelectItem>
                  <SelectItem value="override_turnover">Override Turnover</SelectItem>
                  <SelectItem value="mark_non_operating">Mark as Non-Operating</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {adjustmentType !== 'remark' && (
              <div>
                <Label>Field / Value</Label>
                <Input
                  className="mt-1"
                  placeholder="e.g., turnover_override = 500000"
                  value={adjustedValue}
                  onChange={e => setAdjustedValue(e.target.value)}
                />
              </div>
            )}
          </div>
          <div>
            <Label>Reason / Remarks</Label>
            <Textarea
              className="mt-1"
              placeholder="Explain the reason for this adjustment..."
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
            />
          </div>
          <Button onClick={handleAddAdjustment} disabled={isSaving || !reason.trim()}>
            <Plus className="h-4 w-4 mr-2" />
            Record Adjustment
          </Button>
        </CardContent>
      </Card>

      {/* Analyst Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageSquare className="h-5 w-5 text-accent" />
            Analyst Notes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Add your analysis notes, observations, or recommendations..."
            value={analystNotes}
            onChange={e => setAnalystNotes(e.target.value)}
            rows={5}
          />
          <Button variant="outline" onClick={handleSaveNotes} disabled={isSaving}>
            Save Notes
          </Button>
        </CardContent>
      </Card>

      {/* Approve */}
      <Card className="border-success/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground">Finalize Assessment</h3>
              <p className="text-sm text-muted-foreground">
                Mark this case as reviewed and approved. This will lock the case summary.
              </p>
            </div>
            <Button
              onClick={handleApproveCase}
              disabled={isApproving}
              className="bg-success hover:bg-success/90 text-success-foreground"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve Case
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
