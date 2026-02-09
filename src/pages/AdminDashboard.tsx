import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Settings,
  BarChart3,
  Users,
  Building2,
  ArrowLeft,
  TrendingUp,
  RefreshCw,
  Radio,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { DashboardService } from '@/services/dashboardService';
import { LenderService } from '@/services/lenderService';
import { ThemeToggle } from '@/components/ThemeToggle';
import { 
  LenderManagement, 
  GlobalMetricsCards, 
  LenderPerformanceChart,
  SupervisorComparison,
  TrendAnalytics,
  ExportDialog
} from '@/components/admin';
import type { DateRange, ExportFormat } from '@/components/admin';
import { useRealtimeAdmin } from '@/hooks/useRealtimeAdmin';
import { supabase } from '@/integrations/supabase/client';
import { DashboardExportService } from '@/services/dashboardExportService';
import { DashboardPdfExportService } from '@/services/dashboardPdfExportService';
import { toast } from '@/hooks/use-toast';
import type { LenderPerformance, SupervisorPipeline } from '@/types/dashboard.types';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { hasAdminPrivileges } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [trendPeriod, setTrendPeriod] = useState<string>('30d');

  // Enable real-time updates
  useRealtimeAdmin();

  // Fetch supervisor pipelines
  const { data: supervisorPipelines, isLoading: pipelinesLoading, refetch: refetchPipelines, dataUpdatedAt } = useQuery({
    queryKey: ['admin-supervisor-pipelines'],
    queryFn: () => DashboardService.getSupervisorPipelines(),
    enabled: hasAdminPrivileges,
    refetchInterval: 60000,
  });

  // Fetch lender performance
  const { data: lenderPerformance, isLoading: lenderLoading, refetch: refetchLenders } = useQuery({
    queryKey: ['admin-lender-performance'],
    queryFn: () => DashboardService.getLenderPerformance(),
    enabled: hasAdminPrivileges,
    refetchInterval: 60000,
  });

  // Fetch all lenders for config
  const { data: lenders, isLoading: lendersLoading, refetch: refetchLendersList } = useQuery({
    queryKey: ['admin-lenders'],
    queryFn: () => LenderService.getAll(),
    enabled: hasAdminPrivileges,
    refetchInterval: 60000,
  });

  // Fetch global metrics
  const { data: globalMetrics, isLoading: metricsLoading, refetch: refetchMetrics } = useQuery({
    queryKey: ['admin-global-metrics'],
    queryFn: async () => {
      // Get all cases
      const { data: cases } = await supabase
        .from('onboarding_cases')
        .select('status, rag_status');
      
      // Get all agents
      const { data: agents } = await supabase
        .from('agents')
        .select('id')
        .eq('is_active', true);

      const caseList = cases || [];
      const approved = caseList.filter(c => c.status === 'approved').length;
      const declined = caseList.filter(c => c.status === 'declined').length;
      const pending = caseList.filter(c => !['approved', 'declined', 'dropped', 'closed'].includes(c.status)).length;
      const redCases = caseList.filter(c => c.rag_status === 'red').length;

      return {
        totalApplications: caseList.length,
        approved,
        declined,
        pending,
        avgApprovalRate: (approved + declined) > 0 ? Math.round(approved / (approved + declined) * 100) : 0,
        avgTAT: lenderPerformance?.reduce((sum, l) => sum + l.avg_decision_tat, 0) / Math.max(lenderPerformance?.length || 1, 1) || 0,
        activeLenders: lenders?.filter(l => l.is_active).length || 0,
        activeAgents: agents?.length || 0,
        redCases,
        trends: {
          applications: 5, // Placeholder - would need historical data
          approvals: 3,
          tat: -2
        }
      };
    },
    enabled: hasAdminPrivileges && !!lenderPerformance && !!lenders,
    refetchInterval: 60000,
  });

  // Fetch trend data
  const { data: trendData, isLoading: trendsLoading, refetch: refetchTrends } = useQuery({
    queryKey: ['admin-trends', trendPeriod],
    queryFn: async () => {
      const days = trendPeriod === '7d' ? 7 : trendPeriod === '30d' ? 30 : trendPeriod === '90d' ? 90 : 365;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data: cases } = await supabase
        .from('onboarding_cases')
        .select('status, created_at')
        .gte('created_at', startDate.toISOString());

      // Group by date
      const dateMap = new Map<string, { applications: number; approved: number; declined: number; pending: number }>();
      
      (cases || []).forEach(c => {
        const date = new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (!dateMap.has(date)) {
          dateMap.set(date, { applications: 0, approved: 0, declined: 0, pending: 0 });
        }
        const d = dateMap.get(date)!;
        d.applications++;
        if (c.status === 'approved') d.approved++;
        else if (c.status === 'declined') d.declined++;
        else if (!['dropped', 'closed'].includes(c.status)) d.pending++;
      });

      return Array.from(dateMap.entries())
        .map(([date, data]) => ({ date, ...data }))
        .slice(-30); // Last 30 data points max
    },
    enabled: hasAdminPrivileges,
    refetchInterval: 60000,
  });

  const refetchAll = () => {
    refetchPipelines();
    refetchLenders();
    refetchLendersList();
    refetchMetrics();
    refetchTrends();
  };

  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : null;

  const handleExport = async (dateRange: DateRange, format: ExportFormat) => {
    try {
      const exportData = {
        globalMetrics: globalMetrics || {
          totalApplications: 0,
          approved: 0,
          declined: 0,
          pending: 0,
          avgApprovalRate: 0,
          avgTAT: 0,
          activeLenders: 0,
          activeAgents: 0,
          redCases: 0
        },
        lenderPerformance: lenderPerformance || [],
        supervisorPipelines: supervisorPipelines || [],
        trendData: trendData || [],
        period: trendPeriod,
        dateRange
      };

      if (format === 'pdf') {
        await DashboardPdfExportService.exportAdminDashboard(exportData);
      } else {
        await DashboardExportService.exportAdminDashboard(exportData);
      }
      
      toast({
        title: 'Export Complete',
        description: `Dashboard data exported to ${format.toUpperCase()} successfully.`
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export dashboard data.',
        variant: 'destructive'
      });
    }
  };

  // Calculate totals
  const totalApproved = lenderPerformance?.reduce((sum, l) => {
    const approved = Math.round(l.total_applications * l.approval_rate / 100);
    return sum + approved;
  }, 0) || 0;

  const totalApplications = lenderPerformance?.reduce((sum, l) => sum + l.total_applications, 0) || 0;
  
  const avgApprovalRate = totalApplications > 0 
    ? Math.round(totalApproved / totalApplications * 100) 
    : 0;

  const activeLenders = lenders?.filter(l => l.is_active).length || 0;

  if (!hasAdminPrivileges) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-background/80 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="p-2 rounded-xl bg-primary/10">
                <Settings className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold">Admin Dashboard</h1>
                <p className="text-xs text-muted-foreground">Global Analytics & Configuration</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="gap-1.5 text-xs">
                <Radio className="h-3 w-3 text-success animate-pulse" />
                Live
              </Badge>
              {lastUpdated && (
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  Updated: {lastUpdated}
                </span>
              )}
              <Button variant="outline" size="sm" onClick={refetchAll}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <ExportDialog onExport={handleExport} title="Export Admin Dashboard" />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Global Metrics Cards */}
        <GlobalMetricsCards 
          metrics={globalMetrics || {
            totalApplications: 0,
            approved: 0,
            declined: 0,
            pending: 0,
            avgApprovalRate: 0,
            avgTAT: 0,
            activeLenders: lenders?.filter(l => l.is_active).length || 0,
            activeAgents: 0,
            redCases: 0,
            trends: { applications: 0, approvals: 0, tat: 0 }
          }}
          isLoading={metricsLoading}
        />

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-4 w-full max-w-xl">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="supervisors" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Teams</span>
            </TabsTrigger>
            <TabsTrigger value="lenders" className="gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Lenders</span>
            </TabsTrigger>
            <TabsTrigger value="config" className="gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Config</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Trend Analytics */}
            <TrendAnalytics 
              data={trendData || []}
              isLoading={trendsLoading}
              onRefresh={refetchTrends}
              lastUpdated={lastUpdated}
              period={trendPeriod}
              onPeriodChange={setTrendPeriod}
            />

            {/* Lender Performance Chart */}
            <LenderPerformanceChart 
              data={lenderPerformance || []}
              isLoading={lenderLoading}
              onRefresh={refetchLenders}
              lastUpdated={lastUpdated}
            />
          </TabsContent>

          {/* Supervisors Tab */}
          <TabsContent value="supervisors">
            <SupervisorComparison 
              data={supervisorPipelines || []}
              isLoading={pipelinesLoading}
              onRefresh={refetchPipelines}
              lastUpdated={lastUpdated}
            />
          </TabsContent>

          {/* Lenders Performance Tab */}
          <TabsContent value="lenders">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Lender Performance Details
                </CardTitle>
                <CardDescription>Detailed analytics including decline/drop reasons</CardDescription>
              </CardHeader>
              <CardContent>
                {lenderLoading ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Lender</TableHead>
                          <TableHead className="text-center">Applications</TableHead>
                          <TableHead className="text-center">Approval %</TableHead>
                          <TableHead className="text-center">Avg Decision TAT</TableHead>
                          <TableHead>Top Decline Reasons</TableHead>
                          <TableHead>Top Drop Reasons</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(lenderPerformance || []).length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                              No lender performance data
                            </TableCell>
                          </TableRow>
                        ) : (
                          (lenderPerformance || []).map(lender => (
                            <TableRow key={lender.lender_id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{lender.lender_name}</p>
                                  <p className="text-xs text-muted-foreground">{lender.short_code}</p>
                                </div>
                              </TableCell>
                              <TableCell className="text-center font-semibold">{lender.total_applications}</TableCell>
                              <TableCell className="text-center">
                                <Badge variant={lender.approval_rate >= 50 ? 'default' : 'secondary'}>
                                  {lender.approval_rate}%
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">{lender.avg_decision_tat} days</TableCell>
                              <TableCell>
                                {Object.keys(lender.decline_reasons).length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {Object.entries(lender.decline_reasons).slice(0, 2).map(([reason, count]) => (
                                      <Badge key={reason} variant="outline" className="text-xs">
                                        {reason.substring(0, 20)}: {count}
                                      </Badge>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground text-sm">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {Object.keys(lender.drop_reasons).length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {Object.entries(lender.drop_reasons).slice(0, 2).map(([reason, count]) => (
                                      <Badge key={reason} variant="outline" className="text-xs">
                                        {reason.substring(0, 20)}: {count}
                                      </Badge>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground text-sm">-</span>
                                )}
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
          </TabsContent>

          {/* Config Panel Tab */}
          <TabsContent value="config">
            <LenderManagement 
              lenders={lenders || []} 
              isLoading={lendersLoading}
              onRefresh={refetchLendersList}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
