import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Download, Upload, Eye, Calendar, HardDrive } from 'lucide-react';
import { format } from 'date-fns';

interface Props {
  caseId: string;
}

export const DocumentsTab: React.FC<Props> = ({ caseId }) => {
  const { data: documents, isLoading } = useQuery({
    queryKey: ['case-documents', caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assessment_documents')
        .select('*')
        .eq('case_id', caseId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const handleDownload = async (filePath: string | null, fileName: string) => {
    if (!filePath) return;
    const { data } = await supabase.storage.from('case-documents').createSignedUrl(filePath, 3600);
    if (data?.signedUrl) {
      window.open(data.signedUrl, '_blank');
    }
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      bank_statement: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      vat_return: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      trade_license: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    };
    return colors[type] || 'bg-muted text-muted-foreground';
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Uploaded Documents
            </CardTitle>
            <CardDescription>{documents?.length || 0} documents on file</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!documents?.length ? (
          <div className="text-center py-12 text-muted-foreground">
            <Upload className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No documents uploaded yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{(doc as any).original_file_name || doc.file_name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className={getTypeColor(doc.document_type)}>
                        {doc.document_type.replace(/_/g, ' ')}
                      </Badge>
                      {doc.bank_name && (
                        <span className="text-xs text-muted-foreground">{doc.bank_name}</span>
                      )}
                      {doc.period_from && doc.period_to && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(doc.period_from), 'MMM yyyy')} – {format(new Date(doc.period_to), 'MMM yyyy')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {doc.file_size && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <HardDrive className="h-3 w-3" />
                      {(doc.file_size / 1024).toFixed(0)} KB
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(doc.created_at), 'dd MMM yyyy')}
                  </span>
                  <Badge variant={doc.validation_status === 'valid' ? 'default' : 'outline'} className="text-xs">
                    {doc.validation_status}
                  </Badge>
                  <Button variant="ghost" size="icon" onClick={() => handleDownload(doc.file_path, doc.file_name)}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
