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
import { Droplet, Edit, Plus, Trash2 } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from '@/hooks/use-toast';
import { getFuelPumpId } from '@/integrations/utils';

export interface FuelSettings {
  id: string;
  fuel_type: string;
  current_price: number;
  tank_capacity: number;
  current_level: number;
  updated_at?: string;
  fuel_pump_id?: string;
}

export function FuelTypeSettings() {
  const [fuelSettings, setFuelSettings] = useState<FuelSettings[]>([]);
  const [isAddFuelDialogOpen, setIsAddFuelDialogOpen] = useState(false);
  const [isEditFuelDialogOpen, setIsEditFuelDialogOpen = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [fuelToDelete, setFuelToDelete] = useState<FuelSettings | null>(null);
  const [newFuelType, setNewFuelType] = useState<Partial<FuelSettings>>({
    fuel_type: '',
    current_price: 0,
    tank_capacity: 0,
    current_level: 0
  });
  const [editFuelType, setEditFuelType] = useState<FuelSettings | null>(null);
  const [fuelPumpId, setFuelPumpId] = useState<string | null>(null);
  
  useEffect(() => {
    const initFuelPumpId = async () => {
      const id = await getFuelPumpId();
      setFuelPumpId(id);
      if (id) {
        fetchFuelSettings(id);
      } else {
        console.log('No fuel pump ID available');
        toast({
          title: "Authentication Required",
          description: "Please log in with a fuel pump account to view fuel settings",
          variant: "destructive"
        });
      }
    };
    
    initFuelPumpId();
  }, []);
  
  const fetchFuelSettings = async (pumpId: string) => {
    try {
      console.log('Fetching fuel settings for settings page with pump ID:', pumpId);
      const { data, error } = await supabase
        .from('fuel_settings')
        .select('*')
        .eq('fuel_pump_id', pumpId);
        
      if (error) throw error;
      
      if (data) {
        console.log('Fetched fuel settings:', data);
        setFuelSettings(data as FuelSettings[]);
      }
    } catch (error) {
      console.error('Error fetching fuel settings:', error);
      toast({
        title: "Error",
        description: "Failed to load fuel settings. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleAddFuelType = async () => {
    try {
      if (!fuelPumpId) {
        toast({
          title: "Authentication Required",
          description: "Please log in with a fuel pump account to add fuel types",
          variant: "destructive"
        });
        return;
      }
      
      if (!newFuelType.fuel_type || newFuelType.current_price === undefined || 
          newFuelType.tank_capacity === undefined || newFuelType.current_level === undefined) {
        toast({
          title: "Missing information",
          description: "Please fill all required fields",
          variant: "destructive"
        });
        return;
      }
      
      // Trim whitespace from fuel type
      const cleanedFuelType = newFuelType.fuel_type.trim();
      
      // Check if a fuel type with the same name already exists
      const existingFuelType = fuelSettings.find(
        (fuel) => fuel.fuel_type.toLowerCase() === cleanedFuelType.toLowerCase()
      );
      
      if (existingFuelType) {
        toast({
          title: "Fuel type already exists",
          description: `A fuel type named '${cleanedFuelType}' already exists. Please use a different name.`,
          variant: "destructive"
        });
        return;
      }
      
      const { data, error } = await supabase
        .from('fuel_settings')
        .insert([{
          fuel_type: cleanedFuelType,
          current_price: newFuelType.current_price,
          tank_capacity: newFuelType.tank_capacity,
          current_level: newFuelType.current_level,
          fuel_pump_id: fuelPumpId
        }])
        .select();
        
      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Fuel type already exists",
            description: "A fuel type with this name already exists. Please use a different name.",
            variant: "destructive"
          });
        } else {
          throw error;
        }
        return;
      }
      
      if (data) {
        setFuelSettings([...fuelSettings, data[0] as FuelSettings]);
        setIsAddFuelDialogOpen(false);
        setNewFuelType({
          fuel_type: '',
          current_price: 0,
          tank_capacity: 0,
          current_level: 0
        });
        
        toast({
          title: "Success",
          description: "Fuel type added successfully"
        });
      }
    } catch (error) {
      console.error('Error adding fuel type:', error);
      toast({
        title: "Error",
        description: "Failed to add fuel type. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleUpdateFuelType = async () => {
    try {
      if (!fuelPumpId) {
        toast({
          title: "Authentication Required",
          description: "Please log in with a fuel pump account to update fuel types",
          variant: "destructive"
        });
        return;
      }
      
      if (!editFuelType) {
        toast({
          title: "Error",
          description: "No fuel type selected for editing",
          variant: "destructive"
        });
        return;
      }
      
      // Trim whitespace from fuel type
      const cleanedFuelType = editFuelType.fuel_type.trim();
      
      // Check if the name is being changed and conflicts with an existing fuel type
      if (cleanedFuelType !== editFuelType.fuel_type) {
        const existingFuelType = fuelSettings.find(
          (fuel) => 
            fuel.id !== editFuelType.id && 
            fuel.fuel_type.toLowerCase() === cleanedFuelType.toLowerCase()
        );
        
        if (existingFuelType) {
          toast({
            title: "Fuel type already exists",
            description: `A fuel type named '${cleanedFuelType}' already exists. Please use a different name.`,
            variant: "destructive"
          });
          return;
        }
      }
      
      console.log('Updating fuel type with data:', {
        ...editFuelType,
        fuel_type: cleanedFuelType,
        fuel_pump_id: fuelPumpId
      });
      
      const { data, error } = await supabase
        .from('fuel_settings')
        .update({
          fuel_type: cleanedFuelType,
          current_price: editFuelType.current_price,
          tank_capacity: editFuelType.tank_capacity,
          current_level: editFuelType.current_level,
          updated_at: new Date().toISOString(),
          fuel_pump_id: fuelPumpId
        })
        .eq('id', editFuelType.id)
        .select();
        
      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Fuel type already exists",
            description: "A fuel type with this name already exists. Please use a different name.",
            variant: "destructive"
          });
        } else {
          console.error('Supabase update error:', error);
          throw error;
        }
        return;
      }
      
      if (data) {
        console.log('Update successful, returned data:', data);
        // Update the fuel settings state with the updated fuel type
        setFuelSettings(fuelSettings.map(fuel => 
          fuel.id === editFuelType.id ? data[0] as FuelSettings : fuel
        ));
        
        setIsEditFuelDialogOpen(false);
        setEditFuelType(null);
        
        toast({
          title: "Success",
          description: "Fuel type updated successfully"
        });
      }
    } catch (error) {
      console.error('Error updating fuel type:', error);
      toast({
        title: "Error",
        description: "Failed to update fuel type. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleEditFuelType = (fuel: FuelSettings) => {
    console.log('Editing fuel type:', fuel);
    setEditFuelType({...fuel});
    setIsEditFuelDialogOpen(true);
  };
  
  const handleDeleteFuelType = async (fuel: FuelSettings) => {
    // Check if the fuel type is in use before showing the deletion confirmation
    try {
      if (!fuelPumpId) {
        toast({
          title: "Authentication Required",
          description: "Please log in with a fuel pump account to delete fuel types",
          variant: "destructive"
        });
        return;
      }
      
      // Check if fuel type is used in transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('count')
        .eq('fuel_pump_id', fuelPumpId)
        .eq('fuel_type', fuel.fuel_type)
        .single();
        
      if (transactionsError && transactionsError.code !== 'PGRST116') {
        console.error("Error checking transactions:", transactionsError);
        throw transactionsError;
      }
      
      // Check if fuel type is used in indents
      const { data: indentsData, error: indentsError } = await supabase
        .from('indents')
        .select('count')
        .eq('fuel_pump_id', fuelPumpId)
        .eq('fuel_type', fuel.fuel_type)
        .single();
        
      if (indentsError && indentsError.code !== 'PGRST116') {
        console.error("Error checking indents:", indentsError);
        throw indentsError;
      }
      
      // Check if fuel type is used in daily readings
      const { data: readingsData, error: readingsError } = await supabase
        .from('daily_readings')
        .select('count')
        .eq('fuel_pump_id', fuelPumpId)
        .eq('fuel_type', fuel.fuel_type)
        .single();
        
      if (readingsError && readingsError.code !== 'PGRST116') {
        console.error("Error checking daily readings:", readingsError);
        throw readingsError;
      }
      
      // Check if fuel type is used in pump settings
      const { data: pumpSettingsData, error: pumpSettingsError } = await supabase
        .from('pump_settings')
        .select('fuel_types')
        .eq('fuel_pump_id', fuelPumpId);
        
      if (pumpSettingsError) {
        console.error("Error checking pump settings:", pumpSettingsError);
        throw pumpSettingsError;
      }
      
      // Check if this fuel type is used in any pump
      const fuelTypeUsedInPump = pumpSettingsData?.some(pump => 
        pump.fuel_types && pump.fuel_types.some((type: string) => 
          type.toLowerCase() === fuel.fuel_type.toLowerCase()
        )
      );
      
      // Count references to this fuel type
      const transactionCount = transactionsData?.count || 0;
      const indentCount = indentsData?.count || 0;
      const readingCount = readingsData?.count || 0;
      
      const totalReferences = 
        parseInt(String(transactionCount)) + 
        parseInt(String(indentCount)) + 
        parseInt(String(readingCount)) + 
        (fuelTypeUsedInPump ? 1 : 0);
      
      if (totalReferences > 0) {
        // Fuel type is in use, show error toast instead of deletion dialog
        toast({
          title: "Cannot Delete Fuel Type",
          description: `"${fuel.fuel_type}" is currently in use in ${totalReferences} place${totalReferences > 1 ? 's' : ''} and cannot be deleted.`,
          variant: "destructive"
        });
      } else {
        // Safe to delete, show confirmation dialog
        setFuelToDelete(fuel);
        setIsDeleteAlertOpen(true);
      }
    } catch (error) {
      console.error('Error checking fuel type usage:', error);
      toast({
        title: "Error",
        description: "Failed to check if fuel type is in use. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const confirmDeleteFuelType = async () => {
    try {
      if (!fuelPumpId || !fuelToDelete) {
        toast({
          title: "Error",
          description: "Missing information for deletion",
          variant: "destructive"
        });
        return;
      }
      
      const { error } = await supabase
        .from('fuel_settings')
        .delete()
        .eq('id', fuelToDelete.id)
        .eq('fuel_pump_id', fuelPumpId);
        
      if (error) throw error;
      
      // Update the state by removing the deleted fuel type
      setFuelSettings(fuelSettings.filter(fuel => fuel.id !== fuelToDelete.id));
      
      toast({
        title: "Success",
        description: `Fuel type "${fuelToDelete.fuel_type}" deleted successfully`
      });
      
      setIsDeleteAlertOpen(false);
      setFuelToDelete(null);
    } catch (error) {
      console.error('Error deleting fuel type:', error);
      toast({
        title: "Error",
        description: "Failed to delete fuel type. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Fuel Types</h2>
        <Dialog open={isAddFuelDialogOpen} onOpenChange={setIsAddFuelDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Fuel Type
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Fuel Type</DialogTitle>
              <DialogDescription>
                Configure new fuel type for your station
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="fuel_type">Fuel Type</Label>
                <Input 
                  id="fuel_type" 
                  placeholder="e.g. Petrol, Diesel, Premium"
                  value={newFuelType.fuel_type}
                  onChange={e => setNewFuelType({...newFuelType, fuel_type: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="current_price">Current Price (per liter)</Label>
                <Input 
                  id="current_price" 
                  type="number"
                  value={newFuelType.current_price?.toString()}
                  onChange={e => setNewFuelType({...newFuelType, current_price: parseFloat(e.target.value)})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tank_capacity">Tank Capacity (liters)</Label>
                <Input 
                  id="tank_capacity" 
                  type="number"
                  value={newFuelType.tank_capacity?.toString()}
                  onChange={e => setNewFuelType({...newFuelType, tank_capacity: parseFloat(e.target.value)})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="current_level">Current Stock Level (liters)</Label>
                <Input 
                  id="current_level" 
                  type="number"
                  value={newFuelType.current_level?.toString()}
                  onChange={e => setNewFuelType({...newFuelType, current_level: parseFloat(e.target.value)})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddFuelDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAddFuelType}>Add Fuel Type</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <Card>
        <CardContent className="pt-6">
          {fuelSettings.length === 0 ? (
            <div className="py-8 text-center">
              <Droplet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No fuel types configured yet</p>
              <Button 
                variant="outline" 
                className="mt-4" 
                onClick={() => setIsAddFuelDialogOpen(true)}
              >
                Add First Fuel Type
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fuel Type</TableHead>
                  <TableHead className="text-right">Price (₹/L)</TableHead>
                  <TableHead className="text-right">Tank Capacity</TableHead>
                  <TableHead className="text-right">Current Level</TableHead>
                  <TableHead className="text-right">Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fuelSettings.map((fuel) => (
                  <TableRow key={fuel.id}>
                    <TableCell className="font-medium">{fuel.fuel_type}</TableCell>
                    <TableCell className="text-right">₹{fuel.current_price.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{fuel.tank_capacity.toLocaleString()} L</TableCell>
                    <TableCell className="text-right">{fuel.current_level.toLocaleString()} L</TableCell>
                    <TableCell className="text-right">
                      {fuel.updated_at 
                        ? new Date(fuel.updated_at).toLocaleDateString()
                        : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleEditFuelType(fuel)}
                          className="h-8 w-8"
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDeleteFuelType(fuel)}
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

      {/* Edit Fuel Type Dialog */}
      <Dialog open={isEditFuelDialogOpen} onOpenChange={setIsEditFuelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Fuel Type</DialogTitle>
            <DialogDescription>
              Update fuel type configuration
            </DialogDescription>
          </DialogHeader>
          {editFuelType && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit_fuel_type">Fuel Type</Label>
                <Input 
                  id="edit_fuel_type" 
                  value={editFuelType.fuel_type}
                  onChange={e => setEditFuelType({...editFuelType, fuel_type: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_current_price">Current Price (per liter)</Label>
                <Input 
                  id="edit_current_price" 
                  type="number"
                  value={editFuelType.current_price?.toString()}
                  onChange={e => setEditFuelType({...editFuelType, current_price: parseFloat(e.target.value)})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_tank_capacity">Tank Capacity (liters)</Label>
                <Input 
                  id="edit_tank_capacity" 
                  type="number"
                  value={editFuelType.tank_capacity?.toString()}
                  onChange={e => setEditFuelType({...editFuelType, tank_capacity: parseFloat(e.target.value)})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_current_level">Current Stock Level (liters)</Label>
                <Input 
                  id="edit_current_level" 
                  type="number"
                  value={editFuelType.current_level?.toString()}
                  onChange={e => setEditFuelType({...editFuelType, current_level: parseFloat(e.target.value)})}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditFuelDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateFuelType}>Update Fuel Type</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Fuel Type</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the fuel type "{fuelToDelete?.fuel_type}"? 
              This action cannot be undone and may affect reporting and historical data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteFuelType} 
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
