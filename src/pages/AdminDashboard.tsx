import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Settings,
  BarChart3,
  Users,
  Building2,
  ArrowLeft,
  TrendingUp,
  RefreshCw,
  Plus,
  AlertCircle,
  CheckCircle,
  Percent,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/hooks/useAuth';
import { DashboardService } from '@/services/dashboardService';
import { LenderService } from '@/services/lenderService';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LenderManagement } from '@/components/admin/LenderManagement';
import type { LenderPerformance, SupervisorPipeline } from '@/types/dashboard.types';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { hasAdminPrivileges } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Fetch supervisor pipelines
  const { data: supervisorPipelines, isLoading: pipelinesLoading, refetch: refetchPipelines } = useQuery({
    queryKey: ['admin-supervisor-pipelines'],
    queryFn: () => DashboardService.getSupervisorPipelines(),
    enabled: hasAdminPrivileges
  });

  // Fetch lender performance
  const { data: lenderPerformance, isLoading: lenderLoading, refetch: refetchLenders } = useQuery({
    queryKey: ['admin-lender-performance'],
    queryFn: () => DashboardService.getLenderPerformance(),
    enabled: hasAdminPrivileges
  });

  // Fetch all lenders for config
  const { data: lenders, isLoading: lendersLoading, refetch: refetchLendersList } = useQuery({
    queryKey: ['admin-lenders'],
    queryFn: () => LenderService.getAll(),
    enabled: hasAdminPrivileges
  });

  const refetchAll = () => {
    refetchPipelines();
    refetchLenders();
    refetchLendersList();
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
                <BarChart3 className="h-4 w-4" />
                <span className="text-sm">Total Applications</span>
              </div>
              <p className="text-3xl font-bold">{totalApplications}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <CheckCircle className="h-4 w-4 text-success" />
                <span className="text-sm">Approved</span>
              </div>
              <p className="text-3xl font-bold text-success">{totalApproved}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Percent className="h-4 w-4" />
                <span className="text-sm">Avg Approval Rate</span>
              </div>
              <p className="text-3xl font-bold">{avgApprovalRate}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Building2 className="h-4 w-4" />
                <span className="text-sm">Active Lenders</span>
              </div>
              <p className="text-3xl font-bold">{activeLenders}</p>
            </CardContent>
          </Card>
        </div>

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
          <TabsContent value="overview">
            <div className="grid gap-6">
              {/* Lender Performance Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Lender Performance Overview
                  </CardTitle>
                  <CardDescription>Approval rates and decision TAT by lender</CardDescription>
                </CardHeader>
                <CardContent>
                  {lenderLoading ? (
                    <div className="flex justify-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {(lenderPerformance || []).map(lender => (
                        <Card key={lender.lender_id} className="bg-muted/50">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <p className="font-semibold">{lender.lender_name}</p>
                                <p className="text-xs text-muted-foreground">{lender.short_code}</p>
                              </div>
                              <Badge variant={lender.approval_rate >= 50 ? 'default' : 'secondary'}>
                                {lender.approval_rate}% Approval
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <p className="text-muted-foreground">Applications</p>
                                <p className="font-semibold">{lender.total_applications}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Avg TAT</p>
                                <p className="font-semibold">{lender.avg_decision_tat} days</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Supervisors Tab */}
          <TabsContent value="supervisors">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Supervisor-wise Pipeline
                </CardTitle>
                <CardDescription>Team performance across all supervisors</CardDescription>
              </CardHeader>
              <CardContent>
                {pipelinesLoading ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Supervisor</TableHead>
                          <TableHead className="text-center">Draft</TableHead>
                          <TableHead className="text-center">In Process</TableHead>
                          <TableHead className="text-center">Submitted</TableHead>
                          <TableHead className="text-center">Approved</TableHead>
                          <TableHead className="text-center">Declined</TableHead>
                          <TableHead className="text-center">Avg TAT</TableHead>
                          <TableHead className="text-center">Red Cases</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(supervisorPipelines || []).length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                              No supervisor data available
                            </TableCell>
                          </TableRow>
                        ) : (
                          (supervisorPipelines || []).map(sup => (
                            <TableRow key={sup.supervisor_id}>
                              <TableCell className="font-medium">{sup.supervisor_name}</TableCell>
                              <TableCell className="text-center">{sup.metrics.draft}</TableCell>
                              <TableCell className="text-center">{sup.metrics.in_process}</TableCell>
                              <TableCell className="text-center">{sup.metrics.submitted_to_lender}</TableCell>
                              <TableCell className="text-center">
                                <Badge variant="default" className="bg-success/20 text-success">
                                  {sup.metrics.approved}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                {sup.metrics.declined > 0 ? (
                                  <Badge variant="destructive">{sup.metrics.declined}</Badge>
                                ) : (
                                  <span className="text-muted-foreground">0</span>
                                )}
                              </TableCell>
                              <TableCell className="text-center">{sup.avg_tat} days</TableCell>
                              <TableCell className="text-center">
                                {sup.red_cases > 0 ? (
                                  <Badge variant="destructive">{sup.red_cases}</Badge>
                                ) : (
                                  <CheckCircle className="h-4 w-4 text-success mx-auto" />
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
