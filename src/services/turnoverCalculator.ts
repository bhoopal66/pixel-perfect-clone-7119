import type { Transaction } from '../types/transaction.types';
import type {
  TurnoverConfiguration,
  TransactionClassification,
  ClassifiedTransaction,
  MonthlyTurnover,
  TurnoverSummary,
  SisterCompany,
  TransactionKeywords
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
}
