
import { Shift } from '@/types/shift';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { CalendarClock, ClipboardList } from 'lucide-react';

interface ActiveShiftsTableProps {
  activeShifts: Shift[];
  onEndShift: (shift: Shift) => void;
}

export function ActiveShiftsTable({ activeShifts, onEndShift }: ActiveShiftsTableProps) {
  const formatTime = (timeString?: string | null) => {
    if (!timeString) return 'N/A';
    try {
      return new Date(timeString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return timeString;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Active Shifts</CardTitle>
          <CalendarClock className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        {activeShifts.length === 0 ? (
          <div className="py-6 text-center text-muted-foreground">
            No active shifts at the moment
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff</TableHead>
                <TableHead>Pump</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Start Time</TableHead>
                <TableHead>Reading</TableHead>
                <TableHead>Starting Cash</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeShifts.map((shift) => {
                // Format the pump ID for display - display N/A if empty or null
                const pumpDisplay = shift.pump_id ? shift.pump_id : 'N/A';
                
                return (
                <TableRow key={shift.id}>
                  <TableCell className="font-medium">{shift.staff_name}</TableCell>
                  <TableCell>{pumpDisplay}</TableCell>
                  <TableCell>{shift.date}</TableCell>
                  <TableCell>{formatTime(shift.start_time)}</TableCell>
                  <TableCell>
                    {shift.all_readings && shift.all_readings.length > 0 
                      ? shift.all_readings.map(r => (
                          <div key={r.fuel_type} className="text-xs mb-1">
                            {r.fuel_type}: {r.opening_reading.toLocaleString()}
                          </div>
                        ))
                      : shift.opening_reading 
                        ? shift.opening_reading.toLocaleString()
                        : 'N/A'
                    }
                  </TableCell>
                  <TableCell>₹{shift.starting_cash_balance.toLocaleString()}</TableCell>
                  <TableCell>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-1"
                      onClick={() => onEndShift(shift)}
                    >
                      <ClipboardList size={14} />
                      End Shift
                    </Button>
                  </TableCell>
                </TableRow>
              )})}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
