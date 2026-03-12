import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { Upload, FileText, Receipt, X, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CurrencyService } from '@/services/currencyService';
import type { ParsedBankFile, ParsedVatFile } from '@/types/assessment.types';

interface UploadDocumentsProps {
  companyName: string;
  onCompanyNameChange: (name: string) => void;
  bankFiles: ParsedBankFile[];
  vatFiles: ParsedVatFile[];
  onBankFiles: (files: File[]) => void;
  onVatFiles: (files: File[]) => void;
  onRemoveBankFile: (index: number) => void;
  onRemoveVatFile: (index: number) => void;
  onProceed: () => void;
  isProcessing: boolean;
}

const fmt = (v: number) => CurrencyService.format(v, 'AED');

export const UploadDocuments: React.FC<UploadDocumentsProps> = ({
  companyName,
  onCompanyNameChange,
  bankFiles,
  vatFiles,
  onBankFiles,
  onVatFiles,
  onRemoveBankFile,
  onRemoveVatFile,
  onProceed,
  isProcessing,
}) => {
  const bankDropzone = useDropzone({
    accept: { 'application/pdf': ['.pdf'] },
    onDrop: onBankFiles,
    disabled: isProcessing,
    maxFiles: 12,
  });

  const vatDropzone = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    onDrop: onVatFiles,
    disabled: isProcessing,
    maxFiles: 8,
  });

  const hasValidBankFiles = bankFiles.some(f => f.isValid);
  const canProceed = hasValidBankFiles && !isProcessing;

  return (
    <div className="space-y-6">
      {/* Company Name */}
      <Card>
        <CardContent className="pt-6">
          <Label htmlFor="company-name" className="text-sm font-medium">Company / Applicant Name</Label>
          <Input
            id="company-name"
            placeholder="Enter company name..."
            value={companyName}
            onChange={e => onCompanyNameChange(e.target.value)}
            className="mt-2"
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bank Statements Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-primary" />
              Bank Statements
            </CardTitle>
            <CardDescription>Upload PDF bank statements (up to 12 files)</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              {...bankDropzone.getRootProps()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                bankDropzone.isDragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <input {...bankDropzone.getInputProps()} />
              <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">Drop PDF files here or click to browse</p>
              <p className="text-xs text-muted-foreground mt-1">Supports ADCB, ENBD, FAB, Mashreq, RAK Bank & more</p>
            </div>

            {/* Parsed bank files list */}
            {bankFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                {bankFiles.map((file, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      file.isValid
                        ? 'border-success/30 bg-success/5'
                        : 'border-destructive/30 bg-destructive/5'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {file.isValid ? (
                        <CheckCircle className="h-4 w-4 text-success shrink-0" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{file.fileName}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          {file.bankName && (
                            <Badge variant="secondary" className="text-xs">{file.bankName}</Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {file.transactions.length} txns
                          </span>
                          {file.isValid && (
                            <span className="text-xs text-success">
                              +{fmt(file.totalCredits)}
                            </span>
                          )}
                          {file.validationMessage && (
                            <span className="text-xs text-destructive">{file.validationMessage}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={() => onRemoveBankFile(idx)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* VAT Returns Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Receipt className="h-5 w-5 text-accent" />
              VAT Returns
              <Badge variant="outline" className="text-xs">Optional</Badge>
            </CardTitle>
            <CardDescription>Upload VAT return PDFs or Excel files</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              {...vatDropzone.getRootProps()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                vatDropzone.isDragActive
                  ? 'border-accent bg-accent/5'
                  : 'border-border hover:border-accent/50'
              }`}
            >
              <input {...vatDropzone.getInputProps()} />
              <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">Drop files here or click to browse</p>
              <p className="text-xs text-muted-foreground mt-1">PDF or Excel • UAE FTA format supported</p>
            </div>

            {/* Parsed VAT files list */}
            {vatFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                {vatFiles.map((file, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      file.isValid
                        ? 'border-success/30 bg-success/5'
                        : file.confidence === 'low'
                          ? 'border-warning/30 bg-warning/5'
                          : 'border-destructive/30 bg-destructive/5'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {file.isValid ? (
                        <CheckCircle className="h-4 w-4 text-success shrink-0" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{file.fileName}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            {file.confidence} confidence
                          </Badge>
                          {file.vatSales > 0 && (
                            <span className="text-xs text-muted-foreground">
                              Sales: {fmt(file.vatSales)}
                            </span>
                          )}
                          {file.validationMessage && (
                            <span className="text-xs text-warning">{file.validationMessage}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={() => onRemoveVatFile(idx)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </motion.div>
                ))}
              </div>
            )}

            {vatFiles.length === 0 && (
              <p className="text-xs text-muted-foreground mt-3 text-center">
                Assessment will proceed with bank-only analysis if no VAT returns are uploaded
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Proceed Button */}
      <div className="flex justify-end">
        <Button
          size="lg"
          onClick={onProceed}
          disabled={!canProceed}
          className="gradient-accent min-w-48"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              Run Analysis
              <span className="ml-2 text-xs opacity-80">
                ({bankFiles.filter(f => f.isValid).length} bank
                {vatFiles.filter(f => f.isValid).length > 0 ? ` + ${vatFiles.filter(f => f.isValid).length} VAT` : ''})
              </span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
