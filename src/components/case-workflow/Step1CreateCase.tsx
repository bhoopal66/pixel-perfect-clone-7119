import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Building2, User, CreditCard, ArrowRight, UserCheck, Loader2 } from 'lucide-react';
import { PRODUCT_TYPE_LABELS, isPOSProduct } from '@/types/case.types';
import { AgentSelect } from '../AgentSelect';
import { supabase } from '@/integrations/supabase/client';
import type { ProductType, CaseCreateInput } from '@/types/case.types';

interface Lender {
  id: string;
  name: string;
  short_code: string;
  is_active: boolean;
}

interface Step1CreateCaseProps {
  onSubmit: (data: CaseCreateInput) => Promise<void>;
  isLoading: boolean;
}

export const Step1CreateCase: React.FC<Step1CreateCaseProps> = ({ onSubmit, isLoading }) => {
  const [clientName, setClientName] = useState('');
  const [lenderId, setLenderId] = useState('');
  const [productType, setProductType] = useState<ProductType>('standard');
  const [agentReference, setAgentReference] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Lenders state
  const [lenders, setLenders] = useState<Lender[]>([]);
  const [loadingLenders, setLoadingLenders] = useState(true);

  // Fetch active lenders on mount
  useEffect(() => {
    const fetchLenders = async () => {
      try {
        const { data, error } = await supabase
          .from('onboarding_lenders')
          .select('id, name, short_code, is_active')
          .eq('is_active', true)
          .order('name');
        
        if (error) throw error;
        setLenders(data || []);
      } catch (err) {
        console.error('Error fetching lenders:', err);
      } finally {
        setLoadingLenders(false);
      }
    };
    
    fetchLenders();
  }, []);

  // Get selected lender name for display
  const selectedLender = lenders.find(l => l.id === lenderId);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!clientName.trim()) newErrors.client_name = 'Client name is required';
    if (!lenderId) newErrors.lender = 'Lender/Bank is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    // Use lender name as bank_name for backward compatibility
    const lenderName = selectedLender?.name || '';
    
    await onSubmit({
      client_name: clientName.trim(),
      bank_name: lenderName,
      product_type: productType,
      agent_reference: agentReference
    });
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Create New Case
        </CardTitle>
        <CardDescription>
          Enter the basic case information to get started
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Client Name */}
          <div className="space-y-2">
            <Label htmlFor="client_name">Client Name *</Label>
            <Input
              id="client_name"
              type="text"
              placeholder="Enter client/company name"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className={errors.client_name ? 'border-destructive' : ''}
            />
            {errors.client_name && (
              <p className="text-xs text-destructive">{errors.client_name}</p>
            )}
          </div>

          {/* Agent Reference Dropdown */}
          <div className="space-y-2">
            <Label>
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Agent Reference
              </div>
            </Label>
            <AgentSelect
              value={agentReference}
              onValueChange={(value) => setAgentReference(value)}
              placeholder="Select or register agent..."
            />
            <p className="text-xs text-muted-foreground">
              Select an existing agent or click "Register New Agent" to add one
            </p>
          </div>

          {/* Lender/Bank Selection */}
          <div className="space-y-2">
            <Label htmlFor="lender">Lender / Bank *</Label>
            <Select value={lenderId} onValueChange={setLenderId} disabled={loadingLenders}>
              <SelectTrigger className={errors.lender ? 'border-destructive' : ''}>
                {loadingLenders ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading lenders...
                  </div>
                ) : (
                  <SelectValue placeholder="Select lender or bank" />
                )}
              </SelectTrigger>
              <SelectContent className="bg-background border shadow-lg z-50">
                {lenders.map((lender) => (
                  <SelectItem key={lender.id} value={lender.id}>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <span>{lender.name}</span>
                      <span className="text-muted-foreground text-xs">({lender.short_code})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.lender && (
              <p className="text-xs text-destructive">{errors.lender}</p>
            )}
          </div>

          {/* Product Type */}
          <div className="space-y-2">
            <Label htmlFor="product_type">Product Type *</Label>
            <Select value={productType} onValueChange={(v) => setProductType(v as ProductType)}>
              <SelectTrigger>
                <SelectValue placeholder="Select product type" />
              </SelectTrigger>
              <SelectContent className="bg-background border shadow-lg z-50">
                {(Object.keys(PRODUCT_TYPE_LABELS) as ProductType[]).map((type) => (
                  <SelectItem key={type} value={type}>
                    <div className="flex items-center gap-2">
                      {isPOSProduct(type) && <CreditCard className="h-4 w-4" />}
                      {PRODUCT_TYPE_LABELS[type]}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isPOSProduct(productType) && (
              <p className="text-xs text-muted-foreground">
                POS Monthly Turnover will be required in Step 3
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading || loadingLenders}>
            {isLoading ? 'Creating...' : 'Save & Continue'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
