
import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarClock, DollarSign, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { CurrentShiftData, SelectedShiftData } from '@/types/shift';
import { useShiftManagement } from '@/hooks/useShiftManagement';
import { StartShiftForm } from '@/components/shift/StartShiftForm';
import { ShiftSummaryCards } from '@/components/shift/ShiftSummaryCards';
import { ActiveShiftsTable } from '@/components/shift/ActiveShiftsTable';
import { CompletedShiftsTable } from '@/components/shift/CompletedShiftsTable';
import EndShiftDialog from '@/components/shift/EndShiftDialog';
import { NewEndShiftDialog } from '@/components/shift/NewEndShiftDialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

const ShiftManagement = () => {
  const {
    staffList,
    activeShifts,
    isLoading,
    newShift,
    setNewShift,
    fetchShifts,
    handleAddShift,
    completedShifts,
    staffOnActiveShifts,
    error: shiftError
  } = useShiftManagement();

  const [formOpen, setFormOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const { toast } = useToast();

  // Dialog states
  const [endShiftDialogOpen, setEndShiftDialogOpen] = useState(false);
  const [newEndShiftDialogOpen, setNewEndShiftDialogOpen] = useState(false);
  const [currentShiftId, setCurrentShiftId] = useState<string>('');
  const [currentShiftData, setCurrentShiftData] = useState<CurrentShiftData>({
    staffId: '',
    pumpId: '',
    openingReading: 0
  });
  
  // For the NewEndShiftDialog
  const [selectedShiftData, setSelectedShiftData] = useState<SelectedShiftData | null>(null);

  // Force a refresh of shifts data when component mounts or when form is closed
  useEffect(() => {
    if (!formOpen && !endShiftDialogOpen && !newEndShiftDialogOpen) {
      console.log('Refresh shifts data - form/dialog closed or component mounted');
      fetchShifts();
    }
  }, [formOpen, endShiftDialogOpen, newEndShiftDialogOpen, fetchShifts]);

  const openEndShiftDialog = (shift: any) => {
    console.log('Opening end shift dialog for shift:', shift);
    
    // Use the original EndShiftDialog for editing completed shifts
    if (shift.status === 'completed') {
      setCurrentShiftId(shift.id);
      setCurrentShiftData({
        staffId: shift.staff_id,
        pumpId: shift.pump_id,
        openingReading: shift.opening_reading
      });
      setEndShiftDialogOpen(true);
    } else {
      // Use the new dialog for active shifts
      setSelectedShiftData({
        id: shift.id,
        staff_id: shift.staff_id,
        staff_name: shift.staff_name,
        pump_id: shift.pump_id || '',
        opening_reading: shift.opening_reading,
        shift_type: shift.shift_type,
        all_readings: shift.all_readings
      });
      setNewEndShiftDialogOpen(true);
    }
  };

  // Allow editing of completed shifts
  const editCompletedShift = (shift: any) => {
    setCurrentShiftId(shift.id);
    setCurrentShiftData({
      staffId: shift.staff_id,
      pumpId: shift.pump_id,
      openingReading: shift.opening_reading
    });
    setEndShiftDialogOpen(true);
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
    setNewEndShiftDialogOpen(false);
    setSelectedShiftData(null);
    // Add a small delay before fetching to ensure database is updated
    setTimeout(async () => {
      await fetchShifts();
    }, 500);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Shift Management</h1>
        <StartShiftForm
          formOpen={formOpen}
          setFormOpen={setFormOpen}
          newShift={newShift}
          setNewShift={setNewShift}
          handleAddShift={handleAddShiftWithErrorHandling}
          staffList={staffList}
          staffOnActiveShifts={staffOnActiveShifts}
        />
      </div>

      {(shiftError || localError) && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {shiftError || localError}
          </AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading shifts data...</span>
        </div>
      ) : (
        <>
          <ShiftSummaryCards activeShifts={activeShifts} completedShifts={completedShifts} />

          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="active" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <CalendarClock className="mr-2 h-4 w-4" />
                Active Shifts
              </TabsTrigger>
              <TabsTrigger value="completed" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <DollarSign className="mr-2 h-4 w-4" />
                Completed Shifts
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="active">
              {activeShifts.length === 0 ? (
                <div className="text-center py-12 border rounded-md bg-muted/20">
                  <CalendarClock className="h-12 w-12 text-muted mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-1">No Active Shifts</h3>
                  <p className="text-muted-foreground">
                    There are currently no active shifts. Use the "Start New Shift" button to begin a new shift.
                  </p>
                </div>
              ) : (
                <ActiveShiftsTable activeShifts={activeShifts} onEndShift={openEndShiftDialog} />
              )}
            </TabsContent>
            
            <TabsContent value="completed">
              {completedShifts.length === 0 ? (
                <div className="text-center py-12 border rounded-md bg-muted/20">
                  <DollarSign className="h-12 w-12 text-muted mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-1">No Completed Shifts</h3>
                  <p className="text-muted-foreground">
                    There are no completed shifts yet. Completed shifts will appear here after ending active shifts.
                  </p>
                </div>
              ) : (
                <CompletedShiftsTable completedShifts={completedShifts} onEditShift={editCompletedShift} />
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
      
      {/* EndShiftDialog for editing completed shifts */}
      <EndShiftDialog
        open={endShiftDialogOpen}
        onOpenChange={setEndShiftDialogOpen}
        shiftId={currentShiftId}
        staffId={currentShiftData.staffId}
        pumpId={currentShiftData.pumpId}
        openingReading={currentShiftData.openingReading}
        onComplete={fetchShifts}
      />
      
      {/* NewEndShiftDialog for ending active shifts */}
      {selectedShiftData && (
        <NewEndShiftDialog
          isOpen={newEndShiftDialogOpen}
          onClose={() => setNewEndShiftDialogOpen(false)}
          shiftData={selectedShiftData}
          onShiftEnded={handleShiftEnded}
        />
      )}
    </div>
  );
};

export default ShiftManagement;
