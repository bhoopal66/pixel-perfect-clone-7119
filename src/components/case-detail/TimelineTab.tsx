import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Clock, Upload, Eye, Edit3, BarChart3, Shield, Brain, Download, CheckCircle2, XCircle, FileText, RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';

interface Props {
  caseId: string;
}

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  document_uploaded: <Upload className="h-4 w-4" />,
  extraction_completed: <Eye className="h-4 w-4" />,
  analyst_adjustment: <Edit3 className="h-4 w-4" />,
  summary_created: <BarChart3 className="h-4 w-4" />,
  summary_approved: <CheckCircle2 className="h-4 w-4" />,
  lender_engine_run: <Shield className="h-4 w-4" />,
  ai_matching_run: <Brain className="h-4 w-4" />,
  report_generated: <Download className="h-4 w-4" />,
  report_regenerated: <RefreshCw className="h-4 w-4" />,
  policy_version_changed: <FileText className="h-4 w-4" />,
  case_approved: <CheckCircle2 className="h-4 w-4" />,
  case_status_changed: <Clock className="h-4 w-4" />,
  document_archived: <XCircle className="h-4 w-4" />,
};

const ACTIVITY_COLORS: Record<string, string> = {
  document_uploaded: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300',
  extraction_completed: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300',
  analyst_adjustment: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300',
  summary_created: 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-300',
  summary_approved: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300',
  lender_engine_run: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300',
  ai_matching_run: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-300',
  report_generated: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-300',
  case_status_changed: 'bg-muted text-muted-foreground',
};

export const TimelineTab: React.FC<Props> = ({ caseId }) => {
  const { data: activities, isLoading } = useQuery({
    queryKey: ['case-activity-log', caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('case_activity_log')
        .select('*')
        .eq('case_id', caseId)
        .order('done_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  if (isLoading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5" />Case Timeline</CardTitle>
        <CardDescription>{activities?.length || 0} events recorded</CardDescription>
      </CardHeader>
      <CardContent>
        {!activities?.length ? (
          <p className="text-sm text-muted-foreground text-center py-8">No activity recorded yet</p>
        ) : (
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-1">
              {activities.map((event: any, index: number) => {
                const icon = ACTIVITY_ICONS[event.activity_type] || <Clock className="h-4 w-4" />;
                const color = ACTIVITY_COLORS[event.activity_type] || 'bg-muted text-muted-foreground';

                return (
                  <div key={event.id} className="flex gap-4 py-3">
                    <div className="relative flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${color}`}>
                        {icon}
                      </div>
                      {index < activities.length - 1 && (
                        <div className="w-px flex-1 bg-border mt-1" />
                      )}
                    </div>
                    <div className="flex-1 pb-2 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{event.activity_description || event.activity_type.replace(/_/g, ' ')}</p>
                          {event.reference_table && (
                            <Badge variant="outline" className="text-[10px] mt-1">
                              {event.reference_table}
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                          {format(new Date(event.done_at), 'dd MMM yyyy, HH:mm')}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
