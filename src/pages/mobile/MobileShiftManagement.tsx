
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarClock, DollarSign, ArrowLeft, Plus, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { useShiftManagement } from '@/hooks/useShiftManagement';
import { CurrentShiftData, SelectedShiftData } from '@/types/shift';
import { NewEndShiftDialog } from '@/components/shift/NewEndShiftDialog';

const MobileShiftManagement = () => {
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
  const [newEndShiftDialogOpen, setNewEndShiftDialogOpen] = useState(false);
  const [selectedShiftData, setSelectedShiftData] = useState<SelectedShiftData | null>(null);

  const openEndShiftDialog = (shift: typeof shifts[0]) => {
    if (shift.status === 'active') {
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

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Link to="/">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Shift Management</h1>
        </div>
        <Button onClick={() => setFormOpen(true)} className="gap-1">
          <Plus className="h-4 w-4" />
          <span className="sr-only sm:not-sr-only">Start Shift</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading shifts...</span>
        </div>
      ) : (
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="active" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <CalendarClock className="mr-2 h-4 w-4" />
              Active Shifts
            </TabsTrigger>
            <TabsTrigger value="completed" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <DollarSign className="mr-2 h-4 w-4" />
              Completed
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="active">
            {activeShifts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No active shifts</p>
                <Button onClick={() => setFormOpen(true)} variant="outline" className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Start Shift
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {activeShifts.map((shift) => (
                  <Card key={shift.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-medium">{shift.staff_name}</h3>
                        <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 text-xs px-2 py-1 rounded-full">
                          Active
                        </span>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground mb-3">
                        <p>Pump: {shift.pump_id}</p>
                        <p>Started: {new Date(shift.start_time).toLocaleString()}</p>
                        <p>Opening: {shift.opening_reading.toLocaleString()} L</p>
                      </div>
                      <Button 
                        onClick={() => openEndShiftDialog(shift)} 
                        variant="secondary" 
                        className="w-full"
                      >
                        End Shift
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="completed">
            {completedShifts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No completed shifts found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {completedShifts.slice(0, 5).map((shift) => (
                  <Card key={shift.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-medium">{shift.staff_name}</h3>
                        <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 text-xs px-2 py-1 rounded-full">
                          Completed
                        </span>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>Pump: {shift.pump_id}</p>
                        <p>Date: {new Date(shift.start_time).toLocaleDateString()}</p>
                        <p>Sales: ₹{shift.total_sales ? shift.total_sales.toLocaleString() : 0}</p>
                        <p>Duration: {shift.duration || 'N/A'}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
      
      {/* Dialog for ending shifts */}
      {selectedShiftData && (
        <NewEndShiftDialog
          isOpen={newEndShiftDialogOpen}
          onClose={() => setNewEndShiftDialogOpen(false)}
          shiftData={selectedShiftData}
          onShiftEnded={fetchShifts}
        />
      )}
      
      {/* Dialog for creating new shifts - using the existing StartShiftForm */}
      {formOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Start New Shift</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label htmlFor="staff" className="block text-sm font-medium mb-1">Staff</label>
                  <select 
                    id="staff"
                    className="w-full p-2 border rounded"
                    value={newShift.staff_id}
                    onChange={(e) => setNewShift({...newShift, staff_id: e.target.value})}
                  >
                    <option value="">Select staff</option>
                    {staffList.map((staff) => (
                      <option key={staff.id} value={staff.id}>
                        {staff.name} (ID: {staff.staff_numeric_id || 'N/A'})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="pump" className="block text-sm font-medium mb-1">Pump</label>
                  <select 
                    id="pump"
                    className="w-full p-2 border rounded"
                    value={newShift.pump_id}
                    onChange={(e) => setNewShift({...newShift, pump_id: e.target.value})}
                  >
                    <option value="">Select pump</option>
                    <option value="P001">Pump 1 - Petrol</option>
                    <option value="P002">Pump 2 - Diesel</option>
                    <option value="P003">Pump 3 - Petrol Premium</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="opening" className="block text-sm font-medium mb-1">Opening Reading</label>
                  <input
                    id="opening"
                    type="number"
                    className="w-full p-2 border rounded"
                    value={newShift.opening_reading?.toString() || ''}
                    onChange={(e) => setNewShift({...newShift, opening_reading: parseFloat(e.target.value)})}
                  />
                </div>
                
                <div>
                  <label htmlFor="cash" className="block text-sm font-medium mb-1">Starting Cash</label>
                  <input
                    id="cash"
                    type="number"
                    className="w-full p-2 border rounded"
                    value={newShift.starting_cash_balance?.toString() || ''}
                    onChange={(e) => setNewShift({...newShift, starting_cash_balance: parseFloat(e.target.value)})}
                  />
                </div>
                
                <div className="flex gap-2 justify-end pt-2">
                  <Button variant="outline" onClick={() => setFormOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => {
                    handleAddShift();
                    setFormOpen(false);
                  }}>
                    Start Shift
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default MobileShiftManagement;
