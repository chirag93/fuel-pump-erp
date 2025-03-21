
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shift } from '@/types/shift';
import { isToday } from 'date-fns';

interface ShiftSummaryCardsProps {
  activeShifts: Shift[];
  completedShifts: Shift[];
}

export function ShiftSummaryCards({ activeShifts, completedShifts }: ShiftSummaryCardsProps) {
  // Filter to get only shifts completed today
  const todayCompletedShifts = completedShifts.filter(shift => {
    // Check if shift has an end_time and that it's today
    if (!shift.end_time) return false;
    
    // Parse date from end_time
    const endTime = new Date(shift.end_time);
    return isToday(endTime);
  });
  
  // Calculate total sales for today's completed shifts
  const totalSalesToday = todayCompletedShifts.reduce(
    (sum, shift) => sum + (shift.card_sales || 0) + (shift.upi_sales || 0) + (shift.cash_sales || 0), 
    0
  );

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl">Active Shifts</CardTitle>
          <CardDescription>Currently running shifts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold">{activeShifts.length}</div>
          <p className="text-sm text-muted-foreground">shifts in progress</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl">Today's Completed</CardTitle>
          <CardDescription>Shifts completed today</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold">
            {todayCompletedShifts.length}
          </div>
          <p className="text-sm text-muted-foreground">shifts completed today</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl">Total Sales Today</CardTitle>
          <CardDescription>Combined sales from all shifts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold">
            ₹{totalSalesToday.toLocaleString()}
          </div>
          <p className="text-sm text-muted-foreground">total sales amount</p>
        </CardContent>
      </Card>
    </div>
  );
}
