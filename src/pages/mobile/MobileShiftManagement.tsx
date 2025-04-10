
import React, { useState } from 'react';
import { CalendarClock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StartShiftForm } from '@/components/shift/StartShiftForm';
import { useShiftManagement } from '@/hooks/useShiftManagement';
import { useToast } from '@/hooks/use-toast';
import { MobileActiveShifts } from '@/components/shift/MobileActiveShifts';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { NewEndShiftDialog } from '@/components/shift/NewEndShiftDialog';
import { SelectedShiftData } from '@/types/shift';

const MobileShiftManagement = () => {
  const {
    staffList,
    activeShifts,
    newShift,
    setNewShift,
    handleAddShift,
    isLoading,
    fetchShifts
  } = useShiftManagement();
  
  const [formOpen, setFormOpen] = useState(false);
  const [endShiftDialogOpen, setEndShiftDialogOpen] = useState(false);
  const [selectedShiftData, setSelectedShiftData] = useState<SelectedShiftData | null>(null);
  const { toast } = useToast();
  
  const handleOpenForm = () => {
    if (staffList.length === 0) {
      toast({
        title: "No Staff Available",
        description: "There are no active staff members available to assign shifts.",
        variant: "destructive"
      });
      return;
    }
    setFormOpen(true);
  };
  
  const handleEndShift = (shift: any) => {
    setSelectedShiftData({
      id: shift.id,
      staff_id: shift.staff_id,
      staff_name: shift.staff_name,
      pump_id: shift.pump_id || '',
      opening_reading: shift.opening_reading,
      shift_type: shift.shift_type,
      all_readings: shift.all_readings
    });
    setEndShiftDialogOpen(true);
  };
  
  return (
    <div className="container mx-auto py-4 px-3 flex flex-col min-h-screen">
      <MobileHeader title="Shift Management" />
      
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <div className="flex items-center mb-2">
            <CalendarClock className="h-5 w-5 text-primary mr-2" />
            <CardTitle>Start New Shift</CardTitle>
          </div>
          <CardDescription>
            Record shift details including staff, pump readings, and opening cash amount.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
              <span>Loading staff data...</span>
            </div>
          ) : (
            <Button 
              onClick={handleOpenForm} 
              className="w-full"
              variant="default"
              size="lg"
              disabled={isLoading}
            >
              Start New Shift
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Active Shifts Section */}
      <MobileActiveShifts 
        activeShifts={activeShifts} 
        isLoading={isLoading} 
        onEndShift={handleEndShift}
      />
      
      {/* StartShiftForm Modal */}
      <StartShiftForm
        formOpen={formOpen}
        setFormOpen={setFormOpen}
        newShift={newShift}
        setNewShift={setNewShift}
        handleAddShift={handleAddShift}
        staffList={staffList}
        isMobile={true}
      />
      
      {/* End Shift Dialog */}
      {selectedShiftData && (
        <NewEndShiftDialog
          isOpen={endShiftDialogOpen}
          onClose={() => setEndShiftDialogOpen(false)}
          shiftData={selectedShiftData}
          onShiftEnded={fetchShifts}
        />
      )}
    </div>
  );
};

export default MobileShiftManagement;
