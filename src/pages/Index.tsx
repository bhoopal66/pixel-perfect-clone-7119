import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileSpreadsheet, Shield, Zap, BarChart3, Briefcase, Users, LogOut, User, FolderOpen, FileText, UserCog, Crown, Eye, ClipboardList, LayoutDashboard, Settings, FlaskConical } from 'lucide-react';
import { LoanCaseManagement } from '../components/LoanCaseManagement';
import { CaseList, CaseWorkflow } from '../components/case-workflow';
import { ThemeToggle } from '../components/ThemeToggle';
import { WelcomeModal } from '../components/WelcomeModal';
import { FileUploadWithPreview } from '../components/FileUploadWithPreview';
import { QuickAnalysisResults } from '../components/QuickAnalysisResults';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { useAuth } from '../hooks/useAuth';
import { Badge } from '../components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';
import type { ParsedStatementData } from '@/hooks/usePdfParsing';
const Index = () => {
  const navigate = useNavigate();
  const { user, canManageUsers, canManageAgents, userRole, hasAdminPrivileges, isSupervisor, signOut } = useAuth();

  // Role display configuration with access descriptions
  const roleConfig = {
    super_admin: { 
      label: 'Super Admin', 
      icon: Crown, 
      variant: 'default' as const, 
      className: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0',
      description: 'Full system access: Manage all users, agents, and settings. Can delete agents and assign any role.'
    },
    admin: { 
      label: 'Admin', 
      icon: Shield, 
      variant: 'default' as const, 
      className: 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground border-0',
      description: 'Administrative access: Manage users and agents. Cannot assign Super Admin role or delete agents.'
    },
    supervisor: { 
      label: 'Supervisor', 
      icon: Eye, 
      variant: 'secondary' as const, 
      className: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
      description: 'Agent oversight: View, edit, and activate/deactivate agents. Cannot access user management.'
    },
    coordinator: { 
      label: 'Coordinator', 
      icon: ClipboardList, 
      variant: 'outline' as const, 
      className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
      description: 'Case coordination: Access to cases and analysis tools. No administrative privileges.'
    },
    user: { 
      label: 'User', 
      icon: User, 
      variant: 'outline' as const, 
      className: '',
      description: 'Standard access: View and manage your own cases and loan applications.'
    }
  };

  const currentRoleConfig = roleConfig[userRole];
  const RoleIcon = currentRoleConfig.icon;

  const features = [
    { icon: <FileSpreadsheet className="h-6 w-6" />, title: 'PDF Parsing', desc: 'Extract data from statements' },
    { icon: <Zap className="h-6 w-6" />, title: 'Instant Analysis', desc: 'Process statements in seconds' },
    { icon: <BarChart3 className="h-6 w-6" />, title: 'Smart Eligibility', desc: 'Auto-calculate loan eligibility' },
    { icon: <Shield className="h-6 w-6" />, title: 'Secure Processing', desc: 'Your data stays private' },
  ];

  const [activeTab, setActiveTab] = useState<'cases' | 'loans' | 'analyze'>('cases');
  const [casesView, setCasesView] = useState<'list' | 'workflow'>('list');
  const [editingCaseId, setEditingCaseId] = useState<string | undefined>();
  const [quickAnalysisData, setQuickAnalysisData] = useState<ParsedStatementData | null>(null);
  const [quickAnalysisView, setQuickAnalysisView] = useState<'upload' | 'results'>('upload');

  const handleQuickAnalysisConfirmed = (data: ParsedStatementData) => {
    setQuickAnalysisData(data);
    setQuickAnalysisView('results');
  };

  const handleResetQuickAnalysis = () => {
    setQuickAnalysisData(null);
    setQuickAnalysisView('upload');
  };

  // Cases tab inline component
  const CasesTab = () => (
    casesView === 'list' ? (
      <CaseList 
        onNewCase={() => { setEditingCaseId(undefined); setCasesView('workflow'); }}
        onEditCase={(id) => { setEditingCaseId(id); setCasesView('workflow'); }}
      />
    ) : (
      <CaseWorkflow
        caseId={editingCaseId}
        onComplete={() => { setCasesView('list'); setEditingCaseId(undefined); }}
        onCancel={() => { setCasesView('list'); setEditingCaseId(undefined); }}
      />
    )
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Welcome Modal for First-Time Users */}
      <WelcomeModal onSelectModule={(module) => setActiveTab(module as 'cases' | 'loans')} />

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
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'cases' | 'loans' | 'analyze')}>
                <TabsList className="bg-muted/50">
                  <TabsTrigger value="cases" className="gap-2 text-xs sm:text-sm">
                    <FolderOpen className="h-4 w-4" />
                    <span className="hidden sm:inline">Cases</span>
                  </TabsTrigger>
                  <TabsTrigger value="analyze" className="gap-2 text-xs sm:text-sm">
                    <FileText className="h-4 w-4" />
                    <span className="hidden sm:inline">Quick Analyze</span>
                  </TabsTrigger>
                  <TabsTrigger value="loans" className="gap-2 text-xs sm:text-sm">
                    <Briefcase className="h-4 w-4" />
                    <span className="hidden sm:inline">Cash Loans</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/eligibility-engine')}
                className="gap-1.5 text-xs sm:text-sm"
              >
                <FlaskConical className="h-4 w-4" />
                <span className="hidden sm:inline">Eligibility Engine</span>
              </Button>
              
              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Role Badge with Tooltip */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant={currentRoleConfig.variant} className={`hidden sm:flex items-center gap-1.5 cursor-help ${currentRoleConfig.className}`}>
                      <RoleIcon className="h-3 w-3" />
                      {currentRoleConfig.label}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <p className="text-sm">{currentRoleConfig.description}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="rounded-full relative">
                    <Users className="h-4 w-4" />
                    {/* Mobile role indicator dot */}
                    <span className={`sm:hidden absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-background ${
                      userRole === 'super_admin' ? 'bg-amber-500' :
                      userRole === 'admin' ? 'bg-primary' :
                      userRole === 'supervisor' ? 'bg-blue-500' :
                      userRole === 'coordinator' ? 'bg-emerald-500' : 'bg-muted-foreground'
                    }`} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="px-2 py-1.5">
                    <div className="text-sm font-medium">{user?.email}</div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge variant={currentRoleConfig.variant} className={`mt-1 text-xs cursor-help ${currentRoleConfig.className}`}>
                            <RoleIcon className="h-3 w-3 mr-1" />
                            {currentRoleConfig.label}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="max-w-xs">
                          <p className="text-sm">{currentRoleConfig.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="h-4 w-4 mr-2" />
                    My Profile
                  </DropdownMenuItem>
                  {(isSupervisor || hasAdminPrivileges) && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate('/supervisor')}>
                        <LayoutDashboard className="h-4 w-4 mr-2" />
                        Supervisor Dashboard
                      </DropdownMenuItem>
                    </>
                  )}
                   {hasAdminPrivileges && (
                    <>
                      <DropdownMenuItem onClick={() => navigate('/admin')}>
                        <Settings className="h-4 w-4 mr-2" />
                        Admin Dashboard
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/lender-policy-admin')}>
                        <Cog className="h-4 w-4 mr-2" />
                        Lender Policy Admin
                      </DropdownMenuItem>
                    </>
                   )}
                  {canManageUsers && (
                    <DropdownMenuItem onClick={() => navigate('/admin/users')}>
                      <Shield className="h-4 w-4 mr-2" />
                      User Management
                    </DropdownMenuItem>
                  )}
                  {canManageAgents && (
                    <DropdownMenuItem onClick={() => navigate('/admin/agents')}>
                      <UserCog className="h-4 w-4 mr-2" />
                      Agent Management
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
            className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto"
          >
            {/* Unified Cases Card */}
            <motion.button
              onClick={() => setActiveTab('cases')}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25 }}
              whileHover={{ scale: 1.02, y: -4 }}
              className={`p-6 rounded-2xl backdrop-blur-sm border text-left transition-all cursor-pointer ${
                activeTab === 'cases' 
                  ? 'bg-accent/20 border-accent/50' 
                  : 'bg-white/10 border-white/10 hover:bg-white/15'
              }`}
            >
              <div className="p-3 rounded-xl bg-accent/20 w-fit mb-4">
                <FolderOpen className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-white font-bold text-lg mb-2">Case Management</h3>
              <p className="text-white/70 text-sm mb-4">
                Complete 3-step workflow: Create Case → Statement Analysis → Eligibility Check. 
                All data flows automatically between steps.
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-2 py-1 bg-white/10 rounded text-xs text-white/80">PDF Parsing</span>
                <span className="px-2 py-1 bg-white/10 rounded text-xs text-white/80">VAT Analysis</span>
                <span className="px-2 py-1 bg-white/10 rounded text-xs text-white/80">Eligibility</span>
              </div>
              <div className="flex items-center gap-2 text-accent text-sm font-medium">
                <span>Open Cases</span>
                <BarChart3 className="h-4 w-4" />
              </div>
            </motion.button>

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
                Compare RAK Bank & Wio Bank rates. Track applications with EMI calculations 
                from draft to disbursement.
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-2 py-1 bg-white/10 rounded text-xs text-white/80">EMI Calculator</span>
                <span className="px-2 py-1 bg-white/10 rounded text-xs text-white/80">Lender Compare</span>
                <span className="px-2 py-1 bg-white/10 rounded text-xs text-white/80">Documents</span>
              </div>
              <div className="flex items-center gap-2 text-accent text-sm font-medium">
                <span>Open Loans</span>
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
        {activeTab === 'loans' && (
          <LoanCaseManagement currency="AED" />
        )}

        {activeTab === 'cases' && (
          <CasesTab />
        )}

        {activeTab === 'analyze' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {quickAnalysisView === 'upload' ? (
              <FileUploadWithPreview
                onAnalysisConfirmed={handleQuickAnalysisConfirmed}
                onDemoMode={() => {
                  // Create demo data for testing
                  const demoData: ParsedStatementData = {
                    transactions: Array.from({ length: 150 }, (_, i) => ({
                      id: `txn-${i}`,
                      date: new Date(2024, Math.floor(i / 25), (i % 28) + 1).toISOString().split('T')[0],
                      description: ['SALARY TRANSFER', 'CASH DEPOSIT ATM', 'RENT PAYMENT', 'UTILITY BILL', 'ONLINE TRANSFER', 'CDM CASH DEPOSIT'][i % 6],
                      debit: i % 3 === 0 ? Math.random() * 5000 + 500 : 0,
                      credit: i % 3 !== 0 ? Math.random() * 15000 + 1000 : 0,
                      balance: 50000 + Math.random() * 20000,
                      category: ['income', 'transfer', 'expense', 'income', 'transfer', 'cash-deposit'][i % 6],
                      currency: 'AED'
                    })),
                    accountInfo: { accountName: 'Demo Company LLC', accountNumber: '1234567890', iban: 'AE123456789012345678901' },
                    balances: { opening: 45000, closing: 62000, average: 55000 },
                    totalCredits: 850000,
                    totalDebits: 620000,
                    netTurnover: 230000,
                    periodFrom: '2024-01-01',
                    periodTo: '2024-06-30'
                  };
                  handleQuickAnalysisConfirmed(demoData);
                }}
              />
            ) : quickAnalysisData ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Quick Analysis Results</h2>
                  <Button variant="outline" onClick={handleResetQuickAnalysis}>
                    Analyze Another Statement
                  </Button>
                </div>
                <QuickAnalysisResults data={quickAnalysisData} />
              </div>
            ) : null}
          </motion.div>
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
