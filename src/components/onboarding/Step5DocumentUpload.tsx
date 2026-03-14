import { useCallback, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { DOCUMENT_TYPES, DocumentUpload } from '@/types/onboarding.types';
import { Upload, File, X, CheckCircle2, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DocumentUploadCardProps {
  docType: { id: string; label: string; description: string; conditional?: boolean; multiFile?: boolean; maxFiles?: number };
  existingDocs: DocumentUpload[];
  onUpload: (files: File[], type: string) => void;
  onRemove: (id: string) => void;
  isRequired: boolean;
  isUploading?: boolean;
}

function DocumentUploadCard({ docType, existingDocs, onUpload, onRemove, isRequired, isUploading }: DocumentUploadCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const isMulti = docType.multiFile;
  const maxFiles = docType.maxFiles || 1;
  const completedDocs = existingDocs.filter(d => d.status === 'completed');
  const canUploadMore = isMulti ? completedDocs.length < maxFiles : completedDocs.length === 0;

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).slice(0, isMulti ? maxFiles - completedDocs.length : 1);
    if (files.length > 0) {
      onUpload(files, docType.id);
    }
  }, [onUpload, docType.id, isMulti, maxFiles, completedDocs.length]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, isMulti ? maxFiles - completedDocs.length : 1);
    if (files.length > 0) {
      onUpload(files, docType.id);
    }
    e.target.value = '';
  };

  return (
    <Card className={cn(
      'transition-all',
      isDragging && 'ring-2 ring-primary border-primary'
    )}>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm">{docType.label}</span>
                {isRequired && <span className="text-destructive text-xs">*</span>}
                {isMulti && (
                  <span className="text-xs text-muted-foreground">
                    ({completedDocs.length}/{maxFiles})
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{docType.description}</p>
            </div>

            {canUploadMore && (
              <div
                className="relative"
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={handleFileSelect}
                  accept=".pdf,.jpg,.jpeg,.png"
                  multiple={isMulti}
                  disabled={isUploading}
                />
                <Button variant="outline" size="sm" className="pointer-events-none" disabled={isUploading}>
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-1" />
                  )}
                  Upload{isMulti ? ' Files' : ''}
                </Button>
              </div>
            )}
          </div>

          {/* Show uploaded files list */}
          {existingDocs.length > 0 && (
            <div className="space-y-1.5 pl-1">
              {existingDocs.map((doc) => (
                <div key={doc.id} className="flex items-center gap-2 text-sm">
                  {doc.status === 'completed' && (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
                      <span className="max-w-[200px] truncate text-xs">{doc.fileName}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemove(doc.id)}
                        className="h-6 w-6 p-0 ml-auto"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                  {doc.status === 'uploading' && (
                    <div className="flex items-center gap-2 w-32">
                      <Progress value={doc.uploadProgress} className="h-1.5" />
                      <span className="text-xs">{doc.uploadProgress}%</span>
                    </div>
                  )}
                  {doc.status === 'error' && (
                    <>
                      <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
                      <span className="text-xs text-destructive truncate">{doc.fileName}</span>
                      <Button variant="ghost" size="sm" className="h-6 ml-auto">
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Retry
                      </Button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function Step5DocumentUpload() {
  const { formData, uploadDocument, removeDocument, isSaving } = useOnboarding();
  const [uploadingType, setUploadingType] = useState<string | null>(null);

  const handleUpload = useCallback(async (files: File[], type: string) => {
    setUploadingType(type);
    for (const file of files) {
      await uploadDocument(file, type);
    }
    setUploadingType(null);
  }, [uploadDocument]);

  const handleRemove = useCallback(async (id: string) => {
    await removeDocument(id);
  }, [removeDocument]);

  const getDocsForType = (type: string) => {
    return formData.documents.filter(doc => doc.type === type);
  };

  // Filter conditional documents
  const mandatoryDocs = DOCUMENT_TYPES.mandatory.filter(doc => {
    if (doc.id === 'vat_certificate') {
      return formData.bankingTurnover.vatRegistered;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <File className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Document Upload</CardTitle>
              <CardDescription>Upload required documents for verification</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Mandatory Documents */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <span>Mandatory Documents</span>
              <span className="text-destructive text-sm">*</span>
            </h4>
            <div className="space-y-3">
              {mandatoryDocs.map((doc) => (
                <DocumentUploadCard
                  key={doc.id}
                  docType={doc}
                  existingDocs={getDocsForType(doc.id)}
                  onUpload={handleUpload}
                  onRemove={handleRemove}
                  isRequired={true}
                  isUploading={uploadingType === doc.id}
                />
              ))}
            </div>
          </div>

          {/* Optional Documents */}
          <div>
            <h4 className="font-medium mb-3 text-muted-foreground">Optional Documents</h4>
            <div className="space-y-3">
              {DOCUMENT_TYPES.optional.map((doc) => (
                <DocumentUploadCard
                  key={doc.id}
                  docType={doc}
                  existingDocs={getDocsForType(doc.id)}
                  onUpload={handleUpload}
                  onRemove={handleRemove}
                  isRequired={false}
                  isUploading={uploadingType === doc.id}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
