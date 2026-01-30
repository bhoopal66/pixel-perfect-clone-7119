import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Users, Pencil, UserX, UserCheck, Mail, Phone, Search, RefreshCw, TrendingUp, Briefcase } from 'lucide-react';
import { format } from 'date-fns';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Agent {
  id: string;
  agent_code: string;
  full_name: string;
  email: string;
  telephone: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AgentPerformance {
  agent_code: string;
  full_name: string;
  cases_count: number;
  total_loan_amount: number;
}

const agentSchema = z.object({
  full_name: z.string().trim().min(2, 'Full name must be at least 2 characters').max(100, 'Full name must be less than 100 characters'),
  email: z.string().trim().email('Invalid email address').max(255, 'Email must be less than 255 characters'),
  telephone: z.string().trim().min(7, 'Telephone must be at least 7 digits').max(20, 'Telephone must be less than 20 characters').regex(/^[+]?[\d\s()-]+$/, 'Invalid telephone format')
});

type AgentFormData = z.infer<typeof agentSchema>;

export default function AgentManagement() {
  const { isAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [filteredAgents, setFilteredAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [togglingAgentId, setTogglingAgentId] = useState<string | null>(null);
  const [performanceData, setPerformanceData] = useState<AgentPerformance[]>([]);
  const [isLoadingPerformance, setIsLoadingPerformance] = useState(true);

  const form = useForm<AgentFormData>({
    resolver: zodResolver(agentSchema),
    defaultValues: {
      full_name: '',
      email: '',
      telephone: ''
    }
  });

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      toast.error('Access denied', { description: 'Admin privileges required' });
      navigate('/');
    }
  }, [authLoading, isAdmin, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchAgents();
      fetchPerformanceData();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredAgents(agents);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredAgents(
        agents.filter(
          agent =>
            agent.full_name.toLowerCase().includes(query) ||
            agent.agent_code.toLowerCase().includes(query) ||
            agent.email.toLowerCase().includes(query) ||
            agent.telephone.includes(query)
        )
      );
    }
  }, [searchQuery, agents]);

  const fetchAgents = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching agents:', error);
      toast.error('Failed to load agents');
    } else {
      setAgents(data || []);
      setFilteredAgents(data || []);
    }
    setIsLoading(false);
  };

  const fetchPerformanceData = async () => {
    setIsLoadingPerformance(true);
    try {
      // Fetch cases grouped by agent_reference
      const { data: cases, error: casesError } = await supabase
        .from('cases')
        .select('agent_reference, eligible_loan_amount');

      if (casesError) throw casesError;

      // Fetch all agents to map codes to names
      const { data: agentsData, error: agentsError } = await supabase
        .from('agents')
        .select('agent_code, full_name');

      if (agentsError) throw agentsError;

      // Create a map of agent codes to names
      const agentMap = new Map<string, string>();
      agentsData?.forEach(agent => {
        agentMap.set(agent.agent_code, agent.full_name);
      });

      // Aggregate cases by agent
      const aggregated = new Map<string, { cases_count: number; total_loan_amount: number }>();
      
      cases?.forEach(c => {
        if (c.agent_reference) {
          const existing = aggregated.get(c.agent_reference) || { cases_count: 0, total_loan_amount: 0 };
          aggregated.set(c.agent_reference, {
            cases_count: existing.cases_count + 1,
            total_loan_amount: existing.total_loan_amount + (c.eligible_loan_amount || 0)
          });
        }
      });

      // Convert to array and add agent names
      const performanceArray: AgentPerformance[] = [];
      aggregated.forEach((value, key) => {
        performanceArray.push({
          agent_code: key,
          full_name: agentMap.get(key) || key,
          cases_count: value.cases_count,
          total_loan_amount: value.total_loan_amount
        });
      });

      // Sort by cases count descending
      performanceArray.sort((a, b) => b.cases_count - a.cases_count);

      setPerformanceData(performanceArray);
    } catch (error) {
      console.error('Error fetching performance data:', error);
    } finally {
      setIsLoadingPerformance(false);
    }
  };

  const handleEditClick = (agent: Agent) => {
    setEditingAgent(agent);
    form.reset({
      full_name: agent.full_name,
      email: agent.email,
      telephone: agent.telephone
    });
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = async (data: AgentFormData) => {
    if (!editingAgent) return;

    setIsSubmitting(true);
    const { error } = await supabase
      .from('agents')
      .update({
        full_name: data.full_name,
        email: data.email,
        telephone: data.telephone,
        updated_at: new Date().toISOString()
      })
      .eq('id', editingAgent.id);

    if (error) {
      console.error('Error updating agent:', error);
      toast.error('Failed to update agent', { description: error.message });
    } else {
      toast.success('Agent updated successfully');
      setAgents(agents.map(a =>
        a.id === editingAgent.id
          ? { ...a, full_name: data.full_name, email: data.email, telephone: data.telephone }
          : a
      ));
      setIsEditDialogOpen(false);
      setEditingAgent(null);
    }
    setIsSubmitting(false);
  };

  const handleToggleActive = async (agent: Agent) => {
    setTogglingAgentId(agent.id);
    const newStatus = !agent.is_active;

    const { error } = await supabase
      .from('agents')
      .update({
        is_active: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', agent.id);

    if (error) {
      console.error('Error toggling agent status:', error);
      toast.error('Failed to update agent status', { description: error.message });
    } else {
      toast.success(newStatus ? 'Agent activated' : 'Agent deactivated');
      setAgents(agents.map(a =>
        a.id === agent.id ? { ...a, is_active: newStatus } : a
      ));
    }
    setTogglingAgentId(null);
  };

  const handleRefresh = () => {
    fetchAgents();
    fetchPerformanceData();
  };

  if (authLoading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const activeCount = agents.filter(a => a.is_active).length;
  const inactiveCount = agents.filter(a => !a.is_active).length;
  const totalCases = performanceData.reduce((sum, p) => sum + p.cases_count, 0);
  const totalLoanAmount = performanceData.reduce((sum, p) => sum + p.total_loan_amount, 0);

  // Get top 10 agents for chart
  const chartData = performanceData.slice(0, 10).map(p => ({
    name: p.full_name.length > 15 ? p.full_name.substring(0, 15) + '...' : p.full_name,
    cases: p.cases_count,
    fullName: p.full_name,
    code: p.agent_code
  }));

  // Chart colors using CSS variables
  const chartColors = [
    'hsl(var(--primary))',
    'hsl(var(--primary) / 0.9)',
    'hsl(var(--primary) / 0.8)',
    'hsl(var(--primary) / 0.7)',
    'hsl(var(--primary) / 0.6)',
    'hsl(var(--primary) / 0.5)',
    'hsl(var(--primary) / 0.4)',
    'hsl(var(--primary) / 0.35)',
    'hsl(var(--primary) / 0.3)',
    'hsl(var(--primary) / 0.25)',
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Users className="h-6 w-6" />
                Agent Management
              </h1>
              <p className="text-muted-foreground">View, edit, and manage registered agents</p>
            </div>
          </div>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Agents</p>
                  <p className="text-2xl font-bold">{agents.length}</p>
                </div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold text-primary">{activeCount}</p>
                </div>
                <UserCheck className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Cases</p>
                  <p className="text-2xl font-bold">{totalCases}</p>
                </div>
                <Briefcase className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Loan Value</p>
                  <p className="text-xl font-bold">{formatCurrency(totalLoanAmount)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Agent Performance
              </CardTitle>
              <CardDescription>
                Cases created by top 10 agents
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingPerformance ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : chartData.length === 0 ? (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  No case data available
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" className="text-xs" />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      width={100} 
                      className="text-xs"
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-popover border rounded-lg shadow-lg p-3">
                              <p className="font-medium">{data.fullName}</p>
                              <p className="text-xs text-muted-foreground">{data.code}</p>
                              <p className="text-sm mt-1">
                                <span className="font-semibold">{data.cases}</span> cases
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="cases" radius={[0, 4, 4, 0]}>
                      {chartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={chartColors[index]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Performance Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Performance Details
              </CardTitle>
              <CardDescription>
                Cases and loan amounts per agent
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingPerformance ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : performanceData.length === 0 ? (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  No performance data available
                </div>
              ) : (
                <div className="max-h-[300px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Agent</TableHead>
                        <TableHead className="text-right">Cases</TableHead>
                        <TableHead className="text-right">Loan Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {performanceData.map((perf, index) => (
                        <TableRow key={perf.agent_code}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                                {index + 1}
                              </span>
                              <div>
                                <p className="font-medium text-sm">{perf.full_name}</p>
                                <p className="text-xs text-muted-foreground">{perf.agent_code}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant="secondary">{perf.cases_count}</Badge>
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            {formatCurrency(perf.total_loan_amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Agents Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle>Registered Agents</CardTitle>
                <CardDescription>
                  Manage agent information and status. Only admins can edit and save changes.
                </CardDescription>
              </div>
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, code, email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredAgents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? 'No agents match your search' : 'No agents registered yet'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agent Code</TableHead>
                      <TableHead>Full Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Telephone</TableHead>
                      <TableHead>Cases</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Registered</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAgents.map((agent) => {
                      const agentPerf = performanceData.find(p => p.agent_code === agent.agent_code);
                      return (
                        <TableRow key={agent.id} className={!agent.is_active ? 'opacity-60' : ''}>
                          <TableCell>
                            <span className="font-mono text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                              {agent.agent_code}
                            </span>
                          </TableCell>
                          <TableCell className="font-medium">{agent.full_name}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Mail className="h-3.5 w-3.5" />
                              {agent.email}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Phone className="h-3.5 w-3.5" />
                              {agent.telephone}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {agentPerf?.cases_count || 0}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={agent.is_active ? 'default' : 'secondary'}>
                              {agent.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(agent.created_at), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditClick(agent)}
                              >
                                <Pencil className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                              <Button
                                variant={agent.is_active ? 'destructive' : 'default'}
                                size="sm"
                                onClick={() => handleToggleActive(agent)}
                                disabled={togglingAgentId === agent.id}
                              >
                                {togglingAgentId === agent.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : agent.is_active ? (
                                  <>
                                    <UserX className="h-4 w-4 mr-1" />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="h-4 w-4 mr-1" />
                                    Activate
                                  </>
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Agent Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-primary" />
              Edit Agent
            </DialogTitle>
            <DialogDescription>
              Update agent information. Agent code cannot be changed.
            </DialogDescription>
          </DialogHeader>

          {editingAgent && (
            <div className="mb-4">
              <Label className="text-sm text-muted-foreground">Agent Code</Label>
              <div className="font-mono text-lg bg-muted px-3 py-2 rounded mt-1">
                {editingAgent.agent_code}
              </div>
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleEditSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., John Smith" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="e.g., john@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="telephone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telephone *</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="e.g., +971 50 123 4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={isSubmitting} className="flex-1">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
