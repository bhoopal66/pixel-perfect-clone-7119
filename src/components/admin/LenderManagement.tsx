import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  Plus,
  Edit,
  ToggleLeft,
  ToggleRight,
  Settings,
  FileText,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { LenderService } from '@/services/lenderService';
import type { Lender, LenderEligibilityRules } from '@/types/dashboard.types';

interface LenderManagementProps {
  lenders: Lender[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function LenderManagement({ lenders, isLoading, onRefresh }: LenderManagementProps) {
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingLender, setEditingLender] = useState<Lender | null>(null);
  const [expandedLenderId, setExpandedLenderId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form state for new/edit lender
  const [formData, setFormData] = useState({
    name: '',
    short_code: '',
    lender_type: 'bank' as 'bank' | 'fintech' | 'nbfc',
    contact_email: '',
    contact_phone: '',
    max_multiplier: 8,
    min_loan_amount: 50000,
    pos_cap_percent: 40,
    abcd_fee_percent: 1,
    reduced_multiplier: 1.33,
    min_statement_months: 6,
    max_bounce_count: 3,
    max_cash_deposit_ratio: 50,
    min_avg_daily_balance: 0,
    max_negative_balance_days: 5,
    max_variance_percent: 25,
  });

  const resetForm = () => {
    setFormData({
      name: '',
      short_code: '',
      lender_type: 'bank',
      contact_email: '',
      contact_phone: '',
      max_multiplier: 8,
      min_loan_amount: 50000,
      pos_cap_percent: 40,
      abcd_fee_percent: 1,
      reduced_multiplier: 1.33,
      min_statement_months: 6,
      max_bounce_count: 3,
      max_cash_deposit_ratio: 50,
      min_avg_daily_balance: 0,
      max_negative_balance_days: 5,
      max_variance_percent: 25,
    });
  };

  const handleAddLender = async () => {
    if (!formData.name || !formData.short_code) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSaving(true);
    try {
      await LenderService.create({
        name: formData.name,
        short_code: formData.short_code.toUpperCase(),
        lender_type: formData.lender_type,
        contact_email: formData.contact_email || undefined,
        contact_phone: formData.contact_phone || undefined,
        eligibility_rules: {
          max_multiplier: formData.max_multiplier,
          min_loan_amount: formData.min_loan_amount,
          max_loan_amount: null,
          pos_cap_percent: formData.pos_cap_percent / 100,
          abcd_fee_percent: formData.abcd_fee_percent / 100,
          reduced_multiplier: formData.reduced_multiplier,
          variance_thresholds: { eligible: 10, reduced: 25 }
        }
      });
      toast.success('Lender created successfully');
      setIsAddDialogOpen(false);
      resetForm();
      onRefresh();
    } catch (error) {
      toast.error('Failed to create lender');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditLender = (lender: Lender) => {
    setEditingLender(lender);
    setFormData({
      name: lender.name,
      short_code: lender.short_code,
      lender_type: lender.lender_type,
      contact_email: lender.contact_email || '',
      contact_phone: lender.contact_phone || '',
      max_multiplier: lender.eligibility_rules.max_multiplier,
      min_loan_amount: lender.eligibility_rules.min_loan_amount,
      pos_cap_percent: (lender.eligibility_rules.pos_cap_percent || 0) * 100,
      abcd_fee_percent: (lender.eligibility_rules.abcd_fee_percent || 0) * 100,
      reduced_multiplier: lender.eligibility_rules.reduced_multiplier,
      min_statement_months: lender.eligibility_rules.min_statement_months ?? 6,
      max_bounce_count: lender.eligibility_rules.max_bounce_count ?? 3,
      max_cash_deposit_ratio: (lender.eligibility_rules.max_cash_deposit_ratio ?? 0.5) * 100,
      min_avg_daily_balance: lender.eligibility_rules.min_avg_daily_balance ?? 0,
      max_negative_balance_days: lender.eligibility_rules.max_negative_balance_days ?? 5,
      max_variance_percent: lender.eligibility_rules.max_variance_percent ?? 25,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateLender = async () => {
    if (!editingLender) return;

    setIsSaving(true);
    try {
      await LenderService.update(editingLender.id, {
        name: formData.name,
        short_code: formData.short_code.toUpperCase(),
        lender_type: formData.lender_type,
        contact_email: formData.contact_email,
        contact_phone: formData.contact_phone,
        eligibility_rules: {
          ...editingLender.eligibility_rules,
          max_multiplier: formData.max_multiplier,
          min_loan_amount: formData.min_loan_amount,
          pos_cap_percent: formData.pos_cap_percent / 100,
          abcd_fee_percent: formData.abcd_fee_percent / 100,
          reduced_multiplier: formData.reduced_multiplier
        }
      });
      toast.success('Lender updated successfully');
      setIsEditDialogOpen(false);
      setEditingLender(null);
      resetForm();
      onRefresh();
    } catch (error) {
      toast.error('Failed to update lender');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (lender: Lender) => {
    try {
      await LenderService.toggleActive(lender.id, !lender.is_active);
      toast.success(`Lender ${!lender.is_active ? 'activated' : 'deactivated'}`);
      onRefresh();
    } catch (error) {
      toast.error('Failed to update lender status');
      console.error(error);
    }
  };

  const LenderDialog = ({ isOpen, onClose, isEdit }: { isOpen: boolean; onClose: () => void; isEdit: boolean }) => (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Lender' : 'Add New Lender'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update lender details and eligibility rules' : 'Configure a new lender with eligibility rules and workflow'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Lender Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Flapcap"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="short_code">Short Code *</Label>
              <Input
                id="short_code"
                value={formData.short_code}
                onChange={(e) => setFormData({ ...formData, short_code: e.target.value.toUpperCase() })}
                placeholder="e.g., FLAP"
                maxLength={10}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lender_type">Type</Label>
            <Select value={formData.lender_type} onValueChange={(v) => setFormData({ ...formData, lender_type: v as any })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bank">Bank</SelectItem>
                <SelectItem value="fintech">Fintech</SelectItem>
                <SelectItem value="nbfc">NBFC</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact_email">Contact Email</Label>
              <Input
                id="contact_email"
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                placeholder="partner@lender.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_phone">Contact Phone</Label>
              <Input
                id="contact_phone"
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                placeholder="+971 XX XXX XXXX"
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Eligibility Rules</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="max_multiplier">Max Multiplier</Label>
                <Input
                  id="max_multiplier"
                  type="number"
                  value={formData.max_multiplier}
                  onChange={(e) => setFormData({ ...formData, max_multiplier: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reduced_multiplier">Reduced Multiplier</Label>
                <Input
                  id="reduced_multiplier"
                  type="number"
                  step="0.01"
                  value={formData.reduced_multiplier}
                  onChange={(e) => setFormData({ ...formData, reduced_multiplier: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="min_loan_amount">Min Loan Amount (AED)</Label>
                <Input
                  id="min_loan_amount"
                  type="number"
                  value={formData.min_loan_amount}
                  onChange={(e) => setFormData({ ...formData, min_loan_amount: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pos_cap_percent">POS Cap %</Label>
                <Input
                  id="pos_cap_percent"
                  type="number"
                  value={formData.pos_cap_percent}
                  onChange={(e) => setFormData({ ...formData, pos_cap_percent: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="abcd_fee_percent">ABCD Fee %</Label>
                <Input
                  id="abcd_fee_percent"
                  type="number"
                  step="0.1"
                  value={formData.abcd_fee_percent}
                  onChange={(e) => setFormData({ ...formData, abcd_fee_percent: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={isEdit ? handleUpdateLender : handleAddLender} disabled={isSaving}>
            {isSaving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
            {isEdit ? 'Update Lender' : 'Create Lender'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6">
      {/* Lender Management Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Lender Management
            </CardTitle>
            <CardDescription>Add, edit, and configure lenders and their workflows</CardDescription>
          </div>
          <Button onClick={() => { resetForm(); setIsAddDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Lender
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-2">
              {lenders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No lenders configured. Click "Add Lender" to get started.
                </div>
              ) : (
                lenders.map((lender) => (
                  <Collapsible
                    key={lender.id}
                    open={expandedLenderId === lender.id}
                    onOpenChange={() => setExpandedLenderId(expandedLenderId === lender.id ? null : lender.id)}
                  >
                    <Card className="bg-muted/30">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <CollapsibleTrigger asChild>
                              <Button variant="ghost" size="sm">
                                {expandedLenderId === lender.id ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                            </CollapsibleTrigger>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">{lender.name}</span>
                                <Badge variant="outline">{lender.short_code}</Badge>
                                <Badge variant={lender.lender_type === 'bank' ? 'default' : 'secondary'}>
                                  {lender.lender_type}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {lender.eligibility_rules.pos_cap_percent * 100}% POS cap • 
                                {lender.eligibility_rules.max_multiplier}× multiplier • 
                                {lender.eligibility_rules.abcd_fee_percent * 100}% ABCD
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleActive(lender)}
                            >
                              {lender.is_active ? (
                                <ToggleRight className="h-5 w-5 text-success" />
                              ) : (
                                <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                              )}
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleEditLender(lender)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <CollapsibleContent className="mt-4 pt-4 border-t">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Max Multiplier</p>
                              <p className="font-medium">{lender.eligibility_rules.max_multiplier}×</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Reduced Multiplier</p>
                              <p className="font-medium">{lender.eligibility_rules.reduced_multiplier}×</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Min Loan</p>
                              <p className="font-medium">AED {lender.eligibility_rules.min_loan_amount?.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">POS Cap</p>
                              <p className="font-medium">{(lender.eligibility_rules.pos_cap_percent * 100)}%</p>
                            </div>
                          </div>
                          <div className="mt-4 pt-4 border-t">
                            <p className="text-sm font-medium mb-2">Required Documents</p>
                            <div className="flex flex-wrap gap-1">
                              {lender.document_requirements.mandatory.map(doc => (
                                <Badge key={doc} variant="outline" className="text-xs">
                                  {doc.replace(/_/g, ' ')}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </CollapsibleContent>
                      </CardContent>
                    </Card>
                  </Collapsible>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <LenderDialog isOpen={isAddDialogOpen} onClose={() => setIsAddDialogOpen(false)} isEdit={false} />
      <LenderDialog isOpen={isEditDialogOpen} onClose={() => { setIsEditDialogOpen(false); setEditingLender(null); }} isEdit={true} />
    </div>
  );
}
