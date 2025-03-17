import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Edit, Truck } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase, Vehicle } from '@/integrations/supabase/client';

interface VehiclesTabProps {
  vehicles: Vehicle[];
  setVehicles: React.Dispatch<React.SetStateAction<Vehicle[]>>;
  customerId: string;
  customerName: string; // Added the missing customerName prop
}

const VehiclesTab = ({ vehicles, setVehicles, customerId, customerName }: VehiclesTabProps) => {
  const [vehicleDialogOpen, setVehicleDialogOpen] = useState(false);
  const [newVehicle, setNewVehicle] = useState<Partial<Vehicle>>({
    customer_id: customerId,
    number: '',
    type: 'Truck',
    capacity: ''
  });

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

      const { data, error } = await supabase
        .from('vehicles')
        .insert([{
          customer_id: customerId,
          number: newVehicle.number,
          type: newVehicle.type || 'Not Specified',
          capacity: newVehicle.capacity || 'Not Specified'
        }])
        .select();

      if (error) throw error;
      
      if (data) {
        setVehicles([...vehicles, data[0] as Vehicle]);
        setVehicleDialogOpen(false);
        setNewVehicle({
          customer_id: customerId,
          number: '',
          type: 'Truck',
          capacity: ''
        });
        
        toast({
          title: "Success",
          description: "Vehicle added successfully"
        });
      }
    } catch (error) {
      console.error('Error adding vehicle:', error);
      toast({
        title: "Error",
        description: "Failed to add vehicle. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Registered Vehicles</CardTitle>
          <Dialog open={vehicleDialogOpen} onOpenChange={setVehicleDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1">
                <Truck className="h-4 w-4" />
                Add Vehicle
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Vehicle</DialogTitle>
                <DialogDescription>
                  Register a new vehicle for this customer.
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
                <Button variant="outline" onClick={() => setVehicleDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleAddVehicle}>Add Vehicle</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
              onClick={() => setVehicleDialogOpen(true)}
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
                    <Button variant="ghost" size="sm">
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
  );
};

export default VehiclesTab;
