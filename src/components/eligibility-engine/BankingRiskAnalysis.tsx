import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  TrendingUp, TrendingDown, AlertTriangle, Shield, DollarSign, Users,
  ArrowUpDown, Repeat, Building2, CreditCard, Globe, Landmark, BarChart3,
  Minus, Activity, CircleDollarSign, Banknote,
} from 'lucide-react';
import { CurrencyService } from '@/services/currencyService';
import type { BankAnalysisResult, ConsolidatedAnalysis } from '@/services/bankingRiskAnalysisEngine';

interface Props {
  accountResults: BankAnalysisResult[];
  consolidated: ConsolidatedAnalysis | null;
}

const fmt = (v: number) => CurrencyService.format(v, 'AED');
const pct = (v: number) => `${(v * 100).toFixed(1)}%`;

type RiskLevel = 'green' | 'yellow' | 'red';

const RiskBadge: React.FC<{ level: RiskLevel; label: string }> = ({ level, label }) => {
  const colors: Record<RiskLevel, string> = {
    green: 'bg-success/10 text-success border-success/30',
    yellow: 'bg-warning/10 text-warning border-warning/30',
    red: 'bg-destructive/10 text-destructive border-destructive/30',
  };
  return <Badge variant="outline" className={`${colors[level]} text-xs`}>{label}</Badge>;
};

const MetricCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  value: string;
  risk: RiskLevel;
  riskLabel: string;
  sub?: string;
}> = ({ icon, title, value, risk, riskLabel, sub }) => (
  <Card className={`border-${risk === 'red' ? 'destructive' : risk === 'yellow' ? 'warning' : 'success'}/20`}>
    <CardContent className="pt-5 pb-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-muted-foreground">{title}</p>
        {icon}
      </div>
      <p className="text-lg font-bold text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      <div className="mt-2"><RiskBadge level={risk} label={riskLabel} /></div>
    </CardContent>
  </Card>
);

export const BankingRiskAnalysis: React.FC<Props> = ({ accountResults, consolidated }) => {
  if (!consolidated || accountResults.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <Shield className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No Banking Risk Analysis Available</p>
          <p className="text-sm mt-1">Run the analysis after uploading bank statements.</p>
        </CardContent>
      </Card>
    );
  }

  const c = consolidated;

  const getRisk = (flag: boolean, ratio: number, warn: number, crit: number): RiskLevel => {
    if (flag || ratio > crit) return 'red';
    if (ratio > warn) return 'yellow';
    return 'green';
  };

  const trendRisk: RiskLevel = c.balance_trend === 'declining' ? 'red'
    : c.balance_trend === 'volatile' ? 'yellow' : 'green';

  return (
    <div className="space-y-6">
      {/* Risk Summary Flags */}
      {c.overall_risk_flags.length > 0 && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <h3 className="font-semibold text-foreground">Risk Flags Identified</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {c.overall_risk_flags.map((flag, i) => (
                <Badge key={i} variant="destructive" className="text-xs">{flag}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          icon={<TrendingUp className="h-4 w-4 text-success" />}
          title="Avg Monthly Credit"
          value={fmt(c.total_monthly_credit)}
          risk="green"
          riskLabel="Turnover"
          sub={`${c.accounts_analyzed} account(s), ${c.total_months_covered} months`}
        />
        <MetricCard
          icon={<TrendingDown className="h-4 w-4 text-destructive" />}
          title="Avg Monthly Debit"
          value={fmt(c.total_monthly_debit)}
          risk="green"
          riskLabel="Outflows"
        />
        <MetricCard
          icon={<DollarSign className="h-4 w-4 text-primary" />}
          title="Avg EOD Balance"
          value={fmt(c.overall_eod_balance)}
          risk={c.overall_eod_balance < 0 ? 'red' : 'green'}
          riskLabel={c.overall_eod_balance < 0 ? 'Negative' : 'Healthy'}
        />
        <MetricCard
          icon={<Activity className="h-4 w-4 text-primary" />}
          title="Balance Trend"
          value={c.balance_trend.charAt(0).toUpperCase() + c.balance_trend.slice(1)}
          risk={trendRisk}
          riskLabel={trendRisk === 'green' ? 'Healthy' : trendRisk === 'yellow' ? 'Monitor' : 'Warning'}
        />
      </div>

      {/* Detailed Analysis Tabs */}
      <Tabs defaultValue="turnover">
        <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
          <TabsTrigger value="turnover" className="text-xs">Turnover</TabsTrigger>
          <TabsTrigger value="balance" className="text-xs">Balance</TabsTrigger>
          <TabsTrigger value="cash" className="text-xs">Cash</TabsTrigger>
          <TabsTrigger value="concentration" className="text-xs">Concentration</TabsTrigger>
          <TabsTrigger value="loans" className="text-xs">Loans</TabsTrigger>
          <TabsTrigger value="payroll" className="text-xs">Payroll</TabsTrigger>
          <TabsTrigger value="related" className="text-xs">Related Party</TabsTrigger>
          <TabsTrigger value="roundtrip" className="text-xs">Round-trip</TabsTrigger>
          <TabsTrigger value="od" className="text-xs">OD</TabsTrigger>
          <TabsTrigger value="fx" className="text-xs">FX</TabsTrigger>
          <TabsTrigger value="govt" className="text-xs">Govt</TabsTrigger>
        </TabsList>

        {/* 1 & 2: Turnover */}
        <TabsContent value="turnover">
          <Card>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" /> Turnover Analysis</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account</TableHead>
                    <TableHead className="text-right">Avg Credit (12m)</TableHead>
                    <TableHead className="text-right">Avg Credit (Full)</TableHead>
                    <TableHead className="text-right">Avg Debit (12m)</TableHead>
                    <TableHead className="text-right">Avg Debit (Full)</TableHead>
                    <TableHead className="text-right">Total Credits</TableHead>
                    <TableHead className="text-right">Months</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accountResults.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{r.bank_name || 'Unknown'} – {r.account_number || 'N/A'}</TableCell>
                      <TableCell className="text-right font-mono text-sm text-success">{fmt(r.avg_monthly_credit_12m)}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{fmt(r.avg_monthly_credit_24m)}</TableCell>
                      <TableCell className="text-right font-mono text-sm text-destructive">{fmt(r.avg_monthly_debit_12m)}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{fmt(r.avg_monthly_debit_24m)}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{fmt(r.total_credits)}</TableCell>
                      <TableCell className="text-right">{r.months_covered}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3 & 4: Balance Stability */}
        <TabsContent value="balance">
          <div className="grid gap-4 md:grid-cols-2">
            {accountResults.map((r, i) => (
              <Card key={i}>
                <CardHeader><CardTitle className="text-base">{r.bank_name || 'Account'} – {r.account_number || 'N/A'}</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div><p className="text-xs text-muted-foreground">Avg EOD Balance</p><p className="text-lg font-bold">{fmt(r.average_eod_balance)}</p></div>
                    <div><p className="text-xs text-muted-foreground">Trend</p><p className="text-lg font-bold capitalize">{r.month_end_balance_trend}</p></div>
                    <div><p className="text-xs text-muted-foreground">Min Balance</p><p className="font-semibold">{fmt(r.min_monthly_balance)}</p><p className="text-xs text-muted-foreground">{r.trough_month}</p></div>
                    <div><p className="text-xs text-muted-foreground">Max Balance</p><p className="font-semibold">{fmt(r.max_monthly_balance)}</p><p className="text-xs text-muted-foreground">{r.peak_month}</p></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 5: Cheque returns (inside cash tab) & 8: Cash */}
        <TabsContent value="cash">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Banknote className="h-4 w-4" /> Cash Deposit Analysis</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>Account</TableHead><TableHead className="text-right">Cash Ratio</TableHead><TableHead>Risk</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {accountResults.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-sm">{r.bank_name} – {r.account_number || 'N/A'}</TableCell>
                        <TableCell className="text-right font-mono">{pct(r.cash_deposit_ratio)}</TableCell>
                        <TableCell><RiskBadge level={getRisk(r.cash_risk_flag, r.cash_deposit_ratio, 0.2, 0.4)} label={r.cash_risk_flag ? 'High' : r.cash_deposit_ratio > 0.2 ? 'Moderate' : 'Low'} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Cheque Return Analysis</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>Account</TableHead><TableHead className="text-right">Returns</TableHead><TableHead className="text-right">Value</TableHead><TableHead className="text-right">Ratio</TableHead><TableHead>Risk</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {accountResults.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-sm">{r.bank_name}</TableCell>
                        <TableCell className="text-right">{r.returned_cheque_count}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{fmt(r.returned_cheque_value)}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{pct(r.returned_cheque_ratio)}</TableCell>
                        <TableCell><RiskBadge level={getRisk(r.returned_cheque_flag, r.returned_cheque_ratio, 0.02, 0.05)} label={r.returned_cheque_flag ? 'High' : 'Low'} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 9: Concentration */}
        <TabsContent value="concentration">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Building2 className="h-4 w-4" /> Customer Concentration</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Account</TableHead><TableHead>Largest Payer</TableHead><TableHead className="text-right">Ratio</TableHead><TableHead>Risk</TableHead></TableRow></TableHeader>
                <TableBody>
                  {accountResults.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-sm">{r.bank_name} – {r.account_number || 'N/A'}</TableCell>
                      <TableCell className="font-medium">{r.largest_payer_name || 'N/A'}</TableCell>
                      <TableCell className="text-right font-mono">{pct(r.largest_payer_ratio)}</TableCell>
                      <TableCell><RiskBadge level={getRisk(r.payer_concentration_flag, r.largest_payer_ratio, 0.2, 0.3)} label={r.payer_concentration_flag ? 'High' : 'Acceptable'} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 6: Loans / EMI */}
        <TabsContent value="loans">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><CreditCard className="h-4 w-4" /> EMI / Loan Deduction Mapping</CardTitle></CardHeader>
            <CardContent>
              {accountResults.map((r, i) => (
                <div key={i} className="mb-4 last:mb-0">
                  <p className="font-medium text-sm mb-2">{r.bank_name} – Monthly EMI: {fmt(r.emi_monthly_total)}</p>
                  {r.emi_lender_list.length > 0 ? (
                    <Table>
                      <TableHeader><TableRow><TableHead>Lender</TableHead><TableHead className="text-right">Monthly Amount</TableHead><TableHead>Frequency</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {r.emi_lender_list.map((e, j) => (
                          <TableRow key={j}>
                            <TableCell>{e.lender}</TableCell>
                            <TableCell className="text-right font-mono">{fmt(e.amount)}</TableCell>
                            <TableCell><Badge variant="outline" className="text-xs">{e.frequency}</Badge></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : <p className="text-sm text-muted-foreground">No EMI deductions detected</p>}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 7: Payroll */}
        <TabsContent value="payroll">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" /> WPS Salary Analysis</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Account</TableHead><TableHead className="text-right">Monthly Outflow</TableHead><TableHead className="text-right">Est. Employees</TableHead><TableHead>Consistency</TableHead></TableRow></TableHeader>
                <TableBody>
                  {accountResults.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-sm">{r.bank_name}</TableCell>
                      <TableCell className="text-right font-mono">{fmt(r.monthly_salary_outflow)}</TableCell>
                      <TableCell className="text-right">{r.estimated_employee_count}</TableCell>
                      <TableCell>
                        <RiskBadge
                          level={r.salary_consistency_flag === 'consistent' ? 'green' : r.salary_consistency_flag === 'irregular' ? 'yellow' : 'red'}
                          label={r.salary_consistency_flag}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 12: Related Party */}
        <TabsContent value="related">
          <RiskMetricCard
            title="Related Party / Inter-Company Flows"
            icon={<ArrowUpDown className="h-4 w-4" />}
            results={accountResults}
            getValue={r => r.related_party_flow_ratio}
            getFlag={r => r.related_party_flag}
            warnThreshold={0.1}
            critThreshold={0.15}
          />
        </TabsContent>

        {/* 11: Round Tripping */}
        <TabsContent value="roundtrip">
          <RiskMetricCard
            title="Circular Transaction / Round Tripping Detection"
            icon={<Repeat className="h-4 w-4" />}
            results={accountResults}
            getValue={r => r.circular_flow_ratio}
            getFlag={r => r.round_tripping_flag}
            warnThreshold={0.05}
            critThreshold={0.1}
          />
        </TabsContent>

        {/* 13: OD */}
        <TabsContent value="od">
          <RiskMetricCard
            title="OD / CC Utilization"
            icon={<Minus className="h-4 w-4" />}
            results={accountResults}
            getValue={r => r.od_utilization_ratio}
            getFlag={() => false}
            warnThreshold={0.3}
            critThreshold={0.6}
          />
        </TabsContent>

        {/* 14: FX */}
        <TabsContent value="fx">
          <RiskMetricCard
            title="Foreign Currency Exposure"
            icon={<Globe className="h-4 w-4" />}
            results={accountResults}
            getValue={r => r.fx_transaction_ratio}
            getFlag={r => r.fx_exposure_flag}
            warnThreshold={0.1}
            critThreshold={0.2}
          />
        </TabsContent>

        {/* 15: Government */}
        <TabsContent value="govt">
          <RiskMetricCard
            title="Government / Semi-Government Receipts"
            icon={<Landmark className="h-4 w-4" />}
            results={accountResults}
            getValue={r => r.government_receipt_ratio}
            getFlag={r => r.government_receivable_flag}
            warnThreshold={0.15}
            critThreshold={0.3}
            positiveLabel="Gov receipts detected"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Reusable risk metric card for simple ratio-based analysis
const RiskMetricCard: React.FC<{
  title: string;
  icon: React.ReactNode;
  results: BankAnalysisResult[];
  getValue: (r: BankAnalysisResult) => number;
  getFlag: (r: BankAnalysisResult) => boolean;
  warnThreshold: number;
  critThreshold: number;
  positiveLabel?: string;
}> = ({ title, icon, results, getValue, getFlag, warnThreshold, critThreshold, positiveLabel }) => (
  <Card>
    <CardHeader><CardTitle className="text-base flex items-center gap-2">{icon} {title}</CardTitle></CardHeader>
    <CardContent>
      <Table>
        <TableHeader><TableRow><TableHead>Account</TableHead><TableHead className="text-right">Ratio</TableHead><TableHead>Risk</TableHead></TableRow></TableHeader>
        <TableBody>
          {results.map((r, i) => {
            const v = getValue(r);
            const f = getFlag(r);
            const risk: RiskLevel = f || v > critThreshold ? 'red' : v > warnThreshold ? 'yellow' : 'green';
            return (
              <TableRow key={i}>
                <TableCell className="text-sm">{r.bank_name} – {r.account_number || 'N/A'}</TableCell>
                <TableCell className="text-right font-mono">{pct(v)}</TableCell>
                <TableCell>
                  <RiskBadge
                    level={risk}
                    label={risk === 'red' ? 'High Risk' : risk === 'yellow' ? 'Monitor' : (positiveLabel || 'Healthy')}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </CardContent>
  </Card>
);
