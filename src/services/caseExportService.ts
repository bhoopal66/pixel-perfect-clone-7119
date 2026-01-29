import ExcelJS from 'exceljs';
import type { Case } from '@/types/case.types';
import { PRODUCT_TYPE_LABELS } from '@/types/case.types';

export function exportCasesToCSV(cases: Case[], filename: string = 'cases.csv'): void {
  const headers = [
    'Client Name',
    'Bank Name',
    'Product Type',
    'Status',
    'Statement Period From',
    'Statement Period To',
    'VAT Turnover',
    'Declared Turnover',
    'Cash Adjustment',
    'Sister Concern Adjustment',
    'Adjusted Turnover',
    'Variance %',
    'Variance Bucket',
    'Eligible Multiplier',
    'POS Monthly Turnover',
    'POS Annual Turnover',
    'POS Cap Rate',
    'POS Eligible Turnover',
    'Turnover Basis',
    'Eligibility Method',
    'Eligible Loan Amount',
    'ABCT Fee (1%)',
    'Total Payable',
    'Eligibility Status',
    'Created At',
    'Updated At'
  ];

  const rows = cases.map(c => [
    c.client_name,
    c.bank_name,
    PRODUCT_TYPE_LABELS[c.product_type] || c.product_type,
    c.status,
    c.statement_period_from || '',
    c.statement_period_to || '',
    c.vat_turnover,
    c.declared_turnover,
    c.cash_adjustment,
    c.sister_concern_adjustment,
    c.adjusted_turnover,
    c.variance_percent,
    c.variance_bucket,
    c.eligible_multiplier,
    c.pos_monthly_turnover,
    c.pos_annual_turnover,
    c.pos_cap_rate,
    c.pos_eligible_turnover,
    c.turnover_basis,
    c.eligibility_method,
    c.eligible_loan_amount,
    c.abcd_fee_amount,
    c.eligible_loan_amount + c.abcd_fee_amount,
    c.eligibility_status,
    new Date(c.created_at).toLocaleDateString(),
    new Date(c.updated_at).toLocaleDateString()
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => 
      row.map(cell => {
        const cellStr = String(cell ?? '');
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function exportCasesToExcel(cases: Case[], filename: string = 'cases.xlsx'): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Case Management System';
  workbook.created = new Date();

  // Summary Sheet
  const summarySheet = workbook.addWorksheet('Summary');
  summarySheet.columns = [
    { header: 'Metric', key: 'metric', width: 30 },
    { header: 'Value', key: 'value', width: 20 },
  ];

  const statusCounts = cases.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const productCounts = cases.reduce((acc, c) => {
    const label = PRODUCT_TYPE_LABELS[c.product_type] || c.product_type;
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const eligibilityCounts = cases.reduce((acc, c) => {
    acc[c.eligibility_status] = (acc[c.eligibility_status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalEligibleAmount = cases.reduce((sum, c) => sum + c.eligible_loan_amount, 0);
  const totalABCTFees = cases.reduce((sum, c) => sum + c.abcd_fee_amount, 0);

  summarySheet.addRows([
    { metric: 'Total Cases', value: cases.length },
    { metric: '', value: '' },
    { metric: '--- By Product Type ---', value: '' },
    ...Object.entries(productCounts).map(([product, count]) => ({ metric: product, value: count })),
    { metric: '', value: '' },
    { metric: '--- By Status ---', value: '' },
    ...Object.entries(statusCounts).map(([status, count]) => ({ metric: status, value: count })),
    { metric: '', value: '' },
    { metric: '--- By Eligibility ---', value: '' },
    ...Object.entries(eligibilityCounts).map(([status, count]) => ({ metric: status, value: count })),
    { metric: '', value: '' },
    { metric: '--- Totals ---', value: '' },
    { metric: 'Total Eligible Loan Amount', value: totalEligibleAmount },
    { metric: 'Total ABCT Fees (1%)', value: totalABCTFees },
    { metric: 'Total Payable', value: totalEligibleAmount + totalABCTFees },
  ]);

  // Style summary header
  summarySheet.getRow(1).font = { bold: true };
  summarySheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2563EB' },
  };
  summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

  // Cases Sheet
  const casesSheet = workbook.addWorksheet('Cases');
  casesSheet.columns = [
    { header: 'Client Name', key: 'client_name', width: 25 },
    { header: 'Bank', key: 'bank_name', width: 15 },
    { header: 'Product Type', key: 'product_type', width: 20 },
    { header: 'Status', key: 'status', width: 18 },
    { header: 'Period From', key: 'period_from', width: 12 },
    { header: 'Period To', key: 'period_to', width: 12 },
    { header: 'VAT Turnover', key: 'vat_turnover', width: 15 },
    { header: 'Declared Turnover', key: 'declared_turnover', width: 18 },
    { header: 'Cash Adjustment', key: 'cash_adjustment', width: 15 },
    { header: 'Sister Concern Adj', key: 'sister_concern', width: 18 },
    { header: 'Adjusted Turnover', key: 'adjusted_turnover', width: 18 },
    { header: 'Variance %', key: 'variance_percent', width: 12 },
    { header: 'Variance Bucket', key: 'variance_bucket', width: 14 },
    { header: 'Multiplier', key: 'multiplier', width: 12 },
    { header: 'POS Monthly', key: 'pos_monthly', width: 14 },
    { header: 'POS Annual', key: 'pos_annual', width: 14 },
    { header: 'POS Cap Rate', key: 'pos_cap_rate', width: 12 },
    { header: 'POS Eligible', key: 'pos_eligible', width: 14 },
    { header: 'Turnover Basis', key: 'turnover_basis', width: 15 },
    { header: 'Method', key: 'method', width: 18 },
    { header: 'Eligible Loan', key: 'eligible_loan', width: 16 },
    { header: 'ABCT Fee (1%)', key: 'abcd_fee', width: 14 },
    { header: 'Total Payable', key: 'total_payable', width: 15 },
    { header: 'Eligibility Status', key: 'eligibility_status', width: 18 },
    { header: 'Created', key: 'created_at', width: 12 },
  ];

  cases.forEach(c => {
    casesSheet.addRow({
      client_name: c.client_name,
      bank_name: c.bank_name,
      product_type: PRODUCT_TYPE_LABELS[c.product_type] || c.product_type,
      status: c.status,
      period_from: c.statement_period_from || '',
      period_to: c.statement_period_to || '',
      vat_turnover: c.vat_turnover,
      declared_turnover: c.declared_turnover,
      cash_adjustment: c.cash_adjustment,
      sister_concern: c.sister_concern_adjustment,
      adjusted_turnover: c.adjusted_turnover,
      variance_percent: c.variance_percent,
      variance_bucket: c.variance_bucket,
      multiplier: c.eligible_multiplier,
      pos_monthly: c.pos_monthly_turnover,
      pos_annual: c.pos_annual_turnover,
      pos_cap_rate: c.pos_cap_rate,
      pos_eligible: c.pos_eligible_turnover,
      turnover_basis: c.turnover_basis,
      method: c.eligibility_method,
      eligible_loan: c.eligible_loan_amount,
      abcd_fee: c.abcd_fee_amount,
      total_payable: c.eligible_loan_amount + c.abcd_fee_amount,
      eligibility_status: c.eligibility_status,
      created_at: new Date(c.created_at).toLocaleDateString(),
    });
  });

  // Style header
  casesSheet.getRow(1).font = { bold: true };
  casesSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2563EB' },
  };
  casesSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

  // Freeze header row
  casesSheet.views = [{ state: 'frozen', ySplit: 1 }];

  // Add number formatting for currency columns
  const currencyColumns = [
    'vat_turnover', 'declared_turnover', 'cash_adjustment', 'sister_concern',
    'adjusted_turnover', 'pos_monthly', 'pos_annual', 'pos_eligible',
    'turnover_basis', 'eligible_loan', 'abcd_fee', 'total_payable'
  ];
  currencyColumns.forEach(col => {
    const colIndex = casesSheet.columns.findIndex(c => c.key === col) + 1;
    if (colIndex > 0) {
      casesSheet.getColumn(colIndex).numFmt = '#,##0.00';
    }
  });

  // Add percentage formatting
  const percentColumns = ['variance_percent', 'pos_cap_rate'];
  percentColumns.forEach(col => {
    const colIndex = casesSheet.columns.findIndex(c => c.key === col) + 1;
    if (colIndex > 0) {
      casesSheet.getColumn(colIndex).numFmt = '0.00%';
    }
  });

  // Generate and download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
