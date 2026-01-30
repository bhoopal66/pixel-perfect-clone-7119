import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { 
  PipelineMetrics, 
  LenderPerformance, 
  SupervisorPipeline 
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

// Extend jsPDF type to include lastAutoTable
interface jsPDFWithAutoTable extends jsPDF {
  lastAutoTable?: { finalY: number };
}

export class DashboardPdfExportService {
  private static readonly PRIMARY_COLOR: [number, number, number] = [32, 56, 100];
  private static readonly SUCCESS_COLOR: [number, number, number] = [34, 139, 34];
  private static readonly DANGER_COLOR: [number, number, number] = [220, 20, 60];
  private static readonly MUTED_COLOR: [number, number, number] = [100, 100, 100];

  private static formatDateRangeLabel(dateRange?: DateRange): string {
    if (!dateRange?.from && !dateRange?.to) {
      return 'All Data';
    }
    
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    const fromStr = dateRange?.from ? dateRange.from.toLocaleDateString('en-US', options) : 'Start';
    const toStr = dateRange?.to ? dateRange.to.toLocaleDateString('en-US', options) : 'Present';
    return `${fromStr} - ${toStr}`;
  }

  private static getDateRangeSuffix(dateRange?: DateRange): string {
    if (!dateRange?.from && !dateRange?.to) {
      return new Date().toISOString().split('T')[0];
    }
    
    const fromStr = dateRange?.from ? dateRange.from.toISOString().split('T')[0] : 'start';
    const toStr = dateRange?.to ? dateRange.to.toISOString().split('T')[0] : 'now';
    return `${fromStr}_to_${toStr}`;
  }

  /**
   * Export Admin Dashboard to PDF
   */
  static async exportAdminDashboard(data: {
    globalMetrics: GlobalMetrics;
    lenderPerformance: LenderPerformance[];
    supervisorPipelines: SupervisorPipeline[];
    trendData: TrendDataPoint[];
    period: string;
    dateRange?: DateRange;
  }): Promise<void> {
    const doc = new jsPDF('p', 'mm', 'a4') as jsPDFWithAutoTable;
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    this.addHeader(doc, 'Admin Dashboard Report', data.dateRange);
    
    let yPos = 45;

    // Global Metrics Section
    yPos = this.addSectionTitle(doc, 'Global Metrics', yPos);
    yPos = this.addMetricsCards(doc, data.globalMetrics, yPos);
    
    // Add page break if needed
    if (yPos > 200) {
      doc.addPage();
      yPos = 20;
    }

    // Lender Performance Table
    yPos = this.addSectionTitle(doc, 'Lender Performance', yPos + 10);
    yPos = this.addLenderPerformanceTable(doc, data.lenderPerformance, yPos);

    // Add page break if needed
    if (yPos > 200) {
      doc.addPage();
      yPos = 20;
    }

    // Supervisor Pipelines Table
    yPos = this.addSectionTitle(doc, 'Supervisor Pipelines', yPos + 10);
    yPos = this.addSupervisorPipelinesTable(doc, data.supervisorPipelines, yPos);

    // Add page break for trends
    doc.addPage();
    yPos = 20;

    // Trend Data Section with Chart
    yPos = this.addSectionTitle(doc, `Application Trends (${data.period})`, yPos);
    yPos = this.addTrendChart(doc, data.trendData, yPos);
    yPos = this.addTrendDataTable(doc, data.trendData, yPos + 10);

    // Footer on all pages
    this.addFooter(doc);

    // Download
    const dateRangeSuffix = this.getDateRangeSuffix(data.dateRange);
    doc.save(`admin_dashboard_${dateRangeSuffix}.pdf`);
  }

  /**
   * Export Supervisor Dashboard to PDF
   */
  static async exportSupervisorDashboard(data: {
    pipelineMetrics: PipelineMetrics;
    lenderTracking: any[];
    slaData: any[];
    supervisorName?: string;
    dateRange?: DateRange;
  }): Promise<void> {
    const doc = new jsPDF('p', 'mm', 'a4') as jsPDFWithAutoTable;
    
    const title = data.supervisorName 
      ? `Supervisor Dashboard - ${data.supervisorName}`
      : 'Supervisor Dashboard Report';
    
    // Header
    this.addHeader(doc, title, data.dateRange);
    
    let yPos = 45;

    // Pipeline Summary Section
    yPos = this.addSectionTitle(doc, 'Pipeline Summary', yPos);
    yPos = this.addPipelineChart(doc, data.pipelineMetrics, yPos);
    yPos = this.addPipelineTable(doc, data.pipelineMetrics, yPos + 10);

    // Add page break if needed
    if (yPos > 200) {
      doc.addPage();
      yPos = 20;
    }

    // Lender Tracking
    if (data.lenderTracking.length > 0) {
      yPos = this.addSectionTitle(doc, 'Lender Tracking', yPos + 10);
      yPos = this.addLenderTrackingTable(doc, data.lenderTracking, yPos);
    }

    // Add page break if needed
    if (yPos > 200) {
      doc.addPage();
      yPos = 20;
    }

    // SLA Monitoring
    if (data.slaData.length > 0) {
      yPos = this.addSectionTitle(doc, 'SLA Monitoring', yPos + 10);
      yPos = this.addSLATable(doc, data.slaData, yPos);
    }

    // Footer
    this.addFooter(doc);

    // Download
    const dateRangeSuffix = this.getDateRangeSuffix(data.dateRange);
    const namePrefix = data.supervisorName 
      ? `supervisor_dashboard_${data.supervisorName.replace(/\s+/g, '_')}_`
      : 'supervisor_dashboard_';
    doc.save(`${namePrefix}${dateRangeSuffix}.pdf`);
  }

  private static addHeader(doc: jsPDF, title: string, dateRange?: DateRange) {
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header background
    doc.setFillColor(...this.PRIMARY_COLOR);
    doc.rect(0, 0, pageWidth, 30, 'F');
    
    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 14, 15);
    
    // Subtitle with date range
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const dateRangeLabel = this.formatDateRangeLabel(dateRange);
    doc.text(`Date Range: ${dateRangeLabel}`, 14, 23);
    
    // Generated timestamp
    doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - 14, 23, { align: 'right' });
    
    // Reset text color
    doc.setTextColor(0, 0, 0);
  }

  private static addFooter(doc: jsPDFWithAutoTable) {
    const pageCount = doc.getNumberOfPages();
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(...this.MUTED_COLOR);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      doc.text('Dashboard Export', 14, pageHeight - 10);
    }
  }

  private static addSectionTitle(doc: jsPDF, title: string, yPos: number): number {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...this.PRIMARY_COLOR);
    doc.text(title, 14, yPos);
    doc.setTextColor(0, 0, 0);
    return yPos + 8;
  }

  private static addMetricsCards(doc: jsPDF, metrics: GlobalMetrics, yPos: number): number {
    const cardWidth = 42;
    const cardHeight = 25;
    const gap = 4;
    const startX = 14;

    const cards = [
      { label: 'Total Applications', value: metrics.totalApplications.toString(), color: this.PRIMARY_COLOR },
      { label: 'Approved', value: metrics.approved.toString(), color: this.SUCCESS_COLOR },
      { label: 'Declined', value: metrics.declined.toString(), color: this.DANGER_COLOR },
      { label: 'Pending', value: metrics.pending.toString(), color: this.MUTED_COLOR },
    ];

    cards.forEach((card, index) => {
      const x = startX + (cardWidth + gap) * index;
      
      // Card background
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(x, yPos, cardWidth, cardHeight, 2, 2, 'F');
      
      // Value
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...card.color);
      doc.text(card.value, x + cardWidth / 2, yPos + 12, { align: 'center' });
      
      // Label
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...this.MUTED_COLOR);
      doc.text(card.label, x + cardWidth / 2, yPos + 20, { align: 'center' });
    });

    // Second row of cards
    const cards2 = [
      { label: 'Approval Rate', value: `${metrics.avgApprovalRate}%`, color: this.PRIMARY_COLOR },
      { label: 'Avg TAT (days)', value: metrics.avgTAT.toFixed(1), color: this.PRIMARY_COLOR },
      { label: 'Active Lenders', value: metrics.activeLenders.toString(), color: this.PRIMARY_COLOR },
      { label: 'Red Cases', value: metrics.redCases.toString(), color: this.DANGER_COLOR },
    ];

    const yPos2 = yPos + cardHeight + gap;
    cards2.forEach((card, index) => {
      const x = startX + (cardWidth + gap) * index;
      
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(x, yPos2, cardWidth, cardHeight, 2, 2, 'F');
      
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...card.color);
      doc.text(card.value, x + cardWidth / 2, yPos2 + 12, { align: 'center' });
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...this.MUTED_COLOR);
      doc.text(card.label, x + cardWidth / 2, yPos2 + 20, { align: 'center' });
    });

    doc.setTextColor(0, 0, 0);
    return yPos2 + cardHeight + 5;
  }

  private static addLenderPerformanceTable(doc: jsPDFWithAutoTable, lenders: LenderPerformance[], yPos: number): number {
    if (lenders.length === 0) {
      doc.setFontSize(10);
      doc.setTextColor(...this.MUTED_COLOR);
      doc.text('No lender performance data available', 14, yPos + 5);
      return yPos + 15;
    }

    autoTable(doc, {
      startY: yPos,
      head: [['Lender', 'Code', 'Applications', 'Approval %', 'Avg TAT']],
      body: lenders.map(l => [
        l.lender_name,
        l.short_code,
        l.total_applications.toString(),
        `${l.approval_rate}%`,
        `${l.avg_decision_tat} days`
      ]),
      headStyles: {
        fillColor: this.PRIMARY_COLOR,
        fontSize: 9,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 9
      },
      alternateRowStyles: {
        fillColor: [248, 248, 248]
      },
      margin: { left: 14, right: 14 }
    });

    return doc.lastAutoTable?.finalY || yPos + 50;
  }

  private static addSupervisorPipelinesTable(doc: jsPDFWithAutoTable, pipelines: SupervisorPipeline[], yPos: number): number {
    if (pipelines.length === 0) {
      doc.setFontSize(10);
      doc.setTextColor(...this.MUTED_COLOR);
      doc.text('No supervisor pipeline data available', 14, yPos + 5);
      return yPos + 15;
    }

    autoTable(doc, {
      startY: yPos,
      head: [['Supervisor', 'Draft', 'In Process', 'Add. Info', 'Submitted', 'Approved', 'Declined', 'Red Cases']],
      body: pipelines.map(s => [
        s.supervisor_name,
        s.metrics.draft.toString(),
        s.metrics.in_process.toString(),
        s.metrics.additional_info_required.toString(),
        s.metrics.submitted_to_lender.toString(),
        s.metrics.approved.toString(),
        s.metrics.declined.toString(),
        s.red_cases.toString()
      ]),
      headStyles: {
        fillColor: this.PRIMARY_COLOR,
        fontSize: 8,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 8
      },
      alternateRowStyles: {
        fillColor: [248, 248, 248]
      },
      columnStyles: {
        5: { textColor: this.SUCCESS_COLOR },
        7: { textColor: this.DANGER_COLOR, fontStyle: 'bold' }
      },
      margin: { left: 14, right: 14 }
    });

    return doc.lastAutoTable?.finalY || yPos + 50;
  }

  private static addTrendChart(doc: jsPDF, trends: TrendDataPoint[], yPos: number): number {
    if (trends.length === 0) return yPos;

    const chartWidth = 180;
    const chartHeight = 60;
    const startX = 14;
    const maxValue = Math.max(...trends.map(t => t.applications), 1);

    // Chart background
    doc.setFillColor(250, 250, 250);
    doc.rect(startX, yPos, chartWidth, chartHeight, 'F');
    
    // Draw grid lines
    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(0.2);
    for (let i = 0; i <= 4; i++) {
      const y = yPos + (chartHeight / 4) * i;
      doc.line(startX, y, startX + chartWidth, y);
    }

    // Draw bars
    const barWidth = Math.min(8, (chartWidth - 20) / trends.length);
    const gap = (chartWidth - barWidth * trends.length) / (trends.length + 1);

    trends.forEach((point, index) => {
      const x = startX + gap + (barWidth + gap) * index;
      const barHeight = (point.applications / maxValue) * (chartHeight - 15);
      const y = yPos + chartHeight - barHeight - 10;

      // Applications bar
      doc.setFillColor(...this.PRIMARY_COLOR);
      doc.rect(x, y, barWidth * 0.45, barHeight, 'F');

      // Approved bar
      const approvedHeight = (point.approved / maxValue) * (chartHeight - 15);
      doc.setFillColor(...this.SUCCESS_COLOR);
      doc.rect(x + barWidth * 0.5, y + (barHeight - approvedHeight), barWidth * 0.45, approvedHeight, 'F');
    });

    // Legend
    const legendY = yPos + chartHeight + 5;
    doc.setFontSize(7);
    
    doc.setFillColor(...this.PRIMARY_COLOR);
    doc.rect(startX, legendY, 8, 4, 'F');
    doc.setTextColor(0, 0, 0);
    doc.text('Applications', startX + 10, legendY + 3);
    
    doc.setFillColor(...this.SUCCESS_COLOR);
    doc.rect(startX + 45, legendY, 8, 4, 'F');
    doc.text('Approved', startX + 55, legendY + 3);

    return yPos + chartHeight + 15;
  }

  private static addTrendDataTable(doc: jsPDFWithAutoTable, trends: TrendDataPoint[], yPos: number): number {
    if (trends.length === 0) {
      doc.setFontSize(10);
      doc.setTextColor(...this.MUTED_COLOR);
      doc.text('No trend data available', 14, yPos + 5);
      return yPos + 15;
    }

    // Show last 10 entries for PDF
    const recentTrends = trends.slice(-10);

    autoTable(doc, {
      startY: yPos,
      head: [['Date', 'Applications', 'Approved', 'Declined', 'Pending']],
      body: recentTrends.map(t => [
        t.date,
        t.applications.toString(),
        t.approved.toString(),
        t.declined.toString(),
        t.pending.toString()
      ]),
      headStyles: {
        fillColor: this.PRIMARY_COLOR,
        fontSize: 9,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 9
      },
      alternateRowStyles: {
        fillColor: [248, 248, 248]
      },
      columnStyles: {
        2: { textColor: this.SUCCESS_COLOR },
        3: { textColor: this.DANGER_COLOR }
      },
      margin: { left: 14, right: 14 }
    });

    return doc.lastAutoTable?.finalY || yPos + 50;
  }

  private static addPipelineChart(doc: jsPDF, metrics: PipelineMetrics, yPos: number): number {
    const chartWidth = 180;
    const barHeight = 12;
    const startX = 14;

    const stages = [
      { label: 'Draft', value: metrics.draft, color: [156, 163, 175] as [number, number, number] },
      { label: 'In Process', value: metrics.in_process, color: [59, 130, 246] as [number, number, number] },
      { label: 'Additional Info', value: metrics.additional_info_required, color: [245, 158, 11] as [number, number, number] },
      { label: 'Submitted', value: metrics.submitted_to_lender, color: [139, 92, 246] as [number, number, number] },
      { label: 'Approved', value: metrics.approved, color: this.SUCCESS_COLOR },
      { label: 'Declined', value: metrics.declined, color: this.DANGER_COLOR },
    ];

    const maxValue = Math.max(...stages.map(s => s.value), 1);

    stages.forEach((stage, index) => {
      const y = yPos + (barHeight + 4) * index;
      const barWidth = (stage.value / maxValue) * (chartWidth - 60);

      // Label
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);
      doc.text(stage.label, startX, y + 8);

      // Bar background
      doc.setFillColor(240, 240, 240);
      doc.rect(startX + 50, y + 2, chartWidth - 60, barHeight - 4, 'F');

      // Bar
      if (barWidth > 0) {
        doc.setFillColor(...stage.color);
        doc.rect(startX + 50, y + 2, barWidth, barHeight - 4, 'F');
      }

      // Value
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(stage.value.toString(), startX + chartWidth - 5, y + 8, { align: 'right' });
    });

    doc.setFont('helvetica', 'normal');
    return yPos + stages.length * (barHeight + 4) + 5;
  }

  private static addPipelineTable(doc: jsPDFWithAutoTable, metrics: PipelineMetrics, yPos: number): number {
    const data = [
      ['Draft', metrics.draft],
      ['In Process', metrics.in_process],
      ['Additional Info Required', metrics.additional_info_required],
      ['Submitted to Lender', metrics.submitted_to_lender],
      ['Approved', metrics.approved],
      ['Declined', metrics.declined],
      ['On Hold', metrics.on_hold],
      ['Dropped', metrics.dropped],
      ['Closed', metrics.closed],
    ];

    const total = Object.values(metrics).reduce((sum, val) => sum + val, 0);

    autoTable(doc, {
      startY: yPos,
      head: [['Status', 'Count']],
      body: [...data.map(d => [d[0], d[1].toString()]), ['TOTAL', total.toString()]],
      headStyles: {
        fillColor: this.PRIMARY_COLOR,
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 10
      },
      alternateRowStyles: {
        fillColor: [248, 248, 248]
      },
      foot: [],
      margin: { left: 14, right: 100 },
      tableWidth: 80
    });

    return doc.lastAutoTable?.finalY || yPos + 100;
  }

  private static addLenderTrackingTable(doc: jsPDFWithAutoTable, lenderData: any[], yPos: number): number {
    if (lenderData.length === 0) {
      doc.setFontSize(10);
      doc.setTextColor(...this.MUTED_COLOR);
      doc.text('No lender tracking data available', 14, yPos + 5);
      return yPos + 15;
    }

    autoTable(doc, {
      startY: yPos,
      head: [['Lender', 'Submitted', 'In Process', 'Approved', 'Declined', 'Pending']],
      body: lenderData.map(l => [
        l.lender_name || l.name || 'Unknown',
        (l.submitted || 0).toString(),
        (l.in_process || 0).toString(),
        (l.approved || 0).toString(),
        (l.declined || 0).toString(),
        (l.pending || 0).toString()
      ]),
      headStyles: {
        fillColor: this.PRIMARY_COLOR,
        fontSize: 9,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 9
      },
      alternateRowStyles: {
        fillColor: [248, 248, 248]
      },
      margin: { left: 14, right: 14 }
    });

    return doc.lastAutoTable?.finalY || yPos + 50;
  }

  private static addSLATable(doc: jsPDFWithAutoTable, slaData: any[], yPos: number): number {
    if (slaData.length === 0) {
      doc.setFontSize(10);
      doc.setTextColor(...this.MUTED_COLOR);
      doc.text('No SLA monitoring data available', 14, yPos + 5);
      return yPos + 15;
    }

    autoTable(doc, {
      startY: yPos,
      head: [['Case #', 'Company', 'Status', 'Days', 'RAG']],
      body: slaData.map(item => [
        item.case_number || 'N/A',
        (item.company_name || 'Unknown').substring(0, 20),
        item.status || 'N/A',
        (item.days_in_stage || 0).toString(),
        (item.rag_status || 'green').toUpperCase()
      ]),
      headStyles: {
        fillColor: this.PRIMARY_COLOR,
        fontSize: 9,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 8
      },
      alternateRowStyles: {
        fillColor: [248, 248, 248]
      },
      didParseCell: (data) => {
        if (data.column.index === 4 && data.section === 'body') {
          const rag = data.cell.raw?.toString().toLowerCase();
          if (rag === 'red') {
            data.cell.styles.textColor = [255, 255, 255];
            data.cell.styles.fillColor = [255, 107, 107];
            data.cell.styles.fontStyle = 'bold';
          } else if (rag === 'amber') {
            data.cell.styles.fillColor = [255, 217, 61];
            data.cell.styles.fontStyle = 'bold';
          } else {
            data.cell.styles.fillColor = [107, 203, 119];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      },
      margin: { left: 14, right: 14 }
    });

    return doc.lastAutoTable?.finalY || yPos + 50;
  }
}
