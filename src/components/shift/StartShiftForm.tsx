import { Dispatch, SetStateAction, useState, useEffect } from 'react';
import { Shift, Staff } from '@/types/shift';
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, AlertCircle, Loader2 } from 'lucide-react';
import { ConsumableSelection } from './ConsumableSelection';
import { supabase } from '@/integrations/supabase/client';
import { PumpSettingsType } from '@/integrations/fuelPumps';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getFuelPumpId } from '@/integrations/utils';

export interface StartShiftFormProps {
  formOpen: boolean;
  setFormOpen: Dispatch<SetStateAction<boolean>>;
  newShift: Partial<Shift>;
  setNewShift: Dispatch<SetStateAction<Partial<Shift>>>;
  handleAddShift: (selectedConsumables?: SelectedConsumable[], nozzleReadings?: NozzleReading[]) => Promise<boolean>;
  staffList: Staff[];
  isMobile?: boolean;
  staffOnActiveShifts?: string[];
}

export interface SelectedConsumable {
  id: string;
  name: string;
  quantity: number;
  available: number;
  price_per_unit: number;
  unit: string;
}

export interface NozzleReading {
  fuel_type: string;
  opening_reading: number;
}

export function StartShiftForm({ 
  formOpen, 
  setFormOpen, 
  newShift, 
  setNewShift, 
  handleAddShift,
  staffList,
  isMobile = false,
  staffOnActiveShifts = []
}: StartShiftFormProps) {
  const [selectedConsumables, setSelectedConsumables] = useState<SelectedConsumable[]>([]);
  const [pumpSettings, setPumpSettings] = useState<PumpSettingsType[]>([]);
  const [nozzleReadings, setNozzleReadings] = useState<NozzleReading[]>([]);
  const [selectedPumpFuelTypes, setSelectedPumpFuelTypes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { toast } = useToast();
  
  // Fetch pump settings when form opens
  useEffect(() => {
    if (formOpen) {
      fetchPumpSettings();
      // Reset form state when opening
      setSelectedConsumables([]);
      setNozzleReadings([]);
      setIsSubmitting(false);
    }
  }, [formOpen]);
  
  // Update nozzle readings when pump changes
  useEffect(() => {
    if (newShift.pump_id) {
      const selectedPump = pumpSettings.find(pump => pump.pump_number === newShift.pump_id);
      if (selectedPump) {
        setSelectedPumpFuelTypes(selectedPump.fuel_types || []);
        
        // Initialize nozzle readings for each fuel type in the selected pump
        const initialNozzleReadings = selectedPump.fuel_types.map(fuelType => ({
          fuel_type: fuelType,
          opening_reading: 0
        }));
        
        setNozzleReadings(initialNozzleReadings);
      } else {
        setSelectedPumpFuelTypes([]);
        setNozzleReadings([]);
      }
    }
  }, [newShift.pump_id, pumpSettings]);
  
  const fetchPumpSettings = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching pump settings...');
      
      const fuelPumpId = await getFuelPumpId();
      console.log('Fuel pump ID from getFuelPumpId:', fuelPumpId);
      
      if (!fuelPumpId) {
        console.warn('No fuel pump ID available, attempting to fetch all pump settings');
        const { data: allData, error: allError } = await supabase
          .from('pump_settings')
          .select('*');
          
        if (allError) {
          throw allError;
        }
        
        if (allData && allData.length > 0) {
          console.log(`Found ${allData.length} pump settings without filtering by fuel_pump_id`);
          setPumpSettings(allData as PumpSettingsType[]);
        } else {
          toast({
            title: "No Pump Settings",
            description: "Could not find any pump settings. Please contact your administrator.",
            variant: "destructive"
          });
        }
      } else {
        // Filter by fuel_pump_id when available
        const { data, error } = await supabase
          .from('pump_settings')
          .select('*')
          .eq('fuel_pump_id', fuelPumpId);
          
        if (error) {
          throw error;
        }
        
        if (data && data.length > 0) {
          console.log(`Found ${data.length} pump settings for fuel_pump_id: ${fuelPumpId}`);
          setPumpSettings(data as PumpSettingsType[]);
        } else {
          console.warn(`No pump settings found for fuel_pump_id: ${fuelPumpId}`);
          toast({
            title: "No Pump Settings",
            description: "No pump settings found for your fuel pump. Please contact your administrator.",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error('Error fetching pump settings:', error);
      toast({
        title: "Error",
        description: "Failed to fetch pump settings. Please check your connection and try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleNozzleReadingChange = (fuelType: string, value: string) => {
    setNozzleReadings(prev => 
      prev.map(reading => 
        reading.fuel_type === fuelType 
          ? { ...reading, opening_reading: parseFloat(value) || 0 } 
          : reading
      )
    );
  };

  // Filter out staff that are already on active shifts
  const availableStaff = staffList.filter(staff => !staffOnActiveShifts.includes(staff.id));

  // Check if the currently selected staff is on an active shift
  const isSelectedStaffOnActiveShift = newShift.staff_id && staffOnActiveShifts.includes(newShift.staff_id);

  // Clear staff selection if they're on an active shift
  useEffect(() => {
    if (isSelectedStaffOnActiveShift) {
      setNewShift(prev => ({ ...prev, staff_id: '' }));
      
      // Show a toast notification
      toast({
        title: "Staff unavailable",
        description: "The selected staff member is already on an active shift",
        variant: "destructive"
      });
    }
  }, [isSelectedStaffOnActiveShift, setNewShift, toast]);

  const onSubmit = async () => {
    // Check if we have at least one nozzle reading
    if (nozzleReadings.length === 0) {
      toast({
        title: "Missing readings",
        description: "Please select a pump with configured fuel types",
        variant: "destructive"
      });
      return;
    }
    
    // Check if all nozzle readings are filled
    const emptyReadings = nozzleReadings.filter(r => r.opening_reading === 0);
    if (emptyReadings.length > 0) {
      toast({
        title: "Missing readings",
        description: `Please enter opening readings for all nozzles`,
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      console.log('Starting shift with the following data:');
      console.log('Staff ID:', newShift.staff_id);
      console.log('Pump ID:', newShift.pump_id);
      console.log('Date:', newShift.date);
      console.log('Nozzle readings:', nozzleReadings);
      console.log('Consumables:', selectedConsumables);
      
      const success = await handleAddShift(selectedConsumables, nozzleReadings);
      if (success) {
        console.log('Shift started successfully');
        // Form will be closed by the parent component
      } else {
        console.error('Failed to start shift');
      }
    } catch (error) {
      console.error('Error starting shift:', error);
      toast({
        title: "Error",
        description: "Failed to start shift. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDialogChange = (open: boolean) => {
    // Only allow closing if not submitting
    if (!isSubmitting || !open) {
      setFormOpen(open);
      if (!open) {
        // Reset form state when closing
        setSelectedConsumables([]);
        setNozzleReadings([]);
      }
    }
  };

  return (
    <Dialog open={formOpen} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus size={16} />
          Start New Shift
        </Button>
      </DialogTrigger>
      <DialogContent className={isMobile ? "w-full max-w-full sm:max-w-lg mx-auto" : undefined}>
        <DialogHeader>
          <DialogTitle>Start New Shift</DialogTitle>
          <DialogDescription>
            Enter the details to start a new shift.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
            <span>Loading pump settings...</span>
          </div>
        ) : (
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="staffId">Staff</Label>
              {availableStaff.length === 0 ? (
                <Alert variant="destructive" className="mb-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    All staff members are currently on active shifts. End an active shift before starting a new one.
                  </AlertDescription>
                </Alert>
              ) : (
                <Select 
                  value={newShift.staff_id}
                  onValueChange={(value) => setNewShift({...newShift, staff_id: value})}
                >
                  <SelectTrigger id="staffId">
                    <SelectValue placeholder="Select staff" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableStaff.map((staff) => (
                      <SelectItem key={staff.id} value={staff.id}>
                        {staff.name} (ID: {staff.staff_numeric_id || 'N/A'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              
              {staffList.length > 0 && availableStaff.length < staffList.length && (
                <p className="text-xs text-amber-600 mt-1">
                  {staffList.length - availableStaff.length} staff member(s) are currently on active shifts and not available for selection.
                </p>
              )}
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="pumpId">Pump</Label>
              {pumpSettings.length === 0 ? (
                <Alert variant="destructive" className="mb-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No pump settings found. Please configure pumps first.
                  </AlertDescription>
                </Alert>
              ) : (
                <Select 
                  value={newShift.pump_id}
                  onValueChange={(value) => setNewShift({...newShift, pump_id: value})}
                >
                  <SelectTrigger id="pumpId">
                    <SelectValue placeholder="Select pump" />
                  </SelectTrigger>
                  <SelectContent>
                    {pumpSettings.map((pump) => (
                      <SelectItem key={pump.id} value={pump.pump_number}>
                        {pump.pump_number} - {pump.fuel_types.join(', ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={newShift.date}
                onChange={(e) => setNewShift({...newShift, date: e.target.value})}
              />
            </div>
            
            {selectedPumpFuelTypes.length > 0 && (
              <div className="border-t pt-4 mt-2">
                <Label className="mb-2 block">Opening Readings</Label>
                <div className="space-y-3">
                  {nozzleReadings.map((nozzle) => (
                    <div key={nozzle.fuel_type} className="grid grid-cols-2 gap-3 items-center">
                      <div className="text-sm font-medium">{nozzle.fuel_type}</div>
                      <Input
                        type="number"
                        placeholder="Enter reading"
                        value={nozzle.opening_reading || ''}
                        onChange={(e) => handleNozzleReadingChange(nozzle.fuel_type, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="grid gap-2">
              <Label htmlFor="cashGiven">Starting Cash Balance</Label>
              <Input
                id="cashGiven"
                type="number"
                value={newShift.starting_cash_balance?.toString() || '0'}
                onChange={(e) => setNewShift({...newShift, starting_cash_balance: parseFloat(e.target.value) || 0})}
              />
            </div>

            <div className="border-t pt-4 mt-4">
              <ConsumableSelection
                selectedConsumables={selectedConsumables}
                setSelectedConsumables={setSelectedConsumables}
                mode="allocate"
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleDialogChange(false)} disabled={isLoading || isSubmitting}>Cancel</Button>
          <Button 
            onClick={onSubmit} 
            disabled={!newShift.staff_id || !newShift.pump_id || availableStaff.length === 0 || isLoading || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Start Shift'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
