import ExcelJS from 'exceljs';
import type { Case } from '@/types/case.types';
import { PRODUCT_TYPE_LABELS } from '@/types/case.types';

// ===== MULTI-CASE EXPORTS (List View) =====

export function exportCasesToCSV(cases: Case[], filename: string = 'cases.csv'): void {
  const headers = [
    'Case Number',
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
    c.case_number || '',
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
  downloadBlob(blob, filename);
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
  styleHeaderRow(summarySheet);

  // Cases Sheet
  const casesSheet = workbook.addWorksheet('Cases');
  casesSheet.columns = getCaseColumns();
  cases.forEach(c => casesSheet.addRow(getCaseRowData(c)));

  // Style header
  styleHeaderRow(casesSheet);
  casesSheet.views = [{ state: 'frozen', ySplit: 1 }];

  // Add number formatting
  applyCurrencyFormatting(casesSheet);

  // Generate and download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  downloadBlob(blob, filename);
}

// ===== SINGLE CASE EXPORTS (Case Report) =====

export async function exportSingleCaseToExcel(caseData: Case, filename?: string): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Case Management System';
  workbook.created = new Date();

  const productLabel = PRODUCT_TYPE_LABELS[caseData.product_type] || caseData.product_type;
  const isPOS = caseData.product_type === 'rak_pos' || caseData.product_type === 'wio_pos';
  const isReverse = caseData.eligibility_method === 'Reverse (ABCT 1%)';

  // Case Report Sheet
  const reportSheet = workbook.addWorksheet('Case Report');
  reportSheet.columns = [
    { header: 'Field', key: 'field', width: 30 },
    { header: 'Value', key: 'value', width: 25 },
    { header: 'Notes', key: 'notes', width: 40 },
  ];

  // Header Section
  reportSheet.addRows([
    { field: '=== CASE ANALYSIS REPORT ===', value: '', notes: '' },
    { field: 'Generated', value: new Date().toLocaleString(), notes: '' },
    { field: '', value: '', notes: '' },
    { field: '--- CLIENT INFORMATION ---', value: '', notes: '' },
    { field: 'Case Number', value: caseData.case_number || 'N/A', notes: '' },
    { field: 'Client Name', value: caseData.client_name, notes: '' },
    { field: 'Bank Name', value: caseData.bank_name, notes: '' },
    { field: 'Product Type', value: productLabel, notes: isPOS ? `${(caseData.pos_cap_rate * 100).toFixed(0)}% POS Cap Applied` : '' },
    { field: 'Case Status', value: caseData.status, notes: '' },
    { field: '', value: '', notes: '' },
    { field: '--- STATEMENT PERIOD ---', value: '', notes: '' },
    { field: 'Period From', value: caseData.statement_period_from || 'N/A', notes: '' },
    { field: 'Period To', value: caseData.statement_period_to || 'N/A', notes: '' },
    { field: '', value: '', notes: '' },
    { field: '--- TURNOVER ANALYSIS ---', value: '', notes: '' },
    { field: 'VAT Turnover', value: caseData.vat_turnover, notes: 'From VAT returns' },
    { field: 'Declared Turnover', value: caseData.declared_turnover, notes: 'Total credits from bank statement' },
    { field: 'Cash Adjustment', value: -caseData.cash_adjustment, notes: 'Deducted (cash deposits)' },
    { field: 'Sister Concern Adjustment', value: -caseData.sister_concern_adjustment, notes: 'Deducted (inter-company transfers)' },
    { field: 'ADJUSTED TURNOVER', value: caseData.adjusted_turnover, notes: 'Declared - Adjustments' },
    { field: '', value: '', notes: '' },
    { field: '--- VARIANCE ANALYSIS ---', value: '', notes: '' },
    { field: 'Variance %', value: `${caseData.variance_percent.toFixed(2)}%`, notes: '(Adjusted - VAT) / VAT × 100' },
    { field: 'Variance Bucket', value: caseData.variance_bucket, notes: caseData.variance_bucket === '≤10%' ? '8× multiplier' : caseData.variance_bucket === '11-25%' ? '1.33× multiplier' : '0× multiplier (or Reverse)' },
    { field: 'Eligible Multiplier', value: `${caseData.eligible_multiplier}×`, notes: '' },
  ]);

  // POS Section (if applicable)
  if (isPOS) {
    reportSheet.addRows([
      { field: '', value: '', notes: '' },
      { field: '--- POS CALCULATIONS ---', value: '', notes: '' },
      { field: 'POS Monthly Turnover', value: caseData.pos_monthly_turnover, notes: 'Monthly card transactions' },
      { field: 'POS Annual Turnover', value: caseData.pos_annual_turnover, notes: 'Monthly × 12' },
      { field: 'POS Cap Rate', value: `${(caseData.pos_cap_rate * 100).toFixed(0)}%`, notes: '' },
      { field: 'Cap on Adjusted Turnover', value: caseData.adjusted_turnover * caseData.pos_cap_rate, notes: '' },
      { field: 'Cap on VAT Turnover', value: caseData.vat_turnover * caseData.pos_cap_rate, notes: '' },
      { field: 'POS Eligible Turnover', value: caseData.pos_eligible_turnover, notes: 'Min(POS Annual, Cap on Adjusted, Cap on VAT)' },
    ]);
  }

  // Eligibility Section
  reportSheet.addRows([
    { field: '', value: '', notes: '' },
    { field: '--- ELIGIBILITY RESULTS ---', value: '', notes: '' },
    { field: 'Eligibility Method', value: caseData.eligibility_method, notes: isReverse ? '⚠️ Normal method failed due to high variance' : '' },
    { field: 'Turnover Basis', value: caseData.turnover_basis, notes: isPOS ? 'POS Eligible Turnover used' : 'Adjusted Turnover used' },
    { field: '', value: '', notes: '' },
    { field: 'ELIGIBLE LOAN AMOUNT', value: caseData.eligible_loan_amount, notes: isReverse ? 'Equals Adjusted Turnover (Reverse Method)' : `Turnover Basis × ${caseData.eligible_multiplier}×` },
    { field: 'ABCT Fee (1%)', value: caseData.abcd_fee_amount, notes: 'Loan Amount × 1%' },
    { field: 'TOTAL PAYABLE', value: caseData.eligible_loan_amount + caseData.abcd_fee_amount, notes: 'Loan + ABCT Fee' },
    { field: '', value: '', notes: '' },
    { field: 'ELIGIBILITY STATUS', value: caseData.eligibility_status, notes: '' },
  ]);

  // Style header row
  styleHeaderRow(reportSheet);

  // Format currency cells
  const currencyRows = [15, 16, 17, 18, 19, 26, 27, 28, 29, 30, 31, 32, 36, 37, 38, 39, 40];
  currencyRows.forEach(rowNum => {
    const cell = reportSheet.getCell(`B${rowNum}`);
    if (typeof cell.value === 'number') {
      cell.numFmt = '#,##0.00';
    }
  });

  // Highlight key result rows
  const highlightRows = [19, 36, 38, 40]; // Adjusted Turnover, Eligible Loan, Total Payable, Status
  highlightRows.forEach(rowNum => {
    const row = reportSheet.getRow(rowNum);
    if (row) {
      row.font = { bold: true };
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF0F9FF' },
      };
    }
  });

  // Generate and download
  const finalFilename = filename || `case_report_${caseData.client_name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  downloadBlob(blob, finalFilename);
}

export function exportSingleCaseToPDF(caseData: Case, filename?: string): void {
  const productLabel = PRODUCT_TYPE_LABELS[caseData.product_type] || caseData.product_type;
  const isPOS = caseData.product_type === 'rak_pos' || caseData.product_type === 'wio_pos';
  const isReverse = caseData.eligibility_method === 'Reverse (ABCT 1%)';

  const formatCurrency = (value: number) => `AED ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Create HTML content for PDF
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Case Analysis Report - ${caseData.case_number || caseData.client_name}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; line-height: 1.5; color: #1a1a1a; padding: 40px; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #2563eb; padding-bottom: 20px; }
        .header h1 { font-size: 24px; color: #1e40af; margin-bottom: 8px; }
        .header .case-number { font-size: 14px; color: #475569; font-family: 'Courier New', monospace; margin-bottom: 8px; }
        .header p { color: #64748b; font-size: 11px; }
        .section { margin-bottom: 24px; }
        .section-title { font-size: 14px; font-weight: 600; color: #1e40af; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .field { margin-bottom: 8px; }
        .field-label { color: #64748b; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
        .field-value { font-size: 14px; font-weight: 500; }
        .field-value.currency { font-family: 'Courier New', monospace; }
        .highlight-box { background: #f0f9ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin-top: 16px; }
        .result-box { background: #ecfdf5; border: 2px solid #10b981; border-radius: 8px; padding: 24px; text-align: center; margin-top: 24px; }
        .result-box.warning { background: #fef3c7; border-color: #f59e0b; }
        .result-box.reverse { background: #fff7ed; border-color: #f97316; }
        .result-amount { font-size: 28px; font-weight: 700; color: #059669; margin-bottom: 8px; }
        .result-label { font-size: 11px; color: #64748b; text-transform: uppercase; }
        .status-badge { display: inline-block; padding: 4px 12px; border-radius: 4px; font-weight: 600; font-size: 11px; }
        .status-eligible { background: #dcfce7; color: #166534; }
        .status-reduced { background: #fef3c7; color: #92400e; }
        .status-reverse { background: #ffedd5; color: #9a3412; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        th, td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
        th { background: #f8fafc; font-weight: 600; font-size: 11px; text-transform: uppercase; color: #475569; }
        td { font-size: 13px; }
        td.currency { font-family: 'Courier New', monospace; text-align: right; }
        tr.highlight { background: #f0f9ff; }
        tr.deduction td { color: #dc2626; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 10px; }
        .alert { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 16px 0; font-size: 11px; }
        .alert.reverse { background: #fff7ed; border-color: #f97316; }
        @media print { body { padding: 20px; } }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Case Analysis Report</h1>
        ${caseData.case_number ? `<div class="case-number">${caseData.case_number}</div>` : ''}
        <p>Generated on ${new Date().toLocaleString()}</p>
      </div>

      <div class="section">
        <div class="section-title">Client Information</div>
        <div class="grid">
          ${caseData.case_number ? `
          <div class="field">
            <div class="field-label">Case Number</div>
            <div class="field-value" style="font-family: 'Courier New', monospace;">${caseData.case_number}</div>
          </div>
          ` : ''}
          <div class="field">
            <div class="field-label">Client Name</div>
            <div class="field-value">${caseData.client_name}</div>
          </div>
          <div class="field">
            <div class="field-label">Bank</div>
            <div class="field-value">${caseData.bank_name}</div>
          </div>
          <div class="field">
            <div class="field-label">Product Type</div>
            <div class="field-value">${productLabel}</div>
          </div>
          <div class="field">
            <div class="field-label">Case Status</div>
            <div class="field-value">${caseData.status}</div>
          </div>
          <div class="field">
            <div class="field-label">Statement Period</div>
            <div class="field-value">${caseData.statement_period_from || 'N/A'} — ${caseData.statement_period_to || 'N/A'}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Turnover Analysis</div>
        <table>
          <tr>
            <th>Description</th>
            <th style="text-align: right;">Amount (AED)</th>
          </tr>
          <tr>
            <td>VAT Turnover (from VAT returns)</td>
            <td class="currency">${formatCurrency(caseData.vat_turnover)}</td>
          </tr>
          <tr>
            <td>Declared Turnover (bank statement credits)</td>
            <td class="currency">${formatCurrency(caseData.declared_turnover)}</td>
          </tr>
          <tr class="deduction">
            <td>Less: Cash Adjustment (deposits)</td>
            <td class="currency">- ${formatCurrency(caseData.cash_adjustment)}</td>
          </tr>
          <tr class="deduction">
            <td>Less: Sister Concern Adjustment</td>
            <td class="currency">- ${formatCurrency(caseData.sister_concern_adjustment)}</td>
          </tr>
          <tr class="highlight">
            <td><strong>Adjusted Turnover</strong></td>
            <td class="currency"><strong>${formatCurrency(caseData.adjusted_turnover)}</strong></td>
          </tr>
        </table>
      </div>

      <div class="section">
        <div class="section-title">Variance Analysis</div>
        <div class="grid">
          <div class="field">
            <div class="field-label">Variance Percentage</div>
            <div class="field-value">${caseData.variance_percent.toFixed(2)}%</div>
          </div>
          <div class="field">
            <div class="field-label">Variance Bucket</div>
            <div class="field-value">${caseData.variance_bucket}</div>
          </div>
          <div class="field">
            <div class="field-label">Eligible Multiplier</div>
            <div class="field-value">${caseData.eligible_multiplier > 0 ? `${caseData.eligible_multiplier}×` : 'N/A'}</div>
          </div>
          <div class="field">
            <div class="field-label">Eligibility Method</div>
            <div class="field-value">${caseData.eligibility_method}</div>
          </div>
        </div>
        ${isReverse ? `
        <div class="alert reverse">
          <strong>⚠️ Reverse (ABCT 1%) Method Applied:</strong> Normal eligibility failed due to variance exceeding 25%. 
          Using ABCT reversal where Loan Amount = Adjusted Turnover.
        </div>
        ` : ''}
      </div>

      ${isPOS ? `
      <div class="section">
        <div class="section-title">POS Calculations (${(caseData.pos_cap_rate * 100).toFixed(0)}% Cap)</div>
        <table>
          <tr>
            <th>Description</th>
            <th style="text-align: right;">Amount (AED)</th>
          </tr>
          <tr>
            <td>POS Monthly Turnover</td>
            <td class="currency">${formatCurrency(caseData.pos_monthly_turnover)}</td>
          </tr>
          <tr>
            <td>POS Annual Turnover (× 12)</td>
            <td class="currency">${formatCurrency(caseData.pos_annual_turnover)}</td>
          </tr>
          <tr>
            <td>Cap on Adjusted Turnover (${(caseData.pos_cap_rate * 100).toFixed(0)}%)</td>
            <td class="currency">${formatCurrency(caseData.adjusted_turnover * caseData.pos_cap_rate)}</td>
          </tr>
          <tr>
            <td>Cap on VAT Turnover (${(caseData.pos_cap_rate * 100).toFixed(0)}%)</td>
            <td class="currency">${formatCurrency(caseData.vat_turnover * caseData.pos_cap_rate)}</td>
          </tr>
          <tr class="highlight">
            <td><strong>POS Eligible Turnover</strong></td>
            <td class="currency"><strong>${formatCurrency(caseData.pos_eligible_turnover)}</strong></td>
          </tr>
        </table>
      </div>
      ` : ''}

      <div class="result-box ${caseData.eligibility_status === 'Eligible (Reduced)' ? 'warning' : ''} ${caseData.eligibility_status === 'Eligible (Reverse)' ? 'reverse' : ''}">
        <div class="result-label">Eligible Loan Amount</div>
        <div class="result-amount">${formatCurrency(caseData.eligible_loan_amount)}</div>
        <div style="margin-top: 16px; display: flex; justify-content: center; gap: 40px;">
          <div>
            <div class="result-label">ABCT Fee (1%)</div>
            <div style="font-size: 16px; font-weight: 600;">${formatCurrency(caseData.abcd_fee_amount)}</div>
          </div>
          <div>
            <div class="result-label">Total Payable</div>
            <div style="font-size: 18px; font-weight: 700;">${formatCurrency(caseData.eligible_loan_amount + caseData.abcd_fee_amount)}</div>
          </div>
        </div>
        <div style="margin-top: 16px;">
          <span class="status-badge ${caseData.eligibility_status === 'Eligible' ? 'status-eligible' : caseData.eligibility_status === 'Eligible (Reduced)' ? 'status-reduced' : 'status-reverse'}">
            ${caseData.eligibility_status}
          </span>
        </div>
      </div>

      <div class="footer">
        <p>This report was auto-generated by the Case Management System</p>
        <p>Case ID: ${caseData.id} | Last Updated: ${new Date(caseData.updated_at).toLocaleString()}</p>
      </div>
    </body>
    </html>
  `;

  // Open print dialog for PDF
  const printWindow = window.open('', '_blank', 'width=800,height=600');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    
    // Wait for content to load, then trigger print
    setTimeout(() => {
      printWindow.print();
    }, 500);
  }
}

// ===== HELPER FUNCTIONS =====

function downloadBlob(blob: Blob, filename: string): void {
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function styleHeaderRow(sheet: ExcelJS.Worksheet): void {
  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  sheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2563EB' },
  };
}

function getCaseColumns(): Partial<ExcelJS.Column>[] {
  return [
    { header: 'Case Number', key: 'case_number', width: 15 },
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
}

function getCaseRowData(c: Case): Record<string, unknown> {
  return {
    case_number: c.case_number || '',
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
  };
}

function applyCurrencyFormatting(sheet: ExcelJS.Worksheet): void {
  const currencyColumns = [
    'vat_turnover', 'declared_turnover', 'cash_adjustment', 'sister_concern',
    'adjusted_turnover', 'pos_monthly', 'pos_annual', 'pos_eligible',
    'turnover_basis', 'eligible_loan', 'abcd_fee', 'total_payable'
  ];
  currencyColumns.forEach(col => {
    const colIndex = sheet.columns.findIndex(c => c.key === col) + 1;
    if (colIndex > 0) {
      sheet.getColumn(colIndex).numFmt = '#,##0.00';
    }
  });

  const percentColumns = ['variance_percent', 'pos_cap_rate'];
  percentColumns.forEach(col => {
    const colIndex = sheet.columns.findIndex(c => c.key === col) + 1;
    if (colIndex > 0) {
      sheet.getColumn(colIndex).numFmt = '0.00%';
    }
  });
}
