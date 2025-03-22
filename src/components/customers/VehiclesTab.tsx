
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Edit, Truck } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Vehicle } from '@/integrations/supabase/client';
import { createVehicle, updateVehicle } from '@/integrations/vehicles';

interface VehiclesTabProps {
  vehicles: Vehicle[];
  setVehicles: React.Dispatch<React.SetStateAction<Vehicle[]>>;
  customerId: string;
  customerName: string;
}

const VehiclesTab = ({ vehicles, setVehicles, customerId, customerName }: VehiclesTabProps) => {
  const [vehicleDialogOpen, setVehicleDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [newVehicle, setNewVehicle] = useState<Partial<Vehicle>>({
    customer_id: customerId,
    number: '',
    type: 'Truck',
    capacity: ''
  });

  const resetVehicleForm = () => {
    setNewVehicle({
      customer_id: customerId,
      number: '',
      type: 'Truck',
      capacity: ''
    });
    setEditMode(false);
  };

  const handleOpenDialog = (vehicle?: Vehicle) => {
    if (vehicle) {
      // Edit mode
      setNewVehicle({
        ...vehicle
      });
      setEditMode(true);
    } else {
      // Add mode
      resetVehicleForm();
    }
    setVehicleDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setVehicleDialogOpen(false);
    resetVehicleForm();
  };

  const handleAddVehicle = async () => {
    try {
      if (!newVehicle.number) {
        toast({
          title: "Missing information",
          description: "Please enter a vehicle number",
          variant: "destructive"
        });
        return;
      }

      const vehicleData = {
        customer_id: customerId,
        number: newVehicle.number,
        type: newVehicle.type || 'Not Specified',
        capacity: newVehicle.capacity || 'Not Specified'
      };

      const result = await createVehicle(vehicleData);
      
      if (result) {
        setVehicles([...vehicles, result]);
        handleCloseDialog();
      }
    } catch (error) {
      console.error('Error adding vehicle:', error);
    }
  };

  const handleUpdateVehicle = async () => {
    try {
      if (!newVehicle.id || !newVehicle.number) {
        toast({
          title: "Missing information",
          description: "Vehicle ID or number is missing",
          variant: "destructive"
        });
        return;
      }

      const vehicleData = {
        number: newVehicle.number,
        type: newVehicle.type || 'Not Specified',
        capacity: newVehicle.capacity || 'Not Specified'
      };

      const result = await updateVehicle(newVehicle.id, vehicleData);
      
      if (result) {
        // Update the vehicles array with the updated vehicle
        setVehicles(vehicles.map(v => 
          v.id === newVehicle.id ? result : v
        ));
        
        handleCloseDialog();
      }
    } catch (error) {
      console.error('Error updating vehicle:', error);
    }
  };

  const dialogTitle = editMode ? "Edit Vehicle" : "Add New Vehicle";
  const dialogDescription = editMode 
    ? `Update the details for vehicle ${newVehicle.number}`
    : `Register a new vehicle for ${customerName}`;
  const submitButtonText = editMode ? "Update Vehicle" : "Add Vehicle";
  const submitHandler = editMode ? handleUpdateVehicle : handleAddVehicle;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Registered Vehicles</CardTitle>
          <Button size="sm" className="gap-1" onClick={() => handleOpenDialog()}>
            <Truck className="h-4 w-4" />
            Add Vehicle
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {vehicles.length === 0 ? (
          <div className="py-8 text-center">
            <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No vehicles registered yet</p>
            <Button 
              variant="outline" 
              className="mt-4" 
              onClick={() => handleOpenDialog()}
            >
              Add First Vehicle
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle Number</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Added On</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicles.map((vehicle) => (
                <TableRow key={vehicle.id}>
                  <TableCell className="font-medium">{vehicle.number}</TableCell>
                  <TableCell>{vehicle.type}</TableCell>
                  <TableCell>{vehicle.capacity}</TableCell>
                  <TableCell>
                    {vehicle.created_at 
                      ? new Date(vehicle.created_at).toLocaleDateString()
                      : 'Unknown'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleOpenDialog(vehicle)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <Dialog open={vehicleDialogOpen} onOpenChange={setVehicleDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{dialogTitle}</DialogTitle>
              <DialogDescription>
                {dialogDescription}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="vehicle_number">Vehicle Number</Label>
                <Input 
                  id="vehicle_number" 
                  placeholder="e.g. KA-01-AB-1234"
                  value={newVehicle.number}
                  onChange={e => setNewVehicle({...newVehicle, number: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="vehicle_type">Vehicle Type</Label>
                <Input 
                  id="vehicle_type" 
                  placeholder="e.g. Truck, Tanker"
                  value={newVehicle.type}
                  onChange={e => setNewVehicle({...newVehicle, type: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="vehicle_capacity">Capacity</Label>
                <Input 
                  id="vehicle_capacity" 
                  placeholder="e.g. 12 Ton, 20000 Liters"
                  value={newVehicle.capacity}
                  onChange={e => setNewVehicle({...newVehicle, capacity: e.target.value})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCloseDialog}>Cancel</Button>
              <Button onClick={submitHandler}>{submitButtonText}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default VehiclesTab;
