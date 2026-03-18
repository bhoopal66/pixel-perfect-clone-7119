/**
 * Bank Statement Analysis Engine
 * Comprehensive analysis of extracted bank transactions including:
 * - Daily closing balance calculation
 * - Monthly average balance analysis
 * - Month-wise transaction summaries
 * - Smart transaction classification
 * - Transaction grouping by category
 * - Cheque return analysis
 * - Cash flow analysis
 * - Top inflow/expense analysis
 * - Risk flag detection
 */
import { parseBankDate } from '@/services/assessmentAnalysisEngine';
import type { ParsedTransaction, ParsedBankFile, BankMonthlyAnalysis } from '@/types/assessment.types';

// ─── Types ──────────────────────────────────────────────────────
export interface DailyBalanceRecord {
  date: string;
  openingBalance: number;
  closingBalance: number;
  dailyAvgBalance: number;
  hasTransactions: boolean;
  month: string;
  year: number;
  monthNum: number;
}

export interface MonthlyBalanceSummary {
  monthLabel: string;
  month: number;
  year: number;
  averageBalance: number;
  minimumBalance: number;
  maximumBalance: number;
  lowBalanceDays: number;
  negativeBalanceDays: number;
  calendarDays: number;
}

export interface MonthlyTransactionSummary {
  monthLabel: string;
  month: number;
  year: number;
  openingBalance: number;
  totalCredits: number;
  totalDebits: number;
  closingBalance: number;
  creditCount: number;
  debitCount: number;
  netMovement: number;
}

export interface TransactionCategoryGroup {
  category: string;
  monthLabel: string;
  month: number;
  year: number;
  transactionCount: number;
  totalDebit: number;
  totalCredit: number;
  netAmount: number;
}

export interface ChequeReturnSummary {
  monthLabel: string;
  month: number;
  year: number;
  inwardReturnCount: number;
  inwardReturnAmount: number;
  outwardReturnCount: number;
  outwardReturnAmount: number;
  totalReturnCount: number;
  totalReturnAmount: number;
}

export interface CashFlowSummary {
  monthLabel: string;
  month: number;
  year: number;
  totalInflow: number;
  totalOutflow: number;
  netCashFlow: number;
  inflowCount: number;
  outflowCount: number;
  avgCreditAmount: number;
  avgDebitAmount: number;
}

export interface TopFlowItem {
  descriptionGroup: string;
  transactionCount: number;
  totalAmount: number;
  contributionPercent: number;
}

export interface RiskFlag {
  riskFlag: string;
  month: string;
  severity: 'Low' | 'Medium' | 'High';
  remarks: string;
}

export interface CategoryOverall {
  category: string;
  transactionCount: number;
  totalDebit: number;
  totalCredit: number;
}

export interface BankStatementAnalysisResult {
  dailyBalances: DailyBalanceRecord[];
  monthlyBalances: MonthlyBalanceSummary[];
  monthlyTransactions: MonthlyTransactionSummary[];
  categoryGrouping: TransactionCategoryGroup[];
  categoryOverall: CategoryOverall[];
  chequeReturns: ChequeReturnSummary[];
  cashFlow: CashFlowSummary[];
  topInflows: TopFlowItem[];
  topExpenses: TopFlowItem[];
  riskFlags: RiskFlag[];
  totalCredits: number;
  totalDebits: number;
  totalTransactions: number;
  averageMonthlyBalance: number;
  highestBalance: number;
  lowestBalance: number;
  netCashFlow: number;
  totalChequeReturns: number;
  statementPeriod: { from: string; to: string } | null;
}

// ─── Classification Rules ───────────────────────────────────────
const CATEGORY_RULES: { category: string; keywords: string[] }[] = [
  { category: 'Cash Withdrawal', keywords: ['atm', 'cash wdl', 'cash withdrawal', 'cdm withdrawal'] },
  { category: 'Cash Deposit', keywords: ['cash dep', 'cdm', 'cash deposit', 'cdm deposit'] },
  { category: 'Cheque Deposit', keywords: ['chq dep', 'cheque dep', 'cheque deposit', 'chq deposit'] },
  { category: 'Cheque Payment', keywords: ['chq issued', 'cheque payment', 'clearing chq', 'chq paid', 'cheque paid'] },
  { category: 'Cheque Return Inward', keywords: ['chq return inward', 'cheque return inward', 'inward return', 'return chq cr'] },
  { category: 'Cheque Return Outward', keywords: ['chq return outward', 'cheque return outward', 'outward return', 'return chq dr', 'returned cheque', 'cheque returned', 'chq returned'] },
  { category: 'Bank Transfer Outward', keywords: ['o/w trf', 'transfer to', 'ft out', 'ibt out', 'outward remittance', 'trf to', 'outward transfer'] },
  { category: 'Bank Transfer Inward', keywords: ['i/w trf', 'transfer from', 'credit transfer', 'ft in', 'ibt in', 'inward remittance', 'incoming'] },
  { category: 'POS / Card Transaction', keywords: ['pos', 'card', 'visa', 'master', 'debit card', 'credit card'] },
  { category: 'Online / Digital Payment', keywords: ['online', 'ipay', 'payment gateway', 'apple pay', 'gpay', 'samsung pay', 'digital', 'e-payment'] },
  { category: 'Bank Charges & Fees', keywords: ['charges', 'fee', 'commission', 'vat on charges', 'service charge', 'membership', 'annual fee'] },
  { category: 'Interest', keywords: ['interest', 'profit', 'murabaha profit'] },
  { category: 'Salary Payment', keywords: ['salary', 'wps', 'payroll', 'wage'] },
  { category: 'Rent Payment', keywords: ['rent', 'ejari', 'lease'] },
  { category: 'Utilities', keywords: ['dewa', 'sewa', 'addc', 'etisalat', 'du telecom', 'utility', 'electricity', 'water'] },
  { category: 'Loan EMI', keywords: ['emi', 'loan instalment', 'finance payment', 'installment', 'auto loan', 'personal loan'] },
  { category: 'Tax Payment', keywords: ['vat payment', 'tax', 'fta'] },
];

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ─── Engine ─────────────────────────────────────────────────────
export class BankStatementAnalysisEngine {
  /**
   * Classify a transaction description into a category
   */
  static classifyTransaction(description: string, debit: number, credit: number): string {
    const desc = (description || '').toLowerCase();

    // Check cheque returns first (specific before general)
    if (/return|bounce|dishono/.test(desc) && /cheque|chq/.test(desc)) {
      return credit > 0 ? 'Cheque Return Inward' : 'Cheque Return Outward';
    }

    for (const rule of CATEGORY_RULES) {
      if (rule.keywords.some(kw => desc.includes(kw))) {
        return rule.category;
      }
    }

    // Fallback: generic transfer detection
    if (/transfer|trf|remit/.test(desc)) {
      return credit > 0 ? 'Bank Transfer Inward' : 'Bank Transfer Outward';
    }

    return credit > 0 ? 'Other Credit' : 'Other Debit';
  }

  /**
   * Run complete analysis on parsed transactions
   */
  static analyze(
    bankFiles: ParsedBankFile[],
    monthlySummaries: BankMonthlyAnalysis[]
  ): BankStatementAnalysisResult {
    const validFiles = bankFiles.filter(f => f.isValid);
    const allTxns = validFiles.flatMap(f => f.transactions);

    // Parse and sort transactions by date
    const dated = allTxns
      .map(t => ({ ...t, parsed: parseBankDate(t.date) }))
      .filter(t => t.parsed && !isNaN(t.parsed.getTime()))
      .sort((a, b) => a.parsed!.getTime() - b.parsed!.getTime());

    if (dated.length === 0) {
      return this.emptyResult();
    }

    const startDate = dated[0].parsed!;
    const endDate = dated[dated.length - 1].parsed!;

    // 1. Daily balance
    const dailyBalances = this.calculateDailyBalances(dated, startDate, endDate);

    // 2. Monthly balance summary
    const monthlyBalances = this.calculateMonthlyBalances(dailyBalances);

    // 3. Monthly transaction summary
    const monthlyTransactions = this.calculateMonthlyTransactions(dated);

    // 4 & 5. Category classification & grouping
    const classified = dated.map(t => ({
      ...t,
      smartCategory: this.classifyTransaction(t.description, t.debit, t.credit),
    }));
    const categoryGrouping = this.calculateCategoryGrouping(classified);
    const categoryOverall = this.calculateCategoryOverall(classified);

    // 6. Cheque returns
    const chequeReturns = this.calculateChequeReturns(classified);

    // 7. Cash flow
    const cashFlow = this.calculateCashFlow(dated);

    // 8. Top inflows & expenses
    const topInflows = this.calculateTopFlows(classified, 'credit');
    const topExpenses = this.calculateTopFlows(classified, 'debit');

    // 9. Risk flags
    const riskFlags = this.detectRiskFlags(monthlyBalances, chequeReturns, cashFlow, classified, topInflows);

    // Aggregates
    const totalCredits = allTxns.reduce((s, t) => s + t.credit, 0);
    const totalDebits = allTxns.reduce((s, t) => s + t.debit, 0);
    const allBalances = dailyBalances.map(d => d.closingBalance);

    return {
      dailyBalances,
      monthlyBalances,
      monthlyTransactions,
      categoryGrouping,
      categoryOverall,
      chequeReturns,
      cashFlow,
      topInflows,
      topExpenses,
      riskFlags,
      totalCredits,
      totalDebits,
      totalTransactions: allTxns.length,
      averageMonthlyBalance: monthlyBalances.length > 0
        ? monthlyBalances.reduce((s, m) => s + m.averageBalance, 0) / monthlyBalances.length
        : 0,
      highestBalance: allBalances.length > 0 ? Math.max(...allBalances) : 0,
      lowestBalance: allBalances.length > 0 ? Math.min(...allBalances) : 0,
      netCashFlow: totalCredits - totalDebits,
      totalChequeReturns: chequeReturns.reduce((s, c) => s + c.totalReturnCount, 0),
      statementPeriod: {
        from: startDate.toISOString().split('T')[0],
        to: endDate.toISOString().split('T')[0],
      },
    };
  }

  // ─── Daily Balance ──────────────────────────────────────────
  private static calculateDailyBalances(
    dated: (ParsedTransaction & { parsed: Date })[],
    start: Date,
    end: Date
  ): DailyBalanceRecord[] {
    const results: DailyBalanceRecord[] = [];
    const txnByDate = new Map<string, (ParsedTransaction & { parsed: Date })[]>();

    for (const t of dated) {
      const key = t.parsed.toISOString().split('T')[0];
      if (!txnByDate.has(key)) txnByDate.set(key, []);
      txnByDate.get(key)!.push(t);
    }

    // Derive opening balance from first transaction
    const firstTxn = dated[0];
    let prevClose = firstTxn.balance - firstTxn.credit + firstTxn.debit;

    const cur = new Date(start);
    while (cur <= end) {
      const key = cur.toISOString().split('T')[0];
      const dayTxns = txnByDate.get(key) || [];
      const hasTxns = dayTxns.length > 0;
      const opening = prevClose;
      const closing = hasTxns ? dayTxns[dayTxns.length - 1].balance : prevClose;

      results.push({
        date: key,
        openingBalance: Math.round(opening * 100) / 100,
        closingBalance: Math.round(closing * 100) / 100,
        dailyAvgBalance: Math.round(closing * 100) / 100,
        hasTransactions: hasTxns,
        month: `${MONTH_NAMES[cur.getMonth()]} ${cur.getFullYear()}`,
        year: cur.getFullYear(),
        monthNum: cur.getMonth() + 1,
      });

      prevClose = closing;
      cur.setDate(cur.getDate() + 1);
    }

    return results;
  }

  // ─── Monthly Balance ────────────────────────────────────────
  private static calculateMonthlyBalances(dailyBalances: DailyBalanceRecord[]): MonthlyBalanceSummary[] {
    const grouped = new Map<string, DailyBalanceRecord[]>();
    for (const d of dailyBalances) {
      if (!grouped.has(d.month)) grouped.set(d.month, []);
      grouped.get(d.month)!.push(d);
    }

    const results: MonthlyBalanceSummary[] = [];
    grouped.forEach((days, label) => {
      const balances = days.map(d => d.closingBalance);
      const sum = balances.reduce((s, b) => s + b, 0);
      const lowThreshold = sum / days.length * 0.1; // 10% of average as "low"
      results.push({
        monthLabel: label,
        month: days[0].monthNum,
        year: days[0].year,
        averageBalance: Math.round(sum / days.length * 100) / 100,
        minimumBalance: Math.round(Math.min(...balances) * 100) / 100,
        maximumBalance: Math.round(Math.max(...balances) * 100) / 100,
        lowBalanceDays: days.filter(d => d.closingBalance < lowThreshold && d.closingBalance >= 0).length,
        negativeBalanceDays: days.filter(d => d.closingBalance < 0).length,
        calendarDays: days.length,
      });
    });

    return results.sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month);
  }

  // ─── Monthly Transactions ───────────────────────────────────
  private static calculateMonthlyTransactions(
    dated: (ParsedTransaction & { parsed: Date })[]
  ): MonthlyTransactionSummary[] {
    const grouped = new Map<string, (ParsedTransaction & { parsed: Date })[]>();
    for (const t of dated) {
      const key = `${t.parsed.getFullYear()}-${t.parsed.getMonth() + 1}`;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(t);
    }

    const results: MonthlyTransactionSummary[] = [];
    grouped.forEach((txns, key) => {
      const [yr, mo] = key.split('-').map(Number);
      const firstTxn = txns[0];
      const opening = firstTxn.balance - firstTxn.credit + firstTxn.debit;
      const totalCredits = txns.reduce((s, t) => s + t.credit, 0);
      const totalDebits = txns.reduce((s, t) => s + t.debit, 0);
      const closing = txns[txns.length - 1].balance;

      results.push({
        monthLabel: `${MONTH_NAMES[mo - 1]} ${yr}`,
        month: mo,
        year: yr,
        openingBalance: Math.round(opening * 100) / 100,
        totalCredits: Math.round(totalCredits * 100) / 100,
        totalDebits: Math.round(totalDebits * 100) / 100,
        closingBalance: Math.round(closing * 100) / 100,
        creditCount: txns.filter(t => t.credit > 0).length,
        debitCount: txns.filter(t => t.debit > 0).length,
        netMovement: Math.round((totalCredits - totalDebits) * 100) / 100,
      });
    });

    return results.sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month);
  }

  // ─── Category Grouping ──────────────────────────────────────
  private static calculateCategoryGrouping(
    classified: (ParsedTransaction & { parsed: Date; smartCategory: string })[]
  ): TransactionCategoryGroup[] {
    const map = new Map<string, TransactionCategoryGroup>();

    for (const t of classified) {
      const mo = t.parsed.getMonth() + 1;
      const yr = t.parsed.getFullYear();
      const key = `${yr}-${mo}-${t.smartCategory}`;
      if (!map.has(key)) {
        map.set(key, {
          category: t.smartCategory,
          monthLabel: `${MONTH_NAMES[mo - 1]} ${yr}`,
          month: mo,
          year: yr,
          transactionCount: 0,
          totalDebit: 0,
          totalCredit: 0,
          netAmount: 0,
        });
      }
      const g = map.get(key)!;
      g.transactionCount++;
      g.totalDebit += t.debit;
      g.totalCredit += t.credit;
      g.netAmount = Math.round((g.totalCredit - g.totalDebit) * 100) / 100;
    }

    return Array.from(map.values()).sort((a, b) =>
      a.year !== b.year ? a.year - b.year : a.month !== b.month ? a.month - b.month : a.category.localeCompare(b.category)
    );
  }

  private static calculateCategoryOverall(
    classified: (ParsedTransaction & { parsed: Date; smartCategory: string })[]
  ): CategoryOverall[] {
    const map = new Map<string, CategoryOverall>();
    for (const t of classified) {
      if (!map.has(t.smartCategory)) {
        map.set(t.smartCategory, { category: t.smartCategory, transactionCount: 0, totalDebit: 0, totalCredit: 0 });
      }
      const g = map.get(t.smartCategory)!;
      g.transactionCount++;
      g.totalDebit += t.debit;
      g.totalCredit += t.credit;
    }
    return Array.from(map.values()).sort((a, b) => (b.totalDebit + b.totalCredit) - (a.totalDebit + a.totalCredit));
  }

  // ─── Cheque Returns ─────────────────────────────────────────
  private static calculateChequeReturns(
    classified: (ParsedTransaction & { parsed: Date; smartCategory: string })[]
  ): ChequeReturnSummary[] {
    const returns = classified.filter(t =>
      t.smartCategory === 'Cheque Return Inward' || t.smartCategory === 'Cheque Return Outward'
    );

    const grouped = new Map<string, ChequeReturnSummary>();
    // Also build entries for all months even without returns
    const allMonths = new Set(classified.map(t => `${t.parsed.getFullYear()}-${t.parsed.getMonth() + 1}`));
    for (const key of allMonths) {
      const [yr, mo] = key.split('-').map(Number);
      grouped.set(key, {
        monthLabel: `${MONTH_NAMES[mo - 1]} ${yr}`,
        month: mo,
        year: yr,
        inwardReturnCount: 0,
        inwardReturnAmount: 0,
        outwardReturnCount: 0,
        outwardReturnAmount: 0,
        totalReturnCount: 0,
        totalReturnAmount: 0,
      });
    }

    for (const t of returns) {
      const key = `${t.parsed.getFullYear()}-${t.parsed.getMonth() + 1}`;
      const g = grouped.get(key)!;
      if (t.smartCategory === 'Cheque Return Inward') {
        g.inwardReturnCount++;
        g.inwardReturnAmount += t.credit;
      } else {
        g.outwardReturnCount++;
        g.outwardReturnAmount += t.debit;
      }
      g.totalReturnCount = g.inwardReturnCount + g.outwardReturnCount;
      g.totalReturnAmount = g.inwardReturnAmount + g.outwardReturnAmount;
    }

    return Array.from(grouped.values()).sort((a, b) =>
      a.year !== b.year ? a.year - b.year : a.month - b.month
    );
  }

  // ─── Cash Flow ──────────────────────────────────────────────
  private static calculateCashFlow(
    dated: (ParsedTransaction & { parsed: Date })[]
  ): CashFlowSummary[] {
    const grouped = new Map<string, (ParsedTransaction & { parsed: Date })[]>();
    for (const t of dated) {
      const key = `${t.parsed.getFullYear()}-${t.parsed.getMonth() + 1}`;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(t);
    }

    const results: CashFlowSummary[] = [];
    grouped.forEach((txns, key) => {
      const [yr, mo] = key.split('-').map(Number);
      const credits = txns.filter(t => t.credit > 0);
      const debits = txns.filter(t => t.debit > 0);
      const totalIn = credits.reduce((s, t) => s + t.credit, 0);
      const totalOut = debits.reduce((s, t) => s + t.debit, 0);

      results.push({
        monthLabel: `${MONTH_NAMES[mo - 1]} ${yr}`,
        month: mo,
        year: yr,
        totalInflow: Math.round(totalIn * 100) / 100,
        totalOutflow: Math.round(totalOut * 100) / 100,
        netCashFlow: Math.round((totalIn - totalOut) * 100) / 100,
        inflowCount: credits.length,
        outflowCount: debits.length,
        avgCreditAmount: credits.length > 0 ? Math.round(totalIn / credits.length * 100) / 100 : 0,
        avgDebitAmount: debits.length > 0 ? Math.round(totalOut / debits.length * 100) / 100 : 0,
      });
    });

    return results.sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month);
  }

  // ─── Top Flows ──────────────────────────────────────────────
  private static calculateTopFlows(
    classified: (ParsedTransaction & { parsed: Date; smartCategory: string })[],
    type: 'credit' | 'debit'
  ): TopFlowItem[] {
    const relevant = classified.filter(t => type === 'credit' ? t.credit > 0 : t.debit > 0);
    const total = relevant.reduce((s, t) => s + (type === 'credit' ? t.credit : t.debit), 0);

    // Normalize descriptions for grouping
    const groups = new Map<string, { count: number; amount: number }>();
    for (const t of relevant) {
      const normalized = this.normalizeDescription(t.description);
      if (!groups.has(normalized)) groups.set(normalized, { count: 0, amount: 0 });
      const g = groups.get(normalized)!;
      g.count++;
      g.amount += type === 'credit' ? t.credit : t.debit;
    }

    return Array.from(groups.entries())
      .map(([desc, data]) => ({
        descriptionGroup: desc,
        transactionCount: data.count,
        totalAmount: Math.round(data.amount * 100) / 100,
        contributionPercent: total > 0 ? Math.round(data.amount / total * 10000) / 100 : 0,
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 15);
  }

  private static normalizeDescription(desc: string): string {
    if (!desc) return 'Unknown';
    // Remove dates, numbers, reference codes — keep meaningful words
    return desc
      .replace(/\d{2}[\/\-]\d{2}[\/\-]\d{2,4}/g, '')
      .replace(/ref[:\s]*\S+/gi, '')
      .replace(/\b\d{6,}\b/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 60) || 'Unknown';
  }

  // ─── Risk Flags ─────────────────────────────────────────────
  private static detectRiskFlags(
    monthlyBalances: MonthlyBalanceSummary[],
    chequeReturns: ChequeReturnSummary[],
    cashFlow: CashFlowSummary[],
    classified: (ParsedTransaction & { parsed: Date; smartCategory: string })[],
    topInflows: TopFlowItem[]
  ): RiskFlag[] {
    const flags: RiskFlag[] = [];

    // Cheque returns
    for (const cr of chequeReturns) {
      if (cr.totalReturnCount >= 3) {
        flags.push({ riskFlag: 'Frequent Cheque Returns', month: cr.monthLabel, severity: 'High', remarks: `${cr.totalReturnCount} cheque returns detected` });
      } else if (cr.totalReturnCount > 0) {
        flags.push({ riskFlag: 'Cheque Returns', month: cr.monthLabel, severity: 'Medium', remarks: `${cr.totalReturnCount} cheque return(s)` });
      }
    }

    // Cash withdrawal analysis
    for (const cf of cashFlow) {
      const cashWithdrawals = classified.filter(t =>
        t.smartCategory === 'Cash Withdrawal' &&
        t.parsed.getMonth() + 1 === cf.month &&
        t.parsed.getFullYear() === cf.year
      );
      const cashTotal = cashWithdrawals.reduce((s, t) => s + t.debit, 0);
      if (cf.totalOutflow > 0 && cashTotal / cf.totalOutflow > 0.3) {
        flags.push({ riskFlag: 'High Cash Withdrawals', month: cf.monthLabel, severity: 'Medium', remarks: `${Math.round(cashTotal / cf.totalOutflow * 100)}% of outflows are cash` });
      }
    }

    // Bank charges
    const totalCharges = classified.filter(t => t.smartCategory === 'Bank Charges & Fees').reduce((s, t) => s + t.debit, 0);
    const totalDebits = classified.reduce((s, t) => s + t.debit, 0);
    if (totalDebits > 0 && totalCharges / totalDebits > 0.05) {
      flags.push({ riskFlag: 'Excessive Bank Charges', month: 'Overall', severity: 'Medium', remarks: `Bank charges are ${Math.round(totalCharges / totalDebits * 100)}% of total debits` });
    }

    // Balance drops & negative days
    for (const mb of monthlyBalances) {
      if (mb.negativeBalanceDays > 0) {
        flags.push({ riskFlag: 'Negative Balance Days', month: mb.monthLabel, severity: mb.negativeBalanceDays > 5 ? 'High' : 'Medium', remarks: `${mb.negativeBalanceDays} day(s) with negative balance` });
      }
      if (mb.lowBalanceDays > mb.calendarDays * 0.5) {
        flags.push({ riskFlag: 'Frequent Low Balance', month: mb.monthLabel, severity: 'Medium', remarks: `${mb.lowBalanceDays} low balance days out of ${mb.calendarDays}` });
      }
      // Sharp balance drop
      if (mb.maximumBalance > 0 && mb.minimumBalance / mb.maximumBalance < 0.05) {
        flags.push({ riskFlag: 'Sharp Balance Drop', month: mb.monthLabel, severity: 'High', remarks: `Balance dropped from ${mb.maximumBalance.toLocaleString()} to ${mb.minimumBalance.toLocaleString()}` });
      }
    }

    // Concentration risk
    if (topInflows.length > 0 && topInflows[0].contributionPercent > 60) {
      flags.push({ riskFlag: 'High Inflow Concentration', month: 'Overall', severity: 'High', remarks: `Top source contributes ${topInflows[0].contributionPercent}% of all inflows` });
    }

    // EMI burden
    const emiTotal = classified.filter(t => t.smartCategory === 'Loan EMI').reduce((s, t) => s + t.debit, 0);
    const totalCredits = classified.reduce((s, t) => s + t.credit, 0);
    if (totalCredits > 0 && emiTotal / totalCredits > 0.3) {
      flags.push({ riskFlag: 'Heavy EMI Burden', month: 'Overall', severity: 'High', remarks: `EMI payments are ${Math.round(emiTotal / totalCredits * 100)}% of total credits` });
    }

    // Transaction spikes
    const monthlyCounts = new Map<string, number>();
    for (const t of classified) {
      const key = `${t.parsed.getFullYear()}-${t.parsed.getMonth() + 1}`;
      monthlyCounts.set(key, (monthlyCounts.get(key) || 0) + 1);
    }
    const counts = Array.from(monthlyCounts.values());
    const avgCount = counts.reduce((s, c) => s + c, 0) / counts.length;
    monthlyCounts.forEach((count, key) => {
      if (count > avgCount * 2) {
        const [yr, mo] = key.split('-').map(Number);
        flags.push({ riskFlag: 'Unusual Transaction Spike', month: `${MONTH_NAMES[mo - 1]} ${yr}`, severity: 'Low', remarks: `${count} transactions vs ${Math.round(avgCount)} average` });
      }
    });

    return flags;
  }

  private static emptyResult(): BankStatementAnalysisResult {
    return {
      dailyBalances: [], monthlyBalances: [], monthlyTransactions: [],
      categoryGrouping: [], categoryOverall: [], chequeReturns: [], cashFlow: [],
      topInflows: [], topExpenses: [], riskFlags: [],
      totalCredits: 0, totalDebits: 0, totalTransactions: 0,
      averageMonthlyBalance: 0, highestBalance: 0, lowestBalance: 0,
      netCashFlow: 0, totalChequeReturns: 0, statementPeriod: null,
    };
  }
}
