/**
 * Professional Banking Risk Analysis Engine
 * Covers 15 analysis modules for credit underwriting
 */
import type { ParsedTransaction } from '@/types/assessment.types';
import { supabase } from '@/integrations/supabase/client';

export interface AccountAnalysisInput {
  accountNumber: string | null;
  bankName: string | null;
  transactions: ParsedTransaction[];
  periodFrom: string | null;
  periodTo: string | null;
}

export interface BankAnalysisResult {
  account_number: string | null;
  bank_name: string | null;
  period_from: string | null;
  period_to: string | null;
  months_covered: number;
  avg_monthly_credit_12m: number;
  avg_monthly_credit_24m: number;
  total_credits: number;
  avg_monthly_debit_12m: number;
  avg_monthly_debit_24m: number;
  total_debits: number;
  average_eod_balance: number;
  min_monthly_balance: number;
  max_monthly_balance: number;
  peak_month: string | null;
  trough_month: string | null;
  returned_cheque_count: number;
  returned_cheque_value: number;
  returned_cheque_ratio: number;
  returned_cheque_flag: boolean;
  emi_monthly_total: number;
  emi_lender_list: { lender: string; amount: number; frequency: string }[];
  monthly_salary_outflow: number;
  estimated_employee_count: number;
  salary_consistency_flag: string;
  cash_deposit_ratio: number;
  cash_risk_flag: boolean;
  largest_payer_name: string | null;
  largest_payer_ratio: number;
  payer_concentration_flag: boolean;
  month_end_balance_trend: string;
  circular_flow_ratio: number;
  round_tripping_flag: boolean;
  related_party_flow_ratio: number;
  related_party_flag: boolean;
  od_utilization_ratio: number;
  fx_transaction_ratio: number;
  fx_exposure_flag: boolean;
  government_receipt_ratio: number;
  government_receivable_flag: boolean;
}

export interface ConsolidatedAnalysis {
  total_monthly_credit: number;
  total_monthly_debit: number;
  overall_eod_balance: number;
  overall_cash_ratio: number;
  overall_return_ratio: number;
  largest_concentration_ratio: number;
  balance_trend: string;
  overall_emi_total: number;
  overall_salary_outflow: number;
  overall_round_tripping_flag: boolean;
  overall_related_party_flag: boolean;
  overall_od_utilization: number;
  overall_fx_ratio: number;
  overall_govt_ratio: number;
  overall_risk_flags: string[];
  accounts_analyzed: number;
  total_months_covered: number;
}

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ─── Keyword helpers ────────────────────────────────────────────

const matchAny = (desc: string, keywords: string[]) =>
  keywords.some(k => desc.includes(k));

const BOUNCE_KW = ['returned', 'bounce', 'rchq', 'returned cheque', 'return chq', 'dishono'];
const EMI_KW = ['loan', 'emi', 'installment', 'finance', 'credit facility', 'nbf loan', 'rakbank loan'];
const SALARY_KW = ['wps', 'salary', 'payroll', 'mohre', 'salary transfer'];
const CASH_KW = ['cash deposit', 'cash dep', 'cdm', 'atm cash', 'atm deposit', 'cash credit'];
const OD_KW = ['od ', 'cc ', 'overdraft', 'limit', 'facility'];
const FX_KW = ['usd', 'eur', 'gbp', 'swift', 'international transfer', 'foreign', 'fx'];
const GOVT_KW = ['government', 'ministry', 'municipality', 'authority', 'gov', 'semi-gov'];
const RELATED_KW = ['group', 'holding', 'sister', 'related entity', 'intercompany', 'inter-company'];

// ─── Core Analysis ──────────────────────────────────────────────

export class BankingRiskAnalysisEngine {

  static analyzeAccount(input: AccountAnalysisInput, relatedPartyNames: string[] = []): BankAnalysisResult {
    const txns = input.transactions;
    const desc = (t: ParsedTransaction) => (t.description || '').toLowerCase();

    // Group by month
    const monthMap = new Map<string, ParsedTransaction[]>();
    txns.forEach(t => {
      const d = new Date(t.date);
      if (isNaN(d.getTime())) return;
      const key = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
      if (!monthMap.has(key)) monthMap.set(key, []);
      monthMap.get(key)!.push(t);
    });

    const monthCount = monthMap.size || 1;
    const totalCredits = txns.reduce((s, t) => s + t.credit, 0);
    const totalDebits = txns.reduce((s, t) => s + t.debit, 0);

    // 1. Average monthly credit
    const avg12 = monthCount <= 12 ? totalCredits / monthCount : totalCredits / 12;
    const avg24 = totalCredits / monthCount;

    // 2. Average monthly debit
    const avgDebit12 = monthCount <= 12 ? totalDebits / monthCount : totalDebits / 12;
    const avgDebit24 = totalDebits / monthCount;

    // 3. Average EOD balance - calculate daily closing balances
    const dailyBalances = this.computeDailyClosingBalances(txns);
    const averageEod = dailyBalances.length > 0
      ? dailyBalances.reduce((s, b) => s + b, 0) / dailyBalances.length : 0;

    // 4. Min/Max monthly balance
    let minBal = Infinity, maxBal = -Infinity;
    let peakMonth: string | null = null, troughMonth: string | null = null;
    monthMap.forEach((mt, label) => {
      const balances = mt.map(t => t.balance);
      const monthMin = Math.min(...balances);
      const monthMax = Math.max(...balances);
      if (monthMin < minBal) { minBal = monthMin; troughMonth = label; }
      if (monthMax > maxBal) { maxBal = monthMax; peakMonth = label; }
    });
    if (!isFinite(minBal)) minBal = 0;
    if (!isFinite(maxBal)) maxBal = 0;

    // 5. Cheque returns
    const bounced = txns.filter(t => matchAny(desc(t), BOUNCE_KW));
    const returnedValue = bounced.reduce((s, t) => s + t.debit + t.credit, 0);
    const returnRatio = totalCredits > 0 ? returnedValue / totalCredits : 0;

    // 6. EMI / Loan deductions
    const emiTxns = txns.filter(t => t.debit > 0 && matchAny(desc(t), EMI_KW));
    const emiTotal = emiTxns.reduce((s, t) => s + t.debit, 0);
    const emiMonthly = emiTotal / monthCount;
    // Group EMI by lender keyword
    const emiLenders = this.groupEmiLenders(emiTxns, monthCount);

    // 7. WPS / Salary
    const salaryTxns = txns.filter(t => t.debit > 0 && matchAny(desc(t), SALARY_KW));
    const salaryTotal = salaryTxns.reduce((s, t) => s + t.debit, 0);
    const monthlySalary = salaryTotal / monthCount;
    // Estimate employee count from monthly average individual salary (~5000 AED)
    const estEmployees = monthlySalary > 0 ? Math.round(monthlySalary / 5000) : 0;
    // Salary consistency
    const salaryByMonth = new Map<string, number>();
    salaryTxns.forEach(t => {
      const d = new Date(t.date);
      const k = `${d.getFullYear()}-${d.getMonth()}`;
      salaryByMonth.set(k, (salaryByMonth.get(k) || 0) + t.debit);
    });
    const salaryValues = Array.from(salaryByMonth.values());
    const salaryFlag = this.classifyConsistency(salaryValues);

    // 8. Cash deposit ratio
    const cashCredits = txns.filter(t => t.credit > 0 && matchAny(desc(t), CASH_KW));
    const cashTotal = cashCredits.reduce((s, t) => s + t.credit, 0);
    const cashRatio = totalCredits > 0 ? cashTotal / totalCredits : 0;

    // 9. Single party concentration
    const payerMap = new Map<string, number>();
    txns.filter(t => t.credit > 0).forEach(t => {
      const payer = this.extractPayerName(t.description);
      payerMap.set(payer, (payerMap.get(payer) || 0) + t.credit);
    });
    let largestPayerName: string | null = null;
    let largestPayerAmount = 0;
    payerMap.forEach((amount, name) => {
      if (amount > largestPayerAmount) {
        largestPayerAmount = amount;
        largestPayerName = name;
      }
    });
    const largestPayerRatio = totalCredits > 0 ? largestPayerAmount / totalCredits : 0;

    // 10. Month-end balance trend
    const monthEndBalances: number[] = [];
    const sortedMonths = Array.from(monthMap.entries()).sort((a, b) => {
      const [mA] = a; const [mB] = b;
      return mA.localeCompare(mB);
    });
    sortedMonths.forEach(([, mt]) => {
      if (mt.length > 0) monthEndBalances.push(mt[mt.length - 1].balance);
    });
    const balanceTrend = this.classifyTrend(monthEndBalances);

    // 11. Circular / round-tripping
    const circularRatio = this.detectCircularFlows(txns, totalCredits);

    // 12. Related party - use register names + keyword detection
    const relatedFlows = txns.filter(t => {
      const d2 = desc(t);
      if (matchAny(d2, RELATED_KW)) return true;
      // Match against registered related party names
      return relatedPartyNames.some(name => d2.includes(name));
    });
    const relatedValue = relatedFlows.reduce((s, t) => s + t.credit + t.debit, 0);
    const relatedRatio = (totalCredits + totalDebits) > 0 ? relatedValue / (totalCredits + totalDebits) : 0;

    // 13. OD/CC utilization
    const odTxns = txns.filter(t => matchAny(desc(t), OD_KW));
    const negativeBalanceDays = dailyBalances.filter(b => b < 0).length;
    const odRatio = dailyBalances.length > 0 ? negativeBalanceDays / dailyBalances.length : 0;

    // 14. FX transactions
    const fxTxns = txns.filter(t => matchAny(desc(t), FX_KW));
    const fxValue = fxTxns.reduce((s, t) => s + t.credit + t.debit, 0);
    const fxRatio = (totalCredits + totalDebits) > 0 ? fxValue / (totalCredits + totalDebits) : 0;

    // 15. Government receipts
    const govtCredits = txns.filter(t => t.credit > 0 && matchAny(desc(t), GOVT_KW));
    const govtTotal = govtCredits.reduce((s, t) => s + t.credit, 0);
    const govtRatio = totalCredits > 0 ? govtTotal / totalCredits : 0;

    return {
      account_number: input.accountNumber,
      bank_name: input.bankName,
      period_from: input.periodFrom,
      period_to: input.periodTo,
      months_covered: monthCount,
      avg_monthly_credit_12m: Math.round(avg12 * 100) / 100,
      avg_monthly_credit_24m: Math.round(avg24 * 100) / 100,
      total_credits: Math.round(totalCredits * 100) / 100,
      avg_monthly_debit_12m: Math.round(avgDebit12 * 100) / 100,
      avg_monthly_debit_24m: Math.round(avgDebit24 * 100) / 100,
      total_debits: Math.round(totalDebits * 100) / 100,
      average_eod_balance: Math.round(averageEod * 100) / 100,
      min_monthly_balance: Math.round(minBal * 100) / 100,
      max_monthly_balance: Math.round(maxBal * 100) / 100,
      peak_month: peakMonth,
      trough_month: troughMonth,
      returned_cheque_count: bounced.length,
      returned_cheque_value: Math.round(returnedValue * 100) / 100,
      returned_cheque_ratio: Math.round(returnRatio * 10000) / 10000,
      returned_cheque_flag: returnRatio > 0.05,
      emi_monthly_total: Math.round(emiMonthly * 100) / 100,
      emi_lender_list: emiLenders,
      monthly_salary_outflow: Math.round(monthlySalary * 100) / 100,
      estimated_employee_count: estEmployees,
      salary_consistency_flag: salaryFlag,
      cash_deposit_ratio: Math.round(cashRatio * 10000) / 10000,
      cash_risk_flag: cashRatio > 0.4,
      largest_payer_name: largestPayerName,
      largest_payer_ratio: Math.round(largestPayerRatio * 10000) / 10000,
      payer_concentration_flag: largestPayerRatio > 0.3,
      month_end_balance_trend: balanceTrend,
      circular_flow_ratio: Math.round(circularRatio * 10000) / 10000,
      round_tripping_flag: circularRatio > 0.1,
      related_party_flow_ratio: Math.round(relatedRatio * 10000) / 10000,
      related_party_flag: relatedRatio > 0.15,
      od_utilization_ratio: Math.round(odRatio * 10000) / 10000,
      fx_transaction_ratio: Math.round(fxRatio * 10000) / 10000,
      fx_exposure_flag: fxRatio > 0.2,
      government_receipt_ratio: Math.round(govtRatio * 10000) / 10000,
      government_receivable_flag: govtRatio > 0.3,
    };
  }

  static consolidate(results: BankAnalysisResult[]): ConsolidatedAnalysis {
    if (results.length === 0) {
      return {
        total_monthly_credit: 0, total_monthly_debit: 0, overall_eod_balance: 0,
        overall_cash_ratio: 0, overall_return_ratio: 0, largest_concentration_ratio: 0,
        balance_trend: 'stable', overall_emi_total: 0, overall_salary_outflow: 0,
        overall_round_tripping_flag: false, overall_related_party_flag: false,
        overall_od_utilization: 0, overall_fx_ratio: 0, overall_govt_ratio: 0,
        overall_risk_flags: [], accounts_analyzed: 0, total_months_covered: 0,
      };
    }

    const totalCredits = results.reduce((s, r) => s + r.total_credits, 0);
    const totalDebits = results.reduce((s, r) => s + r.total_debits, 0);
    const maxMonths = Math.max(...results.map(r => r.months_covered));
    const monthlyCredit = totalCredits / (maxMonths || 1);
    const monthlyDebit = totalDebits / (maxMonths || 1);

    // Weighted averages
    const weightedEod = results.reduce((s, r) => s + r.average_eod_balance * r.months_covered, 0)
      / results.reduce((s, r) => s + r.months_covered, 0);

    const overallCash = totalCredits > 0
      ? results.reduce((s, r) => s + r.cash_deposit_ratio * r.total_credits, 0) / totalCredits : 0;
    const overallReturn = totalCredits > 0
      ? results.reduce((s, r) => s + r.returned_cheque_ratio * r.total_credits, 0) / totalCredits : 0;

    const largestConc = Math.max(...results.map(r => r.largest_payer_ratio));

    // Determine overall trend from the primary (highest volume) account
    const primaryAccount = results.sort((a, b) => b.total_credits - a.total_credits)[0];

    const flags: string[] = [];
    if (overallCash > 0.4) flags.push('High cash deposit ratio');
    if (overallReturn > 0.05) flags.push('High cheque return ratio');
    if (largestConc > 0.3) flags.push('Customer concentration risk');
    if (results.some(r => r.round_tripping_flag)) flags.push('Potential round-tripping detected');
    if (results.some(r => r.related_party_flag)) flags.push('Significant related party flows');

    return {
      total_monthly_credit: Math.round(monthlyCredit * 100) / 100,
      total_monthly_debit: Math.round(monthlyDebit * 100) / 100,
      overall_eod_balance: Math.round(weightedEod * 100) / 100,
      overall_cash_ratio: Math.round(overallCash * 10000) / 10000,
      overall_return_ratio: Math.round(overallReturn * 10000) / 10000,
      largest_concentration_ratio: Math.round(largestConc * 10000) / 10000,
      balance_trend: primaryAccount?.month_end_balance_trend || 'stable',
      overall_emi_total: Math.round(results.reduce((s, r) => s + r.emi_monthly_total, 0) * 100) / 100,
      overall_salary_outflow: Math.round(results.reduce((s, r) => s + r.monthly_salary_outflow, 0) * 100) / 100,
      overall_round_tripping_flag: results.some(r => r.round_tripping_flag),
      overall_related_party_flag: results.some(r => r.related_party_flag),
      overall_od_utilization: Math.max(...results.map(r => r.od_utilization_ratio)),
      overall_fx_ratio: Math.round(
        results.reduce((s, r) => s + r.fx_transaction_ratio * (r.total_credits + r.total_debits), 0)
        / Math.max(totalCredits + totalDebits, 1) * 10000
      ) / 10000,
      overall_govt_ratio: Math.round(
        results.reduce((s, r) => s + r.government_receipt_ratio * r.total_credits, 0)
        / Math.max(totalCredits, 1) * 10000
      ) / 10000,
      overall_risk_flags: flags,
      accounts_analyzed: results.length,
      total_months_covered: maxMonths,
    };
  }

  /**
   * Run full analysis and persist to database.
   * Also triggers related party detection if parties are registered.
   */
  static async runAndPersist(
    caseId: string,
    accounts: AccountAnalysisInput[]
  ): Promise<{ accountResults: BankAnalysisResult[]; consolidated: ConsolidatedAnalysis }> {
    // Fetch related party register for enhanced detection
    let relatedPartyNames: string[] = [];
    try {
      const { data: parties } = await (supabase.from('case_related_parties') as any)
        .select('entity_name')
        .eq('case_id', caseId)
        .eq('active_status', true);
      if (parties && parties.length > 0) {
        relatedPartyNames = parties.map((p: any) => p.entity_name.toLowerCase());
      }
    } catch { /* ignore */ }

    // Analyze each account with related party register
    const accountResults = accounts.map(a => this.analyzeAccount(a, relatedPartyNames));
    const consolidated = this.consolidate(accountResults);

    // Upsert approach: delete then insert (bank_analysis_results has no is_active flag and no audit trail requirement)
    // These are re-computable from source transactions, so delete-insert is acceptable here
    await supabase.from('bank_analysis_results').delete().eq('case_id', caseId);
    
    for (const r of accountResults) {
      await (supabase.from('bank_analysis_results') as any).insert({
        case_id: caseId,
        ...r,
        emi_lender_list: JSON.stringify(r.emi_lender_list),
      });
    }

    // Upsert consolidated (also re-computable, no audit trail needed)
    await supabase.from('bank_analysis_consolidated').delete().eq('case_id', caseId);
    await (supabase.from('bank_analysis_consolidated') as any).insert({
      case_id: caseId,
      ...consolidated,
      overall_risk_flags: JSON.stringify(consolidated.overall_risk_flags),
    });

    return { accountResults, consolidated };
  }

  // ─── Private helpers ────────────────────────────────────────

  private static computeDailyClosingBalances(txns: ParsedTransaction[]): number[] {
    if (txns.length === 0) return [];
    const sorted = [...txns].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const dailyMap = new Map<string, number>();
    sorted.forEach(t => {
      const key = new Date(t.date).toISOString().split('T')[0];
      dailyMap.set(key, t.balance); // last txn of the day wins
    });

    // Fill gaps
    const dates = Array.from(dailyMap.keys()).sort();
    if (dates.length === 0) return [];
    const start = new Date(dates[0]);
    const end = new Date(dates[dates.length - 1]);
    const result: number[] = [];
    let prevBal = dailyMap.get(dates[0]) || 0;
    const cur = new Date(start);
    while (cur <= end) {
      const key = cur.toISOString().split('T')[0];
      if (dailyMap.has(key)) prevBal = dailyMap.get(key)!;
      result.push(prevBal);
      cur.setDate(cur.getDate() + 1);
    }
    return result;
  }

  private static groupEmiLenders(
    emiTxns: ParsedTransaction[],
    monthCount: number
  ): { lender: string; amount: number; frequency: string }[] {
    const lenderMap = new Map<string, number>();
    const lenderCount = new Map<string, number>();
    emiTxns.forEach(t => {
      const d = (t.description || '').toLowerCase();
      let lender = 'Unknown';
      if (d.includes('rakbank')) lender = 'RAKBANK';
      else if (d.includes('nbf')) lender = 'NBF';
      else if (d.includes('adcb')) lender = 'ADCB';
      else if (d.includes('enbd') || d.includes('emirates nbd')) lender = 'Emirates NBD';
      else if (d.includes('fab')) lender = 'FAB';
      else if (d.includes('mashreq')) lender = 'Mashreq';
      else if (d.includes('dib')) lender = 'DIB';
      lenderMap.set(lender, (lenderMap.get(lender) || 0) + t.debit);
      lenderCount.set(lender, (lenderCount.get(lender) || 0) + 1);
    });
    return Array.from(lenderMap.entries()).map(([lender, total]) => ({
      lender,
      amount: Math.round(total / monthCount * 100) / 100,
      frequency: (lenderCount.get(lender) || 0) >= monthCount ? 'monthly' : 'irregular',
    }));
  }

  private static extractPayerName(description: string): string {
    const d = (description || '').trim();
    // Simple extraction: take first 30 chars excluding common prefixes
    const cleaned = d.replace(/^(trf from|b\/o|incoming|from|credit|cr)\s*/i, '').substring(0, 30).trim();
    return cleaned || 'Unknown';
  }

  private static classifyTrend(balances: number[]): string {
    if (balances.length < 3) return 'stable';
    const n = balances.length;
    let increasing = 0, decreasing = 0;
    for (let i = 1; i < n; i++) {
      if (balances[i] > balances[i - 1]) increasing++;
      else if (balances[i] < balances[i - 1]) decreasing++;
    }
    const avg = balances.reduce((s, v) => s + v, 0) / n;
    const variance = balances.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / n;
    const cv = avg !== 0 ? Math.sqrt(variance) / Math.abs(avg) : 0;

    if (cv > 0.5) return 'volatile';
    if (increasing >= n * 0.6) return 'increasing';
    if (decreasing >= n * 0.6) return 'declining';
    return 'stable';
  }

  private static classifyConsistency(values: number[]): string {
    if (values.length < 2) return 'insufficient_data';
    const avg = values.reduce((s, v) => s + v, 0) / values.length;
    if (avg === 0) return 'no_salary';
    const cv = Math.sqrt(values.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / values.length) / avg;
    if (cv < 0.15) return 'consistent';
    if (cv < 0.4) return 'irregular';
    return 'volatile';
  }

  private static detectCircularFlows(txns: ParsedTransaction[], totalCredits: number): number {
    if (totalCredits === 0) return 0;
    let circularValue = 0;
    // Group by date
    const dateMap = new Map<string, ParsedTransaction[]>();
    txns.forEach(t => {
      const key = new Date(t.date).toISOString().split('T')[0];
      if (!dateMap.has(key)) dateMap.set(key, []);
      dateMap.get(key)!.push(t);
    });

    dateMap.forEach(dayTxns => {
      const credits = dayTxns.filter(t => t.credit > 0);
      const debits = dayTxns.filter(t => t.debit > 0);
      credits.forEach(cr => {
        const match = debits.find(db =>
          Math.abs(db.debit - cr.credit) < 1 && db.debit > 0
        );
        if (match) circularValue += cr.credit;
      });
    });

    return circularValue / totalCredits;
  }
}
