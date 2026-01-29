import React, { useState, useCallback } from 'react';
import { FileUpload } from './FileUpload';
import { ParsedTransactionPreview } from './ParsedTransactionPreview';
import { usePdfParsing, ParsedStatementData } from '@/hooks/usePdfParsing';

interface FileUploadWithPreviewProps {
  onAnalysisConfirmed: (data: ParsedStatementData, files: File[]) => void;
  onDemoMode?: () => void;
}

type UploadStep = 'upload' | 'preview';

export const FileUploadWithPreview: React.FC<FileUploadWithPreviewProps> = ({
  onAnalysisConfirmed,
  onDemoMode
}) => {
  const [step, setStep] = useState<UploadStep>('upload');
  const [currentFiles, setCurrentFiles] = useState<File[]>([]);
  const [parsingFailed, setParsingFailed] = useState(false);
  
  const { isParsing, parsedData, parseFile, clearParsedData } = usePdfParsing();

  const handleFilesSelected = useCallback(async (files: File[], bankHint?: string) => {
    if (files.length === 0) return;
    
    setCurrentFiles(files);
    setParsingFailed(false);
    
    // Parse the first file (for now, we'll handle single file preview)
    // In future, could aggregate multiple files
    const result = await parseFile(files[0], bankHint);
    
    if (result) {
      if (result.transactions.length === 0) {
        setParsingFailed(true);
        // Stay on upload step but show failure message
      } else {
        setStep('preview');
      }
    }
  }, [parseFile]);

  const handleRetryParsing = useCallback(async (bankHint: string) => {
    if (currentFiles.length === 0) return;
    
    const result = await parseFile(currentFiles[0], bankHint);
    
    if (result && result.transactions.length > 0) {
      setParsingFailed(false);
      setStep('preview');
    }
  }, [currentFiles, parseFile]);

  const handleConfirm = useCallback(() => {
    if (parsedData) {
      onAnalysisConfirmed(parsedData, currentFiles);
    }
  }, [parsedData, currentFiles, onAnalysisConfirmed]);

  const handleBack = useCallback(() => {
    setStep('upload');
    clearParsedData();
    setParsingFailed(false);
  }, [clearParsedData]);

  if (step === 'preview' && parsedData) {
    return (
      <ParsedTransactionPreview
        data={parsedData}
        fileName={currentFiles[0]?.name || 'statement.pdf'}
        onConfirm={handleConfirm}
        onRetry={handleRetryParsing}
        onBack={handleBack}
        isRetrying={isParsing}
      />
    );
  }

  return (
    <FileUpload
      onFilesSelected={handleFilesSelected}
      onDemoMode={onDemoMode}
      isProcessing={isParsing}
      parsingFailed={parsingFailed}
    />
  );
};
