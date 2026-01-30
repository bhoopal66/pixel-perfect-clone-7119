import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  AlertCircle,
  Info,
  Save,
  X
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Checkbox } from './ui/checkbox';
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
import type { TurnoverConfiguration, SisterCompany } from '../types/turnover.types';
import { TurnoverCalculator } from '../services/turnoverCalculator';

interface TurnoverConfigurationProps {
  config: TurnoverConfiguration;
  onConfigChange: (config: TurnoverConfiguration) => void;
}

export const TurnoverConfigurationPanel: React.FC<TurnoverConfigurationProps> = ({
  config,
  onConfigChange
}) => {
  const [localConfig, setLocalConfig] = useState<TurnoverConfiguration>(config);
  const [isOpen, setIsOpen] = useState(false);

  const validation = TurnoverCalculator.validateConfiguration(localConfig);

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
            Turnover Analysis Configuration
          </DialogTitle>
          <DialogDescription>
            Configure how business turnover is calculated by defining exclusions
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Formula Display */}
          <Card className="border-accent/30 bg-accent/5">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-accent mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground">Turnover Calculation Formula</p>
                  <code className="text-sm text-accent bg-accent/10 px-2 py-1 rounded mt-1 inline-block">
                    Business Turnover = Total Credits - Cash Deposits - Sister Concern Transfers
                  </code>
                </div>
              </div>
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

          {/* Instructions */}
          <Card className="bg-muted/30">
            <CardContent className="pt-4">
              <h4 className="font-medium text-sm mb-2">Instructions</h4>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Update the Start Date and End Date for your analysis period</li>
                <li>Add sister companies in the table (mark Active to exclude from turnover)</li>
                <li>Update transaction keywords if needed</li>
                <li>All turnover calculations will automatically exclude these amounts</li>
                <li>Green rows indicate active exclusions, grey rows are inactive</li>
              </ol>
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
