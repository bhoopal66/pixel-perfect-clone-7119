import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { LenderService } from '@/services/lenderService';
import { ProductService, RuleSetService } from '@/services/ruleEngineCrud';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  LenderProductManager, RuleSetManager, RuleBuilder,
  FormulaBuilder, DecisionMatrixEditor, TestRuleEngine, PolicyAuditLog,
} from '@/components/rule-engine';
import { MatchConfigEditor } from '@/components/rule-engine/MatchConfigEditor';
import { ArrowLeft, Shield, Package, Layers, Cog, Calculator, Grid3X3, Play, History, Settings2 } from 'lucide-react';

const LenderPolicyAdmin = () => {
  const navigate = useNavigate();
  const [selectedLenderId, setSelectedLenderId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedRuleSetId, setSelectedRuleSetId] = useState('');

  const { data: lenders } = useQuery({
    queryKey: ['lenders-all-admin'],
    queryFn: () => LenderService.getAll(),
  });

  const { data: products } = useQuery({
    queryKey: ['lender-products', selectedLenderId],
    queryFn: () => ProductService.getByLender(selectedLenderId),
    enabled: !!selectedLenderId,
  });

  const { data: ruleSets } = useQuery({
    queryKey: ['rule-sets', selectedProductId],
    queryFn: () => RuleSetService.getByProduct(selectedProductId),
    enabled: !!selectedProductId,
  });

  useEffect(() => { setSelectedProductId(''); setSelectedRuleSetId(''); }, [selectedLenderId]);
  useEffect(() => { setSelectedRuleSetId(''); }, [selectedProductId]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-background/80 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-14 gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold text-foreground">Lender Policy Administration</h1>
              <p className="text-xs text-muted-foreground">Configure rules, formulas, and decision logic</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Context Selectors */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Lender</label>
                <Select value={selectedLenderId} onValueChange={setSelectedLenderId}>
                  <SelectTrigger><SelectValue placeholder="Select lender" /></SelectTrigger>
                  <SelectContent>
                    {lenders?.map(l => (
                      <SelectItem key={l.id} value={l.id}>
                        <span className="flex items-center gap-2">
                          {l.name}
                          <Badge variant="outline" className="text-xs">{l.lender_type}</Badge>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Product</label>
                <Select value={selectedProductId} onValueChange={setSelectedProductId} disabled={!selectedLenderId}>
                  <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                  <SelectContent>
                    {products?.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.product_name} ({p.product_code})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Rule Set</label>
                <Select value={selectedRuleSetId} onValueChange={setSelectedRuleSetId} disabled={!selectedProductId}>
                  <SelectTrigger><SelectValue placeholder="Select rule set" /></SelectTrigger>
                  <SelectContent>
                    {ruleSets?.map(rs => (
                      <SelectItem key={rs.id} value={rs.id}>
                        {rs.rule_set_name} (v{rs.version_no}) {rs.is_active ? '✓' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="products" className="space-y-4">
          <TabsList className="flex-wrap h-auto gap-1 bg-muted/50 p-1">
            <TabsTrigger value="products" className="gap-1.5 text-sm"><Package className="h-4 w-4" />Products</TabsTrigger>
            <TabsTrigger value="rule-sets" className="gap-1.5 text-sm"><Layers className="h-4 w-4" />Rule Sets</TabsTrigger>
            <TabsTrigger value="rules" disabled={!selectedRuleSetId} className="gap-1.5 text-sm"><Cog className="h-4 w-4" />Rules</TabsTrigger>
            <TabsTrigger value="formulas" disabled={!selectedRuleSetId} className="gap-1.5 text-sm"><Calculator className="h-4 w-4" />Formulas</TabsTrigger>
            <TabsTrigger value="decisions" disabled={!selectedRuleSetId} className="gap-1.5 text-sm"><Grid3X3 className="h-4 w-4" />Decisions</TabsTrigger>
            <TabsTrigger value="test" className="gap-1.5 text-sm"><Play className="h-4 w-4" />Test Engine</TabsTrigger>
            <TabsTrigger value="match-config" className="gap-1.5 text-sm"><Settings2 className="h-4 w-4" />Match Config</TabsTrigger>
            <TabsTrigger value="audit" className="gap-1.5 text-sm"><History className="h-4 w-4" />Audit Log</TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <LenderProductManager lenderId={selectedLenderId} />
          </TabsContent>
          <TabsContent value="rule-sets">
            <RuleSetManager lenderId={selectedLenderId} productId={selectedProductId} onSelectRuleSet={setSelectedRuleSetId} />
          </TabsContent>
          <TabsContent value="rules">
            <RuleBuilder ruleSetId={selectedRuleSetId} />
          </TabsContent>
          <TabsContent value="formulas">
            <FormulaBuilder ruleSetId={selectedRuleSetId} />
          </TabsContent>
          <TabsContent value="decisions">
            <DecisionMatrixEditor ruleSetId={selectedRuleSetId} />
          </TabsContent>
          <TabsContent value="test">
            <TestRuleEngine lenderId={selectedLenderId} productId={selectedProductId} ruleSetId={selectedRuleSetId} />
          </TabsContent>
          <TabsContent value="match-config">
            <MatchConfigEditor />
          </TabsContent>
          <TabsContent value="audit">
            <PolicyAuditLog lenderId={selectedLenderId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default LenderPolicyAdmin;
