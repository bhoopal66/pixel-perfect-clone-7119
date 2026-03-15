import React, { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3, TrendingUp, ShieldCheck, Activity, Trophy, ArrowLeft,
  Briefcase, FileCheck, Send, CheckCircle2, DollarSign, Landmark,
  AlertTriangle, Users, RefreshCw, Inbox
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, Cell
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useExecutiveDashboard, type PipelineStage, type LenderPerformance } from '@/hooks/useExecutiveDashboard';

// ── Formatting helpers ──────────────────────────────────────────────

const fmtNumber = (n: number): string => {
  if (n < 0) return `-${fmtNumber(Math.abs(n))}`;
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
};

const fmtCurrency = (n: number): string => `AED ${fmtNumber(n)}`;

const fmtCurrencyFull = (n: number): string =>
  `AED ${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

// ── Color constants ─────────────────────────────────────────────────

const STAGE_COLORS = [
  'hsl(222, 47%, 18%)',
  'hsl(222, 47%, 32%)',
  'hsl(173, 58%, 39%)',
  'hsl(173, 58%, 52%)',
  'hsl(152, 69%, 31%)',
  'hsl(152, 69%, 48%)',
];

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: 'Draft', variant: 'secondary' },
  in_progress: { label: 'In Progress', variant: 'outline' },
  under_review: { label: 'Under Review', variant: 'outline' },
  submitted: { label: 'Submitted', variant: 'default' },
  approved: { label: 'Approved', variant: 'default' },
  declined: { label: 'Declined', variant: 'destructive' },
  closed: { label: 'Closed', variant: 'secondary' },
  dropped: { label: 'Dropped', variant: 'destructive' },
};

// ── Empty state component ───────────────────────────────────────────

function EmptyState({ message = 'No data available' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
      <Inbox className="h-10 w-10 mb-3 opacity-40" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

// ── KPI Card ────────────────────────────────────────────────────────

const KPICard = React.memo(function KPICard({
  icon: Icon, title, value, subtitle, loading, tooltip,
}: {
  icon: React.ElementType;
  title: string;
  value: string;
  subtitle?: string;
  loading?: boolean;
  tooltip?: string;
}) {
  if (loading) {
    return (
      <Card className="min-h-[120px]">
        <CardContent className="p-6">
          <Skeleton className="h-4 w-24 mb-3" />
          <Skeleton className="h-7 w-32 mb-1" />
          <Skeleton className="h-3 w-20" />
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className="min-h-[120px] hover:shadow-md transition-shadow" title={tooltip}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 min-w-0 flex-1">
            <p className="text-sm font-medium text-muted-foreground truncate">{title}</p>
            <p className="text-2xl font-bold text-foreground truncate">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <div className="rounded-lg bg-primary/10 p-2.5 shrink-0">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

// ── Pipeline Bar Chart ──────────────────────────────────────────────

const PipelineChart = React.memo(function PipelineChart({
  data, loading,
}: {
  data?: PipelineStage[];
  loading: boolean;
}) {
  if (loading) return <Skeleton className="h-[320px] w-full rounded-lg" />;
  if (!data || data.length === 0) return <EmptyState message="No pipeline data" />;

  const totalCases = data.reduce((s, d) => s + d.count, 0);
  if (totalCases === 0) return <EmptyState message="No cases in pipeline" />;

  const chartData = data.map((d, i) => ({
    ...d,
    fill: STAGE_COLORS[i % STAGE_COLORS.length],
  }));

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 30 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
        <XAxis
          type="number"
          allowDecimals={false}
          tick={{ fontSize: 12, fill: 'hsl(220, 9%, 46%)' }}
        />
        <YAxis
          type="category"
          dataKey="stage"
          width={140}
          tick={{ fontSize: 12, fill: 'hsl(220, 9%, 46%)' }}
        />
        <Tooltip
          contentStyle={{ borderRadius: 8, border: '1px solid hsl(220, 13%, 91%)', fontSize: 13 }}
          formatter={(value: number) => [value, 'Cases']}
          cursor={{ fill: 'hsl(220, 13%, 91%, 0.3)' }}
        />
        <Bar dataKey="count" radius={[0, 6, 6, 0]}>
          {chartData.map((entry, i) => (
            <Cell key={`cell-${i}`} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
});

// ── Monthly Funding Line Chart ──────────────────────────────────────

const MonthlyFundingChart = React.memo(function MonthlyFundingChart({
  data, loading,
}: {
  data?: { month: string; label: string; amount: number }[];
  loading: boolean;
}) {
  if (loading) return <Skeleton className="h-[320px] w-full rounded-lg" />;
  if (!data || data.length === 0) return <EmptyState message="No funding data yet" />;

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data} margin={{ left: 10, right: 20, top: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: 'hsl(220, 9%, 46%)' }}
          interval="preserveStartEnd"
        />
        <YAxis
          tickFormatter={fmtNumber}
          tick={{ fontSize: 11, fill: 'hsl(220, 9%, 46%)' }}
          width={65}
        />
        <Tooltip
          formatter={(v: number) => [fmtCurrencyFull(v), 'Funding']}
          labelFormatter={(label: string) => label}
          contentStyle={{ borderRadius: 8, fontSize: 13 }}
        />
        <Line
          type="monotone"
          dataKey="amount"
          stroke="hsl(173, 58%, 39%)"
          strokeWidth={2.5}
          dot={{ r: 4, fill: 'hsl(173, 58%, 39%)' }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
});

// ── Lender Approval Bar Chart ───────────────────────────────────────

const LenderApprovalChart = React.memo(function LenderApprovalChart({
  data, loading,
}: {
  data?: LenderPerformance[];
  loading: boolean;
}) {
  if (loading) return <Skeleton className="h-[320px] w-full rounded-lg" />;
  if (!data || data.length === 0) return <EmptyState message="No lender data" />;

  // Show top 8 lenders max for readability
  const top = data.slice(0, 8);

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={top} margin={{ left: 10, right: 20, bottom: 50 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
        <XAxis
          dataKey="lenderName"
          tick={{ fontSize: 10, fill: 'hsl(220, 9%, 46%)' }}
          angle={-30}
          textAnchor="end"
          interval={0}
          height={60}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 11, fill: 'hsl(220, 9%, 46%)' }}
        />
        <Tooltip contentStyle={{ borderRadius: 8, fontSize: 13 }} />
        <Legend wrapperStyle={{ paddingTop: 8 }} />
        <Bar dataKey="casesSent" name="Cases Sent" fill="hsl(222, 47%, 18%)" radius={[4, 4, 0, 0]} />
        <Bar dataKey="approvals" name="Approvals" fill="hsl(152, 69%, 31%)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
});

// ── Metric Item ─────────────────────────────────────────────────────

function MetricItem({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-4 min-h-[72px]">
      <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
      <p className={`text-lg font-semibold leading-tight ${warn ? 'text-destructive' : 'text-foreground'}`}>
        {warn && <AlertTriangle className="inline h-4 w-4 mr-1 -mt-0.5" />}
        {value}
      </p>
    </div>
  );
}

// ── Main Dashboard ──────────────────────────────────────────────────

export default function ExecutiveDashboard() {
  const navigate = useNavigate();
  const {
    kpis, pipeline, lenderPerformance, riskMetrics,
    opsActivity, topDeals, monthlyFunding,
    isLoading, hasError, refetch,
  } = useExecutiveDashboard();

  const handleRefresh = useCallback(() => refetch(), [refetch]);

  // Memoize approval rate to avoid recalculating on every render
  const approvalRate = useMemo(() => {
    if (!kpis || kpis.casesSubmitted === 0) return '0%';
    return `${Math.round((kpis.approvals / kpis.casesSubmitted) * 100)}%`;
  }, [kpis]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">Executive Dashboard</h1>
              <p className="text-sm text-muted-foreground">SME Lending Platform — Management Overview</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              className="gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Badge variant="outline" className="text-xs hidden sm:inline-flex">Read-only</Badge>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] space-y-8 px-6 py-8">
        {/* Error banner */}
        {hasError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Some data failed to load. Click Refresh to retry.
          </div>
        )}

        {/* SECTION 1 — KPIs */}
        <section>
          <h2 className="mb-4 text-lg font-semibold text-foreground flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" /> Key Performance Indicators
          </h2>
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <KPICard icon={Briefcase} title="Total Cases" value={fmtNumber(kpis?.totalCases ?? 0)} loading={isLoading} />
            <KPICard icon={Activity} title="Active Cases" value={fmtNumber(kpis?.activeCases ?? 0)} subtitle="Excl. approved/declined/closed" loading={isLoading} />
            <KPICard icon={Send} title="Cases Submitted" value={fmtNumber(kpis?.casesSubmitted ?? 0)} loading={isLoading} />
            <KPICard icon={CheckCircle2} title="Approvals" value={fmtNumber(kpis?.approvals ?? 0)} loading={isLoading} />
            <KPICard icon={DollarSign} title="Funding Requested" value={fmtCurrency(kpis?.totalFundingRequested ?? 0)} loading={isLoading} tooltip={fmtCurrencyFull(kpis?.totalFundingRequested ?? 0)} />
            <KPICard icon={Landmark} title="Funding Pipeline" value={fmtCurrency(kpis?.fundingPipeline ?? 0)} subtitle="Active cases only" loading={isLoading} tooltip={fmtCurrencyFull(kpis?.fundingPipeline ?? 0)} />
            <KPICard icon={TrendingUp} title="Estimated Revenue" value={fmtCurrency(kpis?.estimatedRevenue ?? 0)} subtitle="2% × approved funding" loading={isLoading} tooltip={`Formula: 2% × Approved Funding = ${fmtCurrencyFull(kpis?.estimatedRevenue ?? 0)}`} />
            <KPICard icon={FileCheck} title="Approval Rate" value={approvalRate} subtitle="Approvals / Submitted" loading={isLoading} />
          </div>
        </section>

        {/* SECTION 2 — Pipeline & SECTION 6 — Monthly Trend */}
        <section className="grid gap-6 lg:grid-cols-2">
          <Card className="min-h-[420px]">
            <CardHeader>
              <CardTitle className="text-base">Pipeline Overview</CardTitle>
              <CardDescription>Active case distribution (excl. declined/closed)</CardDescription>
            </CardHeader>
            <CardContent>
              <PipelineChart data={pipeline} loading={isLoading} />
            </CardContent>
          </Card>

          <Card className="min-h-[420px]">
            <CardHeader>
              <CardTitle className="text-base">Monthly Funding Trend</CardTitle>
              <CardDescription>Funding volume over last 12 months</CardDescription>
            </CardHeader>
            <CardContent>
              <MonthlyFundingChart data={monthlyFunding} loading={isLoading} />
            </CardContent>
          </Card>
        </section>

        {/* SECTION 3 — Lender Performance */}
        <section className="grid gap-6 lg:grid-cols-2">
          <Card className="min-h-[420px]">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Landmark className="h-4 w-4" /> Lender Performance
              </CardTitle>
              <CardDescription>Approval Rate = Approvals ÷ Cases Sent × 100</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : !lenderPerformance || lenderPerformance.length === 0 ? (
                <EmptyState message="No lender data available" />
              ) : (
                <div className="overflow-auto max-h-[340px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[140px]">Lender</TableHead>
                        <TableHead className="text-right w-[80px]">Sent</TableHead>
                        <TableHead className="text-right w-[80px]">Approved</TableHead>
                        <TableHead className="text-right w-[90px]">Rate</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lenderPerformance.map((lp) => (
                        <TableRow key={lp.lenderName}>
                          <TableCell className="font-medium truncate max-w-[200px]" title={lp.lenderName}>
                            {lp.lenderName}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{lp.casesSent}</TableCell>
                          <TableCell className="text-right tabular-nums">{lp.approvals}</TableCell>
                          <TableCell className="text-right">
                            <Badge
                              variant={lp.approvalRate >= 70 ? 'default' : lp.approvalRate >= 40 ? 'secondary' : 'outline'}
                              className="text-xs tabular-nums"
                            >
                              {lp.approvalRate}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="min-h-[420px]">
            <CardHeader>
              <CardTitle className="text-base">Lender Approval Comparison</CardTitle>
              <CardDescription>Top lenders by volume</CardDescription>
            </CardHeader>
            <CardContent>
              <LenderApprovalChart data={lenderPerformance} loading={isLoading} />
            </CardContent>
          </Card>
        </section>

        {/* SECTION 4 — Risk Metrics & SECTION 5 — Ops */}
        <section className="grid gap-6 lg:grid-cols-2">
          <Card className="min-h-[280px]">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" /> Risk Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="grid grid-cols-2 gap-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-[72px] w-full rounded-lg" />
                  ))}
                </div>
              ) : !riskMetrics ? (
                <EmptyState message="Risk data unavailable" />
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <MetricItem label="Avg BBRS Score" value={`${riskMetrics.avgBBRSScore}/100`} />
                  <MetricItem label="Avg Monthly Turnover" value={fmtCurrency(riskMetrics.avgMonthlyTurnover)} />
                  <MetricItem label="Avg Loan Size" value={fmtCurrency(riskMetrics.avgLoanSize)} />
                  <MetricItem label="High Risk Cases" value={fmtNumber(riskMetrics.highRiskCases)} warn={riskMetrics.highRiskCases > 0} />
                  <MetricItem label="Fraud Alerts" value={fmtNumber(riskMetrics.fraudAlerts)} warn={riskMetrics.fraudAlerts > 0} />
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="min-h-[280px]">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4" /> Today's Activity
              </CardTitle>
              <CardDescription>Operational metrics for {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="grid grid-cols-2 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-[72px] w-full rounded-lg" />
                  ))}
                </div>
              ) : !opsActivity ? (
                <EmptyState message="Activity data unavailable" />
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <MetricItem label="Cases Created" value={fmtNumber(opsActivity.casesToday)} />
                  <MetricItem label="Reports Generated" value={fmtNumber(opsActivity.reportsToday)} />
                  <MetricItem label="Bank Analyses Run" value={fmtNumber(opsActivity.analysesToday)} />
                  <MetricItem label="Active Users" value={fmtNumber(opsActivity.activeUsers)} />
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* SECTION 7 — Top Deals */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-4 w-4" /> Top Deals by Loan Amount
            </CardTitle>
            <CardDescription>Up to 10 largest deals</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : !topDeals || topDeals.length === 0 ? (
              <EmptyState message="No deals available" />
            ) : (
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">#</TableHead>
                      <TableHead className="min-w-[160px]">Company</TableHead>
                      <TableHead className="text-right min-w-[130px]">Loan Amount</TableHead>
                      <TableHead className="min-w-[140px]">Recommended Lender</TableHead>
                      <TableHead className="w-[110px]">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topDeals.map((deal, i) => {
                      const statusInfo = STATUS_MAP[deal.status] || { label: deal.status, variant: 'outline' as const };
                      return (
                        <TableRow key={deal.id}>
                          <TableCell className="font-medium text-muted-foreground">{i + 1}</TableCell>
                          <TableCell className="font-medium truncate max-w-[250px]" title={deal.companyName}>
                            {deal.companyName}
                          </TableCell>
                          <TableCell className="text-right font-mono tabular-nums" title={fmtCurrencyFull(deal.loanAmount)}>
                            {fmtCurrency(deal.loanAmount)}
                          </TableCell>
                          <TableCell className="truncate max-w-[180px]" title={deal.recommendedLender}>
                            {deal.recommendedLender}
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusInfo.variant} className="text-xs whitespace-nowrap">
                              {statusInfo.label}
                            </Badge>
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
      </main>
    </div>
  );
}
