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
    
    return {
      text: pages.join('\n'),
      pages
    };
  }

  static extractTransactions(pdfText: string): ExtractedTransaction[] {
    // Multiple regex patterns to handle different bank statement formats
    const patterns = [
      // Pattern 1: ADCB format - Date ValueDate Reference Description Debit Credit Balance
      /(\d{2}-\w{3}-\d{4})\s+(\d{2}-\w{3}-\d{4})\s+([A-Z0-9]+)\s+([^\d]+?)\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})/g,
      // Pattern 2: Simple format - Date Description Amount Balance
      /(\d{2}\/\d{2}\/\d{4})\s+([^\d]+?)\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})/g,
      // Pattern 3: ISO date format
      /(\d{4}-\d{2}-\d{2})\s+([^\d]+?)\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})/g,
    ];

    const transactions: ExtractedTransaction[] = [];
    
    // Try first pattern (ADCB format)
    let match;
    const pattern1 = patterns[0];
    while ((match = pattern1.exec(pdfText)) !== null) {
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

    // If no transactions found, try simpler patterns
    if (transactions.length === 0) {
      const pattern2 = patterns[1];
      while ((match = pattern2.exec(pdfText)) !== null) {
        const amount = parseFloat(match[3].replace(/,/g, ''));
        const isDebit = match[2].toLowerCase().includes('debit') || 
                       match[2].toLowerCase().includes('withdrawal') ||
                       match[2].toLowerCase().includes('payment');
        transactions.push({
          date: match[1],
          description: match[2].trim(),
          debit: isDebit ? amount : 0,
          credit: isDebit ? 0 : amount,
          balance: parseFloat(match[4].replace(/,/g, ''))
        });
      }
    }
    
    return transactions;
  }

  static extractAccountInfo(pdfText: string): ExtractedAccountInfo {
    const accountNumberMatch = pdfText.match(/Account\s*(?:No\.?|Number)\s*:?\s*([\d\s-]+)/i);
    const ibanMatch = pdfText.match(/IBAN\s*:?\s*(AE[\d]+)/i);
    const accountNameMatch = pdfText.match(/Account\s*Name\s*:?\s*([^\n]+)/i);
    const periodMatch = pdfText.match(/(?:Start\s*Date|From)\s*:?\s*(\d{2}[-\/]\w{3}[-\/]\d{4})\s+(?:End\s*Date|To)\s*:?\s*(\d{2}[-\/]\w{3}[-\/]\d{4})/i);
    
    return {
      accountNumber: accountNumberMatch?.[1]?.trim().replace(/\s+/g, ''),
      iban: ibanMatch?.[1],
      accountName: accountNameMatch?.[1]?.trim(),
      startDate: periodMatch?.[1],
      endDate: periodMatch?.[2]
    };
  }

  static extractBalances(pdfText: string): ExtractedBalances {
    const openingMatch = pdfText.match(/Opening\s*Balance\s*:?\s*([\d,]+\.\d{2})/i);
    const closingMatch = pdfText.match(/Closing\s*(?:Available\s*)?Balance\s*:?\s*([\d,]+\.\d{2})/i);
    const averageMatch = pdfText.match(/Average\s*Balance\s*:?\s*([\d,]+\.\d{2})/i);
    
    return {
      opening: parseFloat(openingMatch?.[1]?.replace(/,/g, '') || '0'),
      closing: parseFloat(closingMatch?.[1]?.replace(/,/g, '') || '0'),
      average: parseFloat(averageMatch?.[1]?.replace(/,/g, '') || '0')
    };
  }
}
