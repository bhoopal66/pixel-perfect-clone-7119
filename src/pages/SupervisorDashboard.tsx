import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Clock,
  Users,
  TrendingUp,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/hooks/useAuth';
import { DashboardService } from '@/services/dashboardService';
import { ThemeToggle } from '@/components/ThemeToggle';
import { STATUS_LABELS, PROCESS_STAGE_LABELS } from '@/types/dashboard.types';
import type { PipelineMetrics, StageAgingRecord, AgentProductivity, ROAccountability } from '@/types/dashboard.types';

const statusCards = [
  { key: 'draft', label: 'Draft', color: 'bg-muted text-muted-foreground' },
  { key: 'in_process', label: 'In Process', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200' },
  { key: 'additional_info_required', label: 'Info Required', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200' },
  { key: 'submitted_to_lender', label: 'Submitted', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200' },
  { key: 'approved', label: 'Approved', color: 'bg-success/20 text-success' },
  { key: 'declined', label: 'Declined', color: 'bg-destructive/20 text-destructive' },
  { key: 'on_hold', label: 'On Hold', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200' },
  { key: 'dropped', label: 'Dropped', color: 'bg-muted text-muted-foreground' },
];

function RAGBadge({ status }: { status: 'green' | 'amber' | 'red' }) {
  const config = {
    green: { icon: CheckCircle, className: 'bg-success/20 text-success', label: 'On Track' },
    amber: { icon: AlertTriangle, className: 'bg-warning/20 text-warning', label: 'At Risk' },
    red: { icon: AlertCircle, className: 'bg-destructive/20 text-destructive', label: 'Overdue' }
  };
  const { icon: Icon, className, label } = config[status];
  return (
    <Badge variant="outline" className={`gap-1 ${className}`}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}

function PipelineCard({ label, count, color, onClick }: { label: string; count: number; color: string; onClick: () => void }) {
  return (
    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
        <CardContent className="p-4">
          <div className={`inline-flex px-2 py-1 rounded-md text-xs font-medium mb-2 ${color}`}>
            {label}
          </div>
          <p className="text-3xl font-bold">{count}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function SupervisorDashboard() {
  const navigate = useNavigate();
  const { user, isSupervisor, hasAdminPrivileges } = useAuth();

  // Fetch pipeline metrics
  const { data: pipeline, isLoading: pipelineLoading, refetch: refetchPipeline } = useQuery({
    queryKey: ['supervisor-pipeline', user?.id],
    queryFn: () => DashboardService.getPipelineMetrics(isSupervisor ? user?.id : undefined),
    enabled: !!user
  });

  // Fetch stage aging
  const { data: stageAging, isLoading: agingLoading, refetch: refetchAging } = useQuery({
    queryKey: ['supervisor-aging', user?.id],
    queryFn: () => DashboardService.getStageAging(isSupervisor ? user?.id : undefined),
    enabled: !!user
  });

  // Fetch agent productivity
  const { data: agentProductivity, isLoading: productivityLoading, refetch: refetchProductivity } = useQuery({
    queryKey: ['supervisor-productivity', user?.id],
    queryFn: () => DashboardService.getAgentProductivity(isSupervisor ? user?.id : undefined),
    enabled: !!user
  });

  // Fetch RO accountability
  const { data: roAccountability, isLoading: roLoading, refetch: refetchRO } = useQuery({
    queryKey: ['ro-accountability'],
    queryFn: () => DashboardService.getROAccountability(),
    enabled: !!user
  });

  const refetchAll = () => {
    refetchPipeline();
    refetchAging();
    refetchProductivity();
    refetchRO();
  };

  const handlePipelineClick = (status: string) => {
    // Navigate to cases list filtered by status
    navigate(`/?status=${status}`);
  };

  const totalActive = pipeline 
    ? pipeline.in_process + pipeline.additional_info_required + pipeline.submitted_to_lender 
    : 0;
  
  const redCases = stageAging?.filter(c => c.rag_status === 'red').length || 0;

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
                <span className="text-sm">Red Cases</span>
              </div>
              <p className="text-3xl font-bold text-destructive">{redCases}</p>
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
                <span className="text-sm">Pending</span>
              </div>
              <p className="text-3xl font-bold">{pipeline?.draft || 0}</p>
            </CardContent>
          </Card>
        </div>

        {/* Pipeline Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LayoutDashboard className="h-5 w-5" />
              Pipeline Overview
            </CardTitle>
            <CardDescription>Click a card to view cases in that status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              {statusCards.map(card => (
                <PipelineCard
                  key={card.key}
                  label={card.label}
                  count={(pipeline as any)?.[card.key] || 0}
                  color={card.color}
                  onClick={() => handlePipelineClick(card.key)}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tabs for detailed views */}
        <Tabs defaultValue="aging" className="space-y-4">
          <TabsList>
            <TabsTrigger value="aging" className="gap-2">
              <Clock className="h-4 w-4" />
              Stage Aging & RAG
            </TabsTrigger>
            <TabsTrigger value="ro" className="gap-2">
              <Users className="h-4 w-4" />
              RO Accountability
            </TabsTrigger>
            <TabsTrigger value="agents" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Agent Productivity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="aging">
            <Card>
              <CardHeader>
                <CardTitle>Stage Aging & RAG Status</CardTitle>
                <CardDescription>Monitor case progress and identify bottlenecks</CardDescription>
              </CardHeader>
              <CardContent>
                {agingLoading ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Case ID</TableHead>
                          <TableHead>Company</TableHead>
                          <TableHead>Agent</TableHead>
                          <TableHead>Current Stage</TableHead>
                          <TableHead className="text-center">Days</TableHead>
                          <TableHead>RAG</TableHead>
                          <TableHead>Action By</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(stageAging || []).length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                              No active cases found
                            </TableCell>
                          </TableRow>
                        ) : (
                          (stageAging || []).map(record => (
                            <TableRow key={record.case_id} className={record.rag_status === 'red' ? 'bg-destructive/5' : ''}>
                              <TableCell className="font-mono text-sm">{record.case_number}</TableCell>
                              <TableCell className="font-medium">{record.company_name}</TableCell>
                              <TableCell>{record.agent_name}</TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {record.current_stage 
                                    ? PROCESS_STAGE_LABELS[record.current_stage] || record.current_stage 
                                    : STATUS_LABELS[record.status] || record.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center font-semibold">{record.days_in_stage}</TableCell>
                              <TableCell><RAGBadge status={record.rag_status} /></TableCell>
                              <TableCell className="capitalize">{record.action_required_by || '-'}</TableCell>
                              <TableCell>
                                <Button variant="ghost" size="sm" onClick={() => navigate(`/client-cases/${record.case_id}`)}>
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
          </TabsContent>

          <TabsContent value="ro">
            <Card>
              <CardHeader>
                <CardTitle>RO-wise Accountability</CardTitle>
                <CardDescription>Bank Relationship Officer performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                {roLoading ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>RO Name</TableHead>
                          <TableHead className="text-center">Pending</TableHead>
                          <TableHead className="text-center">Avg TAT</TableHead>
                          <TableHead className="text-center">Red Cases</TableHead>
                          <TableHead className="text-center">Approval Rate</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(roAccountability || []).length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                              No RO data available
                            </TableCell>
                          </TableRow>
                        ) : (
                          (roAccountability || []).map(ro => (
                            <TableRow key={ro.ro_name}>
                              <TableCell className="font-medium">{ro.ro_name}</TableCell>
                              <TableCell className="text-center">{ro.pending_cases}</TableCell>
                              <TableCell className="text-center">{ro.avg_tat_days} days</TableCell>
                              <TableCell className="text-center">
                                {ro.red_cases > 0 ? (
                                  <Badge variant="destructive">{ro.red_cases}</Badge>
                                ) : (
                                  <span className="text-muted-foreground">0</span>
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant={ro.approval_rate >= 70 ? 'default' : 'secondary'}>
                                  {ro.approval_rate}%
                                </Badge>
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

          <TabsContent value="agents">
            <Card>
              <CardHeader>
                <CardTitle>Agent Productivity</CardTitle>
                <CardDescription>Track agent performance and case handling</CardDescription>
              </CardHeader>
              <CardContent>
                {productivityLoading ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Agent</TableHead>
                          <TableHead className="text-center">Created</TableHead>
                          <TableHead className="text-center">Submitted</TableHead>
                          <TableHead className="text-center">Approved</TableHead>
                          <TableHead className="text-center">Avg Days to Submit</TableHead>
                          <TableHead>Top Drop Reasons</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(agentProductivity || []).length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                              No agent data available
                            </TableCell>
                          </TableRow>
                        ) : (
                          (agentProductivity || []).map(agent => (
                            <TableRow key={agent.agent_id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{agent.agent_name}</p>
                                  <p className="text-xs text-muted-foreground">{agent.agent_code}</p>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">{agent.cases_created}</TableCell>
                              <TableCell className="text-center">{agent.cases_submitted}</TableCell>
                              <TableCell className="text-center">
                                <Badge variant={agent.cases_approved > 0 ? 'default' : 'secondary'}>
                                  {agent.cases_approved}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">{agent.avg_days_to_submit} days</TableCell>
                              <TableCell>
                                {Object.keys(agent.drop_reasons).length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {Object.entries(agent.drop_reasons).slice(0, 2).map(([reason, count]) => (
                                      <Badge key={reason} variant="outline" className="text-xs">
                                        {reason}: {count}
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
        </Tabs>
      </main>
    </div>
  );
}
