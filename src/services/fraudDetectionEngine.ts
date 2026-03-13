/**
 * Fraud and Manipulation Detection Engine
 * Automatically detects suspicious banking behavior patterns.
 * Runs after bank statement extraction and analysis.
 */
import { supabase } from '@/integrations/supabase/client';

const from = (table: string) => (supabase as any).from(table);

export interface FraudDetectionConfig {
  cash_ratio_threshold: number;
  revenue_mismatch_threshold: number;
  circular_transaction_time_window: number;
  window_dressing_period: number;
  structured_transaction_count: number;
  rapid_outflow_hours: number;
  circular_deduction: number;
  round_tripping_deduction: number;
  artificial_turnover_deduction: number;
  cash_rotation_deduction: number;
  window_dressing_deduction: number;
  structured_txn_deduction: number;
  rapid_outflow_deduction: number;
  related_party_rotation_deduction: number;
  suspicious_counterparty_deduction: number;
  revenue_mismatch_deduction: number;
}

export interface FraudDetectionResult {
  id: string;
  case_id: string;
  circular_transaction_count: number;
  circular_transaction_value: number;
  round_tripping_flag: boolean;
  round_tripping_count: number;
  artificial_turnover_flag: boolean;
  artificial_turnover_value: number;
  cash_rotation_flag: boolean;
  cash_deposit_ratio: number;
  window_dressing_flag: boolean;
  window_dressing_count: number;
  structured_transaction_flag: boolean;
  structured_transaction_count: number;
  rapid_outflow_flag: boolean;
  rapid_outflow_count: number;
  related_party_rotation_flag: boolean;
  suspicious_counterparty_flag: boolean;
  suspicious_counterparty_count: number;
  revenue_mismatch_flag: boolean;
  revenue_mismatch_percent: number;
  fraud_risk_score: number;
  fraud_risk_category: string;
  risk_flags_json: RiskFlag[];
  flagged_transactions_json: FlaggedTransaction[];
  analyst_remarks: string | null;
  created_at: string;
  updated_at: string;
}

export interface RiskFlag {
  module: string;
  flag: string;
  severity: 'low' | 'moderate' | 'high' | 'severe';
  description: string;
  value?: number | string;
  deduction: number;
}

export interface FlaggedTransaction {
  module: string;
  date: string;
  description: string;
  credit: number;
  debit: number;
  reason: string;
  related_txn_date?: string;
  related_txn_description?: string;
}

interface BankTxn {
  id: string;
  txn_date: string | null;
  description: string | null;
  debit: number;
  credit: number;
  balance: number;
  bank_name: string | null;
  account_number_masked: string | null;
  category: string | null;
}

const SUSPICIOUS_KEYWORDS = [
  'loan from friend', 'temporary transfer', 'short term funding',
  'crypto exchange', 'unknown payment', 'personal loan',
  'temporary deposit', 'fund parking', 'accommodation',
  'bridge funding', 'return of funds', 'refund of transfer',
];

export class FraudDetectionEngine {
  /** Fetch active config */
  static async getConfig(): Promise<FraudDetectionConfig> {
    const { data } = await from('fraud_detection_config')
      .select('*').eq('is_active', true).limit(1).single();
    if (data) return data;
    // Defaults
    return {
      cash_ratio_threshold: 30,
      revenue_mismatch_threshold: 25,
      circular_transaction_time_window: 1,
      window_dressing_period: 3,
      structured_transaction_count: 5,
      rapid_outflow_hours: 48,
      circular_deduction: 10,
      round_tripping_deduction: 15,
      artificial_turnover_deduction: 15,
      cash_rotation_deduction: 10,
      window_dressing_deduction: 10,
      structured_txn_deduction: 5,
      rapid_outflow_deduction: 10,
      related_party_rotation_deduction: 10,
      suspicious_counterparty_deduction: 5,
      revenue_mismatch_deduction: 10,
    };
  }

  /** Get stored results */
  static async getResults(caseId: string): Promise<FraudDetectionResult | null> {
    const { data } = await from('fraud_detection_results')
      .select('*').eq('case_id', caseId).order('created_at', { ascending: false }).limit(1).single();
    return data || null;
  }

  /** Main entry: run all 10 fraud modules */
  static async runDetection(caseId: string): Promise<FraudDetectionResult> {
    const [config, txns, caseData] = await Promise.all([
      this.getConfig(),
      this.getTransactions(caseId),
      this.getCaseData(caseId),
    ]);

    const riskFlags: RiskFlag[] = [];
    const flaggedTxns: FlaggedTransaction[] = [];

    // 1. Circular Transactions
    const circular = this.detectCircularTransactions(txns, config.circular_transaction_time_window);
    if (circular.count > 0) {
      riskFlags.push({
        module: 'Circular Transactions', flag: 'circular_transaction_flag',
        severity: circular.count > 10 ? 'severe' : circular.count > 5 ? 'high' : 'moderate',
        description: `${circular.count} circular transaction pairs detected (${this.fmtCurrency(circular.value)})`,
        value: circular.count, deduction: config.circular_deduction,
      });
      flaggedTxns.push(...circular.examples.slice(0, 10));
    }

    // 2. Round Tripping
    const roundTrip = this.detectRoundTripping(txns);
    if (roundTrip.flag) {
      riskFlags.push({
        module: 'Round Tripping', flag: 'round_tripping_flag',
        severity: roundTrip.count > 5 ? 'severe' : 'high',
        description: `${roundTrip.count} round-tripping patterns between recurring counterparties`,
        value: roundTrip.count, deduction: config.round_tripping_deduction,
      });
      flaggedTxns.push(...roundTrip.examples.slice(0, 5));
    }

    // 3. Artificial Turnover
    const artificial = this.detectArtificialTurnover(txns);
    if (artificial.flag) {
      riskFlags.push({
        module: 'Artificial Turnover', flag: 'artificial_turnover_flag',
        severity: artificial.value > 500000 ? 'severe' : 'high',
        description: `Suspicious credit spikes near period end (${this.fmtCurrency(artificial.value)})`,
        value: artificial.value, deduction: config.artificial_turnover_deduction,
      });
      flaggedTxns.push(...artificial.examples.slice(0, 5));
    }

    // 4. Cash Rotation
    const totalCredits = txns.reduce((s, t) => s + (t.credit || 0), 0);
    const cashDeposits = txns.filter(t => this.isCashDeposit(t.description || ''))
      .reduce((s, t) => s + (t.credit || 0), 0);
    const cashRatio = totalCredits > 0 ? (cashDeposits / totalCredits) * 100 : 0;
    const cashRotationFlag = cashRatio > config.cash_ratio_threshold;
    if (cashRotationFlag) {
      riskFlags.push({
        module: 'Cash Rotation', flag: 'cash_rotation_flag',
        severity: cashRatio > 60 ? 'severe' : cashRatio > 45 ? 'high' : 'moderate',
        description: `Cash deposit ratio ${cashRatio.toFixed(1)}% exceeds threshold ${config.cash_ratio_threshold}%`,
        value: cashRatio, deduction: config.cash_rotation_deduction,
      });
    }

    // 5. Window Dressing
    const windowDress = this.detectWindowDressing(txns, config.window_dressing_period);
    if (windowDress.flag) {
      riskFlags.push({
        module: 'Window Dressing', flag: 'window_dressing_flag',
        severity: windowDress.count > 3 ? 'high' : 'moderate',
        description: `${windowDress.count} month-end balance manipulation patterns detected`,
        value: windowDress.count, deduction: config.window_dressing_deduction,
      });
      flaggedTxns.push(...windowDress.examples.slice(0, 5));
    }

    // 6. Split/Structured Transactions
    const structured = this.detectStructuredTransactions(txns, config.structured_transaction_count);
    if (structured.flag) {
      riskFlags.push({
        module: 'Split Transactions', flag: 'structured_transaction_flag',
        severity: structured.count > 20 ? 'high' : 'moderate',
        description: `${structured.count} structured/split transaction patterns detected`,
        value: structured.count, deduction: config.structured_txn_deduction,
      });
      flaggedTxns.push(...structured.examples.slice(0, 5));
    }

    // 7. Rapid In-Out Flows
    const rapid = this.detectRapidOutflows(txns, config.rapid_outflow_hours);
    if (rapid.flag) {
      riskFlags.push({
        module: 'Rapid In-Out Flows', flag: 'rapid_outflow_flag',
        severity: rapid.count > 10 ? 'high' : 'moderate',
        description: `${rapid.count} large inflows followed by rapid outflows within ${config.rapid_outflow_hours}h`,
        value: rapid.count, deduction: config.rapid_outflow_deduction,
      });
      flaggedTxns.push(...rapid.examples.slice(0, 5));
    }

    // 8. Related Party Rotation
    const rpRotation = await this.detectRelatedPartyRotation(caseId);
    if (rpRotation.flag) {
      riskFlags.push({
        module: 'Related Party Rotation', flag: 'related_party_rotation_flag',
        severity: 'high',
        description: 'Related parties show cyclical fund rotation patterns',
        deduction: config.related_party_rotation_deduction,
      });
    }

    // 9. Suspicious Counterparties
    const suspicious = this.detectSuspiciousCounterparties(txns);
    if (suspicious.flag) {
      riskFlags.push({
        module: 'Suspicious Counterparties', flag: 'suspicious_counterparty_flag',
        severity: suspicious.count > 5 ? 'high' : 'moderate',
        description: `${suspicious.count} transactions with suspicious keywords detected`,
        value: suspicious.count, deduction: config.suspicious_counterparty_deduction,
      });
      flaggedTxns.push(...suspicious.examples.slice(0, 5));
    }

    // 10. Revenue Mismatch
    const revMismatch = this.checkRevenueMismatch(caseData, config.revenue_mismatch_threshold);
    if (revMismatch.flag) {
      riskFlags.push({
        module: 'Revenue Inconsistency', flag: 'revenue_mismatch_flag',
        severity: revMismatch.percent > 50 ? 'severe' : revMismatch.percent > 35 ? 'high' : 'moderate',
        description: `Bank-VAT revenue variance ${revMismatch.percent.toFixed(1)}% exceeds threshold ${config.revenue_mismatch_threshold}%`,
        value: revMismatch.percent, deduction: config.revenue_mismatch_deduction,
      });
    }

    // Calculate Fraud Risk Score
    let frs = 100;
    for (const flag of riskFlags) frs -= flag.deduction;
    frs = Math.max(0, Math.min(100, frs));

    let category = 'low';
    if (frs < 40) category = 'severe';
    else if (frs < 60) category = 'high';
    else if (frs < 80) category = 'moderate';

    // Preserve analyst remarks from previous run
    const { data: prevResult } = await from('fraud_detection_results')
      .select('analyst_remarks').eq('case_id', caseId)
      .order('created_at', { ascending: false }).limit(1).single();
    const prevRemarks = prevResult?.analyst_remarks || null;

    // Delete old results then insert new (fraud results are re-computable, no audit trail needed)
    await from('fraud_detection_results').delete().eq('case_id', caseId);
    const { data: result, error } = await from('fraud_detection_results')
      .insert({
        case_id: caseId,
        circular_transaction_count: circular.count,
        circular_transaction_value: circular.value,
        round_tripping_flag: roundTrip.flag,
        round_tripping_count: roundTrip.count,
        artificial_turnover_flag: artificial.flag,
        artificial_turnover_value: artificial.value,
        cash_rotation_flag: cashRotationFlag,
        cash_deposit_ratio: Math.round(cashRatio * 100) / 100,
        window_dressing_flag: windowDress.flag,
        window_dressing_count: windowDress.count,
        structured_transaction_flag: structured.flag,
        structured_transaction_count: structured.count,
        rapid_outflow_flag: rapid.flag,
        rapid_outflow_count: rapid.count,
        related_party_rotation_flag: rpRotation.flag,
        suspicious_counterparty_flag: suspicious.flag,
        suspicious_counterparty_count: suspicious.count,
        revenue_mismatch_flag: revMismatch.flag,
        revenue_mismatch_percent: Math.round(revMismatch.percent * 100) / 100,
        fraud_risk_score: frs,
        fraud_risk_category: category,
        risk_flags_json: riskFlags,
        flagged_transactions_json: flaggedTxns,
        analyst_remarks: prevRemarks,
      })
      .select().single();

    if (error) throw error;
    return { ...result, risk_flags_json: riskFlags, flagged_transactions_json: flaggedTxns };
  }

  // ─── Detection Modules ────────────────────────────────

  private static detectCircularTransactions(txns: BankTxn[], windowDays: number) {
    let count = 0, value = 0;
    const examples: FlaggedTransaction[] = [];
    const sorted = [...txns].filter(t => t.txn_date).sort((a, b) =>
      new Date(a.txn_date!).getTime() - new Date(b.txn_date!).getTime()
    );

    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i].credit <= 0) continue;
      const creditDate = new Date(sorted[i].txn_date!);
      for (let j = i + 1; j < sorted.length; j++) {
        const debitDate = new Date(sorted[j].txn_date!);
        const daysDiff = (debitDate.getTime() - creditDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysDiff > windowDays) break;
        if (sorted[j].debit <= 0) continue;
        const amtDiff = Math.abs(sorted[i].credit - sorted[j].debit);
        if (amtDiff / Math.max(sorted[i].credit, 1) < 0.05) {
          count++;
          value += sorted[i].credit;
          if (examples.length < 10) {
            examples.push({
              module: 'Circular', date: sorted[i].txn_date || '',
              description: sorted[i].description || '', credit: sorted[i].credit, debit: 0,
              reason: `Credit matched by debit of ${sorted[j].debit.toLocaleString()} within ${daysDiff.toFixed(0)} day(s)`,
              related_txn_date: sorted[j].txn_date || '',
              related_txn_description: sorted[j].description || '',
            });
          }
          break;
        }
      }
    }
    return { count, value: Math.round(value * 100) / 100, examples };
  }

  private static detectRoundTripping(txns: BankTxn[]) {
    const counterpartyFlows = new Map<string, { credits: number; debits: number; count: number }>();
    for (const t of txns) {
      const cp = this.extractCounterparty(t.description || '');
      if (!cp || cp === 'unknown') continue;
      if (!counterpartyFlows.has(cp)) counterpartyFlows.set(cp, { credits: 0, debits: 0, count: 0 });
      const entry = counterpartyFlows.get(cp)!;
      if (t.credit > 0) { entry.credits += t.credit; entry.count++; }
      if (t.debit > 0) { entry.debits += t.debit; entry.count++; }
    }

    let count = 0;
    const examples: FlaggedTransaction[] = [];
    counterpartyFlows.forEach((flows, cp) => {
      if (flows.credits > 0 && flows.debits > 0 && flows.count >= 4) {
        const ratio = Math.min(flows.credits, flows.debits) / Math.max(flows.credits, flows.debits);
        if (ratio > 0.7) {
          count++;
          examples.push({
            module: 'Round Tripping', date: '', description: cp,
            credit: flows.credits, debit: flows.debits,
            reason: `Bidirectional flows (ratio ${(ratio * 100).toFixed(0)}%) over ${flows.count} transactions`,
          });
        }
      }
    });

    return { flag: count > 0, count, examples };
  }

  private static detectArtificialTurnover(txns: BankTxn[]) {
    // Use ALL transactions (credits AND debits) to find credits followed by rapid debits
    const allSorted = [...txns].filter(t => t.txn_date)
      .sort((a, b) => new Date(a.txn_date!).getTime() - new Date(b.txn_date!).getTime());
    const creditTxns = allSorted.filter(t => t.credit > 0);
    if (creditTxns.length === 0) return { flag: false, value: 0, examples: [] as FlaggedTransaction[] };

    // Calculate monthly averages
    const monthlyCredits = new Map<string, number>();
    for (const t of creditTxns) {
      const key = t.txn_date!.substring(0, 7);
      monthlyCredits.set(key, (monthlyCredits.get(key) || 0) + t.credit);
    }
    const avgMonthly = [...monthlyCredits.values()].reduce((s, v) => s + v, 0) / Math.max(monthlyCredits.size, 1);

    let value = 0;
    const examples: FlaggedTransaction[] = [];

    for (const t of creditTxns) {
      const d = new Date(t.txn_date!);
      const dayOfMonth = d.getDate();
      const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();

      // Large credits in last 3 days of month
      if (dayOfMonth >= daysInMonth - 2 && t.credit > avgMonthly * 0.3) {
        // Check if withdrawn soon after — search ALL transactions for debits
        const nextDebits = allSorted.filter(dt =>
          dt.debit > 0 && dt.txn_date! > t.txn_date! &&
          (new Date(dt.txn_date!).getTime() - d.getTime()) < 3 * 24 * 60 * 60 * 1000
        );
        if (nextDebits.length > 0) {
          value += t.credit;
          examples.push({
            module: 'Artificial Turnover', date: t.txn_date || '',
            description: t.description || '', credit: t.credit, debit: 0,
            reason: 'Large credit near month-end with subsequent withdrawal',
          });
        }
      }
    }

    return { flag: value > 0, value: Math.round(value * 100) / 100, examples };
  }

  private static detectWindowDressing(txns: BankTxn[], periodDays: number) {
    const sorted = [...txns].filter(t => t.txn_date)
      .sort((a, b) => new Date(a.txn_date!).getTime() - new Date(b.txn_date!).getTime());

    let count = 0;
    const examples: FlaggedTransaction[] = [];
    const months = new Set(sorted.map(t => t.txn_date!.substring(0, 7)));

    for (const month of months) {
      const [y, m] = month.split('-').map(Number);
      const lastDay = new Date(y, m, 0).getDate();
      const cutoff = new Date(y, m - 1, lastDay - periodDays + 1);
      const nextStart = new Date(y, m, 1);
      const nextCutoff = new Date(y, m, periodDays + 1);

      // Large inflows before month-end
      const lateInflows = sorted.filter(t => {
        const d = new Date(t.txn_date!);
        return d >= cutoff && d.getMonth() === m - 1 && t.credit > 0;
      });
      const totalLateInflow = lateInflows.reduce((s, t) => s + t.credit, 0);

      // Early outflows after month-start
      const earlyOutflows = sorted.filter(t => {
        const d = new Date(t.txn_date!);
        return d >= nextStart && d < nextCutoff && t.debit > 0;
      });
      const totalEarlyOutflow = earlyOutflows.reduce((s, t) => s + t.debit, 0);

      if (totalLateInflow > 0 && totalEarlyOutflow > 0) {
        const ratio = Math.min(totalLateInflow, totalEarlyOutflow) / Math.max(totalLateInflow, totalEarlyOutflow);
        if (ratio > 0.6 && totalLateInflow > 50000) {
          count++;
          examples.push({
            module: 'Window Dressing', date: `${month}-${lastDay}`,
            description: `Month-end inflow: ${this.fmtCurrency(totalLateInflow)}`,
            credit: totalLateInflow, debit: totalEarlyOutflow,
            reason: `Late inflow of ${this.fmtCurrency(totalLateInflow)} reversed by early outflow of ${this.fmtCurrency(totalEarlyOutflow)}`,
          });
        }
      }
    }

    return { flag: count > 0, count, examples };
  }

  private static detectStructuredTransactions(txns: BankTxn[], threshold: number) {
    const amountCounts = new Map<number, number>();
    for (const t of txns) {
      const amt = Math.round((t.credit || t.debit || 0) * 100) / 100;
      if (amt <= 0) continue;
      amountCounts.set(amt, (amountCounts.get(amt) || 0) + 1);
    }

    let count = 0;
    const examples: FlaggedTransaction[] = [];
    amountCounts.forEach((freq, amt) => {
      if (freq >= threshold && amt > 1000) {
        count += freq;
        examples.push({
          module: 'Structured Transactions', date: '',
          description: `Amount ${amt.toLocaleString()} appears ${freq} times`,
          credit: amt, debit: 0,
          reason: `Identical amount repeated ${freq} times (possible splitting)`,
        });
      }
    });

    return { flag: count > 0, count, examples };
  }

  private static detectRapidOutflows(txns: BankTxn[], hoursThreshold: number) {
    const sorted = [...txns].filter(t => t.txn_date)
      .sort((a, b) => new Date(a.txn_date!).getTime() - new Date(b.txn_date!).getTime());

    let count = 0;
    const examples: FlaggedTransaction[] = [];
    const msThreshold = hoursThreshold * 60 * 60 * 1000;
    const avgCredit = sorted.filter(t => t.credit > 0).reduce((s, t) => s + t.credit, 0) /
      Math.max(sorted.filter(t => t.credit > 0).length, 1);

    for (const t of sorted) {
      if (t.credit <= 0 || t.credit < avgCredit * 1.5) continue; // Only flag large credits
      const creditTime = new Date(t.txn_date!).getTime();
      const rapidDebit = sorted.find(d =>
        d.debit > 0 && d.txn_date! > t.txn_date! &&
        (new Date(d.txn_date!).getTime() - creditTime) <= msThreshold &&
        d.debit >= t.credit * 0.7
      );
      if (rapidDebit) {
        count++;
        if (examples.length < 10) {
          examples.push({
            module: 'Rapid In-Out', date: t.txn_date || '',
            description: t.description || '', credit: t.credit, debit: rapidDebit.debit,
            reason: `Large credit followed by ${this.fmtCurrency(rapidDebit.debit)} debit within ${hoursThreshold}h`,
            related_txn_date: rapidDebit.txn_date || '',
            related_txn_description: rapidDebit.description || '',
          });
        }
      }
    }

    return { flag: count > 0, count, examples };
  }

  private static async detectRelatedPartyRotation(caseId: string) {
    const { data: rpTxns } = await from('related_party_transactions')
      .select('*').eq('case_id', caseId);
    if (!rpTxns || rpTxns.length < 4) return { flag: false };

    // Group by related party
    const partyFlows = new Map<string, { credits: number; debits: number; count: number }>();
    for (const t of rpTxns) {
      const pid = t.related_party_id;
      if (!partyFlows.has(pid)) partyFlows.set(pid, { credits: 0, debits: 0, count: 0 });
      const e = partyFlows.get(pid)!;
      e.credits += t.credit || 0;
      e.debits += t.debit || 0;
      e.count++;
    }

    let rotationDetected = false;
    partyFlows.forEach(flows => {
      if (flows.credits > 0 && flows.debits > 0 && flows.count >= 4) {
        const ratio = Math.min(flows.credits, flows.debits) / Math.max(flows.credits, flows.debits);
        if (ratio > 0.6) rotationDetected = true;
      }
    });

    return { flag: rotationDetected };
  }

  private static detectSuspiciousCounterparties(txns: BankTxn[]) {
    let count = 0;
    const examples: FlaggedTransaction[] = [];

    for (const t of txns) {
      const desc = (t.description || '').toLowerCase();
      const matched = SUSPICIOUS_KEYWORDS.find(kw => desc.includes(kw));
      if (matched) {
        count++;
        examples.push({
          module: 'Suspicious Counterparty', date: t.txn_date || '',
          description: t.description || '', credit: t.credit || 0, debit: t.debit || 0,
          reason: `Contains suspicious keyword: "${matched}"`,
        });
      }
    }

    return { flag: count > 0, count, examples };
  }

  private static checkRevenueMismatch(
    caseData: any, threshold: number
  ) {
    // Normalize both to comparable periods:
    // Use normalized_turnover (annualized bank credits) vs declared_vat_turnover (annualized VAT sales)
    const annualizedBankTurnover = Number(caseData?.normalized_turnover) || Number(caseData?.estimated_annual_turnover) || 0;
    const vatTurnover = Number(caseData?.declared_vat_turnover) || 0;
    if (annualizedBankTurnover === 0 && vatTurnover === 0) return { flag: false, percent: 0 };
    const maxVal = Math.max(annualizedBankTurnover, vatTurnover);
    const percent = maxVal > 0 ? (Math.abs(annualizedBankTurnover - vatTurnover) / maxVal) * 100 : 0;
    return { flag: percent > threshold, percent: Math.round(percent * 100) / 100 };
  }

  // ─── Helpers ────────────────────────────────

  private static async getTransactions(caseId: string): Promise<BankTxn[]> {
    // Paginate to avoid Supabase 1000-row default limit
    let allData: BankTxn[] = [];
    let from = 0;
    const pageSize = 1000;
    while (true) {
      const { data, error } = await supabase
        .from('assessment_bank_transactions')
        .select('*').eq('case_id', caseId)
        .range(from, from + pageSize - 1);
      if (error || !data || data.length === 0) break;
      allData = allData.concat(data as BankTxn[]);
      if (data.length < pageSize) break;
      from += pageSize;
    }
    return allData;
  }

  private static async getCaseData(caseId: string) {
    const { data } = await supabase
      .from('assessment_cases').select('*').eq('id', caseId).single();
    return data;
  }

  private static extractCounterparty(desc: string): string {
    const d = desc.trim().toLowerCase();
    const cleaned = d.replace(/^(trf from|trf to|b\/o|incoming|outgoing|from|to|credit|debit|cr|dr)\s*/i, '')
      .substring(0, 40).trim();
    return cleaned || 'unknown';
  }

  private static isCashDeposit(desc: string): boolean {
    const d = desc.toLowerCase();
    return d.includes('cash deposit') || d.includes('cash dep') || d.includes('cdm') ||
      d.includes('atm deposit') || d.includes('cash credit');
  }

  private static fmtCurrency(v: number): string {
    return `AED ${v.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }
}
