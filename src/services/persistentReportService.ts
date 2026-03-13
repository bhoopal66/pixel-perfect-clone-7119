/**
 * Persistent Report Export Service
 * Wraps existing export functions to also save reports to permanent storage.
 */
import { CaseReportService } from './permanentStorageService';
import { ActivityLogService } from './permanentStorageService';
import type { CaseReportType } from '@/types/permanentStorage.types';
import type { Case } from '@/types/case.types';
import { exportSingleCaseToExcel } from './caseExportService';
import { ExcelGenerator } from './excelGenerator';
import type { AnalysisReport } from '@/types/transaction.types';
import ExcelJS from 'exceljs';
import { PRODUCT_TYPE_LABELS } from '@/types/case.types';

/**
 * Generate and persist a case analysis Excel report
 */
export async function generateAndSaveCaseReport(
  caseData: Case,
  assessmentCaseId: string
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Taamul Case Management';
  workbook.created = new Date();

  const productLabel = PRODUCT_TYPE_LABELS[caseData.product_type] || caseData.product_type;
  const isPOS = caseData.product_type === 'rak_pos' || caseData.product_type === 'wio_pos';

  const sheet = workbook.addWorksheet('Case Report');
  sheet.columns = [
    { header: 'Field', key: 'field', width: 30 },
    { header: 'Value', key: 'value', width: 25 },
    { header: 'Notes', key: 'notes', width: 40 },
  ];

  sheet.addRows([
    { field: '=== CASE ANALYSIS REPORT ===', value: '', notes: '' },
    { field: 'Case Number', value: caseData.case_number || 'N/A', notes: '' },
    { field: 'Client Name', value: caseData.client_name, notes: '' },
    { field: 'Bank Name', value: caseData.bank_name, notes: '' },
    { field: 'Product Type', value: productLabel, notes: '' },
    { field: 'VAT Turnover', value: caseData.vat_turnover, notes: '' },
    { field: 'Declared Turnover', value: caseData.declared_turnover, notes: '' },
    { field: 'Adjusted Turnover', value: caseData.adjusted_turnover, notes: '' },
    { field: 'Variance %', value: `${caseData.variance_percent.toFixed(2)}%`, notes: '' },
    { field: 'Eligible Loan Amount', value: caseData.eligible_loan_amount, notes: '' },
    { field: 'ABCT Fee', value: caseData.abcd_fee_amount, notes: '' },
    { field: 'Eligibility Status', value: caseData.eligibility_status, notes: '' },
    { field: 'Method', value: caseData.eligibility_method, notes: '' },
  ]);

  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

  const fileName = `case_report_${caseData.client_name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;

  // Save to permanent storage
  await CaseReportService.saveReport(
    assessmentCaseId,
    'lender_eligibility_report',
    `Case Report - ${caseData.client_name}`,
    blob,
    fileName,
    'xlsx'
  );

  // Also trigger download
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Generate and persist a bank analysis Excel report
 */
export async function generateAndSaveBankAnalysisReport(
  report: AnalysisReport,
  assessmentCaseId: string
): Promise<void> {
  const blob = await ExcelGenerator.generateReport(report);
  const fileName = `bank_analysis_${report.accountInfo.accountName.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;

  await CaseReportService.saveReport(
    assessmentCaseId,
    'bank_analysis_report',
    `Bank Analysis - ${report.accountInfo.accountName}`,
    blob,
    fileName,
    'xlsx'
  );

  // Also trigger download
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Save any arbitrary report blob to permanent storage + download
 */
export async function saveAndDownloadReport(
  assessmentCaseId: string,
  reportType: CaseReportType,
  reportName: string,
  blob: Blob,
  fileName: string,
  format: 'xlsx' | 'pdf' | 'csv',
  summaryId?: string,
  executionId?: string
): Promise<void> {
  await CaseReportService.saveReport(
    assessmentCaseId,
    reportType,
    reportName,
    blob,
    fileName,
    format,
    summaryId,
    executionId
  );

  // Also trigger download
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}
