import { useState, useCallback } from 'react';
import { PDFParser, ExtractedTransaction, ExtractedAccountInfo, ExtractedBalances } from '@/services/pdfParser';
import { toast } from 'sonner';

export interface ParsedStatementData {
  transactions: ExtractedTransaction[];
  accountInfo: ExtractedAccountInfo;
  balances: ExtractedBalances;
  totalCredits: number;
  totalDebits: number;
  netTurnover: number;
  periodFrom?: string;
  periodTo?: string;
}

export interface UsePdfParsingResult {
  isParsing: boolean;
  parsedData: ParsedStatementData | null;
  parseError: string | null;
  parseFile: (file: File, bankHint?: string) => Promise<ParsedStatementData | null>;
  clearParsedData: () => void;
}

// Available banks for manual selection
export const SUPPORTED_BANKS = [
  { value: 'auto', label: 'Auto-detect' },
  // Major UAE Local Banks
  { value: 'ADCB', label: 'ADCB' },
  { value: 'ADIB', label: 'Abu Dhabi Islamic Bank (ADIB)' },
  { value: 'Emirates NBD', label: 'Emirates NBD' },
  { value: 'ENBD Business', label: 'Emirates NBD Business' },
  { value: 'Emirates Islamic', label: 'Emirates Islamic' },
  { value: 'FAB', label: 'First Abu Dhabi Bank (FAB)' },
  { value: 'Mashreq', label: 'Mashreq' },
  { value: 'CBD', label: 'Commercial Bank of Dubai (CBD)' },
  { value: 'DIB', label: 'Dubai Islamic Bank (DIB)' },
  { value: 'RAKBANK', label: 'RAK Bank' },
  { value: 'NBF', label: 'National Bank of Fujairah (NBF)' },
  { value: 'Sharjah Islamic', label: 'Sharjah Islamic Bank (SIB)' },
  { value: 'UAB', label: 'United Arab Bank (UAB)' },
  { value: 'Al Hilal', label: 'Al Hilal Bank' },
  { value: 'Ajman Bank', label: 'Ajman Bank' },
  { value: 'CBI', label: 'Commercial Bank International (CBI)' },
  { value: 'Al Masraf', label: 'Al Masraf' },
  { value: 'Bank of Sharjah', label: 'Bank of Sharjah' },
  { value: 'Invest Bank', label: 'Invest Bank' },
  { value: 'NBQ', label: 'National Bank of Umm Al Quwain (NBQ)' },
  // Digital & Neo Banks
  { value: 'WIO', label: 'WIO Bank' },
  { value: 'Liv', label: 'Liv (by ENBD)' },
  { value: 'Mashreq Neo', label: 'Mashreq Neo' },
  { value: 'YAP', label: 'YAP' },
  // International Banks in UAE
  { value: 'Arab Bank', label: 'Arab Bank' },
  { value: 'HSBC', label: 'HSBC' },
  { value: 'Citibank', label: 'Citibank' },
  { value: 'Standard Chartered', label: 'Standard Chartered' },
  { value: 'Habib Bank', label: 'Habib Bank AG Zurich' },
  { value: 'NBK', label: 'National Bank of Kuwait' },
  { value: 'Other', label: 'Other' },
] as const;

export function usePdfParsing(): UsePdfParsingResult {
  const [isParsing, setIsParsing] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedStatementData | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  const parseFile = useCallback(async (file: File, bankHint?: string): Promise<ParsedStatementData | null> => {
    setIsParsing(true);
    setParseError(null);

    try {
      // Parse the PDF
      const pdfData = await PDFParser.parsePDF(file);
      
      // Extract data from the parsed text (pass bank hint if provided)
      const transactions = PDFParser.extractTransactions(pdfData.text, bankHint);
      const accountInfo = PDFParser.extractAccountInfo(pdfData.text);
      const balances = PDFParser.extractBalances(pdfData.text);

      // Calculate totals from transactions
      const totalCredits = transactions.reduce((sum, t) => sum + t.credit, 0);
      const totalDebits = transactions.reduce((sum, t) => sum + t.debit, 0);
      const netTurnover = totalCredits; // Credits represent incoming turnover

      // Parse period dates from account info
      let periodFrom: string | undefined;
      let periodTo: string | undefined;

      if (accountInfo.startDate) {
        periodFrom = parseStatementDate(accountInfo.startDate);
      }
      if (accountInfo.endDate) {
        periodTo = parseStatementDate(accountInfo.endDate);
      }

      // If no dates from account info, try to infer from transactions
      if (!periodFrom && transactions.length > 0) {
        const dates = transactions
          .map(t => parseStatementDate(t.date))
          .filter(Boolean)
          .sort();
        if (dates.length > 0) {
          periodFrom = dates[0];
          periodTo = dates[dates.length - 1];
        }
      }

      const result: ParsedStatementData = {
        transactions,
        accountInfo,
        balances,
        totalCredits,
        totalDebits,
        netTurnover,
        periodFrom,
        periodTo,
      };

      setParsedData(result);

      if (transactions.length === 0) {
        toast.warning('No transactions could be extracted from this PDF. The format may not be supported.');
      } else {
        toast.success(`Extracted ${transactions.length} transactions from the statement`);
      }

      return result;
    } catch (error) {
      console.error('PDF parsing error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to parse PDF';
      setParseError(errorMessage);
      toast.error('Failed to parse the PDF file');
      return null;
    } finally {
      setIsParsing(false);
    }
  }, []);

  const clearParsedData = useCallback(() => {
    setParsedData(null);
    setParseError(null);
  }, []);

  return {
    isParsing,
    parsedData,
    parseError,
    parseFile,
    clearParsedData,
  };
}

/**
 * Parse various date formats from bank statements into ISO format (YYYY-MM-DD)
 */
function parseStatementDate(dateStr: string): string | undefined {
  if (!dateStr) return undefined;

  // Common formats:
  // DD-MMM-YYYY (e.g., 01-Jan-2024)
  // DD/MM/YYYY (e.g., 01/01/2024)
  // DD-MMM-YY (e.g., 01-Jan-24)
  // DD/MM/YY (e.g., 01/01/24)
  // YYYY-MM-DD (already ISO)

  const monthMap: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
  };

  try {
    // Already ISO format
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }

    // DD-MMM-YYYY or DD-MMM-YY
    const dmmyMatch = dateStr.match(/^(\d{2})-(\w{3})-(\d{2,4})$/i);
    if (dmmyMatch) {
      const day = dmmyMatch[1];
      const month = monthMap[dmmyMatch[2].toLowerCase()];
      let year = dmmyMatch[3];
      if (year.length === 2) {
        year = parseInt(year) > 50 ? `19${year}` : `20${year}`;
      }
      if (month) {
        return `${year}-${month}-${day}`;
      }
    }

    // DD/MM/YYYY or DD/MM/YY
    const slashMatch = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{2,4})$/);
    if (slashMatch) {
      const day = slashMatch[1];
      const month = slashMatch[2];
      let year = slashMatch[3];
      if (year.length === 2) {
        year = parseInt(year) > 50 ? `19${year}` : `20${year}`;
      }
      return `${year}-${month}-${day}`;
    }

    return undefined;
  } catch {
    return undefined;
  }
}
