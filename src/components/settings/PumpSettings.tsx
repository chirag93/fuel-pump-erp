
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Edit, Plus, Settings } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from '@/components/ui/use-toast';
import { FuelSettings } from './FuelTypeSettings';

interface PumpSettings {
  id: string;
  pump_number: string;
  nozzle_count: number;
  fuel_types: string[];
  created_at?: string;
}

export function PumpSettings() {
  const [pumpSettings, setPumpSettings] = useState<PumpSettings[]>([]);
  const [fuelSettings, setFuelSettings] = useState<FuelSettings[]>([]);
  const [isAddPumpDialogOpen, setIsAddPumpDialogOpen] = useState(false);
  const [newPump, setNewPump] = useState<Partial<PumpSettings>>({
    pump_number: '',
    nozzle_count: 1,
    fuel_types: []
  });

  useEffect(() => {
    fetchPumpSettings();
    fetchFuelSettings();
  }, []);

  const fetchPumpSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('pump_settings')
        .select('*');
        
      if (error) throw error;
      
      if (data) {
        setPumpSettings(data as PumpSettings[]);
      }
    } catch (error) {
      console.error('Error fetching pump settings:', error);
      toast({
        title: "Error",
        description: "Failed to load pump settings. Please try again.",
        variant: "destructive"
      });
    }
  };

  const fetchFuelSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('fuel_settings')
        .select('*');
        
      if (error) throw error;
      
      if (data) {
        setFuelSettings(data as FuelSettings[]);
      }
    } catch (error) {
      console.error('Error fetching fuel settings:', error);
    }
  };

  const handleAddPump = async () => {
    try {
      if (!newPump.pump_number || !newPump.nozzle_count) {
        toast({
          title: "Missing information",
          description: "Please fill all required fields",
          variant: "destructive"
        });
        return;
      }
      
      const { data, error } = await supabase
        .from('pump_settings')
        .insert([{
          pump_number: newPump.pump_number,
          nozzle_count: newPump.nozzle_count,
          fuel_types: newPump.fuel_types || []
        }])
        .select();
        
      if (error) throw error;
      
      if (data) {
        setPumpSettings([...pumpSettings, data[0] as PumpSettings]);
        setIsAddPumpDialogOpen(false);
        setNewPump({
          pump_number: '',
          nozzle_count: 1,
          fuel_types: []
        });
        
        toast({
          title: "Success",
          description: "Pump added successfully"
        });
      }
    } catch (error) {
      console.error('Error adding pump:', error);
      toast({
        title: "Error",
        description: "Failed to add pump. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Pump Configuration</h2>
        <Dialog open={isAddPumpDialogOpen} onOpenChange={setIsAddPumpDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Pump
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Pump</DialogTitle>
              <DialogDescription>
                Configure a new fuel pump for your station
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="pump_number">Pump Number</Label>
                <Input 
                  id="pump_number" 
                  placeholder="e.g. P001, P002"
                  value={newPump.pump_number}
                  onChange={e => setNewPump({...newPump, pump_number: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="nozzle_count">Number of Nozzles</Label>
                <Input 
                  id="nozzle_count" 
                  type="number"
                  min="1"
                  max="4"
                  value={newPump.nozzle_count?.toString()}
                  onChange={e => setNewPump({...newPump, nozzle_count: parseInt(e.target.value)})}
                />
              </div>
              <div className="grid gap-2">
                <Label>Available Fuel Types</Label>
                <div className="flex flex-wrap gap-2 pt-2">
                  {fuelSettings.map(fuel => (
                    <Button
                      key={fuel.fuel_type}
                      variant={newPump.fuel_types?.includes(fuel.fuel_type) ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        const updatedFuelTypes = newPump.fuel_types || [];
                        if (updatedFuelTypes.includes(fuel.fuel_type)) {
                          setNewPump({
                            ...newPump, 
                            fuel_types: updatedFuelTypes.filter(f => f !== fuel.fuel_type)
                          });
                        } else {
                          setNewPump({
                            ...newPump,
                            fuel_types: [...updatedFuelTypes, fuel.fuel_type]
                          });
                        }
                      }}
                    >
                      {fuel.fuel_type}
                    </Button>
                  ))}
                </div>
                {fuelSettings.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No fuel types available. Add fuel types first.
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddPumpDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAddPump}>Add Pump</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <Card>
        <CardContent className="pt-6">
          {pumpSettings.length === 0 ? (
            <div className="py-8 text-center">
              <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No pumps configured yet</p>
              <Button 
                variant="outline" 
                className="mt-4" 
                onClick={() => setIsAddPumpDialogOpen(true)}
              >
                Add First Pump
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pump Number</TableHead>
                  <TableHead className="text-center">Nozzles</TableHead>
                  <TableHead>Fuel Types</TableHead>
                  <TableHead className="text-right">Created</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pumpSettings.map((pump) => (
                  <TableRow key={pump.id}>
                    <TableCell className="font-medium">{pump.pump_number}</TableCell>
                    <TableCell className="text-center">{pump.nozzle_count}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {pump.fuel_types?.map((fuel, index) => (
                          <span 
                            key={index}
                            className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary"
                          >
                            {fuel}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {pump.created_at 
                        ? new Date(pump.created_at).toLocaleDateString()
                        : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
