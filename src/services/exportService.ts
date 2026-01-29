import { LoanCase, LENDERS } from '@/types/loanCase.types';
import ExcelJS from 'exceljs';

export function exportToCSV(cases: LoanCase[], filename: string = 'loan_cases.csv'): void {
  const headers = [
    'Case Number',
    'Applicant Name',
    'Phone',
    'Email',
    'Monthly Salary',
    'Employer',
    'Lender',
    'Product Type',
    'Loan Amount',
    'Tenure (Months)',
    'Interest Rate (%)',
    'EMI',
    'Total Interest',
    'Total Payable',
    'Processing Fee',
    'Status',
    'Purpose',
    'Created At',
    'Updated At',
    'Notes'
  ];

  const rows = cases.map(c => [
    c.caseNumber,
    c.applicantName,
    c.applicantPhone,
    c.applicantEmail,
    c.monthlySalary,
    c.employer,
    LENDERS[c.lender]?.name || c.lender,
    c.productType.toUpperCase(),
    c.loanAmount,
    c.tenure,
    c.interestRate,
    c.emi,
    c.totalInterest,
    c.totalPayable,
    c.processingFee,
    c.status,
    c.purpose,
    new Date(c.createdAt).toLocaleDateString(),
    new Date(c.updatedAt).toLocaleDateString(),
    c.notes
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => 
      row.map(cell => {
        const cellStr = String(cell ?? '');
        // Escape quotes and wrap in quotes if contains comma or quote
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

export async function exportToExcel(cases: LoanCase[], filename: string = 'loan_cases.xlsx'): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Loan Case Manager';
  workbook.created = new Date();

  // Summary Sheet
  const summarySheet = workbook.addWorksheet('Summary');
  summarySheet.columns = [
    { header: 'Metric', key: 'metric', width: 25 },
    { header: 'Value', key: 'value', width: 20 },
  ];

  const statusCounts = cases.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const productCounts = cases.reduce((acc, c) => {
    acc[c.productType] = (acc[c.productType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalDisbursed = cases
    .filter(c => c.status === 'disbursed')
    .reduce((sum, c) => sum + c.loanAmount, 0);

  summarySheet.addRows([
    { metric: 'Total Cases', value: cases.length },
    { metric: 'Cash Loans', value: productCounts['cash'] || 0 },
    { metric: 'POS Loans', value: productCounts['pos'] || 0 },
    { metric: '', value: '' },
    { metric: 'Draft', value: statusCounts['draft'] || 0 },
    { metric: 'Submitted', value: statusCounts['submitted'] || 0 },
    { metric: 'Under Review', value: statusCounts['under_review'] || 0 },
    { metric: 'Approved', value: statusCounts['approved'] || 0 },
    { metric: 'Disbursed', value: statusCounts['disbursed'] || 0 },
    { metric: 'Rejected', value: statusCounts['rejected'] || 0 },
    { metric: '', value: '' },
    { metric: 'Total Disbursed Amount', value: totalDisbursed },
  ]);

  // Style summary header
  summarySheet.getRow(1).font = { bold: true };
  summarySheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4F81BD' },
  };
  summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

  // Cases Sheet
  const casesSheet = workbook.addWorksheet('Loan Cases');
  casesSheet.columns = [
    { header: 'Case #', key: 'caseNumber', width: 12 },
    { header: 'Applicant', key: 'applicantName', width: 20 },
    { header: 'Phone', key: 'applicantPhone', width: 15 },
    { header: 'Email', key: 'applicantEmail', width: 25 },
    { header: 'Salary', key: 'monthlySalary', width: 12 },
    { header: 'Employer', key: 'employer', width: 20 },
    { header: 'Lender', key: 'lender', width: 15 },
    { header: 'Type', key: 'productType', width: 8 },
    { header: 'Amount', key: 'loanAmount', width: 12 },
    { header: 'Tenure', key: 'tenure', width: 8 },
    { header: 'Rate %', key: 'interestRate', width: 8 },
    { header: 'EMI', key: 'emi', width: 12 },
    { header: 'Total Interest', key: 'totalInterest', width: 14 },
    { header: 'Total Payable', key: 'totalPayable', width: 14 },
    { header: 'Processing Fee', key: 'processingFee', width: 14 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Purpose', key: 'purpose', width: 20 },
    { header: 'Created', key: 'createdAt', width: 12 },
    { header: 'Notes', key: 'notes', width: 30 },
  ];

  cases.forEach(c => {
    casesSheet.addRow({
      caseNumber: c.caseNumber,
      applicantName: c.applicantName,
      applicantPhone: c.applicantPhone,
      applicantEmail: c.applicantEmail,
      monthlySalary: c.monthlySalary,
      employer: c.employer,
      lender: LENDERS[c.lender]?.name || c.lender,
      productType: c.productType.toUpperCase(),
      loanAmount: c.loanAmount,
      tenure: c.tenure,
      interestRate: c.interestRate,
      emi: c.emi,
      totalInterest: c.totalInterest,
      totalPayable: c.totalPayable,
      processingFee: c.processingFee,
      status: c.status,
      purpose: c.purpose,
      createdAt: new Date(c.createdAt).toLocaleDateString(),
      notes: c.notes,
    });
  });

  // Style header
  casesSheet.getRow(1).font = { bold: true };
  casesSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4F81BD' },
  };
  casesSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

  // Add number formatting for currency columns
  const currencyColumns = ['monthlySalary', 'loanAmount', 'emi', 'totalInterest', 'totalPayable', 'processingFee'];
  currencyColumns.forEach(col => {
    const colIndex = casesSheet.columns.findIndex(c => c.key === col) + 1;
    if (colIndex > 0) {
      casesSheet.getColumn(colIndex).numFmt = '#,##0.00';
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
