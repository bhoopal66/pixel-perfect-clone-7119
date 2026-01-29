import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  FileText, 
  Calendar, 
  DollarSign, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle, 
  AlertTriangle,
  Upload,
  X,
  File,
  Loader2,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { CurrencyService } from '@/services/currencyService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { usePdfParsing } from '@/hooks/usePdfParsing';
import { ParsedDataPreview } from './ParsedDataPreview';
import type { Case, CaseAnalysisInput } from '@/types/case.types';

interface Step2StatementAnalysisProps {
  caseData: Case;
  onSubmit: (data: CaseAnalysisInput) => Promise<void>;
  onMarkComplete: () => Promise<void>;
  onBack: () => void;
  isLoading: boolean;
}

export const Step2StatementAnalysis: React.FC<Step2StatementAnalysisProps> = ({
  caseData,
  onSubmit,
  onMarkComplete,
  onBack,
  isLoading
}) => {
  const [statementPdfUrl, setStatementPdfUrl] = useState(caseData.statement_pdf_url || '');
  const [periodFrom, setPeriodFrom] = useState(caseData.statement_period_from || '');
  const [periodTo, setPeriodTo] = useState(caseData.statement_period_to || '');
  const [vatTurnover, setVatTurnover] = useState(caseData.vat_turnover?.toString() || '');
  const [declaredTurnover, setDeclaredTurnover] = useState(caseData.declared_turnover?.toString() || '');
  const [cashAdjustment, setCashAdjustment] = useState(caseData.cash_adjustment?.toString() || '');
  const [sisterConcernAdjustment, setSisterConcernAdjustment] = useState(caseData.sister_concern_adjustment?.toString() || '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [showParsedPreview, setShowParsedPreview] = useState(false);

  const { isParsing, parsedData, parseFile, clearParsedData } = usePdfParsing();

  const formatCurrency = (value: number) => CurrencyService.format(value, 'AED');

  // Extract filename from URL if exists
  useEffect(() => {
    if (caseData.statement_pdf_url) {
      const urlParts = caseData.statement_pdf_url.split('/');
      const filename = urlParts[urlParts.length - 1];
      if (filename && filename.endsWith('.pdf')) {
        setUploadedFileName(decodeURIComponent(filename));
      }
    }
  }, [caseData.statement_pdf_url]);

  // Track changes
  useEffect(() => {
    const changed = 
      statementPdfUrl !== (caseData.statement_pdf_url || '') ||
      periodFrom !== (caseData.statement_period_from || '') ||
      periodTo !== (caseData.statement_period_to || '') ||
      vatTurnover !== (caseData.vat_turnover?.toString() || '') ||
      declaredTurnover !== (caseData.declared_turnover?.toString() || '') ||
      cashAdjustment !== (caseData.cash_adjustment?.toString() || '') ||
      sisterConcernAdjustment !== (caseData.sister_concern_adjustment?.toString() || '');
    setHasChanges(changed);
  }, [statementPdfUrl, periodFrom, periodTo, vatTurnover, declaredTurnover, cashAdjustment, sisterConcernAdjustment, caseData]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Validate file type
    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setIsUploading(true);

    try {
      // Create unique filename with case ID and timestamp
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${caseData.id}/${timestamp}_${sanitizedName}`;

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('case-documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        toast.error('Failed to upload file: ' + error.message);
        return;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('case-documents')
        .getPublicUrl(data.path);

      setStatementPdfUrl(urlData.publicUrl);
      setUploadedFileName(file.name);
      toast.success('File uploaded successfully');

      // Parse the PDF to extract data
      const result = await parseFile(file);
      if (result && result.transactions.length > 0) {
        setShowParsedPreview(true);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  }, [caseData.id, parseFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    disabled: isUploading
  });

  const handleRemoveFile = async () => {
    if (statementPdfUrl && statementPdfUrl.includes('case-documents')) {
      try {
        // Extract path from URL
        const urlParts = statementPdfUrl.split('/case-documents/');
        if (urlParts[1]) {
          await supabase.storage
            .from('case-documents')
            .remove([urlParts[1]]);
        }
      } catch (error) {
        console.error('Error removing file:', error);
      }
    }
    setStatementPdfUrl('');
    setUploadedFileName(null);
    clearParsedData();
    setShowParsedPreview(false);
  };

  const handleApplyParsedData = (data: {
    declaredTurnover: number;
    periodFrom?: string;
    periodTo?: string;
  }) => {
    setDeclaredTurnover(data.declaredTurnover.toString());
    if (data.periodFrom) {
      setPeriodFrom(data.periodFrom);
    }
    if (data.periodTo) {
      setPeriodTo(data.periodTo);
    }
    setShowParsedPreview(false);
    toast.success('Extracted data applied to form');
  };

  const handleDismissParsedData = () => {
    setShowParsedPreview(false);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    const declared = parseFloat(declaredTurnover) || 0;
    if (declared <= 0) {
      newErrors.declared_turnover = 'Declared turnover must be greater than 0';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    await onSubmit({
      statement_pdf_url: statementPdfUrl || undefined,
      statement_period_from: periodFrom || undefined,
      statement_period_to: periodTo || undefined,
      vat_turnover: parseFloat(vatTurnover) || 0,
      declared_turnover: parseFloat(declaredTurnover) || 0,
      cash_adjustment: parseFloat(cashAdjustment) || 0,
      sister_concern_adjustment: parseFloat(sisterConcernAdjustment) || 0
    });
    setHasChanges(false);
  };

  const handleMarkComplete = async () => {
    if (!validate()) return;
    
    // Save first if there are changes
    if (hasChanges) {
      await handleSave();
    }
    
    await onMarkComplete();
  };

  // Calculate preview
  const declared = parseFloat(declaredTurnover) || 0;
  const cash = parseFloat(cashAdjustment) || 0;
  const sister = parseFloat(sisterConcernAdjustment) || 0;
  const adjustedPreview = Math.max(0, declared - cash - sister);

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Bank Statement Analysis
        </CardTitle>
        <CardDescription>
          Upload statement and enter turnover figures for {caseData.client_name}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Statement Upload Section */}
        <div className="p-4 bg-muted/30 rounded-lg border space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload Bank Statement
          </h3>
          
          {/* File Upload Dropzone */}
          {!uploadedFileName ? (
            <div
              {...getRootProps()}
              className={cn(
                "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                isDragActive && "border-primary bg-primary/5",
                isUploading && "opacity-50 cursor-not-allowed",
                !isDragActive && !isUploading && "border-muted-foreground/30 hover:border-primary hover:bg-muted/50"
              )}
            >
              <input {...getInputProps()} />
              {isUploading || isParsing ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">
                    {isUploading ? 'Uploading...' : 'Parsing statement...'}
                  </p>
                </div>
              ) : isDragActive ? (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-primary" />
                  <p className="text-sm text-primary font-medium">Drop the PDF here</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="p-3 bg-muted rounded-full">
                    <FileText className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      Drag & drop your bank statement PDF here
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      or click to browse (max 10MB)
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-primary mt-1">
                    <Sparkles className="h-3 w-3" />
                    <span>Auto-extracts turnover from supported formats</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 bg-success/10 border border-success/30 rounded-lg">
              <div className="p-2 bg-success/20 rounded">
                <File className="h-5 w-5 text-success" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{uploadedFileName}</p>
                <p className="text-xs text-muted-foreground">Uploaded successfully</p>
              </div>
              <div className="flex items-center gap-2">
                {statementPdfUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(statementPdfUrl, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveFile}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Parsed Data Preview */}
          {showParsedPreview && parsedData && (
            <ParsedDataPreview
              data={parsedData}
              onApply={handleApplyParsedData}
              onDismiss={handleDismissParsedData}
            />
          )}

          {/* Manual URL Input (Alternative) */}
          <div className="space-y-2">
            <Label htmlFor="statement_pdf_url" className="text-xs text-muted-foreground">
              Or paste a direct URL to the statement
            </Label>
            <Input
              id="statement_pdf_url"
              type="url"
              placeholder="https://..."
              value={statementPdfUrl}
              onChange={(e) => {
                setStatementPdfUrl(e.target.value);
                setUploadedFileName(null);
              }}
              className="text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="period_from" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Period From
              </Label>
              <Input
                id="period_from"
                type="date"
                value={periodFrom}
                onChange={(e) => setPeriodFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="period_to" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Period To
              </Label>
              <Input
                id="period_to"
                type="date"
                value={periodTo}
                onChange={(e) => setPeriodTo(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Turnover Figures */}
        <div className="p-4 bg-primary/5 rounded-lg border border-primary/20 space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Turnover Analysis
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vat_turnover">VAT Turnover</Label>
              <Input
                id="vat_turnover"
                type="number"
                placeholder="0.00"
                value={vatTurnover}
                onChange={(e) => setVatTurnover(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="declared_turnover">Declared Turnover *</Label>
              <Input
                id="declared_turnover"
                type="number"
                placeholder="0.00"
                value={declaredTurnover}
                onChange={(e) => setDeclaredTurnover(e.target.value)}
                min="0"
                step="0.01"
                className={errors.declared_turnover ? 'border-destructive' : ''}
              />
              {errors.declared_turnover && (
                <p className="text-xs text-destructive">{errors.declared_turnover}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cash_adjustment">Cash Adjustment</Label>
              <Input
                id="cash_adjustment"
                type="number"
                placeholder="0.00"
                value={cashAdjustment}
                onChange={(e) => setCashAdjustment(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sister_concern_adjustment">Sister Concern Adjustment</Label>
              <Input
                id="sister_concern_adjustment"
                type="number"
                placeholder="0.00"
                value={sisterConcernAdjustment}
                onChange={(e) => setSisterConcernAdjustment(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>
          </div>

          {/* Preview */}
          {declared > 0 && (
            <div className="mt-4 p-3 bg-background rounded border">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Adjusted Turnover Preview:</span>
                <span className="font-mono font-semibold">{formatCurrency(adjustedPreview)}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                = {formatCurrency(declared)} - {formatCurrency(cash)} - {formatCurrency(sister)}
              </p>
            </div>
          )}
        </div>

        {/* Warnings */}
        {parseFloat(vatTurnover) === 0 && declared > 0 && (
          <Alert variant="default" className="border-warning/50 bg-warning/10">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <AlertDescription className="text-warning">
              VAT Turnover is 0 - variance calculation may be unreliable
            </AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          
          <Button
            type="button"
            variant="secondary"
            onClick={handleSave}
            disabled={isLoading || !hasChanges}
          >
            Save Progress
          </Button>
          
          <Button
            type="button"
            onClick={handleMarkComplete}
            disabled={isLoading}
            className="flex-1"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            {isLoading ? 'Saving...' : 'Mark Analysis Completed & Continue'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
