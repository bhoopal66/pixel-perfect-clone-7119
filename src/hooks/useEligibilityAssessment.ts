import { useState, useCallback } from 'react';
import { LenderMatchingEngine, type LenderMatchResult } from '@/services/lenderMatchingEngine';
import { supabase } from '@/integrations/supabase/client';
import { PDFParser } from '@/services/pdfParser';
import { parseVATReturn, createVATReturnFromParsed } from '@/services/vatReturnParser';
import { AssessmentAnalysisEngine } from '@/services/assessmentAnalysisEngine';
import { CurrencyService } from '@/services/currencyService';
import { CurrencyConversionService } from '@/services/currencyConversionService';
// AssessmentRuleEngine is deprecated in favor of the unified RuleEngineExecutor
import { RelatedPartyService } from '@/services/relatedPartyService';
import { TransactionAnalyzer } from '@/services/transactionAnalyzer';
import { BankingRiskAnalysisEngine, type BankAnalysisResult, type ConsolidatedAnalysis, type AccountAnalysisInput } from '@/services/bankingRiskAnalysisEngine';
import { FraudDetectionEngine } from '@/services/fraudDetectionEngine';
import {
  ActivityLogService,
  ExtractionRunService,
  FinancialSummaryService,
} from '@/services/permanentStorageService';
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
import type { AccountCurrencyConfig } from '@/types/currency.types';



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
  const [bankRiskResults, setBankRiskResults] = useState<BankAnalysisResult[]>([]);
  const [bankRiskConsolidated, setBankRiskConsolidated] = useState<ConsolidatedAnalysis | null>(null);

  // Multi-currency state
  const [accountConfigs, setAccountConfigs] = useState<AccountCurrencyConfig[]>([]);
  const [baseReportingCurrency, setBaseReportingCurrency] = useState('AED');


  // Parse bank statement PDF
  const parseBankStatement = useCallback(async (file: File): Promise<ParsedBankFile | null> => {
    try {
      const pdfData = await PDFParser.parsePDF(file);
      const detection = PDFParser.detectBank(pdfData.text);
      const transactions = PDFParser.extractTransactions(pdfData.text, detection.detectedBank || undefined);
      const accountInfo = PDFParser.extractAccountInfo(pdfData.text);
      const detectedCurrency = CurrencyService.detectCurrency(pdfData.text);

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
        detectedCurrency,
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
        detectedCurrency: 'AED',
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

      // Log case creation
      await ActivityLogService.log(caseData.id, 'case_status_changed', `Assessment case created: ${caseData.case_number || caseData.id}`);

      // Save documents & create extraction runs for bank files
      for (const bf of bankFiles.filter(f => f.isValid)) {
        // Save document record
        const { data: docRecord } = await supabase
          .from('assessment_documents')
          .insert({
            case_id: caseData.id,
            document_type: 'bank_statement',
            file_name: bf.fileName,
            original_file_name: bf.fileName,
            bank_name: bf.bankName,
            account_holder: bf.accountHolder,
            account_number: bf.accountNumber,
            period_from: bf.periodFrom,
            period_to: bf.periodTo,
            is_duplicate: bf.isDuplicate,
            validation_status: bf.isValid ? 'valid' : 'invalid',
            validation_message: bf.validationMessage,
            uploaded_by: user?.id || null,
          } as any)
          .select()
          .single();

        if (docRecord) {
          await ActivityLogService.log(caseData.id, 'document_uploaded', `Bank statement uploaded: ${bf.fileName}`, 'assessment_documents', docRecord.id);

          // Create extraction run
          const run = await ExtractionRunService.create(caseData.id, docRecord.id, 'bank_statement');

          // Save bank transactions linked to extraction run
          if (bf.transactions.length > 0) {
            await supabase.from('assessment_bank_transactions').insert(
              bf.transactions.map(t => ({
                case_id: caseData.id,
                document_id: docRecord.id,
                extraction_run_id: run.id,
                txn_date: t.date,
                description: t.description,
                cheque_no: t.chequeNo || null,
                debit: t.debit,
                credit: t.credit,
                balance: t.balance,
                bank_name: bf.bankName,
                account_name: bf.accountHolder,
                category: t.category || null,
                month: t.date ? new Date(t.date).getMonth() + 1 : null,
                year: t.date ? new Date(t.date).getFullYear() : null,
              } as any))
            );
          }

          // Complete extraction run
          const confidence = bf.transactions.length > 0 ? 0.85 : 0;
          await ExtractionRunService.complete(run.id, caseData.id, confidence, 'pdfjs-regex');
        }
      }

      // Save VAT documents & extraction runs
      for (const vf of vatFiles.filter(f => f.isValid)) {
        const { data: vatDocRecord } = await supabase
          .from('assessment_documents')
          .insert({
            case_id: caseData.id,
            document_type: 'vat_return',
            file_name: vf.fileName,
            original_file_name: vf.fileName,
            validation_status: vf.isValid ? 'valid' : 'invalid',
            validation_message: vf.validationMessage,
            uploaded_by: user?.id || null,
          } as any)
          .select()
          .single();

        if (vatDocRecord) {
          await ActivityLogService.log(caseData.id, 'document_uploaded', `VAT return uploaded: ${vf.fileName}`, 'assessment_documents', vatDocRecord.id);

          const vatRun = await ExtractionRunService.create(caseData.id, vatDocRecord.id, 'vat_return');

          await supabase.from('assessment_vat_returns').insert({
            case_id: caseData.id,
            document_id: vatDocRecord.id,
            extraction_run_id: vatRun.id,
            tax_period_from: vf.taxPeriodFrom,
            tax_period_to: vf.taxPeriodTo,
            vat_sales: vf.vatSales,
            taxable_supplies: vf.taxableSupplies,
            zero_rated_supplies: vf.zeroRatedSupplies,
            exempt_supplies: vf.exemptSupplies,
            output_vat: vf.outputVat,
            input_vat: vf.inputVat,
            net_vat_payable: vf.netVatPayable,
            source_file: vf.fileName,
          } as any);

          const vatConfidence = vf.confidence === 'high' ? 0.95 : vf.confidence === 'medium' ? 0.7 : 0.4;
          await ExtractionRunService.complete(vatRun.id, caseData.id, vatConfidence, 'pdfjs-regex');
        }
      }

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

      // Save bank summaries to DB - associate each summary with the correct bank
      if (summaries.length > 0) {
        // Determine bank name and account number per month from source files
        const monthToBankMap = new Map<string, { bankName: string | null; accountNumber: string | null }>();
        bankFiles.filter(f => f.isValid).forEach(bf => {
          bf.transactions.forEach(t => {
            const d = new Date(t.date);
            if (!isNaN(d.getTime())) {
              const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
              if (bf.bankName || bf.accountNumber) {
                monthToBankMap.set(key, { bankName: bf.bankName, accountNumber: bf.accountNumber });
              }
            }
          });
        });

        await supabase.from('assessment_bank_summaries').insert(
          summaries.map(s => {
            const info = monthToBankMap.get(`${s.year}-${s.month}`);
            return {
              case_id: caseData.id,
              bank_name: info?.bankName || bankFiles[0]?.bankName || null,
              account_number: info?.accountNumber || bankFiles[0]?.accountNumber || null,
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
            };
          })
        );
      }

      // Run professional banking risk analysis (15 modules)
      try {
        const accountInputs: AccountAnalysisInput[] = bankFiles
          .filter(f => f.isValid)
          .map(bf => ({
            accountNumber: bf.accountNumber,
            bankName: bf.bankName,
            transactions: bf.transactions,
            periodFrom: bf.periodFrom,
            periodTo: bf.periodTo,
          }));

        if (accountInputs.length > 0) {
          const { accountResults: riskResults, consolidated: riskConsolidated } =
            await BankingRiskAnalysisEngine.runAndPersist(caseData.id, accountInputs);
          setBankRiskResults(riskResults);
          setBankRiskConsolidated(riskConsolidated);
          await ActivityLogService.log(caseData.id, 'bank_risk_analysis', `Banking risk analysis completed: ${riskResults.length} account(s), ${riskConsolidated.overall_risk_flags.length} risk flag(s)`);

          // Auto-detect related party transactions
          try {
            const rpResult = await RelatedPartyService.detectTransactions(caseData.id);
            if (rpResult.matched > 0) {
              await ActivityLogService.log(caseData.id, 'related_party_detection' as any, `Related party detection: ${rpResult.matched} transactions matched, risk: ${rpResult.summary.risk_flag}`);
            }
          } catch (rpError) {
            console.error('Related party detection error:', rpError);
          }
        }
      } catch (riskError) {
        console.error('Banking risk analysis error:', riskError);
      }

      // Save combined financial summary (versioned, permanent)
      const periodDates = bankFiles.filter(f => f.periodFrom && f.periodTo);
      const periodFrom = periodDates.length > 0
        ? periodDates.reduce((min, f) => !min || (f.periodFrom && f.periodFrom < min) ? f.periodFrom! : min, '')
        : null;
      const periodTo = periodDates.length > 0
        ? periodDates.reduce((max, f) => !max || (f.periodTo && f.periodTo > max) ? f.periodTo! : max, '')
        : null;

      await FinancialSummaryService.create(caseData.id, {
        period_from: periodFrom,
        period_to: periodTo,
        avg_monthly_bank_credit: combined.avgMonthlyCredit,
        avg_monthly_debit: combined.avgMonthlyDebit,
        avg_monthly_balance: combined.avgMonthlyBalance,
        adjusted_annual_turnover: combined.estimatedAnnualTurnover,
        adjusted_monthly_turnover: combined.avgMonthlyCredit,
        vat_monthly_sales: combined.declaredVatTurnover > 0 ? combined.declaredVatTurnover / 12 : 0,
        bank_vat_variance: combined.variancePercent,
        negative_balance_days: combined.negativeBalanceDays,
        returned_cheque_count: combined.totalBounces,
        cash_deposit_ratio: combined.cashDepositRatio,
        risk_flags_json: combined.riskFlags as any,
      } as any);

      // Run database-driven lender rule engine (unified engine)
      try {
        const { RuleEngineExecutor } = await import('@/services/ruleEngineExecutor');
        const executionResults = await RuleEngineExecutor.executeAllLenders(caseData.id);
        
        if (executionResults.length > 0) {
          // Map execution results to the assessment lender results format for UI display
          const mappedResults = executionResults.map(r => ({
            lender_id: r.lender_id,
            lender_name: '', // Will be populated below
            product_name: null as string | null,
            eligibility_status: r.eligibility_status as any,
            recommended_limit: r.recommended_limit,
            limit_basis: r.decision_summary || null,
            tenure_months: r.recommended_tenure,
            pricing_band: r.pricing_band || null,
            key_reasons: (r.failed_rules || []).map((f: any) => f.rule_name) as string[],
            failed_rules: r.failed_rules as any[] || [],
            risk_flags: (r.risk_flags || []) as string[],
            passed_rules: [] as any[],
            required_deviations: [] as string[],
            rule_details: [] as any[],
          }));
          
          // Fetch lender names
          const { data: lenders } = await supabase
            .from('onboarding_lenders')
            .select('id, name')
            .eq('is_active', true);
          
          for (const mr of mappedResults) {
            const lender = lenders?.find(l => l.id === mr.lender_id);
            mr.lender_name = lender?.name || 'Unknown';
          }
          
          setLenderResults(mappedResults);
          await ActivityLogService.log(caseData.id, 'lender_engine_run', `Lender rules evaluated: ${executionResults.length} product(s) across active lenders`);
        }
      } catch (lenderErr) {
        console.error('Lender rule engine error:', lenderErr);
        toast.error('Lender rule engine failed - check rule configuration');
      }

      // Update case summary + mark analysis completed
      const totalCreditsActual = bankFiles.filter(f => f.isValid).reduce((s, f) => s + f.totalCredits, 0);
      const totalDebitsActual = bankFiles.filter(f => f.isValid).reduce((s, f) => s + f.totalDebits, 0);
      
      const { error: updateError } = await supabase.from('assessment_cases').update({
        status: 'review',
        total_bank_credits: totalCreditsActual,
        total_bank_debits: totalDebitsActual,
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
        analysis_completed: true,
        lenders_run_completed: true,
      } as any).eq('id', caseData.id);
      
      if (updateError) {
        console.error('Failed to update case status:', updateError);
        toast.error('Warning: Case status update failed');
      }

      // Auto-run fraud detection after analysis
      try {
        await FraudDetectionEngine.runDetection(caseData.id);
        await ActivityLogService.log(caseData.id, 'fraud_detection_run', 'Fraud detection engine completed');
      } catch (fraudErr) {
        console.error('Fraud detection error:', fraudErr);
      }

      // Auto-run matching engine after analysis
      try {
        setIsMatchingRunning(true);
        const matches = await LenderMatchingEngine.runMatchingEngine(caseData.id);
        setMatchResults(matches);

        await supabase.from('assessment_cases').update({
          ai_matching_completed: true,
        } as any).eq('id', caseData.id);

        await ActivityLogService.log(caseData.id, 'ai_matching_run', `AI matching completed with ${matches.length} results`);
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

  // Run matching engine on demand
  const runMatchingEngine = useCallback(async () => {
    if (!caseId) return;
    setIsMatchingRunning(true);
    try {
      const matches = await LenderMatchingEngine.runMatchingEngine(caseId);
      setMatchResults(matches);

      await ActivityLogService.log(caseId, 'ai_matching_run', `Funding options updated with ${matches.length} results`);
      toast.success('Funding options updated');
    } catch (error) {
      console.error('Matching engine error:', error);
      toast.error('Failed to run matching engine');
    } finally {
      setIsMatchingRunning(false);
    }
  }, [caseId]);

  // Reset entire workflow
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
    setBankRiskResults([]);
    setBankRiskConsolidated(null);
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
    bankRiskResults,
    bankRiskConsolidated,
    handleBankFiles,
    handleVatFiles,
    removeBankFile,
    removeVatFile,
    runAnalysis,
    runMatchingEngine,
    resetAssessment,
  };
}
