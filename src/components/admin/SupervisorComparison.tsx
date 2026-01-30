import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { Users, RefreshCw, Radio, Award, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { SupervisorPipeline } from '@/types/dashboard.types';

interface SupervisorComparisonProps {
  data: SupervisorPipeline[];
  isLoading?: boolean;
  onRefresh?: () => void;
  lastUpdated?: string | null;
}

export function SupervisorComparison({ data, isLoading, onRefresh, lastUpdated }: SupervisorComparisonProps) {
  const [activeTab, setActiveTab] = React.useState('overview');

  // Prepare stacked bar chart data
  const stackedData = data.map(sup => ({
    name: sup.supervisor_name.split(' ')[0], // First name only
    fullName: sup.supervisor_name,
    Draft: sup.metrics.draft,
    'In Process': sup.metrics.in_process,
    Submitted: sup.metrics.submitted_to_lender,
    Approved: sup.metrics.approved,
    Declined: sup.metrics.declined,
    total: Object.values(sup.metrics).reduce((a, b) => a + b, 0)
  }));

  // Prepare radar chart data for performance comparison
  const maxValues = {
    cases: Math.max(...data.map(d => Object.values(d.metrics).reduce((a, b) => a + b, 0)), 1),
    approved: Math.max(...data.map(d => d.metrics.approved), 1),
    tat: Math.max(...data.map(d => d.avg_tat), 1),
    redCases: Math.max(...data.map(d => d.red_cases), 1)
  };

  const radarData = data.slice(0, 5).map(sup => { // Top 5 supervisors
    const totalCases = Object.values(sup.metrics).reduce((a, b) => a + b, 0);
    return {
      supervisor: sup.supervisor_name.split(' ')[0],
      fullName: sup.supervisor_name,
      'Total Cases': (totalCases / maxValues.cases) * 100,
      'Approvals': (sup.metrics.approved / maxValues.approved) * 100,
      'Speed (inv TAT)': ((maxValues.tat - sup.avg_tat + 1) / maxValues.tat) * 100,
      'Quality (no red)': ((maxValues.redCases - sup.red_cases + 1) / maxValues.redCases) * 100
    };
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    
    return (
      <div className="bg-popover border rounded-lg p-3 shadow-lg">
        <p className="font-semibold mb-2">{payload[0]?.payload?.fullName || label}</p>
        <div className="text-sm space-y-1">
          {payload.map((p: any, i: number) => (
            <div key={i} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded" 
                style={{ backgroundColor: p.color }}
              />
              <span>{p.name}: {p.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Calculate rankings
  const rankings = data
    .map(sup => ({
      ...sup,
      totalCases: Object.values(sup.metrics).reduce((a, b) => a + b, 0),
      successRate: sup.metrics.approved / Math.max(sup.metrics.approved + sup.metrics.declined, 1) * 100
    }))
    .sort((a, b) => b.metrics.approved - a.metrics.approved);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-16">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Comparison
              <Badge variant="outline" className="gap-1 text-xs ml-2">
                <Radio className="h-2.5 w-2.5 text-success animate-pulse" />
                Live
              </Badge>
            </CardTitle>
            <CardDescription>
              Cross-team pipeline and performance analysis
              {lastUpdated && <span className="ml-2">• Updated: {lastUpdated}</span>}
            </CardDescription>
          </div>
          {onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Pipeline Overview</TabsTrigger>
            <TabsTrigger value="radar">Performance Radar</TabsTrigger>
            <TabsTrigger value="rankings">Rankings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="h-80">
            {stackedData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No supervisor data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stackedData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="Draft" stackId="a" fill="hsl(var(--muted-foreground))" />
                  <Bar dataKey="In Process" stackId="a" fill="hsl(215, 70%, 60%)" />
                  <Bar dataKey="Submitted" stackId="a" fill="hsl(280, 70%, 60%)" />
                  <Bar dataKey="Approved" stackId="a" fill="hsl(var(--success))" />
                  <Bar dataKey="Declined" stackId="a" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </TabsContent>

          <TabsContent value="radar" className="h-80">
            {radarData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No performance data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                  { metric: 'Total Cases', ...Object.fromEntries(radarData.map(r => [r.supervisor, r['Total Cases']])) },
                  { metric: 'Approvals', ...Object.fromEntries(radarData.map(r => [r.supervisor, r['Approvals']])) },
                  { metric: 'Speed', ...Object.fromEntries(radarData.map(r => [r.supervisor, r['Speed (inv TAT)']])) },
                  { metric: 'Quality', ...Object.fromEntries(radarData.map(r => [r.supervisor, r['Quality (no red)']])) }
                ]}>
                  <PolarGrid className="stroke-border" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={false} />
                  {radarData.map((sup, i) => (
                    <Radar
                      key={sup.supervisor}
                      name={sup.fullName}
                      dataKey={sup.supervisor}
                      stroke={`hsl(${(i * 60) % 360}, 70%, 50%)`}
                      fill={`hsl(${(i * 60) % 360}, 70%, 50%)`}
                      fillOpacity={0.1}
                    />
                  ))}
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </TabsContent>

          <TabsContent value="rankings">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Supervisor</TableHead>
                    <TableHead className="text-center">Total Cases</TableHead>
                    <TableHead className="text-center">Approved</TableHead>
                    <TableHead className="text-center">Success Rate</TableHead>
                    <TableHead className="text-center">Avg TAT</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rankings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No supervisor data available
                      </TableCell>
                    </TableRow>
                  ) : (
                    rankings.map((sup, index) => (
                      <TableRow key={sup.supervisor_id}>
                        <TableCell>
                          {index === 0 ? (
                            <Award className="h-5 w-5 text-yellow-500" />
                          ) : index === 1 ? (
                            <Award className="h-5 w-5 text-gray-400" />
                          ) : index === 2 ? (
                            <Award className="h-5 w-5 text-amber-600" />
                          ) : (
                            <span className="text-muted-foreground">{index + 1}</span>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{sup.supervisor_name}</TableCell>
                        <TableCell className="text-center">{sup.totalCases}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="default" className="bg-success/20 text-success">
                            {sup.metrics.approved}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {sup.successRate.toFixed(0)}%
                        </TableCell>
                        <TableCell className="text-center">{sup.avg_tat} days</TableCell>
                        <TableCell className="text-center">
                          {sup.red_cases > 0 ? (
                            <Badge variant="destructive" className="gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {sup.red_cases} Red
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-success/10 text-success">
                              All Clear
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
