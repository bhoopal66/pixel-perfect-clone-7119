/**
 * CORRECT Turnover Analysis Service
 * 
 * Turnover = Total Credits (sum of all credit transactions)
 * Average Balance = Average of all EOD (End of Day) balances
 * Avg Balance % = (Average Balance / Turnover) × 100
 */

import type { Transaction, DailyBalance, MonthlyBalance } from '../types/transaction.types';
import type {
  TurnoverAnalysis,
  MonthlyTurnoverAnalysis,
  QuarterlyTurnoverAnalysis,
  HalfYearlyTurnoverAnalysis,
  YearlyTurnoverAnalysis,
  TurnoverAnalysisSummary
} from '../types/turnoverAnalysis.types';
import type { CurrencyCode } from './currencyService';

export class TurnoverAnalysisService {
  /**
   * Calculate turnover (Total Credits) from transactions
   */
  static calculateTurnover(transactions: Transaction[]): number {
    return transactions
      .filter(t => t.credit > 0)
      .reduce((sum, t) => sum + t.credit, 0);
  }

  /**
   * Calculate total debits from transactions (for reference)
   */
  static calculateTotalDebits(transactions: Transaction[]): number {
    return transactions
      .filter(t => t.debit > 0)
      .reduce((sum, t) => sum + t.debit, 0);
  }

  /**
   * Calculate average balance from EOD balances
   */
  static calculateAverageBalance(eodBalances: number[]): number {
    if (eodBalances.length === 0) return 0;
    const sum = eodBalances.reduce((a, b) => a + b, 0);
    return sum / eodBalances.length;
  }

  /**
   * Calculate Average Balance as percentage of Turnover
   * Formula: (Average Balance / Turnover) × 100
   */
  static calculateAvgBalancePercentage(averageBalance: number, turnover: number): number {
    if (turnover === 0) return 0;
    return (averageBalance / turnover) * 100;
  }

  /**
   * Group transactions by month (returns Map<monthKey, Transaction[]>)
   */
  private static groupTransactionsByMonth(transactions: Transaction[]): Map<string, Transaction[]> {
    const monthlyData = new Map<string, Transaction[]>();
    
    transactions.forEach(txn => {
      const date = new Date(txn.date);
      const monthKey = `${date.toLocaleString('default', { month: 'short' })}-${date.getFullYear().toString().slice(-2)}`;
      
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, []);
      }
      monthlyData.get(monthKey)!.push(txn);
    });

    return monthlyData;
  }

  /**
   * Group daily balances by month
   */
  private static groupDailyBalancesByMonth(dailyBalances: DailyBalance[]): Map<string, DailyBalance[]> {
    const monthlyBalances = new Map<string, DailyBalance[]>();
    
    dailyBalances.forEach(day => {
      const date = new Date(day.date);
      const monthKey = `${date.toLocaleString('default', { month: 'short' })}-${date.getFullYear().toString().slice(-2)}`;
      
      if (!monthlyBalances.has(monthKey)) {
        monthlyBalances.set(monthKey, []);
      }
      monthlyBalances.get(monthKey)!.push(day);
    });

    return monthlyBalances;
  }

  /**
   * Calculate monthly turnover analysis
   */
  static calculateMonthlyAnalysis(
    transactions: Transaction[],
    dailyBalances: DailyBalance[]
  ): MonthlyTurnoverAnalysis[] {
    const transactionsByMonth = this.groupTransactionsByMonth(transactions);
    const balancesByMonth = this.groupDailyBalancesByMonth(dailyBalances);
    
    const results: MonthlyTurnoverAnalysis[] = [];

    // Get all unique months from both sources
    const allMonths = new Set([
      ...transactionsByMonth.keys(),
      ...balancesByMonth.keys()
    ]);

    allMonths.forEach(month => {
      const monthTransactions = transactionsByMonth.get(month) || [];
      const monthBalances = balancesByMonth.get(month) || [];
      
      const turnover = this.calculateTurnover(monthTransactions);
      const totalDebits = this.calculateTotalDebits(monthTransactions);
      const eodBalances = monthBalances.map(d => d.closingBalance);
      const averageBalance = this.calculateAverageBalance(eodBalances);
      const avgBalancePercentage = this.calculateAvgBalancePercentage(averageBalance, turnover);
      
      // Get opening/closing balances
      const openingBalance = monthBalances.length > 0 ? monthBalances[0].closingBalance : 0;
      const closingBalance = monthBalances.length > 0 ? monthBalances[monthBalances.length - 1].closingBalance : 0;

      results.push({
        month,
        turnover,
        totalDebits,
        averageBalance,
        avgBalancePercentage,
        days: monthBalances.length,
        openingBalance,
        closingBalance
      });
    });

    // Sort by date
    return results.sort((a, b) => {
      const parseMonthKey = (key: string) => {
        const [monthStr, yearStr] = key.split('-');
        const monthIndex = new Date(`${monthStr} 1, 2024`).getMonth();
        const year = parseInt(`20${yearStr}`);
        return new Date(year, monthIndex);
      };
      return parseMonthKey(a.month).getTime() - parseMonthKey(b.month).getTime();
    });
  }

  /**
   * Calculate quarterly turnover analysis
   */
  static calculateQuarterlyAnalysis(
    transactions: Transaction[],
    dailyBalances: DailyBalance[]
  ): QuarterlyTurnoverAnalysis[] {
    const quarterMap = new Map<string, { transactions: Transaction[]; balances: DailyBalance[]; months: Set<string> }>();

    // Group by quarter
    transactions.forEach(txn => {
      const date = new Date(txn.date);
      const quarter = Math.ceil((date.getMonth() + 1) / 3);
      const year = date.getFullYear();
      const quarterKey = `Q${quarter} ${year}`;
      const monthKey = `${date.toLocaleString('default', { month: 'short' })}-${year.toString().slice(-2)}`;
      
      if (!quarterMap.has(quarterKey)) {
        quarterMap.set(quarterKey, { transactions: [], balances: [], months: new Set() });
      }
      const data = quarterMap.get(quarterKey)!;
      data.transactions.push(txn);
      data.months.add(monthKey);
    });

    dailyBalances.forEach(day => {
      const date = new Date(day.date);
      const quarter = Math.ceil((date.getMonth() + 1) / 3);
      const year = date.getFullYear();
      const quarterKey = `Q${quarter} ${year}`;
      
      if (!quarterMap.has(quarterKey)) {
        quarterMap.set(quarterKey, { transactions: [], balances: [], months: new Set() });
      }
      quarterMap.get(quarterKey)!.balances.push(day);
    });

    const results: QuarterlyTurnoverAnalysis[] = [];

    quarterMap.forEach((data, quarter) => {
      const turnover = this.calculateTurnover(data.transactions);
      const totalDebits = this.calculateTotalDebits(data.transactions);
      const eodBalances = data.balances.map(d => d.closingBalance);
      const averageBalance = this.calculateAverageBalance(eodBalances);
      const avgBalancePercentage = this.calculateAvgBalancePercentage(averageBalance, turnover);
      
      const openingBalance = data.balances.length > 0 ? data.balances[0].closingBalance : 0;
      const closingBalance = data.balances.length > 0 ? data.balances[data.balances.length - 1].closingBalance : 0;

      results.push({
        quarter,
        months: Array.from(data.months),
        turnover,
        totalDebits,
        averageBalance,
        avgBalancePercentage,
        days: data.balances.length,
        openingBalance,
        closingBalance
      });
    });

    // Sort by quarter
    return results.sort((a, b) => {
      const parseQuarter = (q: string) => {
        const [qNum, year] = q.split(' ');
        return parseInt(year) * 4 + parseInt(qNum.replace('Q', ''));
      };
      return parseQuarter(a.quarter) - parseQuarter(b.quarter);
    });
  }

  /**
   * Calculate half-yearly turnover analysis
   */
  static calculateHalfYearlyAnalysis(
    transactions: Transaction[],
    dailyBalances: DailyBalance[]
  ): { h1: HalfYearlyTurnoverAnalysis | null; h2: HalfYearlyTurnoverAnalysis | null } {
    const halfYearMap = new Map<string, { transactions: Transaction[]; balances: DailyBalance[]; months: Set<string> }>();

    // Group by half-year
    transactions.forEach(txn => {
      const date = new Date(txn.date);
      const half = date.getMonth() < 6 ? 'H1' : 'H2';
      const year = date.getFullYear();
      const key = `${half} ${year}`;
      const monthKey = `${date.toLocaleString('default', { month: 'short' })}-${year.toString().slice(-2)}`;
      
      if (!halfYearMap.has(key)) {
        halfYearMap.set(key, { transactions: [], balances: [], months: new Set() });
      }
      const data = halfYearMap.get(key)!;
      data.transactions.push(txn);
      data.months.add(monthKey);
    });

    dailyBalances.forEach(day => {
      const date = new Date(day.date);
      const half = date.getMonth() < 6 ? 'H1' : 'H2';
      const year = date.getFullYear();
      const key = `${half} ${year}`;
      
      if (!halfYearMap.has(key)) {
        halfYearMap.set(key, { transactions: [], balances: [], months: new Set() });
      }
      halfYearMap.get(key)!.balances.push(day);
    });

    const createHalfYearAnalysis = (key: string): HalfYearlyTurnoverAnalysis | null => {
      const data = halfYearMap.get(key);
      if (!data || data.transactions.length === 0) return null;

      const [half, yearStr] = key.split(' ');
      const turnover = this.calculateTurnover(data.transactions);
      const totalDebits = this.calculateTotalDebits(data.transactions);
      const eodBalances = data.balances.map(d => d.closingBalance);
      const averageBalance = this.calculateAverageBalance(eodBalances);
      const avgBalancePercentage = this.calculateAvgBalancePercentage(averageBalance, turnover);
      
      const openingBalance = data.balances.length > 0 ? data.balances[0].closingBalance : 0;
      const closingBalance = data.balances.length > 0 ? data.balances[data.balances.length - 1].closingBalance : 0;

      return {
        period: half as 'H1' | 'H2',
        year: parseInt(yearStr),
        months: Array.from(data.months),
        turnover,
        totalDebits,
        averageBalance,
        avgBalancePercentage,
        days: data.balances.length,
        openingBalance,
        closingBalance
      };
    };

    // Get the primary year from transactions
    const years = new Set<number>();
    transactions.forEach(t => years.add(new Date(t.date).getFullYear()));
    const primaryYear = Math.max(...years);

    return {
      h1: createHalfYearAnalysis(`H1 ${primaryYear}`),
      h2: createHalfYearAnalysis(`H2 ${primaryYear}`)
    };
  }

  /**
   * Calculate complete turnover analysis summary
   */
  static calculateTurnoverAnalysisSummary(
    transactions: Transaction[],
    dailyBalances: DailyBalance[],
    currency: CurrencyCode
  ): TurnoverAnalysisSummary {
    const monthly = this.calculateMonthlyAnalysis(transactions, dailyBalances);
    const quarterly = this.calculateQuarterlyAnalysis(transactions, dailyBalances);
    const halfYearly = this.calculateHalfYearlyAnalysis(transactions, dailyBalances);

    // Calculate yearly summary if we have data
    let yearly: YearlyTurnoverAnalysis | null = null;
    if (halfYearly.h1 || halfYearly.h2) {
      const year = halfYearly.h1?.year || halfYearly.h2?.year || new Date().getFullYear();
      const h1Turnover = halfYearly.h1?.turnover || 0;
      const h2Turnover = halfYearly.h2?.turnover || 0;
      const h1Debits = halfYearly.h1?.totalDebits || 0;
      const h2Debits = halfYearly.h2?.totalDebits || 0;
      
      // Combine all daily balances for the year
      const yearBalances = dailyBalances.filter(d => new Date(d.date).getFullYear() === year);
      const avgBalance = this.calculateAverageBalance(yearBalances.map(d => d.closingBalance));
      const totalTurnover = h1Turnover + h2Turnover;
      
      yearly = {
        year,
        turnover: totalTurnover,
        totalDebits: h1Debits + h2Debits,
        averageBalance: avgBalance,
        avgBalancePercentage: this.calculateAvgBalancePercentage(avgBalance, totalTurnover),
        days: yearBalances.length,
        openingBalance: halfYearly.h1?.openingBalance || halfYearly.h2?.openingBalance || 0,
        closingBalance: halfYearly.h2?.closingBalance || halfYearly.h1?.closingBalance || 0,
        h1: halfYearly.h1,
        h2: halfYearly.h2,
        quarters: quarterly.filter(q => {
          const qYear = parseInt(q.quarter.split(' ')[1]);
          return qYear === year;
        })
      };
    }

    return {
      monthly,
      quarterly,
      halfYearly,
      yearly,
      currency
    };
  }
}
