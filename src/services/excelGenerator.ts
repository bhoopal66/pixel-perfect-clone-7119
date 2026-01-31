import ExcelJS from 'exceljs';
import type { AnalysisReport } from '../types/transaction.types';

export class ExcelGenerator {
  static async generateReport(report: AnalysisReport): Promise<Blob> {
    const workbook = new ExcelJS.Workbook();
    
    workbook.creator = 'Bank Statement Analyzer';
    workbook.created = new Date();
    
    // Create all 7 worksheets
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

  private static styleHeader(row: ExcelJS.Row) {
    row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    row.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF203864' }
    };
    row.alignment = { horizontal: 'center', vertical: 'middle' };
  }

  private static createSummarySheet(workbook: ExcelJS.Workbook, report: AnalysisReport) {
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
    
    const headers = ['Month', 'Average Balance (AED)', 'Days', 'Opening Balance', 'Closing Balance'];
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
    const sheet = workbook.addWorksheet('Daily Average Balance');
    
    const headerRow = sheet.addRow(['Date', 'Balance (AED)', 'Month']);
    this.styleHeader(headerRow);
    
    sheet.getColumn(1).width = 15;
    sheet.getColumn(2).width = 20;
    sheet.getColumn(3).width = 20;
    
    report.dailyBalances.forEach(day => {
      sheet.addRow([day.date, day.balance, day.month]);
    });
    
    for (let i = 2; i <= sheet.rowCount; i++) {
      sheet.getCell(`B${i}`).numFmt = '#,##0.00';
    }
  }

  private static createTransactionGroupingSheet(workbook: ExcelJS.Workbook, report: AnalysisReport) {
    const sheet = workbook.addWorksheet('Transaction Grouping');
    
    const headerRow = sheet.addRow(['Date', 'Month', 'Description', 'Category', 'Debit', 'Credit', 'Balance']);
    this.styleHeader(headerRow);
    
    sheet.getColumn(1).width = 15;
    sheet.getColumn(2).width = 18;
    sheet.getColumn(3).width = 40;
    sheet.getColumn(4).width = 25;
    sheet.getColumn(5).width = 15;
    sheet.getColumn(6).width = 15;
    sheet.getColumn(7).width = 18;
    
    report.transactions.forEach(txn => {
      const txnDate = new Date(txn.date);
      sheet.addRow([
        txn.date,
        txnDate.toLocaleString('default', { month: 'long', year: 'numeric' }),
        txn.description,
        txn.category,
        txn.debit || '',
        txn.credit || '',
        txn.balance
      ]);
    });
    
    for (let i = 2; i <= sheet.rowCount; i++) {
      ['E', 'F', 'G'].forEach(col => {
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
    sheet.getCell(`E${totalRow}`).value = { formula: `SUM(E2:E${totalRow - 1})` };
    sheet.getCell(`F${totalRow}`).value = { formula: `SUM(F2:F${totalRow - 1})` };
    ['E', 'F'].forEach(col => {
      sheet.getCell(`${col}${totalRow}`).font = { bold: true };
      sheet.getCell(`${col}${totalRow}`).numFmt = '#,##0.00';
    });
  }

  private static createCategorySummarySheet(workbook: ExcelJS.Workbook, report: AnalysisReport) {
    const sheet = workbook.addWorksheet('Category Summary');
    
    const headerRow = sheet.addRow(['Transaction Category', 'Count', 'Total Debit (AED)', 'Total Credit (AED)', 'Net Amount']);
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
}
