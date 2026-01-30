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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Users, Pencil, UserX, UserCheck, Mail, Phone, Search, RefreshCw, TrendingUp, Briefcase, Calendar, X, Trash2, Info, Eye } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { format, subDays, subMonths, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

type DatePreset = 'all' | 'today' | 'last7days' | 'last30days' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'custom';

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
  const { isAdmin, isSuperAdmin, isSupervisor, canManageAgents, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [filteredAgents, setFilteredAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [togglingAgentId, setTogglingAgentId] = useState<string | null>(null);
  const [deletingAgentId, setDeletingAgentId] = useState<string | null>(null);
  const [performanceData, setPerformanceData] = useState<AgentPerformance[]>([]);
  const [isLoadingPerformance, setIsLoadingPerformance] = useState(true);
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  const form = useForm<AgentFormData>({
    resolver: zodResolver(agentSchema),
    defaultValues: {
      full_name: '',
      email: '',
      telephone: ''
    }
  });

  useEffect(() => {
    if (!authLoading && !canManageAgents) {
      toast.error('Access denied', { description: 'Agent management privileges required' });
      navigate('/');
    }
  }, [authLoading, canManageAgents, navigate]);

  useEffect(() => {
    if (canManageAgents) {
      fetchAgents();
    }
  }, [canManageAgents]);

  // Refetch performance data when date filters change
  useEffect(() => {
    if (canManageAgents) {
      fetchPerformanceData(startDate, endDate);
    }
  }, [canManageAgents, startDate, endDate]);

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

  const fetchPerformanceData = async (filterStartDate?: Date, filterEndDate?: Date) => {
    setIsLoadingPerformance(true);
    try {
      // Build query with optional date filters
      let query = supabase
        .from('cases')
        .select('agent_reference, eligible_loan_amount, created_at');
      
      if (filterStartDate) {
        query = query.gte('created_at', filterStartDate.toISOString());
      }
      if (filterEndDate) {
        // Add 1 day to include the end date fully
        const endOfDay = new Date(filterEndDate);
        endOfDay.setHours(23, 59, 59, 999);
        query = query.lte('created_at', endOfDay.toISOString());
      }

      const { data: cases, error: casesError } = await query;

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

  const handleDeleteAgent = async (agent: Agent) => {
    if (!isSuperAdmin) {
      toast.error('Only super admins can delete agents');
      return;
    }

    setDeletingAgentId(agent.id);

    const { error } = await supabase
      .from('agents')
      .delete()
      .eq('id', agent.id);

    if (error) {
      console.error('Error deleting agent:', error);
      toast.error('Failed to delete agent', { description: error.message });
    } else {
      toast.success('Agent deleted successfully');
      setAgents(agents.filter(a => a.id !== agent.id));
    }
    setDeletingAgentId(null);
  };

  const handleRefresh = () => {
    fetchAgents();
    fetchPerformanceData(startDate, endDate);
  };

  const handleDatePresetChange = (preset: DatePreset) => {
    setDatePreset(preset);
    const today = new Date();
    
    switch (preset) {
      case 'all':
        setStartDate(undefined);
        setEndDate(undefined);
        break;
      case 'today':
        setStartDate(today);
        setEndDate(today);
        break;
      case 'last7days':
        setStartDate(subDays(today, 6));
        setEndDate(today);
        break;
      case 'last30days':
        setStartDate(subDays(today, 29));
        setEndDate(today);
        break;
      case 'thisMonth':
        setStartDate(startOfMonth(today));
        setEndDate(endOfMonth(today));
        break;
      case 'lastMonth':
        const lastMonth = subMonths(today, 1);
        setStartDate(startOfMonth(lastMonth));
        setEndDate(endOfMonth(lastMonth));
        break;
      case 'thisYear':
        setStartDate(startOfYear(today));
        setEndDate(endOfYear(today));
        break;
      case 'custom':
        // Keep current dates, user will select
        break;
    }
  };

  const clearDateFilter = () => {
    setDatePreset('all');
    setStartDate(undefined);
    setEndDate(undefined);
  };

  const getDateRangeLabel = () => {
    if (!startDate && !endDate) return 'All Time';
    if (startDate && endDate) {
      if (format(startDate, 'yyyy-MM-dd') === format(endDate, 'yyyy-MM-dd')) {
        return format(startDate, 'MMM d, yyyy');
      }
      return `${format(startDate, 'MMM d, yyyy')} - ${format(endDate, 'MMM d, yyyy')}`;
    }
    if (startDate) return `From ${format(startDate, 'MMM d, yyyy')}`;
    if (endDate) return `Until ${format(endDate, 'MMM d, yyyy')}`;
    return 'All Time';
  };

  if (authLoading || !canManageAgents) {
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

        {/* Supervisor Role Indicator */}
        {isSupervisor && (
          <Alert className="bg-accent/50 border-accent">
            <Eye className="h-4 w-4 text-accent-foreground" />
            <AlertDescription className="text-accent-foreground">
              <span className="font-medium">Supervisor Access:</span> You can view, edit, and activate/deactivate agents. 
              Agent deletion is restricted to Super Admins only.
            </AlertDescription>
          </Alert>
        )}

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

        {/* Date Filter */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filter by Period:</span>
              </div>
              
              <Select value={datePreset} onValueChange={(value) => handleDatePresetChange(value as DatePreset)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="last7days">Last 7 Days</SelectItem>
                  <SelectItem value="last30days">Last 30 Days</SelectItem>
                  <SelectItem value="thisMonth">This Month</SelectItem>
                  <SelectItem value="lastMonth">Last Month</SelectItem>
                  <SelectItem value="thisYear">This Year</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>

              {datePreset === 'custom' && (
                <div className="flex items-center gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          "justify-start text-left font-normal",
                          !startDate && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "MMM d, yyyy") : "Start date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <span className="text-muted-foreground">to</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          "justify-start text-left font-normal",
                          !endDate && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "MMM d, yyyy") : "End date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              {(startDate || endDate) && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    {getDateRangeLabel()}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      onClick={clearDateFilter}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

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
                Cases created by top 10 agents {startDate || endDate ? `(${getDateRangeLabel()})` : ''}
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
                                    Suspend
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="h-4 w-4 mr-1" />
                                    Activate
                                  </>
                                )}
                              </Button>
                              {isSuperAdmin && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      disabled={deletingAgentId === agent.id}
                                    >
                                      {deletingAgentId === agent.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <>
                                          <Trash2 className="h-4 w-4 mr-1" />
                                          Delete
                                        </>
                                      )}
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Agent</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to permanently delete {agent.full_name} ({agent.agent_code})? This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDeleteAgent(agent)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
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
