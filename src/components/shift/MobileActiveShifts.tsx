
import React from 'react';
import { Shift } from '@/types/shift';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarClock, Loader2, UserCheck, X, ClipboardCheck } from 'lucide-react';
import { formatDate, formatTime } from '@/utils/dateUtils';

interface MobileActiveShiftsProps {
  activeShifts: Shift[];
  isLoading: boolean;
  onEndShift: (shift: Shift) => void;
  onDeleteShift: (shift: Shift) => void;
}

export function MobileActiveShifts({ activeShifts, isLoading, onEndShift, onDeleteShift }: MobileActiveShiftsProps) {
  if (isLoading) {
    return (
      <Card className="mb-4">
        <CardContent className="py-6">
          <div className="flex justify-center items-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
            <span>Loading active shifts...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex items-center mb-2">
          <UserCheck className="h-5 w-5 text-primary mr-2" />
          <CardTitle>Active Shifts</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-2">
        {activeShifts.length === 0 ? (
          <div className="text-center py-4 border rounded-md bg-muted/20">
            <CalendarClock className="h-12 w-12 text-muted mx-auto mb-2" />
            <p className="text-muted-foreground">No active shifts</p>
          </div>
        ) : (
          activeShifts.map((shift) => (
            <div 
              key={shift.id}
              className="border rounded-lg p-4 bg-card"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-lg">{shift.staff_name}</span>
                <span className="text-sm text-muted-foreground">ID: {shift.staff_numeric_id || 'N/A'}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Date:</span>
                  <p>{formatDate(shift.start_time || new Date().toISOString())}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Started:</span>
                  <p>{formatTime(shift.start_time || new Date().toISOString())}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Pump ID:</span>
                  <p>{shift.pump_id || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Opening Reading:</span>
                  <p>{shift.opening_reading || 0}</p>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  onClick={() => onEndShift(shift)} 
                  className="flex-1"
                  variant="default"
                >
                  <ClipboardCheck className="mr-2 h-4 w-4" />
                  End Shift
                </Button>
                <Button 
                  onClick={() => onDeleteShift(shift)}
                  variant="outline"
                  className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
