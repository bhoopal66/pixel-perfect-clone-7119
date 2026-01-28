import React from 'react';
import { Loader2, CheckCircle, Circle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import type { AnalysisStep } from '../types/transaction.types';

interface AnalysisProgressProps {
  steps: AnalysisStep[];
}

export const AnalysisProgress: React.FC<AnalysisProgressProps> = ({ steps }) => {
  const completedCount = steps.filter(s => s.status === 'completed').length;
  const progress = (completedCount / steps.length) * 100;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-elevated p-8"
      >
        <div className="text-center mb-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary mb-4"
          >
            <Loader2 className="h-8 w-8 text-primary-foreground" />
          </motion.div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Analyzing Your Statements
          </h2>
          <p className="text-muted-foreground">
            Please wait while we process your bank statements...
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium text-foreground">{Math.round(progress)}%</span>
          </div>
          <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="h-full gradient-accent rounded-full"
            />
          </div>
        </div>
        
        {/* Steps */}
        <div className="space-y-4">
          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-center gap-4 p-4 rounded-xl transition-colors ${
                step.status === 'completed' 
                  ? 'bg-success-muted' 
                  : step.status === 'processing'
                  ? 'bg-accent/10'
                  : step.status === 'error'
                  ? 'bg-destructive/10'
                  : 'bg-muted/50'
              }`}
            >
              <div className="flex-shrink-0">
                {step.status === 'completed' ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500 }}
                  >
                    <CheckCircle className="h-6 w-6 text-success" />
                  </motion.div>
                ) : step.status === 'processing' ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Loader2 className="h-6 w-6 text-accent" />
                  </motion.div>
                ) : step.status === 'error' ? (
                  <AlertCircle className="h-6 w-6 text-destructive" />
                ) : (
                  <Circle className="h-6 w-6 text-muted-foreground/40" />
                )}
              </div>
              
              <div className="flex-1">
                <p className={`font-medium ${
                  step.status === 'completed' 
                    ? 'text-success' 
                    : step.status === 'processing'
                    ? 'text-accent'
                    : step.status === 'error'
                    ? 'text-destructive'
                    : 'text-muted-foreground'
                }`}>
                  {step.label}
                </p>
              </div>

              {step.status === 'processing' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-accent font-medium px-2 py-1 bg-accent/20 rounded-full"
                >
                  In Progress
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Estimated Time */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center"
        >
          <p className="text-sm text-muted-foreground">
            Estimated time remaining: <span className="font-medium">~{Math.max(1, 6 - completedCount) * 5}s</span>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};
