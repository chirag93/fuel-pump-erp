
import { useState } from 'react';
import { Calendar, CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, subDays, startOfMonth } from 'date-fns';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';

interface DateRangeFilterProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  className?: string;
}

const DateRangeFilter = ({
  dateRange,
  onDateRangeChange,
  className
}: DateRangeFilterProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleDateRangeSelect = (range: DateRange) => {
    onDateRangeChange(range);
    if (range.from && range.to) {
      setIsOpen(false);
    }
  };

  const resetDateRange = () => {
    onDateRangeChange({
      from: startOfMonth(new Date()),
      to: new Date()
    });
    setIsOpen(false);
  };

  const setQuickDateRange = (days: number) => {
    const to = new Date();
    const from = subDays(to, days);
    onDateRangeChange({ from, to });
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className={cn("justify-start text-left font-normal", className)}>
          <CalendarIcon className="mr-2 h-4 w-4" />
          {dateRange.from ? (
            dateRange.to ? (
              <>
                {format(dateRange.from, "MMM d, yyyy")} - {format(dateRange.to, "MMM d, yyyy")}
              </>
            ) : (
              format(dateRange.from, "MMM d, yyyy")
            )
          ) : (
            <span>Pick a date range</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <div className="p-2 flex flex-wrap gap-1">
          <Button variant="outline" size="sm" onClick={() => setQuickDateRange(7)}>Week</Button>
          <Button variant="outline" size="sm" onClick={() => setQuickDateRange(30)}>Month</Button>
          <Button variant="outline" size="sm" onClick={resetDateRange}>MTD</Button>
          <Button variant="outline" size="sm" onClick={() => setQuickDateRange(90)}>Quarter</Button>
        </div>
        <CalendarComponent
          initialFocus
          mode="range"
          defaultMonth={dateRange.from}
          selected={dateRange}
          onSelect={handleDateRangeSelect}
          numberOfMonths={2}
          className={cn("p-3 pointer-events-auto")}
        />
      </PopoverContent>
    </Popover>
  );
};

export default DateRangeFilter;
