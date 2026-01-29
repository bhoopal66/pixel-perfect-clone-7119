import type { Transaction, DailyBalance } from '../types/transaction.types';
import type {
  MonthlyTurnoverBalance,
  QuarterlyTurnoverBalance,
  HalfYearlyTurnoverBalance,
  YearlyTurnoverBalance,
  TurnoverBalanceReport
} from '../types/turnover.types';
import { calculateDailyClosingBalances } from '../utils/balanceCalculator';

/**
 * CORRECT TURNOVER DEFINITIONS:
 * - Turnover = Total Credits (simple sum of all credit transactions)
 * - Average Balance = Average of all EOD (End of Day) balances
 * - Avg Balance % = (Average Balance / Turnover) × 100
 */
export class TurnoverBalanceAnalyzer {
  /**
   * Calculate turnover (sum of credits)
   */
  static calculateTurnover(transactions: Transaction[]): number {
    return transactions
      .filter(t => t.credit > 0)
      .reduce((sum, t) => sum + t.credit, 0);
  }

  /**
   * Calculate average of EOD balances
   */
  static calculateAverageBalance(dailyBalances: DailyBalance[]): number {
    if (dailyBalances.length === 0) return 0;
    const sum = dailyBalances.reduce((acc, day) => acc + day.closingBalance, 0);
    return sum / dailyBalances.length;
  }

  /**
   * Calculate Average Balance as % of Turnover
   */
  static calculateAvgBalancePercentage(
    averageBalance: number,
    turnover: number
  ): number {
    if (turnover === 0) return 0;
    return (averageBalance / turnover) * 100;
  }

  /**
   * Determine balance coverage assessment
   */
  static getBalanceCoverage(avgBalancePct: number): 'excellent' | 'good' | 'moderate' | 'low' {
    if (avgBalancePct >= 100) return 'excellent';
    if (avgBalancePct >= 50) return 'good';
    if (avgBalancePct >= 25) return 'moderate';
    return 'low';
  }

  /**
   * Group transactions and balances by month
   */
  private static groupByMonth(
    transactions: Transaction[],
    dailyBalances: DailyBalance[]
  ): Map<string, { transactions: Transaction[]; balances: DailyBalance[] }> {
    const grouped = new Map<string, { transactions: Transaction[]; balances: DailyBalance[] }>();

    // Group transactions
    transactions.forEach(txn => {
      const date = new Date(txn.date);
      const monthKey = `${date.toLocaleString('default', { month: 'short' })}-${date.getFullYear().toString().slice(-2)}`;
      
      if (!grouped.has(monthKey)) {
        grouped.set(monthKey, { transactions: [], balances: [] });
      }
      grouped.get(monthKey)!.transactions.push(txn);
    });

    // Group daily balances
    dailyBalances.forEach(balance => {
      const date = new Date(balance.date);
      const monthKey = `${date.toLocaleString('default', { month: 'short' })}-${date.getFullYear().toString().slice(-2)}`;
      
      if (!grouped.has(monthKey)) {
        grouped.set(monthKey, { transactions: [], balances: [] });
      }
      grouped.get(monthKey)!.balances.push(balance);
    });

    return grouped;
  }

  /**
   * Calculate monthly turnover & balance analysis
   */
  static calculateMonthlyAnalysis(
    transactions: Transaction[],
    dailyBalances: DailyBalance[]
  ): MonthlyTurnoverBalance[] {
    const grouped = this.groupByMonth(transactions, dailyBalances);
    const results: MonthlyTurnoverBalance[] = [];

    grouped.forEach((data, month) => {
      const turnover = data.transactions
        .filter(t => t.credit > 0)
        .reduce((sum, t) => sum + t.credit, 0);
      
      const totalDebits = data.transactions
        .filter(t => t.debit > 0)
        .reduce((sum, t) => sum + t.debit, 0);

      const averageBalance = this.calculateAverageBalance(data.balances);
      const avgBalancePercentage = this.calculateAvgBalancePercentage(averageBalance, turnover);

      // Get opening and closing balances
      const sortedBalances = [...data.balances].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      const openingBalance = sortedBalances[0]?.closingBalance || 0;
      const closingBalance = sortedBalances[sortedBalances.length - 1]?.closingBalance || 0;

      results.push({
        month,
        turnover,
        averageBalance,
        avgBalancePercentage,
        days: data.balances.length,
        openingBalance,
        closingBalance,
        totalDebits,
        transactionCount: data.transactions.length
      });
    });

    // Sort chronologically
    return results.sort((a, b) => {
      const [aMonth, aYear] = a.month.split('-');
      const [bMonth, bYear] = b.month.split('-');
      const aDate = new Date(`${aMonth} 20${aYear}`);
      const bDate = new Date(`${bMonth} 20${bYear}`);
      return aDate.getTime() - bDate.getTime();
    });
  }

  /**
   * Calculate quarterly analysis from monthly data
   */
  static calculateQuarterlyAnalysis(
    monthly: MonthlyTurnoverBalance[]
  ): QuarterlyTurnoverBalance[] {
    const quarters = new Map<string, MonthlyTurnoverBalance[]>();

    monthly.forEach(m => {
      const [monthName, year] = m.month.split('-');
      const monthNum = new Date(`${monthName} 1, 2000`).getMonth();
      const quarterNum = Math.floor(monthNum / 3) + 1;
      const quarterKey = `Q${quarterNum} 20${year}`;

      if (!quarters.has(quarterKey)) {
        quarters.set(quarterKey, []);
      }
      quarters.get(quarterKey)!.push(m);
    });

    const results: QuarterlyTurnoverBalance[] = [];

    quarters.forEach((months, quarter) => {
      const turnover = months.reduce((sum, m) => sum + m.turnover, 0);
      const totalDays = months.reduce((sum, m) => sum + m.days, 0);
      
      // Weighted average balance
      const weightedSum = months.reduce((sum, m) => sum + m.averageBalance * m.days, 0);
      const averageBalance = totalDays > 0 ? weightedSum / totalDays : 0;
      
      const avgBalancePercentage = this.calculateAvgBalancePercentage(averageBalance, turnover);

      results.push({
        quarter,
        months: months.map(m => m.month),
        turnover,
        averageBalance,
        avgBalancePercentage,
        days: totalDays
      });
    });

    // Sort by quarter
    return results.sort((a, b) => {
      const [aQ, aYear] = a.quarter.split(' ');
      const [bQ, bYear] = b.quarter.split(' ');
      if (aYear !== bYear) return parseInt(aYear) - parseInt(bYear);
      return aQ.localeCompare(bQ);
    });
  }

  /**
   * Calculate half-yearly analysis
   */
  static calculateHalfYearlyAnalysis(
    monthly: MonthlyTurnoverBalance[]
  ): HalfYearlyTurnoverBalance[] {
    const halves = new Map<string, MonthlyTurnoverBalance[]>();

    monthly.forEach(m => {
      const [monthName, year] = m.month.split('-');
      const monthNum = new Date(`${monthName} 1, 2000`).getMonth();
      const halfKey = monthNum < 6 ? `H1 20${year}` : `H2 20${year}`;

      if (!halves.has(halfKey)) {
        halves.set(halfKey, []);
      }
      halves.get(halfKey)!.push(m);
    });

    const results: HalfYearlyTurnoverBalance[] = [];

    halves.forEach((months, period) => {
      const turnover = months.reduce((sum, m) => sum + m.turnover, 0);
      const totalDays = months.reduce((sum, m) => sum + m.days, 0);
      
      const weightedSum = months.reduce((sum, m) => sum + m.averageBalance * m.days, 0);
      const averageBalance = totalDays > 0 ? weightedSum / totalDays : 0;
      
      const avgBalancePercentage = this.calculateAvgBalancePercentage(averageBalance, turnover);

      results.push({
        period,
        months: months.map(m => m.month),
        turnover,
        averageBalance,
        avgBalancePercentage,
        days: totalDays
      });
    });

    return results.sort((a, b) => a.period.localeCompare(b.period));
  }

  /**
   * Calculate yearly analysis
   */
  static calculateYearlyAnalysis(
    monthly: MonthlyTurnoverBalance[],
    halfYearly: HalfYearlyTurnoverBalance[]
  ): YearlyTurnoverBalance | null {
    if (monthly.length === 0) return null;

    const years = new Set(monthly.map(m => `20${m.month.split('-')[1]}`));
    
    // For simplicity, return analysis for the first year found
    const year = Array.from(years)[0];
    
    const turnover = monthly.reduce((sum, m) => sum + m.turnover, 0);
    const totalDays = monthly.reduce((sum, m) => sum + m.days, 0);
    
    const weightedSum = monthly.reduce((sum, m) => sum + m.averageBalance * m.days, 0);
    const averageBalance = totalDays > 0 ? weightedSum / totalDays : 0;
    
    const avgBalancePercentage = this.calculateAvgBalancePercentage(averageBalance, turnover);

    const h1 = halfYearly.find(h => h.period.startsWith('H1')) || null;
    const h2 = halfYearly.find(h => h.period.startsWith('H2')) || null;

    return {
      year,
      turnover,
      averageBalance,
      avgBalancePercentage,
      days: totalDays,
      h1,
      h2
    };
  }

  /**
   * Generate complete Turnover & Average Balance Report
   */
  static generateReport(
    transactions: Transaction[],
    startDate: Date,
    endDate: Date,
    openingBalance: number,
    companyName?: string
  ): TurnoverBalanceReport {
    // Calculate daily balances
    const dailyBalances = calculateDailyClosingBalances(
      transactions,
      startDate,
      endDate,
      openingBalance
    );

    // Calculate breakdowns
    const monthly = this.calculateMonthlyAnalysis(transactions, dailyBalances);
    const quarterly = this.calculateQuarterlyAnalysis(monthly);
    const halfYearly = this.calculateHalfYearlyAnalysis(monthly);
    const yearly = this.calculateYearlyAnalysis(monthly, halfYearly);

    // Overall totals
    const totalTurnover = monthly.reduce((sum, m) => sum + m.turnover, 0);
    const totalDebits = monthly.reduce((sum, m) => sum + m.totalDebits, 0);
    const overallAverageBalance = this.calculateAverageBalance(dailyBalances);
    const overallAvgBalancePercentage = this.calculateAvgBalancePercentage(
      overallAverageBalance,
      totalTurnover
    );

    return {
      companyName,
      analysisStartDate: startDate.toISOString().split('T')[0],
      analysisEndDate: endDate.toISOString().split('T')[0],
      totalDays: dailyBalances.length,
      totalTurnover,
      totalDebits,
      overallAverageBalance,
      overallAvgBalancePercentage,
      monthly,
      quarterly,
      halfYearly,
      yearly,
      balanceCoverage: this.getBalanceCoverage(overallAvgBalancePercentage)
    };
  }
}
