import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { TrendingUp, RefreshCw, Radio, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TrendData {
  date: string;
  applications: number;
  approved: number;
  declined: number;
  pending: number;
}

interface TrendAnalyticsProps {
  data: TrendData[];
  isLoading?: boolean;
  onRefresh?: () => void;
  lastUpdated?: string | null;
  onPeriodChange?: (period: string) => void;
  period?: string;
}

export function TrendAnalytics({ 
  data, 
  isLoading, 
  onRefresh, 
  lastUpdated,
  onPeriodChange,
  period = '30d'
}: TrendAnalyticsProps) {
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    
    return (
      <div className="bg-popover border rounded-lg p-3 shadow-lg">
        <p className="font-semibold mb-2">{label}</p>
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

  // Calculate summary stats
  const totalApplications = data.reduce((sum, d) => sum + d.applications, 0);
  const totalApproved = data.reduce((sum, d) => sum + d.approved, 0);
  const totalDeclined = data.reduce((sum, d) => sum + d.declined, 0);
  const avgDaily = data.length > 0 ? Math.round(totalApplications / data.length) : 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Application Trends
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
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Application Trends
              <Badge variant="outline" className="gap-1 text-xs ml-2">
                <Radio className="h-2.5 w-2.5 text-success animate-pulse" />
                Live
              </Badge>
            </CardTitle>
            <CardDescription>
              Historical volume and outcome analysis
              {lastUpdated && <span className="ml-2">• Updated: {lastUpdated}</span>}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {onPeriodChange && (
              <Select value={period} onValueChange={onPeriodChange}>
                <SelectTrigger className="w-32">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                </SelectContent>
              </Select>
            )}
            {onRefresh && (
              <Button variant="outline" size="sm" onClick={onRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold">{totalApplications}</p>
            <p className="text-xs text-muted-foreground">Total Applications</p>
          </div>
          <div className="text-center p-3 bg-success/10 rounded-lg">
            <p className="text-2xl font-bold text-success">{totalApproved}</p>
            <p className="text-xs text-muted-foreground">Approved</p>
          </div>
          <div className="text-center p-3 bg-destructive/10 rounded-lg">
            <p className="text-2xl font-bold text-destructive">{totalDeclined}</p>
            <p className="text-xs text-muted-foreground">Declined</p>
          </div>
          <div className="text-center p-3 bg-primary/10 rounded-lg">
            <p className="text-2xl font-bold text-primary">{avgDaily}</p>
            <p className="text-xs text-muted-foreground">Avg Daily</p>
          </div>
        </div>

        {/* Area Chart */}
        <div className="h-72">
          {data.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No trend data available for the selected period
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorApplications" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorApproved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  tickLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  tickLine={{ stroke: 'hsl(var(--border))' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="applications"
                  name="Applications"
                  stroke="hsl(var(--primary))"
                  fillOpacity={1}
                  fill="url(#colorApplications)"
                />
                <Area
                  type="monotone"
                  dataKey="approved"
                  name="Approved"
                  stroke="hsl(var(--success))"
                  fillOpacity={1}
                  fill="url(#colorApproved)"
                />
                <Line
                  type="monotone"
                  dataKey="declined"
                  name="Declined"
                  stroke="hsl(var(--destructive))"
                  strokeWidth={2}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
