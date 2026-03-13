import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  Trophy, TrendingUp, Shield, Building2, Star, MessageSquare,
  CheckCircle, AlertTriangle, XCircle, ChevronDown, ChevronUp
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CurrencyService } from '@/services/currencyService';
import type { LenderMatchResult } from '@/services/lenderMatchingEngine';

interface FundingRecommendationProps {
  results: LenderMatchResult[];
  isLoading?: boolean;
}

const fmt = (v: number) => CurrencyService.format(v, 'AED');

const statusBadge = (status: string) => {
  switch (status) {
    case 'eligible':
      return <Badge className="bg-success/10 text-success border-success/30"><CheckCircle className="h-3 w-3 mr-1" />Eligible</Badge>;
    case 'conditionally_eligible':
      return <Badge className="bg-warning/10 text-warning border-warning/30"><AlertTriangle className="h-3 w-3 mr-1" />Conditional</Badge>;
    case 'review_required':
      return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30"><AlertTriangle className="h-3 w-3 mr-1" />Review</Badge>;
    default:
      return <Badge className="bg-destructive/10 text-destructive border-destructive/30"><XCircle className="h-3 w-3 mr-1" />Not Eligible</Badge>;
  }
};

const ScoreBar: React.FC<{ label: string; score: number; max: number; color?: string }> = ({
  label, score, max, color
}) => (
  <div className="space-y-1">
    <div className="flex justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{Math.round(score)}/{max}</span>
    </div>
    <Progress value={(score / max) * 100} className={`h-2 ${color || ''}`} />
  </div>
);

const BestMatchCard: React.FC<{ result: LenderMatchResult }> = ({ result }) => (
  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-background shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <Trophy className="h-5 w-5 text-primary" />
          <Badge className="bg-primary/10 text-primary border-primary/30">Best Funding Option</Badge>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">{result.lender_name}</CardTitle>
              {result.product_name && (
                <CardDescription>{result.product_name}</CardDescription>
              )}
            </div>
          </div>
          {statusBadge(result.decision_status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Key metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold text-foreground">{fmt(result.recommended_limit)}</p>
            <p className="text-xs text-muted-foreground">Recommended Limit</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold text-primary">{result.approval_probability}%</p>
            <p className="text-xs text-muted-foreground">Approval Probability</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold text-foreground">{Math.round(result.match_score)}</p>
            <p className="text-xs text-muted-foreground">Match Score</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold text-foreground">{result.recommended_tenure || '-'}</p>
            <p className="text-xs text-muted-foreground">Tenure (months)</p>
          </div>
        </div>

        {/* Score breakdown */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Score Breakdown</p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            <ScoreBar label="Eligibility" score={result.eligibility_score} max={40} />
            <ScoreBar label="Rule Pass Rate" score={result.rule_pass_score} max={20} />
            <ScoreBar label="Limit Strength" score={result.limit_score} max={20} />
            <ScoreBar label="Risk Quality" score={result.risk_score} max={20} />
          </div>
        </div>

        {/* Reasons */}
        {result.recommendation_reasons.length > 0 && (
          <div>
            <p className="text-sm font-medium text-foreground mb-2">Why This Lender</p>
            <div className="flex flex-wrap gap-1.5">
              {result.recommendation_reasons.map((reason, i) => (
                <Badge key={i} variant="outline" className="text-xs border-success/30 text-success">
                  <CheckCircle className="h-3 w-3 mr-1" />{reason}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Risk flags */}
        {result.risk_flags.length > 0 && (
          <div>
            <p className="text-sm font-medium text-foreground mb-2">Risk Flags</p>
            <div className="flex flex-wrap gap-1.5">
              {result.risk_flags.map((flag, i) => (
                <Badge key={i} variant="outline" className="text-xs border-warning text-warning">
                  <AlertTriangle className="h-3 w-3 mr-1" />{flag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Sales pitch */}
        {result.sales_pitch && (
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-start gap-2">
              <MessageSquare className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium text-primary mb-1">Recommended Pitch</p>
                <p className="text-sm text-foreground">{result.sales_pitch}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  </motion.div>
);

const AlternativeOption: React.FC<{ result: LenderMatchResult }> = ({ result }) => {
  const [open, setOpen] = React.useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="cursor-pointer"
        >
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground">
                    {result.rank_position}
                  </div>
                  <div className="p-2 rounded-lg bg-muted">
                    <Building2 className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{result.lender_name}</p>
                    {result.product_name && (
                      <p className="text-xs text-muted-foreground">{result.product_name}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-bold">{fmt(result.recommended_limit)}</p>
                    <p className="text-xs text-muted-foreground">Limit</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary">{result.approval_probability}%</p>
                    <p className="text-xs text-muted-foreground">Probability</p>
                  </div>
                  <div className="text-right hidden md:block">
                    <p className="text-sm font-bold">{Math.round(result.match_score)}</p>
                    <p className="text-xs text-muted-foreground">Score</p>
                  </div>
                  {statusBadge(result.decision_status)}
                  {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <Card className="mt-1 border-t-0 rounded-t-none">
          <CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <ScoreBar label="Eligibility" score={result.eligibility_score} max={40} />
              <ScoreBar label="Rule Pass" score={result.rule_pass_score} max={20} />
              <ScoreBar label="Limit" score={result.limit_score} max={20} />
              <ScoreBar label="Risk" score={result.risk_score} max={20} />
            </div>
            {result.recommendation_reasons.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {result.recommendation_reasons.map((r, i) => (
                  <Badge key={i} variant="outline" className="text-xs">{r}</Badge>
                ))}
              </div>
            )}
            {result.sales_pitch && (
              <div className="p-2 rounded bg-muted/50 text-sm text-muted-foreground">
                <MessageSquare className="h-3 w-3 inline mr-1" />{result.sales_pitch}
              </div>
            )}
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
};

export const FundingRecommendation: React.FC<FundingRecommendationProps> = ({
  results, isLoading
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 text-center py-12">
          <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
          <h3 className="text-lg font-semibold mb-2">Analyzing Funding Options...</h3>
          <p className="text-muted-foreground">Running matching engine across all lenders</p>
        </CardContent>
      </Card>
    );
  }

  if (results.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center py-12">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Funding Options Available</h3>
          <p className="text-muted-foreground">
            Run the analysis to generate funding recommendations.
          </p>
        </CardContent>
      </Card>
    );
  }

  const bestMatch = results.find(r => r.is_best_match) || results[0];
  const alternatives = results.filter(r => !r.is_best_match);

  return (
    <div className="space-y-6">
      {/* Best Match */}
      <BestMatchCard result={bestMatch} />

      {/* Comparison Table */}
      {results.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="h-4 w-4 text-primary" />
              Lender Comparison
            </CardTitle>
            <CardDescription>All evaluated lenders ranked by match score</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Rank</TableHead>
                  <TableHead>Lender</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Limit</TableHead>
                  <TableHead className="text-center">Tenure</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Score</TableHead>
                  <TableHead className="text-center">Probability</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((r) => (
                  <TableRow key={r.id || `${r.lender_id}-${r.product_id}`} className={r.is_best_match ? 'bg-primary/5' : ''}>
                    <TableCell>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${r.is_best_match ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                        {r.rank_position}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{r.lender_name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{r.product_name || '-'}</TableCell>
                    <TableCell className="text-right font-medium">{fmt(r.recommended_limit)}</TableCell>
                    <TableCell className="text-center">{r.recommended_tenure || '-'}</TableCell>
                    <TableCell className="text-center">{statusBadge(r.decision_status)}</TableCell>
                    <TableCell className="text-center font-bold">{Math.round(r.match_score)}</TableCell>
                    <TableCell className="text-center">
                      <span className={`font-bold ${r.approval_probability >= 70 ? 'text-success' : r.approval_probability >= 40 ? 'text-warning' : 'text-destructive'}`}>
                        {r.approval_probability}%
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Alternative Options with expandable details */}
      {alternatives.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Alternative Options</h3>
          {alternatives.map((r) => (
            <AlternativeOption key={r.id || `${r.lender_id}-${r.product_id}`} result={r} />
          ))}
        </div>
      )}
    </div>
  );
};
