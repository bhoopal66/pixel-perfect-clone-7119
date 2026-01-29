import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  Trash2,
  Eye,
  Download,
  Plus,
  X,
  Building2,
  Info,
  Loader2,
  FileSpreadsheet,
  Sparkles,
  Edit3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from './ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { cn } from '@/lib/utils';
import type { VATReturn, SisterCompany } from '../types/turnover.types';
import type { CurrencyCode } from '../services/currencyService';
import { CurrencyService } from '../services/currencyService';
import { VATReturnParser, type ParsedVATData, type VATParserResult } from '../services/vatReturnParser';
import { toast } from 'sonner';

interface VATReturnsUploadProps {
  vatReturns: VATReturn[];
  onVATReturnsChange: (returns: VATReturn[]) => void;
  sisterCompanies?: SisterCompany[];
  onSisterCompaniesChange?: (companies: SisterCompany[]) => void;
  currency?: CurrencyCode;
}

interface ParsedFileState {
  file: File;
  result: VATParserResult;
  editedData: ParsedVATData;
  isEditing: boolean;
}

export const VATReturnsUpload: React.FC<VATReturnsUploadProps> = ({
  vatReturns,
  onVATReturnsChange,
  sisterCompanies = [],
  onSisterCompaniesChange,
  currency = 'AED'
}) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSisterOpen, setIsSisterOpen] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedFiles, setParsedFiles] = useState<ParsedFileState[]>([]);
  const [showParsedPreview, setShowParsedPreview] = useState(false);
  const [newReturn, setNewReturn] = useState<Partial<VATReturn>>({
    period: '',
    startDate: '',
    endDate: '',
    taxableSales: 0,
    zeroRatedSales: 0,
    exemptSales: 0,
    outputVAT: 0,
    inputVAT: 0,
    status: 'submitted'
  });

  const formatCurrency = (value: number) => CurrencyService.format(value, currency);

  // File upload dropzone with automatic parsing
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const supportedFiles = acceptedFiles.filter(f => 
      f.type === 'application/pdf' || 
      f.name.endsWith('.xlsx') || 
      f.name.endsWith('.xls')
    );
    
    if (supportedFiles.length === 0) {
      toast.error('Please upload PDF or Excel files');
      return;
    }

    setIsParsing(true);
    toast.info(`Parsing ${supportedFiles.length} VAT return file(s)...`);
    
    const results: ParsedFileState[] = [];
    
    for (const file of supportedFiles) {
      try {
        const result = await VATReturnParser.parseVATReturn(file);
        results.push({
          file,
          result,
          editedData: result.data || { confidence: 'low', detectedFields: [] },
          isEditing: false
        });
      } catch (error) {
        results.push({
          file,
          result: {
            success: false,
            error: 'Failed to parse file',
            fileName: file.name,
            fileType: 'pdf'
          },
          editedData: { confidence: 'low', detectedFields: [] },
          isEditing: false
        });
      }
    }
    
    setParsedFiles(prev => [...prev, ...results]);
    setIsParsing(false);
    setShowParsedPreview(true);
    
    const successCount = results.filter(r => r.result.success).length;
    if (successCount > 0) {
      toast.success(`Successfully parsed ${successCount} of ${supportedFiles.length} files`);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: true
  });

  const removeParsedFile = (index: number) => {
    setParsedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const updateParsedData = (index: number, field: keyof ParsedVATData, value: any) => {
    setParsedFiles(prev => prev.map((pf, i) => {
      if (i !== index) return pf;
      return {
        ...pf,
        editedData: { ...pf.editedData, [field]: value }
      };
    }));
  };

  const toggleEditing = (index: number) => {
    setParsedFiles(prev => prev.map((pf, i) => {
      if (i !== index) return pf;
      return { ...pf, isEditing: !pf.isEditing };
    }));
  };

  const applyParsedFile = (index: number) => {
    const pf = parsedFiles[index];
    if (!pf) return;

    const vatReturn = VATReturnParser.createVATReturnFromParsed(pf.editedData, pf.file.name);
    onVATReturnsChange([...vatReturns, vatReturn]);
    removeParsedFile(index);
    toast.success(`Added VAT return: ${vatReturn.period}`);
  };

  const applyAllParsedFiles = () => {
    const newReturns = parsedFiles
      .filter(pf => pf.result.success)
      .map(pf => VATReturnParser.createVATReturnFromParsed(pf.editedData, pf.file.name));
    
    if (newReturns.length > 0) {
      onVATReturnsChange([...vatReturns, ...newReturns]);
      setParsedFiles([]);
      setShowParsedPreview(false);
      toast.success(`Added ${newReturns.length} VAT return(s)`);
    }
  };

  const getConfidenceBadge = (confidence: 'high' | 'medium' | 'low') => {
    switch (confidence) {
      case 'high':
        return <Badge className="bg-success/20 text-success border-success/30 gap-1">
          <Sparkles className="h-3 w-3" /> High Confidence
        </Badge>;
      case 'medium':
        return <Badge className="bg-warning/20 text-warning border-warning/30 gap-1">
          <AlertCircle className="h-3 w-3" /> Medium Confidence
        </Badge>;
      default:
        return <Badge className="bg-destructive/20 text-destructive border-destructive/30 gap-1">
          <AlertCircle className="h-3 w-3" /> Low Confidence
        </Badge>;
    }
  };

  // Sister company management
  const addSisterCompany = () => {
    if (!onSisterCompaniesChange) return;
    const newCompany: SisterCompany = {
      id: Date.now().toString(),
      name: '',
      active: true,
      notes: ''
    };
    onSisterCompaniesChange([...sisterCompanies, newCompany]);
  };

  const updateSisterCompany = (id: string, field: keyof SisterCompany, value: string | boolean) => {
    if (!onSisterCompaniesChange) return;
    onSisterCompaniesChange(
      sisterCompanies.map(c => c.id === id ? { ...c, [field]: value } : c)
    );
  };

  const removeSisterCompany = (id: string) => {
    if (!onSisterCompaniesChange) return;
    onSisterCompaniesChange(sisterCompanies.filter(c => c.id !== id));
  };

  const handleAddReturn = () => {
    if (!newReturn.period || !newReturn.startDate || !newReturn.endDate) return;

    const vatReturn: VATReturn = {
      id: `vat-${Date.now()}`,
      period: newReturn.period || '',
      startDate: newReturn.startDate || '',
      endDate: newReturn.endDate || '',
      taxableSales: newReturn.taxableSales || 0,
      zeroRatedSales: newReturn.zeroRatedSales || 0,
      exemptSales: newReturn.exemptSales || 0,
      outputVAT: newReturn.outputVAT || 0,
      inputVAT: newReturn.inputVAT || 0,
      netVAT: (newReturn.outputVAT || 0) - (newReturn.inputVAT || 0),
      fileName: 'Manual Entry',
      uploadDate: new Date().toISOString(),
      status: newReturn.status as 'submitted' | 'pending' | 'approved' || 'submitted'
    };

    onVATReturnsChange([...vatReturns, vatReturn]);
    setIsAddDialogOpen(false);
    setNewReturn({
      period: '',
      startDate: '',
      endDate: '',
      taxableSales: 0,
      zeroRatedSales: 0,
      exemptSales: 0,
      outputVAT: 0,
      inputVAT: 0,
      status: 'submitted'
    });
  };

  const handleDeleteReturn = (id: string) => {
    onVATReturnsChange(vatReturns.filter(r => r.id !== id));
  };

  const totalOutputVAT = vatReturns.reduce((sum, r) => sum + r.outputVAT, 0);
  const totalInputVAT = vatReturns.reduce((sum, r) => sum + r.inputVAT, 0);
  const netVAT = totalOutputVAT - totalInputVAT;
  const totalTaxableSales = vatReturns.reduce((sum, r) => sum + r.taxableSales, 0);

  const getStatusBadge = (status: VATReturn['status']) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-success/20 text-success border-success/30">Approved</Badge>;
      case 'pending':
        return <Badge className="bg-warning/20 text-warning border-warning/30">Pending</Badge>;
      default:
        return <Badge className="bg-primary/20 text-primary border-primary/30">Submitted</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* VAT File Upload Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Upload VAT Return Files
          </CardTitle>
          <CardDescription>
            Upload PDF or Excel files - data will be automatically extracted
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
              isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50",
              isParsing && "opacity-50 pointer-events-none"
            )}
          >
            <input {...getInputProps()} />
            {isParsing ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-primary">Parsing VAT return files...</p>
              </div>
            ) : isDragActive ? (
              <p className="text-sm text-primary">Drop VAT return files here...</p>
            ) : (
              <div>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <FileText className="h-6 w-6 text-muted-foreground" />
                  <FileSpreadsheet className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Drag & drop VAT return files here, or click to browse
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Accepts PDF and Excel (.xlsx, .xls) files
                </p>
                <div className="flex items-center justify-center gap-2 mt-3">
                  <Sparkles className="h-4 w-4 text-accent" />
                  <span className="text-xs text-accent">Auto-extracts taxable sales, zero-rated sales, and VAT data</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Parsed Files Preview */}
      <AnimatePresence>
        {parsedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="border-accent/30">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-accent" />
                      Parsed VAT Returns
                    </CardTitle>
                    <CardDescription>
                      Review and edit extracted data before adding
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setParsedFiles([])}
                    >
                      Clear All
                    </Button>
                    <Button
                      size="sm"
                      onClick={applyAllParsedFiles}
                      disabled={parsedFiles.filter(pf => pf.result.success).length === 0}
                      className="gap-1"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Add All ({parsedFiles.filter(pf => pf.result.success).length})
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {parsedFiles.map((pf, index) => (
                  <motion.div
                    key={`${pf.file.name}-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                      "p-4 rounded-lg border",
                      pf.result.success 
                        ? "bg-success/5 border-success/30" 
                        : "bg-destructive/5 border-destructive/30"
                    )}
                  >
                    {/* File Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {pf.result.fileType === 'pdf' ? (
                          <FileText className="h-5 w-5 text-primary" />
                        ) : (
                          <FileSpreadsheet className="h-5 w-5 text-success" />
                        )}
                        <span className="font-medium">{pf.file.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {(pf.file.size / 1024).toFixed(1)} KB
                        </Badge>
                        {pf.result.success && pf.result.data && (
                          getConfidenceBadge(pf.result.data.confidence)
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {pf.result.success && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleEditing(index)}
                              className="h-8 gap-1"
                            >
                              <Edit3 className="h-4 w-4" />
                              {pf.isEditing ? 'Done' : 'Edit'}
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => applyParsedFile(index)}
                              className="h-8 gap-1"
                            >
                              <CheckCircle className="h-4 w-4" />
                              Add
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeParsedFile(index)}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Error Message */}
                    {!pf.result.success && (
                      <div className="flex items-center gap-2 text-destructive text-sm">
                        <AlertCircle className="h-4 w-4" />
                        <span>{pf.result.error}</span>
                      </div>
                    )}

                    {/* Parsed Data Display */}
                    {pf.result.success && pf.result.data && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {/* Period */}
                        <div>
                          <Label className="text-xs text-muted-foreground">Period</Label>
                          {pf.isEditing ? (
                            <Input
                              value={pf.editedData.period || ''}
                              onChange={(e) => updateParsedData(index, 'period', e.target.value)}
                              placeholder="e.g., Q1 2024"
                              className="h-8 mt-1"
                            />
                          ) : (
                            <p className="font-medium text-sm mt-1">
                              {pf.editedData.period || <span className="text-muted-foreground italic">Not detected</span>}
                            </p>
                          )}
                        </div>

                        {/* Taxable Sales */}
                        <div>
                          <Label className="text-xs text-muted-foreground">Taxable Sales</Label>
                          {pf.isEditing ? (
                            <Input
                              type="number"
                              value={pf.editedData.taxableSales || ''}
                              onChange={(e) => updateParsedData(index, 'taxableSales', parseFloat(e.target.value) || 0)}
                              className="h-8 mt-1"
                            />
                          ) : (
                            <p className="font-medium text-sm mt-1">
                              {pf.editedData.taxableSales ? formatCurrency(pf.editedData.taxableSales) : <span className="text-muted-foreground italic">Not detected</span>}
                            </p>
                          )}
                        </div>

                        {/* Zero-Rated Sales */}
                        <div>
                          <Label className="text-xs text-muted-foreground">Zero-Rated Sales</Label>
                          {pf.isEditing ? (
                            <Input
                              type="number"
                              value={pf.editedData.zeroRatedSales || ''}
                              onChange={(e) => updateParsedData(index, 'zeroRatedSales', parseFloat(e.target.value) || 0)}
                              className="h-8 mt-1"
                            />
                          ) : (
                            <p className="font-medium text-sm mt-1">
                              {pf.editedData.zeroRatedSales ? formatCurrency(pf.editedData.zeroRatedSales) : <span className="text-muted-foreground italic">Not detected</span>}
                            </p>
                          )}
                        </div>

                        {/* Output VAT */}
                        <div>
                          <Label className="text-xs text-muted-foreground">Output VAT</Label>
                          {pf.isEditing ? (
                            <Input
                              type="number"
                              value={pf.editedData.outputVAT || ''}
                              onChange={(e) => updateParsedData(index, 'outputVAT', parseFloat(e.target.value) || 0)}
                              className="h-8 mt-1"
                            />
                          ) : (
                            <p className="font-medium text-sm mt-1 text-destructive">
                              {pf.editedData.outputVAT ? formatCurrency(pf.editedData.outputVAT) : <span className="text-muted-foreground italic">Not detected</span>}
                            </p>
                          )}
                        </div>

                        {/* Input VAT (shown in edit mode) */}
                        {pf.isEditing && (
                          <>
                            <div>
                              <Label className="text-xs text-muted-foreground">Input VAT</Label>
                              <Input
                                type="number"
                                value={pf.editedData.inputVAT || ''}
                                onChange={(e) => updateParsedData(index, 'inputVAT', parseFloat(e.target.value) || 0)}
                                className="h-8 mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Exempt Sales</Label>
                              <Input
                                type="number"
                                value={pf.editedData.exemptSales || ''}
                                onChange={(e) => updateParsedData(index, 'exemptSales', parseFloat(e.target.value) || 0)}
                                className="h-8 mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Start Date</Label>
                              <Input
                                type="date"
                                value={pf.editedData.startDate || ''}
                                onChange={(e) => updateParsedData(index, 'startDate', e.target.value)}
                                className="h-8 mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">End Date</Label>
                              <Input
                                type="date"
                                value={pf.editedData.endDate || ''}
                                onChange={(e) => updateParsedData(index, 'endDate', e.target.value)}
                                className="h-8 mt-1"
                              />
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {/* Detected Fields Info */}
                    {pf.result.success && pf.result.data && pf.result.data.detectedFields.length > 0 && !pf.isEditing && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <p className="text-xs text-muted-foreground">
                          Detected fields: {pf.result.data.detectedFields.join(', ')}
                        </p>
                      </div>
                    )}
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sister Concern Section (if applicable) */}
      {onSisterCompaniesChange && (
        <Collapsible open={isSisterOpen} onOpenChange={setIsSisterOpen}>
          <Card>
            <CardHeader className="pb-3">
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle className="text-base">Sister Concern / Related Parties</CardTitle>
                      <CardDescription>
                        Exclude transfers from related companies (if applicable)
                      </CardDescription>
                    </div>
                    {sisterCompanies.filter(c => c.active).length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {sisterCompanies.filter(c => c.active).length} active
                      </Badge>
                    )}
                  </div>
                  <Button variant="ghost" size="sm">
                    {isSisterOpen ? 'Hide' : 'Show'}
                  </Button>
                </div>
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex items-start gap-2 p-3 bg-accent/10 rounded-lg text-sm">
                    <Info className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                    <p className="text-muted-foreground">
                      Add sister companies or related parties whose transactions should be excluded from business turnover calculations.
                    </p>
                  </div>
                  
                  {sisterCompanies.map((company) => (
                    <motion.div
                      key={company.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                        company.active ? "bg-success/5 border-success/20" : "bg-muted/30 border-border"
                      )}
                    >
                      <Checkbox
                        checked={company.active}
                        onCheckedChange={(checked) => updateSisterCompany(company.id, 'active', !!checked)}
                      />
                      <Input
                        value={company.name}
                        onChange={(e) => updateSisterCompany(company.id, 'name', e.target.value)}
                        placeholder="Company name"
                        className="flex-1 h-8"
                      />
                      <Input
                        value={company.notes}
                        onChange={(e) => updateSisterCompany(company.id, 'notes', e.target.value)}
                        placeholder="Notes (optional)"
                        className="w-40 h-8"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSisterCompany(company.id)}
                        className="h-8 w-8 text-destructive hover:text-destructive shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  ))}
                  
                  <Button variant="outline" size="sm" onClick={addSisterCompany} className="gap-1">
                    <Plus className="h-4 w-4" />
                    Add Company
                  </Button>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-muted-foreground mb-1">Total Output VAT</p>
            <p className="text-2xl font-bold text-destructive">{formatCurrency(totalOutputVAT)}</p>
            <p className="text-xs text-muted-foreground">VAT collected on sales</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-muted-foreground mb-1">Total Input VAT</p>
            <p className="text-2xl font-bold text-success">{formatCurrency(totalInputVAT)}</p>
            <p className="text-xs text-muted-foreground">VAT paid on purchases</p>
          </CardContent>
        </Card>

        <Card className={cn(netVAT >= 0 ? 'border-destructive/30' : 'border-success/30')}>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-muted-foreground mb-1">Net VAT Position</p>
            <p className={cn("text-2xl font-bold", netVAT >= 0 ? 'text-destructive' : 'text-success')}>
              {formatCurrency(Math.abs(netVAT))}
            </p>
            <p className="text-xs text-muted-foreground">
              {netVAT >= 0 ? 'Payable to FTA' : 'Refundable from FTA'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-muted-foreground mb-1">Returns Submitted</p>
            <p className="text-2xl font-bold text-foreground">{vatReturns.length}</p>
            <p className="text-xs text-muted-foreground">periods covered</p>
          </CardContent>
        </Card>
      </div>

      {/* VAT Returns Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            VAT Returns
          </CardTitle>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Add VAT Return
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add VAT Return</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Period</Label>
                    <Input
                      placeholder="e.g., Q1 2024"
                      value={newReturn.period || ''}
                      onChange={(e) => setNewReturn({ ...newReturn, period: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={newReturn.status}
                      onValueChange={(value) => setNewReturn({ ...newReturn, status: value as VATReturn['status'] })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="submitted">Submitted</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={newReturn.startDate || ''}
                      onChange={(e) => setNewReturn({ ...newReturn, startDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={newReturn.endDate || ''}
                      onChange={(e) => setNewReturn({ ...newReturn, endDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Taxable Sales</Label>
                    <Input
                      type="number"
                      value={newReturn.taxableSales || ''}
                      onChange={(e) => setNewReturn({ ...newReturn, taxableSales: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Zero-Rated Sales</Label>
                    <Input
                      type="number"
                      value={newReturn.zeroRatedSales || ''}
                      onChange={(e) => setNewReturn({ ...newReturn, zeroRatedSales: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Output VAT</Label>
                    <Input
                      type="number"
                      value={newReturn.outputVAT || ''}
                      onChange={(e) => setNewReturn({ ...newReturn, outputVAT: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Input VAT</Label>
                    <Input
                      type="number"
                      value={newReturn.inputVAT || ''}
                      onChange={(e) => setNewReturn({ ...newReturn, inputVAT: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleAddReturn}>Add Return</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {vatReturns.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No VAT returns added yet</p>
              <p className="text-sm">Add your VAT returns to track and compare with bank turnover</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead className="text-right">Taxable Sales</TableHead>
                    <TableHead className="text-right">Output VAT</TableHead>
                    <TableHead className="text-right">Input VAT</TableHead>
                    <TableHead className="text-right">Net VAT</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vatReturns.map((vat) => (
                    <TableRow key={vat.id}>
                      <TableCell className="font-medium">{vat.period}</TableCell>
                      <TableCell>{new Date(vat.startDate).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(vat.endDate).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(vat.taxableSales)}</TableCell>
                      <TableCell className="text-right font-mono text-destructive">{formatCurrency(vat.outputVAT)}</TableCell>
                      <TableCell className="text-right font-mono text-success">{formatCurrency(vat.inputVAT)}</TableCell>
                      <TableCell className={cn(
                        "text-right font-mono font-semibold",
                        vat.netVAT >= 0 ? 'text-destructive' : 'text-success'
                      )}>
                        {formatCurrency(Math.abs(vat.netVAT))}
                        <span className="text-xs ml-1">
                          {vat.netVAT >= 0 ? '(Pay)' : '(Refund)'}
                        </span>
                      </TableCell>
                      <TableCell>{getStatusBadge(vat.status)}</TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteReturn(vat.id)}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow className="bg-muted/50 font-semibold">
                    <TableCell colSpan={3}>Total</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(totalTaxableSales)}</TableCell>
                    <TableCell className="text-right font-mono text-destructive">{formatCurrency(totalOutputVAT)}</TableCell>
                    <TableCell className="text-right font-mono text-success">{formatCurrency(totalInputVAT)}</TableCell>
                    <TableCell className={cn(
                      "text-right font-mono font-bold",
                      netVAT >= 0 ? 'text-destructive' : 'text-success'
                    )}>
                      {formatCurrency(Math.abs(netVAT))}
                    </TableCell>
                    <TableCell colSpan={2}></TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
