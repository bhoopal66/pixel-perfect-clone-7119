import { ReactNode } from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface FormFieldProps {
  label: string;
  required?: boolean;
  helperText?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}

export function FormField({
  label,
  required = false,
  helperText,
  error,
  children,
  className
}: FormFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label className="text-sm font-medium flex items-center gap-1">
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {helperText && !error && (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      )}
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}
