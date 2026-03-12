// Assessment Analysis Engine - Bank statement & VAT analysis calculations
import type {
  ParsedBankFile,
  ParsedVatFile,
  BankMonthlyAnalysis,
  VatPeriodAnalysis,
  CombinedFinancialSummary,
  ParsedTransaction,
} from '@/types/assessment.types';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export class AssessmentAnalysisEngine {
  /**
   * Calculate monthly summaries from parsed bank transactions
   */
  static calculateMonthlySummaries(
    transactions: ParsedTransaction[],
    bankName?: string | null
  ): BankMonthlyAnalysis[] {
    const monthMap = new Map<string, ParsedTransaction[]>();

    transactions.forEach(txn => {
      const d = new Date(txn.date);
      if (isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      if (!monthMap.has(key)) monthMap.set(key, []);
      monthMap.get(key)!.push(txn);
    });

    const summaries: BankMonthlyAnalysis[] = [];

    monthMap.forEach((txns, key) => {
      const [yearStr, monthStr] = key.split('-');
      const year = parseInt(yearStr);
      const month = parseInt(monthStr);

      const credits = txns.filter(t => t.credit > 0);
      const debits = txns.filter(t => t.debit > 0);
      const totalCredits = credits.reduce((s, t) => s + t.credit, 0);
      const totalDebits = debits.reduce((s, t) => s + t.debit, 0);
      const highestCredit = credits.length > 0 ? Math.max(...credits.map(t => t.credit)) : 0;
      const balances = txns.map(t => t.balance);
      const lowestBalance = balances.length > 0 ? Math.min(...balances) : 0;
      const avgDailyBalance = balances.length > 0 ? balances.reduce((s, b) => s + b, 0) / balances.length : 0;
      const closingBalance = balances.length > 0 ? balances[balances.length - 1] : 0;

      const cashDepositTotal = txns
        .filter(t => t.credit > 0 && t.description && /cash|cdm|atm/i.test(t.description))
        .reduce((s, t) => s + t.credit, 0);

      const negativeBalanceDays = new Set(
        txns.filter(t => t.balance < 0).map(t => t.date)
      ).size;

      const bounceCount = txns.filter(t =>
        t.description && /return|bounce|dishono/i.test(t.description)
      ).length;

      summaries.push({
        month,
        year,
        monthLabel: `${MONTH_NAMES[month - 1]} ${year}`,
        totalCredits,
        totalDebits,
        creditCount: credits.length,
        debitCount: debits.length,
        highestCredit,
        lowestBalance,
        avgDailyBalance: Math.round(avgDailyBalance * 100) / 100,
        closingBalance,
        cashDepositTotal,
        negativeBalanceDays,
        bounceCount,
      });
    });

    return summaries.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });
  }

  /**
   * Calculate VAT period analysis
   */
  static calculateVatAnalysis(vatFiles: ParsedVatFile[]): VatPeriodAnalysis[] {
    return vatFiles
      .filter(f => f.isValid)
      .map(f => {
        const totalSales = f.vatSales || f.taxableSupplies + f.zeroRatedSupplies + f.exemptSupplies;
        const effectiveVatRate = totalSales > 0 ? (f.outputVat / totalSales) * 100 : 0;

        // Estimate months in period
        let months = 3; // default quarterly
        if (f.taxPeriodFrom && f.taxPeriodTo) {
          const from = new Date(f.taxPeriodFrom);
          const to = new Date(f.taxPeriodTo);
          months = Math.max(1, Math.round((to.getTime() - from.getTime()) / (30.44 * 24 * 60 * 60 * 1000)));
        }

        return {
          periodFrom: f.taxPeriodFrom || '',
          periodTo: f.taxPeriodTo || '',
          periodLabel: f.taxPeriodFrom && f.taxPeriodTo
            ? `${f.taxPeriodFrom} to ${f.taxPeriodTo}`
            : f.fileName,
          vatSales: totalSales,
          taxableSupplies: f.taxableSupplies,
          zeroRatedSupplies: f.zeroRatedSupplies,
          exemptSupplies: f.exemptSupplies,
          outputVat: f.outputVat,
          inputVat: f.inputVat,
          netVatPayable: f.netVatPayable,
          effectiveVatRate: Math.round(effectiveVatRate * 100) / 100,
          monthlyAvgSales: Math.round(totalSales / months),
        };
      })
      .sort((a, b) => (a.periodFrom || '').localeCompare(b.periodFrom || ''));
  }

  /**
   * Generate combined financial summary
   */
  static generateCombinedSummary(
    bankFiles: ParsedBankFile[],
    vatFiles: ParsedVatFile[],
    monthlySummaries: BankMonthlyAnalysis[],
    vatAnalysis: VatPeriodAnalysis[],
    companyName?: string | null
  ): CombinedFinancialSummary {
    const banksUsed = [...new Set(bankFiles.map(f => f.bankName).filter(Boolean))] as string[];
    
    // Statement period
    const allPeriods = bankFiles
      .flatMap(f => [f.periodFrom, f.periodTo])
      .filter(Boolean)
      .sort() as string[];
    const totalStatementPeriod = allPeriods.length >= 2
      ? { from: allPeriods[0], to: allPeriods[allPeriods.length - 1] }
      : null;

    // Monthly averages from bank summaries
    const monthCount = monthlySummaries.length || 1;
    const totalCredits = monthlySummaries.reduce((s, m) => s + m.totalCredits, 0);
    const totalDebits = monthlySummaries.reduce((s, m) => s + m.totalDebits, 0);
    const avgMonthlyCredit = totalCredits / monthCount;
    const avgMonthlyDebit = totalDebits / monthCount;
    const avgMonthlyBalance = monthlySummaries.reduce((s, m) => s + m.avgDailyBalance, 0) / monthCount;
    const estimatedAnnualTurnover = avgMonthlyCredit * 12;

    // VAT turnover
    const totalVatSales = vatAnalysis.reduce((s, v) => s + v.vatSales, 0);
    const vatMonths = vatAnalysis.reduce((s, v) => {
      if (v.periodFrom && v.periodTo) {
        const from = new Date(v.periodFrom);
        const to = new Date(v.periodTo);
        return s + Math.max(1, Math.round((to.getTime() - from.getTime()) / (30.44 * 24 * 60 * 60 * 1000)));
      }
      return s + 3;
    }, 0);
    const declaredVatTurnover = vatMonths > 0 ? (totalVatSales / vatMonths) * 12 : 0;

    // Variance
    const maxTurnover = Math.max(estimatedAnnualTurnover, declaredVatTurnover);
    const variancePercent = maxTurnover > 0
      ? Math.round(Math.abs(estimatedAnnualTurnover - declaredVatTurnover) / maxTurnover * 100 * 100) / 100
      : 0;

    let varianceTag: CombinedFinancialSummary['varianceTag'] = 'strong_match';
    if (variancePercent > 30) varianceTag = 'manual_review';
    else if (variancePercent > 20) varianceTag = 'high_variance';
    else if (variancePercent > 10) varianceTag = 'moderate_variance';

    // Risk flags
    const riskFlags: string[] = [];
    const totalBounces = monthlySummaries.reduce((s, m) => s + m.bounceCount, 0);
    const negativeBalanceDays = monthlySummaries.reduce((s, m) => s + m.negativeBalanceDays, 0);
    const totalCashDeposits = monthlySummaries.reduce((s, m) => s + m.cashDepositTotal, 0);
    const cashDepositRatio = totalCredits > 0 ? (totalCashDeposits / totalCredits) * 100 : 0;

    if (totalBounces > 0) riskFlags.push(`${totalBounces} cheque return(s) detected`);
    if (negativeBalanceDays > 5) riskFlags.push(`${negativeBalanceDays} negative balance day(s)`);
    if (cashDepositRatio > 30) riskFlags.push(`High cash deposit ratio: ${Math.round(cashDepositRatio)}%`);
    if (variancePercent > 20) riskFlags.push(`VAT-Bank variance: ${variancePercent}%`);
    if (monthCount < 6) riskFlags.push(`Limited statement coverage: ${monthCount} months`);
    if (vatFiles.length === 0) riskFlags.push('No VAT returns provided');

    // Normalized turnover: lower of bank and VAT if both available
    const normalizedTurnover = declaredVatTurnover > 0
      ? Math.min(estimatedAnnualTurnover, declaredVatTurnover)
      : estimatedAnnualTurnover;

    return {
      companyName: companyName || bankFiles[0]?.accountHolder || null,
      banksUsed,
      totalStatementPeriod,
      totalVatPeriods: vatAnalysis.length,
      avgMonthlyCredit: Math.round(avgMonthlyCredit),
      avgMonthlyDebit: Math.round(avgMonthlyDebit),
      avgMonthlyBalance: Math.round(avgMonthlyBalance),
      estimatedAnnualTurnover: Math.round(estimatedAnnualTurnover),
      declaredVatTurnover: Math.round(declaredVatTurnover),
      variancePercent,
      varianceTag,
      riskFlags,
      normalizedTurnover: Math.round(normalizedTurnover),
      statementMonthsCovered: monthCount,
      vatPeriodsCovered: vatAnalysis.length,
      totalBounces,
      negativeBalanceDays,
      cashDepositRatio: Math.round(cashDepositRatio * 100) / 100,
    };
  }
}
