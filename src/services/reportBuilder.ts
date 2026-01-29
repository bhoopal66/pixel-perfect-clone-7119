import { PDFParser, ExtractedTransaction } from './pdfParser';
import { TransactionAnalyzer } from './transactionAnalyzer';
import { CurrencyService, type CurrencyCode } from './currencyService';
import { calculateDailyClosingBalances } from '../utils/balanceCalculator';
import type { 
  AnalysisReport, 
  Transaction, 
  TransactionCategory,
  MonthlyBalance,
  MonthSummary,
  ChequeAnalysis
} from '../types/transaction.types';

export class ReportBuilder {
  static async buildReport(files: File[]): Promise<AnalysisReport> {
    // Parse all PDFs
    const parsedFiles = await Promise.all(
      files.map(file => PDFParser.parsePDF(file))
    );

    // Extract all data
    const allTransactionsRaw: ExtractedTransaction[] = [];
    let accountInfo = {
      accountName: '',
      accountNumber: '',
      iban: '',
      bank: 'Bank',
      period: '',
      currency: 'AED' as CurrencyCode,
      currencies: [] as CurrencyCode[]
    };

    let firstStartDate: string | undefined;
    let lastEndDate: string | undefined;

    for (const parsed of parsedFiles) {
      const transactions = PDFParser.extractTransactions(parsed.text);
      allTransactionsRaw.push(...transactions);

      const info = PDFParser.extractAccountInfo(parsed.text);
      if (info.accountName) accountInfo.accountName = info.accountName;
      if (info.accountNumber) accountInfo.accountNumber = info.accountNumber;
      if (info.iban) accountInfo.iban = info.iban;
      if (info.startDate && (!firstStartDate || new Date(info.startDate) < new Date(firstStartDate))) {
        firstStartDate = info.startDate;
      }
      if (info.endDate && (!lastEndDate || new Date(info.endDate) > new Date(lastEndDate))) {
        lastEndDate = info.endDate;
      }

      // Detect currency from statement
      const detectedCurrency = CurrencyService.detectCurrency(parsed.text);
      accountInfo.currency = detectedCurrency;
    }

    accountInfo.period = firstStartDate && lastEndDate 
      ? `${firstStartDate} to ${lastEndDate}`
      : '6 Month Analysis';

    const baseCurrency = accountInfo.currency;
    const currenciesFound = new Set<CurrencyCode>([baseCurrency]);

    // Categorize transactions and detect individual transaction currencies
    const transactions: Transaction[] = allTransactionsRaw.map(txn => {
      const txnCurrency = CurrencyService.detectTransactionCurrency(txn.description, baseCurrency);
      if (txnCurrency !== baseCurrency) {
        currenciesFound.add(txnCurrency);
      }

      return {
        ...txn,
        category: TransactionAnalyzer.categorizeTransaction(
          txn.description,
          txn.debit,
          txn.credit
        ),
        currency: baseCurrency,
        originalCurrency: txnCurrency !== baseCurrency ? txnCurrency : undefined,
        originalAmount: txnCurrency !== baseCurrency ? (txn.debit || txn.credit) : undefined,
        exchangeRate: txnCurrency !== baseCurrency 
          ? CurrencyService.getRate(txnCurrency, baseCurrency) 
          : undefined
      };
    });

    accountInfo.currencies = Array.from(currenciesFound);

    // Sort by date
    transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate summary
    const openingBalance = transactions[0]?.balance || 0;
    const closingBalance = transactions[transactions.length - 1]?.balance || 0;
    const totalCredits = transactions.reduce((sum, t) => sum + t.credit, 0);
    const totalDebits = transactions.reduce((sum, t) => sum + t.debit, 0);
    const creditCount = transactions.filter(t => t.credit > 0).length;
    const debitCount = transactions.filter(t => t.debit > 0).length;

    // Group by month
    const monthlyData = this.groupByMonth(transactions);
    const monthlyBalances = this.calculateMonthlyBalances(monthlyData);
    const monthWiseSummary = this.calculateMonthWiseSummary(monthlyData);

    // Calculate daily closing balances (use 6 months range)
    const startDate = transactions[0]?.date 
      ? new Date(transactions[0].date) 
      : new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
    const endDate = transactions[transactions.length - 1]?.date
      ? new Date(transactions[transactions.length - 1].date)
      : new Date();
    
    // Calculate opening balance for first day (use the balance before first transaction)
    const firstTxn = transactions[0];
    const dailyOpeningBalance = firstTxn 
      ? firstTxn.balance - firstTxn.credit + firstTxn.debit 
      : 0;
    
    const dailyBalances = calculateDailyClosingBalances(
      transactions,
      startDate,
      endDate,
      dailyOpeningBalance
    );

    // Calculate average monthly balance
    const averageMonthlyBalance = monthlyBalances.length > 0
      ? monthlyBalances.reduce((sum, m) => sum + m.average, 0) / monthlyBalances.length
      : 0;

    // Category analysis
    const categoryAnalysis = TransactionAnalyzer.analyzeCategoryDistribution(transactions);

    // Cheque analysis
    const chequeReturns = TransactionAnalyzer.identifyChequeReturns(transactions);
    const chequeAnalysis = this.buildChequeAnalysis(transactions, chequeReturns);

    return {
      accountInfo,
      summary: {
        openingBalance,
        closingBalance,
        netChange: closingBalance - openingBalance,
        totalCredits,
        totalDebits,
        creditCount,
        debitCount,
        averageMonthlyBalance,
        currency: baseCurrency,
        currencyBreakdown: this.buildCurrencyBreakdown(transactions, baseCurrency)
      },
      monthlyBalances,
      dailyBalances,
      transactions,
      categoryAnalysis,
      chequeAnalysis,
      monthWiseSummary
    };
  }

  private static groupByMonth(transactions: Transaction[]): Map<string, Transaction[]> {
    const monthlyData = new Map<string, Transaction[]>();
    
    transactions.forEach(txn => {
      const date = new Date(txn.date);
      const monthKey = `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;
      
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, []);
      }
      monthlyData.get(monthKey)!.push(txn);
    });

    return monthlyData;
  }

  private static calculateMonthlyBalances(monthlyData: Map<string, Transaction[]>): MonthlyBalance[] {
    const balances: MonthlyBalance[] = [];

    monthlyData.forEach((transactions, month) => {
      if (transactions.length === 0) return;

      const opening = transactions[0].balance - transactions[0].credit + transactions[0].debit;
      const closing = transactions[transactions.length - 1].balance;
      
      // Calculate average from all balances in the month
      const avgBalance = transactions.reduce((sum, t) => sum + t.balance, 0) / transactions.length;
      
      // Get unique days
      const uniqueDays = new Set(transactions.map(t => t.date)).size;

      balances.push({
        month,
        average: avgBalance,
        days: uniqueDays,
        opening,
        closing
      });
    });

    return balances;
  }

  private static calculateMonthWiseSummary(monthlyData: Map<string, Transaction[]>): MonthSummary[] {
    const summaries: MonthSummary[] = [];

    monthlyData.forEach((transactions, month) => {
      if (transactions.length === 0) return;

      const opening = transactions[0].balance - transactions[0].credit + transactions[0].debit;
      const closing = transactions[transactions.length - 1].balance;
      const totalCredits = transactions.reduce((sum, t) => sum + t.credit, 0);
      const totalDebits = transactions.reduce((sum, t) => sum + t.debit, 0);
      const creditCount = transactions.filter(t => t.credit > 0).length;
      const debitCount = transactions.filter(t => t.debit > 0).length;
      const average = transactions.reduce((sum, t) => sum + t.balance, 0) / transactions.length;

      summaries.push({
        month,
        opening,
        closing,
        totalCredits,
        totalDebits,
        creditCount,
        debitCount,
        netChange: closing - opening,
        average
      });
    });

    return summaries;
  }

  private static buildChequeAnalysis(
    transactions: Transaction[],
    chequeReturns: { inward: number; outward: number }
  ): ChequeAnalysis {
    const monthlyData: { month: string; payments: number; deposits: number }[] = [];
    const monthlyMap = new Map<string, { payments: number; deposits: number }>();

    transactions.forEach(txn => {
      const isCheque = txn.category === 'Cheque Payment' || txn.category === 'Cheque Deposit';
      if (!isCheque) return;

      const date = new Date(txn.date);
      const monthKey = `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;

      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, { payments: 0, deposits: 0 });
      }

      const data = monthlyMap.get(monthKey)!;
      if (txn.debit > 0) {
        data.payments += txn.debit;
      } else {
        data.deposits += txn.credit;
      }
    });

    monthlyMap.forEach((data, month) => {
      monthlyData.push({
        month,
        payments: data.payments,
        deposits: data.deposits
      });
    });

    return {
      monthlyData,
      returns: chequeReturns
    };
  }

  private static buildCurrencyBreakdown(
    transactions: Transaction[], 
    baseCurrency: CurrencyCode
  ): { currency: CurrencyCode; totalCredits: number; totalDebits: number; convertedCredits: number; convertedDebits: number; }[] {
    const currencyMap = new Map<CurrencyCode, { credits: number; debits: number; convertedCredits: number; convertedDebits: number }>();
    
    transactions.forEach(txn => {
      const currency = txn.originalCurrency || txn.currency;
      if (!currencyMap.has(currency)) {
        currencyMap.set(currency, { credits: 0, debits: 0, convertedCredits: 0, convertedDebits: 0 });
      }
      
      const data = currencyMap.get(currency)!;
      data.credits += txn.credit;
      data.debits += txn.debit;
      
      // Convert to base currency
      if (currency !== baseCurrency) {
        data.convertedCredits += CurrencyService.convert(txn.credit, currency, baseCurrency);
        data.convertedDebits += CurrencyService.convert(txn.debit, currency, baseCurrency);
      } else {
        data.convertedCredits += txn.credit;
        data.convertedDebits += txn.debit;
      }
    });

    return Array.from(currencyMap.entries()).map(([currency, data]) => ({
      currency,
      totalCredits: data.credits,
      totalDebits: data.debits,
      convertedCredits: data.convertedCredits,
      convertedDebits: data.convertedDebits
    }));
  }

  // Generate demo data for testing without actual PDF files
  static generateDemoReport(): AnalysisReport {
    const months = ['January 2024', 'February 2024', 'March 2024', 'April 2024', 'May 2024', 'June 2024'];
    const categories = [
      'Bank Transfer (Inward)',
      'Bank Transfer (Outward)',
      'Bill Payments',
      'Salary Payments',
      'Cash Withdrawal',
      'Bank Charges & Fees',
      'Other Credit',
      'Other Debit'
    ];

    // Generate sample transactions
    const transactions: Transaction[] = [];
    let balance = 150000;
    
    months.forEach((month, monthIndex) => {
      const daysInMonth = [31, 29, 31, 30, 31, 30][monthIndex];
      
      for (let day = 1; day <= daysInMonth; day += Math.floor(Math.random() * 3) + 1) {
        const isCredit = Math.random() > 0.4;
        const amount = Math.floor(Math.random() * 50000) + 1000;
        
        if (isCredit) {
          balance += amount;
        } else {
          balance -= amount;
        }

        transactions.push({
          date: `2024-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
          description: `Transaction ${transactions.length + 1}`,
          debit: isCredit ? 0 : amount,
          credit: isCredit ? amount : 0,
          balance: balance,
          category: categories[Math.floor(Math.random() * categories.length)] as TransactionCategory,
          currency: 'AED' as CurrencyCode
        });
      }
    });

    const totalCredits = transactions.reduce((sum, t) => sum + t.credit, 0);
    const totalDebits = transactions.reduce((sum, t) => sum + t.debit, 0);

    return {
      accountInfo: {
        accountName: 'Demo Company LLC',
        accountNumber: '1234567890',
        iban: 'AE123456789012345678901',
        bank: 'Demo Bank',
        period: 'January 2024 to June 2024',
        currency: 'AED' as CurrencyCode,
        currencies: ['AED'] as CurrencyCode[]
      },
      summary: {
        openingBalance: 150000,
        closingBalance: balance,
        netChange: balance - 150000,
        totalCredits,
        totalDebits,
        creditCount: transactions.filter(t => t.credit > 0).length,
        debitCount: transactions.filter(t => t.debit > 0).length,
        averageMonthlyBalance: (150000 + balance) / 2,
        currency: 'AED' as CurrencyCode
      },
      monthlyBalances: months.map((month, i) => ({
        month,
        average: 150000 + (i * 10000) + Math.random() * 20000,
        days: [31, 29, 31, 30, 31, 30][i],
        opening: 150000 + (i * 8000),
        closing: 150000 + ((i + 1) * 8000)
      })),
      dailyBalances: transactions.map(t => ({
        date: t.date,
        closingBalance: t.balance,
        month: new Date(t.date).toLocaleString('default', { month: 'long', year: 'numeric' }),
        hasTransactions: true
      })),
      transactions,
      categoryAnalysis: categories.map(cat => ({
        category: cat,
        count: Math.floor(Math.random() * 50) + 5,
        totalDebit: Math.floor(Math.random() * 100000),
        totalCredit: Math.floor(Math.random() * 100000)
      })),
      chequeAnalysis: {
        monthlyData: months.map(month => ({
          month,
          payments: Math.floor(Math.random() * 5),
          deposits: Math.floor(Math.random() * 3)
        })),
        returns: { inward: 0, outward: 0 }
      },
      monthWiseSummary: months.map((month, i) => ({
        month,
        opening: 150000 + (i * 8000),
        closing: 150000 + ((i + 1) * 8000),
        totalCredits: Math.floor(Math.random() * 200000) + 50000,
        totalDebits: Math.floor(Math.random() * 180000) + 40000,
        creditCount: Math.floor(Math.random() * 30) + 5,
        debitCount: Math.floor(Math.random() * 40) + 10,
        netChange: Math.floor(Math.random() * 40000) - 20000,
        average: 150000 + (i * 10000) + Math.random() * 20000
      }))
    };
  }
}
