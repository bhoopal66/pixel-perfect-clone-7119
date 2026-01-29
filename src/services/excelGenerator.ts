import ExcelJS from 'exceljs';
import type { AnalysisReport } from '../types/transaction.types';
import type { TurnoverAnalysisReport } from '../types/turnover.types';
import { CurrencyService } from './currencyService';

export class ExcelGenerator {
  static async generateReport(
    report: AnalysisReport
  ): Promise<Blob> {
    const workbook = new ExcelJS.Workbook();
    
    workbook.creator = 'Bank Statement Analyzer';
    workbook.created = new Date();
    
    // Create all worksheets
    this.createSummarySheet(workbook, report);
    this.createMonthlyBalanceSheet(workbook, report);
    this.createDailyBalanceSheet(workbook, report);
    this.createTransactionGroupingSheet(workbook, report);
    this.createCategorySummarySheet(workbook, report);
    this.createChequeAnalysisSheet(workbook, report);
    this.createMonthWiseSummarySheet(workbook, report);
    
    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
  }

  /**
   * Generate report with optional turnover analysis
   */
  static async generateReportWithTurnoverAnalysis(
    report: AnalysisReport,
    turnoverAnalysis?: TurnoverAnalysisReport
  ): Promise<Blob> {
    const workbook = new ExcelJS.Workbook();
    
    workbook.creator = 'Bank Statement Analyzer';
    workbook.created = new Date();
    
    // Create all worksheets
    this.createSummarySheet(workbook, report);
    this.createMonthlyBalanceSheet(workbook, report);
    this.createDailyBalanceSheet(workbook, report);
    this.createTransactionGroupingSheet(workbook, report);
    this.createCategorySummarySheet(workbook, report);
    this.createChequeAnalysisSheet(workbook, report);
    this.createMonthWiseSummarySheet(workbook, report);
    
    // Add turnover analysis worksheet if provided
    if (turnoverAnalysis) {
      this.createTurnoverAnalysisSheet(workbook, turnoverAnalysis);
    }
    
    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
  }

  private static styleHeader(row: ExcelJS.Row) {
    row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    row.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF203864' }
    };
    row.alignment = { horizontal: 'center', vertical: 'middle' };
  }

  private static createSummarySheet(
    workbook: ExcelJS.Workbook, 
    report: AnalysisReport
  ) {
    const sheet = workbook.addWorksheet('Summary Dashboard');
    
    sheet.getColumn(1).width = 30;
    sheet.getColumn(2).width = 25;
    sheet.getColumn(3).width = 25;
    sheet.getColumn(4).width = 25;
    
    // Header
    const headerCell = sheet.getCell('A1');
    headerCell.value = '6-MONTH BANK STATEMENT ANALYSIS';
    headerCell.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
    headerCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF203864' }
    };
    headerCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.mergeCells('A1:D1');
    sheet.getRow(1).height = 35;
    
    // Account Information Section
    let row = 3;
    const accountHeader = sheet.getCell(`A${row}`);
    accountHeader.value = 'Account Information';
    accountHeader.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
    accountHeader.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF366092' }
    };
    sheet.mergeCells(`A${row}:D${row}`);
    
    row++;
    const accountData = [
      ['Account Name', report.accountInfo.accountName || 'N/A'],
      ['Account Number', report.accountInfo.accountNumber || 'N/A'],
      ['IBAN', report.accountInfo.iban || 'N/A'],
      ['Analysis Period', report.accountInfo.period || 'N/A'],
      ['Bank', report.accountInfo.bank || 'N/A']
    ];
    
    accountData.forEach(([label, value]) => {
      sheet.getCell(`A${row}`).value = label;
      sheet.getCell(`A${row}`).font = { bold: true };
      sheet.getCell(`B${row}`).value = value;
      row++;
    });
    
    // Summary Section
    row += 1;
    const summaryHeader = sheet.getCell(`A${row}`);
    summaryHeader.value = '6-Month Financial Summary';
    summaryHeader.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
    summaryHeader.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF366092' }
    };
    sheet.mergeCells(`A${row}:D${row}`);
    
    row++;
    const summaryData = [
      ['Opening Balance', report.summary.openingBalance],
      ['Closing Balance', report.summary.closingBalance],
      ['Net Change', report.summary.netChange],
      ['', ''],
      ['Total Credits', report.summary.totalCredits],
      ['Credit Transactions', report.summary.creditCount],
      ['', ''],
      ['Total Debits', report.summary.totalDebits],
      ['Debit Transactions', report.summary.debitCount],
      ['', ''],
      ['Average Monthly Balance', report.summary.averageMonthlyBalance]
    ];
    
    summaryData.forEach(([label, value]) => {
      if (label) {
        sheet.getCell(`A${row}`).value = label;
        sheet.getCell(`A${row}`).font = { bold: true };
        sheet.getCell(`B${row}`).value = value;
        if (typeof value === 'number') {
          sheet.getCell(`B${row}`).numFmt = '#,##0.00';
          // Color code net change
          if (label === 'Net Change') {
            sheet.getCell(`B${row}`).font = { 
              bold: true, 
              color: { argb: value >= 0 ? 'FF228B22' : 'FFDC143C' } 
            };
          }
        }
      }
      row++;
    });
  }


  private static createMonthlyBalanceSheet(workbook: ExcelJS.Workbook, report: AnalysisReport) {
    const sheet = workbook.addWorksheet('Monthly Average Balance');
    const currency = report.summary.currency || 'AED';
    
    const headers = ['Month', `Average Balance (${currency})`, 'Days', 'Opening Balance', 'Closing Balance'];
    const headerRow = sheet.addRow(headers);
    this.styleHeader(headerRow);
    
    // Set column widths
    sheet.getColumn(1).width = 20;
    sheet.getColumn(2).width = 22;
    sheet.getColumn(3).width = 10;
    sheet.getColumn(4).width = 20;
    sheet.getColumn(5).width = 20;
    
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
    
    // Add overall average
    const avgRow = sheet.rowCount + 2;
    sheet.getCell(`A${avgRow}`).value = 'Overall Average';
    sheet.getCell(`A${avgRow}`).font = { bold: true };
    sheet.getCell(`B${avgRow}`).value = { formula: `AVERAGE(B2:B${avgRow - 2})` };
    sheet.getCell(`B${avgRow}`).font = { bold: true };
    sheet.getCell(`B${avgRow}`).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFFF00' }
    };
    sheet.getCell(`B${avgRow}`).numFmt = '#,##0.00';
  }

  private static createDailyBalanceSheet(workbook: ExcelJS.Workbook, report: AnalysisReport) {
    const sheet = workbook.addWorksheet('Daily Closing Balance');
    const currency = report.summary.currency || 'AED';
    
    const headerRow = sheet.addRow(['Date', `Closing Balance (${currency})`, 'Month', 'Has Transactions']);
    this.styleHeader(headerRow);
    
    sheet.getColumn(1).width = 15;
    sheet.getColumn(2).width = 25;
    sheet.getColumn(3).width = 20;
    sheet.getColumn(4).width = 18;
    
    report.dailyBalances.forEach(day => {
      const formattedDate = new Date(day.date).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
      sheet.addRow([
        formattedDate, 
        day.closingBalance, 
        day.month,
        day.hasTransactions ? 'Yes' : 'No (Carried Forward)'
      ]);
    });
    
    // Format currency column
    for (let i = 2; i <= sheet.rowCount; i++) {
      sheet.getCell(`B${i}`).numFmt = '#,##0.00';
      // Highlight rows with no transactions
      if (!report.dailyBalances[i - 2]?.hasTransactions) {
        sheet.getRow(i).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF5F5F5' }
        };
      }
    }
    
    // Add explanatory notes
    const noteRow = sheet.rowCount + 2;
    sheet.getCell(`A${noteRow}`).value = 'Note:';
    sheet.getCell(`A${noteRow}`).font = { bold: true, italic: true };
    
    sheet.getCell(`A${noteRow + 1}`).value = 
      'Daily Closing Balance shows the final balance at the end of each day (last transaction balance).';
    sheet.getCell(`A${noteRow + 1}`).font = { italic: true, size: 9 };
    sheet.mergeCells(`A${noteRow + 1}:D${noteRow + 1}`);
    
    sheet.getCell(`A${noteRow + 2}`).value = 
      'For days with no transactions, the previous day\'s closing balance is carried forward.';
    sheet.getCell(`A${noteRow + 2}`).font = { italic: true, size: 9 };
    sheet.mergeCells(`A${noteRow + 2}:D${noteRow + 2}`);
    
    // Add average calculation
    const avgRow = noteRow + 4;
    sheet.getCell(`A${avgRow}`).value = 'Average of Daily Closing Balances';
    sheet.getCell(`A${avgRow}`).font = { bold: true };
    sheet.getCell(`B${avgRow}`).value = { 
      formula: `AVERAGE(B2:B${noteRow - 1})` 
    };
    sheet.getCell(`B${avgRow}`).numFmt = '#,##0.00';
    sheet.getCell(`B${avgRow}`).font = { bold: true };
    sheet.getCell(`B${avgRow}`).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFFF00' }
    };
  }

  private static createTransactionGroupingSheet(workbook: ExcelJS.Workbook, report: AnalysisReport) {
    const sheet = workbook.addWorksheet('Transaction Grouping');
    const currency = report.summary.currency || 'AED';
    
    const headerRow = sheet.addRow(['Date', 'Month', 'Description', 'Category', 'Currency', 'Debit', 'Credit', 'Balance']);
    this.styleHeader(headerRow);
    this.styleHeader(headerRow);
    
    sheet.getColumn(1).width = 15;
    sheet.getColumn(2).width = 18;
    sheet.getColumn(3).width = 40;
    sheet.getColumn(4).width = 25;
    sheet.getColumn(5).width = 10;
    sheet.getColumn(6).width = 15;
    sheet.getColumn(7).width = 15;
    sheet.getColumn(8).width = 18;
    
    report.transactions.forEach(txn => {
      const txnDate = new Date(txn.date);
      sheet.addRow([
        txn.date,
        txnDate.toLocaleString('default', { month: 'long', year: 'numeric' }),
        txn.description,
        txn.category,
        txn.originalCurrency || txn.currency,
        txn.debit || '',
        txn.credit || '',
        txn.balance
      ]);
    });
    
    for (let i = 2; i <= sheet.rowCount; i++) {
      ['F', 'G', 'H'].forEach(col => {
        const cell = sheet.getCell(`${col}${i}`);
        if (cell.value) {
          cell.numFmt = '#,##0.00';
        }
      });
    }
    
    // Totals
    const totalRow = sheet.rowCount + 1;
    sheet.getCell(`C${totalRow}`).value = 'TOTAL';
    sheet.getCell(`C${totalRow}`).font = { bold: true };
    sheet.getCell(`F${totalRow}`).value = { formula: `SUM(F2:F${totalRow - 1})` };
    sheet.getCell(`G${totalRow}`).value = { formula: `SUM(G2:G${totalRow - 1})` };
    ['F', 'G'].forEach(col => {
      sheet.getCell(`${col}${totalRow}`).font = { bold: true };
      sheet.getCell(`${col}${totalRow}`).numFmt = '#,##0.00';
    });
  }

  private static createCategorySummarySheet(workbook: ExcelJS.Workbook, report: AnalysisReport) {
    const sheet = workbook.addWorksheet('Category Summary');
    const currency = report.summary.currency || 'AED';
    
    const headerRow = sheet.addRow(['Transaction Category', 'Count', `Total Debit (${currency})`, `Total Credit (${currency})`, 'Net Amount']);
    this.styleHeader(headerRow);
    
    sheet.getColumn(1).width = 30;
    sheet.getColumn(2).width = 12;
    sheet.getColumn(3).width = 20;
    sheet.getColumn(4).width = 20;
    sheet.getColumn(5).width = 18;
    
    report.categoryAnalysis.forEach(cat => {
      sheet.addRow([
        cat.category, 
        cat.count, 
        cat.totalDebit, 
        cat.totalCredit,
        cat.totalCredit - cat.totalDebit
      ]);
    });
    
    for (let i = 2; i <= sheet.rowCount; i++) {
      ['C', 'D', 'E'].forEach(col => {
        sheet.getCell(`${col}${i}`).numFmt = '#,##0.00';
      });
    }
  }

  private static createChequeAnalysisSheet(workbook: ExcelJS.Workbook, report: AnalysisReport) {
    const sheet = workbook.addWorksheet('Cheque Returns Analysis');
    
    // Title
    sheet.getCell('A1').value = '6-Month Cheque Analysis';
    sheet.getCell('A1').font = { bold: true, size: 14 };
    sheet.mergeCells('A1:C1');
    
    // Monthly data headers
    const headerRow = sheet.getRow(3);
    headerRow.values = ['Month', 'Cheque Payments', 'Cheque Deposits'];
    this.styleHeader(headerRow);
    
    sheet.getColumn(1).width = 18;
    sheet.getColumn(2).width = 18;
    sheet.getColumn(3).width = 18;
    
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
    sheet.getCell(`B${row}`).font = { bold: true };
    sheet.getCell(`C${row}`).font = { bold: true };
    
    // Returns section
    row += 3;
    sheet.getCell(`A${row}`).value = 'Cheque Return Analysis';
    sheet.getCell(`A${row}`).font = { bold: true, size: 12 };
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
    const headerRow = sheet.addRow(headers);
    this.styleHeader(headerRow);
    
    sheet.getColumn(1).width = 22;
    for (let i = 2; i <= headers.length; i++) {
      sheet.getColumn(i).width = 16;
    }
    
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
      const rowData: (string | number)[] = [metric.label];
      report.monthWiseSummary.forEach(month => {
        if (metric.key) {
          rowData.push(month[metric.key as keyof typeof month] as number);
        } else {
          rowData.push('');
        }
      });
      sheet.addRow(rowData);
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

  /**
   * Create Turnover Analysis worksheet with monthly % breakdown
   * Per spec: Credits + Debits = Total Turnover, with rankings and volatility
   */
  private static createTurnoverAnalysisSheet(
    workbook: ExcelJS.Workbook,
    analysis: TurnoverAnalysisReport
  ) {
    const sheet = workbook.addWorksheet('Turnover Analysis');
    
    // Title Section
    sheet.getCell('A1').value = 'TURNOVER ANALYSIS REPORT';
    sheet.getCell('A1').font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
    sheet.getCell('A1').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF203864' }
    };
    sheet.mergeCells('A1:G1');
    sheet.getRow(1).height = 35;
    
    // Company and period info
    let row = 3;
    if (analysis.companyName) {
      sheet.getCell(`A${row}`).value = 'Company:';
      sheet.getCell(`A${row}`).font = { bold: true };
      sheet.getCell(`B${row}`).value = analysis.companyName;
      row++;
    }
    
    sheet.getCell(`A${row}`).value = 'Analysis Period:';
    sheet.getCell(`A${row}`).font = { bold: true };
    sheet.getCell(`B${row}`).value = `${analysis.analysisStartDate} to ${analysis.analysisEndDate}`;
    row++;
    
    sheet.getCell(`A${row}`).value = 'Period Duration:';
    sheet.getCell(`A${row}`).font = { bold: true };
    sheet.getCell(`B${row}`).value = `${analysis.periodMonths} Months`;
    row += 2;
    
    // Overall Metrics Section
    const metricsHeader = sheet.getCell(`A${row}`);
    metricsHeader.value = 'Overall Metrics';
    metricsHeader.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
    metricsHeader.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF366092' }
    };
    sheet.mergeCells(`A${row}:D${row}`);
    row++;
    
    const overallMetrics = [
      ['Total Turnover (Credits + Debits)', analysis.totalTurnover],
      ['Total Credits', analysis.totalCredits],
      ['Total Debits', analysis.totalDebits],
      ['Average Monthly Turnover', analysis.averageMonthlyTurnover],
      ['', ''],
      ['Volatility (Std Dev)', analysis.volatility.standardDeviation],
      ['Volatility %', `${analysis.volatility.volatilityPercent.toFixed(1)}%`],
      ['Volatility Assessment', analysis.volatility.assessment.toUpperCase()]
    ];
    
    overallMetrics.forEach(([label, value]) => {
      if (label) {
        sheet.getCell(`A${row}`).value = label;
        sheet.getCell(`A${row}`).font = { bold: true };
        sheet.getCell(`B${row}`).value = value;
        if (typeof value === 'number') {
          sheet.getCell(`B${row}`).numFmt = '#,##0.00';
        }
        // Color code volatility assessment
        if (label === 'Volatility Assessment') {
          const assessment = analysis.volatility.assessment;
          let color = 'FF228B22'; // green
          if (assessment === 'moderate') color = 'FFFFA500';
          else if (assessment === 'moderate-high') color = 'FFFF8C00';
          else if (assessment === 'high') color = 'FFDC143C';
          sheet.getCell(`B${row}`).font = { bold: true, color: { argb: color } };
        }
      }
      row++;
    });
    
    row += 2;
    
    // Monthly Breakdown Section
    const monthlyHeader = sheet.getCell(`A${row}`);
    monthlyHeader.value = 'Monthly Turnover Breakdown';
    monthlyHeader.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
    monthlyHeader.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF366092' }
    };
    sheet.mergeCells(`A${row}:G${row}`);
    row++;
    
    // Table headers
    const tableHeaders = ['Month', 'Credits (AED)', 'Debits (AED)', 'Total Turnover (AED)', '% of Total', 'Ranking', 'Activity'];
    const headerRow = sheet.getRow(row);
    tableHeaders.forEach((h, idx) => {
      const cell = headerRow.getCell(idx + 1);
      cell.value = h;
    });
    this.styleHeader(headerRow);
    row++;
    
    // Set column widths
    sheet.getColumn(1).width = 12;
    sheet.getColumn(2).width = 18;
    sheet.getColumn(3).width = 18;
    sheet.getColumn(4).width = 20;
    sheet.getColumn(5).width = 12;
    sheet.getColumn(6).width = 10;
    sheet.getColumn(7).width = 12;
    
    // Monthly data rows
    const dataStartRow = row;
    analysis.monthlyBreakdown.forEach(month => {
      const dataRow = sheet.getRow(row);
      dataRow.getCell(1).value = month.month;
      dataRow.getCell(2).value = month.totalCredits;
      dataRow.getCell(2).numFmt = '#,##0.00';
      dataRow.getCell(3).value = month.totalDebits;
      dataRow.getCell(3).numFmt = '#,##0.00';
      dataRow.getCell(4).value = month.totalTurnover;
      dataRow.getCell(4).numFmt = '#,##0.00';
      dataRow.getCell(5).value = month.percentageOfTotal / 100; // Store as decimal for % format
      dataRow.getCell(5).numFmt = '0.00%';
      dataRow.getCell(6).value = this.getRankingSuffix(month.ranking);
      dataRow.getCell(7).value = month.activityLevel.charAt(0).toUpperCase() + month.activityLevel.slice(1);
      
      // Highlight high and low activity
      if (month.activityLevel === 'high') {
        dataRow.getCell(7).font = { bold: true, color: { argb: 'FF228B22' } };
        // Highlight highest month row
        if (month.ranking === 1) {
          for (let c = 1; c <= 7; c++) {
            dataRow.getCell(c).fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFE8F5E9' } // Light green
            };
          }
        }
      } else if (month.activityLevel === 'low') {
        dataRow.getCell(7).font = { bold: true, color: { argb: 'FFDC143C' } };
        // Highlight lowest month row
        if (month.ranking === analysis.periodMonths) {
          for (let c = 1; c <= 7; c++) {
            dataRow.getCell(c).fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFCE4EC' } // Light red
            };
          }
        }
      }
      
      row++;
    });
    
    // Total row
    const totalRow = sheet.getRow(row);
    totalRow.getCell(1).value = 'TOTAL';
    totalRow.getCell(1).font = { bold: true };
    totalRow.getCell(2).value = { formula: `SUM(B${dataStartRow}:B${row - 1})` };
    totalRow.getCell(2).numFmt = '#,##0.00';
    totalRow.getCell(2).font = { bold: true };
    totalRow.getCell(3).value = { formula: `SUM(C${dataStartRow}:C${row - 1})` };
    totalRow.getCell(3).numFmt = '#,##0.00';
    totalRow.getCell(3).font = { bold: true };
    totalRow.getCell(4).value = { formula: `SUM(D${dataStartRow}:D${row - 1})` };
    totalRow.getCell(4).numFmt = '#,##0.00';
    totalRow.getCell(4).font = { bold: true };
    totalRow.getCell(5).value = 1; // 100%
    totalRow.getCell(5).numFmt = '0.00%';
    totalRow.getCell(5).font = { bold: true };
    
    totalRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFFF00' } // Yellow highlight
    };
    row += 3;
    
    // Key Insights Section
    const insightsHeader = sheet.getCell(`A${row}`);
    insightsHeader.value = 'Key Insights';
    insightsHeader.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
    insightsHeader.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF366092' }
    };
    sheet.mergeCells(`A${row}:D${row}`);
    row++;
    
    // Highest month
    if (analysis.highestMonth) {
      sheet.getCell(`A${row}`).value = 'Highest Activity Month:';
      sheet.getCell(`A${row}`).font = { bold: true };
      sheet.getCell(`B${row}`).value = `${analysis.highestMonth.month} (${analysis.highestMonth.percentageOfTotal.toFixed(2)}%)`;
      sheet.getCell(`B${row}`).font = { color: { argb: 'FF228B22' } };
      row++;
    }
    
    // Lowest month
    if (analysis.lowestMonth) {
      sheet.getCell(`A${row}`).value = 'Lowest Activity Month:';
      sheet.getCell(`A${row}`).font = { bold: true };
      sheet.getCell(`B${row}`).value = `${analysis.lowestMonth.month} (${analysis.lowestMonth.percentageOfTotal.toFixed(2)}%)`;
      sheet.getCell(`B${row}`).font = { color: { argb: 'FFDC143C' } };
      row++;
    }
    
    sheet.getCell(`A${row}`).value = 'Expected Even Distribution:';
    sheet.getCell(`A${row}`).font = { bold: true };
    sheet.getCell(`B${row}`).value = `${analysis.expectedEvenDistribution.toFixed(2)}% per month`;
    row++;
    
    sheet.getCell(`A${row}`).value = 'Percentage Range:';
    sheet.getCell(`A${row}`).font = { bold: true };
    sheet.getCell(`B${row}`).value = `${analysis.percentageRange.min.toFixed(2)}% - ${analysis.percentageRange.max.toFixed(2)}% (Spread: ${analysis.percentageRange.spread.toFixed(2)} pts)`;
    row += 2;
    
    // Notes
    sheet.getCell(`A${row}`).value = 'Notes:';
    sheet.getCell(`A${row}`).font = { bold: true, italic: true };
    row++;
    
    sheet.getCell(`A${row}`).value = '• Turnover = Total Credits + Total Debits (measures total financial activity)';
    sheet.getCell(`A${row}`).font = { italic: true, size: 9 };
    sheet.mergeCells(`A${row}:G${row}`);
    row++;
    
    sheet.getCell(`A${row}`).value = '• High Activity: >120% of expected even distribution | Low Activity: <75% of expected';
    sheet.getCell(`A${row}`).font = { italic: true, size: 9 };
    sheet.mergeCells(`A${row}:G${row}`);
    row++;
    
    sheet.getCell(`A${row}`).value = '• Volatility <20% = Low | 20-30% = Moderate | 30-40% = Moderate-High | >40% = High';
    sheet.getCell(`A${row}`).font = { italic: true, size: 9 };
    sheet.mergeCells(`A${row}:G${row}`);
  }

  /**
   * Get ranking with ordinal suffix (1st, 2nd, 3rd, etc.)
   */
  private static getRankingSuffix(rank: number): string {
    if (rank % 100 >= 11 && rank % 100 <= 13) {
      return `${rank}th`;
    }
    switch (rank % 10) {
      case 1: return `${rank}st`;
      case 2: return `${rank}nd`;
      case 3: return `${rank}rd`;
      default: return `${rank}th`;
    }
  }
}
