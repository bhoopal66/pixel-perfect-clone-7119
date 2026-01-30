import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, AlertTriangle, CheckCircle, Clock, RefreshCw, Filter } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import type { RAGStatus, CaseStatus, ProcessStage } from '@/types/database.types';
import { PROCESS_STAGE_LABELS, CASE_STATUS_LABELS } from '@/types/database.types';

interface SLAMetrics {
  totalActive: number;
  greenCount: number;
  amberCount: number;
  redCount: number;
  avgDaysInStage: number;
  stageBreakdown: { stage: string; count: number; avgDays: number; redCount: number }[];
}

interface SLACase {
  id: string;
  caseNumber: string;
  companyName: string;
  agentName: string;
  status: CaseStatus;
  stage: ProcessStage | null;
  ragStatus: RAGStatus;
  daysInStage: number;
  actionRequiredBy: string | null;
}

async function fetchSLAMetrics(): Promise<SLAMetrics> {
  const { data, error } = await supabase
    .from('onboarding_cases')
    .select(`
      id,
      status,
      process_stage,
      rag_status,
      days_in_current_stage
    `)
    .not('status', 'in', '("closed","approved","declined","dropped")');

  if (error) throw error;

  const cases = data || [];
  const greenCases = cases.filter(c => c.rag_status === 'green');
  const amberCases = cases.filter(c => c.rag_status === 'amber');
  const redCases = cases.filter(c => c.rag_status === 'red');

  // Group by stage
  const stageMap = new Map<string, { count: number; totalDays: number; redCount: number }>();
  
  cases.forEach(c => {
    const stage = c.process_stage || c.status;
    if (!stageMap.has(stage)) {
      stageMap.set(stage, { count: 0, totalDays: 0, redCount: 0 });
    }
    const stats = stageMap.get(stage)!;
    stats.count++;
    stats.totalDays += c.days_in_current_stage || 0;
    if (c.rag_status === 'red') stats.redCount++;
  });

  const stageBreakdown = Array.from(stageMap.entries())
    .map(([stage, stats]) => ({
      stage,
      count: stats.count,
      avgDays: stats.count > 0 ? Math.round(stats.totalDays / stats.count * 10) / 10 : 0,
      redCount: stats.redCount
    }))
    .sort((a, b) => b.redCount - a.redCount);

  const totalDays = cases.reduce((sum, c) => sum + (c.days_in_current_stage || 0), 0);

  return {
    totalActive: cases.length,
    greenCount: greenCases.length,
    amberCount: amberCases.length,
    redCount: redCases.length,
    avgDaysInStage: cases.length > 0 ? Math.round(totalDays / cases.length * 10) / 10 : 0,
    stageBreakdown
  };
}

async function fetchSLACases(filter: RAGStatus | 'all'): Promise<SLACase[]> {
  let query = supabase
    .from('onboarding_cases')
    .select(`
      id,
      case_number,
      status,
      process_stage,
      rag_status,
      days_in_current_stage,
      action_required_by,
      agents!onboarding_cases_agent_id_fkey(full_name),
      applicant_businesses(company_legal_name)
    `)
    .not('status', 'in', '("closed","approved","declined","dropped")')
    .order('days_in_current_stage', { ascending: false });

  if (filter !== 'all') {
    query = query.eq('rag_status', filter);
  }

  const { data, error } = await query.limit(20);
  if (error) throw error;

  return (data || []).map(row => ({
    id: row.id,
    caseNumber: row.case_number || 'N/A',
    companyName: (row.applicant_businesses as any)?.company_legal_name || 'Unknown',
    agentName: (row.agents as any)?.full_name || 'Unassigned',
    status: row.status as CaseStatus,
    stage: row.process_stage as ProcessStage | null,
    ragStatus: (row.rag_status || 'green') as RAGStatus,
    daysInStage: row.days_in_current_stage || 0,
    actionRequiredBy: row.action_required_by
  }));
}

function RAGCard({ 
  status, 
  count, 
  total, 
  onClick,
  isActive 
}: { 
  status: RAGStatus; 
  count: number; 
  total: number; 
  onClick: () => void;
  isActive: boolean;
}) {
  const config = {
    green: { 
      icon: CheckCircle, 
      label: 'On Track', 
      bgClass: 'bg-success/10 border-success/30',
      textClass: 'text-success',
      progressClass: 'bg-success'
    },
    amber: { 
      icon: AlertTriangle, 
      label: 'At Risk', 
      bgClass: 'bg-warning/10 border-warning/30',
      textClass: 'text-warning',
      progressClass: 'bg-warning'
    },
    red: { 
      icon: AlertCircle, 
      label: 'Overdue', 
      bgClass: 'bg-destructive/10 border-destructive/30',
      textClass: 'text-destructive',
      progressClass: 'bg-destructive'
    }
  };

  const { icon: Icon, label, bgClass, textClass, progressClass } = config[status];
  const percentage = total > 0 ? Math.round(count / total * 100) : 0;

  return (
    <Card 
      className={`cursor-pointer transition-all ${bgClass} ${isActive ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className={`flex items-center gap-2 ${textClass}`}>
            <Icon className="h-5 w-5" />
            <span className="font-medium">{label}</span>
          </div>
          <span className="text-2xl font-bold">{count}</span>
        </div>
        <Progress value={percentage} className={`h-2 ${progressClass}`} />
        <p className="text-xs text-muted-foreground mt-1">{percentage}% of active</p>
      </CardContent>
    </Card>
  );
}

export function SLAMonitoringPanel({ onViewCase }: { onViewCase: (caseId: string) => void }) {
  const [filter, setFilter] = React.useState<RAGStatus | 'all'>('all');

  const { data: metrics, isLoading: metricsLoading, refetch: refetchMetrics } = useQuery({
    queryKey: ['sla-metrics'],
    queryFn: fetchSLAMetrics
  });

  const { data: cases, isLoading: casesLoading, refetch: refetchCases } = useQuery({
    queryKey: ['sla-cases', filter],
    queryFn: () => fetchSLACases(filter)
  });

  const refetchAll = () => {
    refetchMetrics();
    refetchCases();
  };

  const getStageLabel = (stage: string) => {
    return PROCESS_STAGE_LABELS[stage as ProcessStage] || CASE_STATUS_LABELS[stage as CaseStatus] || stage;
  };

  return (
    <div className="space-y-6">
      {/* SLA Summary */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                SLA Monitoring
              </CardTitle>
              <CardDescription>Real-time case aging and performance tracking</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={refetchAll}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {metricsLoading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : metrics ? (
            <div className="space-y-6">
              {/* RAG Distribution */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <RAGCard 
                  status="green" 
                  count={metrics.greenCount} 
                  total={metrics.totalActive}
                  onClick={() => setFilter(filter === 'green' ? 'all' : 'green')}
                  isActive={filter === 'green'}
                />
                <RAGCard 
                  status="amber" 
                  count={metrics.amberCount} 
                  total={metrics.totalActive}
                  onClick={() => setFilter(filter === 'amber' ? 'all' : 'amber')}
                  isActive={filter === 'amber'}
                />
                <RAGCard 
                  status="red" 
                  count={metrics.redCount} 
                  total={metrics.totalActive}
                  onClick={() => setFilter(filter === 'red' ? 'all' : 'red')}
                  isActive={filter === 'red'}
                />
              </div>

              {/* Stage Breakdown */}
              <div>
                <h4 className="text-sm font-medium mb-3">Bottlenecks by Stage</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {metrics.stageBreakdown.slice(0, 8).map(stage => (
                    <div 
                      key={stage.stage}
                      className="p-3 rounded-lg border bg-card"
                    >
                      <p className="text-xs text-muted-foreground truncate">{getStageLabel(stage.stage)}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="font-semibold">{stage.count}</span>
                        {stage.redCount > 0 && (
                          <Badge variant="destructive" className="text-xs px-1.5">
                            {stage.redCount} red
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Avg: {stage.avgDays} days
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Filtered Cases List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                {filter === 'all' ? 'All Active Cases' : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Cases`}
              </CardTitle>
              <CardDescription>Sorted by days in current stage</CardDescription>
            </div>
            <Select value={filter} onValueChange={(v) => setFilter(v as RAGStatus | 'all')}>
              <SelectTrigger className="w-[140px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="red">Red Only</SelectItem>
                <SelectItem value="amber">Amber Only</SelectItem>
                <SelectItem value="green">Green Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {casesLoading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-2">
              {(cases || []).length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No cases matching filter
                </p>
              ) : (
                (cases || []).map(c => (
                  <div 
                    key={c.id}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors ${
                      c.ragStatus === 'red' ? 'border-destructive/30 bg-destructive/5' : 
                      c.ragStatus === 'amber' ? 'border-warning/30 bg-warning/5' : ''
                    }`}
                    onClick={() => onViewCase(c.id)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-3 h-3 rounded-full shrink-0 ${
                        c.ragStatus === 'green' ? 'bg-success' :
                        c.ragStatus === 'amber' ? 'bg-warning' : 'bg-destructive'
                      }`} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">{c.caseNumber}</span>
                          <Badge variant="outline" className="text-xs">
                            {c.stage ? getStageLabel(c.stage) : CASE_STATUS_LABELS[c.status]}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{c.companyName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <p className={`font-semibold ${c.daysInStage > 5 ? 'text-destructive' : ''}`}>
                          {c.daysInStage} days
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {c.actionRequiredBy || 'Pending'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
