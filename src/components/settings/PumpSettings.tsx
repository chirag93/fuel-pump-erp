
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
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Edit, Plus, Settings, Trash2 } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from '@/hooks/use-toast';
import { FuelSettings } from './FuelTypeSettings';
import { getFuelPumpId } from '@/integrations/utils';

interface PumpSettings {
  id: string;
  pump_number: string;
  nozzle_count: number;
  fuel_types: string[];
  created_at?: string;
  fuel_pump_id?: string;
}

export function PumpSettings() {
  const [pumpSettings, setPumpSettings] = useState<PumpSettings[]>([]);
  const [fuelSettings, setFuelSettings] = useState<FuelSettings[]>([]);
  const [isAddPumpDialogOpen, setIsAddPumpDialogOpen] = useState(false);
  const [isEditPumpDialogOpen, setIsEditPumpDialogOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [pumpToDelete, setPumpToDelete] = useState<PumpSettings | null>(null);
  const [newPump, setNewPump] = useState<Partial<PumpSettings>>({
    pump_number: '',
    nozzle_count: 1,
    fuel_types: []
  });
  const [currentPump, setCurrentPump] = useState<PumpSettings | null>(null);
  const [fuelPumpId, setFuelPumpId] = useState<string | null>(null);

  useEffect(() => {
    const initFuelPumpId = async () => {
      const id = await getFuelPumpId();
      setFuelPumpId(id);
      if (id) {
        fetchPumpSettings(id);
        fetchFuelSettings(id);
      } else {
        console.log('No fuel pump ID available');
        toast({
          title: "Authentication Required",
          description: "Please log in with a fuel pump account to view pump settings",
          variant: "destructive"
        });
      }
    };
    
    initFuelPumpId();
  }, []);

  const fetchPumpSettings = async (pumpId: string) => {
    try {
      const { data, error } = await supabase
        .from('pump_settings')
        .select('*')
        .eq('fuel_pump_id', pumpId);
        
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

  const fetchFuelSettings = async (pumpId: string) => {
    try {
      const { data, error } = await supabase
        .from('fuel_settings')
        .select('*')
        .eq('fuel_pump_id', pumpId);
        
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
      if (!fuelPumpId) {
        toast({
          title: "Authentication Required",
          description: "Please log in with a fuel pump account to add pumps",
          variant: "destructive"
        });
        return;
      }
      
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
          fuel_types: newPump.fuel_types || [],
          fuel_pump_id: fuelPumpId
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

  const handleEditPump = (pump: PumpSettings) => {
    setCurrentPump(pump);
    setIsEditPumpDialogOpen(true);
  };

  const handleUpdatePump = async () => {
    try {
      if (!fuelPumpId || !currentPump) {
        return;
      }
      
      const { error } = await supabase
        .from('pump_settings')
        .update({
          pump_number: currentPump.pump_number,
          nozzle_count: currentPump.nozzle_count,
          fuel_types: currentPump.fuel_types
        })
        .eq('id', currentPump.id)
        .eq('fuel_pump_id', fuelPumpId);
        
      if (error) throw error;
      
      setPumpSettings(pumpSettings.map(pump => 
        pump.id === currentPump.id ? currentPump : pump
      ));
      
      setIsEditPumpDialogOpen(false);
      setCurrentPump(null);
      
      toast({
        title: "Success",
        description: "Pump updated successfully"
      });
    } catch (error) {
      console.error('Error updating pump:', error);
      toast({
        title: "Error",
        description: "Failed to update pump. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeletePump = async (pump: PumpSettings) => {
    try {
      if (!fuelPumpId) {
        toast({
          title: "Authentication Required",
          description: "Please log in with a fuel pump account to delete pumps",
          variant: "destructive"
        });
        return;
      }
      
      // Check if pump is used in readings
      const { data: readingsData, error: readingsError } = await supabase
        .from('readings')
        .select('count')
        .eq('fuel_pump_id', fuelPumpId)
        .eq('pump_id', pump.pump_number)
        .single();
        
      if (readingsError && readingsError.code !== 'PGRST116') {
        console.error("Error checking readings:", readingsError);
        throw readingsError;
      }
      
      // Check if pump is used in shifts
      const { data: shiftsData, error: shiftsError } = await supabase
        .from('shifts')
        .select('staff.assigned_pumps')
        .eq('fuel_pump_id', fuelPumpId)
        .not('staff', 'is', null)
        .join('staff', 'shifts.staff_id', 'staff.id');
        
      if (shiftsError) {
        console.error("Error checking shifts:", shiftsError);
        throw shiftsError;
      }
      
      // Check if this pump is assigned to any staff member
      let pumpAssignedToStaff = false;
      
      if (shiftsData) {
        for (const shift of shiftsData) {
          if (shift.staff && shift.staff.assigned_pumps) {
            const assignedPumps = shift.staff.assigned_pumps;
            if (Array.isArray(assignedPumps) && assignedPumps.some(p => p.id === pump.id || p.number === pump.pump_number)) {
              pumpAssignedToStaff = true;
              break;
            } else if (typeof assignedPumps === 'object') {
              const pumpArray = Object.values(assignedPumps);
              if (pumpArray.some((p: any) => p.id === pump.id || p.number === pump.pump_number)) {
                pumpAssignedToStaff = true;
                break;
              }
            }
          }
        }
      }
      
      // Count references to this pump
      const readingCount = readingsData?.count || 0;
      
      const totalReferences = parseInt(String(readingCount)) + (pumpAssignedToStaff ? 1 : 0);
      
      if (totalReferences > 0) {
        // Pump is in use, show error toast instead of deletion dialog
        toast({
          title: "Cannot Delete Pump",
          description: `"${pump.pump_number}" is currently in use in ${totalReferences} place${totalReferences > 1 ? 's' : ''} and cannot be deleted.`,
          variant: "destructive"
        });
      } else {
        // Safe to delete, show confirmation dialog
        setPumpToDelete(pump);
        setIsDeleteAlertOpen(true);
      }
    } catch (error) {
      console.error('Error checking pump usage:', error);
      toast({
        title: "Error",
        description: "Failed to check if pump is in use. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const confirmDeletePump = async () => {
    try {
      if (!fuelPumpId || !pumpToDelete) {
        toast({
          title: "Error",
          description: "Missing information for deletion",
          variant: "destructive"
        });
        return;
      }
      
      const { error } = await supabase
        .from('pump_settings')
        .delete()
        .eq('id', pumpToDelete.id)
        .eq('fuel_pump_id', fuelPumpId);
        
      if (error) throw error;
      
      // Update the state by removing the deleted pump
      setPumpSettings(pumpSettings.filter(pump => pump.id !== pumpToDelete.id));
      
      toast({
        title: "Success",
        description: `Pump "${pumpToDelete.pump_number}" deleted successfully`
      });
      
      setIsDeleteAlertOpen(false);
      setPumpToDelete(null);
    } catch (error) {
      console.error('Error deleting pump:', error);
      toast({
        title: "Error",
        description: "Failed to delete pump. Please try again.",
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
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleEditPump(pump)}
                          className="h-8 w-8"
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDeletePump(pump)}
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {/* Edit Pump Dialog */}
      <Dialog open={isEditPumpDialogOpen} onOpenChange={setIsEditPumpDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Pump</DialogTitle>
            <DialogDescription>
              Update pump configuration
            </DialogDescription>
          </DialogHeader>
          {currentPump && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit_pump_number">Pump Number</Label>
                <Input 
                  id="edit_pump_number" 
                  value={currentPump.pump_number}
                  onChange={e => setCurrentPump({...currentPump, pump_number: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_nozzle_count">Number of Nozzles</Label>
                <Input 
                  id="edit_nozzle_count" 
                  type="number"
                  min="1"
                  max="4"
                  value={currentPump.nozzle_count.toString()}
                  onChange={e => setCurrentPump({...currentPump, nozzle_count: parseInt(e.target.value)})}
                />
              </div>
              <div className="grid gap-2">
                <Label>Available Fuel Types</Label>
                <div className="flex flex-wrap gap-2 pt-2">
                  {fuelSettings.map(fuel => (
                    <Button
                      key={fuel.fuel_type}
                      variant={currentPump.fuel_types?.includes(fuel.fuel_type) ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        const updatedFuelTypes = [...currentPump.fuel_types];
                        if (updatedFuelTypes.includes(fuel.fuel_type)) {
                          setCurrentPump({
                            ...currentPump, 
                            fuel_types: updatedFuelTypes.filter(f => f !== fuel.fuel_type)
                          });
                        } else {
                          setCurrentPump({
                            ...currentPump,
                            fuel_types: [...updatedFuelTypes, fuel.fuel_type]
                          });
                        }
                      }}
                    >
                      {fuel.fuel_type}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditPumpDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdatePump}>Update Pump</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Pump</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the pump "{pumpToDelete?.pump_number}"?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeletePump}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
