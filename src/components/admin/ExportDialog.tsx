import React, { useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';

export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface ExportDialogProps {
  onExport: (dateRange: DateRange) => Promise<void>;
  title?: string;
  description?: string;
  trigger?: React.ReactNode;
}

export function ExportDialog({ 
  onExport, 
  title = 'Export Dashboard Data',
  description = 'Select a date range to export historical data. Leave empty to export all data.',
  trigger
}: ExportDialogProps) {
  const [open, setOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: undefined,
    to: undefined
  });

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await onExport(dateRange);
      setOpen(false);
      setDateRange({ from: undefined, to: undefined });
    } finally {
      setIsExporting(false);
    }
  };

  const handleClearDates = () => {
    setDateRange({ from: undefined, to: undefined });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Date Range</Label>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "flex-1 justify-start text-left font-normal",
                      !dateRange.from && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? format(dateRange.from, "PPP") : "From date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateRange.from}
                    onSelect={(date) => setDateRange(prev => ({ ...prev, from: date }))}
                    disabled={(date) => date > new Date() || (dateRange.to ? date > dateRange.to : false)}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "flex-1 justify-start text-left font-normal",
                      !dateRange.to && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.to ? format(dateRange.to, "PPP") : "To date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateRange.to}
                    onSelect={(date) => setDateRange(prev => ({ ...prev, to: date }))}
                    disabled={(date) => date > new Date() || (dateRange.from ? date < dateRange.from : false)}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            {(dateRange.from || dateRange.to) && (
              <Button variant="ghost" size="sm" onClick={handleClearDates} className="w-fit">
                Clear dates
              </Button>
            )}
          </div>
          
          <div className="text-sm text-muted-foreground">
            {dateRange.from && dateRange.to ? (
              <p>
                Exporting data from <strong>{format(dateRange.from, "PP")}</strong> to <strong>{format(dateRange.to, "PP")}</strong>
              </p>
            ) : dateRange.from ? (
              <p>
                Exporting data from <strong>{format(dateRange.from, "PP")}</strong> onwards
              </p>
            ) : dateRange.to ? (
              <p>
                Exporting data up to <strong>{format(dateRange.to, "PP")}</strong>
              </p>
            ) : (
              <p>Exporting all available data</p>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? 'Exporting...' : 'Export to Excel'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
