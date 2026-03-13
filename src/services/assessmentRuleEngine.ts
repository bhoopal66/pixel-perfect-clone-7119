// Assessment Rule Engine - Evaluates case against lender rules
import type {
  CombinedFinancialSummary,
  BankMonthlyAnalysis,
  VatPeriodAnalysis,
  AssessmentLenderResult,
  RuleResult,
} from '@/types/assessment.types';

interface LenderConfig {
  id: string;
  name: string;
  short_code: string;
  lender_type: string;
  eligibility_rules: {
    min_turnover?: number;
    max_multiplier?: number;
    min_loan_amount?: number;
    max_loan_amount?: number | null;
    pos_cap_percent?: number;
    abcd_fee_percent?: number;
    reduced_multiplier?: number;
    variance_thresholds?: { eligible: number; reduced: number };
    // Extended rules for assessment engine
    min_statement_months?: number;
    min_avg_balance?: number;
    max_bounce_count?: number;
    max_cash_deposit_ratio?: number;
    credit_eligible_percent?: number;
    require_vat?: boolean;
    max_variance_percent?: number;
    pricing_tiers?: { min: number; max: number; rate: string }[];
    max_tenure_months?: number;
    industry_exclusions?: string[];
    // HFS-specific rules
    min_monthly_revenue?: number;
    max_monthly_revenue?: number;
    min_receivable_days?: number;
    min_uae_revenue_pct?: number;
    min_b2b_revenue_pct?: number;
    min_gross_margin_pct?: number;
    max_existing_debt?: number;
    require_past_breakeven?: boolean;
    require_proceeds_for_cogs?: boolean;
  };
}

export class AssessmentRuleEngine {
  /**
   * Evaluate a case against all lenders and return results
   */
  static evaluateAllLenders(
    summary: CombinedFinancialSummary,
    monthlySummaries: BankMonthlyAnalysis[],
    vatAnalysis: VatPeriodAnalysis[],
    lenders: LenderConfig[]
  ): Omit<AssessmentLenderResult, 'id' | 'case_id' | 'created_at' | 'updated_at'>[] {
    return lenders.map(lender => this.evaluateLender(summary, monthlySummaries, vatAnalysis, lender));
  }

  /**
   * Evaluate a case against a single lender
   */
  static evaluateLender(
    summary: CombinedFinancialSummary,
    monthlySummaries: BankMonthlyAnalysis[],
    vatAnalysis: VatPeriodAnalysis[],
    lender: LenderConfig
  ): Omit<AssessmentLenderResult, 'id' | 'case_id' | 'created_at' | 'updated_at'> {
    const rules = lender.eligibility_rules;
    const ruleResults: RuleResult[] = [];
    const riskFlags: string[] = [];
    const failedRules: RuleResult[] = [];
    const passedRules: RuleResult[] = [];
    const keyReasons: string[] = [];
    const requiredDeviations: string[] = [];

    // Rule 1: Minimum Turnover
    const minTurnover = rules.min_turnover || 0;
    const turnoverRule: RuleResult = {
      rule_name: 'Minimum Turnover',
      rule_description: `Annual turnover must be at least AED ${minTurnover.toLocaleString()}`,
      passed: summary.normalizedTurnover >= minTurnover,
      value: summary.normalizedTurnover,
      threshold: minTurnover,
      message: summary.normalizedTurnover >= minTurnover
        ? `Turnover AED ${summary.normalizedTurnover.toLocaleString()} meets minimum`
        : `Turnover AED ${summary.normalizedTurnover.toLocaleString()} below minimum AED ${minTurnover.toLocaleString()}`,
    };
    ruleResults.push(turnoverRule);
    if (turnoverRule.passed) passedRules.push(turnoverRule); else failedRules.push(turnoverRule);

    // Rule 2: Statement Coverage
    const minMonths = rules.min_statement_months || 6;
    const coverageRule: RuleResult = {
      rule_name: 'Statement Coverage',
      rule_description: `At least ${minMonths} months of bank statements required`,
      passed: summary.statementMonthsCovered >= minMonths,
      value: summary.statementMonthsCovered,
      threshold: minMonths,
      message: summary.statementMonthsCovered >= minMonths
        ? `${summary.statementMonthsCovered} months of statements provided`
        : `Only ${summary.statementMonthsCovered} months provided, minimum ${minMonths} required`,
    };
    ruleResults.push(coverageRule);
    if (coverageRule.passed) passedRules.push(coverageRule); else failedRules.push(coverageRule);

    // Rule 3: VAT Requirement
    if (rules.require_vat !== false) {
      const vatRule: RuleResult = {
        rule_name: 'VAT Returns',
        rule_description: 'VAT returns must be provided for verification',
        passed: summary.vatPeriodsCovered > 0,
        value: summary.vatPeriodsCovered,
        threshold: 1,
        message: summary.vatPeriodsCovered > 0
          ? `${summary.vatPeriodsCovered} VAT period(s) provided`
          : 'No VAT returns provided',
      };
      ruleResults.push(vatRule);
      if (vatRule.passed) passedRules.push(vatRule); else failedRules.push(vatRule);
    }

    // Rule 4: VAT-Bank Variance
    const maxVariance = rules.max_variance_percent || rules.variance_thresholds?.reduced || 25;
    if (summary.vatPeriodsCovered > 0) {
      const varianceRule: RuleResult = {
        rule_name: 'VAT-Bank Variance',
        rule_description: `Variance between VAT and bank turnover must be within ${maxVariance}%`,
        passed: summary.variancePercent <= maxVariance,
        value: `${summary.variancePercent}%`,
        threshold: `${maxVariance}%`,
        message: summary.variancePercent <= maxVariance
          ? `Variance ${summary.variancePercent}% within acceptable range`
          : `Variance ${summary.variancePercent}% exceeds ${maxVariance}% threshold`,
      };
      ruleResults.push(varianceRule);
      if (varianceRule.passed) passedRules.push(varianceRule);
      else {
        failedRules.push(varianceRule);
        riskFlags.push(`High VAT-Bank variance: ${summary.variancePercent}%`);
      }
    }

    // Rule 5: Bounce Check
    const maxBounces = rules.max_bounce_count ?? 3;
    const bounceRule: RuleResult = {
      rule_name: 'Cheque Returns',
      rule_description: `Maximum ${maxBounces} cheque returns allowed`,
      passed: summary.totalBounces <= maxBounces,
      value: summary.totalBounces,
      threshold: maxBounces,
      message: summary.totalBounces <= maxBounces
        ? `${summary.totalBounces} cheque return(s) - acceptable`
        : `${summary.totalBounces} cheque return(s) exceeds limit of ${maxBounces}`,
    };
    ruleResults.push(bounceRule);
    if (bounceRule.passed) passedRules.push(bounceRule);
    else {
      failedRules.push(bounceRule);
      riskFlags.push(`${summary.totalBounces} cheque returns detected`);
    }

    // Rule 6: Cash Deposit Ratio
    const maxCashRatio = rules.max_cash_deposit_ratio || 40;
    const cashRule: RuleResult = {
      rule_name: 'Cash Deposit Ratio',
      rule_description: `Cash deposits should not exceed ${maxCashRatio}% of total credits`,
      passed: summary.cashDepositRatio <= maxCashRatio,
      value: `${summary.cashDepositRatio}%`,
      threshold: `${maxCashRatio}%`,
      message: summary.cashDepositRatio <= maxCashRatio
        ? `Cash deposit ratio ${summary.cashDepositRatio}% within limits`
        : `Cash deposit ratio ${summary.cashDepositRatio}% exceeds ${maxCashRatio}%`,
    };
    ruleResults.push(cashRule);
    if (cashRule.passed) passedRules.push(cashRule);
    else {
      failedRules.push(cashRule);
      riskFlags.push(`High cash deposit ratio: ${summary.cashDepositRatio}%`);
    }

    // Rule 7: Average Balance
    const minBalance = rules.min_avg_balance || 0;
    if (minBalance > 0) {
      const balanceRule: RuleResult = {
        rule_name: 'Average Balance',
        rule_description: `Average monthly balance must be at least AED ${minBalance.toLocaleString()}`,
        passed: summary.avgMonthlyBalance >= minBalance,
        value: summary.avgMonthlyBalance,
        threshold: minBalance,
        message: summary.avgMonthlyBalance >= minBalance
          ? `Average balance AED ${summary.avgMonthlyBalance.toLocaleString()} meets requirement`
          : `Average balance AED ${summary.avgMonthlyBalance.toLocaleString()} below minimum`,
      };
      ruleResults.push(balanceRule);
      if (balanceRule.passed) passedRules.push(balanceRule); else failedRules.push(balanceRule);
    }

    // Rule 8: Negative Balance Days
    const negBalRule: RuleResult = {
      rule_name: 'Negative Balance',
      rule_description: 'Excessive negative balance days indicate cash flow issues',
      passed: summary.negativeBalanceDays <= 10,
      value: summary.negativeBalanceDays,
      threshold: 10,
      message: summary.negativeBalanceDays <= 10
        ? `${summary.negativeBalanceDays} negative balance day(s) - acceptable`
        : `${summary.negativeBalanceDays} negative balance days - cash flow concern`,
    };
    ruleResults.push(negBalRule);
    if (negBalRule.passed) passedRules.push(negBalRule);
    else {
      failedRules.push(negBalRule);
      riskFlags.push(`${summary.negativeBalanceDays} negative balance days`);
    }

    // Calculate recommended limit
    const multiplier = rules.max_multiplier || 8;
    const creditEligiblePct = (rules.credit_eligible_percent || 100) / 100;
    const eligibleTurnover = summary.normalizedTurnover * creditEligiblePct;
    
    let recommendedLimit = 0;
    let limitBasis = '';
    
    if (failedRules.length === 0) {
      recommendedLimit = eligibleTurnover * multiplier;
      limitBasis = `${creditEligiblePct * 100}% of normalized turnover × ${multiplier}x multiplier`;
    } else if (failedRules.length <= 2 && !failedRules.some(r => r.rule_name === 'Minimum Turnover')) {
      // Reduced multiplier for conditional eligibility
      const reducedMult = rules.reduced_multiplier || multiplier * 0.5;
      recommendedLimit = eligibleTurnover * reducedMult;
      limitBasis = `Reduced: ${creditEligiblePct * 100}% of turnover × ${reducedMult}x (${failedRules.length} rule(s) failed)`;
    }

    // Apply caps
    if (rules.max_loan_amount && recommendedLimit > rules.max_loan_amount) {
      recommendedLimit = rules.max_loan_amount;
      limitBasis += ` | Capped at AED ${rules.max_loan_amount.toLocaleString()}`;
    }
    if (rules.min_loan_amount && recommendedLimit > 0 && recommendedLimit < rules.min_loan_amount) {
      recommendedLimit = 0;
      limitBasis = `Below minimum loan amount of AED ${rules.min_loan_amount.toLocaleString()}`;
    }

    // Determine eligibility status
    let eligibilityStatus: AssessmentLenderResult['eligibility_status'] = 'not_eligible';
    if (failedRules.length === 0 && recommendedLimit > 0) {
      eligibilityStatus = 'eligible';
      keyReasons.push('All eligibility criteria met');
    } else if (failedRules.length <= 2 && recommendedLimit > 0) {
      eligibilityStatus = 'conditionally_eligible';
      keyReasons.push(`${failedRules.length} rule(s) require deviation`);
      failedRules.forEach(r => requiredDeviations.push(r.message));
    } else if (failedRules.length <= 3) {
      eligibilityStatus = 'review_required';
      keyReasons.push('Multiple rules failed - manual review needed');
    } else {
      keyReasons.push('Does not meet basic eligibility criteria');
    }

    // Determine pricing band
    let pricingBand: string | null = null;
    if (rules.pricing_tiers && recommendedLimit > 0) {
      const tier = rules.pricing_tiers.find(
        t => recommendedLimit >= t.min && (t.max === 0 || recommendedLimit <= t.max)
      );
      if (tier) pricingBand = tier.rate;
    }

    return {
      lender_id: lender.id,
      lender_name: lender.name,
      product_name: lender.lender_type === 'fintech' ? 'Revenue-Based Financing' : 'Business Loan',
      eligibility_status: eligibilityStatus,
      recommended_limit: Math.round(recommendedLimit),
      limit_basis: limitBasis,
      tenure_months: rules.max_tenure_months || null,
      pricing_band: pricingBand,
      key_reasons: keyReasons,
      failed_rules: failedRules,
      risk_flags: riskFlags,
      passed_rules: passedRules,
      required_deviations: requiredDeviations,
      rule_details: ruleResults,
    };
  }
}
