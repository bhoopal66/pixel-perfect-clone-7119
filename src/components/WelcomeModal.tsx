import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Briefcase, Calculator, FileSpreadsheet, ArrowRight, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

const WELCOME_DISMISSED_KEY = 'welcome_modal_dismissed';

interface WelcomeModalProps {
  onSelectModule?: (module: 'analysis' | 'loans' | 'eligibility') => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ onSelectModule }) => {
  const [open, setOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const dismissed = localStorage.getItem(WELCOME_DISMISSED_KEY);
    if (!dismissed) {
      // Small delay to let the page render first
      const timer = setTimeout(() => setOpen(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(WELCOME_DISMISSED_KEY, 'true');
    setOpen(false);
  };

  const handleSelectModule = (module: 'analysis' | 'loans' | 'eligibility') => {
    handleDismiss();
    onSelectModule?.(module);
  };

  const modules = [
    {
      id: 'loans' as const,
      icon: Briefcase,
      title: 'Cash Loans',
      description: 'Track and manage loan applications from draft to disbursement.',
      features: [
        '8 lender options (RAK, Wio, Flapcap, CredibleX, etc.)',
        'Compare rates and EMIs side-by-side',
        'Cash & POS financing options',
        'Document tracking & status updates'
      ],
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    {
      id: 'eligibility' as const,
      icon: Calculator,
      title: 'Loan Eligibility',
      description: 'Calculate eligibility based on VAT returns and declared turnover.',
      features: [
        'VAT vs Declared Turnover analysis',
        'RAG status indicators (Red/Amber/Green)',
        '8x/6x multiplier calculations',
        'Cash & sister concern adjustments'
      ],
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10'
    },
    {
      id: 'analysis' as const,
      icon: FileSpreadsheet,
      title: 'Statement Analysis',
      description: 'Upload bank statements for instant categorization and analysis.',
      features: [
        'PDF statement parsing',
        'Auto-categorize transactions',
        'Balance tracking & validation',
        'Export to Excel with 7 worksheets'
      ],
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10'
    }
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-2xl p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="relative p-6 pb-4 bg-gradient-to-br from-primary/10 via-accent/5 to-background">
          <div className="absolute top-4 right-4">
            <Button variant="ghost" size="icon" onClick={handleDismiss} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-primary/20">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <DialogTitle className="text-xl">Welcome to Case Management</DialogTitle>
            </div>
            <p className="text-sm text-muted-foreground">
              Your complete loan processing suite. Here's what you can do:
            </p>
          </DialogHeader>
        </div>

        {/* Modules Grid */}
        <div className="p-6 pt-4 space-y-4">
          {modules.map((module, index) => {
            const Icon = module.icon;
            const isActive = activeStep === index;
            
            return (
              <motion.div
                key={module.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                onMouseEnter={() => setActiveStep(index)}
                onClick={() => handleSelectModule(module.id)}
                className={cn(
                  "relative p-4 rounded-xl border-2 cursor-pointer transition-all",
                  isActive 
                    ? "border-primary/50 bg-primary/5 shadow-md" 
                    : "border-transparent bg-muted/30 hover:bg-muted/50"
                )}
              >
                <div className="flex items-start gap-4">
                  <div className={cn("p-3 rounded-xl", module.bgColor)}>
                    <Icon className={cn("h-6 w-6", module.color)} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-foreground">{module.title}</h3>
                      <ArrowRight className={cn(
                        "h-4 w-4 transition-transform",
                        isActive ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0"
                      )} />
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{module.description}</p>
                    
                    <AnimatePresence>
                      {isActive && (
                        <motion.ul
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground mt-3"
                        >
                          {module.features.map((feature, i) => (
                            <motion.li
                              key={i}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: i * 0.05 }}
                              className="flex items-center gap-1.5"
                            >
                              <span className={cn("h-1.5 w-1.5 rounded-full", module.bgColor, module.color.replace('text-', 'bg-'))} />
                              {feature}
                            </motion.li>
                          ))}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 pt-0 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Click any module to get started
          </p>
          <Button variant="outline" size="sm" onClick={handleDismiss}>
            Skip Introduction
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
