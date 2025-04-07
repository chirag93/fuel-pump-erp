import React, { useState, useEffect } from 'react';
import { DateRange } from 'react-day-picker';
import { format, startOfMonth } from 'date-fns';
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
  // Initialize with the current month for better UX
  const today = new Date();
  const firstDayOfMonth = startOfMonth(today);
  
  const [dateRange, setDateRange] = useState<DateRange>({
    from: firstDayOfMonth,
    to: today,
  });
  
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [tempDateRange, setTempDateRange] = useState<DateRange>({
    from: firstDayOfMonth,
    to: today,
  });
  
  useEffect(() => {
    if (open) {
      // Set default date range to current month when dialog opens
      const today = new Date();
      const firstDayOfMonth = startOfMonth(today);
      
      const defaultRange = {
        from: firstDayOfMonth,
        to: today,
      };
      
      setDateRange(defaultRange);
      setTempDateRange(defaultRange);
    }
  }, [open]);
  
  const handleCalendarSelect = (range: DateRange | undefined) => {
    if (range) {
      setTempDateRange(range);
      // Don't close the popover automatically when selecting dates
    }
  };
  
  const handleCalendarDone = () => {
    // Save the selected date range
    setDateRange(tempDateRange);
    // Close the date picker popover but keep the main dialog open
    setIsCalendarOpen(false);
  };
  
  const handleGenerate = () => {
    if (!dateRange.from || !dateRange.to) {
      return; // Don't proceed if the date range is incomplete
    }
    
    // Pass the selected date range to the parent component
    onGenerate(dateRange);
    
    // Note: We deliberately don't close the dialog here
    // The parent component should handle closing the dialog after successful generation
    // or keep it open if there's an error
  };
  
  const setLastMonth = () => {
    const today = new Date();
    const lastMonth = new Date(today);
    lastMonth.setMonth(today.getMonth() - 1);
    const firstDayLastMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
    const lastDayLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    
    const range = {
      from: firstDayLastMonth,
      to: lastDayLastMonth,
    };
    
    setDateRange(range);
    setTempDateRange(range);
  };
  
  const setThisMonth = () => {
    const today = new Date();
    const firstDayThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const range = {
      from: firstDayThisMonth,
      to: today,
    };
    
    setDateRange(range);
    setTempDateRange(range);
  };
  
  return (
    <Dialog open={open} onOpenChange={isGenerating ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Generate Invoice</DialogTitle>
          <DialogDescription>
            Select a date range for the invoice for {customer.name}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <div className="flex gap-2 mb-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={setThisMonth}
                className="flex-1"
              >
                This Month
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={setLastMonth}
                className="flex-1"
              >
                Last Month
              </Button>
            </div>
            
            <div className="flex flex-col space-y-1.5">
              <h3 className="text-sm font-medium">Select Date Range</h3>
              <Popover 
                open={isCalendarOpen} 
                onOpenChange={setIsCalendarOpen}
              >
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
                      defaultMonth={dateRange.from || new Date()}
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
