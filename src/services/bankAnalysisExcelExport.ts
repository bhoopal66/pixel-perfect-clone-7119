/**
 * Bank Statement Analysis Excel Export
 * Multi-sheet professional workbook for bank submission & audit
 */
import ExcelJS from 'exceljs';
import type { BankStatementAnalysisResult } from './bankStatementAnalysisEngine';

const HEADER_FILL: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A365D' } };
const HEADER_FONT: Partial<ExcelJS.Font> = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
const TOTAL_FILL: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
const NUM_FMT = '#,##0.00';

function styleHeaders(ws: ExcelJS.Worksheet, colCount: number) {
  const row = ws.getRow(1);
  for (let i = 1; i <= colCount; i++) {
    const cell = row.getCell(i);
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  }
  ws.views = [{ state: 'frozen', ySplit: 1, xSplit: 0 }];
}

function autoWidth(ws: ExcelJS.Worksheet) {
  ws.columns.forEach(col => {
    let max = 12;
    col.eachCell?.({ includeEmpty: false }, cell => {
      const len = cell.value?.toString().length || 0;
      if (len > max) max = Math.min(len + 2, 40);
    });
    col.width = max;
  });
}

export class BankAnalysisExcelExport {
  static async generate(analysis: BankStatementAnalysisResult, companyName?: string): Promise<Blob> {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Taamul Financial Platform';
    wb.created = new Date();

    this.addSummary(wb, analysis, companyName);
    this.addMonthlyAvgBalance(wb, analysis);
    this.addDailyBalance(wb, analysis);
    this.addMonthlyTransactions(wb, analysis);
    this.addTransactionGrouping(wb, analysis);
    this.addCashFlow(wb, analysis);
    this.addChequeReturns(wb, analysis);
    this.addRiskFlags(wb, analysis);
    this.addRawTransactions(wb, analysis);

    const buffer = await wb.xlsx.writeBuffer();
    return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  private static addSummary(wb: ExcelJS.Workbook, a: BankStatementAnalysisResult, company?: string) {
    const ws = wb.addWorksheet('Summary Dashboard');
    ws.columns = [{ width: 30 }, { width: 25 }];

    const rows = [
      ['Bank Statement Analysis Summary', ''],
      ['Company', company || 'N/A'],
      ['Statement Period', a.statementPeriod ? `${a.statementPeriod.from} to ${a.statementPeriod.to}` : 'N/A'],
      ['Total Transactions', a.totalTransactions],
      ['', ''],
      ['Total Credits', a.totalCredits],
      ['Total Debits', a.totalDebits],
      ['Net Cash Flow', a.netCashFlow],
      ['Average Monthly Balance', a.averageMonthlyBalance],
      ['Highest Balance', a.highestBalance],
      ['Lowest Balance', a.lowestBalance],
      ['Total Cheque Returns', a.totalChequeReturns],
      ['Risk Flags Detected', a.riskFlags.length],
    ];

    rows.forEach((r, i) => {
      const row = ws.addRow(r);
      if (i === 0) { row.font = { bold: true, size: 14 }; }
      if (i >= 5 && i <= 11) { row.getCell(2).numFmt = NUM_FMT; }
    });
  }

  private static addMonthlyAvgBalance(wb: ExcelJS.Workbook, a: BankStatementAnalysisResult) {
    const ws = wb.addWorksheet('Monthly Average Balance');
    ws.addRow(['Month', 'Average Balance', 'Minimum Balance', 'Maximum Balance', 'Low Balance Days', 'Negative Balance Days']);
    styleHeaders(ws, 6);
    for (const m of a.monthlyBalances) {
      const row = ws.addRow([m.monthLabel, m.averageBalance, m.minimumBalance, m.maximumBalance, m.lowBalanceDays, m.negativeBalanceDays]);
      [2, 3, 4].forEach(c => { row.getCell(c).numFmt = NUM_FMT; });
    }
    autoWidth(ws);
  }

  private static addDailyBalance(wb: ExcelJS.Workbook, a: BankStatementAnalysisResult) {
    const ws = wb.addWorksheet('Daily Closing Balance');
    ws.addRow(['Date', 'Opening Balance', 'Closing Balance', 'Daily Avg Balance', 'Has Transactions']);
    styleHeaders(ws, 5);
    for (const d of a.dailyBalances) {
      const row = ws.addRow([d.date, d.openingBalance, d.closingBalance, d.dailyAvgBalance, d.hasTransactions ? 'Yes' : 'Carried Forward']);
      [2, 3, 4].forEach(c => { row.getCell(c).numFmt = NUM_FMT; });
      if (!d.hasTransactions) row.getCell(5).font = { italic: true, color: { argb: 'FF999999' } };
    }
    autoWidth(ws);
  }

  private static addMonthlyTransactions(wb: ExcelJS.Workbook, a: BankStatementAnalysisResult) {
    const ws = wb.addWorksheet('Monthly Transaction Summary');
    ws.addRow(['Month', 'Opening Balance', 'Total Credits', 'Total Debits', 'Closing Balance', 'Credit Count', 'Debit Count', 'Net Movement']);
    styleHeaders(ws, 8);
    for (const m of a.monthlyTransactions) {
      const row = ws.addRow([m.monthLabel, m.openingBalance, m.totalCredits, m.totalDebits, m.closingBalance, m.creditCount, m.debitCount, m.netMovement]);
      [2, 3, 4, 5, 8].forEach(c => { row.getCell(c).numFmt = NUM_FMT; });
    }
    autoWidth(ws);
  }

  private static addTransactionGrouping(wb: ExcelJS.Workbook, a: BankStatementAnalysisResult) {
    const ws = wb.addWorksheet('Transaction Grouping');
    ws.addRow(['Month', 'Category', 'Transaction Count', 'Total Debit', 'Total Credit']);
    styleHeaders(ws, 5);
    for (const g of a.categoryGrouping) {
      const row = ws.addRow([g.monthLabel, g.category, g.transactionCount, g.totalDebit, g.totalCredit]);
      [4, 5].forEach(c => { row.getCell(c).numFmt = NUM_FMT; });
    }
    autoWidth(ws);
  }

  private static addCashFlow(wb: ExcelJS.Workbook, a: BankStatementAnalysisResult) {
    const ws = wb.addWorksheet('Cash Flow Analysis');
    ws.addRow(['Month', 'Total Inflow', 'Total Outflow', 'Net Cash Flow', 'Inflow Count', 'Outflow Count', 'Avg Credit', 'Avg Debit']);
    styleHeaders(ws, 8);
    for (const c of a.cashFlow) {
      const row = ws.addRow([c.monthLabel, c.totalInflow, c.totalOutflow, c.netCashFlow, c.inflowCount, c.outflowCount, c.avgCreditAmount, c.avgDebitAmount]);
      [2, 3, 4, 7, 8].forEach(i => { row.getCell(i).numFmt = NUM_FMT; });
    }
    autoWidth(ws);
  }

  private static addChequeReturns(wb: ExcelJS.Workbook, a: BankStatementAnalysisResult) {
    const ws = wb.addWorksheet('Cheque Returns');
    ws.addRow(['Month', 'Inward Count', 'Inward Amount', 'Outward Count', 'Outward Amount', 'Total Count', 'Total Amount']);
    styleHeaders(ws, 7);
    for (const c of a.chequeReturns) {
      const row = ws.addRow([c.monthLabel, c.inwardReturnCount, c.inwardReturnAmount, c.outwardReturnCount, c.outwardReturnAmount, c.totalReturnCount, c.totalReturnAmount]);
      [3, 5, 7].forEach(i => { row.getCell(i).numFmt = NUM_FMT; });
      if (c.totalReturnCount > 0) {
        for (let i = 1; i <= 7; i++) row.getCell(i).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
      }
    }
    autoWidth(ws);
  }

  private static addRiskFlags(wb: ExcelJS.Workbook, a: BankStatementAnalysisResult) {
    const ws = wb.addWorksheet('Risk Flags');
    ws.addRow(['Risk Flag', 'Month', 'Severity', 'Remarks']);
    styleHeaders(ws, 4);
    for (const f of a.riskFlags) {
      const row = ws.addRow([f.riskFlag, f.month, f.severity, f.remarks]);
      const sevCell = row.getCell(3);
      if (f.severity === 'High') sevCell.font = { bold: true, color: { argb: 'FFDC2626' } };
      else if (f.severity === 'Medium') sevCell.font = { color: { argb: 'FFD97706' } };
    }
    autoWidth(ws);
  }

  private static addRawTransactions(wb: ExcelJS.Workbook, a: BankStatementAnalysisResult) {
    const ws = wb.addWorksheet('Raw Transactions (Daily)');
    ws.addRow(['Date', 'Opening Balance', 'Closing Balance', 'Transactions']);
    styleHeaders(ws, 4);
    for (const d of a.dailyBalances) {
      const row = ws.addRow([d.date, d.openingBalance, d.closingBalance, d.hasTransactions ? 'Yes' : 'No']);
      [2, 3].forEach(c => { row.getCell(c).numFmt = NUM_FMT; });
    }
    autoWidth(ws);
  }
}
