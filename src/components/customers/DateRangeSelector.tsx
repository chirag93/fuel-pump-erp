
import { CalendarIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, subDays, startOfMonth } from 'date-fns';
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
  const hasDateRange = dateRange.from || dateRange.to;
  
  const setThisMonth = () => {
    const today = new Date();
    const firstDayOfMonth = startOfMonth(today);
    setDateRange({ from: firstDayOfMonth, to: today });
  };
  
  const setLast7Days = () => {
    const today = new Date();
    const last7Days = subDays(today, 7);
    setDateRange({ from: last7Days, to: today });
  };
  
  const setLast30Days = () => {
    const today = new Date();
    const last30Days = subDays(today, 30);
    setDateRange({ from: last30Days, to: today });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-1 whitespace-nowrap">
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
            dateRange.to ? (
              format(dateRange.to, "MMM d, yyyy")
            ) : (
              "Filter by Date"
            )
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <div className="p-2 flex flex-wrap gap-1">
          <Button variant="outline" size="sm" onClick={setLast7Days}>Last 7 Days</Button>
          <Button variant="outline" size="sm" onClick={setLast30Days}>Last 30 Days</Button>
          <Button variant="outline" size="sm" onClick={setThisMonth}>This Month</Button>
        </div>
        <Calendar
          initialFocus
          mode="range"
          defaultMonth={dateRange.from || new Date()}
          selected={dateRange}
          onSelect={setDateRange}
          numberOfMonths={2}
          className={cn("p-3 pointer-events-auto")}
        />
        <div className="p-3 border-t border-border flex justify-between">
          <Button 
            variant="ghost" 
            onClick={resetDateRange} 
            size="sm" 
            className="gap-1"
            disabled={!hasDateRange}
          >
            <X className="h-3 w-3" />
            Reset
          </Button>
          <Button size="sm">Apply</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default DateRangeSelector;
