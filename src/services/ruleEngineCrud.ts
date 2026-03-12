// Rule Engine CRUD Service - Database-driven lender policy management
import { supabase } from '@/integrations/supabase/client';
import type {
  LenderProduct, LenderRuleSet, LenderRule,
  LenderFormulaConfig, LenderDecisionMatrix, LenderPolicyAuditEntry,
} from '@/types/ruleEngine.types';

// Helper for tables not in generated types
const from = (table: string) => (supabase as any).from(table);

// ─── Products ────────────────────────────────────────────────────
export const ProductService = {
  async getByLender(lenderId: string): Promise<LenderProduct[]> {
    const { data, error } = await from('lender_products')
      .select('*').eq('lender_id', lenderId).order('product_name');
    if (error) throw error;
    return data || [];
  },

  async create(input: Partial<LenderProduct>): Promise<LenderProduct> {
    const { data, error } = await from('lender_products').insert(input).select().single();
    if (error) throw error;
    AuditService.log({ lender_id: input.lender_id!, product_id: data.id, action_done: 'product_created', new_value: data });
    return data;
  },

  async update(id: string, input: Partial<LenderProduct>): Promise<LenderProduct> {
    const { data: old } = await from('lender_products').select('*').eq('id', id).single();
    const { data, error } = await from('lender_products')
      .update({ ...input, updated_at: new Date().toISOString() }).eq('id', id).select().single();
    if (error) throw error;
    AuditService.log({ lender_id: data.lender_id, product_id: id, action_done: 'product_updated', old_value: old, new_value: data });
    return data;
  },

  async toggleActive(id: string, isActive: boolean): Promise<void> {
    const { error } = await from('lender_products')
      .update({ is_active: isActive, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
  },
};

// ─── Rule Sets ───────────────────────────────────────────────────
export const RuleSetService = {
  async getByProduct(productId: string): Promise<LenderRuleSet[]> {
    const { data, error } = await from('lender_rule_sets')
      .select('*').eq('product_id', productId).order('version_no', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async create(input: Partial<LenderRuleSet>): Promise<LenderRuleSet> {
    const { data, error } = await from('lender_rule_sets').insert(input).select().single();
    if (error) throw error;
    AuditService.log({ lender_id: input.lender_id!, product_id: input.product_id!, rule_set_id: data.id, action_done: 'rule_set_created', new_value: data });
    return data;
  },

  async update(id: string, input: Partial<LenderRuleSet>): Promise<LenderRuleSet> {
    const { data, error } = await from('lender_rule_sets')
      .update({ ...input, updated_at: new Date().toISOString() }).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async activate(id: string, productId: string): Promise<void> {
    await from('lender_rule_sets')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('product_id', productId).neq('id', id);
    const { error } = await from('lender_rule_sets')
      .update({ is_active: true, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
    AuditService.log({ rule_set_id: id, action_done: 'rule_set_activated' });
  },

  async duplicate(id: string): Promise<LenderRuleSet> {
    const { data: source } = await from('lender_rule_sets').select('*').eq('id', id).single();
    if (!source) throw new Error('Rule set not found');
    const { data: versions } = await from('lender_rule_sets')
      .select('version_no').eq('product_id', source.product_id)
      .order('version_no', { ascending: false }).limit(1);
    const nextVersion = (versions?.[0]?.version_no || 0) + 1;

    const { data: newSet, error } = await from('lender_rule_sets').insert({
      lender_id: source.lender_id, product_id: source.product_id,
      rule_set_name: `${source.rule_set_name} (v${nextVersion})`,
      version_no: nextVersion, is_active: false,
      remarks: `Duplicated from v${source.version_no}`,
    }).select().single();
    if (error) throw error;

    // Duplicate rules
    const { data: rules } = await from('lender_rules').select('*').eq('rule_set_id', id);
    if (rules?.length) {
      await from('lender_rules').insert(
        rules.map((r: any) => ({ ...r, id: undefined, rule_set_id: newSet.id, created_at: undefined, updated_at: undefined }))
      );
    }
    // Duplicate formulas
    const { data: formulas } = await from('lender_formula_configs').select('*').eq('rule_set_id', id);
    if (formulas?.length) {
      await from('lender_formula_configs').insert(
        formulas.map((f: any) => ({ ...f, id: undefined, rule_set_id: newSet.id, created_at: undefined, updated_at: undefined }))
      );
    }
    // Duplicate decision matrix
    const { data: matrix } = await from('lender_decision_matrix').select('*').eq('rule_set_id', id);
    if (matrix?.length) {
      await from('lender_decision_matrix').insert(
        matrix.map((m: any) => ({ ...m, id: undefined, rule_set_id: newSet.id, created_at: undefined, updated_at: undefined }))
      );
    }
    AuditService.log({ rule_set_id: newSet.id, action_done: 'rule_set_duplicated', old_value: { source_id: id, source_version: source.version_no } });
    return newSet;
  },
};

// ─── Rules ───────────────────────────────────────────────────────
export const RuleService = {
  async getByRuleSet(ruleSetId: string): Promise<LenderRule[]> {
    const { data, error } = await from('lender_rules')
      .select('*').eq('rule_set_id', ruleSetId).order('priority_order');
    if (error) throw error;
    return data || [];
  },

  async create(input: Partial<LenderRule>): Promise<LenderRule> {
    const { data, error } = await from('lender_rules').insert(input).select().single();
    if (error) throw error;
    AuditService.log({ rule_set_id: input.rule_set_id!, action_done: 'rule_created', new_value: data });
    return data;
  },

  async update(id: string, input: Partial<LenderRule>): Promise<LenderRule> {
    const { data: old } = await from('lender_rules').select('*').eq('id', id).single();
    const { data, error } = await from('lender_rules')
      .update({ ...input, updated_at: new Date().toISOString() }).eq('id', id).select().single();
    if (error) throw error;
    AuditService.log({ rule_set_id: data.rule_set_id, action_done: 'rule_updated', old_value: old, new_value: data });
    return data;
  },

  async remove(id: string): Promise<void> {
    const { data: old } = await from('lender_rules').select('*').eq('id', id).single();
    const { error } = await from('lender_rules').delete().eq('id', id);
    if (error) throw error;
    if (old) AuditService.log({ rule_set_id: old.rule_set_id, action_done: 'rule_deleted', old_value: old });
  },

  async toggleActive(id: string, isActive: boolean): Promise<void> {
    const { error } = await from('lender_rules')
      .update({ is_active: isActive, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
  },
};

// ─── Formulas ────────────────────────────────────────────────────
export const FormulaService = {
  async getByRuleSet(ruleSetId: string): Promise<LenderFormulaConfig[]> {
    const { data, error } = await from('lender_formula_configs')
      .select('*').eq('rule_set_id', ruleSetId).order('formula_type');
    if (error) throw error;
    return data || [];
  },

  async create(input: Partial<LenderFormulaConfig>): Promise<LenderFormulaConfig> {
    const { data, error } = await from('lender_formula_configs').insert(input).select().single();
    if (error) throw error;
    AuditService.log({ rule_set_id: input.rule_set_id!, action_done: 'formula_created', new_value: data });
    return data;
  },

  async update(id: string, input: Partial<LenderFormulaConfig>): Promise<LenderFormulaConfig> {
    const { data, error } = await from('lender_formula_configs')
      .update({ ...input, updated_at: new Date().toISOString() }).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async remove(id: string): Promise<void> {
    const { error } = await from('lender_formula_configs').delete().eq('id', id);
    if (error) throw error;
  },
};

// ─── Decision Matrix ─────────────────────────────────────────────
export const DecisionMatrixService = {
  async getByRuleSet(ruleSetId: string): Promise<LenderDecisionMatrix[]> {
    const { data, error } = await from('lender_decision_matrix')
      .select('*').eq('rule_set_id', ruleSetId).order('min_major_failures');
    if (error) throw error;
    return data || [];
  },

  async create(input: Partial<LenderDecisionMatrix>): Promise<LenderDecisionMatrix> {
    const { data, error } = await from('lender_decision_matrix').insert(input).select().single();
    if (error) throw error;
    return data;
  },

  async update(id: string, input: Partial<LenderDecisionMatrix>): Promise<LenderDecisionMatrix> {
    const { data, error } = await from('lender_decision_matrix')
      .update({ ...input, updated_at: new Date().toISOString() }).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async remove(id: string): Promise<void> {
    const { error } = await from('lender_decision_matrix').delete().eq('id', id);
    if (error) throw error;
  },
};

// ─── Audit Service ───────────────────────────────────────────────
export const AuditService = {
  async log(entry: Partial<LenderPolicyAuditEntry>): Promise<void> {
    try {
      await from('lender_policy_audit_log').insert({
        ...entry,
        changed_at: new Date().toISOString(),
      });
    } catch (e) {
      console.error('Audit log failed:', e);
    }
  },

  async getByLender(lenderId: string, limit = 100): Promise<LenderPolicyAuditEntry[]> {
    const { data, error } = await from('lender_policy_audit_log')
      .select('*').eq('lender_id', lenderId)
      .order('changed_at', { ascending: false }).limit(limit);
    if (error) throw error;
    return data || [];
  },

  async getAll(limit = 200): Promise<LenderPolicyAuditEntry[]> {
    const { data, error } = await from('lender_policy_audit_log')
      .select('*').order('changed_at', { ascending: false }).limit(limit);
    if (error) throw error;
    return data || [];
  },
};

// ─── Execution Results (read-only from admin) ────────────────────
export const ExecutionResultService = {
  async getByCase(caseId: string): Promise<LenderExecutionResult[]> {
    const { data, error } = await from('lender_execution_results')
      .select('*').eq('case_id', caseId).order('executed_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getDetails(executionId: string): Promise<any[]> {
    const { data, error } = await from('lender_rule_result_details')
      .select('*').eq('execution_id', executionId).order('created_at');
    if (error) throw error;
    return data || [];
  },
};

// Re-export type for convenience
type LenderExecutionResult = import('@/types/ruleEngine.types').LenderExecutionResult;
