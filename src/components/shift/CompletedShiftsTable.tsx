
import { useState } from 'react';
import { Shift } from '@/types/shift';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DollarSign, ClipboardList, Loader2, Trash2 } from 'lucide-react';
import { formatDate, formatTime } from '@/utils/dateUtils';
import { safeNumberFormat, formatMoney } from '@/utils/formatUtils';
import { useToast } from '@/hooks/use-toast';

interface CompletedShiftsTableProps {
  completedShifts: Shift[];
  onEditShift: (shift: Shift) => void;
  onDeleteShift: (shift: Shift) => void;
}

export function CompletedShiftsTable({ completedShifts, onEditShift, onDeleteShift }: CompletedShiftsTableProps) {
  const [processingShiftId, setProcessingShiftId] = useState<string | null>(null);
  const { toast } = useToast();

  // Sort shifts by date in descending order (newest first)
  const sortedShifts = [...completedShifts].sort((a, b) => {
    const dateA = a.end_time ? new Date(a.end_time) : new Date(a.date || Date.now());
    const dateB = b.end_time ? new Date(b.end_time) : new Date(b.date || Date.now());
    return dateB.getTime() - dateA.getTime();
  });

  // Function to safely render times with fallbacks
  const renderShiftTimes = (shift: Shift) => {
    const startTime = shift.start_time ? formatTime(shift.start_time) : 'N/A';
    const endTime = shift.end_time ? formatTime(shift.end_time) : 'N/A';
    return `${startTime} - ${endTime}`;
  };

  const handleEditClick = (shift: Shift) => {
    try {
      // Validate that the shift has necessary data
      if (!shift.id) {
        toast({
          title: "Error",
          description: "Cannot edit shift: Missing shift ID",
          variant: "destructive"
        });
        return;
      }

      console.log("Editing shift with data:", shift);
      setProcessingShiftId(shift.id);
      
      // Call the parent handler
      onEditShift(shift);
      
      // Reset processing state after a short delay
      setTimeout(() => {
        setProcessingShiftId(null);
      }, 500);
    } catch (error) {
      console.error("Error handling edit shift click:", error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
      setProcessingShiftId(null);
    }
  };

  const handleDeleteClick = (shift: Shift) => {
    try {
      // Validate that the shift has necessary data
      if (!shift.id) {
        toast({
          title: "Error",
          description: "Cannot delete shift: Missing shift ID",
          variant: "destructive"
        });
        return;
      }

      console.log("Deleting shift with data:", shift);
      setProcessingShiftId(shift.id);
      
      // Call the parent handler
      onDeleteShift(shift);
      
      // Reset processing state after a short delay
      setTimeout(() => {
        setProcessingShiftId(null);
      }, 500);
    } catch (error) {
      console.error("Error handling delete shift click:", error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
      setProcessingShiftId(null);
    }
  };

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
                // Calculate totals with null/undefined checks
                const openingReading = shift.opening_reading || 0;
                const closingReading = shift.closing_reading || 0;
                const totalVolume = closingReading - openingReading;
                const testingFuel = shift.testing_fuel || 0;
                const actualSalesVolume = totalVolume - testingFuel;
                
                // Sum sales from all payment methods with null/undefined checks
                const cardSales = shift.card_sales || 0;
                const upiSales = shift.upi_sales || 0;
                const cashSales = shift.cash_sales || 0;
                const totalSales = cardSales + upiSales + cashSales;
                
                // Format the date using the end_time if available, otherwise use the date field
                const shiftDate = shift.end_time 
                  ? formatDate(shift.end_time) 
                  : formatDate(shift.date || new Date().toISOString());
                
                const isProcessing = processingShiftId === shift.id;
                
                return (
                  <TableRow key={shift.id}>
                    <TableCell className="font-medium">{shift.staff_name || 'Unknown'}</TableCell>
                    <TableCell>{shift.staff_numeric_id || 'N/A'}</TableCell>
                    <TableCell>{shiftDate}</TableCell>
                    <TableCell>{renderShiftTimes(shift)}</TableCell>
                    <TableCell>{shift.pump_id || 'N/A'}</TableCell>
                    <TableCell>
                      {safeNumberFormat(openingReading)} → {safeNumberFormat(closingReading)}
                    </TableCell>
                    <TableCell>
                      {formatMoney(shift.starting_cash_balance || 0)} → {formatMoney(shift.ending_cash_balance || 0)}
                    </TableCell>
                    <TableCell>{formatMoney(cardSales)}</TableCell>
                    <TableCell>{formatMoney(upiSales)}</TableCell>
                    <TableCell>{formatMoney(cashSales)}</TableCell>
                    <TableCell>
                      {testingFuel > 0 ? `${testingFuel.toFixed(2)} L` : '-'}
                    </TableCell>
                    <TableCell className="font-bold">{formatMoney(totalSales)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="gap-1"
                          onClick={() => handleEditClick(shift)}
                          disabled={isProcessing}
                        >
                          {isProcessing ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <ClipboardList size={14} />
                          )}
                          Edit
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="gap-1 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => handleDeleteClick(shift)}
                          disabled={isProcessing}
                        >
                          <Trash2 size={14} />
                          Delete
                        </Button>
                      </div>
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
};
