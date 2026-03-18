import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, ShieldCheck, FileText, RotateCcw, Download } from 'lucide-react';

interface AuditEntry {
  id: string;
  action_type: string;
  action_label: string;
  action_by: string | null;
  action_at: string;
  remarks: string | null;
  old_value_json: any;
  new_value_json: any;
}

const ACTION_ICONS: Record<string, any> = {
  evaluation_created: FileText,
  override_applied: ShieldCheck,
  inputs_changed: RotateCcw,
  export_generated: Download,
};

interface AuditTimelineProps {
  auditLogs: AuditEntry[];
}

export function AuditTimeline({ auditLogs }: AuditTimelineProps) {
  if (!auditLogs?.length) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">Audit Timeline</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Audit Timeline</CardTitle></CardHeader>
      <CardContent>
        <div className="relative space-y-0">
          {auditLogs.map((log, idx) => {
            const Icon = ACTION_ICONS[log.action_type] || Clock;
            const isLast = idx === auditLogs.length - 1;
            return (
              <div key={log.id} className="relative flex gap-3 pb-4">
                {/* Line */}
                {!isLast && (
                  <div className="absolute left-[11px] top-6 bottom-0 w-px bg-border" />
                )}
                {/* Dot */}
                <div className="relative z-10 flex items-center justify-center w-6 h-6 rounded-full bg-muted border border-border shrink-0 mt-0.5">
                  <Icon className="h-3 w-3 text-muted-foreground" />
                </div>
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground">{log.action_label || log.action_type}</span>
                    <Badge variant="outline" className="text-[10px]">{log.action_type}</Badge>
                  </div>
                  {log.remarks && (
                    <p className="text-xs text-muted-foreground mt-0.5">{log.remarks}</p>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {new Date(log.action_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
