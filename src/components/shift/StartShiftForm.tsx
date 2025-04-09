
import { Dispatch, SetStateAction, useState, useEffect } from 'react';
import { Shift, Staff } from '@/types/shift';
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { ConsumableSelection } from './ConsumableSelection';
import { supabase } from '@/integrations/supabase/client';
import { PumpSettingsType } from '@/integrations/fuelPumps';
import { useToast } from '@/hooks/use-toast';

export interface StartShiftFormProps {
  formOpen: boolean;
  setFormOpen: Dispatch<SetStateAction<boolean>>;
  newShift: Partial<Shift>;
  setNewShift: Dispatch<SetStateAction<Partial<Shift>>>;
  handleAddShift: (selectedConsumables?: SelectedConsumable[], nozzleReadings?: NozzleReading[]) => Promise<boolean>;
  staffList: Staff[];
  isMobile?: boolean;
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
  isMobile = false
}: StartShiftFormProps) {
  const [selectedConsumables, setSelectedConsumables] = useState<SelectedConsumable[]>([]);
  const [pumpSettings, setPumpSettings] = useState<PumpSettingsType[]>([]);
  const [nozzleReadings, setNozzleReadings] = useState<NozzleReading[]>([]);
  const [selectedPumpFuelTypes, setSelectedPumpFuelTypes] = useState<string[]>([]);
  const { toast } = useToast();
  
  // Fetch pump settings when form opens
  useEffect(() => {
    if (formOpen) {
      fetchPumpSettings();
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
      const { data, error } = await supabase
        .from('pump_settings')
        .select('*');
        
      if (error) {
        throw error;
      }
      
      if (data) {
        setPumpSettings(data as PumpSettingsType[]);
      }
    } catch (error) {
      console.error('Error fetching pump settings:', error);
      toast({
        title: "Error",
        description: "Failed to fetch pump settings",
        variant: "destructive"
      });
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
    
    const success = await handleAddShift(selectedConsumables, nozzleReadings);
    if (success) {
      setFormOpen(false);
      setSelectedConsumables([]);
      setNozzleReadings([]);
    }
  };

  return (
    <Dialog open={formOpen} onOpenChange={(open) => {
      setFormOpen(open);
      if (!open) {
        setSelectedConsumables([]);
        setNozzleReadings([]);
      }
    }}>
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

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="staffId">Staff</Label>
            <Select 
              value={newShift.staff_id}
              onValueChange={(value) => setNewShift({...newShift, staff_id: value})}
            >
              <SelectTrigger id="staffId">
                <SelectValue placeholder="Select staff" />
              </SelectTrigger>
              <SelectContent>
                {staffList.map((staff) => (
                  <SelectItem key={staff.id} value={staff.id}>
                    {staff.name} (ID: {staff.staff_numeric_id || 'N/A'})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="pumpId">Pump</Label>
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
          
          {/* Nozzle Readings */}
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
              value={newShift.starting_cash_balance?.toString()}
              onChange={(e) => setNewShift({...newShift, starting_cash_balance: parseFloat(e.target.value)})}
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

        <DialogFooter>
          <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
          <Button onClick={onSubmit}>Start Shift</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
