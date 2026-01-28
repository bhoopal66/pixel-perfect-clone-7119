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
    const transactions: ExtractedTransaction[] = [];
    let match;

    // Pattern 1: ADCB format - Date ValueDate Reference Description Debit Credit Balance
    const adcbPattern = /(\d{2}-\w{3}-\d{4})\s+(\d{2}-\w{3}-\d{4})\s+([A-Z0-9]+)\s+([^\d]+?)\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})/g;
    while ((match = adcbPattern.exec(pdfText)) !== null) {
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

    // Pattern 2: Emirates NBD format - DD/MM/YYYY Description Debit Credit Balance
    if (transactions.length === 0) {
      const enbdPattern = /(\d{2}\/\d{2}\/\d{4})\s+([A-Za-z0-9\s\-\/]+?)\s+([\d,]+\.\d{2})?\s*([\d,]+\.\d{2})?\s+([\d,]+\.\d{2})/g;
      while ((match = enbdPattern.exec(pdfText)) !== null) {
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
    }

    // Pattern 3: FAB (First Abu Dhabi Bank) format - DD-MMM-YY Reference Description Amount Balance
    if (transactions.length === 0) {
      const fabPattern = /(\d{2}-\w{3}-\d{2,4})\s+([A-Z0-9]{6,})\s+([^\d]+?)\s+([\d,]+\.\d{2})\s*(CR|DR)?\s+([\d,]+\.\d{2})/g;
      while ((match = fabPattern.exec(pdfText)) !== null) {
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
    }

    // Pattern 4: Mashreq format - DD/MM/YY ValueDate Reference Description Debit Credit Balance
    if (transactions.length === 0) {
      const mashreqPattern = /(\d{2}\/\d{2}\/\d{2,4})\s+(\d{2}\/\d{2}\/\d{2,4})?\s*([A-Z0-9]+)?\s+([^\d]+?)\s+([\d,]+\.\d{2})?\s*([\d,]+\.\d{2})?\s+([\d,]+\.\d{2})/g;
      while ((match = mashreqPattern.exec(pdfText)) !== null) {
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
    }

    // Pattern 5: Generic DD/MM/YYYY with single amount column
    if (transactions.length === 0) {
      const genericPattern = /(\d{2}\/\d{2}\/\d{4})\s+([^\d]+?)\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})/g;
      while ((match = genericPattern.exec(pdfText)) !== null) {
        const amount = parseFloat(match[3].replace(/,/g, ''));
        const desc = match[2].toLowerCase();
        const isDebit = desc.includes('debit') || desc.includes('withdrawal') || 
                       desc.includes('payment') || desc.includes('transfer out');
        transactions.push({
          date: match[1],
          description: match[2].trim(),
          debit: isDebit ? amount : 0,
          credit: isDebit ? 0 : amount,
          balance: parseFloat(match[4].replace(/,/g, ''))
        });
      }
    }

    // Pattern 6: ISO date format YYYY-MM-DD
    if (transactions.length === 0) {
      const isoPattern = /(\d{4}-\d{2}-\d{2})\s+([^\d]+?)\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})/g;
      while ((match = isoPattern.exec(pdfText)) !== null) {
        const amount = parseFloat(match[3].replace(/,/g, ''));
        const desc = match[2].toLowerCase();
        const isDebit = desc.includes('debit') || desc.includes('withdrawal') || desc.includes('payment');
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
