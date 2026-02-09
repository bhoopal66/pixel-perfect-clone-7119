import ExcelJS from 'exceljs';
import type { 
  PipelineMetrics, 
  LenderPerformance, 
  SupervisorPipeline, 
  AgentProductivity 
} from '@/types/dashboard.types';

export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface GlobalMetrics {
  totalApplications: number;
  approved: number;
  declined: number;
  pending: number;
  avgApprovalRate: number;
  avgTAT: number;
  activeLenders: number;
  activeAgents: number;
  redCases: number;
}

interface TrendDataPoint {
  date: string;
  applications: number;
  approved: number;
  declined: number;
  pending: number;
}

export class DashboardExportService {
  private static styleHeader(row: ExcelJS.Row) {
    row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    row.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF203864' }
    };
    row.alignment = { horizontal: 'center', vertical: 'middle' };
  }

  private static styleSectionHeader(cell: ExcelJS.Cell) {
    cell.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF366092' }
    };
  }

  /**
   * Export Admin Dashboard data to Excel
   */
  static async exportAdminDashboard(data: {
    globalMetrics: GlobalMetrics;
    lenderPerformance: LenderPerformance[];
    supervisorPipelines: SupervisorPipeline[];
    trendData: TrendDataPoint[];
    period: string;
    dateRange?: DateRange;
  }): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Dashboard Export';
    workbook.created = new Date();

    // Create sheets
    this.createGlobalMetricsSheet(workbook, data.globalMetrics, data.dateRange);
    this.createLenderPerformanceSheet(workbook, data.lenderPerformance);
    this.createSupervisorPipelinesSheet(workbook, data.supervisorPipelines);
    this.createTrendDataSheet(workbook, data.trendData, data.period, data.dateRange);

    // Generate filename with date range
    const dateRangeSuffix = this.getDateRangeSuffix(data.dateRange);
    const filename = `admin_dashboard_${dateRangeSuffix}.xlsx`;
    
    // Download
    const buffer = await workbook.xlsx.writeBuffer();
    this.downloadFile(buffer, filename);
  }

  /**
   * Export Supervisor Dashboard data to Excel
   */
  static async exportSupervisorDashboard(data: {
    pipelineMetrics: PipelineMetrics;
    lenderTracking: any[];
    slaData: any[];
    supervisorName?: string;
    dateRange?: DateRange;
  }): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Dashboard Export';
    workbook.created = new Date();

    // Summary sheet
    this.createPipelineSummarySheet(workbook, data.pipelineMetrics, data.supervisorName, data.dateRange);
    this.createLenderTrackingSheet(workbook, data.lenderTracking);
    this.createSLAMonitoringSheet(workbook, data.slaData);

    // Generate filename with date range
    const dateRangeSuffix = this.getDateRangeSuffix(data.dateRange);
    const namePrefix = data.supervisorName 
      ? `supervisor_dashboard_${data.supervisorName.replace(/\s+/g, '_')}_`
      : 'supervisor_dashboard_';
    const filename = `${namePrefix}${dateRangeSuffix}.xlsx`;
    
    // Download
    const buffer = await workbook.xlsx.writeBuffer();
    this.downloadFile(buffer, filename);
  }

  private static getDateRangeSuffix(dateRange?: DateRange): string {
    if (!dateRange?.from && !dateRange?.to) {
      return new Date().toISOString().split('T')[0];
    }
    
    const fromStr = dateRange.from ? dateRange.from.toISOString().split('T')[0] : 'start';
    const toStr = dateRange.to ? dateRange.to.toISOString().split('T')[0] : 'now';
    return `${fromStr}_to_${toStr}`;
  }

  private static formatDateRangeLabel(dateRange?: DateRange): string {
    if (!dateRange?.from && !dateRange?.to) {
      return 'All Data';
    }
    
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    const fromStr = dateRange.from ? dateRange.from.toLocaleDateString('en-US', options) : 'Start';
    const toStr = dateRange.to ? dateRange.to.toLocaleDateString('en-US', options) : 'Present';
    return `${fromStr} - ${toStr}`;
  }

  private static createGlobalMetricsSheet(workbook: ExcelJS.Workbook, metrics: GlobalMetrics, dateRange?: DateRange) {
    const sheet = workbook.addWorksheet('Global Metrics');
    
    sheet.getColumn(1).width = 25;
    sheet.getColumn(2).width = 20;

    // Title
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'ADMIN DASHBOARD - GLOBAL METRICS';
    titleCell.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF203864' }
    };
    sheet.mergeCells('A1:B1');
    sheet.getRow(1).height = 30;

    // Generated timestamp
    sheet.getCell('A2').value = 'Generated:';
    sheet.getCell('B2').value = new Date().toLocaleString();
    sheet.getCell('A2').font = { italic: true };

    // Date range
    sheet.getCell('A3').value = 'Date Range:';
    sheet.getCell('B3').value = this.formatDateRangeLabel(dateRange);
    sheet.getCell('A3').font = { italic: true };

    // Metrics
    let row = 5;
    const metricsData = [
      ['Total Applications', metrics.totalApplications],
      ['Approved', metrics.approved],
      ['Declined', metrics.declined],
      ['Pending', metrics.pending],
      ['', ''],
      ['Approval Rate', `${metrics.avgApprovalRate}%`],
      ['Avg TAT (days)', metrics.avgTAT],
      ['', ''],
      ['Active Lenders', metrics.activeLenders],
      ['Active Agents', metrics.activeAgents],
      ['Red Cases (Urgent)', metrics.redCases]
    ];

    metricsData.forEach(([label, value]) => {
      if (label) {
        sheet.getCell(`A${row}`).value = label as string;
        sheet.getCell(`A${row}`).font = { bold: true };
        sheet.getCell(`B${row}`).value = value;
        
        // Color code certain values
        if (label === 'Approved') {
          sheet.getCell(`B${row}`).font = { color: { argb: 'FF228B22' } };
        } else if (label === 'Declined' || label === 'Red Cases (Urgent)') {
          sheet.getCell(`B${row}`).font = { color: { argb: 'FFDC143C' } };
        }
      }
      row++;
    });
  }

  private static createLenderPerformanceSheet(workbook: ExcelJS.Workbook, lenders: LenderPerformance[]) {
    const sheet = workbook.addWorksheet('Lender Performance');

    const headers = ['Lender', 'Short Code', 'Total Applications', 'Approval Rate (%)', 'Avg TAT (days)'];
    const headerRow = sheet.addRow(headers);
    this.styleHeader(headerRow);

    sheet.getColumn(1).width = 25;
    sheet.getColumn(2).width = 12;
    sheet.getColumn(3).width = 18;
    sheet.getColumn(4).width = 18;
    sheet.getColumn(5).width = 15;

    lenders.forEach(lender => {
      const row = sheet.addRow([
        lender.lender_name,
        lender.short_code,
        lender.total_applications,
        lender.approval_rate,
        lender.avg_decision_tat
      ]);

      // Color code approval rate
      const approvalCell = row.getCell(4);
      if (lender.approval_rate >= 50) {
        approvalCell.font = { color: { argb: 'FF228B22' } };
      } else {
        approvalCell.font = { color: { argb: 'FFDC143C' } };
      }
    });

    // Add totals row
    const totalRow = sheet.rowCount + 1;
    sheet.getCell(`A${totalRow}`).value = 'TOTAL';
    sheet.getCell(`A${totalRow}`).font = { bold: true };
    sheet.getCell(`C${totalRow}`).value = { formula: `SUM(C2:C${totalRow - 1})` };
    sheet.getCell(`C${totalRow}`).font = { bold: true };
    sheet.getCell(`D${totalRow}`).value = { formula: `AVERAGE(D2:D${totalRow - 1})` };
    sheet.getCell(`D${totalRow}`).font = { bold: true };
    sheet.getCell(`D${totalRow}`).numFmt = '0.0';
    sheet.getCell(`E${totalRow}`).value = { formula: `AVERAGE(E2:E${totalRow - 1})` };
    sheet.getCell(`E${totalRow}`).font = { bold: true };
    sheet.getCell(`E${totalRow}`).numFmt = '0.0';
  }

  private static createSupervisorPipelinesSheet(workbook: ExcelJS.Workbook, pipelines: SupervisorPipeline[]) {
    const sheet = workbook.addWorksheet('Supervisor Pipelines');

    const headers = [
      'Supervisor', 
      'Draft', 
      'In Process', 
      'Additional Info', 
      'Submitted', 
      'Approved', 
      'Declined', 
      'Dropped',
      'Avg TAT', 
      'Red Cases'
    ];
    const headerRow = sheet.addRow(headers);
    this.styleHeader(headerRow);

    sheet.getColumn(1).width = 22;
    for (let i = 2; i <= 10; i++) {
      sheet.getColumn(i).width = 14;
    }

    pipelines.forEach(sup => {
      const row = sheet.addRow([
        sup.supervisor_name,
        sup.metrics.draft,
        sup.metrics.in_process,
        sup.metrics.additional_info_required,
        sup.metrics.submitted_to_lender,
        sup.metrics.approved,
        sup.metrics.declined,
        sup.metrics.dropped,
        sup.avg_tat,
        sup.red_cases
      ]);

      // Highlight approved in green
      row.getCell(6).font = { color: { argb: 'FF228B22' } };
      
      // Highlight red cases
      if (sup.red_cases > 0) {
        row.getCell(10).font = { bold: true, color: { argb: 'FFDC143C' } };
        row.getCell(10).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFEAEA' }
        };
      }
    });
  }

  private static createTrendDataSheet(workbook: ExcelJS.Workbook, trends: TrendDataPoint[], period: string, dateRange?: DateRange) {
    const sheet = workbook.addWorksheet('Trend Data');

    // Title with period
    const titleCell = sheet.getCell('A1');
    const dateRangeLabel = this.formatDateRangeLabel(dateRange);
    titleCell.value = `APPLICATION TRENDS - ${period.toUpperCase()} (${dateRangeLabel})`;
    titleCell.font = { bold: true, size: 14 };
    sheet.mergeCells('A1:E1');

    const headers = ['Date', 'Applications', 'Approved', 'Declined', 'Pending'];
    const headerRow = sheet.addRow(headers);
    this.styleHeader(headerRow);

    sheet.getColumn(1).width = 15;
    sheet.getColumn(2).width = 14;
    sheet.getColumn(3).width = 12;
    sheet.getColumn(4).width = 12;
    sheet.getColumn(5).width = 12;

    trends.forEach(t => {
      sheet.addRow([t.date, t.applications, t.approved, t.declined, t.pending]);
    });

    // Summary row
    const summaryRow = sheet.rowCount + 2;
    sheet.getCell(`A${summaryRow}`).value = 'TOTALS';
    sheet.getCell(`A${summaryRow}`).font = { bold: true };
    sheet.getCell(`B${summaryRow}`).value = { formula: `SUM(B3:B${summaryRow - 2})` };
    sheet.getCell(`C${summaryRow}`).value = { formula: `SUM(C3:C${summaryRow - 2})` };
    sheet.getCell(`D${summaryRow}`).value = { formula: `SUM(D3:D${summaryRow - 2})` };
    sheet.getCell(`E${summaryRow}`).value = { formula: `SUM(E3:E${summaryRow - 2})` };
    for (let col = 1; col <= 5; col++) {
      sheet.getCell(summaryRow, col).font = { bold: true };
    }
  }

  private static createPipelineSummarySheet(workbook: ExcelJS.Workbook, metrics: PipelineMetrics, supervisorName?: string, dateRange?: DateRange) {
    const sheet = workbook.addWorksheet('Pipeline Summary');

    sheet.getColumn(1).width = 25;
    sheet.getColumn(2).width = 15;

    // Title
    const titleCell = sheet.getCell('A1');
    titleCell.value = supervisorName 
      ? `PIPELINE SUMMARY - ${supervisorName.toUpperCase()}`
      : 'PIPELINE SUMMARY';
    titleCell.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF203864' }
    };
    sheet.mergeCells('A1:B1');
    sheet.getRow(1).height = 30;

    // Timestamp
    sheet.getCell('A2').value = 'Generated:';
    sheet.getCell('B2').value = new Date().toLocaleString();

    // Date range
    sheet.getCell('A3').value = 'Date Range:';
    sheet.getCell('B3').value = this.formatDateRangeLabel(dateRange);

    // Pipeline data
    let row = 5;
    const pipelineData = [
      ['Draft', metrics.draft],
      ['In Process', metrics.in_process],
      ['Additional Info Required', metrics.additional_info_required],
      ['Submitted to Lender', metrics.submitted_to_lender],
      ['Approved', metrics.approved],
      ['Declined', metrics.declined],
      ['On Hold', metrics.on_hold],
      ['Dropped', metrics.dropped],
      ['Closed', metrics.closed]
    ];

    pipelineData.forEach(([label, value]) => {
      sheet.getCell(`A${row}`).value = label as string;
      sheet.getCell(`A${row}`).font = { bold: true };
      sheet.getCell(`B${row}`).value = value as number;
      row++;
    });

    // Total
    sheet.getCell(`A${row}`).value = 'TOTAL';
    sheet.getCell(`A${row}`).font = { bold: true };
    sheet.getCell(`B${row}`).value = { formula: `SUM(B4:B${row - 1})` };
    sheet.getCell(`B${row}`).font = { bold: true };
  }

  private static createLenderTrackingSheet(workbook: ExcelJS.Workbook, lenderData: any[]) {
    const sheet = workbook.addWorksheet('Lender Tracking');

    const headers = ['Lender', 'Submitted', 'In Process', 'Approved', 'Declined', 'Pending'];
    const headerRow = sheet.addRow(headers);
    this.styleHeader(headerRow);

    sheet.getColumn(1).width = 22;
    for (let i = 2; i <= 6; i++) {
      sheet.getColumn(i).width = 14;
    }

    lenderData.forEach(l => {
      sheet.addRow([
        l.lender_name || l.name,
        l.submitted || 0,
        l.in_process || 0,
        l.approved || 0,
        l.declined || 0,
        l.pending || 0
      ]);
    });
  }

  private static createSLAMonitoringSheet(workbook: ExcelJS.Workbook, slaData: any[]) {
    const sheet = workbook.addWorksheet('SLA Monitoring');

    const headers = ['Case #', 'Company', 'Status', 'Stage', 'Days in Stage', 'RAG Status', 'Action Required'];
    const headerRow = sheet.addRow(headers);
    this.styleHeader(headerRow);

    sheet.getColumn(1).width = 12;
    sheet.getColumn(2).width = 25;
    sheet.getColumn(3).width = 18;
    sheet.getColumn(4).width = 18;
    sheet.getColumn(5).width = 14;
    sheet.getColumn(6).width = 12;
    sheet.getColumn(7).width = 18;

    slaData.forEach(item => {
      const row = sheet.addRow([
        item.case_number,
        item.company_name,
        item.status,
        item.current_stage || 'N/A',
        item.days_in_stage,
        item.rag_status?.toUpperCase() || 'GREEN',
        item.action_required_by || 'None'
      ]);

      // Color code RAG status
      const ragCell = row.getCell(6);
      const ragStatus = item.rag_status?.toLowerCase();
      if (ragStatus === 'red') {
        ragCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF6B6B' } };
        ragCell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      } else if (ragStatus === 'amber') {
        ragCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFD93D' } };
        ragCell.font = { bold: true };
      } else {
        ragCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6BCB77' } };
        ragCell.font = { bold: true };
      }
    });
  }

  private static downloadFile(buffer: ExcelJS.Buffer, filename: string) {
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
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
}
