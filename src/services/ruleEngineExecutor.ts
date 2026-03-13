// Rule Engine Executor - Evaluates cases against database-driven lender rules
import { supabase } from '@/integrations/supabase/client';
import type { LenderRule, LenderFormulaConfig, LenderDecisionMatrix, LenderExecutionResult, LenderRuleResultDetail } from '@/types/ruleEngine.types';

import { RelatedPartyService } from '@/services/relatedPartyService';

const from = (table: string) => (supabase as any).from(table);

export class RuleEngineExecutor {
  /** Build normalized financial fields from assessment case data */
  static async getNormalizedFields(caseId: string): Promise<Record<string, any>> {
    const { data: caseData, error } = await supabase
      .from('assessment_cases').select('*').eq('id', caseId).single();
    if (error || !caseData) throw new Error('Case not found or incomplete');

    // Get bank summaries and related party data in parallel
    const [{ data: summaries }, rpSummary] = await Promise.all([
      supabase.from('assessment_bank_summaries').select('*').eq('case_id', caseId),
      RelatedPartyService.getFlowSummary(caseId),
    ]);

    const totalBounces = (summaries || []).reduce((sum, s) => sum + (s.bounce_count || 0), 0);
    const totalCash = (summaries || []).reduce((sum, s) => sum + (s.cash_deposit_total || 0), 0);
    const totalNegDays = (summaries || []).reduce((sum, s) => sum + (s.negative_balance_days || 0), 0);
    const cashRatio = caseData.total_bank_credits && caseData.total_bank_credits > 0
      ? (totalCash / Number(caseData.total_bank_credits)) * 100 : 0;

    // Related party metrics
    const rpRatio = rpSummary ? Number(rpSummary.related_party_ratio) || 0 : 0;
    const rpCredits = rpSummary ? Number(rpSummary.total_related_credit) || 0 : 0;
    const totalCredits = Number(caseData.total_bank_credits) || 0;
    const rpAdjustedTurnover = totalCredits - rpCredits;

    return {
      avg_monthly_bank_credit: Number(caseData.avg_monthly_credit) || 0,
      avg_monthly_debit: Number(caseData.avg_monthly_debit) || 0,
      avg_monthly_balance: Number(caseData.avg_monthly_balance) || 0,
      adjusted_monthly_turnover: (Number(caseData.normalized_turnover) || 0) / Math.max(caseData.statement_months_covered || 1, 1),
      vat_monthly_sales: (Number(caseData.declared_vat_turnover) || 0) / 12,
      bank_vat_variance: Number(caseData.bank_vat_variance_percent) || 0,
      negative_balance_days: totalNegDays,
      returned_cheque_count: totalBounces,
      cash_deposit_ratio: Math.round(cashRatio * 100) / 100,
      internal_transfer_pct: 0,
      one_off_credit_pct: 0,
      business_vintage_months: 0,
      statement_months_covered: caseData.statement_months_covered || 0,
      vat_periods_covered: caseData.vat_periods_covered || 0,
      normalized_annual_turnover: Number(caseData.normalized_turnover) || 0,
      estimated_annual_turnover: Number(caseData.estimated_annual_turnover) || 0,
      declared_vat_turnover: Number(caseData.declared_vat_turnover) || 0,
      total_bank_credits: totalCredits,
      total_bank_debits: Number(caseData.total_bank_debits) || 0,
      pos_monthly_settlement: 0,
      ecommerce_monthly_settlement: 0,
      trade_license_valid: true,
      vat_trn_available: (caseData.vat_periods_covered || 0) > 0,
      vat_filed_regularly: (caseData.vat_periods_covered || 0) >= 4,
      compliance_flag: false,
      restricted_industry_flag: false,
      receivables_overdue_pct: 0,
      repeat_buyer_ratio: 0,
      top_5_customer_concentration: 0,
      inventory_value: 0,
      inventory_turn_days: 0,
      // Related Party fields
      related_party_ratio: Math.round(rpRatio * 10000) / 100, // as percentage (e.g. 18.5)
      related_party_adjusted_turnover: Math.max(0, rpAdjustedTurnover),
      related_party_count: rpSummary ? rpSummary.number_of_related_entities || 0 : 0,
      related_party_flow_ratio: rpRatio, // raw ratio for BBRS score
      // HFS-specific fields (analyst-input via Manual Review)
      receivable_days: Number((caseData as any).receivable_days) || 0,
      gross_margin_pct: Number((caseData as any).gross_margin_pct) || 0,
      existing_debt_count: Number((caseData as any).existing_debt_count) || 0,
      uae_revenue_pct: Number((caseData as any).uae_revenue_pct) || 0,
      b2b_revenue_pct: Number((caseData as any).b2b_revenue_pct) || 0,
      cash_collection_pct: Number((caseData as any).cash_collection_pct) || 0,
      proceeds_for_cogs: (caseData as any).proceeds_for_cogs || false,
      past_breakeven: (caseData as any).past_breakeven || false,
    };
  }

  /** Evaluate a single condition */
  static evaluateCondition(
    value: any, operator: string,
    threshold: string | null, thresholdSecondary?: string | null
  ): boolean {
    const numValue = typeof value === 'number' ? value : parseFloat(String(value || '0'));
    const numThreshold = parseFloat(String(threshold || '0'));

    switch (operator) {
      case '=': return String(value) === String(threshold);
      case '!=': return String(value) !== String(threshold);
      case '>': return numValue > numThreshold;
      case '>=': return numValue >= numThreshold;
      case '<': return numValue < numThreshold;
      case '<=': return numValue <= numThreshold;
      case 'between':
        return numValue >= numThreshold && numValue <= parseFloat(String(thresholdSecondary || '0'));
      case 'in':
        return (threshold || '').split(',').map(s => s.trim()).includes(String(value));
      case 'not_in':
        return !(threshold || '').split(',').map(s => s.trim()).includes(String(value));
      case 'contains':
        return String(value || '').toLowerCase().includes(String(threshold || '').toLowerCase());
      case 'not_contains':
        return !String(value || '').toLowerCase().includes(String(threshold || '').toLowerCase());
      case 'is_true':
        return value === true || value === 'true' || value === 1;
      case 'is_false':
        return value === false || value === 'false' || value === 0 || !value;
      case 'exists':
        return value !== null && value !== undefined && value !== '' && value !== 0;
      case 'not_exists':
        return value === null || value === undefined || value === '' || value === 0;
      case 'percentage_gt': return numValue > numThreshold;
      case 'percentage_lt': return numValue < numThreshold;
      default: return true;
    }
  }

  /** Evaluate a formula to calculate a numeric result */
  static evaluateFormula(normalizedData: Record<string, any>, formula: LenderFormulaConfig): number {
    if (formula.formula_expression) {
      return this.evaluateExpression(formula.formula_expression, normalizedData);
    }
    const baseValue = Number(normalizedData[formula.base_field] || 0);
    let result = baseValue * (Number(formula.multiplier) || 1);
    if (formula.cap_value && result > Number(formula.cap_value)) result = Number(formula.cap_value);
    if (formula.floor_value && result < Number(formula.floor_value)) result = Number(formula.floor_value);
    return Math.round(result);
  }

  /** Safe expression evaluator supporting min/max and basic math — NO Function()/eval */
  static evaluateExpression(expr: string, data: Record<string, any>): number {
    let processed = expr;
    const sortedKeys = Object.keys(data).sort((a, b) => b.length - a.length);
    for (const key of sortedKeys) {
      processed = processed.replace(new RegExp(`\\b${key}\\b`, 'g'), String(data[key] ?? 0));
    }
    // Handle min/max (nested not supported)
    processed = processed.replace(/min\(([^)]+)\)/gi, (_, args) => {
      const values = args.split(',').map((s: string) => parseFloat(s.trim()) || 0);
      return String(Math.min(...values));
    });
    processed = processed.replace(/max\(([^)]+)\)/gi, (_, args) => {
      const values = args.split(',').map((s: string) => parseFloat(s.trim()) || 0);
      return String(Math.max(...values));
    });
    try {
      // Validate: only allow digits, operators, parens, dots, spaces, modulo
      if (/^[0-9+\-*/().%\s,]+$/.test(processed)) {
        return this.safeEvaluateMath(processed);
      }
      return 0;
    } catch {
      return 0;
    }
  }

  /** Evaluate a simple math expression safely without Function()/eval using a recursive descent parser */
  private static safeEvaluateMath(expr: string): number {
    const input = expr.replace(/\s+/g, '');
    let pos = 0;

    const peek = (): string => input[pos] || '';
    const advance = (): string => input[pos++] || '';

    const parseNumber = (): number => {
      let numStr = '';
      // Handle negative numbers only at start or after operator/paren
      if (peek() === '-') numStr += advance();
      while (pos < input.length && /[0-9.]/.test(peek())) numStr += advance();
      if (numStr === '' || numStr === '-') return 0;
      return parseFloat(numStr) || 0;
    };

    const parseFactor = (): number => {
      if (peek() === '(') {
        advance(); // '('
        const val = parseExpr();
        if (peek() === ')') advance(); // ')'
        return val;
      }
      return parseNumber();
    };

    const parseTerm = (): number => {
      let left = parseFactor();
      while (pos < input.length && (peek() === '*' || peek() === '/' || peek() === '%')) {
        const op = advance();
        const right = parseFactor();
        if (op === '*') left *= right;
        else if (op === '%') left = right !== 0 ? left % right : 0;
        else left = right !== 0 ? left / right : 0;
      }
      return left;
    };

    const parseExpr = (): number => {
      let left = parseTerm();
      while (pos < input.length && (peek() === '+' || peek() === '-')) {
        const op = advance();
        const right = parseTerm();
        if (op === '+') left += right;
        else left -= right;
      }
      return left;
    };

    const result = parseExpr();
    return isFinite(result) ? result : 0;
  }

  /** Execute rules for a single product */
  static async executeForProduct(
    caseId: string, lenderId: string, productId: string,
    ruleSetId: string, normalizedData: Record<string, any>
  ): Promise<{ execution: Omit<LenderExecutionResult, 'id'>; details: Omit<LenderRuleResultDetail, 'id' | 'execution_id'>[] }> {
    const [rulesRes, formulasRes, matrixRes, productRes] = await Promise.all([
      from('lender_rules').select('*').eq('rule_set_id', ruleSetId).eq('is_active', true).order('priority_order'),
      from('lender_formula_configs').select('*').eq('rule_set_id', ruleSetId).eq('is_active', true),
      from('lender_decision_matrix').select('*').eq('rule_set_id', ruleSetId).order('min_major_failures'),
      from('lender_products').select('*').eq('id', productId).single(),
    ]);

    const rules: LenderRule[] = rulesRes.data || [];
    const formulas: LenderFormulaConfig[] = formulasRes.data || [];
    const matrix: LenderDecisionMatrix[] = matrixRes.data || [];
    const product = productRes.data;

    let score = 100;
    let majorFails = 0, minorFails = 0;
    const riskFlags: string[] = [];
    const failedRules: any[] = [];
    const details: Omit<LenderRuleResultDetail, 'id' | 'execution_id'>[] = [];
    let limitAdjustment = 1;
    let tenureAdjustment = 0;
    let hardReject = false;
    let limitCap: number | null = null;
    let pricingBand: string | null = null;

    for (const rule of rules) {
      const observedValue = normalizedData[rule.field_name];
      const passed = this.evaluateCondition(observedValue, rule.operator, rule.threshold_value, rule.threshold_value_secondary);
      let message = '', impactType = 'none', impactValue = '';

      if (passed) {
        message = `${rule.rule_name}: Passed`;
        if (rule.action_type === 'ADD_SCORE') {
          score += parseFloat(rule.action_value || '0');
          impactType = 'score_add'; impactValue = rule.action_value || '0';
        }
      } else {
        message = rule.failure_message || `${rule.rule_name}: Failed`;
        switch (rule.action_type) {
          case 'FAIL':
            if (rule.severity === 'major' || rule.severity === 'critical') majorFails++;
            else minorFails++;
            failedRules.push({ rule_code: rule.rule_code, rule_name: rule.rule_name, severity: rule.severity });
            break;
          case 'REJECT':
            hardReject = true; majorFails++;
            failedRules.push({ rule_code: rule.rule_code, rule_name: rule.rule_name, severity: 'critical' });
            break;
          case 'WARNING': case 'REVIEW':
            riskFlags.push(rule.review_message || rule.rule_name);
            break;
          case 'REDUCE_LIMIT':
            limitAdjustment *= (1 - parseFloat(rule.action_value || '0.1'));
            impactType = 'limit_reduction'; impactValue = rule.action_value || '10%';
            break;
          case 'CAP_LIMIT':
            const cap = parseFloat(rule.action_value || '0');
            if (cap > 0) limitCap = limitCap ? Math.min(limitCap, cap) : cap;
            impactType = 'limit_cap'; impactValue = rule.action_value || '0';
            break;
          case 'REDUCE_TENURE':
            tenureAdjustment += parseInt(rule.action_value || '6');
            impactType = 'tenure_reduction'; impactValue = rule.action_value || '6';
            break;
          case 'APPLY_HAIRCUT':
            limitAdjustment *= (1 - parseFloat(rule.action_value || '0.2'));
            impactType = 'haircut'; impactValue = rule.action_value || '20%';
            break;
          case 'ADD_RISK_FLAG':
            riskFlags.push(rule.action_value || rule.rule_name);
            impactType = 'risk_flag';
            break;
          case 'DEDUCT_SCORE':
            score -= parseFloat(rule.action_value || '10');
            impactType = 'score_deduct'; impactValue = rule.action_value || '10';
            break;
          case 'REQUIRE_MANUAL_APPROVAL':
            riskFlags.push('Manual approval required');
            break;
        }
      }

      details.push({
        rule_id: rule.id, rule_code: rule.rule_code, field_name: rule.field_name,
        observed_value: String(observedValue ?? 'N/A'), operator: rule.operator,
        threshold_value: rule.threshold_value, pass_fail_status: passed ? 'pass' : 'fail',
        impact_type: impactType, impact_value: impactValue, message,
        created_at: new Date().toISOString(),
      });
    }

    // Calculate limit
    let recommendedLimit = 0;
    const limitFormula = formulas.find(f => f.formula_type === 'limit');
    if (limitFormula) {
      recommendedLimit = this.evaluateFormula(normalizedData, limitFormula);
    }
    recommendedLimit = Math.round(recommendedLimit * limitAdjustment);
    if (limitCap && recommendedLimit > limitCap) recommendedLimit = limitCap;
    if (product?.max_limit && recommendedLimit > product.max_limit) recommendedLimit = Number(product.max_limit);
    if (product?.min_limit && recommendedLimit > 0 && recommendedLimit < Number(product.min_limit)) recommendedLimit = 0;

    // Calculate tenure
    let recommendedTenure = product?.max_tenure || 36;
    const tenureFormula = formulas.find(f => f.formula_type === 'tenure');
    if (tenureFormula) recommendedTenure = this.evaluateFormula(normalizedData, tenureFormula);
    recommendedTenure = Math.max(product?.min_tenure || 1, recommendedTenure - tenureAdjustment);

    // Apply decision matrix
    let eligibilityStatus = 'not_eligible';
    let decisionSummary = '';
    if (hardReject) {
      eligibilityStatus = 'not_eligible';
      decisionSummary = 'Hard reject rule triggered';
    } else if (matrix.length > 0) {
      for (const row of matrix) {
        const majorMatch = majorFails >= row.min_major_failures && majorFails <= row.max_major_failures;
        const minorMatch = minorFails >= row.min_minor_failures && minorFails <= row.max_minor_failures;
        const scoreMatch = (row.score_from === null || score >= Number(row.score_from)) &&
                          (row.score_to === null || score <= Number(row.score_to));
        if (majorMatch && minorMatch && scoreMatch) {
          eligibilityStatus = row.decision_status;
          decisionSummary = row.remarks || '';
          break;
        }
      }
    } else {
      // Fallback when no decision matrix is configured — log warning for admin awareness
      console.warn(`No decision matrix configured for rule set ${ruleSetId}. Using default fallback logic.`);
      if (majorFails === 0 && minorFails === 0) eligibilityStatus = 'eligible';
      else if (majorFails === 0 && minorFails <= 2) eligibilityStatus = 'conditionally_eligible';
      else if (majorFails <= 1) eligibilityStatus = 'review_required';
      else eligibilityStatus = 'not_eligible';
      decisionSummary = 'Determined via default fallback (no decision matrix configured)';
    }
    if (recommendedLimit <= 0) eligibilityStatus = 'not_eligible';

    return {
      execution: {
        case_id: caseId, lender_id: lenderId, product_id: productId, rule_set_id: ruleSetId,
        eligibility_status: eligibilityStatus, recommended_limit: recommendedLimit,
        recommended_tenure: recommendedTenure, score: Math.max(0, score),
        major_fail_count: majorFails, minor_fail_count: minorFails,
        risk_flags: riskFlags, failed_rules: failedRules,
        decision_summary: decisionSummary, pricing_band: pricingBand || null,
        executed_at: new Date().toISOString(), executed_by: null,
      },
      details,
    };
  }

  /** Execute all active lenders for a case */
  static async executeAllLenders(caseId: string): Promise<LenderExecutionResult[]> {
    const normalizedData = await this.getNormalizedFields(caseId);
    const { data: user } = await supabase.auth.getUser();

    const { data: lenders } = await supabase.from('onboarding_lenders').select('*').eq('is_active', true);
    if (!lenders?.length) return [];

    // Mark previous results as inactive (preserve audit trail)
    await from('lender_execution_results').update({ is_active: false }).eq('case_id', caseId).eq('is_active', true);

    const results: LenderExecutionResult[] = [];
    for (const lender of lenders) {
      const { data: products } = await from('lender_products')
        .select('*').eq('lender_id', lender.id).eq('is_active', true);
      if (!products?.length) continue;

      for (const product of products) {
        const { data: ruleSets } = await from('lender_rule_sets')
          .select('*').eq('product_id', product.id).eq('is_active', true).limit(1);
        if (!ruleSets?.length) continue;

        try {
          const { execution, details } = await this.executeForProduct(
            caseId, lender.id, product.id, ruleSets[0].id, normalizedData
          );
          execution.executed_by = user?.user?.id || null;

          const { data: saved, error } = await from('lender_execution_results')
            .insert(execution).select().single();
          if (error) throw error;

          if (details.length > 0) {
            await from('lender_rule_result_details')
              .insert(details.map(d => ({ ...d, execution_id: saved.id })));
          }
          results.push(saved);
        } catch (e) {
          console.error(`Rule engine error for ${lender.name}:`, e);
        }
      }
    }
    return results;
  }

  /** Test execution (no save) */
  static async executeForTest(
    caseId: string, lenderId: string, productId: string, ruleSetId: string
  ): Promise<{ execution: any; details: any[]; normalizedData: Record<string, any> }> {
    const normalizedData = await this.getNormalizedFields(caseId);
    const result = await this.executeForProduct(caseId, lenderId, productId, ruleSetId, normalizedData);
    return { ...result, normalizedData };
  }
}
