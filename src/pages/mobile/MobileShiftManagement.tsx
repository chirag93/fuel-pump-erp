
import React, { useState } from 'react';
import { CalendarClock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StartShiftForm } from '@/components/shift/StartShiftForm';
import { useShiftManagement } from '@/hooks/useShiftManagement';
import { useToast } from '@/hooks/use-toast';
import { MobileActiveShifts } from '@/components/shift/MobileActiveShifts';
import { MobileHeader } from '@/components/mobile/MobileHeader';

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
        onEndShift={(shift) => {
          toast({
            title: "Feature in development",
            description: "End shift functionality is available on desktop version."
          });
        }} 
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
    </div>
  );
};

export default MobileShiftManagement;
