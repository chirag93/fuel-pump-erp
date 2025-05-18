
import { Shift } from '@/types/shift';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DollarSign, ClipboardList } from 'lucide-react';
import { formatDate, formatTime } from '@/utils/dateUtils';
import { safeNumberFormat, formatMoney } from '@/utils/formatUtils';

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
                // Calculate totals
                const openingReading = shift.opening_reading || 0;
                const closingReading = shift.closing_reading || 0;
                const totalVolume = closingReading - openingReading;
                const testingFuel = shift.testing_fuel || 0;
                const actualSalesVolume = totalVolume - testingFuel;
                
                // Sum sales from all payment methods
                const cardSales = shift.card_sales || 0;
                const upiSales = shift.upi_sales || 0;
                const cashSales = shift.cash_sales || 0;
                const totalSales = cardSales + upiSales + cashSales;
                
                // Format the date using the end_time if available, otherwise use the date field
                const shiftDate = shift.end_time 
                  ? formatDate(shift.end_time) 
                  : formatDate(shift.date);
                
                return (
                  <TableRow key={shift.id}>
                    <TableCell className="font-medium">{shift.staff_name || 'Unknown'}</TableCell>
                    <TableCell>{shift.staff_numeric_id || 'N/A'}</TableCell>
                    <TableCell>{shiftDate}</TableCell>
                    <TableCell>{`${formatTime(shift.start_time)} - ${formatTime(shift.end_time)}`}</TableCell>
                    <TableCell>{shift.pump_id || 'N/A'}</TableCell>
                    <TableCell>
                      {safeNumberFormat(openingReading)} → {safeNumberFormat(closingReading)}
                    </TableCell>
                    <TableCell>
                      {formatMoney(shift.starting_cash_balance)} → {formatMoney(shift.ending_cash_balance)}
                    </TableCell>
                    <TableCell>{formatMoney(cardSales)}</TableCell>
                    <TableCell>{formatMoney(upiSales)}</TableCell>
                    <TableCell>{formatMoney(cashSales)}</TableCell>
                    <TableCell>
                      {testingFuel > 0 ? `${testingFuel.toFixed(2)} L` : '-'}
                    </TableCell>
                    <TableCell className="font-bold">{formatMoney(totalSales)}</TableCell>
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
