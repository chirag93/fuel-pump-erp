
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';

interface DateRangeSelectorProps {
  dateRange: DateRange;
  setDateRange: (dateRange: DateRange) => void;
  resetDateRange: () => void;
}

const DateRangeSelector = ({
  dateRange,
  setDateRange,
  resetDateRange
}: DateRangeSelectorProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-1">
          <CalendarIcon className="h-4 w-4" />
          {dateRange.from ? (
            dateRange.to ? (
              <>
                {format(dateRange.from, "MMM d, yyyy")} - {format(dateRange.to, "MMM d, yyyy")}
              </>
            ) : (
              format(dateRange.from, "MMM d, yyyy")
            )
          ) : (
            "Date Range"
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <Calendar
          initialFocus
          mode="range"
          defaultMonth={dateRange.from}
          selected={dateRange}
          onSelect={setDateRange}
          numberOfMonths={2}
          className={cn("p-3 pointer-events-auto")}
        />
        <div className="p-3 border-t border-border flex justify-between">
          <Button variant="ghost" onClick={resetDateRange} size="sm">Reset</Button>
          <Button size="sm" onClick={() => {}}>Apply</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default DateRangeSelector;
