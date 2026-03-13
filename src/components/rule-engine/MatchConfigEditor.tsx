import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Settings2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { LenderMatchingEngine, type MatchConfig } from '@/services/lenderMatchingEngine';

export const MatchConfigEditor: React.FC = () => {
  const [config, setConfig] = useState<MatchConfig>({
    eligibility_weight: 40,
    rule_pass_weight: 20,
    limit_weight: 20,
    risk_weight: 20,
    cheque_return_deduction: 3,
    negative_balance_deduction: 2,
    vat_mismatch_deduction: 3,
    customer_concentration_deduction: 2,
    base_probability_factor: 0.9,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    LenderMatchingEngine.getConfig().then(setConfig).catch(console.error);
  }, []);

  const totalWeight = config.eligibility_weight + config.rule_pass_weight +
    config.limit_weight + config.risk_weight;

  const handleSave = async () => {
    if (totalWeight !== 100) {
      toast.error('Score weights must total 100');
      return;
    }
    setSaving(true);
    try {
      await LenderMatchingEngine.saveConfig(config);
      toast.success('Match configuration saved');
    } catch (e) {
      toast.error('Failed to save configuration');
    }
    setSaving(false);
  };

  const update = (key: keyof MatchConfig, value: string) => {
    setConfig(prev => ({ ...prev, [key]: parseFloat(value) || 0 }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings2 className="h-5 w-5 text-primary" />
          Lender Match Configuration
        </CardTitle>
        <CardDescription>
          Configure scoring weights and risk deductions for the auto-matching engine
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Score Weights */}
        <div>
          <h4 className="text-sm font-medium mb-3">Score Weights (must total 100)</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { key: 'eligibility_weight' as const, label: 'Eligibility' },
              { key: 'rule_pass_weight' as const, label: 'Rule Pass Rate' },
              { key: 'limit_weight' as const, label: 'Limit Strength' },
              { key: 'risk_weight' as const, label: 'Risk Quality' },
            ].map(({ key, label }) => (
              <div key={key}>
                <Label className="text-xs">{label}</Label>
                <Input
                  type="number" min={0} max={100}
                  value={config[key]}
                  onChange={e => update(key, e.target.value)}
                />
              </div>
            ))}
          </div>
          <p className={`text-xs mt-1 ${totalWeight === 100 ? 'text-success' : 'text-destructive'}`}>
            Total: {totalWeight}/100
          </p>
        </div>

        <Separator />

        {/* Risk Deductions */}
        <div>
          <h4 className="text-sm font-medium mb-3">Risk Deduction Points</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { key: 'cheque_return_deduction' as const, label: 'Cheque Returns' },
              { key: 'negative_balance_deduction' as const, label: 'Negative Balance' },
              { key: 'vat_mismatch_deduction' as const, label: 'VAT Mismatch' },
              { key: 'customer_concentration_deduction' as const, label: 'Customer Concentration' },
            ].map(({ key, label }) => (
              <div key={key}>
                <Label className="text-xs">{label}</Label>
                <Input
                  type="number" min={0} max={20} step={0.5}
                  value={config[key]}
                  onChange={e => update(key, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Probability Factor */}
        <div>
          <h4 className="text-sm font-medium mb-3">Probability Formula</h4>
          <div className="max-w-xs">
            <Label className="text-xs">Base Probability Factor (0-1)</Label>
            <Input
              type="number" min={0} max={1} step={0.05}
              value={config.base_probability_factor}
              onChange={e => update('base_probability_factor', e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Probability = Match Score × {config.base_probability_factor}
            </p>
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving || totalWeight !== 100} className="gap-2">
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Configuration'}
        </Button>
      </CardContent>
    </Card>
  );
};
