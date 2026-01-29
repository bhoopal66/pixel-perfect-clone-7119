import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  CreditCard,
  PieChart,
  RefreshCw,
  Globe,
  Calendar,
  CalendarIcon,
  RotateCcw,
  BarChart3,
  FileText
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar as CalendarComponent } from './ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { cn } from '@/lib/utils';
import type { AnalysisReport } from '../types/transaction.types';
import type { VATReturn } from '../types/turnover.types';
import { TransactionTable } from './TransactionTable';
import { VATReturnsUpload } from './VATReturnsUpload';
import { CurrencyService, type CurrencyCode } from '../services/currencyService';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPie, Pie, Cell, Legend, ComposedChart, Line, ReferenceLine } from 'recharts';

interface ResultsDashboardProps {
  report: AnalysisReport;
  onDownload: () => void;
  onReset: () => void;
}

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({ 
  report, 
  onDownload,
  onReset
}) => {
  const { summary, accountInfo } = report;
  const currency = summary.currency || 'AED';

  // VAT Returns state
  const [vatReturns, setVATReturns] = useState<VATReturn[]>([]);


  // Date range filter state for daily balance chart
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined
  });

  // Get min/max dates from daily balances
  const dateRangeBounds = useMemo(() => {
    if (!report.dailyBalances || report.dailyBalances.length === 0) {
      return { min: undefined, max: undefined };
    }
    const dates = report.dailyBalances.map(d => new Date(d.date));
    return {
      min: new Date(Math.min(...dates.map(d => d.getTime()))),
      max: new Date(Math.max(...dates.map(d => d.getTime())))
    };
  }, [report.dailyBalances]);

  const formatCurrency = (value: number, curr: CurrencyCode = currency) => {
    return CurrencyService.format(value, curr);
  };

  const formatCurrencyShort = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  // Prepare chart data
  const balanceChartData = report.monthlyBalances.map(m => ({
    month: m.month.split(' ')[0],
    average: m.average,
    opening: m.opening,
    closing: m.closing
  }));

  const categoryChartData = report.categoryAnalysis.slice(0, 5).map(c => ({
    name: c.category.length > 15 ? c.category.substring(0, 15) + '...' : c.category,
    amount: c.totalDebit + c.totalCredit
  }));

  // Pie chart data for spending breakdown (debits only)
  const spendingPieData = report.categoryAnalysis
    .filter(c => c.totalDebit > 0)
    .slice(0, 6)
    .map(c => ({
      name: c.category.length > 18 ? c.category.substring(0, 18) + '...' : c.category,
      value: c.totalDebit,
      fullName: c.category
    }));

  // Color palette for pie chart
  const PIE_COLORS = [
    'hsl(var(--primary))',
    'hsl(var(--accent))',
    'hsl(var(--success))',
    'hsl(210 80% 60%)',
    'hsl(280 70% 60%)',
    'hsl(30 80% 55%)'
  ];

  // Filter daily balances by date range
  const filteredDailyBalances = useMemo(() => {
    if (!report.dailyBalances || report.dailyBalances.length === 0) return [];
    
    return report.dailyBalances.filter(day => {
      const dayDate = new Date(day.date);
      if (dateRange.from && dayDate < dateRange.from) return false;
      if (dateRange.to && dayDate > dateRange.to) return false;
      return true;
    });
  }, [report.dailyBalances, dateRange]);

  // Prepare daily closing balance chart data - sample every nth day for better visualization
  const dailyClosingChartData = useMemo(() => {
    if (filteredDailyBalances.length === 0) return [];
    
    // For large datasets, sample to show ~60 points for readability
    const step = Math.max(1, Math.floor(filteredDailyBalances.length / 60));
    
    return filteredDailyBalances
      .filter((_, index) => index % step === 0 || index === filteredDailyBalances.length - 1)
      .map(day => ({
        date: new Date(day.date).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        }),
        fullDate: day.date,
        closingBalance: day.closingBalance,
        hasTransactions: day.hasTransactions,
        month: day.month
      }));
  }, [filteredDailyBalances]);

  // Calculate average daily closing balance for filtered data
  const averageDailyClosing = useMemo(() => {
    if (filteredDailyBalances.length === 0) return 0;
    const sum = filteredDailyBalances.reduce((acc, day) => acc + day.closingBalance, 0);
    return sum / filteredDailyBalances.length;
  }, [filteredDailyBalances]);

  // Reset date range filter
  const resetDateRange = () => {
    setDateRange({ from: undefined, to: undefined });
  };

  // Check if filter is active
  const isFilterActive = dateRange.from || dateRange.to;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full max-w-7xl mx-auto"
    >
      {/* Header Section */}
      <motion.div variants={itemVariants} className="card-elevated p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">
              Analysis Complete
            </h1>
            <p className="text-muted-foreground">
              {accountInfo.accountName || 'Bank Account'} • {accountInfo.period || '6 Month Analysis'}
            </p>
            {accountInfo.currencies && accountInfo.currencies.length > 1 && (
              <div className="flex items-center gap-2 mt-2">
                <Globe className="h-4 w-4 text-accent" />
                <span className="text-sm text-accent">
                  Multi-currency: {accountInfo.currencies.join(', ')}
                </span>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={onReset}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              New Analysis
            </Button>
            <Button
              onClick={onDownload}
              className="gap-2 gradient-success hover:opacity-90"
            >
              <Download className="h-4 w-4" />
              Download Excel Report
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Key Metrics Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          icon={<Wallet className="h-5 w-5" />}
          label="Opening Balance"
          value={summary.openingBalance}
          format="currency"
          iconBg="bg-primary/10"
          iconColor="text-primary"
          currency={currency}
        />
        <MetricCard
          icon={<DollarSign className="h-5 w-5" />}
          label="Closing Balance"
          value={summary.closingBalance}
          format="currency"
          iconBg="bg-accent/10"
          iconColor="text-accent"
          currency={currency}
        />
        <MetricCard
          icon={<ArrowUpRight className="h-5 w-5" />}
          label="Total Credits"
          value={summary.totalCredits}
          format="currency"
          subtitle={`${summary.creditCount} transactions`}
          iconBg="bg-success/10"
          iconColor="text-success"
          currency={currency}
        />
        <MetricCard
          icon={<ArrowDownRight className="h-5 w-5" />}
          label="Total Debits"
          value={summary.totalDebits}
          format="currency"
          subtitle={`${summary.debitCount} transactions`}
          iconBg="bg-destructive/10"
          iconColor="text-destructive"
          currency={currency}
        />
      </motion.div>

      {/* Net Change Card */}
      <motion.div variants={itemVariants} className="card-elevated p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">
              Net Change (6 Months)
            </p>
            <p className={`text-4xl font-bold ${
              summary.netChange >= 0 ? 'text-success' : 'text-destructive'
            }`}>
              {formatCurrency(summary.netChange)}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {summary.openingBalance > 0 ? (
                <>
                  {((summary.netChange / summary.openingBalance) * 100).toFixed(1)}% 
                  {summary.netChange >= 0 ? ' increase' : ' decrease'} from opening balance
                </>
              ) : 'N/A'}
            </p>
          </div>
          <div className={`p-6 rounded-2xl ${
            summary.netChange >= 0 ? 'bg-success/10' : 'bg-destructive/10'
          }`}>
            {summary.netChange >= 0 ? (
              <TrendingUp className="h-12 w-12 text-success" />
            ) : (
              <TrendingDown className="h-12 w-12 text-destructive" />
            )}
          </div>
        </div>
      </motion.div>

      {/* VAT Returns Section */}
      <motion.div variants={itemVariants} className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <BarChart3 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              VAT Returns
            </h2>
            <p className="text-sm text-muted-foreground">
              Compare bank turnover with VAT taxable sales
            </p>
          </div>
        </div>
        <VATReturnsUpload
          vatReturns={vatReturns}
          onVATReturnsChange={setVATReturns}
          currency={currency}
        />
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Monthly Balance Chart */}
        <motion.div variants={itemVariants} className="card-elevated p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Monthly Balance Trend
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={balanceChartData}>
                <defs>
                  <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [`${formatCurrency(value)}`, 'Average']}
                />
                <Area 
                  type="monotone" 
                  dataKey="average" 
                  stroke="hsl(var(--accent))" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorBalance)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Spending Breakdown Pie Chart */}
        <motion.div variants={itemVariants} className="card-elevated p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Spending by Category
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPie>
                <Pie
                  data={spendingPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1 }}
                >
                  {spendingPieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number, name: string, props: any) => [
                    `${formatCurrency(value)}`, 
                    props.payload?.fullName || name
                  ]}
                />
              </RechartsPie>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Second Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Category Distribution Bar */}
        <motion.div variants={itemVariants} className="card-elevated p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Top Transaction Categories
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} />
                <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={11} width={100} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [`${formatCurrency(value)}`, 'Amount']}
                />
                <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Credits vs Debits Pie */}
        <motion.div variants={itemVariants} className="card-elevated p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Credits vs Debits
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPie>
                <Pie
                  data={[
                    { name: 'Total Credits', value: summary.totalCredits, color: 'hsl(var(--success))' },
                    { name: 'Total Debits', value: summary.totalDebits, color: 'hsl(var(--destructive))' }
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  <Cell fill="hsl(142 76% 36%)" />
                  <Cell fill="hsl(0 84% 60%)" />
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [`${formatCurrency(value)}`, '']}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  formatter={(value) => <span className="text-sm text-foreground">{value}</span>}
                />
              </RechartsPie>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Daily Closing Balance Trend Chart */}
      <motion.div variants={itemVariants} className="card-elevated p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent/10">
              <Calendar className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Daily Closing Balance Trend
              </h3>
              <p className="text-sm text-muted-foreground">
                {filteredDailyBalances.length} of {report.dailyBalances?.length || 0} days
                {isFilterActive && ' (filtered)'} • End-of-day balances
              </p>
            </div>
          </div>
          
          {/* Date Range Selector */}
          <div className="flex flex-wrap items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "justify-start text-left font-normal h-9",
                    !dateRange.from && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? format(dateRange.from, "MMM d, yyyy") : "From date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={dateRange.from}
                  onSelect={(date) => setDateRange(prev => ({ ...prev, from: date }))}
                  disabled={(date) => 
                    (dateRangeBounds.min && date < dateRangeBounds.min) ||
                    (dateRangeBounds.max && date > dateRangeBounds.max) ||
                    (dateRange.to && date > dateRange.to)
                  }
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            
            <span className="text-muted-foreground text-sm">to</span>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "justify-start text-left font-normal h-9",
                    !dateRange.to && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.to ? format(dateRange.to, "MMM d, yyyy") : "To date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={dateRange.to}
                  onSelect={(date) => setDateRange(prev => ({ ...prev, to: date }))}
                  disabled={(date) => 
                    (dateRangeBounds.min && date < dateRangeBounds.min) ||
                    (dateRangeBounds.max && date > dateRangeBounds.max) ||
                    (dateRange.from && date < dateRange.from)
                  }
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            
            {isFilterActive && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetDateRange}
                className="h-9 px-2 text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Reset
              </Button>
            )}
            
            <div className="ml-auto text-right hidden sm:block">
              <p className="text-xs text-muted-foreground">Average Daily Closing</p>
              <p className="text-lg font-bold text-accent">
                {formatCurrency(averageDailyClosing)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={dailyClosingChartData}>
              <defs>
                <linearGradient id="colorClosingBalance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="date" 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={11}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={11}
                tickFormatter={(v) => `${(v/1000).toFixed(0)}K`}
                tickLine={false}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
                formatter={(value: number, name: string, props: any) => [
                  `${formatCurrency(value)}`,
                  'Closing Balance'
                ]}
                labelFormatter={(label, payload) => {
                  if (payload?.[0]?.payload) {
                    const data = payload[0].payload;
                    return (
                      <div>
                        <div className="font-medium">{data.fullDate}</div>
                        <div className="text-xs text-muted-foreground">
                          {data.hasTransactions ? '✓ Transaction day' : '→ Carried forward'}
                        </div>
                      </div>
                    );
                  }
                  return label;
                }}
              />
              <ReferenceLine 
                y={averageDailyClosing} 
                stroke="hsl(var(--accent))" 
                strokeDasharray="5 5"
                strokeWidth={2}
                label={{ 
                  value: 'Avg', 
                  position: 'right',
                  fill: 'hsl(var(--accent))',
                  fontSize: 11
                }}
              />
              <Area 
                type="monotone" 
                dataKey="closingBalance" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorClosingBalance)" 
              />
              <Line
                type="monotone"
                dataKey="closingBalance"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
                activeDot={{ 
                  r: 6, 
                  fill: 'hsl(var(--primary))',
                  stroke: 'hsl(var(--background))',
                  strokeWidth: 2
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-4 flex items-center gap-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary"></div>
            <span>Daily Closing Balance</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 bg-accent" style={{ borderStyle: 'dashed' }}></div>
            <span>Average ({formatCurrency(averageDailyClosing)})</span>
          </div>
          <div className="ml-auto text-muted-foreground/70">
            Closing balance = last transaction balance of each day
          </div>
        </div>
      </motion.div>

      {/* Monthly Balances Table */}
      <motion.div variants={itemVariants} className="card-elevated p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <CreditCard className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">
            Monthly Balance Summary
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Month
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Average Balance
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Opening
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Closing
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Days
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {report.monthlyBalances.map((month, idx) => (
                <tr key={idx} className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                    {month.month}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-foreground text-right font-medium">
                    {formatCurrency(month.average)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-muted-foreground text-right">
                    {formatCurrency(month.opening)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-muted-foreground text-right">
                    {formatCurrency(month.closing)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-muted-foreground text-center">
                    {month.days}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Category Analysis */}
      <motion.div variants={itemVariants} className="card-elevated p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-accent/10">
            <PieChart className="h-5 w-5 text-accent" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">
            Transaction Categories
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {report.categoryAnalysis.slice(0, 9).map((cat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="p-4 rounded-xl border border-border/50 hover:border-accent/30 hover:bg-accent/5 transition-all"
            >
              <p className="text-sm font-medium text-muted-foreground mb-1 truncate">
                {cat.category}
              </p>
              <p className="text-xs text-muted-foreground mb-2">
                {cat.count} transaction{cat.count !== 1 ? 's' : ''}
              </p>
              <div className="flex items-baseline justify-between">
                <span className="text-lg font-bold text-foreground">
                  {formatCurrency(cat.totalDebit + cat.totalCredit)}
                </span>
                {cat.totalCredit > cat.totalDebit ? (
                  <span className="text-xs text-success font-medium">+Credit</span>
                ) : (
                  <span className="text-xs text-destructive font-medium">-Debit</span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Transaction Browser */}
      <motion.div variants={itemVariants} className="mt-6">
        <TransactionTable transactions={report.transactions} />
      </motion.div>
    </motion.div>
  );
};

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  format: 'currency' | 'number';
  subtitle?: string;
  iconBg: string;
  iconColor: string;
  currency?: CurrencyCode;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  icon, 
  label, 
  value, 
  format, 
  subtitle,
  iconBg,
  iconColor,
  currency = 'AED'
}) => {
  const formatValue = (val: number) => {
    if (format === 'currency') {
      return CurrencyService.format(val, currency);
    }
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(val);
  };

  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 400 }}
      className="metric-card"
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <div className={`p-2.5 rounded-xl ${iconBg}`}>
          <span className={iconColor}>{icon}</span>
        </div>
      </div>
      <p className="text-2xl font-bold text-foreground">
        {formatValue(value)}
      </p>
      {subtitle && (
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      )}
    </motion.div>
  );
};
