import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X, FileCheck, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { toast } from 'sonner';

interface UploadedFile {
  file: File;
  id: string;
  name: string;
  size: string;
  sizeBytes: number;
}

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  isProcessing?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ 
  onFilesSelected, 
  isProcessing = false 
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const isDuplicate = (file: File, existingFiles: UploadedFile[]): boolean => {
    return existingFiles.some(
      existing => existing.name === file.name && existing.sizeBytes === file.size
    );
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const duplicates: string[] = [];
    const uniqueFiles: File[] = [];

    setUploadedFiles(prev => {
      acceptedFiles.forEach(file => {
        if (isDuplicate(file, prev)) {
          duplicates.push(file.name);
        } else if (!uniqueFiles.some(f => f.name === file.name && f.size === file.size)) {
          uniqueFiles.push(file);
        }
      });

      if (duplicates.length > 0) {
        toast.error(`Duplicate files ignored: ${duplicates.join(', ')}`, {
          icon: <AlertCircle className="h-4 w-4" />,
        });
      }

      const newFiles = uniqueFiles.map(file => ({
        file,
        id: Math.random().toString(36).substring(7),
        name: file.name,
        size: formatFileSize(file.size),
        sizeBytes: file.size
      }));

      const combined = [...prev, ...newFiles];
      return combined.slice(0, 12); // Max 12 files
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 12,
    disabled: isProcessing
  });

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleAnalyze = () => {
    const files = uploadedFiles.map(f => f.file);
    onFilesSelected(files);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <h2 className="text-3xl font-bold text-foreground mb-3">
          Upload Your Bank Statements
        </h2>
        <p className="text-muted-foreground text-lg">
          Drop up to 12 monthly PDF statements for comprehensive analysis
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div
          {...getRootProps()}
          className={`
            relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer
            transition-all duration-300 ease-out
            ${isDragActive 
              ? 'dropzone-active border-accent bg-accent/5 scale-[1.02]' 
              : 'dropzone-idle'
            }
            ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input {...getInputProps()} />
          
          <motion.div
            animate={{ 
              scale: isDragActive ? 1.1 : 1,
              rotate: isDragActive ? 5 : 0
            }}
            transition={{ type: "spring", stiffness: 300 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl gradient-primary mb-6"
          >
            <Upload className="h-10 w-10 text-primary-foreground" />
          </motion.div>
          
          <p className="text-xl font-semibold text-foreground mb-2">
            {isDragActive ? 'Drop files here!' : 'Drag & drop PDF statements'}
          </p>
          <p className="text-muted-foreground mb-4">
            or click to browse your files
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-sm text-muted-foreground">
            <FileCheck className="h-4 w-4" />
            <span>Accepts PDF files • Max 12 files</span>
          </div>
        </div>
      </motion.div>

      <AnimatePresence mode="popLayout">
        {uploadedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-8 space-y-3"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">
                Uploaded Files
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setUploadedFiles([])}
                  className="text-sm text-destructive hover:text-destructive/80 px-3 py-1 hover:bg-destructive/10 rounded-full transition-colors"
                >
                  Clear All
                </button>
                <span className="text-sm text-muted-foreground px-3 py-1 bg-muted rounded-full">
                  {uploadedFiles.length}/12 files
                </span>
              </div>
            </div>
            
            {uploadedFiles.map((file, index) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-4 bg-card rounded-xl border border-border/50 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-destructive/10">
                    <FileText className="h-6 w-6 text-destructive" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{file.name}</p>
                    <p className="text-sm text-muted-foreground">{file.size}</p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(file.id);
                  }}
                  disabled={isProcessing}
                  className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                >
                  <X className="h-5 w-5" />
                </button>
              </motion.div>
            ))}

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="pt-4"
            >
              <Button
                onClick={handleAnalyze}
                disabled={isProcessing}
                size="lg"
                className="w-full h-14 text-lg font-semibold gradient-accent hover:opacity-90 transition-opacity"
              >
                {isProcessing ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="mr-2"
                    >
                      <Upload className="h-5 w-5" />
                    </motion.div>
                    Processing...
                  </>
                ) : (
                  <>
                    Analyze {uploadedFiles.length} Statement{uploadedFiles.length > 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
