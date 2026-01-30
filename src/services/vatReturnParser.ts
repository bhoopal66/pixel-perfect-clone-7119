import * as XLSX from 'exceljs';
import * as pdfjsLib from 'pdfjs-dist';
import type { VATReturn } from '../types/turnover.types';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface ParsedVATData {
  period?: string;
  startDate?: string;
  endDate?: string;
  taxableSales?: number;
  zeroRatedSales?: number;
  exemptSales?: number;
  outputVAT?: number;
  inputVAT?: number;
  confidence: 'high' | 'medium' | 'low';
  rawText?: string;
  detectedFields: string[];
}

export interface VATParserResult {
  success: boolean;
  data?: ParsedVATData;
  error?: string;
  fileName: string;
  fileType: 'pdf' | 'excel';
}

// Common VAT return field patterns (UAE FTA format)
const PATTERNS = {
  // Taxable supplies at standard rate (5%)
  taxableSales: [
    /taxable\s*(?:supplies|sales)\s*(?:at\s*(?:standard|5%)\s*rate)?[:\s]*(?:AED\s*)?([\d,]+(?:\.\d{2})?)/i,
    /standard\s*rated\s*(?:supplies|sales)[:\s]*(?:AED\s*)?([\d,]+(?:\.\d{2})?)/i,
    /box\s*1[a-z\s:-]*([\d,]+(?:\.\d{2})?)/i,
    /1a?\.\s*standard\s*rated[:\s]*([\d,]+(?:\.\d{2})?)/i,
    /total\s*taxable\s*(?:supplies|sales)[:\s]*(?:AED\s*)?([\d,]+(?:\.\d{2})?)/i,
  ],
  // Zero-rated supplies
  zeroRatedSales: [
    /zero[- ]?rated\s*(?:supplies|sales)[:\s]*(?:AED\s*)?([\d,]+(?:\.\d{2})?)/i,
    /box\s*2[a-z\s:-]*([\d,]+(?:\.\d{2})?)/i,
    /2a?\.\s*zero[- ]?rated[:\s]*([\d,]+(?:\.\d{2})?)/i,
    /exports[:\s]*(?:AED\s*)?([\d,]+(?:\.\d{2})?)/i,
  ],
  // Exempt supplies
  exemptSales: [
    /exempt\s*(?:supplies|sales)[:\s]*(?:AED\s*)?([\d,]+(?:\.\d{2})?)/i,
    /box\s*3[a-z\s:-]*([\d,]+(?:\.\d{2})?)/i,
    /3a?\.\s*exempt[:\s]*([\d,]+(?:\.\d{2})?)/i,
  ],
  // Output VAT
  outputVAT: [
    /output\s*(?:vat|tax)[:\s]*(?:AED\s*)?([\d,]+(?:\.\d{2})?)/i,
    /vat\s*(?:on\s*)?(?:output|sales)[:\s]*(?:AED\s*)?([\d,]+(?:\.\d{2})?)/i,
    /total\s*output\s*(?:vat|tax)[:\s]*(?:AED\s*)?([\d,]+(?:\.\d{2})?)/i,
    /box\s*(?:4|10)[a-z\s:-]*([\d,]+(?:\.\d{2})?)/i,
    /vat\s*due\s*on\s*(?:supplies|sales)[:\s]*(?:AED\s*)?([\d,]+(?:\.\d{2})?)/i,
  ],
  // Input VAT
  inputVAT: [
    /input\s*(?:vat|tax)[:\s]*(?:AED\s*)?([\d,]+(?:\.\d{2})?)/i,
    /vat\s*(?:on\s*)?(?:input|purchases)[:\s]*(?:AED\s*)?([\d,]+(?:\.\d{2})?)/i,
    /recoverable\s*(?:vat|tax)[:\s]*(?:AED\s*)?([\d,]+(?:\.\d{2})?)/i,
    /box\s*(?:9|11)[a-z\s:-]*([\d,]+(?:\.\d{2})?)/i,
    /total\s*input\s*(?:vat|tax)[:\s]*(?:AED\s*)?([\d,]+(?:\.\d{2})?)/i,
  ],
  // Period detection
  period: [
    /(?:tax\s*)?period[:\s]*([A-Za-z]+\s*-?\s*[A-Za-z]*\s*\d{4})/i,
    /(?:return\s*)?period[:\s]*(\d{1,2}[-\/]\d{4}\s*to\s*\d{1,2}[-\/]\d{4})/i,
    /quarter[:\s]*([Q][1-4]\s*\d{4})/i,
    /(Q[1-4]\s*20\d{2})/i,
    /(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s*[-–]\s*(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s*(\d{4})/i,
  ],
  // Date patterns
  startDate: [
    /from[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
    /start\s*date[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
    /period\s*(?:from|start)[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
  ],
  endDate: [
    /to[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
    /end\s*date[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
    /period\s*(?:to|end)[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
  ],
};

// Parse currency string to number
const parseCurrencyValue = (value: string): number => {
  if (!value) return 0;
  // Remove currency symbols, spaces, and commas
  const cleaned = value.replace(/[^\d.-]/g, '');
  return parseFloat(cleaned) || 0;
};

// Extract value using multiple patterns
const extractValue = (text: string, patterns: RegExp[]): string | null => {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return null;
};

// Parse PDF file
async function parsePDF(file: File): Promise<ParsedVATData> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  let fullText = '';
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    fullText += pageText + '\n';
  }

  return parseVATText(fullText);
}

// Parse Excel file
async function parseExcel(file: File): Promise<ParsedVATData> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = new XLSX.Workbook();
  await workbook.xlsx.load(arrayBuffer);
  
  let extractedData: ParsedVATData = {
    confidence: 'low',
    detectedFields: [],
  };

  // Try to find VAT data in worksheets
  workbook.eachSheet((worksheet) => {
    // Look for specific cell labels
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell, colNumber) => {
        const cellValue = String(cell.value || '').toLowerCase();
        const nextCell = row.getCell(colNumber + 1);
        const nextValue = nextCell?.value;
        
        // Check for taxable sales
        if (cellValue.includes('taxable') && cellValue.includes('sales') || 
            cellValue.includes('standard rated')) {
          if (typeof nextValue === 'number') {
            extractedData.taxableSales = nextValue;
            extractedData.detectedFields.push('taxableSales');
          }
        }
        
        // Check for zero-rated
        if (cellValue.includes('zero') && cellValue.includes('rated') ||
            cellValue.includes('export')) {
          if (typeof nextValue === 'number') {
            extractedData.zeroRatedSales = nextValue;
            extractedData.detectedFields.push('zeroRatedSales');
          }
        }
        
        // Check for exempt
        if (cellValue.includes('exempt')) {
          if (typeof nextValue === 'number') {
            extractedData.exemptSales = nextValue;
            extractedData.detectedFields.push('exemptSales');
          }
        }
        
        // Check for output VAT
        if (cellValue.includes('output') && (cellValue.includes('vat') || cellValue.includes('tax'))) {
          if (typeof nextValue === 'number') {
            extractedData.outputVAT = nextValue;
            extractedData.detectedFields.push('outputVAT');
          }
        }
        
        // Check for input VAT
        if (cellValue.includes('input') && (cellValue.includes('vat') || cellValue.includes('tax'))) {
          if (typeof nextValue === 'number') {
            extractedData.inputVAT = nextValue;
            extractedData.detectedFields.push('inputVAT');
          }
        }
        
        // Check for period
        if (cellValue.includes('period') || cellValue.includes('quarter')) {
          if (typeof nextValue === 'string') {
            extractedData.period = nextValue;
            extractedData.detectedFields.push('period');
          }
        }
      });
    });
  });

  // Determine confidence based on detected fields
  const fieldCount = extractedData.detectedFields.length;
  if (fieldCount >= 4) {
    extractedData.confidence = 'high';
  } else if (fieldCount >= 2) {
    extractedData.confidence = 'medium';
  }

  return extractedData;
}

// Parse VAT text content
function parseVATText(text: string): ParsedVATData {
  const detectedFields: string[] = [];
  
  // Extract each field
  const taxableSalesStr = extractValue(text, PATTERNS.taxableSales);
  const zeroRatedSalesStr = extractValue(text, PATTERNS.zeroRatedSales);
  const exemptSalesStr = extractValue(text, PATTERNS.exemptSales);
  const outputVATStr = extractValue(text, PATTERNS.outputVAT);
  const inputVATStr = extractValue(text, PATTERNS.inputVAT);
  const periodStr = extractValue(text, PATTERNS.period);
  const startDateStr = extractValue(text, PATTERNS.startDate);
  const endDateStr = extractValue(text, PATTERNS.endDate);

  // Parse values
  const taxableSales = parseCurrencyValue(taxableSalesStr || '');
  const zeroRatedSales = parseCurrencyValue(zeroRatedSalesStr || '');
  const exemptSales = parseCurrencyValue(exemptSalesStr || '');
  const outputVAT = parseCurrencyValue(outputVATStr || '');
  const inputVAT = parseCurrencyValue(inputVATStr || '');

  // Track detected fields
  if (taxableSales > 0) detectedFields.push('taxableSales');
  if (zeroRatedSales > 0) detectedFields.push('zeroRatedSales');
  if (exemptSales > 0) detectedFields.push('exemptSales');
  if (outputVAT > 0) detectedFields.push('outputVAT');
  if (inputVAT > 0) detectedFields.push('inputVAT');
  if (periodStr) detectedFields.push('period');
  if (startDateStr) detectedFields.push('startDate');
  if (endDateStr) detectedFields.push('endDate');

  // Determine confidence level
  let confidence: 'high' | 'medium' | 'low' = 'low';
  if (detectedFields.length >= 5) {
    confidence = 'high';
  } else if (detectedFields.length >= 3) {
    confidence = 'medium';
  }

  return {
    period: periodStr || undefined,
    startDate: startDateStr || undefined,
    endDate: endDateStr || undefined,
    taxableSales: taxableSales || undefined,
    zeroRatedSales: zeroRatedSales || undefined,
    exemptSales: exemptSales || undefined,
    outputVAT: outputVAT || undefined,
    inputVAT: inputVAT || undefined,
    confidence,
    rawText: text.substring(0, 2000), // Keep first 2000 chars for reference
    detectedFields,
  };
}

// Main parser function
export async function parseVATReturn(file: File): Promise<VATParserResult> {
  try {
    const fileName = file.name;
    const fileExtension = fileName.toLowerCase().split('.').pop();
    
    let data: ParsedVATData;
    let fileType: 'pdf' | 'excel';

    if (fileExtension === 'pdf') {
      fileType = 'pdf';
      data = await parsePDF(file);
    } else if (['xlsx', 'xls'].includes(fileExtension || '')) {
      fileType = 'excel';
      data = await parseExcel(file);
    } else {
      return {
        success: false,
        error: `Unsupported file type: ${fileExtension}. Please upload PDF or Excel files.`,
        fileName,
        fileType: 'pdf',
      };
    }

    return {
      success: true,
      data,
      fileName,
      fileType,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to parse file',
      fileName: file.name,
      fileType: 'pdf',
    };
  }
}

// Convert parsed data to VATReturn
export function createVATReturnFromParsed(
  parsed: ParsedVATData,
  fileName: string
): VATReturn {
  // Generate period if not detected
  const period = parsed.period || generatePeriodFromDates(parsed.startDate, parsed.endDate);
  
  return {
    id: `vat-${Date.now()}`,
    period: period || 'Unknown Period',
    startDate: parsed.startDate || '',
    endDate: parsed.endDate || '',
    taxableSales: parsed.taxableSales || 0,
    zeroRatedSales: parsed.zeroRatedSales || 0,
    exemptSales: parsed.exemptSales || 0,
    outputVAT: parsed.outputVAT || 0,
    inputVAT: parsed.inputVAT || 0,
    netVAT: (parsed.outputVAT || 0) - (parsed.inputVAT || 0),
    fileName,
    uploadDate: new Date().toISOString(),
    status: 'pending',
  };
}

// Generate period string from dates
function generatePeriodFromDates(startDate?: string, endDate?: string): string | null {
  if (!startDate || !endDate) return null;
  
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const startMonth = start.toLocaleString('default', { month: 'short' });
    const endMonth = end.toLocaleString('default', { month: 'short' });
    const year = end.getFullYear();
    
    if (startMonth === endMonth) {
      return `${startMonth} ${year}`;
    }
    return `${startMonth} - ${endMonth} ${year}`;
  } catch {
    return null;
  }
}

export const VATReturnParser = {
  parseVATReturn,
  createVATReturnFromParsed,
};
