
import { Shift } from '@/types/shift';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DollarSign, ClipboardList } from 'lucide-react';
import { formatDate, formatTime } from '@/utils/dateUtils';

interface CompletedShiftsTableProps {
  completedShifts: Shift[];
  onEditShift: (shift: Shift) => void;
}

export function CompletedShiftsTable({ completedShifts, onEditShift }: CompletedShiftsTableProps) {
  // Sort shifts by date in descending order (newest first)
  const sortedShifts = [...completedShifts].sort((a, b) => {
    const dateA = a.end_time ? new Date(a.end_time) : new Date(a.date);
    const dateB = b.end_time ? new Date(b.end_time) : new Date(b.date);
    return dateB.getTime() - dateA.getTime();
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Completed Shifts</CardTitle>
          <DollarSign className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        {sortedShifts.length === 0 ? (
          <div className="py-6 text-center text-muted-foreground">
            No completed shifts yet
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff</TableHead>
                <TableHead>Staff ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Times</TableHead>
                <TableHead>Pump</TableHead>
                <TableHead>Readings</TableHead>
                <TableHead>Cash Balance</TableHead>
                <TableHead>Card Sales</TableHead>
                <TableHead>UPI Sales</TableHead>
                <TableHead>Cash Sales</TableHead>
                <TableHead>Testing Fuel</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedShifts.map((shift) => {
                const totalVolume = (shift.closing_reading || 0) - shift.opening_reading;
                const testingFuel = shift.testing_fuel || 0;
                const actualSalesVolume = totalVolume - testingFuel;
                const totalSales = (shift.card_sales || 0) + (shift.upi_sales || 0) + (shift.cash_sales || 0);
                
                // Format the date using the end_time if available, otherwise use the date field
                const shiftDate = shift.end_time 
                  ? formatDate(shift.end_time) 
                  : formatDate(shift.date);
                
                return (
                  <TableRow key={shift.id}>
                    <TableCell className="font-medium">{shift.staff_name}</TableCell>
                    <TableCell>{shift.staff_numeric_id || 'N/A'}</TableCell>
                    <TableCell>{shiftDate}</TableCell>
                    <TableCell>{`${formatTime(shift.start_time)} - ${formatTime(shift.end_time)}`}</TableCell>
                    <TableCell>{shift.pump_id}</TableCell>
                    <TableCell>{shift.opening_reading} → {shift.closing_reading || 'N/A'}</TableCell>
                    <TableCell>₹{shift.starting_cash_balance} → ₹{shift.ending_cash_balance || 'N/A'}</TableCell>
                    <TableCell>₹{(shift.card_sales || 0).toLocaleString()}</TableCell>
                    <TableCell>₹{(shift.upi_sales || 0).toLocaleString()}</TableCell>
                    <TableCell>₹{(shift.cash_sales || 0).toLocaleString()}</TableCell>
                    <TableCell>{testingFuel > 0 ? `${testingFuel.toFixed(2)} L` : '-'}</TableCell>
                    <TableCell className="font-bold">₹{totalSales.toLocaleString()}</TableCell>
                    <TableCell>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-1"
                        onClick={() => onEditShift(shift)}
                      >
                        <ClipboardList size={14} />
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
