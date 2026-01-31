import type { Transaction, DailyBalance } from '../types/transaction.types';

/**
 * Calculates daily closing balances for a date range
 * Closing balance = the last transaction balance of each day
 * For days with no transactions, carry forward previous day's closing balance
 */
export function calculateDailyClosingBalances(
  transactions: Transaction[],
  startDate: Date,
  endDate: Date,
  openingBalance: number
): DailyBalance[] {
  const dailyBalances: DailyBalance[] = [];
  
  // Group transactions by date (YYYY-MM-DD format)
  const transactionsByDate = new Map<string, Transaction[]>();
  
  transactions.forEach(txn => {
    const dateKey = new Date(txn.date).toISOString().split('T')[0];
    if (!transactionsByDate.has(dateKey)) {
      transactionsByDate.set(dateKey, []);
    }
    transactionsByDate.get(dateKey)!.push(txn);
  });
  
  // Sort transactions within each day by time/sequence
  transactionsByDate.forEach((txns) => {
    txns.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  });
  
  let currentDate = new Date(startDate);
  let currentClosingBalance = openingBalance;
  
  // Iterate through each day in the range
  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const transactionsToday = transactionsByDate.get(dateStr) || [];
    const hasTransactions = transactionsToday.length > 0;
    
    if (hasTransactions) {
      // Day has transactions: closing balance = last transaction's balance
      currentClosingBalance = transactionsToday[transactionsToday.length - 1].balance;
    }
    // If no transactions: currentClosingBalance stays the same (carried forward)
    
    dailyBalances.push({
      date: dateStr,
      closingBalance: currentClosingBalance,
      month: currentDate.toLocaleString('default', { 
        month: 'long', 
        year: 'numeric' 
      }),
      hasTransactions
    });
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dailyBalances;
}

/**
 * Calculate the average of daily closing balances
 */
export function calculateAverageClosingBalance(dailyBalances: DailyBalance[]): number {
  if (dailyBalances.length === 0) return 0;
  const sum = dailyBalances.reduce((acc, day) => acc + day.closingBalance, 0);
  return sum / dailyBalances.length;
}
