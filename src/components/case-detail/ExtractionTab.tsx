import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, FileSpreadsheet, Receipt, Activity } from 'lucide-react';
import { format } from 'date-fns';

interface Props {
  caseId: string;
}

export const ExtractionTab: React.FC<Props> = ({ caseId }) => {
  const { data: runs, isLoading: runsLoading } = useQuery({
    queryKey: ['extraction-runs', caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('extraction_runs')
        .select('*')
        .eq('case_id', caseId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: transactions } = useQuery({
    queryKey: ['case-bank-transactions', caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assessment_bank_transactions')
        .select('*')
        .eq('case_id', caseId)
        .order('txn_date', { ascending: true })
        .limit(500);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: vatReturns } = useQuery({
    queryKey: ['case-vat-returns', caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assessment_vat_returns')
        .select('*')
        .eq('case_id', caseId)
        .order('tax_period_from', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const statusColor = (status: string) => {
    if (status === 'completed') return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
    if (status === 'failed') return 'bg-destructive/10 text-destructive';
    if (status === 'in_progress') return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
    return 'bg-muted text-muted-foreground';
  };

  if (runsLoading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Extraction Runs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" />Extraction Runs</CardTitle>
          <CardDescription>{runs?.length || 0} extraction runs recorded</CardDescription>
        </CardHeader>
        <CardContent>
          {!runs?.length ? (
            <p className="text-sm text-muted-foreground text-center py-6">No extraction runs yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Engine</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Completed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {runs.map((run: any) => (
                  <TableRow key={run.id}>
                    <TableCell className="font-medium">{run.extraction_type}</TableCell>
                    <TableCell><Badge className={statusColor(run.extraction_status)}>{run.extraction_status}</Badge></TableCell>
                    <TableCell>{run.extracted_by_engine || '—'}</TableCell>
                    <TableCell>{run.confidence_score ? `${(run.confidence_score * 100).toFixed(0)}%` : '—'}</TableCell>
                    <TableCell className="text-xs">{run.started_at ? format(new Date(run.started_at), 'dd MMM HH:mm') : '—'}</TableCell>
                    <TableCell className="text-xs">{run.completed_at ? format(new Date(run.completed_at), 'dd MMM HH:mm') : '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Raw Data Tabs */}
      <Tabs defaultValue="transactions">
        <TabsList>
          <TabsTrigger value="transactions" className="gap-1.5">
            <FileSpreadsheet className="h-4 w-4" />
            Bank Transactions ({transactions?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="vat" className="gap-1.5">
            <Receipt className="h-4 w-4" />
            VAT Returns ({vatReturns?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="transactions">
          <Card>
            <CardContent className="pt-6">
              {!transactions?.length ? (
                <p className="text-sm text-muted-foreground text-center py-6">No extracted transactions</p>
              ) : (
                <div className="max-h-[500px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Bank</TableHead>
                        <TableHead className="text-right">Debit</TableHead>
                        <TableHead className="text-right">Credit</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Excluded</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((txn: any) => (
                        <TableRow key={txn.id} className={txn.is_excluded ? 'opacity-50 line-through' : ''}>
                          <TableCell className="text-xs whitespace-nowrap">{txn.txn_date || '—'}</TableCell>
                          <TableCell className="text-xs max-w-[200px] truncate">{txn.description || '—'}</TableCell>
                          <TableCell className="text-xs">{txn.bank_name || '—'}</TableCell>
                          <TableCell className="text-right text-xs text-destructive">{txn.debit ? txn.debit.toLocaleString() : ''}</TableCell>
                          <TableCell className="text-right text-xs text-emerald-600">{txn.credit ? txn.credit.toLocaleString() : ''}</TableCell>
                          <TableCell className="text-right text-xs font-medium">{txn.balance?.toLocaleString() || '—'}</TableCell>
                          <TableCell><Badge variant="outline" className="text-[10px]">{txn.category || 'uncategorized'}</Badge></TableCell>
                          <TableCell>{txn.is_excluded && <Badge variant="destructive" className="text-[10px]">Excluded</Badge>}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vat">
          <Card>
            <CardContent className="pt-6">
              {!vatReturns?.length ? (
                <p className="text-sm text-muted-foreground text-center py-6">No VAT returns extracted</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Period</TableHead>
                      <TableHead>TRN</TableHead>
                      <TableHead className="text-right">VAT Sales</TableHead>
                      <TableHead className="text-right">Taxable</TableHead>
                      <TableHead className="text-right">Zero-rated</TableHead>
                      <TableHead className="text-right">Output VAT</TableHead>
                      <TableHead className="text-right">Input VAT</TableHead>
                      <TableHead className="text-right">Net Payable</TableHead>
                      <TableHead>Edited</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vatReturns.map((vat: any) => (
                      <TableRow key={vat.id}>
                        <TableCell className="text-xs whitespace-nowrap">
                          {vat.tax_period_from && vat.tax_period_to
                            ? `${format(new Date(vat.tax_period_from), 'MMM yyyy')} – ${format(new Date(vat.tax_period_to), 'MMM yyyy')}`
                            : '—'}
                        </TableCell>
                        <TableCell className="text-xs">{vat.trn || '—'}</TableCell>
                        <TableCell className="text-right text-xs">{vat.vat_sales?.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-xs">{vat.taxable_supplies?.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-xs">{vat.zero_rated_supplies?.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-xs">{vat.output_vat?.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-xs">{vat.input_vat?.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-xs font-medium">{vat.net_vat_payable?.toLocaleString()}</TableCell>
                        <TableCell>{vat.is_edited && <Badge variant="secondary" className="text-[10px]">Edited</Badge>}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
