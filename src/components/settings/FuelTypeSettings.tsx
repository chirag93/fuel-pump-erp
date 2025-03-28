
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
import { Droplet, Edit, Plus } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from '@/components/ui/use-toast';
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
  const [isEditFuelDialogOpen, setIsEditFuelDialogOpen] = useState(false);
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
        
      if (error) throw error;
      
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
        console.error('Supabase update error:', error);
        throw error;
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
                  <TableHead></TableHead>
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
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleEditFuelType(fuel)}
                      >
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
                  value={editFuelType.current_price}
                  onChange={e => setEditFuelType({...editFuelType, current_price: parseFloat(e.target.value)})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_tank_capacity">Tank Capacity (liters)</Label>
                <Input 
                  id="edit_tank_capacity" 
                  type="number"
                  value={editFuelType.tank_capacity}
                  onChange={e => setEditFuelType({...editFuelType, tank_capacity: parseFloat(e.target.value)})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_current_level">Current Stock Level (liters)</Label>
                <Input 
                  id="edit_current_level" 
                  type="number"
                  value={editFuelType.current_level}
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
    </>
  );
}
