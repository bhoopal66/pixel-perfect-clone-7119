import { useState, useCallback } from 'react';
import { LenderMatchingEngine, type LenderMatchResult } from '@/services/lenderMatchingEngine';
import { supabase } from '@/integrations/supabase/client';
import { PDFParser } from '@/services/pdfParser';
import { parseVATReturn, createVATReturnFromParsed } from '@/services/vatReturnParser';
import { AssessmentAnalysisEngine } from '@/services/assessmentAnalysisEngine';
import { AssessmentRuleEngine } from '@/services/assessmentRuleEngine';
import { TransactionAnalyzer } from '@/services/transactionAnalyzer';
import { toast } from 'sonner';
import type {
  AssessmentCase,
  AssessmentStep,
  ParsedBankFile,
  ParsedVatFile,
  ParsedTransaction,
  BankMonthlyAnalysis,
  VatPeriodAnalysis,
  CombinedFinancialSummary,
  AssessmentLenderResult,
} from '@/types/assessment.types';

export function useEligibilityAssessment() {
  const [currentStep, setCurrentStep] = useState<AssessmentStep>('upload');
  const [caseId, setCaseId] = useState<string | null>(null);
  const [caseNumber, setCaseNumber] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Parsed file data
  const [bankFiles, setBankFiles] = useState<ParsedBankFile[]>([]);
  const [vatFiles, setVatFiles] = useState<ParsedVatFile[]>([]);

  // Analysis results
  const [monthlySummaries, setMonthlySummaries] = useState<BankMonthlyAnalysis[]>([]);
  const [vatAnalysis, setVatAnalysis] = useState<VatPeriodAnalysis[]>([]);
  const [combinedSummary, setCombinedSummary] = useState<CombinedFinancialSummary | null>(null);
  const [lenderResults, setLenderResults] = useState<Omit<AssessmentLenderResult, 'id' | 'case_id' | 'created_at' | 'updated_at'>[]>([]);
  const [matchResults, setMatchResults] = useState<LenderMatchResult[]>([]);
  const [isMatchingRunning, setIsMatchingRunning] = useState(false);

  // Parse bank statement PDF
  const parseBankStatement = useCallback(async (file: File): Promise<ParsedBankFile | null> => {
    try {
      const pdfData = await PDFParser.parsePDF(file);
      const detection = PDFParser.detectBank(pdfData.text);
      const transactions = PDFParser.extractTransactions(pdfData.text, detection.detectedBank || undefined);
      const accountInfo = PDFParser.extractAccountInfo(pdfData.text);

      const parsedTxns: ParsedTransaction[] = transactions.map(t => ({
        date: t.date,
        description: t.description,
        chequeNo: (t as any).chequeNo || undefined,
        debit: t.debit,
        credit: t.credit,
        balance: t.balance,
        category: TransactionAnalyzer.categorizeTransaction(t.description, t.debit, t.credit),
      }));

      const totalCredits = parsedTxns.reduce((s, t) => s + t.credit, 0);
      const totalDebits = parsedTxns.reduce((s, t) => s + t.debit, 0);

      // Check for duplicates
      const isDuplicate = bankFiles.some(
        existing => existing.fileName === file.name && existing.totalCredits === totalCredits
      );

      return {
        file,
        fileName: file.name,
        bankName: detection.detectedBank || null,
        accountHolder: accountInfo.accountName || null,
        accountNumber: accountInfo.accountNumber || null,
        periodFrom: accountInfo.startDate || null,
        periodTo: accountInfo.endDate || null,
        transactions: parsedTxns,
        totalCredits,
        totalDebits,
        isDuplicate,
        isValid: parsedTxns.length > 0 && !isDuplicate,
        validationMessage: isDuplicate
          ? 'Duplicate statement detected'
          : parsedTxns.length === 0
            ? 'No transactions could be extracted'
            : null,
      };
    } catch (error) {
      console.error('Bank statement parse error:', error);
      return {
        file,
        fileName: file.name,
        bankName: null,
        accountHolder: null,
        accountNumber: null,
        periodFrom: null,
        periodTo: null,
        transactions: [],
        totalCredits: 0,
        totalDebits: 0,
        isDuplicate: false,
        isValid: false,
        validationMessage: error instanceof Error ? error.message : 'Failed to parse PDF',
      };
    }
  }, [bankFiles]);

  // Parse VAT return file
  const parseVatReturn = useCallback(async (file: File): Promise<ParsedVatFile | null> => {
    try {
      const result = await parseVATReturn(file);
      if (!result.success || !result.data) {
        return {
          file,
          fileName: file.name,
          taxPeriodFrom: null,
          taxPeriodTo: null,
          vatSales: 0,
          taxableSupplies: 0,
          zeroRatedSupplies: 0,
          exemptSupplies: 0,
          outputVat: 0,
          inputVat: 0,
          netVatPayable: 0,
          trn: null,
          isValid: false,
          validationMessage: result.error || 'Failed to parse VAT return',
          confidence: 'low',
        };
      }

      const d = result.data;
      return {
        file,
        fileName: file.name,
        taxPeriodFrom: d.startDate || null,
        taxPeriodTo: d.endDate || null,
        vatSales: d.taxableSales || 0,
        taxableSupplies: d.taxableSales || 0,
        zeroRatedSupplies: d.zeroRatedSales || 0,
        exemptSupplies: d.exemptSales || 0,
        outputVat: d.outputVAT || 0,
        inputVat: d.inputVAT || 0,
        netVatPayable: (d.outputVAT || 0) - (d.inputVAT || 0),
        trn: null,
        isValid: d.confidence !== 'low',
        validationMessage: d.confidence === 'low' ? 'Low confidence extraction - manual review recommended' : null,
        confidence: d.confidence,
      };
    } catch (error) {
      return {
        file,
        fileName: file.name,
        taxPeriodFrom: null,
        taxPeriodTo: null,
        vatSales: 0,
        taxableSupplies: 0,
        zeroRatedSupplies: 0,
        exemptSupplies: 0,
        outputVat: 0,
        inputVat: 0,
        netVatPayable: 0,
        trn: null,
        isValid: false,
        validationMessage: 'Failed to parse file',
        confidence: 'low',
      };
    }
  }, []);

  // Handle file uploads
  const handleBankFiles = useCallback(async (files: File[]) => {
    setIsProcessing(true);
    try {
      const results = await Promise.all(files.map(f => parseBankStatement(f)));
      const valid = results.filter(Boolean) as ParsedBankFile[];
      setBankFiles(prev => [...prev, ...valid]);
      const validCount = valid.filter(f => f.isValid).length;
      const dupeCount = valid.filter(f => f.isDuplicate).length;
      if (validCount > 0) toast.success(`${validCount} bank statement(s) parsed successfully`);
      if (dupeCount > 0) toast.warning(`${dupeCount} duplicate(s) detected and skipped`);
    } finally {
      setIsProcessing(false);
    }
  }, [parseBankStatement]);

  const handleVatFiles = useCallback(async (files: File[]) => {
    setIsProcessing(true);
    try {
      const results = await Promise.all(files.map(f => parseVatReturn(f)));
      const valid = results.filter(Boolean) as ParsedVatFile[];
      setVatFiles(prev => [...prev, ...valid]);
      const validCount = valid.filter(f => f.isValid).length;
      if (validCount > 0) toast.success(`${validCount} VAT return(s) parsed successfully`);
    } finally {
      setIsProcessing(false);
    }
  }, [parseVatReturn]);

  const removeBankFile = useCallback((index: number) => {
    setBankFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const removeVatFile = useCallback((index: number) => {
    setVatFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Run analysis
  const runAnalysis = useCallback(async () => {
    setIsProcessing(true);
    try {
      // Create assessment case in DB
      const { data: { user } } = await supabase.auth.getUser();
      const { data: caseData, error: caseError } = await supabase
        .from('assessment_cases')
        .insert({
          company_name: companyName || null,
          user_id: user?.id || null,
          status: 'analyzing',
        })
        .select()
        .single();

      if (caseError) throw caseError;
      setCaseId(caseData.id);
      setCaseNumber(caseData.case_number);

      // Calculate bank monthly summaries
      const allTransactions = bankFiles
        .filter(f => f.isValid)
        .flatMap(f => f.transactions);
      
      const summaries = AssessmentAnalysisEngine.calculateMonthlySummaries(allTransactions);
      setMonthlySummaries(summaries);

      // Calculate VAT analysis
      const vatResults = AssessmentAnalysisEngine.calculateVatAnalysis(vatFiles);
      setVatAnalysis(vatResults);

      // Generate combined summary
      const combined = AssessmentAnalysisEngine.generateCombinedSummary(
        bankFiles, vatFiles, summaries, vatResults, companyName
      );
      setCombinedSummary(combined);

      // Save bank summaries to DB
      if (summaries.length > 0) {
        await supabase.from('assessment_bank_summaries').insert(
          summaries.map(s => ({
            case_id: caseData.id,
            bank_name: bankFiles[0]?.bankName || null,
            month: s.month,
            year: s.year,
            total_credits: s.totalCredits,
            total_debits: s.totalDebits,
            credit_count: s.creditCount,
            debit_count: s.debitCount,
            highest_credit: s.highestCredit,
            lowest_balance: s.lowestBalance,
            avg_daily_balance: s.avgDailyBalance,
            closing_balance: s.closingBalance,
            cash_deposit_total: s.cashDepositTotal,
            negative_balance_days: s.negativeBalanceDays,
            bounce_count: s.bounceCount,
          }))
        );
      }

      // Save VAT returns to DB
      if (vatFiles.length > 0) {
        await supabase.from('assessment_vat_returns').insert(
          vatFiles.filter(f => f.isValid).map(f => ({
            case_id: caseData.id,
            tax_period_from: f.taxPeriodFrom,
            tax_period_to: f.taxPeriodTo,
            vat_sales: f.vatSales,
            taxable_supplies: f.taxableSupplies,
            zero_rated_supplies: f.zeroRatedSupplies,
            exempt_supplies: f.exemptSupplies,
            output_vat: f.outputVat,
            input_vat: f.inputVat,
            net_vat_payable: f.netVatPayable,
            source_file: f.fileName,
          }))
        );
      }

      // Fetch lenders and run rule engine
      const { data: lenders } = await supabase
        .from('onboarding_lenders')
        .select('*')
        .eq('is_active', true);

      if (lenders && lenders.length > 0) {
        const results = AssessmentRuleEngine.evaluateAllLenders(
          combined,
          summaries,
          vatResults,
          lenders.map(l => ({
            id: l.id,
            name: l.name,
            short_code: l.short_code,
            lender_type: l.lender_type,
            eligibility_rules: l.eligibility_rules as any,
          }))
        );
        setLenderResults(results);

        // Save lender results to DB
        await supabase.from('assessment_lender_results').insert(
          results.map(r => ({
            case_id: caseData.id,
            lender_id: r.lender_id,
            lender_name: r.lender_name,
            product_name: r.product_name,
            eligibility_status: r.eligibility_status,
            recommended_limit: r.recommended_limit,
            limit_basis: r.limit_basis,
            tenure_months: r.tenure_months,
            pricing_band: r.pricing_band,
            key_reasons: r.key_reasons as any,
            failed_rules: r.failed_rules as any,
            risk_flags: r.risk_flags as any,
            passed_rules: r.passed_rules as any,
            required_deviations: r.required_deviations as any,
            rule_details: r.rule_details as any,
          }))
        );
      }

      // Update case summary
      await supabase.from('assessment_cases').update({
        status: 'review',
        total_bank_credits: combined.avgMonthlyCredit * combined.statementMonthsCovered,
        total_bank_debits: combined.avgMonthlyDebit * combined.statementMonthsCovered,
        avg_monthly_credit: combined.avgMonthlyCredit,
        avg_monthly_debit: combined.avgMonthlyDebit,
        avg_monthly_balance: combined.avgMonthlyBalance,
        estimated_annual_turnover: combined.estimatedAnnualTurnover,
        declared_vat_turnover: combined.declaredVatTurnover,
        bank_vat_variance_percent: combined.variancePercent,
        normalized_turnover: combined.normalizedTurnover,
        variance_tag: combined.varianceTag,
        risk_flags: combined.riskFlags as any,
        statement_months_covered: combined.statementMonthsCovered,
        vat_periods_covered: combined.vatPeriodsCovered,
      }).eq('id', caseData.id);

      // Auto-run matching engine after analysis
      try {
        setIsMatchingRunning(true);
        const matches = await LenderMatchingEngine.runMatchingEngine(caseData.id);
        setMatchResults(matches);
      } catch (matchError) {
        console.error('Matching engine error:', matchError);
      } finally {
        setIsMatchingRunning(false);
      }

      toast.success('Analysis completed successfully');
      setCurrentStep('extraction');
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Failed to run analysis');
    } finally {
      setIsProcessing(false);
    }
  }, [bankFiles, vatFiles, companyName]);

  // Reset entire workflow
  // Run matching engine on demand
  const runMatchingEngine = useCallback(async () => {
    if (!caseId) return;
    setIsMatchingRunning(true);
    try {
      const matches = await LenderMatchingEngine.runMatchingEngine(caseId);
      setMatchResults(matches);
      toast.success('Funding options updated');
    } catch (error) {
      console.error('Matching engine error:', error);
      toast.error('Failed to run matching engine');
    } finally {
      setIsMatchingRunning(false);
    }
  }, [caseId]);

  const resetAssessment = useCallback(() => {
    setCaseId(null);
    setCaseNumber(null);
    setCompanyName('');
    setBankFiles([]);
    setVatFiles([]);
    setMonthlySummaries([]);
    setVatAnalysis([]);
    setCombinedSummary(null);
    setLenderResults([]);
    setMatchResults([]);
    setCurrentStep('upload');
  }, []);

  return {
    currentStep,
    setCurrentStep,
    caseId,
    caseNumber,
    companyName,
    setCompanyName,
    isProcessing,
    bankFiles,
    vatFiles,
    monthlySummaries,
    vatAnalysis,
    combinedSummary,
    lenderResults,
    matchResults,
    isMatchingRunning,
    handleBankFiles,
    handleVatFiles,
    removeBankFile,
    removeVatFile,
    runAnalysis,
    runMatchingEngine,
    resetAssessment,
  };
}
