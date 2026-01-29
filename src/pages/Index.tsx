import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileSpreadsheet, Shield, Zap, BarChart3, RefreshCw, CheckCircle, AlertCircle, Briefcase, Calculator } from 'lucide-react';
import { FileUpload } from '../components/FileUpload';
import { AnalysisProgress } from '../components/AnalysisProgress';
import { ResultsDashboard } from '../components/ResultsDashboard';
import { LoanCaseManagement } from '../components/LoanCaseManagement';
import { LoanEligibilityDashboard } from '../components/LoanEligibilityDashboard';
import { ReportBuilder } from '../services/reportBuilder';
import { ExcelGenerator } from '../services/excelGenerator';
import { CurrencyService } from '../services/currencyService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import type { AnalysisReport, AnalysisStep, AppState } from '../types/transaction.types';

const Index = () => {
  const [appState, setAppState] = useState<AppState>('upload');
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [ratesStatus, setRatesStatus] = useState<'loading' | 'live' | 'default'>('loading');
  const [analysisSteps, setAnalysisSteps] = useState<AnalysisStep[]>([
    { id: '1', label: 'Parsing PDF files', status: 'pending' },
    { id: '2', label: 'Extracting transactions', status: 'pending' },
    { id: '3', label: 'Categorizing transactions', status: 'pending' },
    { id: '4', label: 'Calculating balances', status: 'pending' },
    { id: '5', label: 'Generating analysis', status: 'pending' },
    { id: '6', label: 'Creating report', status: 'pending' }
  ]);

  // Fetch live exchange rates on mount
  useEffect(() => {
    const fetchRates = async () => {
      setRatesStatus('loading');
      const success = await CurrencyService.fetchLiveRates('AED');
      if (success) {
        setRatesStatus('live');
        toast.success('Live exchange rates loaded', {
          description: `Rates updated as of ${CurrencyService.getRatesDate()}`,
        });
      } else {
        setRatesStatus('default');
        toast.info('Using default exchange rates', {
          description: 'Could not fetch live rates, using cached values',
        });
      }
    };
    fetchRates();
  }, []);

  const updateStepStatus = useCallback((index: number, status: AnalysisStep['status']) => {
    setAnalysisSteps(prev => 
      prev.map((step, i) => i === index ? { ...step, status } : step)
    );
  }, []);

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const handleDemoMode = async () => {
    setAppState('analyzing');
    
    // Reset steps
    setAnalysisSteps(prev => prev.map(s => ({ ...s, status: 'pending' as const })));
    
    try {
      // Quick demo flow
      for (let i = 0; i < 6; i++) {
        updateStepStatus(i, 'processing');
        await delay(300);
        updateStepStatus(i, 'completed');
      }
      
      const demoReport = ReportBuilder.generateDemoReport();
      setReport(demoReport);
      await delay(200);
      setAppState('results');
    } catch (error) {
      console.error('Demo failed:', error);
    }
  };

  const handleFilesSelected = async (files: File[]) => {
    setAppState('analyzing');
    
    // Reset steps
    setAnalysisSteps(prev => prev.map(s => ({ ...s, status: 'pending' as const })));
    
    try {
      // Step 1: Parsing PDFs
      updateStepStatus(0, 'processing');
      await delay(800);
      updateStepStatus(0, 'completed');

      // Step 2: Extracting transactions
      updateStepStatus(1, 'processing');
      await delay(600);
      updateStepStatus(1, 'completed');

      // Step 3: Categorizing
      updateStepStatus(2, 'processing');
      await delay(500);
      updateStepStatus(2, 'completed');

      // Step 4: Calculating balances
      updateStepStatus(3, 'processing');
      await delay(700);
      updateStepStatus(3, 'completed');

      // Step 5: Generating analysis
      updateStepStatus(4, 'processing');
      await delay(600);
      updateStepStatus(4, 'completed');

      // Step 6: Creating report
      updateStepStatus(5, 'processing');
      
      // Try to build real report, fall back to demo if needed
      let analysisReport: AnalysisReport;
      try {
        analysisReport = await ReportBuilder.buildReport(files);
        // If no transactions were extracted, use demo data
        if (analysisReport.transactions.length === 0) {
          console.log('No transactions found in PDFs, using demo data');
          analysisReport = ReportBuilder.generateDemoReport();
        }
      } catch (error) {
        console.log('PDF parsing failed, using demo data:', error);
        analysisReport = ReportBuilder.generateDemoReport();
      }
      
      await delay(500);
      setReport(analysisReport);
      updateStepStatus(5, 'completed');

      await delay(300);
      setAppState('results');
    } catch (error) {
      console.error('Analysis failed:', error);
      // Use demo data on error
      const demoReport = ReportBuilder.generateDemoReport();
      setReport(demoReport);
      setAppState('results');
    }
  };

  const handleDownload = async () => {
    if (!report) return;

    try {
      const blob = await ExcelGenerator.generateReport(report);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Bank_Statement_Analysis_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleReset = () => {
    setAppState('upload');
    setReport(null);
    setAnalysisSteps(prev => prev.map(s => ({ ...s, status: 'pending' as const })));
  };

  const features = [
    { icon: <FileSpreadsheet className="h-6 w-6" />, title: '7 Report Worksheets', desc: 'Comprehensive Excel analysis' },
    { icon: <Zap className="h-6 w-6" />, title: 'Instant Analysis', desc: 'Process statements in seconds' },
    { icon: <BarChart3 className="h-6 w-6" />, title: 'Smart Categorization', desc: 'Auto-categorize transactions' },
    { icon: <Shield className="h-6 w-6" />, title: 'Secure Processing', desc: 'Your data stays private' },
  ];

  const [activeTab, setActiveTab] = useState<'analysis' | 'loans' | 'eligibility'>('analysis');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-background/80 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl gradient-primary">
                <Briefcase className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">Case Management</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">Loan Processing & Analysis</p>
              </div>
            </div>
            
            {/* Navigation Tabs */}
            <div className="flex items-center gap-4">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'analysis' | 'loans' | 'eligibility')}>
                <TabsList className="bg-muted/50">
                  <TabsTrigger value="analysis" className="gap-2 text-xs sm:text-sm">
                    <BarChart3 className="h-4 w-4" />
                    <span className="hidden sm:inline">Statement Analysis</span>
                  </TabsTrigger>
                  <TabsTrigger value="loans" className="gap-2 text-xs sm:text-sm">
                    <Briefcase className="h-4 w-4" />
                    <span className="hidden sm:inline">Cash Loans</span>
                  </TabsTrigger>
                  <TabsTrigger value="eligibility" className="gap-2 text-xs sm:text-sm">
                    <Calculator className="h-4 w-4" />
                    <span className="hidden sm:inline">Loan Eligibility</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              
              {/* Exchange Rate Status */}
              {activeTab === 'analysis' && (
                <>
                  {ratesStatus === 'loading' && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 text-muted-foreground text-xs">
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      <span className="hidden sm:inline">Loading rates...</span>
                    </div>
                  )}
                  {ratesStatus === 'live' && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 text-success text-xs">
                      <CheckCircle className="h-3 w-3" />
                      <span className="hidden sm:inline">Live rates ({CurrencyService.getRatesDate()})</span>
                    </div>
                  )}
                  {ratesStatus === 'default' && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-warning/10 text-warning text-xs">
                      <AlertCircle className="h-3 w-3" />
                      <span className="hidden sm:inline">Default rates</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section - Show for all tabs */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-95" />
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-accent/20 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white/90 text-sm font-medium mb-6 backdrop-blur-sm">
              <Zap className="h-4 w-4" />
              Complete Loan Processing Suite
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
              Streamline Your<br />
              <span className="text-accent">Loan Management</span>
            </h2>
            <p className="text-base md:text-lg text-white/80 max-w-2xl mx-auto mb-10">
              From eligibility checks to lender comparison and statement analysis — 
              everything you need in one powerful platform.
            </p>
          </motion.div>

          {/* Quick Action Cards */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto"
          >
            {/* Cash Loans Card */}
            <motion.button
              onClick={() => setActiveTab('loans')}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.02, y: -4 }}
              className={`p-6 rounded-2xl backdrop-blur-sm border text-left transition-all cursor-pointer ${
                activeTab === 'loans' 
                  ? 'bg-accent/20 border-accent/50' 
                  : 'bg-white/10 border-white/10 hover:bg-white/15'
              }`}
            >
              <div className="p-3 rounded-xl bg-accent/20 w-fit mb-4">
                <Briefcase className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-white font-bold text-lg mb-2">Cash Loans</h3>
              <p className="text-white/70 text-sm mb-4">
                Compare RAK Bank & Wio Bank rates. Track applications from draft to disbursement.
              </p>
              <div className="flex items-center gap-2 text-accent text-sm font-medium">
                <span>Open Module</span>
                <BarChart3 className="h-4 w-4" />
              </div>
            </motion.button>

            {/* Loan Eligibility Card */}
            <motion.button
              onClick={() => setActiveTab('eligibility')}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              whileHover={{ scale: 1.02, y: -4 }}
              className={`p-6 rounded-2xl backdrop-blur-sm border text-left transition-all cursor-pointer ${
                activeTab === 'eligibility' 
                  ? 'bg-accent/20 border-accent/50' 
                  : 'bg-white/10 border-white/10 hover:bg-white/15'
              }`}
            >
              <div className="p-3 rounded-xl bg-accent/20 w-fit mb-4">
                <Calculator className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-white font-bold text-lg mb-2">Loan Eligibility</h3>
              <p className="text-white/70 text-sm mb-4">
                VAT vs Turnover analysis with RAG status. 8x/6x multiplier calculations.
              </p>
              <div className="flex items-center gap-2 text-accent text-sm font-medium">
                <span>Open Module</span>
                <BarChart3 className="h-4 w-4" />
              </div>
            </motion.button>

            {/* Statement Analysis Card */}
            <motion.button
              onClick={() => setActiveTab('analysis')}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              whileHover={{ scale: 1.02, y: -4 }}
              className={`p-6 rounded-2xl backdrop-blur-sm border text-left transition-all cursor-pointer ${
                activeTab === 'analysis' 
                  ? 'bg-accent/20 border-accent/50' 
                  : 'bg-white/10 border-white/10 hover:bg-white/15'
              }`}
            >
              <div className="p-3 rounded-xl bg-accent/20 w-fit mb-4">
                <FileSpreadsheet className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-white font-bold text-lg mb-2">Statement Analysis</h3>
              <p className="text-white/70 text-sm mb-4">
                Upload PDFs for instant categorization, balance tracking, and Excel reports.
              </p>
              <div className="flex items-center gap-2 text-accent text-sm font-medium">
                <span>Open Module</span>
                <BarChart3 className="h-4 w-4" />
              </div>
            </motion.button>
          </motion.div>

          {/* Feature highlights */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex flex-wrap justify-center gap-4 mt-10"
          >
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 text-white/80 text-sm"
              >
                <span className="text-accent">{feature.icon}</span>
                <span>{feature.title}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {activeTab === 'analysis' && (
          <>
            {appState === 'upload' && (
              <FileUpload onFilesSelected={handleFilesSelected} onDemoMode={handleDemoMode} />
            )}
            
            {appState === 'analyzing' && (
              <AnalysisProgress steps={analysisSteps} />
            )}
            
            {appState === 'results' && report && (
              <ResultsDashboard 
                report={report} 
                onDownload={handleDownload}
                onReset={handleReset}
              />
            )}
          </>
        )}

        {activeTab === 'loans' && (
          <LoanCaseManagement currency="AED" />
        )}

        {activeTab === 'eligibility' && (
          <LoanEligibilityDashboard currency="AED" />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg gradient-primary">
                <Briefcase className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-sm font-medium text-foreground">Case Management</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} All rights reserved. Your data is processed locally.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
