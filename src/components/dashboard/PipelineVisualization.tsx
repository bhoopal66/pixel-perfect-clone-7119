import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { PipelineMetrics } from '@/types/dashboard.types';
import { CASE_STATUS_LABELS, getCaseStatusColor } from '@/types/database.types';
import type { CaseStatus } from '@/types/database.types';

interface PipelineVisualizationProps {
  metrics: PipelineMetrics;
  previousMetrics?: PipelineMetrics;
  onStatusClick: (status: string) => void;
}

const statusFlow: { key: keyof PipelineMetrics; phase: 'intake' | 'processing' | 'decision' }[] = [
  { key: 'draft', phase: 'intake' },
  { key: 'in_process', phase: 'processing' },
  { key: 'additional_info_required', phase: 'processing' },
  { key: 'submitted_to_lender', phase: 'processing' },
  { key: 'approved', phase: 'decision' },
  { key: 'declined', phase: 'decision' },
  { key: 'on_hold', phase: 'processing' },
  { key: 'dropped', phase: 'decision' },
];

function TrendIndicator({ current, previous }: { current: number; previous?: number }) {
  if (previous === undefined) return null;
  
  const diff = current - previous;
  if (diff === 0) return <Minus className="h-3 w-3 text-muted-foreground" />;
  if (diff > 0) return <TrendingUp className="h-3 w-3 text-success" />;
  return <TrendingDown className="h-3 w-3 text-destructive" />;
}

function StatusCard({ 
  status, 
  count, 
  previousCount,
  onClick,
  isActive
}: { 
  status: keyof PipelineMetrics; 
  count: number; 
  previousCount?: number;
  onClick: () => void;
  isActive?: boolean;
}) {
  const colorClass = getCaseStatusColor(status as CaseStatus);
  const label = CASE_STATUS_LABELS[status as CaseStatus] || status;

  return (
    <motion.div 
      whileHover={{ scale: 1.02, y: -2 }} 
      whileTap={{ scale: 0.98 }}
      className="cursor-pointer"
      onClick={onClick}
    >
      <Card className={`transition-all ${isActive ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}>
        <CardContent className="p-4">
          <div className={`inline-flex px-2 py-1 rounded-md text-xs font-medium mb-2 ${colorClass}`}>
            {label}
          </div>
          <div className="flex items-center justify-between">
            <p className="text-3xl font-bold">{count}</p>
            <TrendIndicator current={count} previous={previousCount} />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function PipelineVisualization({ metrics, previousMetrics, onStatusClick }: PipelineVisualizationProps) {
  const intakeStatuses = statusFlow.filter(s => s.phase === 'intake');
  const processingStatuses = statusFlow.filter(s => s.phase === 'processing');
  const decisionStatuses = statusFlow.filter(s => s.phase === 'decision');

  const getPhaseTotal = (phase: 'intake' | 'processing' | 'decision') => {
    return statusFlow
      .filter(s => s.phase === phase)
      .reduce((sum, s) => sum + (metrics[s.key] || 0), 0);
  };

  return (
    <div className="space-y-6">
      {/* Phase Overview */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-muted/30">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Intake</p>
            <p className="text-2xl font-bold">{getPhaseTotal('intake')}</p>
          </CardContent>
        </Card>
        <Card className="bg-primary/10 border-primary/30">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Processing</p>
            <p className="text-2xl font-bold text-primary">{getPhaseTotal('processing')}</p>
          </CardContent>
        </Card>
        <Card className="bg-muted/30">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Decision</p>
            <p className="text-2xl font-bold">{getPhaseTotal('decision')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Visual Pipeline */}
      <div className="relative">
        {/* Intake Phase */}
        <div className="mb-6">
          <Badge variant="secondary" className="mb-3">Intake Phase</Badge>
          <div className="grid grid-cols-1 gap-3">
            {intakeStatuses.map(({ key }) => (
              <StatusCard
                key={key}
                status={key}
                count={metrics[key] || 0}
                previousCount={previousMetrics?.[key]}
                onClick={() => onStatusClick(key)}
              />
            ))}
          </div>
        </div>

        {/* Arrow */}
        <div className="flex justify-center my-4">
          <ArrowRight className="h-6 w-6 text-muted-foreground rotate-90" />
        </div>

        {/* Processing Phase */}
        <div className="mb-6">
          <Badge variant="secondary" className="mb-3">Processing Phase</Badge>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {processingStatuses.map(({ key }) => (
              <StatusCard
                key={key}
                status={key}
                count={metrics[key] || 0}
                previousCount={previousMetrics?.[key]}
                onClick={() => onStatusClick(key)}
              />
            ))}
          </div>
        </div>

        {/* Arrow */}
        <div className="flex justify-center my-4">
          <ArrowRight className="h-6 w-6 text-muted-foreground rotate-90" />
        </div>

        {/* Decision Phase */}
        <div>
          <Badge variant="secondary" className="mb-3">Decision Phase</Badge>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {decisionStatuses.map(({ key }) => (
              <StatusCard
                key={key}
                status={key}
                count={metrics[key] || 0}
                previousCount={previousMetrics?.[key]}
                onClick={() => onStatusClick(key)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
