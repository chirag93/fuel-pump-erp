import React, { useState, useEffect } from 'react';
import { CalendarClock, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StartShiftForm } from '@/components/shift/StartShiftForm';
import { useShiftManagement } from '@/hooks/useShiftManagement';
import { useToast } from '@/hooks/use-toast';
import { MobileActiveShifts } from '@/components/shift/MobileActiveShifts';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { NewEndShiftDialog } from '@/components/shift/NewEndShiftDialog';
import { DeleteShiftDialog } from '@/components/shift/DeleteShiftDialog';
import { SelectedShiftData } from '@/types/shift';
import { Alert, AlertDescription } from '@/components/ui/alert';

const MobileShiftManagement = () => {
  const {
    staffList,
    activeShifts,
    newShift,
    setNewShift,
    handleAddShift,
    handleDeleteShift,
    isLoading,
    isDeleting,
    fetchShifts,
    staffOnActiveShifts,
    error: shiftError
  } = useShiftManagement();
  
  const [formOpen, setFormOpen] = useState(false);
  const [endShiftDialogOpen, setEndShiftDialogOpen] = useState(false);
  const [deleteShiftDialogOpen, setDeleteShiftDialogOpen] = useState(false);
  const [selectedShiftData, setSelectedShiftData] = useState<SelectedShiftData | null>(null);
  const [currentShiftId, setCurrentShiftId] = useState<string>('');
  const [currentShiftName, setCurrentShiftName] = useState<string>('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  
  // Clear any local errors when data changes
  useEffect(() => {
    if (staffList && staffList.length > 0) {
      setLocalError(null);
    }
  }, [staffList]);
  
  // Force a refresh of shifts data when component mounts or when form is closed
  useEffect(() => {
    if (!formOpen && !endShiftDialogOpen && !deleteShiftDialogOpen) {
      console.log('Refresh shifts data - form closed or component mounted');
      fetchShifts().catch(err => {
        console.error('Error fetching shifts in MobileShiftManagement:', err);
        setLocalError('Failed to load shifts data. Please try again.');
      });
    }
  }, [formOpen, endShiftDialogOpen, deleteShiftDialogOpen, fetchShifts]);
  
  const handleOpenForm = () => {
    if (!staffList || staffList.length === 0) {
      toast({
        title: "No Staff Available",
        description: "There are no active staff members available to assign shifts.",
        variant: "destructive"
      });
      return;
    }
    
    // If all staff are on active shifts
    if (staffList.length > 0 && staffOnActiveShifts && staffList.every(staff => staffOnActiveShifts?.includes(staff.id))) {
      toast({
        title: "All Staff on Active Shifts",
        description: "All staff members are currently on active shifts. End an active shift before starting a new one.",
        variant: "destructive"
      });
      return;
    }
    
    setFormOpen(true);
  };
  
  const handleEndShift = (shift: any) => {
    if (!shift) {
      console.error('Cannot end shift: Shift data is undefined');
      toast({
        title: "Error",
        description: "Unable to end shift due to missing data.",
        variant: "destructive"
      });
      return;
    }
    
    setSelectedShiftData({
      id: shift.id,
      staff_id: shift.staff_id,
      staff_name: shift.staff_name || 'Unknown Staff',
      pump_id: shift.pump_id || '',
      opening_reading: shift.opening_reading || 0,
      shift_type: shift.shift_type || 'Day',
      all_readings: shift.all_readings || []
    });
    
    setEndShiftDialogOpen(true);
  };
  
  const handleDeleteShift = (shift: any) => {
    if (!shift) {
      console.error('Cannot delete shift: Shift data is undefined');
      toast({
        title: "Error",
        description: "Unable to delete shift due to missing data.",
        variant: "destructive"
      });
      return;
    }
    
    setCurrentShiftId(shift.id);
    setCurrentShiftName(shift.staff_name || 'Unknown Staff');
    setDeleteShiftDialogOpen(true);
  };
  
  // Custom function to handle shift adding with better error handling
  const handleAddShiftWithErrorHandling = async (selectedConsumables?: any[], nozzleReadings?: any[]) => {
    try {
      setIsProcessing(true);
      setLocalError(null);
      console.log('Starting a new shift with the following data:');
      console.log('Staff member:', staffList.find(s => s.id === newShift.staff_id)?.name);
      console.log('Pump ID:', newShift.pump_id);
      console.log('Nozzle readings:', nozzleReadings);
      
      const result = await handleAddShift(selectedConsumables, nozzleReadings);
      
      if (result) {
        toast({
          title: "Success",
          description: "New shift started successfully!",
        });
        // Close the form on success
        setFormOpen(false);
        // Ensure we refresh the shifts data after a successful add
        await fetchShifts();
        return true;
      } else {
        setLocalError("Failed to start shift. Please try again.");
        return false;
      }
    } catch (error) {
      console.error("Error in handleAddShiftWithErrorHandling:", error);
      setLocalError(error instanceof Error ? error.message : "Unknown error occurred");
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const handleShiftEnded = async () => {
    console.log('Shift ended, refreshing data...');
    setEndShiftDialogOpen(false);
    setSelectedShiftData(null);
    // Add a small delay before fetching to ensure database is updated
    setTimeout(async () => {
      try {
        await fetchShifts();
      } catch (error) {
        console.error("Error refreshing shifts after ending:", error);
        setLocalError("Failed to refresh shifts data. Please try manually refreshing the page.");
      }
    }, 500);
  };
  
  const handleDeleteShiftConfirmed = async () => {
    if (!currentShiftId) {
      console.error('Cannot delete shift: Shift ID is undefined');
      toast({
        title: "Error",
        description: "Unable to delete shift due to missing ID.",
        variant: "destructive"
      });
      return;
    }
    
    await handleDeleteShift(currentShiftId);
    setDeleteShiftDialogOpen(false);
  };
  
  return (
    <div className="container mx-auto py-4 px-3 flex flex-col min-h-screen">
      <MobileHeader title="Shift Management" />
      
      {(shiftError || localError) && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {shiftError || localError}
          </AlertDescription>
        </Alert>
      )}
      
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
              disabled={isLoading || isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                'Start New Shift'
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Active Shifts Section */}
      <MobileActiveShifts 
        activeShifts={activeShifts || []} 
        isLoading={isLoading} 
        onEndShift={handleEndShift}
        onDeleteShift={handleDeleteShift}
      />
      
      {/* StartShiftForm Modal */}
      <StartShiftForm
        formOpen={formOpen}
        setFormOpen={setFormOpen}
        newShift={newShift}
        setNewShift={setNewShift}
        handleAddShift={handleAddShiftWithErrorHandling}
        staffList={staffList || []}
        isMobile={true}
        staffOnActiveShifts={staffOnActiveShifts}
      />
      
      {/* End Shift Dialog */}
      {selectedShiftData && (
        <NewEndShiftDialog
          isOpen={endShiftDialogOpen}
          onClose={() => setEndShiftDialogOpen(false)}
          shiftData={selectedShiftData}
          onShiftEnded={handleShiftEnded}
        />
      )}
      
      {/* Delete Shift Dialog */}
      <DeleteShiftDialog
        isOpen={deleteShiftDialogOpen}
        onOpenChange={setDeleteShiftDialogOpen}
        shiftId={currentShiftId}
        staffName={currentShiftName}
        onConfirm={handleDeleteShiftConfirmed}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default MobileShiftManagement;
