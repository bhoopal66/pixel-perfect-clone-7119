import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  AlertCircle,
  Info,
  Save,
  X,
  Lock,
  Unlock
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Checkbox } from './ui/checkbox';
import { Switch } from './ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from './ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { cn } from '@/lib/utils';
import type { TurnoverConfiguration, SisterCompany, ExclusionStatus } from '../types/turnover.types';
import { TurnoverCalculator } from '../services/turnoverCalculator';
import { CurrencyService, type CurrencyCode } from '../services/currencyService';

interface TurnoverConfigurationProps {
  config: TurnoverConfiguration;
  onConfigChange: (config: TurnoverConfiguration) => void;
  exclusionStatus?: ExclusionStatus;
  currency?: CurrencyCode;
}

export const TurnoverConfigurationPanel: React.FC<TurnoverConfigurationProps> = ({
  config,
  onConfigChange,
  exclusionStatus,
  currency = 'AED'
}) => {
  const [localConfig, setLocalConfig] = useState<TurnoverConfiguration>(config);
  const [isOpen, setIsOpen] = useState(false);

  const validation = TurnoverCalculator.validateConfiguration(localConfig);

  const formatCurrency = (value: number) => CurrencyService.format(value, currency);

  const canToggleCash = !exclusionStatus?.cashDeposits.mandatory;
  const canToggleSister = !exclusionStatus?.sisterConcern.mandatory;

  // Update local config when exclusion status changes mandatory flags
  useEffect(() => {
    if (exclusionStatus) {
      let updated = false;
      const newConfig = { ...localConfig };
      
      if (exclusionStatus.cashDeposits.mandatory && !localConfig.excludeCashDeposits) {
        newConfig.excludeCashDeposits = true;
        updated = true;
      }
      if (exclusionStatus.sisterConcern.mandatory && !localConfig.excludeSisterConcern) {
        newConfig.excludeSisterConcern = true;
        updated = true;
      }
      
      if (updated) {
        setLocalConfig(newConfig);
      }
    }
  }, [exclusionStatus]);

  const calculateDuration = () => {
    const start = new Date(localConfig.startDate);
    const end = new Date(localConfig.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const addCompany = () => {
    const newCompany: SisterCompany = {
      id: Date.now().toString(),
      name: '',
      active: true,
      notes: ''
    };
    setLocalConfig({
      ...localConfig,
      sisterCompanies: [...localConfig.sisterCompanies, newCompany]
    });
  };

  const removeCompany = (id: string) => {
    setLocalConfig({
      ...localConfig,
      sisterCompanies: localConfig.sisterCompanies.filter(c => c.id !== id)
    });
  };

  const updateCompany = (id: string, field: keyof SisterCompany, value: string | boolean) => {
    setLocalConfig({
      ...localConfig,
      sisterCompanies: localConfig.sisterCompanies.map(c =>
        c.id === id ? { ...c, [field]: value } : c
      )
    });
  };

  const updateKeywords = (type: 'cashDeposits' | 'sisterConcern', value: string) => {
    const keywords = value.split(',').map(k => k.trim()).filter(k => k.length > 0);
    setLocalConfig({
      ...localConfig,
      keywords: {
        ...localConfig.keywords,
        [type]: keywords
      }
    });
  };

  const handleSave = () => {
    if (validation.isValid) {
      onConfigChange(localConfig);
      setIsOpen(false);
    }
  };

  const handleCancel = () => {
    setLocalConfig(config);
    setIsOpen(false);
  };

  // Build dynamic formula
  const getFormulaDisplay = () => {
    let formula = 'Turnover = Total Credits';
    if (localConfig.excludeCashDeposits) formula += ' - Cash Deposits';
    if (localConfig.excludeSisterConcern) formula += ' - Sister Concern';
    return formula;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Settings className="h-4 w-4" />
          Configure Turnover
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Turnover Calculation Configuration
          </DialogTitle>
          <DialogDescription>
            Configure how business turnover is calculated with conditional exclusions
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Dynamic Formula Display */}
          <Card className="border-accent/30 bg-accent/5">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-accent mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground">Current Formula</p>
                  <code className="text-sm text-accent bg-accent/10 px-2 py-1 rounded mt-1 inline-block font-mono">
                    {getFormulaDisplay()}
                  </code>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Exclusion Toggles with Conditional Logic */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Exclusion Settings</CardTitle>
              <CardDescription>
                Exclusions become mandatory when they exceed threshold percentages
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Cash Deposits Toggle */}
              <div className={cn(
                "p-4 rounded-lg border transition-colors",
                exclusionStatus?.cashDeposits.mandatory 
                  ? "border-destructive/50 bg-destructive/5" 
                  : localConfig.excludeCashDeposits 
                    ? "border-warning/50 bg-warning/5"
                    : "border-border bg-background"
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={localConfig.excludeCashDeposits}
                      onCheckedChange={(checked) => {
                        if (canToggleCash) {
                          setLocalConfig({ ...localConfig, excludeCashDeposits: checked });
                        }
                      }}
                      disabled={!canToggleCash}
                    />
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "font-medium",
                        !canToggleCash && "text-muted-foreground"
                      )}>
                        Exclude Cash Deposits
                      </span>
                      {!canToggleCash && <Lock className="h-4 w-4 text-destructive" />}
                      {canToggleCash && localConfig.excludeCashDeposits && <Unlock className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </div>
                  
                  {exclusionStatus && (
                    <div className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
                      {formatCurrency(exclusionStatus.cashDeposits.amount)}
                      <span className={cn(
                        "ml-2",
                        exclusionStatus.cashDeposits.percentage > localConfig.cashDepositThreshold 
                          ? "text-destructive font-semibold" 
                          : "text-muted-foreground"
                      )}>
                        ({exclusionStatus.cashDeposits.percentage.toFixed(2)}%)
                      </span>
                    </div>
                  )}
                </div>

                {/* Mandatory Warning */}
                {exclusionStatus?.cashDeposits.mandatory && (
                  <div className="mt-3 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                      <div className="text-sm">
                        <p className="font-semibold text-destructive">MANDATORY EXCLUSION</p>
                        <p className="text-destructive/80">{exclusionStatus.cashDeposits.reason}</p>
                        <p className="text-xs text-destructive/60 mt-1 italic">
                          Rule: Cash deposits exceed {localConfig.cashDepositThreshold}% threshold
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Info when optional */}
                {!exclusionStatus?.cashDeposits.mandatory && exclusionStatus && (
                  <div className="mt-3 p-3 bg-success/10 border border-success/30 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-success mt-0.5 shrink-0" />
                      <div className="text-sm text-success/80">
                        <p>Cash deposits are {exclusionStatus.cashDeposits.percentage.toFixed(2)}% of total credits (below {localConfig.cashDepositThreshold}% threshold)</p>
                        <p className="mt-1">You can choose whether to exclude them from turnover calculation.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Sister Concern Toggle */}
              <div className={cn(
                "p-4 rounded-lg border transition-colors",
                exclusionStatus?.sisterConcern.mandatory 
                  ? "border-destructive/50 bg-destructive/5" 
                  : localConfig.excludeSisterConcern 
                    ? "border-warning/50 bg-warning/5"
                    : "border-border bg-background"
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={localConfig.excludeSisterConcern}
                      onCheckedChange={(checked) => {
                        if (canToggleSister) {
                          setLocalConfig({ ...localConfig, excludeSisterConcern: checked });
                        }
                      }}
                      disabled={!canToggleSister}
                    />
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "font-medium",
                        !canToggleSister && "text-muted-foreground"
                      )}>
                        Exclude Sister Concern Transfers
                      </span>
                      {!canToggleSister && <Lock className="h-4 w-4 text-destructive" />}
                      {canToggleSister && localConfig.excludeSisterConcern && <Unlock className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </div>
                  
                  {exclusionStatus && (
                    <div className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
                      {formatCurrency(exclusionStatus.sisterConcern.amount)}
                      <span className={cn(
                        "ml-2",
                        exclusionStatus.sisterConcern.percentage > localConfig.sisterConcernThreshold 
                          ? "text-destructive font-semibold" 
                          : "text-muted-foreground"
                      )}>
                        ({exclusionStatus.sisterConcern.percentage.toFixed(2)}%)
                      </span>
                    </div>
                  )}
                </div>

                {/* Mandatory Warning */}
                {exclusionStatus?.sisterConcern.mandatory && (
                  <div className="mt-3 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                      <div className="text-sm">
                        <p className="font-semibold text-destructive">MANDATORY EXCLUSION</p>
                        <p className="text-destructive/80">{exclusionStatus.sisterConcern.reason}</p>
                        <p className="text-xs text-destructive/60 mt-1 italic">
                          Rule: Sister concern transfers exceed {localConfig.sisterConcernThreshold}% threshold
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Info when optional */}
                {!exclusionStatus?.sisterConcern.mandatory && exclusionStatus && (
                  <div className="mt-3 p-3 bg-success/10 border border-success/30 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-success mt-0.5 shrink-0" />
                      <div className="text-sm text-success/80">
                        <p>Sister concern transfers are {exclusionStatus.sisterConcern.percentage.toFixed(2)}% of total credits (below {localConfig.sisterConcernThreshold}% threshold)</p>
                        <p className="mt-1">You can choose whether to exclude them from turnover calculation.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* VAT Variance Warning */}
              {exclusionStatus?.vatVariance.mandatory && (
                <div className="p-4 bg-destructive/10 border-2 border-destructive/50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                    <div>
                      <p className="font-bold text-destructive">VAT VARIANCE ALERT - MANDATORY EXCLUSIONS ENFORCED</p>
                      <p className="text-sm text-destructive/80 mt-1">{exclusionStatus.vatVariance.reason}</p>
                      <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Bank Turnover</p>
                          <p className="font-semibold">{formatCurrency(exclusionStatus.vatVariance.bankTurnover)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">VAT Sales</p>
                          <p className="font-semibold">{formatCurrency(exclusionStatus.vatVariance.vatSales)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Variance</p>
                          <p className="font-semibold text-destructive">
                            {formatCurrency(exclusionStatus.vatVariance.variance)} 
                            ({exclusionStatus.vatVariance.percentageVariance.toFixed(2)}%)
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-destructive/60 mt-3 italic border-t border-destructive/20 pt-2">
                        Rule: VAT variance exceeds {localConfig.vatVarianceThreshold}% threshold - all exclusions are mandatory
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Threshold Configuration */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Exclusion Thresholds</CardTitle>
              <CardDescription>
                Exclusions become mandatory when these percentages are exceeded
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Cash Deposit</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      type="number"
                      value={localConfig.cashDepositThreshold}
                      onChange={(e) => setLocalConfig({ 
                        ...localConfig, 
                        cashDepositThreshold: parseFloat(e.target.value) || 20 
                      })}
                      min={0}
                      max={100}
                      step={1}
                      className="w-20"
                    />
                    <span className="text-muted-foreground">%</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Sister Concern</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      type="number"
                      value={localConfig.sisterConcernThreshold}
                      onChange={(e) => setLocalConfig({ 
                        ...localConfig, 
                        sisterConcernThreshold: parseFloat(e.target.value) || 20 
                      })}
                      min={0}
                      max={100}
                      step={1}
                      className="w-20"
                    />
                    <span className="text-muted-foreground">%</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">VAT Variance</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      type="number"
                      value={localConfig.vatVarianceThreshold}
                      onChange={(e) => setLocalConfig({ 
                        ...localConfig, 
                        vatVarianceThreshold: parseFloat(e.target.value) || 25 
                      })}
                      min={0}
                      max={100}
                      step={1}
                      className="w-20"
                    />
                    <span className="text-muted-foreground">%</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Default thresholds: Cash (20%), Sister Concern (20%), VAT Variance (25%)
              </p>
            </CardContent>
          </Card>

          {/* Analysis Period */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Analysis Period</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Start Date</label>
                  <Input
                    type="date"
                    value={localConfig.startDate}
                    onChange={(e) => setLocalConfig({ ...localConfig, startDate: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">End Date</label>
                  <Input
                    type="date"
                    value={localConfig.endDate}
                    onChange={(e) => setLocalConfig({ ...localConfig, endDate: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                Duration: <span className="font-medium text-foreground">{calculateDuration()} days</span>
              </div>
            </CardContent>
          </Card>

          {/* Sister Companies */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Sister Companies / Related Parties</CardTitle>
                  <CardDescription>
                    Transactions from these parties will be excluded from business turnover
                  </CardDescription>
                </div>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Transfers from sister companies or related parties are excluded because they're internal movements, not customer revenue</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-2">
                  <div className="col-span-1">#</div>
                  <div className="col-span-4">Company Name</div>
                  <div className="col-span-1 text-center">Active</div>
                  <div className="col-span-4">Notes</div>
                  <div className="col-span-2"></div>
                </div>
                
                {localConfig.sisterCompanies.map((company, idx) => (
                  <motion.div
                    key={company.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "grid grid-cols-12 gap-2 items-center p-2 rounded-lg transition-colors",
                      company.active 
                        ? "bg-success/10 border border-success/20" 
                        : "bg-muted/50 border border-border"
                    )}
                  >
                    <div className="col-span-1 text-sm text-muted-foreground">
                      {idx + 1}
                    </div>
                    <div className="col-span-4">
                      <Input
                        value={company.name}
                        onChange={(e) => updateCompany(company.id, 'name', e.target.value)}
                        placeholder="Enter company name"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <Checkbox
                        checked={company.active}
                        onCheckedChange={(checked) => updateCompany(company.id, 'active', !!checked)}
                      />
                    </div>
                    <div className="col-span-4">
                      <Input
                        value={company.notes}
                        onChange={(e) => updateCompany(company.id, 'notes', e.target.value)}
                        placeholder="Notes"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="col-span-2 flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCompany(company.id)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addCompany}
                  className="mt-2 gap-1"
                >
                  <Plus className="h-4 w-4" />
                  Add Company
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Transaction Keywords */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Transaction Keywords</CardTitle>
              <CardDescription>
                Keywords used to identify specific transaction types
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <label className="text-sm font-medium text-muted-foreground">
                    Cash Deposits Keywords
                  </label>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Cash deposits via CDM or physical deposits - excluded because they're not business revenue</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  value={localConfig.keywords.cashDeposits.join(', ')}
                  onChange={(e) => updateKeywords('cashDeposits', e.target.value)}
                  placeholder="CDM, CASH DEPOSIT, ATM"
                  className="font-mono text-sm"
                />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <label className="text-sm font-medium text-muted-foreground">
                    Sister Concern Keywords
                  </label>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Keywords that identify transfers from related parties</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  value={localConfig.keywords.sisterConcern.join(', ')}
                  onChange={(e) => updateKeywords('sisterConcern', e.target.value)}
                  placeholder="MUSAB BEH, AHMAD HUSS"
                  className="font-mono text-sm"
                />
              </div>
            </CardContent>
          </Card>

          {/* Validation Messages */}
          {(validation.errors.length > 0 || validation.warnings.length > 0) && (
            <Card className={cn(
              "border",
              validation.errors.length > 0 ? "border-destructive/50 bg-destructive/5" : "border-warning/50 bg-warning/5"
            )}>
              <CardContent className="pt-4 space-y-2">
                {validation.errors.map((error, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                ))}
                {validation.warnings.map((warning, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm text-warning">
                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>{warning}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Legend */}
          <Card className="bg-muted/30">
            <CardContent className="pt-4">
              <h4 className="font-medium text-sm mb-3">Legend</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-destructive/20 border border-destructive/50" />
                  <span className="text-muted-foreground">Mandatory exclusion (&gt;threshold)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-warning/20 border border-warning/50" />
                  <span className="text-muted-foreground">Optional exclusion (user-selected)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-destructive" />
                  <span className="text-muted-foreground">Locked (cannot toggle)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Unlock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Unlocked (can toggle)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button variant="outline" onClick={handleCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </DialogClose>
          <Button 
            onClick={handleSave} 
            disabled={!validation.isValid}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            Save Configuration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
