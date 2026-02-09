import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';
import { Building2, RefreshCw, Radio } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { LenderPerformance } from '@/types/dashboard.types';

interface LenderPerformanceChartProps {
  data: LenderPerformance[];
  isLoading?: boolean;
  onRefresh?: () => void;
  lastUpdated?: string | null;
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--success))',
  'hsl(var(--warning))',
  'hsl(var(--destructive))',
  'hsl(215, 70%, 60%)',
  'hsl(280, 70%, 60%)',
  'hsl(340, 70%, 60%)',
  'hsl(180, 70%, 50%)'
];

export function LenderPerformanceChart({ data, isLoading, onRefresh, lastUpdated }: LenderPerformanceChartProps) {
  const [activeTab, setActiveTab] = React.useState('approval');

  // Prepare chart data
  const approvalData = data.map(l => ({
    name: l.short_code,
    fullName: l.lender_name,
    approvalRate: l.approval_rate,
    applications: l.total_applications
  }));

  const tatData = data.map(l => ({
    name: l.short_code,
    fullName: l.lender_name,
    tat: l.avg_decision_tat,
    applications: l.total_applications
  }));

  const distributionData = data
    .filter(l => l.total_applications > 0)
    .map(l => ({
      name: l.short_code,
      value: l.total_applications,
      fullName: l.lender_name
    }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const item = payload[0].payload;
    
    return (
      <div className="bg-popover border rounded-lg p-3 shadow-lg">
        <p className="font-semibold">{item.fullName}</p>
        <div className="text-sm text-muted-foreground space-y-1 mt-1">
          {payload.map((p: any, i: number) => (
            <p key={i}>
              <span className="font-medium">{p.name}:</span> {p.value}
              {p.dataKey === 'approvalRate' && '%'}
              {p.dataKey === 'tat' && ' days'}
            </p>
          ))}
          {item.applications !== undefined && (
            <p><span className="font-medium">Applications:</span> {item.applications}</p>
          )}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Lender Performance Analytics
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
              <Building2 className="h-5 w-5" />
              Lender Performance Analytics
              <Badge variant="outline" className="gap-1 text-xs ml-2">
                <Radio className="h-2.5 w-2.5 text-success animate-pulse" />
                Live
              </Badge>
            </CardTitle>
            <CardDescription>
              Comparative analysis across all active lenders
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
            <TabsTrigger value="approval">Approval Rates</TabsTrigger>
            <TabsTrigger value="tat">Decision TAT</TabsTrigger>
            <TabsTrigger value="distribution">Distribution</TabsTrigger>
          </TabsList>

          <TabsContent value="approval" className="h-80">
            {approvalData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No lender performance data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={approvalData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis 
                    domain={[0, 100]}
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={{ stroke: 'hsl(var(--border))' }}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="approvalRate" 
                    name="Approval Rate"
                    radius={[4, 4, 0, 0]}
                  >
                    {approvalData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.approvalRate >= 50 ? 'hsl(var(--success))' : 'hsl(var(--warning))'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </TabsContent>

          <TabsContent value="tat" className="h-80">
            {tatData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No TAT data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tatData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis 
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={{ stroke: 'hsl(var(--border))' }}
                    tickFormatter={(v) => `${v}d`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="tat" 
                    name="Avg TAT"
                    radius={[4, 4, 0, 0]}
                  >
                    {tatData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.tat <= 5 ? 'hsl(var(--success))' : entry.tat <= 10 ? 'hsl(var(--warning))' : 'hsl(var(--destructive))'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </TabsContent>

          <TabsContent value="distribution" className="h-80">
            {distributionData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No application data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    dataKey="value"
                  >
                    {distributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
