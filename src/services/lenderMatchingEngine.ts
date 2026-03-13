// Auto Lender Matching Engine - Scores, ranks, and recommends best lender/product
import { supabase } from '@/integrations/supabase/client';
import { RuleEngineExecutor } from './ruleEngineExecutor';
import type { LenderExecutionResult } from '@/types/ruleEngine.types';

const from = (table: string) => (supabase as any).from(table);

export interface MatchConfig {
  eligibility_weight: number;
  rule_pass_weight: number;
  limit_weight: number;
  risk_weight: number;
  cheque_return_deduction: number;
  negative_balance_deduction: number;
  vat_mismatch_deduction: number;
  customer_concentration_deduction: number;
  base_probability_factor: number;
}

export interface LenderMatchResult {
  id?: string;
  case_id: string;
  lender_id: string;
  product_id: string;
  execution_result_id: string;
  match_score: number;
  eligibility_score: number;
  rule_pass_score: number;
  limit_score: number;
  risk_score: number;
  approval_probability: number;
  rank_position: number;
  recommended_limit: number;
  recommended_tenure: number | null;
  decision_status: string;
  lender_name: string;
  product_name: string | null;
  risk_flags: string[];
  recommendation_reasons: string[];
  sales_pitch: string | null;
  is_best_match: boolean;
  created_at?: string;
}

const DEFAULT_CONFIG: MatchConfig = {
  eligibility_weight: 40,
  rule_pass_weight: 20,
  limit_weight: 20,
  risk_weight: 20,
  cheque_return_deduction: 3,
  negative_balance_deduction: 2,
  vat_mismatch_deduction: 3,
  customer_concentration_deduction: 2,
  base_probability_factor: 0.9,
};

export class LenderMatchingEngine {
  /** Load config from database or use defaults */
  static async getConfig(): Promise<MatchConfig> {
    const { data } = await from('lender_match_config')
      .select('*').eq('is_active', true).limit(1).single();
    if (!data) return DEFAULT_CONFIG;
    return {
      eligibility_weight: Number(data.eligibility_weight),
      rule_pass_weight: Number(data.rule_pass_weight),
      limit_weight: Number(data.limit_weight),
      risk_weight: Number(data.risk_weight),
      cheque_return_deduction: Number(data.cheque_return_deduction),
      negative_balance_deduction: Number(data.negative_balance_deduction),
      vat_mismatch_deduction: Number(data.vat_mismatch_deduction),
      customer_concentration_deduction: Number(data.customer_concentration_deduction),
      base_probability_factor: Number(data.base_probability_factor),
    };
  }

  /** Calculate eligibility score component */
  static calcEligibilityScore(status: string, weight: number): number {
    switch (status) {
      case 'eligible': return weight;
      case 'conditionally_eligible': return weight * 0.75;
      case 'review_required': return weight * 0.5;
      default: return 0;
    }
  }

  /** Calculate rule pass rate score */
  static calcRulePassScore(
    result: LenderExecutionResult, totalRules: number, weight: number
  ): number {
    if (totalRules === 0) return weight;
    const passed = totalRules - (result.major_fail_count + result.minor_fail_count);
    return Math.round((passed / totalRules) * weight * 100) / 100;
  }

  /** Calculate limit strength score */
  static calcLimitScore(
    recommendedLimit: number, maxLimit: number | null, weight: number
  ): number {
    if (!maxLimit || maxLimit === 0) return recommendedLimit > 0 ? weight : 0;
    return Math.min(weight, Math.round((recommendedLimit / maxLimit) * weight * 100) / 100);
  }

  /** Calculate risk quality score (includes Related Party Score) */
  static calcRiskScore(
    normalizedData: Record<string, any>, config: MatchConfig
  ): number {
    let score = config.risk_weight;
    if ((normalizedData.returned_cheque_count || 0) > 0)
      score -= config.cheque_return_deduction;
    if ((normalizedData.negative_balance_days || 0) > 5)
      score -= config.negative_balance_deduction;
    if ((normalizedData.bank_vat_variance || 0) > 15)
      score -= config.vat_mismatch_deduction;
    if ((normalizedData.top_5_customer_concentration || 0) > 60)
      score -= config.customer_concentration_deduction;

    // Related Party Score: <10% → +5, 10–25% → +3, >25% → 0 + flag
    const rpRatio = normalizedData.related_party_ratio || normalizedData.related_party_flow_ratio || 0;
    if (rpRatio < 0.10) {
      score += 5;
    } else if (rpRatio <= 0.25) {
      score += 3;
    }
    // >25% adds 0 and risk flag is handled separately

    return Math.max(0, score);
  }

  /** Calculate related party score standalone (for display) */
  static calcRelatedPartyScore(rpRatio: number): { score: number; flag: boolean } {
    if (rpRatio < 0.10) return { score: 5, flag: false };
    if (rpRatio <= 0.25) return { score: 3, flag: false };
    return { score: 0, flag: true };
  }

  /** Generate recommendation reasons */
  static generateReasons(
    result: LenderExecutionResult, normalizedData: Record<string, any>
  ): string[] {
    const reasons: string[] = [];
    if (result.eligibility_status === 'eligible')
      reasons.push('Meets all eligibility rules');
    if ((normalizedData.avg_monthly_bank_credit || 0) > 100000)
      reasons.push('Strong monthly turnover');
    if ((normalizedData.returned_cheque_count || 0) === 0)
      reasons.push('Clean banking conduct');
    if ((normalizedData.bank_vat_variance || 0) <= 10)
      reasons.push('VAT-bank consistency within threshold');
    if ((normalizedData.statement_months_covered || 0) >= 6)
      reasons.push('Adequate statement coverage');
    if (result.risk_flags.length === 0)
      reasons.push('No risk flags identified');
    if (result.major_fail_count === 0 && result.minor_fail_count <= 1)
      reasons.push('Minimal rule failures');
    return reasons;
  }

  /** Generate sales pitch */
  static generateSalesPitch(
    lenderName: string, productName: string | null,
    normalizedData: Record<string, any>, reasons: string[]
  ): string {
    const turnover = normalizedData.avg_monthly_bank_credit || 0;
    const turnoverStr = turnover > 1000000
      ? `AED ${(turnover / 1000000).toFixed(1)}M`
      : `AED ${Math.round(turnover / 1000).toLocaleString()}K`;
    
    const strengths = reasons.slice(0, 3).map(r => r.toLowerCase()).join(', ');
    return `This client fits ${lenderName} ${productName || 'financing'} because monthly turnover of ${turnoverStr} ${strengths ? `with ${strengths}` : ''} aligns well with the lender's risk appetite.`;
  }

  /** Main entry: run all lenders, score, rank, and save */
  static async runMatchingEngine(caseId: string): Promise<LenderMatchResult[]> {
    // Step 1: Run all lender rule engines
    const executionResults = await RuleEngineExecutor.executeAllLenders(caseId);
    if (executionResults.length === 0) return [];

    // Get config and normalized data
    const [config, normalizedData] = await Promise.all([
      this.getConfig(),
      RuleEngineExecutor.getNormalizedFields(caseId),
    ]);

    // Get rule counts and product details per execution
    const matchResults: LenderMatchResult[] = [];

    for (const result of executionResults) {
      // Get total rules count for this rule set
      const { count: totalRules } = await from('lender_rules')
        .select('*', { count: 'exact', head: true })
        .eq('rule_set_id', result.rule_set_id)
        .eq('is_active', true);

      // Get product info
      const { data: product } = await from('lender_products')
        .select('*').eq('id', result.product_id).single();

      // Get lender info
      const { data: lender } = await supabase
        .from('onboarding_lenders').select('name').eq('id', result.lender_id).single();

      // Step 2: Calculate match score components
      const eligibilityScore = this.calcEligibilityScore(
        result.eligibility_status, config.eligibility_weight
      );
      const rulePassScore = this.calcRulePassScore(
        result, totalRules || 0, config.rule_pass_weight
      );
      const limitScore = this.calcLimitScore(
        result.recommended_limit, product?.max_limit, config.limit_weight
      );
      const riskScore = this.calcRiskScore(normalizedData, config);

      const matchScore = Math.round(
        (eligibilityScore + rulePassScore + limitScore + riskScore) * 100
      ) / 100;

      // Step 3: Calculate approval probability
      const approvalProbability = Math.round(
        matchScore * config.base_probability_factor
      );

      // Generate reasons and pitch
      const reasons = this.generateReasons(result, normalizedData);
      const salesPitch = this.generateSalesPitch(
        lender?.name || 'Unknown', product?.product_name, normalizedData, reasons
      );

      matchResults.push({
        case_id: caseId,
        lender_id: result.lender_id,
        product_id: result.product_id,
        execution_result_id: result.id,
        match_score: matchScore,
        eligibility_score: eligibilityScore,
        rule_pass_score: rulePassScore,
        limit_score: limitScore,
        risk_score: riskScore,
        approval_probability: Math.min(99, Math.max(0, approvalProbability)),
        rank_position: 0, // will be set after sorting
        recommended_limit: result.recommended_limit,
        recommended_tenure: result.recommended_tenure,
        decision_status: result.eligibility_status,
        lender_name: lender?.name || 'Unknown',
        product_name: product?.product_name || null,
        risk_flags: result.risk_flags,
        recommendation_reasons: reasons,
        sales_pitch: salesPitch,
        is_best_match: false,
      });
    }

    // Step 4: Rank lenders
    matchResults.sort((a, b) => {
      if (b.match_score !== a.match_score) return b.match_score - a.match_score;
      if (b.approval_probability !== a.approval_probability)
        return b.approval_probability - a.approval_probability;
      return b.recommended_limit - a.recommended_limit;
    });

    matchResults.forEach((r, i) => {
      r.rank_position = i + 1;
      r.is_best_match = i === 0;
    });

    // Step 5: Save results
    await from('lender_match_results').delete().eq('case_id', caseId);
    
    const toInsert = matchResults.map(({ id, ...rest }) => rest);
    const { data: saved, error } = await from('lender_match_results')
      .insert(toInsert).select();
    
    if (error) {
      console.error('Error saving match results:', error);
      throw error;
    }

    return saved || matchResults;
  }

  /** Load existing match results for a case */
  static async getMatchResults(caseId: string): Promise<LenderMatchResult[]> {
    const { data, error } = await from('lender_match_results')
      .select('*')
      .eq('case_id', caseId)
      .order('rank_position');
    
    if (error) throw error;
    return (data || []) as LenderMatchResult[];
  }

  /** Save match config */
  static async saveConfig(config: Partial<MatchConfig>): Promise<void> {
    const { data: existing } = await from('lender_match_config')
      .select('id').eq('is_active', true).limit(1).single();
    
    if (existing) {
      await from('lender_match_config')
        .update({ ...config, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
    } else {
      await from('lender_match_config')
        .insert({ ...config, config_name: 'default', is_active: true });
    }
  }
}
