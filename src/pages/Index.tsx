import React from 'react';
import { useNavigateOnce } from '@/hooks/useNavigateOnce';
import { motion } from 'framer-motion';
import { Shield, Zap, Briefcase, Users, LogOut, User, UserCog, Crown, Eye, ClipboardList, LayoutDashboard, Settings, Cog, FlaskConical, FileText, ArrowRight, CheckCircle2, Building2 } from 'lucide-react';
import { ThemeToggle } from '../components/ThemeToggle';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { useAuth } from '../hooks/useAuth';
import { Badge } from '../components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';

const Index = () => {
  const navigate = useNavigateOnce();
  const { user, canManageUsers, canManageAgents, userRole, hasAdminPrivileges, isSupervisor, signOut } = useAuth();

  const roleConfig = {
    super_admin: { label: 'Super Admin', icon: Crown, variant: 'default' as const, className: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0', description: 'Full system access' },
    admin: { label: 'Admin', icon: Shield, variant: 'default' as const, className: 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground border-0', description: 'Administrative access' },
    supervisor: { label: 'Supervisor', icon: Eye, variant: 'secondary' as const, className: 'bg-blue-500/10 text-blue-600 border-blue-500/30', description: 'Agent oversight' },
    coordinator: { label: 'Coordinator', icon: ClipboardList, variant: 'outline' as const, className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30', description: 'Case coordination' },
    user: { label: 'User', icon: User, variant: 'outline' as const, className: '', description: 'Standard access' }
  };

  const currentRoleConfig = roleConfig[userRole];
  const RoleIcon = currentRoleConfig.icon;

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
                <h1 className="text-lg font-bold text-foreground">Loan Processing Platform</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">Client Onboarding & Eligibility</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <ThemeToggle />

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant={currentRoleConfig.variant} className={`hidden sm:flex items-center gap-1.5 cursor-help ${currentRoleConfig.className}`}>
                      <RoleIcon className="h-3 w-3" />
                      {currentRoleConfig.label}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent side="bottom"><p className="text-sm">{currentRoleConfig.description}</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="rounded-full relative">
                    <Users className="h-4 w-4" />
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
                    <Badge variant={currentRoleConfig.variant} className={`mt-1 text-xs ${currentRoleConfig.className}`}>
                      <RoleIcon className="h-3 w-3 mr-1" />
                      {currentRoleConfig.label}
                    </Badge>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="h-4 w-4 mr-2" />My Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/client-cases')}>
                    <FileText className="h-4 w-4 mr-2" />My Cases
                  </DropdownMenuItem>
                  {(isSupervisor || hasAdminPrivileges) && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate('/supervisor')}>
                        <LayoutDashboard className="h-4 w-4 mr-2" />Supervisor Dashboard
                      </DropdownMenuItem>
                    </>
                  )}
                  {hasAdminPrivileges && (
                    <>
                      <DropdownMenuItem onClick={() => navigate('/admin')}>
                        <Settings className="h-4 w-4 mr-2" />Admin Dashboard
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/lender-policy-admin')}>
                        <Cog className="h-4 w-4 mr-2" />Lender Policy Admin
                      </DropdownMenuItem>
                    </>
                  )}
                  {canManageUsers && (
                    <DropdownMenuItem onClick={() => navigate('/admin/users')}>
                      <Shield className="h-4 w-4 mr-2" />User Management
                    </DropdownMenuItem>
                  )}
                  {canManageAgents && (
                    <DropdownMenuItem onClick={() => navigate('/admin/agents')}>
                      <UserCog className="h-4 w-4 mr-2" />Agent Management
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()}>
                    <LogOut className="h-4 w-4 mr-2" />Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-95" />
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-accent/20 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white/90 text-sm font-medium mb-6 backdrop-blur-sm">
              <Zap className="h-4 w-4" />
              Streamlined Loan Processing
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
              Onboard Clients.<br />
              <span className="text-accent">Check Eligibility.</span>
            </h2>
            <p className="text-base md:text-lg text-white/80 max-w-2xl mx-auto mb-12">
              Two simple steps: Register your client through the onboarding wizard, 
              then run their eligibility across all lenders instantly.
            </p>
          </motion.div>

          {/* Two Primary Action Cards */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto"
          >
            {/* Step 1: Onboard Client */}
            <motion.div
              whileHover={{ scale: 1.02, y: -4 }}
              className="relative"
            >
              <div className="absolute -top-3 -left-3 z-10 w-10 h-10 rounded-full bg-accent flex items-center justify-center text-white font-bold text-lg shadow-lg">
                1
              </div>
              <Card className="h-full bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-all cursor-pointer overflow-hidden group"
                onClick={() => navigate('/onboarding')}
              >
                <CardContent className="p-8 text-left">
                  <div className="p-4 rounded-2xl bg-accent/20 w-fit mb-6">
                    <Building2 className="h-8 w-8 text-accent" />
                  </div>
                  <h3 className="text-white font-bold text-xl mb-3">Onboard Client</h3>
                  <p className="text-white/70 text-sm mb-6 leading-relaxed">
                    Register business details, owners, banking information, loan requirements, and upload documents — all in one guided wizard.
                  </p>
                  <div className="space-y-2 mb-6">
                    {['Business & Owner Details', 'Banking & Turnover Data', 'Loan Requirements & Documents'].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-white/80 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-accent shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-accent font-semibold group-hover:gap-3 transition-all">
                    <span>Start Onboarding</span>
                    <ArrowRight className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Step 2: Eligibility (auto after onboarding) */}
            <motion.div
              whileHover={{ scale: 1.02, y: -4 }}
              className="relative"
            >
              <div className="absolute -top-3 -left-3 z-10 w-10 h-10 rounded-full bg-accent/50 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                2
              </div>
              <Card className="h-full bg-white/5 backdrop-blur-sm border-white/10 overflow-hidden">
                <CardContent className="p-8 text-left">
                  <div className="p-4 rounded-2xl bg-accent/10 w-fit mb-6">
                    <FlaskConical className="h-8 w-8 text-accent/60" />
                  </div>
                  <h3 className="text-white/70 font-bold text-xl mb-3">Eligibility Engine</h3>
                  <p className="text-white/50 text-sm mb-6 leading-relaxed">
                    After onboarding, you'll be automatically redirected to run eligibility checks across all configured lenders.
                  </p>
                  <div className="space-y-2 mb-6">
                    {['Bank Statement & VAT Analysis', 'Multi-Lender Rule Engine', 'Best Match Recommendation'].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-white/50 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-accent/50 shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-white/40 font-medium text-sm">
                    <span>Runs automatically after onboarding</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* Flow indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="hidden md:flex items-center justify-center gap-3 mt-8 text-white/50 text-sm"
          >
            <span>Onboard</span>
            <ArrowRight className="h-4 w-4" />
            <span>Upload Documents</span>
            <ArrowRight className="h-4 w-4" />
            <span>Analyze</span>
            <ArrowRight className="h-4 w-4" />
            <span>Lender Match</span>
          </motion.div>

          {/* My Cases Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="mt-10"
          >
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate('/client-cases')}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white gap-2"
            >
              <FileText className="h-5 w-5" />
              View Existing Cases
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg gradient-primary">
                <Briefcase className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-sm font-medium text-foreground">Loan Processing Platform</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
