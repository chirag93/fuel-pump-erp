
import React from 'react';
import { CalendarClock, ClipboardList, Loader2 } from 'lucide-react';
import { Shift } from '@/types/shift';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MobileActiveShiftsProps {
  activeShifts: Shift[];
  isLoading: boolean;
  onEndShift: (shift: Shift) => void;
}

export function MobileActiveShifts({ activeShifts, isLoading, onEndShift }: MobileActiveShiftsProps) {
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
          <CardTitle className="text-lg">Active Shifts</CardTitle>
          <CalendarClock className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
            <span>Loading shifts...</span>
          </div>
        ) : activeShifts.length === 0 ? (
          <div className="py-6 text-center text-muted-foreground">
            No active shifts at the moment
          </div>
        ) : (
          <div className="space-y-4">
            {activeShifts.map((shift) => (
              <Card key={shift.id} className="bg-muted/40">
                <CardContent className="p-4">
                  <div className="grid gap-2">
                    <div className="flex justify-between">
                      <span className="font-medium">{shift.staff_name}</span>
                      <span className="text-sm text-muted-foreground">{shift.date}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Pump:</span> {shift.pump_id}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Start:</span> {formatTime(shift.start_time)}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Reading:</span> {shift.opening_reading.toLocaleString()}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Cash:</span> ₹{shift.starting_cash_balance.toLocaleString()}
                      </div>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2 w-full flex items-center justify-center"
                      onClick={() => onEndShift(shift)}
                    >
                      <ClipboardList size={14} className="mr-2" />
                      End Shift
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
