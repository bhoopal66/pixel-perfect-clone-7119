import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, FileSpreadsheet, FileText, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { CaseReportService } from '@/services/permanentStorageService';
import { toast } from 'sonner';

interface Props {
  caseId: string;
}

const REPORT_TYPE_LABELS: Record<string, string> = {
  bank_analysis_report: 'Bank Analysis',
  vat_analysis_report: 'VAT Analysis',
  combined_financial_summary_report: 'Financial Summary',
  lender_eligibility_report: 'Lender Eligibility',
  lender_comparison_report: 'Lender Comparison',
  ai_credit_decision_report: 'AI Credit Decision',
  full_case_report: 'Full Case Report',
  excel_export: 'Excel Export',
  pdf_export: 'PDF Export',
};

export const ReportsTab: React.FC<Props> = ({ caseId }) => {
  const [filterType, setFilterType] = React.useState<string>('all');

  const { data: reports, isLoading } = useQuery({
    queryKey: ['case-reports', caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('case_reports')
        .select('*')
        .eq('case_id', caseId)
        .order('generated_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const filteredReports = React.useMemo(() => {
    if (!reports) return [];
    if (filterType === 'all') return reports;
    return reports.filter((r: any) => r.report_type === filterType);
  }, [reports, filterType]);

  const handleDownload = async (filePath: string | null, fileName: string) => {
    if (!filePath) {
      toast.error('File path not available');
      return;
    }
    try {
      const url = await CaseReportService.downloadReport(filePath);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
    } catch (err) {
      toast.error('Failed to download report');
    }
  };

  const formatIcon = (fmt: string) => {
    if (fmt === 'xlsx' || fmt === 'csv') return <FileSpreadsheet className="h-4 w-4 text-emerald-600" />;
    return <FileText className="h-4 w-4 text-red-600" />;
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><Download className="h-5 w-5" />Generated Reports</CardTitle>
            <CardDescription>{reports?.length || 0} reports on file</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[200px] h-8 text-xs">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reports</SelectItem>
                {Object.entries(REPORT_TYPE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!filteredReports.length ? (
          <p className="text-sm text-muted-foreground text-center py-8">No reports generated yet</p>
        ) : (
          <div className="space-y-3">
            {filteredReports.map((report: any) => (
              <div key={report.id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors">
                <div className="flex items-center gap-3">
                  {formatIcon(report.report_format)}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{report.report_name}</p>
                      {report.is_latest && (
                        <Badge className="bg-primary/10 text-primary text-[10px]">Latest</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="text-[10px]">
                        {REPORT_TYPE_LABELS[report.report_type] || report.report_type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">v{report.report_version}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(report.generated_at), 'dd MMM yyyy HH:mm')}
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => handleDownload(report.file_path, report.file_name)}
                >
                  <Download className="h-3 w-3" />
                  Download
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
