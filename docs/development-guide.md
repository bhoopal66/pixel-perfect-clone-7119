# Bank Statement Analysis Application - Lovable Development Guide

## Application Overview
A web application that analyzes bank statement PDFs (6 months) and generates comprehensive Excel reports with 7 different analysis worksheets.

---

## 1. APPLICATION ARCHITECTURE

### Tech Stack
- **Frontend:** React + TypeScript + Tailwind CSS
- **PDF Processing:** pdf-parse or pdf.js
- **Excel Generation:** exceljs
- **File Upload:** react-dropzone
- **State Management:** React Context or Zustand
- **UI Components:** shadcn/ui

### Key Features
1. Multi-file PDF upload (up to 6 bank statements)
2. Automated transaction extraction and parsing
3. Real-time analysis progress indicator
4. 7 comprehensive report worksheets
5. Excel file download
6. Data visualization (charts/graphs)
7. Responsive design

---

## 2. FOLDER STRUCTURE

```
src/
├── components/
│   ├── FileUpload.tsx
│   ├── AnalysisProgress.tsx
│   ├── ResultsDashboard.tsx
│   ├── ReportPreview.tsx
│   └── DownloadButton.tsx
├── services/
│   ├── pdfParser.ts
│   ├── transactionAnalyzer.ts
│   ├── excelGenerator.ts
│   └── reportBuilder.ts
├── types/
│   ├── transaction.types.ts
│   └── report.types.ts
├── utils/
│   ├── dateHelpers.ts
│   ├── categoryMapper.ts
│   └── calculations.ts
├── contexts/
│   └── AnalysisContext.tsx
└── App.tsx
```

---

## 3. DATA MODELS (TypeScript Types)

```typescript
// types/transaction.types.ts

export interface BankStatement {
  month: string;
  year: number;
  openingBalance: number;
  closingBalance: number;
  averageBalance: number;
  totalDebits: number;
  totalCredits: number;
  debitCount: number;
  creditCount: number;
  days: number;
  transactions: Transaction[];
}

export interface Transaction {
  date: string;
  valueDate?: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  category: TransactionCategory;
  reference?: string;
}

export enum TransactionCategory {
  CASH_DEPOSIT = 'Cash Deposit',
  CASH_WITHDRAWAL = 'Cash Withdrawal',
  CHEQUE_PAYMENT = 'Cheque Payment',
  CHEQUE_DEPOSIT = 'Cheque Deposit',
  BANK_TRANSFER_IN = 'Bank Transfer (Inward)',
  BANK_TRANSFER_OUT = 'Bank Transfer (Outward)',
  BILL_PAYMENT = 'Bill Payments',
  SALARY_PAYMENT = 'Salary Payments',
  LOAN_PAYMENT = 'Loan Payment',
  BANK_CHARGES = 'Bank Charges & Fees',
  TAX_PAYMENT = 'Tax Payment',
  FREIGHT = 'Freight Charges',
  COMMODITY = 'Commodity Purchase',
  OTHER_CREDIT = 'Other Credit',
  OTHER_DEBIT = 'Other Debit'
}

export interface AnalysisReport {
  accountInfo: AccountInfo;
  summary: SixMonthSummary;
  monthlyBalances: MonthlyBalance[];
  dailyBalances: DailyBalance[];
  transactions: Transaction[];
  categoryAnalysis: CategorySummary[];
  chequeAnalysis: ChequeAnalysis;
  monthWiseSummary: MonthSummary[];
}

export interface AccountInfo {
  accountName: string;
  accountNumber: string;
  iban: string;
  bank: string;
  period: string;
}

export interface SixMonthSummary {
  openingBalance: number;
  closingBalance: number;
  netChange: number;
  totalCredits: number;
  totalDebits: number;
  creditCount: number;
  debitCount: number;
  averageMonthlyBalance: number;
}

export interface MonthlyBalance {
  month: string;
  average: number;
  days: number;
  opening: number;
  closing: number;
}

export interface DailyBalance {
  date: string;
  balance: number;
  month: string;
}

export interface CategorySummary {
  category: string;
  count: number;
  totalDebit: number;
  totalCredit: number;
}

export interface ChequeAnalysis {
  monthlyData: {
    month: string;
    payments: number;
    deposits: number;
  }[];
  returns: {
    inward: number;
    outward: number;
  };
}

export interface MonthSummary {
  month: string;
  opening: number;
  closing: number;
  totalCredits: number;
  totalDebits: number;
  creditCount: number;
  debitCount: number;
  netChange: number;
  average: number;
}
```

---

## 4. COMPONENT STRUCTURE

### 4.1 FileUpload.tsx

```typescript
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X } from 'lucide-react';

interface UploadedFile {
  file: File;
  id: string;
  name: string;
}

export const FileUpload: React.FC<{
  onFilesSelected: (files: File[]) => void;
}> = ({ onFilesSelected }) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36),
      name: file.name
    }));
    
    setUploadedFiles(prev => [...prev, ...newFiles]);
    onFilesSelected(acceptedFiles);
  }, [onFilesSelected]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 6
  });

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
          transition-colors duration-200
          ${isDragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
        `}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-lg font-medium text-gray-700 mb-2">
          Upload Bank Statements (PDF)
        </p>
        <p className="text-sm text-gray-500">
          Drag and drop up to 6 monthly statements, or click to browse
        </p>
        <p className="text-xs text-gray-400 mt-2">
          Supported: January - June 2024 statements
        </p>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="mt-6 space-y-2">
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Uploaded Files ({uploadedFiles.length}/6)
          </h3>
          {uploadedFiles.map(file => (
            <div
              key={file.id}
              className="flex items-center justify-between p-3 bg-white border rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-blue-500" />
                <span className="text-sm text-gray-700">{file.name}</span>
              </div>
              <button
                onClick={() => removeFile(file.id)}
                className="text-red-500 hover:text-red-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <button
          onClick={() => {/* Trigger analysis */}}
          className="mt-6 w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Analyze Statements
        </button>
      )}
    </div>
  );
};
```

### 4.2 AnalysisProgress.tsx

```typescript
import React from 'react';
import { Loader2, CheckCircle } from 'lucide-react';

interface AnalysisStep {
  id: string;
  label: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
}

export const AnalysisProgress: React.FC<{
  steps: AnalysisStep[];
}> = ({ steps }) => {
  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">
          Analyzing Your Bank Statements
        </h2>
        
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                {step.status === 'completed' ? (
                  <CheckCircle className="h-6 w-6 text-green-500" />
                ) : step.status === 'processing' ? (
                  <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
                ) : (
                  <div className="h-6 w-6 rounded-full border-2 border-gray-300" />
                )}
              </div>
              
              <div className="flex-1">
                <p className={`font-medium ${
                  step.status === 'completed' 
                    ? 'text-green-700' 
                    : step.status === 'processing'
                    ? 'text-blue-700'
                    : 'text-gray-500'
                }`}>
                  {step.label}
                </p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${(steps.filter(s => s.status === 'completed').length / steps.length) * 100}%`
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
```

### 4.3 ResultsDashboard.tsx

```typescript
import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar,
  Download
} from 'lucide-react';
import type { AnalysisReport } from '../types/transaction.types';

export const ResultsDashboard: React.FC<{
  report: AnalysisReport;
  onDownload: () => void;
}> = ({ report, onDownload }) => {
  const { summary, accountInfo } = report;

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Bank Statement Analysis
            </h1>
            <p className="text-gray-600 mt-1">{accountInfo.accountName}</p>
            <p className="text-sm text-gray-500">{accountInfo.period}</p>
          </div>
          <button
            onClick={onDownload}
            className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="h-5 w-5" />
            <span className="font-medium">Download Excel Report</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <MetricCard
          icon={<DollarSign className="h-6 w-6" />}
          label="Opening Balance"
          value={summary.openingBalance}
          format="currency"
          color="blue"
        />
        <MetricCard
          icon={<DollarSign className="h-6 w-6" />}
          label="Closing Balance"
          value={summary.closingBalance}
          format="currency"
          color="green"
        />
        <MetricCard
          icon={<TrendingUp className="h-6 w-6" />}
          label="Total Credits"
          value={summary.totalCredits}
          format="currency"
          color="emerald"
          subtitle={`${summary.creditCount} transactions`}
        />
        <MetricCard
          icon={<TrendingDown className="h-6 w-6" />}
          label="Total Debits"
          value={summary.totalDebits}
          format="currency"
          color="red"
          subtitle={`${summary.debitCount} transactions`}
        />
      </div>

      {/* Net Change Card */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">
              Net Change (6 Months)
            </p>
            <p className={`text-3xl font-bold ${
              summary.netChange >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              AED {summary.netChange.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {((summary.netChange / summary.openingBalance) * 100).toFixed(2)}% change
            </p>
          </div>
          <div className={`p-4 rounded-full ${
            summary.netChange >= 0 ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {summary.netChange >= 0 ? (
              <TrendingUp className="h-8 w-8 text-green-600" />
            ) : (
              <TrendingDown className="h-8 w-8 text-red-600" />
            )}
          </div>
        </div>
      </div>

      {/* Monthly Balances Table Preview */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Monthly Average Balances
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Month
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Average Balance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Opening
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Closing
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {report.monthlyBalances.map((month, idx) => (
                <tr key={idx}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {month.month}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    AED {month.average.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    AED {month.opening.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    AED {month.closing.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Category Analysis Preview */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Transaction Categories
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {report.categoryAnalysis.slice(0, 6).map((cat, idx) => (
            <div key={idx} className="border rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 mb-2">
                {cat.category}
              </p>
              <p className="text-xs text-gray-500 mb-1">
                {cat.count} transactions
              </p>
              <p className="text-lg font-bold text-gray-900">
                AED {(cat.totalDebit + cat.totalCredit).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const MetricCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: number;
  format: 'currency' | 'number';
  color: string;
  subtitle?: string;
}> = ({ icon, label, value, format, color, subtitle }) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    red: 'bg-red-100 text-red-600'
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <div className={`p-2 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">
        {format === 'currency' ? 'AED ' : ''}
        {value.toLocaleString('en-US', {
          minimumFractionDigits: format === 'currency' ? 2 : 0,
          maximumFractionDigits: format === 'currency' ? 2 : 0
        })}
      </p>
      {subtitle && (
        <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
      )}
    </div>
  );
};
```

---

## 5. SERVICE IMPLEMENTATION

### 5.1 pdfParser.ts

```typescript
import * as pdfjsLib from 'pdfjs-dist';

export interface ParsedPDFData {
  text: string;
  pages: string[];
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

  static extractTransactions(pdfText: string): any[] {
    // Regex patterns for ADCB statement format
    const transactionPattern = /(\d{2}-\w{3}-\d{4})\s+(\d{2}-\w{3}-\d{4})\s+([A-Z0-9]+)\s+([^\d]+?)\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})/g;
    
    const transactions: any[] = [];
    let match;
    
    while ((match = transactionPattern.exec(pdfText)) !== null) {
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

  static extractAccountInfo(pdfText: string): any {
    // Extract account information
    const accountNumberMatch = pdfText.match(/Account No\.\s*:\s*([\d\s-]+)/);
    const ibanMatch = pdfText.match(/IBAN\s+(AE[\d]+)/);
    const accountNameMatch = pdfText.match(/Account Name\s*:\s*([^\n]+)/);
    const periodMatch = pdfText.match(/Start Date:\s*(\d{2}-\w{3}-\d{4})\s+End Date:\s*(\d{2}-\w{3}-\d{4})/);
    
    return {
      accountNumber: accountNumberMatch?.[1]?.trim(),
      iban: ibanMatch?.[1],
      accountName: accountNameMatch?.[1]?.trim(),
      startDate: periodMatch?.[1],
      endDate: periodMatch?.[2]
    };
  }

  static extractBalances(pdfText: string): any {
    const openingMatch = pdfText.match(/Opening Balance:\s*([\d,]+\.\d{2})/);
    const closingMatch = pdfText.match(/Closing.*Balance:\s*([\d,]+\.\d{2})/);
    const averageMatch = pdfText.match(/Average Balance\s*([\d,]+\.\d{2})/);
    
    return {
      opening: parseFloat(openingMatch?.[1]?.replace(/,/g, '') || '0'),
      closing: parseFloat(closingMatch?.[1]?.replace(/,/g, '') || '0'),
      average: parseFloat(averageMatch?.[1]?.replace(/,/g, '') || '0')
    };
  }
}
```

### 5.2 transactionAnalyzer.ts

```typescript
import type { Transaction, TransactionCategory, BankStatement } from '../types/transaction.types';

export class TransactionAnalyzer {
  static categorizeTransaction(description: string, debit: number, credit: number): TransactionCategory {
    const desc = description.toLowerCase();
    
    if (desc.includes('cheque')) {
      return credit > 0 ? TransactionCategory.CHEQUE_DEPOSIT : TransactionCategory.CHEQUE_PAYMENT;
    }
    if (desc.includes('cash') || desc.includes('cdm')) {
      return credit > 0 ? TransactionCategory.CASH_DEPOSIT : TransactionCategory.CASH_WITHDRAWAL;
    }
    if (desc.includes('bill') || desc.includes('etisalat') || desc.includes('addc')) {
      return TransactionCategory.BILL_PAYMENT;
    }
    if (desc.includes('salary') || desc.includes('wps')) {
      return TransactionCategory.SALARY_PAYMENT;
    }
    if (desc.includes('b/o') || desc.includes('adnoc') || desc.includes('treasury')) {
      return credit > 0 ? TransactionCategory.BANK_TRANSFER_IN : TransactionCategory.BANK_TRANSFER_OUT;
    }
    if (desc.includes('trf to') || desc.includes('o/w trf') || desc.includes('transfer')) {
      return TransactionCategory.BANK_TRANSFER_OUT;
    }
    if (desc.includes('loan')) {
      return TransactionCategory.LOAN_PAYMENT;
    }
    if (desc.includes('fee') || desc.includes('charge') || desc.includes('membership')) {
      return TransactionCategory.BANK_CHARGES;
    }
    if (desc.includes('freight')) {
      return TransactionCategory.FREIGHT;
    }
    if (desc.includes('vat') || desc.includes('tax')) {
      return TransactionCategory.TAX_PAYMENT;
    }
    if (desc.includes('commodity')) {
      return TransactionCategory.COMMODITY;
    }
    
    return credit > 0 ? TransactionCategory.OTHER_CREDIT : TransactionCategory.OTHER_DEBIT;
  }

  static analyzeCategoryDistribution(transactions: Transaction[]): Map<string, any> {
    const categoryMap = new Map();
    
    transactions.forEach(txn => {
      const category = txn.category;
      if (!categoryMap.has(category)) {
        categoryMap.set(category, {
          count: 0,
          totalDebit: 0,
          totalCredit: 0
        });
      }
      
      const data = categoryMap.get(category);
      data.count++;
      data.totalDebit += txn.debit;
      data.totalCredit += txn.credit;
    });
    
    return categoryMap;
  }

  static calculateDailyBalances(
    startDate: Date,
    endDate: Date,
    transactions: Transaction[]
  ): Map<string, number> {
    const dailyBalances = new Map<string, number>();
    
    // Sort transactions by date
    const sortedTxns = [...transactions].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    let currentBalance = sortedTxns[0]?.balance || 0;
    let txnIndex = 0;
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      
      // Find all transactions for this date
      while (txnIndex < sortedTxns.length) {
        const txnDate = new Date(sortedTxns[txnIndex].date);
        if (txnDate.toDateString() === d.toDateString()) {
          currentBalance = sortedTxns[txnIndex].balance;
          txnIndex++;
        } else {
          break;
        }
      }
      
      dailyBalances.set(dateStr, currentBalance);
    }
    
    return dailyBalances;
  }

  static identifyChequeReturns(transactions: Transaction[]): any {
    const chequeReturns = {
      inward: 0,
      outward: 0,
      details: [] as any[]
    };
    
    transactions.forEach(txn => {
      const desc = txn.description.toLowerCase();
      if (desc.includes('return') && desc.includes('cheque')) {
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
}
```

### 5.3 excelGenerator.ts

```typescript
import ExcelJS from 'exceljs';
import type { AnalysisReport } from '../types/transaction.types';

export class ExcelGenerator {
  static async generateReport(report: AnalysisReport): Promise<Blob> {
    const workbook = new ExcelJS.Workbook();
    
    // Set workbook properties
    workbook.creator = 'Bank Statement Analyzer';
    workbook.created = new Date();
    
    // 1. Summary Dashboard
    this.createSummarySheet(workbook, report);
    
    // 2. Monthly Average Balance
    this.createMonthlyBalanceSheet(workbook, report);
    
    // 3. Daily Average Balance
    this.createDailyBalanceSheet(workbook, report);
    
    // 4. Transaction Grouping
    this.createTransactionGroupingSheet(workbook, report);
    
    // 5. Category Summary
    this.createCategorySummarySheet(workbook, report);
    
    // 6. Cheque Returns Analysis
    this.createChequeAnalysisSheet(workbook, report);
    
    // 7. Month-Wise Summary
    this.createMonthWiseSummarySheet(workbook, report);
    
    // Generate buffer and return as Blob
    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
  }

  private static createSummarySheet(workbook: ExcelJS.Workbook, report: AnalysisReport) {
    const sheet = workbook.addWorksheet('Summary Dashboard');
    
    // Set column widths
    sheet.getColumn(1).width = 30;
    sheet.getColumn(2).width = 20;
    
    // Header
    const headerCell = sheet.getCell('A1');
    headerCell.value = '6-MONTH BANK STATEMENT ANALYSIS';
    headerCell.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
    headerCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF203864' }
    };
    headerCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.mergeCells('A1:D1');
    
    // Account Information
    let row = 3;
    sheet.getCell(`A${row}`).value = 'Account Information';
    sheet.getCell(`A${row}`).font = { bold: true, size: 12 };
    sheet.getCell(`A${row}`).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD9E1F2' }
    };
    sheet.mergeCells(`A${row}:D${row}`);
    
    row++;
    const accountData = [
      ['Account Name', report.accountInfo.accountName],
      ['Account Number', report.accountInfo.accountNumber],
      ['IBAN', report.accountInfo.iban],
      ['Analysis Period', report.accountInfo.period],
      ['Bank', report.accountInfo.bank]
    ];
    
    accountData.forEach(([label, value]) => {
      sheet.getCell(`A${row}`).value = label;
      sheet.getCell(`A${row}`).font = { bold: true };
      sheet.getCell(`B${row}`).value = value;
      row++;
    });
    
    // Summary metrics
    row += 2;
    sheet.getCell(`A${row}`).value = '6-Month Summary';
    sheet.getCell(`A${row}`).font = { bold: true, size: 12 };
    sheet.getCell(`A${row}`).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD9E1F2' }
    };
    sheet.mergeCells(`A${row}:D${row}`);
    
    row++;
    const summaryData = [
      ['Opening Balance', report.summary.openingBalance],
      ['Closing Balance', report.summary.closingBalance],
      ['Net Change', report.summary.netChange],
      ['', ''],
      ['Total Credits (6 months)', report.summary.totalCredits],
      ['Total Credit Transactions', report.summary.creditCount],
      ['', ''],
      ['Total Debits (6 months)', report.summary.totalDebits],
      ['Total Debit Transactions', report.summary.debitCount],
      ['', ''],
      ['Average Monthly Balance', report.summary.averageMonthlyBalance]
    ];
    
    summaryData.forEach(([label, value]) => {
      sheet.getCell(`A${row}`).value = label;
      if (label) {
        sheet.getCell(`A${row}`).font = { bold: true };
        sheet.getCell(`B${row}`).value = value;
        if (typeof value === 'number') {
          sheet.getCell(`B${row}`).numFmt = '#,##0.00';
        }
      }
      row++;
    });
  }

  private static createMonthlyBalanceSheet(workbook: ExcelJS.Workbook, report: AnalysisReport) {
    const sheet = workbook.addWorksheet('Monthly Average Balance');
    
    // Headers
    const headers = ['Month', 'Average Balance (AED)', 'Days', 'Opening Balance', 'Closing Balance'];
    sheet.addRow(headers);
    
    // Style header
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF366092' }
    };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    
    // Add data
    report.monthlyBalances.forEach(month => {
      sheet.addRow([
        month.month,
        month.average,
        month.days,
        month.opening,
        month.closing
      ]);
    });
    
    // Format numbers
    for (let i = 2; i <= sheet.rowCount; i++) {
      ['B', 'D', 'E'].forEach(col => {
        sheet.getCell(`${col}${i}`).numFmt = '#,##0.00';
      });
    }
    
    // Add average
    const avgRow = sheet.rowCount + 1;
    sheet.getCell(`A${avgRow}`).value = 'Overall Average';
    sheet.getCell(`A${avgRow}`).font = { bold: true };
    sheet.getCell(`B${avgRow}`).value = { formula: `AVERAGE(B2:B${avgRow - 1})` };
    sheet.getCell(`B${avgRow}`).font = { bold: true };
    sheet.getCell(`B${avgRow}`).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFFF00' }
    };
  }

  private static createDailyBalanceSheet(workbook: ExcelJS.Workbook, report: AnalysisReport) {
    const sheet = workbook.addWorksheet('Daily Average Balance');
    
    // Headers
    sheet.addRow(['Date', 'Balance (AED)', 'Month']);
    
    // Style header
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF366092' }
    };
    
    // Add data
    report.dailyBalances.forEach(day => {
      sheet.addRow([day.date, day.balance, day.month]);
    });
    
    // Format numbers
    for (let i = 2; i <= sheet.rowCount; i++) {
      sheet.getCell(`B${i}`).numFmt = '#,##0.00';
    }
  }

  private static createTransactionGroupingSheet(workbook: ExcelJS.Workbook, report: AnalysisReport) {
    const sheet = workbook.addWorksheet('Transaction Grouping');
    
    // Headers
    sheet.addRow(['Date', 'Month', 'Description', 'Category', 'Count', 'Debit', 'Credit']);
    
    // Style header
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF366092' }
    };
    
    // Add transactions
    report.transactions.forEach(txn => {
      sheet.addRow([
        txn.date,
        new Date(txn.date).toLocaleString('default', { month: 'long', year: 'numeric' }),
        txn.description,
        txn.category,
        1,
        txn.debit,
        txn.credit
      ]);
    });
    
    // Format numbers
    for (let i = 2; i <= sheet.rowCount; i++) {
      ['F', 'G'].forEach(col => {
        sheet.getCell(`${col}${i}`).numFmt = '#,##0.00';
      });
    }
    
    // Add totals
    const totalRow = sheet.rowCount + 1;
    sheet.getCell(`D${totalRow}`).value = 'TOTAL';
    sheet.getCell(`D${totalRow}`).font = { bold: true };
    sheet.getCell(`E${totalRow}`).value = { formula: `SUM(E2:E${totalRow - 1})` };
    sheet.getCell(`F${totalRow}`).value = { formula: `SUM(F2:F${totalRow - 1})` };
    sheet.getCell(`G${totalRow}`).value = { formula: `SUM(G2:G${totalRow - 1})` };
    ['E', 'F', 'G'].forEach(col => {
      sheet.getCell(`${col}${totalRow}`).font = { bold: true };
      if (col !== 'E') {
        sheet.getCell(`${col}${totalRow}`).numFmt = '#,##0.00';
      }
    });
  }

  private static createCategorySummarySheet(workbook: ExcelJS.Workbook, report: AnalysisReport) {
    const sheet = workbook.addWorksheet('Category Summary');
    
    // Headers
    sheet.addRow(['Transaction Category', 'Count', 'Total Debit (AED)', 'Total Credit (AED)']);
    
    // Style header
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF366092' }
    };
    
    // Add data
    report.categoryAnalysis.forEach(cat => {
      sheet.addRow([cat.category, cat.count, cat.totalDebit, cat.totalCredit]);
    });
    
    // Format numbers
    for (let i = 2; i <= sheet.rowCount; i++) {
      ['C', 'D'].forEach(col => {
        sheet.getCell(`${col}${i}`).numFmt = '#,##0.00';
      });
    }
  }

  private static createChequeAnalysisSheet(workbook: ExcelJS.Workbook, report: AnalysisReport) {
    const sheet = workbook.addWorksheet('Cheque Returns Analysis');
    
    // Title
    sheet.getCell('A1').value = '6-Month Cheque Analysis';
    sheet.getCell('A1').font = { bold: true, size: 12 };
    sheet.mergeCells('A1:C1');
    
    // Headers
    sheet.getCell('A3').value = 'Month';
    sheet.getCell('B3').value = 'Cheque Payments';
    sheet.getCell('C3').value = 'Cheque Deposits';
    
    const headerRow = sheet.getRow(3);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF366092' }
    };
    
    // Add data
    let row = 4;
    report.chequeAnalysis.monthlyData.forEach(month => {
      sheet.getCell(`A${row}`).value = month.month;
      sheet.getCell(`B${row}`).value = month.payments;
      sheet.getCell(`C${row}`).value = month.deposits;
      row++;
    });
    
    // Totals
    sheet.getCell(`A${row}`).value = 'TOTAL';
    sheet.getCell(`A${row}`).font = { bold: true };
    sheet.getCell(`B${row}`).value = { formula: `SUM(B4:B${row - 1})` };
    sheet.getCell(`C${row}`).value = { formula: `SUM(C4:C${row - 1})` };
    
    // Returns section
    row += 3;
    sheet.getCell(`A${row}`).value = 'Cheque Return Analysis';
    sheet.getCell(`A${row}`).font = { bold: true, size: 11 };
    row++;
    
    sheet.getCell(`A${row}`).value = 'Cheque Returns (Inward)';
    sheet.getCell(`B${row}`).value = report.chequeAnalysis.returns.inward;
    row++;
    
    sheet.getCell(`A${row}`).value = 'Cheque Returns (Outward)';
    sheet.getCell(`B${row}`).value = report.chequeAnalysis.returns.outward;
  }

  private static createMonthWiseSummarySheet(workbook: ExcelJS.Workbook, report: AnalysisReport) {
    const sheet = workbook.addWorksheet('Month-Wise Summary');
    
    // Headers
    const headers = ['Metric', ...report.monthWiseSummary.map(m => m.month)];
    sheet.addRow(headers);
    
    // Style header
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF366092' }
    };
    
    // Metrics to display
    const metrics = [
      { label: 'Opening Balance', key: 'opening' },
      { label: 'Total Credits', key: 'totalCredits' },
      { label: 'Credit Transactions', key: 'creditCount' },
      { label: 'Total Debits', key: 'totalDebits' },
      { label: 'Debit Transactions', key: 'debitCount' },
      { label: 'Closing Balance', key: 'closing' },
      { label: '', key: '' },
      { label: 'Net Change', key: 'netChange' },
      { label: 'Average Balance', key: 'average' }
    ];
    
    metrics.forEach(metric => {
      const row = [metric.label];
      report.monthWiseSummary.forEach(month => {
        if (metric.key) {
          row.push(month[metric.key as keyof typeof month] as any);
        } else {
          row.push('');
        }
      });
      sheet.addRow(row);
    });
    
    // Format numbers
    for (let row = 2; row <= sheet.rowCount; row++) {
      for (let col = 2; col <= sheet.columnCount; col++) {
        const cell = sheet.getCell(row, col);
        if (typeof cell.value === 'number') {
          cell.numFmt = '#,##0.00';
        }
      }
    }
  }
}
```

---

## 6. MAIN APP STRUCTURE

### App.tsx

```typescript
import React, { useState } from 'react';
import { FileUpload } from './components/FileUpload';
import { AnalysisProgress } from './components/AnalysisProgress';
import { ResultsDashboard } from './components/ResultsDashboard';
import { PDFParser } from './services/pdfParser';
import { TransactionAnalyzer } from './services/transactionAnalyzer';
import { ExcelGenerator } from './services/excelGenerator';
import type { AnalysisReport } from './types/transaction.types';

type AppState = 'upload' | 'analyzing' | 'results';

function App() {
  const [state, setState] = useState<AppState>('upload');
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [progress, setProgress] = useState([
    { id: '1', label: 'Parsing PDF files', status: 'pending' },
    { id: '2', label: 'Extracting transactions', status: 'pending' },
    { id: '3', label: 'Categorizing transactions', status: 'pending' },
    { id: '4', label: 'Calculating balances', status: 'pending' },
    { id: '5', label: 'Generating analysis', status: 'pending' },
    { id: '6', label: 'Creating report', status: 'pending' }
  ] as any[]);

  const handleFilesSelected = async (files: File[]) => {
    setState('analyzing');
    
    try {
      // Step 1: Parse PDFs
      updateProgress(0, 'processing');
      const parsedData = await Promise.all(
        files.map(file => PDFParser.parsePDF(file))
      );
      updateProgress(0, 'completed');
      
      // Step 2: Extract transactions
      updateProgress(1, 'processing');
      const allTransactions = parsedData.flatMap(data => 
        PDFParser.extractTransactions(data.text)
      );
      updateProgress(1, 'completed');
      
      // Step 3: Categorize
      updateProgress(2, 'processing');
      const categorizedTransactions = allTransactions.map(txn => ({
        ...txn,
        category: TransactionAnalyzer.categorizeTransaction(
          txn.description,
          txn.debit,
          txn.credit
        )
      }));
      updateProgress(2, 'completed');
      
      // Step 4: Calculate balances
      updateProgress(3, 'processing');
      const dailyBalances = TransactionAnalyzer.calculateDailyBalances(
        new Date('2024-01-01'),
        new Date('2024-06-30'),
        categorizedTransactions
      );
      updateProgress(3, 'completed');
      
      // Step 5: Generate analysis
      updateProgress(4, 'processing');
      const categoryAnalysis = TransactionAnalyzer.analyzeCategoryDistribution(
        categorizedTransactions
      );
      const chequeAnalysis = TransactionAnalyzer.identifyChequeReturns(
        categorizedTransactions
      );
      updateProgress(4, 'completed');
      
      // Step 6: Create report
      updateProgress(5, 'processing');
      const analysisReport: AnalysisReport = {
        // ... build complete report object
      };
      setReport(analysisReport);
      updateProgress(5, 'completed');
      
      setState('results');
    } catch (error) {
      console.error('Analysis failed:', error);
      alert('Failed to analyze bank statements. Please try again.');
      setState('upload');
    }
  };

  const updateProgress = (index: number, status: string) => {
    setProgress(prev => 
      prev.map((step, i) => 
        i === index ? { ...step, status } : step
      )
    );
  };

  const handleDownload = async () => {
    if (!report) return;
    
    try {
      const blob = await ExcelGenerator.generateReport(report);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Bank_Statement_Analysis_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to generate Excel file. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Bank Statement Analyzer
          </h1>
          <p className="text-gray-600 mt-1">
            Upload your bank statements and get comprehensive analysis reports
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {state === 'upload' && (
          <FileUpload onFilesSelected={handleFilesSelected} />
        )}
        
        {state === 'analyzing' && (
          <AnalysisProgress steps={progress} />
        )}
        
        {state === 'results' && report && (
          <ResultsDashboard 
            report={report} 
            onDownload={handleDownload}
          />
        )}
      </main>

      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-gray-500 text-sm">
          © 2024 Bank Statement Analyzer. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

export default App;
```

---

## 7. DEPLOYMENT STEPS IN LOVABLE

1. **Create New Project**
   - Go to Lovable.dev
   - Create new project: "Bank Statement Analyzer"
   - Choose React + TypeScript template

2. **Install Dependencies**
   ```bash
   npm install exceljs pdfjs-dist react-dropzone lucide-react
   npm install -D @types/pdfjs-dist
   ```

3. **Copy Code Structure**
   - Create folder structure as shown above
   - Copy all TypeScript files
   - Copy component files

4. **Configure Tailwind**
   - Ensure tailwind.config.js is properly set up
   - Add custom colors if needed

5. **Test Locally**
   ```bash
   npm run dev
   ```

6. **Deploy**
   - Commit changes to GitHub
   - Deploy via Lovable's deployment feature
   - Or use Vercel/Netlify

---

## 8. KEY FEATURES TO IMPLEMENT

### Phase 1 (MVP)
- ✅ PDF upload (up to 6 files)
- ✅ Transaction extraction
- ✅ Basic categorization
- ✅ Excel generation with 7 sheets
- ✅ Download functionality

### Phase 2 (Enhanced)
- 📊 Interactive charts (Chart.js or Recharts)
- 🔍 Transaction search and filter
- 📱 Mobile responsive design
- 💾 Save analysis sessions
- 📧 Email report functionality

### Phase 3 (Advanced)
- 🤖 ML-based categorization
- 📈 Trend analysis and predictions
- 🔐 User authentication
- 💳 Multiple bank format support
- 📊 Customizable reports

---

## 9. TESTING CHECKLIST

- [ ] Upload single PDF
- [ ] Upload multiple PDFs (6 months)
- [ ] Parse transaction data correctly
- [ ] Categorize transactions accurately
- [ ] Calculate balances correctly
- [ ] Generate all 7 Excel sheets
- [ ] Download Excel file successfully
- [ ] Format currency and dates properly
- [ ] Handle errors gracefully
- [ ] Mobile responsive
- [ ] Performance optimization

---

## 10. PERFORMANCE OPTIMIZATION

1. **PDF Processing**
   - Use Web Workers for parsing
   - Process files in parallel
   - Show progress indicators

2. **Excel Generation**
   - Generate in background thread
   - Optimize memory usage
   - Use streaming for large datasets

3. **UI/UX**
   - Implement skeleton loaders
   - Add animations
   - Optimize bundle size
   - Lazy load components

---

## NEXT STEPS

1. Set up Lovable project
2. Copy folder structure
3. Implement components one by one
4. Test with sample bank statements
5. Deploy and share

Need help with any specific component or feature? Let me know!
