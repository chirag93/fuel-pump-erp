
import React from 'react';
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
import { Customer, Transaction } from '@/integrations/supabase/client';

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
  const [dateRange, setDateRange] = React.useState<DateRange>({
    from: undefined,
    to: undefined,
  });
  
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
              <Popover>
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
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                    className={cn("p-3 pointer-events-auto")}
                  />
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
