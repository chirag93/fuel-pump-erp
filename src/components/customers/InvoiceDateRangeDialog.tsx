
import React, { useState, useEffect } from 'react';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Customer } from '@/integrations/supabase/client';

interface InvoiceDateRangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (dateRange: DateRange) => void;
  customer: Customer;
  isGenerating: boolean;
}

const InvoiceDateRangeDialog = ({
  open,
  onOpenChange,
  onGenerate,
  customer,
  isGenerating
}: InvoiceDateRangeDialogProps) => {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: undefined,
    to: undefined,
  });
  
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [tempDateRange, setTempDateRange] = useState<DateRange>({
    from: undefined,
    to: undefined,
  });
  
  useEffect(() => {
    if (open) {
      // Reset date range when dialog opens
      setDateRange({
        from: undefined,
        to: undefined,
      });
      setTempDateRange({
        from: undefined,
        to: undefined,
      });
    }
  }, [open]);
  
  const handleCalendarSelect = (range: DateRange | undefined) => {
    if (range) {
      setTempDateRange(range);
    }
  };
  
  const handleCalendarDone = () => {
    setDateRange(tempDateRange);
    setIsCalendarOpen(false);
  };
  
  const handleGenerate = () => {
    onGenerate(dateRange);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Generate Invoice</DialogTitle>
          <DialogDescription>
            Select a date range for the invoice for {customer.name}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <div className="flex flex-col space-y-1.5">
              <h3 className="text-sm font-medium">Select Date Range</h3>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateRange.from && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "MMM d, yyyy")} -{" "}
                          {format(dateRange.to, "MMM d, yyyy")}
                        </>
                      ) : (
                        format(dateRange.from, "MMM d, yyyy")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div>
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={tempDateRange.from}
                      selected={tempDateRange}
                      onSelect={handleCalendarSelect}
                      numberOfMonths={2}
                      className={cn("p-3 pointer-events-auto")}
                    />
                    <div className="flex justify-end p-2 border-t">
                      <Button size="sm" onClick={handleCalendarDone}>Done</Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleGenerate} 
            disabled={!dateRange.from || !dateRange.to || isGenerating}
          >
            {isGenerating ? "Generating..." : "Generate Invoice"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceDateRangeDialog;
