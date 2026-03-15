import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3, TrendingUp, ShieldCheck, Activity, Trophy, ArrowLeft,
  Briefcase, FileCheck, Send, CheckCircle2, DollarSign, Landmark, AlertTriangle, Users
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, Funnel, FunnelChart, LabelList
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useExecutiveDashboard, type PipelineStage, type LenderPerformance } from '@/hooks/useExecutiveDashboard';

const fmt = (n: number) =>
  n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000
    ? `${(n / 1_000).toFixed(0)}K`
    : n.toLocaleString();

const currency = (n: number) => `AED ${fmt(n)}`;

const FUNNEL_COLORS = [
  'hsl(222, 47%, 18%)',
  'hsl(222, 47%, 30%)',
  'hsl(173, 58%, 39%)',
  'hsl(173, 58%, 50%)',
  'hsl(152, 69%, 31%)',
  'hsl(152, 69%, 45%)',
];

const PIE_COLORS = [
  'hsl(222, 47%, 18%)',
  'hsl(173, 58%, 39%)',
  'hsl(152, 69%, 31%)',
  'hsl(38, 92%, 50%)',
  'hsl(0, 84%, 60%)',
  'hsl(280, 65%, 60%)',
];

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: 'Draft', variant: 'secondary' },
  in_progress: { label: 'In Progress', variant: 'outline' },
  submitted: { label: 'Submitted', variant: 'default' },
  approved: { label: 'Approved', variant: 'default' },
  declined: { label: 'Declined', variant: 'destructive' },
};

function KPICard({ icon: Icon, title, value, subtitle, loading }: {
  icon: React.ElementType; title: string; value: string; subtitle?: string; loading?: boolean;
}) {
  if (loading) return (
    <Card><CardContent className="p-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
  );
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <div className="rounded-lg bg-primary/10 p-2.5">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PipelineFunnel({ data, loading }: { data?: PipelineStage[]; loading: boolean }) {
  if (loading || !data) return <Skeleton className="h-[300px] w-full" />;

  const chartData = data.map((d, i) => ({ ...d, fill: FUNNEL_COLORS[i % FUNNEL_COLORS.length] }));

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 30 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
        <XAxis type="number" tick={{ fontSize: 12, fill: 'hsl(220, 9%, 46%)' }} />
        <YAxis type="category" dataKey="stage" width={130} tick={{ fontSize: 12, fill: 'hsl(220, 9%, 46%)' }} />
        <Tooltip
          contentStyle={{ borderRadius: 8, border: '1px solid hsl(220, 13%, 91%)', fontSize: 13 }}
          formatter={(value: number) => [value, 'Cases']}
        />
        <Bar dataKey="count" radius={[0, 6, 6, 0]}>
          {chartData.map((entry, i) => (
            <Cell key={i} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function MonthlyFundingChart({ data, loading }: { data?: { month: string; amount: number }[]; loading: boolean }) {
  if (loading || !data || data.length === 0) return <Skeleton className="h-[300px] w-full" />;

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data} margin={{ left: 10, right: 20, top: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(220, 9%, 46%)' }} />
        <YAxis tickFormatter={(v) => fmt(v)} tick={{ fontSize: 11, fill: 'hsl(220, 9%, 46%)' }} />
        <Tooltip formatter={(v: number) => [currency(v), 'Funding']} contentStyle={{ borderRadius: 8, fontSize: 13 }} />
        <Line type="monotone" dataKey="amount" stroke="hsl(173, 58%, 39%)" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function LenderApprovalChart({ data, loading }: { data?: LenderPerformance[]; loading: boolean }) {
  if (loading || !data || data.length === 0) return <Skeleton className="h-[300px] w-full" />;

  const top6 = data.slice(0, 6);

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={top6} margin={{ left: 10, right: 20, bottom: 40 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
        <XAxis dataKey="lenderName" tick={{ fontSize: 10, fill: 'hsl(220, 9%, 46%)' }} angle={-25} textAnchor="end" />
        <YAxis tick={{ fontSize: 11, fill: 'hsl(220, 9%, 46%)' }} />
        <Tooltip contentStyle={{ borderRadius: 8, fontSize: 13 }} />
        <Legend />
        <Bar dataKey="casesSent" name="Cases Sent" fill="hsl(222, 47%, 18%)" radius={[4, 4, 0, 0]} />
        <Bar dataKey="approvals" name="Approvals" fill="hsl(152, 69%, 31%)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default function ExecutiveDashboard() {
  const navigate = useNavigate();
  const { kpis, pipeline, lenderPerformance, riskMetrics, opsActivity, topDeals, monthlyFunding, isLoading } = useExecutiveDashboard();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">Executive Dashboard</h1>
              <p className="text-sm text-muted-foreground">SME Lending Platform Overview</p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">Read-only Analytics</Badge>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] space-y-8 px-6 py-8">
        {/* SECTION 1 — KPIs */}
        <section>
          <h2 className="mb-4 text-lg font-semibold text-foreground flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" /> Key Performance Indicators
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KPICard icon={Briefcase} title="Total Cases" value={String(kpis?.totalCases ?? 0)} loading={isLoading} />
            <KPICard icon={Activity} title="Active Cases" value={String(kpis?.activeCases ?? 0)} loading={isLoading} />
            <KPICard icon={Send} title="Cases Submitted" value={String(kpis?.casesSubmitted ?? 0)} loading={isLoading} />
            <KPICard icon={CheckCircle2} title="Approvals" value={String(kpis?.approvals ?? 0)} loading={isLoading} />
            <KPICard icon={DollarSign} title="Funding Requested" value={currency(kpis?.totalFundingRequested ?? 0)} loading={isLoading} />
            <KPICard icon={Landmark} title="Funding Pipeline" value={currency(kpis?.fundingPipeline ?? 0)} loading={isLoading} />
            <KPICard icon={TrendingUp} title="Estimated Revenue" value={currency(kpis?.estimatedRevenue ?? 0)} subtitle="2% success fee" loading={isLoading} />
            <KPICard icon={FileCheck} title="Approval Rate" value={kpis && kpis.totalCases > 0 ? `${Math.round((kpis.approvals / kpis.totalCases) * 100)}%` : '0%'} loading={isLoading} />
          </div>
        </section>

        {/* SECTION 2 — Pipeline & SECTION 6 — Charts */}
        <section className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pipeline Overview</CardTitle>
              <CardDescription>Case distribution across stages</CardDescription>
            </CardHeader>
            <CardContent>
              <PipelineFunnel data={pipeline} loading={isLoading} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Monthly Funding Trend</CardTitle>
              <CardDescription>Funding volume over last 12 months</CardDescription>
            </CardHeader>
            <CardContent>
              <MonthlyFundingChart data={monthlyFunding} loading={!monthlyFunding} />
            </CardContent>
          </Card>
        </section>

        {/* SECTION 3 — Lender Performance */}
        <section className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Landmark className="h-4 w-4" /> Lender Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-48 w-full" />
              ) : (
                <div className="overflow-auto max-h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Lender</TableHead>
                        <TableHead className="text-right">Sent</TableHead>
                        <TableHead className="text-right">Approved</TableHead>
                        <TableHead className="text-right">Rate</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(lenderPerformance || []).map((lp) => (
                        <TableRow key={lp.lenderName}>
                          <TableCell className="font-medium">{lp.lenderName}</TableCell>
                          <TableCell className="text-right">{lp.casesSent}</TableCell>
                          <TableCell className="text-right">{lp.approvals}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant={lp.approvalRate >= 50 ? 'default' : 'secondary'} className="text-xs">
                              {lp.approvalRate}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                      {(!lenderPerformance || lenderPerformance.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                            No lender data available
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Lender Approval Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <LenderApprovalChart data={lenderPerformance} loading={isLoading} />
            </CardContent>
          </Card>
        </section>

        {/* SECTION 4 — Risk Metrics & SECTION 5 — Ops */}
        <section className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" /> Risk Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!riskMetrics ? (
                <Skeleton className="h-36 w-full" />
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <MetricItem label="Avg BBRS Score" value={String(riskMetrics.avgFraudScore)} />
                  <MetricItem label="Avg Monthly Turnover" value={currency(riskMetrics.avgMonthlyTurnover)} />
                  <MetricItem label="Avg Loan Size" value={currency(riskMetrics.avgLoanSize)} />
                  <MetricItem label="High Risk Cases" value={String(riskMetrics.highRiskCases)} warn={riskMetrics.highRiskCases > 0} />
                  <MetricItem label="Fraud Alerts" value={String(riskMetrics.fraudAlerts)} warn={riskMetrics.fraudAlerts > 0} />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4" /> Today's Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!opsActivity ? (
                <Skeleton className="h-36 w-full" />
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <MetricItem label="Cases Created" value={String(opsActivity.casesToday)} />
                  <MetricItem label="Reports Generated" value={String(opsActivity.reportsToday)} />
                  <MetricItem label="Bank Analyses Run" value={String(opsActivity.analysesToday)} />
                  <MetricItem label="Active Users" value={String(opsActivity.activeUsers)} />
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* SECTION 7 — Top Deals */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-4 w-4" /> Top 10 Deals by Loan Amount
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!topDeals ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead className="text-right">Loan Amount</TableHead>
                      <TableHead>Recommended Lender</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topDeals.map((deal, i) => {
                      const statusInfo = STATUS_MAP[deal.status] || { label: deal.status, variant: 'outline' as const };
                      return (
                        <TableRow key={deal.id}>
                          <TableCell className="font-medium text-muted-foreground">{i + 1}</TableCell>
                          <TableCell className="font-medium">{deal.companyName}</TableCell>
                          <TableCell className="text-right font-mono">{currency(deal.loanAmount)}</TableCell>
                          <TableCell>{deal.recommendedLender}</TableCell>
                          <TableCell>
                            <Badge variant={statusInfo.variant} className="text-xs">{statusInfo.label}</Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {topDeals.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No deals available
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function MetricItem({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-lg font-semibold ${warn ? 'text-destructive' : 'text-foreground'}`}>
        {warn && <AlertTriangle className="inline h-4 w-4 mr-1 -mt-0.5" />}
        {value}
      </p>
    </div>
  );
}
