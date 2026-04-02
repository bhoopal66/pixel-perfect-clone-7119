import React, { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3, TrendingUp, ShieldCheck, Activity, Trophy, ArrowLeft,
  Briefcase, FileCheck, Send, CheckCircle2, DollarSign, Landmark,
  AlertTriangle, Users, RefreshCw, Inbox, FileText, ClipboardCheck, Building2
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, Cell
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useExecutiveDashboard, type PipelineStage, type LenderPerformance } from '@/hooks/useExecutiveDashboard';

// ── Google Font import for JetBrains Mono ───────────────────────────
// Added via index.html or loaded here as a CSS class utility

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
  '#7c3aed', // purple
  '#3b82f6', // blue
  '#06b6d4', // cyan
  '#f59e0b', // amber
  '#f97316', // orange
  '#10b981', // emerald
];

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'bg-slate-500/20 text-slate-300 border-slate-500/30' },
  in_progress: { label: 'In Progress', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  under_review: { label: 'Under Review', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  submitted: { label: 'Submitted', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  approved: { label: 'Approved', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  declined: { label: 'Declined', color: 'bg-red-500/20 text-red-300 border-red-500/30' },
  closed: { label: 'Closed', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
  dropped: { label: 'Dropped', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
};

// ── Glass card wrapper ──────────────────────────────────────────────

function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 transition-all duration-200 hover:bg-white/[0.07] hover:border-white/15 ${className}`}>
      {children}
    </div>
  );
}

// ── Empty state ─────────────────────────────────────────────────────

function EmptyState({ message = 'No data available' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-slate-500">
      <Inbox className="h-10 w-10 mb-3 opacity-40" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

// ── KPI Card ────────────────────────────────────────────────────────

const KPICard = React.memo(function KPICard({
  icon: Icon, title, value, subtitle, loading, accentClass = 'text-cyan-400',
}: {
  icon: React.ElementType;
  title: string;
  value: string;
  subtitle?: string;
  loading?: boolean;
  accentClass?: string;
}) {
  if (loading) {
    return (
      <GlassCard>
        <Skeleton className="h-3 w-20 mb-3 bg-white/10" />
        <Skeleton className="h-7 w-28 mb-1 bg-white/10" />
        <Skeleton className="h-3 w-16 bg-white/10" />
      </GlassCard>
    );
  }
  return (
    <GlassCard>
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1 min-w-0 flex-1">
          <p className="text-xs uppercase tracking-wider font-medium text-slate-400">{title}</p>
          <p className={`text-2xl font-bold font-mono tabular-nums ${accentClass}`}>{value}</p>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
        <div className="rounded-lg bg-cyan-500/10 p-2.5 shrink-0">
          <Icon className="h-5 w-5 text-cyan-400" />
        </div>
      </div>
    </GlassCard>
  );
});

// ── Pipeline Funnel ─────────────────────────────────────────────────

const PipelineFunnel = React.memo(function PipelineFunnel({
  data, loading,
}: {
  data?: PipelineStage[];
  loading: boolean;
}) {
  if (loading) return <Skeleton className="h-[320px] w-full rounded-lg bg-white/10" />;
  if (!data || data.length === 0) return <EmptyState message="No pipeline data" />;

  const totalCases = data.reduce((s, d) => s + d.count, 0);
  if (totalCases === 0) return <EmptyState message="No cases in pipeline" />;

  const maxCount = Math.max(...data.map(d => d.count));

  return (
    <div className="space-y-3">
      {data.map((stage, i) => {
        const widthPct = maxCount > 0 ? Math.max(8, (stage.count / maxCount) * 100) : 8;
        const prevCount = i > 0 ? data[i - 1].count : null;
        const conversionPct = prevCount && prevCount > 0 ? Math.round((stage.count / prevCount) * 100) : null;

        return (
          <div key={stage.stage} className="flex items-center gap-3">
            <div className="w-[130px] text-xs text-slate-400 text-right truncate shrink-0">
              {stage.stage}
            </div>
            <div className="flex-1 h-8 relative">
              <div
                className="h-full rounded-md flex items-center px-3 transition-all duration-500"
                style={{
                  width: `${widthPct}%`,
                  background: `linear-gradient(90deg, ${STAGE_COLORS[i % STAGE_COLORS.length]}cc, ${STAGE_COLORS[i % STAGE_COLORS.length]}66)`,
                }}
              >
                <span className="text-xs font-mono font-bold text-white">{stage.count}</span>
              </div>
            </div>
            <div className="w-[50px] text-right shrink-0">
              {conversionPct !== null && (
                <span className="text-xs font-mono text-slate-500">{conversionPct}%</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
});

// ── Monthly Funding Chart ───────────────────────────────────────────

const MonthlyFundingChart = React.memo(function MonthlyFundingChart({
  data, loading,
}: {
  data?: { month: string; label: string; amount: number }[];
  loading: boolean;
}) {
  if (loading) return <Skeleton className="h-[320px] w-full rounded-lg bg-white/10" />;
  if (!data || data.length === 0) return <EmptyState message="No funding data yet" />;

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ left: 10, right: 20, top: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: '#64748b', fontFamily: 'JetBrains Mono, monospace' }}
          interval="preserveStartEnd"
          axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
          tickLine={false}
        />
        <YAxis
          tickFormatter={fmtNumber}
          tick={{ fontSize: 11, fill: '#64748b', fontFamily: 'JetBrains Mono, monospace' }}
          width={65}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          formatter={(v: number) => [fmtCurrencyFull(v), 'Funding']}
          labelFormatter={(label: string) => label}
          contentStyle={{
            borderRadius: 10,
            fontSize: 13,
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#e2e8f0',
            fontFamily: 'JetBrains Mono, monospace',
          }}
        />
        <Bar dataKey="amount" radius={[6, 6, 0, 0]} fill="url(#tealGradient)" />
        <defs>
          <linearGradient id="tealGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#0d9488" stopOpacity={0.5} />
          </linearGradient>
        </defs>
      </BarChart>
    </ResponsiveContainer>
  );
});

// ── Lender Approval Horizontal Bar Chart ────────────────────────────

const LenderApprovalChart = React.memo(function LenderApprovalChart({
  data, loading,
}: {
  data?: LenderPerformance[];
  loading: boolean;
}) {
  if (loading) return <Skeleton className="h-[320px] w-full rounded-lg bg-white/10" />;
  if (!data || data.length === 0) return <EmptyState message="No lender data" />;

  const top = data.slice(0, 8);

  const getBarColor = (rate: number) => {
    if (rate >= 75) return '#10b981';
    if (rate >= 65) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={top} layout="vertical" margin={{ left: 10, right: 30 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis
          type="number"
          allowDecimals={false}
          tick={{ fontSize: 11, fill: '#64748b', fontFamily: 'JetBrains Mono, monospace' }}
          axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="lenderName"
          width={130}
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            borderRadius: 10,
            fontSize: 13,
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#e2e8f0',
          }}
        />
        <Legend wrapperStyle={{ paddingTop: 8, color: '#94a3b8' }} />
        <Bar dataKey="casesSent" name="Cases Sent" fill="rgba(59,130,246,0.6)" radius={[0, 4, 4, 0]} />
        <Bar dataKey="approvals" name="Approvals" radius={[0, 4, 4, 0]}>
          {top.map((entry, i) => (
            <Cell key={`cell-${i}`} fill={getBarColor(entry.approvalRate)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
});

// ── Metric Item (Risk / Ops) ────────────────────────────────────────

function MetricItem({ label, value, icon: Icon, warn }: { label: string; value: string; icon?: React.ElementType; warn?: boolean }) {
  return (
    <div className="rounded-lg bg-white/5 border border-white/10 p-4 min-h-[72px] transition-colors hover:bg-white/[0.07]">
      <div className="flex items-center gap-2 mb-1">
        {Icon && <Icon className="h-3.5 w-3.5 text-slate-500" />}
        <p className="text-xs font-medium text-slate-400">{label}</p>
      </div>
      <p className={`text-lg font-bold font-mono tabular-nums leading-tight ${warn ? 'text-red-400' : 'text-slate-200'}`}>
        {warn && <AlertTriangle className="inline h-4 w-4 mr-1 -mt-0.5 text-red-400" />}
        {value}
      </p>
    </div>
  );
}

// ── Section Header ──────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-base font-semibold text-slate-200 flex items-center gap-2">
        <Icon className="h-4.5 w-4.5 text-cyan-400" /> {title}
      </h2>
      {description && <p className="text-xs text-slate-500 mt-0.5 ml-7">{description}</p>}
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

  const approvalRate = useMemo(() => {
    if (!kpis || kpis.casesSubmitted === 0) return '0%';
    return `${Math.round((kpis.approvals / kpis.casesSubmitted) * 100)}%`;
  }, [kpis]);

  return (
    <div className="min-h-screen bg-slate-950">
      {/* JetBrains Mono font */}
      <link
        href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="text-slate-400 hover:text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                Executive Dashboard
              </h1>
              <p className="text-sm text-slate-500">TCAE — Management Overview</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              className="gap-1.5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/10"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <span className="text-xs text-slate-600 font-mono border border-white/10 rounded-md px-2 py-1 hidden sm:inline-flex">
              Read-only
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] space-y-8 px-6 py-8">
        {/* Error banner */}
        {hasError && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Some data failed to load. Click Refresh to retry.
          </div>
        )}

        {/* SECTION 1 — KPIs */}
        <section>
          <SectionHeader icon={BarChart3} title="Key Performance Indicators" />
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <KPICard icon={Briefcase} title="Total Cases" value={fmtNumber(kpis?.totalCases ?? 0)} loading={isLoading} accentClass="text-white" />
            <KPICard icon={Activity} title="Active Cases" value={fmtNumber(kpis?.activeCases ?? 0)} subtitle="Excl. terminal statuses" loading={isLoading} accentClass="text-cyan-400" />
            <KPICard icon={Send} title="Cases Submitted" value={fmtNumber(kpis?.casesSubmitted ?? 0)} loading={isLoading} accentClass="text-blue-400" />
            <KPICard icon={CheckCircle2} title="Approvals" value={fmtNumber(kpis?.approvals ?? 0)} subtitle={`Rate: ${approvalRate}`} loading={isLoading} accentClass="text-emerald-400" />
            <KPICard icon={DollarSign} title="Funding Requested" value={fmtCurrency(kpis?.totalFundingRequested ?? 0)} loading={isLoading} accentClass="text-white" />
            <KPICard icon={Landmark} title="Funding Pipeline" value={fmtCurrency(kpis?.fundingPipeline ?? 0)} subtitle="Active cases only" loading={isLoading} accentClass="text-amber-400" />
            <KPICard icon={TrendingUp} title="Estimated Revenue" value={fmtCurrency(kpis?.estimatedRevenue ?? 0)} subtitle="2% × approved funding" loading={isLoading} accentClass="text-emerald-400" />
            <KPICard icon={FileCheck} title="Approval Rate" value={approvalRate} subtitle="Approvals / Submitted" loading={isLoading} accentClass="text-cyan-400" />
          </div>
        </section>

        {/* SECTION 2 — Pipeline & Monthly Trend */}
        <section className="grid gap-6 lg:grid-cols-2">
          <GlassCard>
            <SectionHeader icon={BarChart3} title="Pipeline Overview" description="Active case distribution (excl. declined/closed)" />
            <PipelineFunnel data={pipeline} loading={isLoading} />
          </GlassCard>

          <GlassCard>
            <SectionHeader icon={TrendingUp} title="Monthly Funding Trend" description="Funding volume over last 12 months" />
            <MonthlyFundingChart data={monthlyFunding} loading={isLoading} />
          </GlassCard>
        </section>

        {/* SECTION 3 — Lender Performance */}
        <section className="grid gap-6 lg:grid-cols-2">
          <GlassCard>
            <SectionHeader icon={Landmark} title="Lender Performance" description="Approval Rate = Approvals ÷ Cases Sent × 100" />
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full bg-white/10" />
                ))}
              </div>
            ) : !lenderPerformance || lenderPerformance.length === 0 ? (
              <EmptyState message="No lender data available" />
            ) : (
              <div className="overflow-auto max-h-[340px]">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10 hover:bg-transparent">
                      <TableHead className="min-w-[140px] text-slate-400 text-xs uppercase tracking-wider">Lender</TableHead>
                      <TableHead className="text-right w-[80px] text-slate-400 text-xs uppercase tracking-wider">Sent</TableHead>
                      <TableHead className="text-right w-[80px] text-slate-400 text-xs uppercase tracking-wider">Approved</TableHead>
                      <TableHead className="text-right w-[90px] text-slate-400 text-xs uppercase tracking-wider">Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lenderPerformance.map((lp) => {
                      const rateColor =
                        lp.approvalRate >= 75 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                        lp.approvalRate >= 65 ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                        'bg-red-500/20 text-red-300 border-red-500/30';
                      return (
                        <TableRow key={lp.lenderName} className="border-white/5 hover:bg-white/5 transition-colors">
                          <TableCell className="font-medium text-slate-300 truncate max-w-[200px]" title={lp.lenderName}>
                            {lp.lenderName}
                          </TableCell>
                          <TableCell className="text-right font-mono tabular-nums text-slate-300">{lp.casesSent}</TableCell>
                          <TableCell className="text-right font-mono tabular-nums text-slate-300">{lp.approvals}</TableCell>
                          <TableCell className="text-right">
                            <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-mono font-semibold ${rateColor}`}>
                              {lp.approvalRate}%
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </GlassCard>

          <GlassCard>
            <SectionHeader icon={BarChart3} title="Lender Approval Comparison" description="Top lenders by volume" />
            <LenderApprovalChart data={lenderPerformance} loading={isLoading} />
          </GlassCard>
        </section>

        {/* SECTION 4 — Risk Metrics & SECTION 5 — Today's Activity */}
        <section className="grid gap-6 lg:grid-cols-2">
          <GlassCard>
            <SectionHeader icon={ShieldCheck} title="Risk Metrics" />
            {isLoading ? (
              <div className="grid grid-cols-2 gap-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-[72px] w-full rounded-lg bg-white/10" />
                ))}
              </div>
            ) : !riskMetrics ? (
              <EmptyState message="Risk data unavailable" />
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <MetricItem icon={ShieldCheck} label="Avg BBRS Score" value={`${riskMetrics.avgBBRSScore}/100`} />
                <MetricItem icon={TrendingUp} label="Avg Monthly Turnover" value={fmtCurrency(riskMetrics.avgMonthlyTurnover)} />
                <MetricItem icon={DollarSign} label="Avg Loan Size" value={fmtCurrency(riskMetrics.avgLoanSize)} />
                <MetricItem icon={AlertTriangle} label="High Risk Cases" value={fmtNumber(riskMetrics.highRiskCases)} warn={riskMetrics.highRiskCases > 0} />
                <MetricItem icon={AlertTriangle} label="Fraud Alerts" value={fmtNumber(riskMetrics.fraudAlerts)} warn={riskMetrics.fraudAlerts > 0} />
              </div>
            )}
          </GlassCard>

          <GlassCard>
            <SectionHeader
              icon={Activity}
              title="Today's Activity"
              description={new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            />
            {isLoading ? (
              <div className="grid grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-[72px] w-full rounded-lg bg-white/10" />
                ))}
              </div>
            ) : !opsActivity ? (
              <EmptyState message="Activity data unavailable" />
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <MetricItem icon={FileText} label="Cases Created" value={fmtNumber(opsActivity.casesToday)} />
                <MetricItem icon={ClipboardCheck} label="Reports Generated" value={fmtNumber(opsActivity.reportsToday)} />
                <MetricItem icon={Building2} label="Bank Analyses Run" value={fmtNumber(opsActivity.analysesToday)} />
                <MetricItem icon={Users} label="Active Users" value={fmtNumber(opsActivity.activeUsers)} />
              </div>
            )}
          </GlassCard>
        </section>

        {/* SECTION 7 — Top Deals */}
        <GlassCard>
          <SectionHeader icon={Trophy} title="Top Deals by Loan Amount" description="Up to 10 largest deals" />
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full bg-white/10" />
              ))}
            </div>
          ) : !topDeals || topDeals.length === 0 ? (
            <EmptyState message="No deals available" />
          ) : (
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="w-[50px] text-slate-400 text-xs uppercase tracking-wider">#</TableHead>
                    <TableHead className="min-w-[160px] text-slate-400 text-xs uppercase tracking-wider">Company</TableHead>
                    <TableHead className="text-right min-w-[130px] text-slate-400 text-xs uppercase tracking-wider">Loan Amount</TableHead>
                    <TableHead className="min-w-[140px] text-slate-400 text-xs uppercase tracking-wider">Recommended Lender</TableHead>
                    <TableHead className="w-[110px] text-slate-400 text-xs uppercase tracking-wider">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topDeals.map((deal, i) => {
                    const statusInfo = STATUS_MAP[deal.status] || { label: deal.status, color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' };
                    return (
                      <TableRow key={deal.id} className="border-white/5 hover:bg-white/5 transition-colors">
                        <TableCell className="font-mono text-slate-500">{i + 1}</TableCell>
                        <TableCell className="font-medium text-slate-200 truncate max-w-[250px]" title={deal.companyName}>
                          {deal.companyName}
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold tabular-nums text-cyan-300" title={fmtCurrencyFull(deal.loanAmount)}>
                          {fmtCurrency(deal.loanAmount)}
                        </TableCell>
                        <TableCell className="text-slate-400 truncate max-w-[180px]" title={deal.recommendedLender}>
                          {deal.recommendedLender}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </GlassCard>
      </main>
    </div>
  );
}
