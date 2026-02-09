import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Building2, User, CreditCard, ArrowRight, UserCheck } from 'lucide-react';
import { BANK_OPTIONS, PRODUCT_TYPE_LABELS, isPOSProduct } from '@/types/case.types';
import { AgentSelect } from '../AgentSelect';
import type { ProductType, CaseCreateInput } from '@/types/case.types';

interface Step1CreateCaseProps {
  onSubmit: (data: CaseCreateInput) => Promise<void>;
  isLoading: boolean;
}

export const Step1CreateCase: React.FC<Step1CreateCaseProps> = ({ onSubmit, isLoading }) => {
  const [clientName, setClientName] = useState('');
  const [bankName, setBankName] = useState('');
  const [productType, setProductType] = useState<ProductType>('standard');
  const [agentReference, setAgentReference] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!clientName.trim()) newErrors.client_name = 'Client name is required';
    if (!bankName) newErrors.bank_name = 'Bank name is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    await onSubmit({
      client_name: clientName.trim(),
      bank_name: bankName,
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

          {/* Bank Name */}
          <div className="space-y-2">
            <Label htmlFor="bank_name">Bank Name *</Label>
            <Select value={bankName} onValueChange={setBankName}>
              <SelectTrigger className={errors.bank_name ? 'border-destructive' : ''}>
                <SelectValue placeholder="Select bank" />
              </SelectTrigger>
              <SelectContent className="bg-background border shadow-lg z-50">
                {BANK_OPTIONS.map((bank) => (
                  <SelectItem key={bank} value={bank}>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      {bank}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.bank_name && (
              <p className="text-xs text-destructive">{errors.bank_name}</p>
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

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Save & Continue'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
