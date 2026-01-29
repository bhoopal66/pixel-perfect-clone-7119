import * as pdfjsLib from 'pdfjs-dist';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

export interface ParsedPDFData {
  text: string;
  pages: string[];
}

export interface ExtractedTransaction {
  date: string;
  valueDate?: string;
  reference?: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface ExtractedAccountInfo {
  accountNumber?: string;
  iban?: string;
  accountName?: string;
  startDate?: string;
  endDate?: string;
}

export interface ExtractedBalances {
  opening: number;
  closing: number;
  average: number;
}

// Common date patterns in bank statements
const DATE_PATTERNS = [
  /\d{2}-[A-Za-z]{3}-\d{4}/g,       // DD-MMM-YYYY (01-Jan-2024)
  /\d{2}\/\d{2}\/\d{4}/g,           // DD/MM/YYYY (01/01/2024)
  /\d{2}-[A-Za-z]{3}-\d{2}/g,       // DD-MMM-YY (01-Jan-24)
  /\d{2}\/\d{2}\/\d{2}/g,           // DD/MM/YY (01/01/24)
  /\d{4}-\d{2}-\d{2}/g,             // YYYY-MM-DD (2024-01-01)
  /\d{2}\.\d{2}\.\d{4}/g,           // DD.MM.YYYY (01.01.2024)
];

// Amount pattern: matches numbers with optional commas and decimals
const AMOUNT_PATTERN = /[\d,]+\.\d{2}/g;

export class PDFParser {
  static async parsePDF(file: File): Promise<ParsedPDFData> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    const pages: string[] = [];
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      pages.push(pageText);
    }
    
    const fullText = pages.join('\n');
    
    // Debug logging - helps identify text structure
    console.log('=== PDF Parser Debug ===');
    console.log('Total pages:', pages.length);
    console.log('Total text length:', fullText.length);
    console.log('First 2000 chars:', fullText.substring(0, 2000));
    console.log('Sample dates found:', fullText.match(DATE_PATTERNS[0])?.slice(0, 5) || 'none');
    console.log('Sample amounts found:', fullText.match(AMOUNT_PATTERN)?.slice(0, 10) || 'none');
    console.log('========================');
    
    return {
      text: fullText,
      pages
    };
  }

  // Bank pattern mapping for manual selection
  static readonly BANK_PATTERNS: Record<string, string> = {
    'ADCB': 'ADCB',
    'Emirates NBD': 'Emirates NBD',
    'FAB': 'FAB',
    'Mashreq': 'Mashreq',
    'CBD': 'CBD',
    'DIB': 'DIB',
    'RAKBANK': 'RAK Bank',
    'WIO': 'Generic Multi-Column', // WIO uses standard multi-column format
    'HSBC': 'HSBC',
    'Citibank': 'Citibank',
    'Standard Chartered': 'Standard Chartered',
    'Other': 'auto'
  };

  static extractTransactions(pdfText: string, bankHint?: string): ExtractedTransaction[] {
    let transactions: ExtractedTransaction[] = [];

    // Define all patterns
    const allPatterns = [
      { name: 'ADCB', fn: () => this.tryADCBPattern(pdfText) },
      { name: 'Emirates NBD', fn: () => this.tryEmiratesNBDPattern(pdfText) },
      { name: 'FAB', fn: () => this.tryFABPattern(pdfText) },
      { name: 'Mashreq', fn: () => this.tryMashreqPattern(pdfText) },
      { name: 'CBD', fn: () => this.tryCBDPattern(pdfText) },
      { name: 'DIB', fn: () => this.tryDIBPattern(pdfText) },
      { name: 'RAK Bank', fn: () => this.tryRAKBankPattern(pdfText) },
      { name: 'HSBC', fn: () => this.tryHSBCPattern(pdfText) },
      { name: 'Citibank', fn: () => this.tryCitibankPattern(pdfText) },
      { name: 'Standard Chartered', fn: () => this.tryStandardCharteredPattern(pdfText) },
      { name: 'Generic Multi-Column', fn: () => this.tryGenericMultiColumnPattern(pdfText) },
      { name: 'Generic Single Amount', fn: () => this.tryGenericSingleAmountPattern(pdfText) },
      { name: 'Line-by-Line', fn: () => this.tryLineByLinePattern(pdfText) },
    ];

    // If bank hint is provided and valid, try that pattern first
    if (bankHint && bankHint !== 'auto' && bankHint !== 'Other') {
      const mappedPattern = this.BANK_PATTERNS[bankHint] || bankHint;
      const priorityPattern = allPatterns.find(p => p.name === mappedPattern);
      if (priorityPattern) {
        console.log(`Trying priority pattern "${priorityPattern.name}" for bank hint "${bankHint}"`);
        transactions = priorityPattern.fn();
        if (transactions.length > 0) {
          console.log(`Priority pattern "${priorityPattern.name}" extracted ${transactions.length} transactions`);
          return transactions;
        }
        console.log(`Priority pattern "${priorityPattern.name}" found no transactions, trying all patterns...`);
      }
    }

    // Try each pattern and use the one with most results
    const patternResults = allPatterns.map(p => ({
      name: p.name,
      transactions: p.fn()
    }));

    for (const result of patternResults) {
      console.log(`Pattern "${result.name}" extracted ${result.transactions.length} transactions`);
      if (result.transactions.length > transactions.length) {
        transactions = result.transactions;
      }
    }

    console.log(`Best pattern extracted ${transactions.length} transactions`);
    return transactions;
  }

  // Pattern 1: ADCB format - Date ValueDate Reference Description Debit Credit Balance
  private static tryADCBPattern(pdfText: string): ExtractedTransaction[] {
    const transactions: ExtractedTransaction[] = [];
    const pattern = /(\d{2}-[A-Za-z]{3}-\d{4})\s+(\d{2}-[A-Za-z]{3}-\d{4})\s+([A-Z0-9]+)\s+([^\d]+?)\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})/g;
    let match;
    while ((match = pattern.exec(pdfText)) !== null) {
      transactions.push({
        date: match[1],
        valueDate: match[2],
        reference: match[3],
        description: match[4].trim(),
        debit: parseFloat(match[5].replace(/,/g, '')) || 0,
        credit: parseFloat(match[6].replace(/,/g, '')) || 0,
        balance: parseFloat(match[7].replace(/,/g, ''))
      });
    }
    return transactions;
  }

  // Pattern 2: Emirates NBD format - DD/MM/YYYY Description Debit Credit Balance
  private static tryEmiratesNBDPattern(pdfText: string): ExtractedTransaction[] {
    const transactions: ExtractedTransaction[] = [];
    const pattern = /(\d{2}\/\d{2}\/\d{4})\s+([A-Za-z0-9\s\-\/]+?)\s+([\d,]+\.\d{2})?\s*([\d,]+\.\d{2})?\s+([\d,]+\.\d{2})/g;
    let match;
    while ((match = pattern.exec(pdfText)) !== null) {
      const debit = match[3] ? parseFloat(match[3].replace(/,/g, '')) : 0;
      const credit = match[4] ? parseFloat(match[4].replace(/,/g, '')) : 0;
      if (debit > 0 || credit > 0) {
        transactions.push({
          date: match[1],
          description: match[2].trim(),
          debit,
          credit,
          balance: parseFloat(match[5].replace(/,/g, ''))
        });
      }
    }
    return transactions;
  }

  // Pattern 3: FAB format - DD-MMM-YY Reference Description Amount CR/DR Balance
  private static tryFABPattern(pdfText: string): ExtractedTransaction[] {
    const transactions: ExtractedTransaction[] = [];
    const pattern = /(\d{2}-[A-Za-z]{3}-\d{2,4})\s+([A-Z0-9]{6,})\s+([^\d]+?)\s+([\d,]+\.\d{2})\s*(CR|DR)?\s+([\d,]+\.\d{2})/g;
    let match;
    while ((match = pattern.exec(pdfText)) !== null) {
      const amount = parseFloat(match[4].replace(/,/g, ''));
      const isCredit = match[5] === 'CR' || match[3].toLowerCase().includes('credit');
      transactions.push({
        date: match[1],
        reference: match[2],
        description: match[3].trim(),
        debit: isCredit ? 0 : amount,
        credit: isCredit ? amount : 0,
        balance: parseFloat(match[6].replace(/,/g, ''))
      });
    }
    return transactions;
  }

  // Pattern 4: Mashreq format - DD/MM/YY ValueDate Reference Description Debit Credit Balance
  private static tryMashreqPattern(pdfText: string): ExtractedTransaction[] {
    const transactions: ExtractedTransaction[] = [];
    const pattern = /(\d{2}\/\d{2}\/\d{2,4})\s+(\d{2}\/\d{2}\/\d{2,4})?\s*([A-Z0-9]+)?\s+([^\d]+?)\s+([\d,]+\.\d{2})?\s*([\d,]+\.\d{2})?\s+([\d,]+\.\d{2})/g;
    let match;
    while ((match = pattern.exec(pdfText)) !== null) {
      const debit = match[5] ? parseFloat(match[5].replace(/,/g, '')) : 0;
      const credit = match[6] ? parseFloat(match[6].replace(/,/g, '')) : 0;
      if (debit > 0 || credit > 0) {
        transactions.push({
          date: match[1],
          valueDate: match[2],
          reference: match[3],
          description: match[4].trim(),
          debit,
          credit,
          balance: parseFloat(match[7].replace(/,/g, ''))
        });
      }
    }
    return transactions;
  }

  // Pattern 5: CBD (Commercial Bank of Dubai) - DD/MM/YYYY Reference Description Debit Credit Balance
  private static tryCBDPattern(pdfText: string): ExtractedTransaction[] {
    const transactions: ExtractedTransaction[] = [];
    // CBD format: Date | Reference | Description | Debit | Credit | Balance
    const pattern = /(\d{2}\/\d{2}\/\d{4})\s+([A-Z0-9]{8,})\s+([A-Za-z][^\d]{3,40}?)\s+([\d,]+\.\d{2})?\s*([\d,]+\.\d{2})?\s+([\d,]+\.\d{2})/g;
    let match;
    while ((match = pattern.exec(pdfText)) !== null) {
      const debit = match[4] ? parseFloat(match[4].replace(/,/g, '')) : 0;
      const credit = match[5] ? parseFloat(match[5].replace(/,/g, '')) : 0;
      if (debit > 0 || credit > 0) {
        transactions.push({
          date: match[1],
          reference: match[2],
          description: match[3].trim(),
          debit,
          credit,
          balance: parseFloat(match[6].replace(/,/g, ''))
        });
      }
    }
    
    // Alternative CBD pattern: DD-MMM-YYYY format
    if (transactions.length === 0) {
      const altPattern = /(\d{2}-[A-Za-z]{3}-\d{4})\s+([^\d]{5,50}?)\s+([\d,]+\.\d{2})\s*([\d,]+\.\d{2})?\s*([\d,]+\.\d{2})?/g;
      while ((match = altPattern.exec(pdfText)) !== null) {
        const amounts = [match[3], match[4], match[5]].filter(Boolean).map(a => parseFloat(a!.replace(/,/g, '')));
        if (amounts.length >= 2) {
          const desc = match[2].toLowerCase();
          const isCredit = desc.includes('credit') || desc.includes('deposit') || desc.includes('salary');
          transactions.push({
            date: match[1],
            description: match[2].trim(),
            debit: isCredit ? 0 : amounts[0],
            credit: isCredit ? amounts[0] : 0,
            balance: amounts[amounts.length - 1]
          });
        }
      }
    }
    return transactions;
  }

  // Pattern 6: DIB (Dubai Islamic Bank) - uses Islamic banking terminology
  private static tryDIBPattern(pdfText: string): ExtractedTransaction[] {
    const transactions: ExtractedTransaction[] = [];
    // DIB format: Date | Value Date | Reference | Description | Debit | Credit | Balance
    const pattern = /(\d{2}\/\d{2}\/\d{4})\s+(\d{2}\/\d{2}\/\d{4})?\s*([A-Z0-9]{6,})?\s+([A-Za-z][^\d]{3,50}?)\s+([\d,]+\.\d{2})?\s*([\d,]+\.\d{2})?\s+([\d,]+\.\d{2})/g;
    let match;
    while ((match = pattern.exec(pdfText)) !== null) {
      const debit = match[5] ? parseFloat(match[5].replace(/,/g, '')) : 0;
      const credit = match[6] ? parseFloat(match[6].replace(/,/g, '')) : 0;
      if (debit > 0 || credit > 0) {
        transactions.push({
          date: match[1],
          valueDate: match[2],
          reference: match[3],
          description: match[4].trim(),
          debit,
          credit,
          balance: parseFloat(match[7].replace(/,/g, ''))
        });
      }
    }
    
    // Alternative DIB pattern with different date format
    if (transactions.length === 0) {
      const altPattern = /(\d{2}-[A-Za-z]{3}-\d{2,4})\s+([A-Za-z][^\d]{3,60}?)\s+([\d,]+\.\d{2})\s*(CR|DR)?\s*([\d,]+\.\d{2})?/g;
      while ((match = altPattern.exec(pdfText)) !== null) {
        const amount = parseFloat(match[3].replace(/,/g, ''));
        const indicator = match[4]?.toUpperCase() || '';
        const balance = match[5] ? parseFloat(match[5].replace(/,/g, '')) : 0;
        const desc = match[2].toLowerCase();
        // Islamic banking terms: Murabaha (financing), Wakala (agency), Ijarah (lease)
        const isCredit = indicator === 'CR' || 
                         desc.includes('credit') || desc.includes('deposit') || 
                         desc.includes('salary') || desc.includes('profit') ||
                         desc.includes('wakala') || desc.includes('received');
        transactions.push({
          date: match[1],
          description: match[2].trim(),
          debit: isCredit ? 0 : amount,
          credit: isCredit ? amount : 0,
          balance
        });
      }
    }
    return transactions;
  }

  // Pattern 7: RAK Bank (National Bank of Ras Al Khaimah)
  private static tryRAKBankPattern(pdfText: string): ExtractedTransaction[] {
    const transactions: ExtractedTransaction[] = [];
    // RAK Bank format: Date | Particulars/Description | Cheque No | Debit | Credit | Balance
    const pattern = /(\d{2}-[A-Za-z]{3}-\d{4})\s+([A-Za-z][^\d]{3,50}?)\s*(\d{6})?\s+([\d,]+\.\d{2})?\s*([\d,]+\.\d{2})?\s+([\d,]+\.\d{2})/g;
    let match;
    while ((match = pattern.exec(pdfText)) !== null) {
      const debit = match[4] ? parseFloat(match[4].replace(/,/g, '')) : 0;
      const credit = match[5] ? parseFloat(match[5].replace(/,/g, '')) : 0;
      if (debit > 0 || credit > 0) {
        transactions.push({
          date: match[1],
          description: match[2].trim(),
          reference: match[3],
          debit,
          credit,
          balance: parseFloat(match[6].replace(/,/g, ''))
        });
      }
    }
    
    // Alternative RAK Bank pattern: DD/MM/YYYY format
    if (transactions.length === 0) {
      const altPattern = /(\d{2}\/\d{2}\/\d{4})\s+([A-Za-z][A-Za-z0-9\s\-\/\*#]+?)\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})(?:\s+([\d,]+\.\d{2}))?/g;
      while ((match = altPattern.exec(pdfText)) !== null) {
        const amount1 = parseFloat(match[3].replace(/,/g, ''));
        const amount2 = parseFloat(match[4].replace(/,/g, ''));
        const amount3 = match[5] ? parseFloat(match[5].replace(/,/g, '')) : null;
        
        if (amount3 !== null) {
          // Three amounts: Debit, Credit, Balance
          transactions.push({
            date: match[1],
            description: match[2].trim(),
            debit: amount1,
            credit: amount2,
            balance: amount3
          });
        } else {
          // Two amounts: Transaction and Balance
          const desc = match[2].toLowerCase();
          const isDebit = desc.includes('payment') || desc.includes('withdrawal') || 
                          desc.includes('purchase') || desc.includes('debit') ||
                          desc.includes('transfer to') || desc.includes('atm');
          const txnAmount = Math.min(amount1, amount2);
          const balance = Math.max(amount1, amount2);
          transactions.push({
            date: match[1],
            description: match[2].trim(),
            debit: isDebit ? txnAmount : 0,
            credit: isDebit ? 0 : txnAmount,
            balance
          });
        }
      }
    }
    
    // Third pattern: Single amount with DR/CR indicator
    if (transactions.length === 0) {
      const thirdPattern = /(\d{2}[-\/]\d{2}[-\/]\d{2,4})\s+([A-Za-z][^\d]{3,50}?)\s+([\d,]+\.\d{2})\s*(DR|CR)?\s*([\d,]+\.\d{2})?/g;
      while ((match = thirdPattern.exec(pdfText)) !== null) {
        const amount = parseFloat(match[3].replace(/,/g, ''));
        const indicator = match[4]?.toUpperCase() || '';
        const balance = match[5] ? parseFloat(match[5].replace(/,/g, '')) : 0;
        const desc = match[2].toLowerCase();
        const isCredit = indicator === 'CR' || 
                         desc.includes('credit') || desc.includes('deposit');
        transactions.push({
          date: match[1],
          description: match[2].trim(),
          debit: isCredit ? 0 : amount,
          credit: isCredit ? amount : 0,
          balance
        });
      }
    }
    return transactions;
  }

  // Pattern 8: HSBC - typically uses DD MMM YYYY format with detailed descriptions
  private static tryHSBCPattern(pdfText: string): ExtractedTransaction[] {
    const transactions: ExtractedTransaction[] = [];
    let match;
    
    // HSBC format: DD MMM YYYY | Description | Paid out | Paid in | Balance
    const pattern = /(\d{2}\s+[A-Za-z]{3}\s+\d{4})\s+([A-Za-z][^\d]{5,60}?)\s+([\d,]+\.\d{2})?\s*([\d,]+\.\d{2})?\s+([\d,]+\.\d{2})/g;
    while ((match = pattern.exec(pdfText)) !== null) {
      const debit = match[3] ? parseFloat(match[3].replace(/,/g, '')) : 0;
      const credit = match[4] ? parseFloat(match[4].replace(/,/g, '')) : 0;
      if (debit > 0 || credit > 0) {
        transactions.push({
          date: match[1].replace(/\s+/g, '-'),
          description: match[2].trim(),
          debit,
          credit,
          balance: parseFloat(match[5].replace(/,/g, ''))
        });
      }
    }
    
    // Alternative HSBC pattern: DD-MMM-YY format
    if (transactions.length === 0) {
      const altPattern = /(\d{2}-[A-Za-z]{3}-\d{2,4})\s+([A-Za-z][^\d]{5,50}?)\s+([\d,]+\.\d{2})\s*([\d,]+\.\d{2})?/g;
      while ((match = altPattern.exec(pdfText)) !== null) {
        const amount1 = parseFloat(match[3].replace(/,/g, ''));
        const amount2 = match[4] ? parseFloat(match[4].replace(/,/g, '')) : null;
        const desc = match[2].toLowerCase();
        const isDebit = desc.includes('payment') || desc.includes('withdrawal') || 
                        desc.includes('purchase') || desc.includes('bill') ||
                        desc.includes('transfer to') || desc.includes('debit');
        
        if (amount2 !== null) {
          transactions.push({
            date: match[1],
            description: match[2].trim(),
            debit: isDebit ? amount1 : 0,
            credit: isDebit ? 0 : amount1,
            balance: amount2
          });
        }
      }
    }
    return transactions;
  }

  // Pattern 9: Citibank - uses various date formats with transaction details
  private static tryCitibankPattern(pdfText: string): ExtractedTransaction[] {
    const transactions: ExtractedTransaction[] = [];
    let match;
    
    // Citibank format: Date | Post Date | Description | Amount | Balance
    const pattern = /(\d{2}\/\d{2}\/\d{2,4})\s+(\d{2}\/\d{2}\/\d{2,4})?\s*([A-Za-z][^\d]{5,55}?)\s+([\d,]+\.\d{2})\s*(CR|DR)?\s*([\d,]+\.\d{2})?/g;
    while ((match = pattern.exec(pdfText)) !== null) {
      const amount = parseFloat(match[4].replace(/,/g, ''));
      const indicator = match[5]?.toUpperCase() || '';
      const balance = match[6] ? parseFloat(match[6].replace(/,/g, '')) : 0;
      const desc = match[3].toLowerCase();
      const isCredit = indicator === 'CR' || 
                       desc.includes('credit') || desc.includes('deposit') || 
                       desc.includes('salary') || desc.includes('received') ||
                       desc.includes('refund') || desc.includes('cashback');
      
      transactions.push({
        date: match[1],
        valueDate: match[2],
        description: match[3].trim(),
        debit: isCredit ? 0 : amount,
        credit: isCredit ? amount : 0,
        balance
      });
    }
    
    // Alternative Citibank pattern: DD MMM format
    if (transactions.length === 0) {
      const altPattern = /(\d{2}\s+[A-Za-z]{3})\s+([A-Za-z][^\d]{5,50}?)\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})?/g;
      while ((match = altPattern.exec(pdfText)) !== null) {
        const amount = parseFloat(match[3].replace(/,/g, ''));
        const balance = match[4] ? parseFloat(match[4].replace(/,/g, '')) : 0;
        const desc = match[2].toLowerCase();
        const isDebit = desc.includes('payment') || desc.includes('purchase') || 
                        desc.includes('withdrawal') || desc.includes('fee');
        transactions.push({
          date: match[1],
          description: match[2].trim(),
          debit: isDebit ? amount : 0,
          credit: isDebit ? 0 : amount,
          balance
        });
      }
    }
    return transactions;
  }

  // Pattern 10: Standard Chartered - typically uses DD-MMM-YYYY with comprehensive details
  private static tryStandardCharteredPattern(pdfText: string): ExtractedTransaction[] {
    const transactions: ExtractedTransaction[] = [];
    let match;
    
    // Standard Chartered format: Date | Value Date | Reference | Description | Withdrawals | Deposits | Balance
    const pattern = /(\d{2}-[A-Za-z]{3}-\d{4})\s+(\d{2}-[A-Za-z]{3}-\d{4})?\s*([A-Z0-9]{6,})?\s*([A-Za-z][^\d]{5,50}?)\s+([\d,]+\.\d{2})?\s*([\d,]+\.\d{2})?\s+([\d,]+\.\d{2})/g;
    while ((match = pattern.exec(pdfText)) !== null) {
      const debit = match[5] ? parseFloat(match[5].replace(/,/g, '')) : 0;
      const credit = match[6] ? parseFloat(match[6].replace(/,/g, '')) : 0;
      if (debit > 0 || credit > 0) {
        transactions.push({
          date: match[1],
          valueDate: match[2],
          reference: match[3],
          description: match[4].trim(),
          debit,
          credit,
          balance: parseFloat(match[7].replace(/,/g, ''))
        });
      }
    }
    
    // Alternative SC pattern: simpler format
    if (transactions.length === 0) {
      const altPattern = /(\d{2}\/\d{2}\/\d{4})\s+([A-Za-z][^\d]{5,55}?)\s+([\d,]+\.\d{2})\s*([\d,]+\.\d{2})?/g;
      while ((match = altPattern.exec(pdfText)) !== null) {
        const amount1 = parseFloat(match[3].replace(/,/g, ''));
        const amount2 = match[4] ? parseFloat(match[4].replace(/,/g, '')) : null;
        const desc = match[2].toLowerCase();
        const isDebit = desc.includes('withdrawal') || desc.includes('payment') || 
                        desc.includes('transfer to') || desc.includes('purchase') ||
                        desc.includes('debit') || desc.includes('fee');
        
        if (amount2 !== null) {
          transactions.push({
            date: match[1],
            description: match[2].trim(),
            debit: isDebit ? amount1 : 0,
            credit: isDebit ? 0 : amount1,
            balance: amount2
          });
        } else {
          transactions.push({
            date: match[1],
            description: match[2].trim(),
            debit: isDebit ? amount1 : 0,
            credit: isDebit ? 0 : amount1,
            balance: 0
          });
        }
      }
    }
    
    // Third SC pattern: DD MMM YYYY with spaces
    if (transactions.length === 0) {
      const thirdPattern = /(\d{2}\s+[A-Za-z]{3}\s+\d{4})\s+([A-Za-z][^\d]{5,50}?)\s+([\d,]+\.\d{2})\s*(DR|CR)?\s*([\d,]+\.\d{2})?/g;
      while ((match = thirdPattern.exec(pdfText)) !== null) {
        const amount = parseFloat(match[3].replace(/,/g, ''));
        const indicator = match[4]?.toUpperCase() || '';
        const balance = match[5] ? parseFloat(match[5].replace(/,/g, '')) : 0;
        const desc = match[2].toLowerCase();
        const isCredit = indicator === 'CR' || 
                         desc.includes('credit') || desc.includes('deposit');
        transactions.push({
          date: match[1].replace(/\s+/g, '-'),
          description: match[2].trim(),
          debit: isCredit ? 0 : amount,
          credit: isCredit ? amount : 0,
          balance
        });
      }
    }
    return transactions;
  }

  // Pattern 11: Generic Multi-Column - Date Description Amount Amount Balance
  private static tryGenericMultiColumnPattern(pdfText: string): ExtractedTransaction[] {
    const transactions: ExtractedTransaction[] = [];
    // Flexible date + description + 2-3 amounts pattern
    const pattern = /(\d{1,2}[-\/\.]\w{2,3}[-\/\.]\d{2,4})\s+([A-Za-z][A-Za-z0-9\s\-\/\.\*#@]+?)\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})(?:\s+([\d,]+\.\d{2}))?/g;
    let match;
    while ((match = pattern.exec(pdfText)) !== null) {
      const amount1 = parseFloat(match[3].replace(/,/g, ''));
      const amount2 = parseFloat(match[4].replace(/,/g, ''));
      const amount3 = match[5] ? parseFloat(match[5].replace(/,/g, '')) : null;
      
      // If 3 amounts: assume Debit, Credit, Balance
      // If 2 amounts: try to determine which is transaction and which is balance
      if (amount3 !== null) {
        transactions.push({
          date: match[1],
          description: match[2].trim(),
          debit: amount1,
          credit: amount2,
          balance: amount3
        });
      } else {
        // Assume larger amount is balance, smaller is transaction
        const balance = Math.max(amount1, amount2);
        const txnAmount = Math.min(amount1, amount2);
        const desc = match[2].toLowerCase();
        const isDebit = desc.includes('debit') || desc.includes('payment') || 
                        desc.includes('withdrawal') || desc.includes('transfer to') ||
                        desc.includes('purchase') || desc.includes('atm');
        transactions.push({
          date: match[1],
          description: match[2].trim(),
          debit: isDebit ? txnAmount : 0,
          credit: isDebit ? 0 : txnAmount,
          balance: balance
        });
      }
    }
    return transactions;
  }

  // Pattern 6: Generic Single Amount with CR/DR indicator
  private static tryGenericSingleAmountPattern(pdfText: string): ExtractedTransaction[] {
    const transactions: ExtractedTransaction[] = [];
    // Date + Description + Amount + optional CR/DR + Balance
    const pattern = /(\d{1,2}[-\/\.]\w{2,3}[-\/\.]\d{2,4})\s+([A-Za-z][^\d]{5,50})\s+([\d,]+\.\d{2})\s*(CR|DR|Cr|Dr|C|D)?\s*([\d,]+\.\d{2})?/g;
    let match;
    while ((match = pattern.exec(pdfText)) !== null) {
      const amount = parseFloat(match[3].replace(/,/g, ''));
      const indicator = match[4]?.toUpperCase() || '';
      const balance = match[5] ? parseFloat(match[5].replace(/,/g, '')) : 0;
      const desc = match[2].toLowerCase();
      
      // Determine if credit based on indicator or description keywords
      const isCredit = indicator === 'CR' || indicator === 'C' ||
                       desc.includes('credit') || desc.includes('deposit') || 
                       desc.includes('salary') || desc.includes('received') ||
                       desc.includes('transfer from') || desc.includes('inward');
      
      if (amount > 0) {
        transactions.push({
          date: match[1],
          description: match[2].trim(),
          debit: isCredit ? 0 : amount,
          credit: isCredit ? amount : 0,
          balance: balance
        });
      }
    }
    return transactions;
  }

  // Pattern 7: Line-by-line parsing - most flexible fallback
  private static tryLineByLinePattern(pdfText: string): ExtractedTransaction[] {
    const transactions: ExtractedTransaction[] = [];
    
    // Split by common line separators
    const lines = pdfText.split(/(?=\d{1,2}[-\/\.]\w{2,3}[-\/\.]\d{2,4})/);
    
    for (const line of lines) {
      // Find date at start of line
      const dateMatch = line.match(/^(\d{1,2}[-\/\.]\w{2,3}[-\/\.]\d{2,4})/);
      if (!dateMatch) continue;
      
      // Find all amounts in the line
      const amounts = line.match(/[\d,]+\.\d{2}/g)?.map(a => parseFloat(a.replace(/,/g, ''))) || [];
      if (amounts.length < 1) continue;
      
      // Extract description (text between date and first amount)
      const dateEnd = line.indexOf(dateMatch[1]) + dateMatch[1].length;
      const firstAmountMatch = line.match(/[\d,]+\.\d{2}/);
      const descEnd = firstAmountMatch ? line.indexOf(firstAmountMatch[0]) : line.length;
      let description = line.substring(dateEnd, descEnd).trim();
      
      // Clean up description
      description = description.replace(/^\s*[-:]\s*/, '').trim();
      if (description.length < 3) continue;
      
      // Determine credit/debit from description
      const descLower = description.toLowerCase();
      const isCredit = descLower.includes('credit') || descLower.includes('deposit') || 
                       descLower.includes('salary') || descLower.includes('received') ||
                       descLower.includes('transfer in') || descLower.includes('inward') ||
                       descLower.includes('refund') || descLower.includes('reversal');
      
      const amount = amounts[0];
      const balance = amounts.length > 1 ? amounts[amounts.length - 1] : 0;
      
      transactions.push({
        date: dateMatch[1],
        description: description.substring(0, 100), // Limit description length
        debit: isCredit ? 0 : amount,
        credit: isCredit ? amount : 0,
        balance: balance
      });
    }
    
    return transactions;
  }

  static extractAccountInfo(pdfText: string): ExtractedAccountInfo {
    // Multiple patterns for account number
    const accountNumberPatterns = [
      /Account\s*(?:No\.?|Number|#)\s*:?\s*([\d\s-]+)/i,
      /A\/C\s*(?:No\.?)?\s*:?\s*([\d\s-]+)/i,
      /(?:Current|Savings)\s+Account\s*:?\s*([\d-]+)/i,
    ];
    
    // Multiple patterns for IBAN
    const ibanPatterns = [
      /IBAN\s*:?\s*([A-Z]{2}[\dA-Z]+)/i,
      /([A-Z]{2}\d{2}[A-Z0-9]{4,30})/,
    ];
    
    // Multiple patterns for account name
    const accountNamePatterns = [
      /Account\s*(?:Holder\s*)?Name\s*:?\s*([^\n]+)/i,
      /Customer\s*Name\s*:?\s*([^\n]+)/i,
      /Name\s*:?\s*([A-Z][A-Za-z\s]+)/,
    ];
    
    // Multiple patterns for period dates
    const periodPatterns = [
      /(?:Statement\s+)?Period\s*:?\s*(\d{1,2}[-\/\.]\w{2,3}[-\/\.]\d{2,4})\s*(?:to|-)\s*(\d{1,2}[-\/\.]\w{2,3}[-\/\.]\d{2,4})/i,
      /(?:From|Start)\s*(?:Date)?\s*:?\s*(\d{1,2}[-\/\.]\w{2,3}[-\/\.]\d{2,4}).*?(?:To|End)\s*(?:Date)?\s*:?\s*(\d{1,2}[-\/\.]\w{2,3}[-\/\.]\d{2,4})/is,
      /(\d{1,2}[-\/\.]\w{2,3}[-\/\.]\d{2,4})\s*(?:to|-)\s*(\d{1,2}[-\/\.]\w{2,3}[-\/\.]\d{2,4})/i,
    ];
    
    let accountNumber: string | undefined;
    let iban: string | undefined;
    let accountName: string | undefined;
    let startDate: string | undefined;
    let endDate: string | undefined;
    
    // Try each pattern until we find a match
    for (const pattern of accountNumberPatterns) {
      const match = pdfText.match(pattern);
      if (match) {
        accountNumber = match[1].trim().replace(/\s+/g, '');
        break;
      }
    }
    
    for (const pattern of ibanPatterns) {
      const match = pdfText.match(pattern);
      if (match && match[1].length >= 15) {
        iban = match[1];
        break;
      }
    }
    
    for (const pattern of accountNamePatterns) {
      const match = pdfText.match(pattern);
      if (match) {
        accountName = match[1].trim();
        break;
      }
    }
    
    for (const pattern of periodPatterns) {
      const match = pdfText.match(pattern);
      if (match) {
        startDate = match[1];
        endDate = match[2];
        break;
      }
    }
    
    console.log('Extracted account info:', { accountNumber, iban, accountName, startDate, endDate });
    
    return {
      accountNumber,
      iban,
      accountName,
      startDate,
      endDate
    };
  }

  static extractBalances(pdfText: string): ExtractedBalances {
    // Multiple patterns for opening balance
    const openingPatterns = [
      /Opening\s*(?:Available\s*)?Balance\s*:?\s*([\d,]+\.\d{2})/i,
      /(?:Balance\s+)?(?:B\/F|Brought\s+Forward)\s*:?\s*([\d,]+\.\d{2})/i,
      /Previous\s*Balance\s*:?\s*([\d,]+\.\d{2})/i,
    ];
    
    // Multiple patterns for closing balance
    const closingPatterns = [
      /Closing\s*(?:Available\s*)?Balance\s*:?\s*([\d,]+\.\d{2})/i,
      /(?:Balance\s+)?(?:C\/F|Carried\s+Forward)\s*:?\s*([\d,]+\.\d{2})/i,
      /(?:Final|End(?:ing)?)\s*Balance\s*:?\s*([\d,]+\.\d{2})/i,
      /(?:Current|Available)\s*Balance\s*:?\s*([\d,]+\.\d{2})/i,
    ];
    
    // Pattern for average balance
    const averagePatterns = [
      /Average\s*(?:Monthly\s*)?Balance\s*:?\s*([\d,]+\.\d{2})/i,
      /(?:Monthly\s*)?Average\s*:?\s*([\d,]+\.\d{2})/i,
    ];
    
    let opening = 0;
    let closing = 0;
    let average = 0;
    
    for (const pattern of openingPatterns) {
      const match = pdfText.match(pattern);
      if (match) {
        opening = parseFloat(match[1].replace(/,/g, ''));
        break;
      }
    }
    
    for (const pattern of closingPatterns) {
      const match = pdfText.match(pattern);
      if (match) {
        closing = parseFloat(match[1].replace(/,/g, ''));
        break;
      }
    }
    
    for (const pattern of averagePatterns) {
      const match = pdfText.match(pattern);
      if (match) {
        average = parseFloat(match[1].replace(/,/g, ''));
        break;
      }
    }
    
    console.log('Extracted balances:', { opening, closing, average });
    
    return { opening, closing, average };
  }
}
