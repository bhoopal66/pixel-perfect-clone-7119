import { 
  Transaction, 
  TransactionCategory, 
  CategorySummary,
  DailyBalance 
} from '../types/transaction.types';

export interface ChequeReturns {
  inward: number;
  outward: number;
  details: Transaction[];
}

export class TransactionAnalyzer {
  static categorizeTransaction(
    description: string, 
    debit: number, 
    credit: number
  ): TransactionCategory {
    const desc = description.toLowerCase();
    
    // Cheque transactions
    if (desc.includes('cheque') || desc.includes('chq')) {
      return credit > 0 ? TransactionCategory.CHEQUE_DEPOSIT : TransactionCategory.CHEQUE_PAYMENT;
    }
    
    // Cash transactions
    if (desc.includes('cash') || desc.includes('cdm') || desc.includes('atm')) {
      return credit > 0 ? TransactionCategory.CASH_DEPOSIT : TransactionCategory.CASH_WITHDRAWAL;
    }
    
    // Bill payments
    if (desc.includes('bill') || desc.includes('etisalat') || desc.includes('addc') || 
        desc.includes('dewa') || desc.includes('sewa') || desc.includes('utility')) {
      return TransactionCategory.BILL_PAYMENT;
    }
    
    // Salary
    if (desc.includes('salary') || desc.includes('wps') || desc.includes('payroll')) {
      return TransactionCategory.SALARY_PAYMENT;
    }
    
    // Bank transfers
    if (desc.includes('b/o') || desc.includes('adnoc') || desc.includes('treasury') ||
        desc.includes('incoming') || desc.includes('inward')) {
      return credit > 0 ? TransactionCategory.BANK_TRANSFER_IN : TransactionCategory.BANK_TRANSFER_OUT;
    }
    
    if (desc.includes('trf to') || desc.includes('o/w trf') || desc.includes('transfer') ||
        desc.includes('outward') || desc.includes('remittance')) {
      return TransactionCategory.BANK_TRANSFER_OUT;
    }
    
    // Loan
    if (desc.includes('loan') || desc.includes('emi') || desc.includes('installment')) {
      return TransactionCategory.LOAN_PAYMENT;
    }
    
    // Bank charges
    if (desc.includes('fee') || desc.includes('charge') || desc.includes('membership') ||
        desc.includes('commission') || desc.includes('service charge')) {
      return TransactionCategory.BANK_CHARGES;
    }
    
    // Freight
    if (desc.includes('freight') || desc.includes('shipping') || desc.includes('logistics')) {
      return TransactionCategory.FREIGHT;
    }
    
    // Tax
    if (desc.includes('vat') || desc.includes('tax') || desc.includes('fta')) {
      return TransactionCategory.TAX_PAYMENT;
    }
    
    // Commodity
    if (desc.includes('commodity') || desc.includes('gold') || desc.includes('silver')) {
      return TransactionCategory.COMMODITY;
    }
    
    // Default
    return credit > 0 ? TransactionCategory.OTHER_CREDIT : TransactionCategory.OTHER_DEBIT;
  }

  static analyzeCategoryDistribution(transactions: Transaction[]): CategorySummary[] {
    const categoryMap = new Map<string, CategorySummary>();
    
    transactions.forEach(txn => {
      const category = txn.category;
      if (!categoryMap.has(category)) {
        categoryMap.set(category, {
          category,
          count: 0,
          totalDebit: 0,
          totalCredit: 0
        });
      }
      
      const data = categoryMap.get(category)!;
      data.count++;
      data.totalDebit += txn.debit;
      data.totalCredit += txn.credit;
    });
    
    return Array.from(categoryMap.values())
      .sort((a, b) => (b.totalDebit + b.totalCredit) - (a.totalDebit + a.totalCredit));
  }

  static calculateDailyBalances(
    startDate: Date,
    endDate: Date,
    transactions: Transaction[]
  ): DailyBalance[] {
    const dailyBalances: DailyBalance[] = [];
    
    // Sort transactions by date
    const sortedTxns = [...transactions].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    let currentBalance = sortedTxns[0]?.balance || 0;
    let txnIndex = 0;
    
    const d = new Date(startDate);
    while (d <= endDate) {
      const dateStr = d.toISOString().split('T')[0];
      const month = d.toLocaleString('default', { month: 'long', year: 'numeric' });
      
      // Find all transactions for this date
      while (txnIndex < sortedTxns.length) {
        const txnDate = new Date(sortedTxns[txnIndex].date);
        if (txnDate.toDateString() === d.toDateString()) {
          currentBalance = sortedTxns[txnIndex].balance;
          txnIndex++;
        } else if (txnDate > d) {
          break;
        } else {
          txnIndex++;
        }
      }
      
      dailyBalances.push({
        date: dateStr,
        balance: currentBalance,
        month
      });
      
      d.setDate(d.getDate() + 1);
    }
    
    return dailyBalances;
  }

  static identifyChequeReturns(transactions: Transaction[]): ChequeReturns {
    const chequeReturns: ChequeReturns = {
      inward: 0,
      outward: 0,
      details: []
    };
    
    transactions.forEach(txn => {
      const desc = txn.description.toLowerCase();
      if (desc.includes('return') && (desc.includes('cheque') || desc.includes('chq'))) {
        if (txn.credit > 0) {
          chequeReturns.inward++;
        } else {
          chequeReturns.outward++;
        }
        chequeReturns.details.push(txn);
      }
    });
    
    return chequeReturns;
  }

  static calculateMonthlyAverage(dailyBalances: DailyBalance[]): number {
    if (dailyBalances.length === 0) return 0;
    const sum = dailyBalances.reduce((acc, day) => acc + day.balance, 0);
    return sum / dailyBalances.length;
  }
}
