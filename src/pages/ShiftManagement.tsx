
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarClock, DollarSign, Loader2 } from 'lucide-react';
import { toast } from "@/components/ui/use-toast";
import { CurrentShiftData, SelectedShiftData } from '@/types/shift';
import { useShiftManagement } from '@/hooks/useShiftManagement';
import { StartShiftForm } from '@/components/shift/StartShiftForm';
import { ShiftSummaryCards } from '@/components/shift/ShiftSummaryCards';
import { ActiveShiftsTable } from '@/components/shift/ActiveShiftsTable';
import { CompletedShiftsTable } from '@/components/shift/CompletedShiftsTable';
import EndShiftDialog from '@/components/shift/EndShiftDialog';
import { NewEndShiftDialog } from '@/components/shift/NewEndShiftDialog';

const ShiftManagement = () => {
  const {
    shifts,
    staffList,
    isLoading,
    newShift,
    setNewShift,
    fetchShifts,
    handleAddShift,
    activeShifts,
    completedShifts
  } = useShiftManagement();

  const [formOpen, setFormOpen] = useState(false);

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

  const openEndShiftDialog = (shift: typeof shifts[0]) => {
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
        pump_id: shift.pump_id,
        opening_reading: shift.opening_reading,
        shift_type: shift.shift_type
      });
      setNewEndShiftDialogOpen(true);
    }
  };

  // Allow editing of completed shifts
  const editCompletedShift = (shift: typeof shifts[0]) => {
    setCurrentShiftId(shift.id);
    setCurrentShiftData({
      staffId: shift.staff_id,
      pumpId: shift.pump_id,
      openingReading: shift.opening_reading
    });
    setEndShiftDialogOpen(true);
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
          handleAddShift={handleAddShift}
          staffList={staffList}
        />
      </div>

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
              <ActiveShiftsTable activeShifts={activeShifts} onEndShift={openEndShiftDialog} />
            </TabsContent>
            
            <TabsContent value="completed">
              <CompletedShiftsTable completedShifts={completedShifts} onEditShift={editCompletedShift} />
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
          onShiftEnded={fetchShifts}
        />
      )}
    </div>
  );
};

export default ShiftManagement;
