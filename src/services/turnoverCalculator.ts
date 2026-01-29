import type { Transaction } from '../types/transaction.types';
import type {
  TurnoverConfiguration,
  TransactionClassification,
  ClassifiedTransaction,
  MonthlyTurnover,
  TurnoverSummary,
  SisterCompany,
  TransactionKeywords,
  ExtendedMonthlyTurnover,
  TurnoverAnalysisReport,
  ExclusionStatus,
  TurnoverResult,
  VATReturn
} from '../types/turnover.types';

export class TurnoverCalculator {
  /**
   * Classify a single transaction as business revenue, cash deposit, or sister concern
   */
  static classifyTransaction(
    transaction: Transaction,
    sisterCompanies: SisterCompany[],
    keywords: TransactionKeywords
  ): TransactionClassification {
    // Only classify credits (revenue)
    if (transaction.credit <= 0) {
      return {
        type: 'business',
        excluded: false,
        reason: 'Debit transaction - not counted as revenue'
      };
    }

    const desc = transaction.description.toLowerCase();

    // Check if it's a cash deposit
    const isCashDeposit = keywords.cashDeposits.some(keyword =>
      desc.includes(keyword.toLowerCase())
    );

    if (isCashDeposit) {
      return {
        type: 'cash-deposit',
        excluded: true,
        reason: 'Cash deposit - not business revenue'
      };
    }

    // Check if it's from a sister concern
    const activeSisters = sisterCompanies.filter(c => c.active);
    const matchedSister = activeSisters.find(company =>
      desc.includes(company.name.toLowerCase())
    );

    const matchedKeyword = keywords.sisterConcern.find(keyword =>
      desc.includes(keyword.toLowerCase())
    );

    if (matchedSister || matchedKeyword) {
      return {
        type: 'sister-concern',
        excluded: true,
        reason: matchedSister
          ? `Sister concern transfer from ${matchedSister.name}`
          : 'Sister concern/related party - not business revenue'
      };
    }

    // It's business revenue
    return {
      type: 'business',
      excluded: false,
      reason: 'Business revenue from customers'
    };
  }

  /**
   * Classify all transactions and return with classification metadata
   */
  static classifyTransactions(
    transactions: Transaction[],
    config: TurnoverConfiguration
  ): ClassifiedTransaction[] {
    return transactions.map(txn => ({
      ...txn,
      classification: this.classifyTransaction(
        txn,
        config.sisterCompanies,
        config.keywords
      )
    }));
  }

  /**
   * Calculate monthly turnover with corrected methodology
   * Business Turnover = Total Credits - Cash Deposits - Sister Concern Transfers
   */
  static calculateMonthlyTurnover(
    transactions: Transaction[],
    config: TurnoverConfiguration
  ): MonthlyTurnover[] {
    // Group transactions by month
    const monthlyData = new Map<string, Transaction[]>();

    transactions.forEach(txn => {
      const date = new Date(txn.date);
      const monthKey = `${date.toLocaleString('default', { month: 'short' })}-${date.getFullYear().toString().slice(-2)}`;

      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, []);
      }
      monthlyData.get(monthKey)!.push(txn);
    });

    const results: MonthlyTurnover[] = [];
    let totalBusinessTurnover = 0;

    // First pass: calculate business turnover for each month
    monthlyData.forEach((monthTransactions, month) => {
      let totalCredits = 0;
      let cashDeposits = 0;
      let sisterConcern = 0;

      monthTransactions.forEach(txn => {
        if (txn.credit > 0) {
          totalCredits += txn.credit;

          const classification = this.classifyTransaction(
            txn,
            config.sisterCompanies,
            config.keywords
          );

          if (classification.type === 'cash-deposit') {
            cashDeposits += txn.credit;
          } else if (classification.type === 'sister-concern') {
            sisterConcern += txn.credit;
          }
        }
      });

      const businessTurnover = totalCredits - cashDeposits - sisterConcern;
      totalBusinessTurnover += businessTurnover;

      results.push({
        month,
        totalCredits,
        cashDeposits,
        sisterConcern,
        businessTurnover,
        percentageOfTotal: 0, // Calculate in second pass
        exclusionRate: totalCredits > 0 ? ((cashDeposits + sisterConcern) / totalCredits) * 100 : 0
      });
    });

    // Second pass: calculate percentages
    results.forEach(month => {
      month.percentageOfTotal = totalBusinessTurnover > 0
        ? (month.businessTurnover / totalBusinessTurnover) * 100
        : 0;
    });

    // Sort by date
    return results.sort((a, b) => {
      const [aMonth, aYear] = a.month.split('-');
      const [bMonth, bYear] = b.month.split('-');
      const aDate = new Date(`${aMonth} 20${aYear}`);
      const bDate = new Date(`${bMonth} 20${bYear}`);
      return aDate.getTime() - bDate.getTime();
    });
  }

  /**
   * Calculate complete turnover summary
   */
  static calculateTurnoverSummary(
    transactions: Transaction[],
    config: TurnoverConfiguration
  ): TurnoverSummary {
    const classifiedTransactions = this.classifyTransactions(transactions, config);
    const monthlyData = this.calculateMonthlyTurnover(transactions, config);

    let totalCredits = 0;
    let cashDeposits = 0;
    let sisterConcern = 0;
    const excludedTransactions: ClassifiedTransaction[] = [];

    classifiedTransactions.forEach(txn => {
      if (txn.credit > 0) {
        totalCredits += txn.credit;

        if (txn.classification.type === 'cash-deposit') {
          cashDeposits += txn.credit;
          excludedTransactions.push(txn);
        } else if (txn.classification.type === 'sister-concern') {
          sisterConcern += txn.credit;
          excludedTransactions.push(txn);
        }
      }
    });

    const businessTurnover = totalCredits - cashDeposits - sisterConcern;
    const exclusionRate = totalCredits > 0 ? ((cashDeposits + sisterConcern) / totalCredits) * 100 : 0;

    return {
      totalCredits,
      cashDeposits,
      sisterConcern,
      businessTurnover,
      exclusionRate,
      monthlyData,
      excludedTransactions
    };
  }

/**
   * Calculate the old (incorrect) turnover for comparison
   */
  static calculateOldTurnover(transactions: Transaction[]): number {
    const totalCredits = transactions.reduce((sum, t) => sum + t.credit, 0);
    const totalDebits = transactions.reduce((sum, t) => sum + t.debit, 0);
    return totalCredits + totalDebits;
  }

  /**
   * CONDITIONAL EXCLUSION LOGIC
   * Calculate exclusion status with mandatory enforcement based on thresholds:
   * - Cash Deposits >20% → Mandatory exclusion
   * - Sister Concern >20% → Mandatory exclusion
   * - VAT Variance >25% → Both mandatory
   */
  static calculateExclusionStatus(
    transactions: Transaction[],
    config: TurnoverConfiguration,
    vatReturns: VATReturn[] = []
  ): ExclusionStatus {
    // Calculate totals
    const totalCredits = transactions
      .filter(t => t.credit > 0)
      .reduce((sum, t) => sum + t.credit, 0);

    // Identify cash deposits
    const cashDepositTransactions = transactions.filter(t =>
      t.credit > 0 &&
      config.keywords.cashDeposits.some(keyword =>
        t.description.toLowerCase().includes(keyword.toLowerCase())
      )
    );
    const cashDepositsAmount = cashDepositTransactions.reduce((sum, t) => sum + t.credit, 0);
    const cashDepositsPercentage = totalCredits > 0 ? (cashDepositsAmount / totalCredits) * 100 : 0;

    // Identify sister concern
    const activeSisters = config.sisterCompanies.filter(c => c.active);
    const sisterConcernTransactions = transactions.filter(t =>
      t.credit > 0 && (
        activeSisters.some(sister =>
          t.description.toLowerCase().includes(sister.name.toLowerCase())
        ) ||
        config.keywords.sisterConcern.some(keyword =>
          t.description.toLowerCase().includes(keyword.toLowerCase())
        )
      )
    );
    const sisterConcernAmount = sisterConcernTransactions.reduce((sum, t) => sum + t.credit, 0);
    const sisterConcernPercentage = totalCredits > 0 ? (sisterConcernAmount / totalCredits) * 100 : 0;

    // Check thresholds
    const cashMandatory = cashDepositsPercentage > config.cashDepositThreshold;
    const sisterMandatory = sisterConcernPercentage > config.sisterConcernThreshold;

    // Calculate VAT variance
    const latestVAT = vatReturns.length > 0 ? vatReturns[vatReturns.length - 1] : null;
    let vatVarianceMandatory = false;
    let vatVarianceData = {
      bankTurnover: 0,
      vatSales: 0,
      variance: 0,
      percentageVariance: 0,
      mandatory: false,
      reason: ''
    };

    if (latestVAT) {
      // Calculate bank turnover based on current exclusion settings
      const excludedCash = config.excludeCashDeposits ? cashDepositsAmount : 0;
      const excludedSister = config.excludeSisterConcern ? sisterConcernAmount : 0;
      const bankTurnover = totalCredits - excludedCash - excludedSister;

      const vatSales = latestVAT.taxableSales + latestVAT.zeroRatedSales;
      const variance = Math.abs(bankTurnover - vatSales);
      const percentageVariance = Math.max(bankTurnover, vatSales) > 0
        ? (variance / Math.max(bankTurnover, vatSales)) * 100
        : 0;

      vatVarianceMandatory = percentageVariance > config.vatVarianceThreshold;

      vatVarianceData = {
        bankTurnover,
        vatSales,
        variance,
        percentageVariance,
        mandatory: vatVarianceMandatory,
        reason: vatVarianceMandatory
          ? `VAT variance of ${percentageVariance.toFixed(2)}% exceeds ${config.vatVarianceThreshold}% threshold. ` +
            `All cash deposits and sister concern transfers must be excluded for accurate reporting.`
          : ''
      };
    }

    // Determine final mandatory status (VAT variance forces both)
    const finalCashMandatory = cashMandatory || vatVarianceMandatory;
    const finalSisterMandatory = sisterMandatory || vatVarianceMandatory;

    return {
      cashDeposits: {
        amount: cashDepositsAmount,
        percentage: cashDepositsPercentage,
        excluded: config.excludeCashDeposits || finalCashMandatory,
        mandatory: finalCashMandatory,
        reason: finalCashMandatory
          ? cashMandatory
            ? `Cash deposits represent ${cashDepositsPercentage.toFixed(2)}% of total credits, ` +
              `exceeding the ${config.cashDepositThreshold}% threshold. These must be excluded.`
            : `Excluded due to VAT variance exceeding ${config.vatVarianceThreshold}% threshold.`
          : ''
      },
      sisterConcern: {
        amount: sisterConcernAmount,
        percentage: sisterConcernPercentage,
        excluded: config.excludeSisterConcern || finalSisterMandatory,
        mandatory: finalSisterMandatory,
        reason: finalSisterMandatory
          ? sisterMandatory
            ? `Sister concern transfers represent ${sisterConcernPercentage.toFixed(2)}% of total credits, ` +
              `exceeding the ${config.sisterConcernThreshold}% threshold. These must be excluded.`
            : `Excluded due to VAT variance exceeding ${config.vatVarianceThreshold}% threshold.`
          : ''
      },
      vatVariance: vatVarianceData
    };
  }

  /**
   * Calculate turnover with conditional exclusions
   */
  static calculateConditionalTurnover(
    transactions: Transaction[],
    exclusionStatus: ExclusionStatus
  ): TurnoverResult {
    const totalCredits = transactions
      .filter(t => t.credit > 0)
      .reduce((sum, t) => sum + t.credit, 0);

    const totalDebits = transactions
      .filter(t => t.debit > 0)
      .reduce((sum, t) => sum + t.debit, 0);

    // Calculate turnover based on exclusions
    let turnover = totalCredits;

    if (exclusionStatus.cashDeposits.excluded) {
      turnover -= exclusionStatus.cashDeposits.amount;
    }

    if (exclusionStatus.sisterConcern.excluded) {
      turnover -= exclusionStatus.sisterConcern.amount;
    }

    const totalExcluded = (exclusionStatus.cashDeposits.excluded ? exclusionStatus.cashDeposits.amount : 0) +
                          (exclusionStatus.sisterConcern.excluded ? exclusionStatus.sisterConcern.amount : 0);

    return {
      totalCredits,
      totalDebits,
      cashDeposits: exclusionStatus.cashDeposits.amount,
      cashDepositsExcluded: exclusionStatus.cashDeposits.excluded,
      sisterConcern: exclusionStatus.sisterConcern.amount,
      sisterConcernExcluded: exclusionStatus.sisterConcern.excluded,
      businessTurnover: turnover,
      exclusionRate: totalCredits > 0 ? (totalExcluded / totalCredits) * 100 : 0
    };
  }

  /**
   * Validate configuration and return warnings/errors
   */
  static validateConfiguration(
    config: TurnoverConfiguration
  ): { errors: string[]; warnings: string[]; isValid: boolean } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Date validation
    if (new Date(config.endDate) <= new Date(config.startDate)) {
      errors.push('End date must be after start date');
    }

    // Sister companies validation
    const activeCompanies = config.sisterCompanies.filter(c => c.active);
    if (activeCompanies.length === 0) {
      warnings.push('No sister companies marked as active - all credits will count as business turnover');
    }

    // Keywords validation
    if (config.keywords.cashDeposits.length === 0) {
      warnings.push('No cash deposit keywords defined - cash deposits may not be excluded');
    }

    if (config.keywords.sisterConcern.length === 0) {
      warnings.push('No sister concern keywords defined - related party transactions may not be excluded');
    }

    return { errors, warnings, isValid: errors.length === 0 };
  }

  /**
   * Find the month with highest and lowest business turnover
   */
  static getTurnoverExtremes(monthlyData: MonthlyTurnover[]): {
    highest: MonthlyTurnover | null;
    lowest: MonthlyTurnover | null;
  } {
    if (monthlyData.length === 0) {
      return { highest: null, lowest: null };
    }

    const sorted = [...monthlyData].sort((a, b) => b.businessTurnover - a.businessTurnover);
    return {
      highest: sorted[0],
      lowest: sorted[sorted.length - 1]
    };
  }

  /**
   * Calculate standard deviation for an array of numbers
   */
  private static calculateStandardDeviation(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    return Math.sqrt(avgSquaredDiff);
  }

  /**
   * Determine volatility assessment based on percentage
   */
  private static getVolatilityAssessment(volatilityPercent: number): 'low' | 'moderate' | 'moderate-high' | 'high' {
    if (volatilityPercent <= 15) return 'low';
    if (volatilityPercent <= 25) return 'moderate';
    if (volatilityPercent <= 35) return 'moderate-high';
    return 'high';
  }

  /**
   * Determine activity level based on percentage of total
   */
  private static getActivityLevel(percentage: number, periodMonths: number): 'high' | 'medium' | 'low' {
    const expectedEven = 100 / periodMonths;
    // High: >1.2x expected, Low: <0.75x expected
    if (percentage > expectedEven * 1.2) return 'high';
    if (percentage < expectedEven * 0.75) return 'low';
    return 'medium';
  }

  /**
   * Generate comprehensive turnover analysis report
   * Implements the full spec: Credits + Debits = Turnover, with % breakdown
   */
  static generateTurnoverAnalysisReport(
    transactions: Transaction[],
    config: TurnoverConfiguration,
    companyName?: string
  ): TurnoverAnalysisReport {
    // Group transactions by month
    const monthlyData = new Map<string, { credits: number; debits: number }>();

    transactions.forEach(txn => {
      const date = new Date(txn.date);
      const monthKey = `${date.toLocaleString('default', { month: 'short' })}-${date.getFullYear().toString().slice(-2)}`;

      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, { credits: 0, debits: 0 });
      }
      const data = monthlyData.get(monthKey)!;
      data.credits += txn.credit;
      data.debits += txn.debit;
    });

    // Calculate totals
    let totalCredits = 0;
    let totalDebits = 0;
    const monthlyTurnovers: number[] = [];

    monthlyData.forEach(data => {
      totalCredits += data.credits;
      totalDebits += data.debits;
      monthlyTurnovers.push(data.credits + data.debits);
    });

    const totalTurnover = totalCredits + totalDebits;
    const periodMonths = monthlyData.size || 1;
    const averageMonthlyTurnover = totalTurnover / periodMonths;

    // Calculate volatility
    const stdDev = this.calculateStandardDeviation(monthlyTurnovers);
    const volatilityPercent = averageMonthlyTurnover > 0 
      ? (stdDev / averageMonthlyTurnover) * 100 
      : 0;

    // Build extended monthly breakdown
    const extendedMonthly: ExtendedMonthlyTurnover[] = [];
    
    // Get base monthly turnover data for business metrics
    const baseMonthlyData = this.calculateMonthlyTurnover(transactions, config);

    monthlyData.forEach((data, month) => {
      const baseTurnover = baseMonthlyData.find(m => m.month === month);
      const monthTurnover = data.credits + data.debits;
      const percentage = totalTurnover > 0 ? (monthTurnover / totalTurnover) * 100 : 0;

      extendedMonthly.push({
        month,
        totalCredits: data.credits,
        totalDebits: data.debits,
        totalTurnover: monthTurnover,
        cashDeposits: baseTurnover?.cashDeposits || 0,
        sisterConcern: baseTurnover?.sisterConcern || 0,
        businessTurnover: baseTurnover?.businessTurnover || data.credits,
        percentageOfTotal: percentage,
        exclusionRate: baseTurnover?.exclusionRate || 0,
        ranking: 0, // Will be set below
        activityLevel: this.getActivityLevel(percentage, periodMonths)
      });
    });

    // Sort by turnover descending and assign rankings
    extendedMonthly.sort((a, b) => b.totalTurnover - a.totalTurnover);
    extendedMonthly.forEach((m, idx) => { m.ranking = idx + 1; });

    // Sort back to chronological order
    extendedMonthly.sort((a, b) => {
      const [aMonth, aYear] = a.month.split('-');
      const [bMonth, bYear] = b.month.split('-');
      const aDate = new Date(`${aMonth} 20${aYear}`);
      const bDate = new Date(`${bMonth} 20${bYear}`);
      return aDate.getTime() - bDate.getTime();
    });

    // Categorize by activity level
    const highActivity = extendedMonthly.filter(m => m.activityLevel === 'high');
    const mediumActivity = extendedMonthly.filter(m => m.activityLevel === 'medium');
    const lowActivity = extendedMonthly.filter(m => m.activityLevel === 'low');

    // Find extremes
    const sortedByTurnover = [...extendedMonthly].sort((a, b) => b.totalTurnover - a.totalTurnover);
    const highest = sortedByTurnover[0] || null;
    const lowest = sortedByTurnover[sortedByTurnover.length - 1] || null;

    // Calculate percentage range
    const percentages = extendedMonthly.map(m => m.percentageOfTotal);
    const minPct = Math.min(...percentages);
    const maxPct = Math.max(...percentages);

    return {
      companyName,
      analysisStartDate: config.startDate,
      analysisEndDate: config.endDate,
      periodMonths,
      totalTurnover,
      totalCredits,
      totalDebits,
      averageMonthlyTurnover,
      volatility: {
        standardDeviation: stdDev,
        volatilityPercent,
        assessment: this.getVolatilityAssessment(volatilityPercent)
      },
      monthlyBreakdown: extendedMonthly,
      highActivityMonths: highActivity,
      mediumActivityMonths: mediumActivity,
      lowActivityMonths: lowActivity,
      highestMonth: highest,
      lowestMonth: lowest,
      percentageRange: {
        min: minPct,
        max: maxPct,
        spread: maxPct - minPct
      },
      expectedEvenDistribution: 100 / periodMonths
    };
  }
}
