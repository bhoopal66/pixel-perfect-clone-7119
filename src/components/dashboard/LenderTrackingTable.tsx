import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Building2, TrendingUp, Clock, RefreshCw, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import type { RAGStatus, ProcessStage } from '@/types/database.types';
import { PROCESS_STAGE_LABELS, getRAGStatusColor } from '@/types/database.types';

interface LenderApplication {
  id: string;
  caseId: string;
  caseNumber: string;
  companyName: string;
  lenderName: string;
  lenderShortCode: string;
  stage: ProcessStage | null;
  status: string;
  ragStatus: RAGStatus;
  daysInStage: number;
  requestedAmount: number | null;
  roName: string | null;
}

interface LenderSummary {
  lenderId: string;
  lenderName: string;
  shortCode: string;
  pending: number;
  active: number;
  approved: number;
  declined: number;
  avgTat: number;
}

async function fetchLenderApplications(): Promise<LenderApplication[]> {
  const { data, error } = await supabase
    .from('case_lender_applications')
    .select(`
      id,
      case_id,
      lender_stage,
      lender_status,
      rag_status,
      days_in_stage,
      requested_amount,
      assigned_ro_name,
      onboarding_cases!case_lender_applications_case_id_fkey(case_number, applicant_businesses(company_legal_name)),
      onboarding_lenders!case_lender_applications_lender_id_fkey(name, short_code)
    `)
    .not('lender_status', 'in', '("Approved","Declined","Dropped")')
    .order('days_in_stage', { ascending: false });

  if (error) throw error;

  return (data || []).map(row => ({
    id: row.id,
    caseId: row.case_id,
    caseNumber: (row.onboarding_cases as any)?.case_number || 'N/A',
    companyName: (row.onboarding_cases as any)?.applicant_businesses?.company_legal_name || 'Unknown',
    lenderName: (row.onboarding_lenders as any)?.name || 'Unknown',
    lenderShortCode: (row.onboarding_lenders as any)?.short_code || '',
    stage: row.lender_stage as ProcessStage | null,
    status: row.lender_status || 'pending',
    ragStatus: (row.rag_status || 'green') as RAGStatus,
    daysInStage: row.days_in_stage || 0,
    requestedAmount: row.requested_amount,
    roName: row.assigned_ro_name
  }));
}

async function fetchLenderSummary(): Promise<LenderSummary[]> {
  const { data: lenders, error: lenderError } = await supabase
    .from('onboarding_lenders')
    .select('id, name, short_code')
    .eq('is_active', true);

  if (lenderError) throw lenderError;

  const { data: applications, error: appError } = await supabase
    .from('case_lender_applications')
    .select('lender_id, lender_status, decision, days_in_stage, lender_stage');

  if (appError) throw appError;

  return (lenders || []).map(lender => {
    const lenderApps = (applications || []).filter(a => a.lender_id === lender.id);
    const pendingApps = lenderApps.filter(a => ['pending', 'email_sent', 'ro_assigned'].includes(a.lender_status || ''));
    const activeApps = lenderApps.filter(a => 
      !['pending', 'Approved', 'Declined', 'Dropped'].includes(a.lender_status || '') &&
      a.lender_stage
    );
    const approvedApps = lenderApps.filter(a => a.decision === 'Approved');
    const declinedApps = lenderApps.filter(a => a.decision === 'Declined');

    const tatDays = lenderApps
      .filter(a => a.days_in_stage)
      .map(a => a.days_in_stage!);

    return {
      lenderId: lender.id,
      lenderName: lender.name,
      shortCode: lender.short_code,
      pending: pendingApps.length,
      active: activeApps.length,
      approved: approvedApps.length,
      declined: declinedApps.length,
      avgTat: tatDays.length > 0
        ? Math.round(tatDays.reduce((a, b) => a + b, 0) / tatDays.length * 10) / 10
        : 0
    };
  }).filter(l => l.pending + l.active + l.approved + l.declined > 0);
}

function RAGIndicator({ status }: { status: RAGStatus }) {
  const colors = {
    green: 'bg-success',
    amber: 'bg-warning',
    red: 'bg-destructive'
  };
  return (
    <div className={`w-3 h-3 rounded-full ${colors[status]}`} title={status} />
  );
}

export function LenderTrackingTable({ onViewCase }: { onViewCase: (caseId: string) => void }) {
  const { data: applications, isLoading: appsLoading, refetch: refetchApps } = useQuery({
    queryKey: ['lender-applications'],
    queryFn: fetchLenderApplications
  });

  const { data: summary, isLoading: summaryLoading, refetch: refetchSummary } = useQuery({
    queryKey: ['lender-summary'],
    queryFn: fetchLenderSummary
  });

  const refetchAll = () => {
    refetchApps();
    refetchSummary();
  };

  const formatAmount = (amount: number | null) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-AE', { 
      style: 'currency', 
      currency: 'AED',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Lender Summary Cards */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Lender Overview
              </CardTitle>
              <CardDescription>Application distribution by lender</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={refetchAll}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {summaryLoading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {(summary || []).map(lender => {
                const total = lender.pending + lender.active + lender.approved + lender.declined;
                const approvalRate = total > 0 ? Math.round(lender.approved / total * 100) : 0;
                
                return (
                  <Card key={lender.lenderId} className="border-l-4 border-l-primary">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-semibold">{lender.lenderName}</p>
                          <p className="text-xs text-muted-foreground">{lender.shortCode}</p>
                        </div>
                        <Badge variant="outline">{total} apps</Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">In Progress</span>
                          <span className="font-medium">{lender.pending + lender.active}</span>
                        </div>
                        <Progress value={approvalRate} className="h-2" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{lender.approved} approved</span>
                          <span>{approvalRate}% rate</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                          <Clock className="h-3 w-3" />
                          <span>Avg TAT: {lender.avgTat} days</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {(summary || []).length === 0 && (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  No lender applications found
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Applications Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Active Lender Applications
          </CardTitle>
          <CardDescription>Track progress of applications with each lender</CardDescription>
        </CardHeader>
        <CardContent>
          {appsLoading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">RAG</TableHead>
                    <TableHead>Case</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Lender</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>RO Assigned</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-center">Days</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(applications || []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                        No active lender applications
                      </TableCell>
                    </TableRow>
                  ) : (
                    (applications || []).map(app => (
                      <TableRow key={app.id} className={app.ragStatus === 'red' ? 'bg-destructive/5' : ''}>
                        <TableCell>
                          <RAGIndicator status={app.ragStatus} />
                        </TableCell>
                        <TableCell className="font-mono text-sm">{app.caseNumber}</TableCell>
                        <TableCell className="font-medium max-w-[200px] truncate">{app.companyName}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{app.lenderShortCode}</Badge>
                        </TableCell>
                        <TableCell>
                          {app.stage ? (
                            <Badge variant="outline">
                              {PROCESS_STAGE_LABELS[app.stage] || app.stage}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">Pending</span>
                          )}
                        </TableCell>
                        <TableCell>{app.roName || <span className="text-muted-foreground">-</span>}</TableCell>
                        <TableCell className="text-right">{formatAmount(app.requestedAmount)}</TableCell>
                        <TableCell className="text-center">
                          <span className={app.daysInStage > 5 ? 'text-destructive font-semibold' : ''}>
                            {app.daysInStage}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => onViewCase(app.caseId)}>
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
