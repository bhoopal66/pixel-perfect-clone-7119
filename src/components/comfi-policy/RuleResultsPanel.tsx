import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CheckCircle, XCircle, Minus, AlertTriangle, ChevronDown } from 'lucide-react';
import type { ComfiRuleLogEntry } from '@/services/comfiPolicyService';

function getRuleIcon(status: string) {
  switch (status) {
    case 'Passed': case 'Applied': case 'Completed': case 'Allowed':
      return <CheckCircle className="h-4 w-4 text-emerald-500" />;
    case 'Failed':
      return <XCircle className="h-4 w-4 text-destructive" />;
    case 'Not Applicable':
      return <Minus className="h-4 w-4 text-muted-foreground" />;
    default:
      return <AlertTriangle className="h-4 w-4 text-amber-500" />;
  }
}

function getStatusClasses(status: string) {
  switch (status) {
    case 'Passed': case 'Applied': case 'Completed': case 'Allowed':
      return 'bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:text-emerald-400 dark:border-emerald-800';
    case 'Failed':
      return 'bg-destructive/10 text-destructive border-destructive/20';
    case 'Not Applicable':
      return 'bg-muted text-muted-foreground border-border';
    default:
      return 'bg-amber-500/10 text-amber-700 border-amber-200';
  }
}

interface RuleResultsPanelProps {
  ruleLog: ComfiRuleLogEntry[];
}

export function RuleResultsPanel({ ruleLog }: RuleResultsPanelProps) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base">Decision Log — Rule-by-Rule</CardTitle>
        <CardDescription>Complete audit trail of the COMFI policy evaluation</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead className="w-10" />
              <TableHead>Rule Code</TableHead>
              <TableHead>Rule Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="min-w-[200px]">Explanation</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ruleLog.map((entry) => (
              <Collapsible key={entry.sequence} asChild>
                <>
                  <CollapsibleTrigger asChild>
                    <TableRow className={`cursor-pointer hover:bg-muted/50 ${entry.status === 'Failed' ? 'bg-destructive/5' : ''}`}>
                      <TableCell className="text-xs text-muted-foreground font-mono">{entry.sequence}</TableCell>
                      <TableCell>{getRuleIcon(entry.status)}</TableCell>
                      <TableCell className="font-mono text-xs">{entry.rule_code}</TableCell>
                      <TableCell className="text-sm font-medium">{entry.rule_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusClasses(entry.status)}>{entry.status}</Badge>
                        {entry.is_hard_decline && (
                          <Badge variant="outline" className="ml-1 text-[10px] bg-destructive/5 text-destructive border-destructive/20">Hard Decline</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        <div className="flex items-center justify-between">
                          <span className="line-clamp-1">{entry.message}</span>
                          {(entry.input_value || entry.output_value || entry.threshold) && (
                            <ChevronDown className="h-3 w-3 ml-1 shrink-0 text-muted-foreground" />
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  </CollapsibleTrigger>
                  {(entry.input_value || entry.output_value || entry.threshold) && (
                    <CollapsibleContent asChild>
                      <TableRow className="bg-muted/30">
                        <TableCell colSpan={6} className="py-3">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                            {entry.input_value && (
                              <div>
                                <p className="font-semibold text-muted-foreground mb-1">Input Values</p>
                                {Object.entries(entry.input_value).map(([k, v]) => (
                                  <p key={k}><span className="text-muted-foreground">{k}:</span> <span className="font-medium text-foreground">{typeof v === 'number' ? v.toLocaleString() : String(v)}</span></p>
                                ))}
                              </div>
                            )}
                            {entry.output_value && (
                              <div>
                                <p className="font-semibold text-muted-foreground mb-1">Output Values</p>
                                {Object.entries(entry.output_value).map(([k, v]) => (
                                  <p key={k}><span className="text-muted-foreground">{k}:</span> <span className="font-medium text-foreground">{typeof v === 'number' ? v.toLocaleString() : String(v)}</span></p>
                                ))}
                              </div>
                            )}
                            {entry.threshold && (
                              <div>
                                <p className="font-semibold text-muted-foreground mb-1">Thresholds</p>
                                {Object.entries(entry.threshold).map(([k, v]) => (
                                  <p key={k}><span className="text-muted-foreground">{k}:</span> <span className="font-medium text-foreground">{String(v)}</span></p>
                                ))}
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    </CollapsibleContent>
                  )}
                </>
              </Collapsible>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
