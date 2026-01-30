import { useCallback, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { DOCUMENT_TYPES, DocumentUpload } from '@/types/onboarding.types';
import { Upload, File, X, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DocumentUploadCardProps {
  docType: { id: string; label: string; description: string; conditional?: boolean };
  existingDoc?: DocumentUpload;
  onUpload: (file: File, type: string) => void;
  onRemove: (id: string) => void;
  isRequired: boolean;
}

function DocumentUploadCard({ docType, existingDoc, onUpload, onRemove, isRequired }: DocumentUploadCardProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      onUpload(file, docType.id);
    }
  }, [onUpload, docType.id]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file, docType.id);
    }
  };

  return (
    <Card className={cn(
      'transition-all',
      isDragging && 'ring-2 ring-primary border-primary'
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm">{docType.label}</span>
              {isRequired && <span className="text-destructive text-xs">*</span>}
            </div>
            <p className="text-xs text-muted-foreground">{docType.description}</p>
          </div>

          {existingDoc ? (
            <div className="flex items-center gap-2">
              {existingDoc.status === 'completed' && (
                <>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="max-w-[120px] truncate">{existingDoc.fileName}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemove(existingDoc.id)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </>
              )}
              {existingDoc.status === 'uploading' && (
                <div className="flex items-center gap-2 w-32">
                  <Progress value={existingDoc.uploadProgress} className="h-2" />
                  <span className="text-xs">{existingDoc.uploadProgress}%</span>
                </div>
              )}
              {existingDoc.status === 'error' && (
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <Button variant="ghost" size="sm" className="h-8">
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Retry
                  </Button>
                </div>
              )}
            </div>
          ) : (
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
              />
              <Button variant="outline" size="sm" className="pointer-events-none">
                <Upload className="h-4 w-4 mr-1" />
                Upload
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function Step5DocumentUpload() {
  const { formData, addDocument, removeDocument, updateDocument } = useOnboarding();

  const handleUpload = useCallback((file: File, type: string) => {
    const docId = crypto.randomUUID();
    
    // Add document with uploading status
    addDocument({
      id: docId,
      type,
      fileName: file.name,
      fileSize: file.size,
      uploadProgress: 0,
      status: 'uploading'
    });

    // Simulate upload progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 30;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        updateDocument(docId, { uploadProgress: 100, status: 'completed' });
      } else {
        updateDocument(docId, { uploadProgress: Math.round(progress) });
      }
    }, 200);
  }, [addDocument, updateDocument]);

  const getDocForType = (type: string) => {
    return formData.documents.find(doc => doc.type === type);
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
                  existingDoc={getDocForType(doc.id)}
                  onUpload={handleUpload}
                  onRemove={removeDocument}
                  isRequired={true}
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
                  existingDoc={getDocForType(doc.id)}
                  onUpload={handleUpload}
                  onRemove={removeDocument}
                  isRequired={false}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
