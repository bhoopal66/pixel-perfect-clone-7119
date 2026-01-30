import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard,
  Clock,
  Users,
  TrendingUp,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Building2,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { DashboardService } from '@/services/dashboardService';
import { ThemeToggle } from '@/components/ThemeToggle';
import { PipelineVisualization, LenderTrackingTable, SLAMonitoringPanel } from '@/components/dashboard';
import type { PipelineMetrics } from '@/types/dashboard.types';

export default function SupervisorDashboard() {
  const navigate = useNavigate();
  const { user, isSupervisor } = useAuth();

  // Fetch pipeline metrics
  const { data: pipeline, isLoading: pipelineLoading, refetch: refetchPipeline } = useQuery({
    queryKey: ['supervisor-pipeline', user?.id],
    queryFn: () => DashboardService.getPipelineMetrics(isSupervisor ? user?.id : undefined),
    enabled: !!user
  });

  const refetchAll = () => {
    refetchPipeline();
  };

  const handleStatusClick = (status: string) => {
    navigate(`/client-cases?status=${status}`);
  };

  const handleViewCase = (caseId: string) => {
    navigate(`/client-cases/${caseId}`);
  };

  const totalActive = pipeline 
    ? pipeline.in_process + pipeline.additional_info_required + pipeline.submitted_to_lender 
    : 0;

  const defaultMetrics: PipelineMetrics = {
    draft: 0,
    in_process: 0,
    additional_info_required: 0,
    submitted_to_lender: 0,
    approved: 0,
    declined: 0,
    on_hold: 0,
    dropped: 0,
    closed: 0
  };

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
              <div className="p-2 rounded-xl bg-blue-500/10">
                <LayoutDashboard className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <h1 className="text-lg font-bold">Supervisor Dashboard</h1>
                <p className="text-xs text-muted-foreground">Team Pipeline & Performance</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={refetchAll}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm">Active Cases</span>
              </div>
              <p className="text-3xl font-bold">{totalActive}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <span className="text-sm">Pending Review</span>
              </div>
              <p className="text-3xl font-bold text-destructive">{pipeline?.additional_info_required || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <CheckCircle className="h-4 w-4 text-success" />
                <span className="text-sm">Approved</span>
              </div>
              <p className="text-3xl font-bold text-success">{pipeline?.approved || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Clock className="h-4 w-4" />
                <span className="text-sm">Draft</span>
              </div>
              <p className="text-3xl font-bold">{pipeline?.draft || 0}</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="pipeline" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="pipeline" className="gap-2">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Pipeline</span>
            </TabsTrigger>
            <TabsTrigger value="sla" className="gap-2">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">SLA Monitor</span>
            </TabsTrigger>
            <TabsTrigger value="lenders" className="gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Lenders</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pipeline">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LayoutDashboard className="h-5 w-5" />
                  Case Pipeline
                </CardTitle>
                <CardDescription>Click a status card to view cases in that stage</CardDescription>
              </CardHeader>
              <CardContent>
                {pipelineLoading ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <PipelineVisualization
                    metrics={pipeline || defaultMetrics}
                    onStatusClick={handleStatusClick}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sla">
            <SLAMonitoringPanel onViewCase={handleViewCase} />
          </TabsContent>

          <TabsContent value="lenders">
            <LenderTrackingTable onViewCase={handleViewCase} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
