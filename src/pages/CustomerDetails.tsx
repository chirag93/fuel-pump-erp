
// Import only what you need from the file
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Clipboard, Car, Truck, UserCheck, FileText, ArrowLeft, Save, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Define proper types for our data
interface Customer {
  id: string;
  name: string;
  gst: string;
  email: string;
  phone: string;
  contact: string;
  balance: number;
  created_at?: string;
}

interface Vehicle {
  id?: string;
  customer_id: string;
  number: string;
  type: string;
  capacity: string;
  created_at?: string;
}

interface Indent {
  id: string;
  customer_id: string;
  vehicle_id: string;
  fuel_type: string;
  quantity: number;
  amount: number;
  status?: string;
  created_at?: string;
}

const CustomerDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [indents, setIndents] = useState<Indent[]>([]);
  
  // New vehicle form
  const [isVehicleDialogOpen, setIsVehicleDialogOpen] = useState(false);
  const [newVehicle, setNewVehicle] = useState<Partial<Vehicle>>({
    number: '',
    type: 'Truck',
    capacity: '10 Ton'
  });
  
  // New indent form
  const [isIndentDialogOpen, setIsIndentDialogOpen] = useState(false);
  const [newIndent, setNewIndent] = useState<Partial<Indent>>({
    vehicle_id: '',
    fuel_type: 'Petrol',
    quantity: 100,
    amount: 0
  });
  
  useEffect(() => {
    const fetchCustomerDetails = async () => {
      try {
        setIsLoading(true);
        if (!id) return;
        
        // Fetch customer data
        const { data: customerData, error: customerError } = await supabase
          .from('customers')
          .select('*')
          .eq('id', id)
          .single();
          
        if (customerError) throw customerError;
        
        setCustomer(customerData as Customer);
        
        // Fetch vehicles for this customer
        const { data: vehiclesData, error: vehiclesError } = await supabase
          .from('vehicles')
          .select('*')
          .eq('customer_id', id);
          
        if (vehiclesError) throw vehiclesError;
        
        setVehicles(vehiclesData as Vehicle[]);
        
        // Fetch indents for this customer
        const { data: indentsData, error: indentsError } = await supabase
          .from('indents')
          .select('*')
          .eq('customer_id', id);
          
        if (indentsError) throw indentsError;
        
        setIndents(indentsData as Indent[]);
        
      } catch (error) {
        console.error('Error fetching customer details:', error);
        toast({
          title: "Error",
          description: "Failed to load customer details. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCustomerDetails();
  }, [id]);
  
  const handleUpdateCustomer = async () => {
    try {
      if (!customer) return;
      
      const { error } = await supabase
        .from('customers')
        .update({
          name: customer.name,
          gst: customer.gst,
          email: customer.email,
          phone: customer.phone,
          contact: customer.contact
        })
        .eq('id', customer.id);
        
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Customer information updated successfully."
      });
      
    } catch (error) {
      console.error('Error updating customer:', error);
      toast({
        title: "Error",
        description: "Failed to update customer information. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleAddVehicle = async () => {
    try {
      if (!customer || !newVehicle.number || !newVehicle.type || !newVehicle.capacity) {
        toast({
          title: "Missing information",
          description: "Please fill all required fields for the vehicle",
          variant: "destructive"
        });
        return;
      }
      
      const vehicleToAdd: Vehicle = {
        customer_id: customer.id,
        number: newVehicle.number,
        type: newVehicle.type,
        capacity: newVehicle.capacity
      };
      
      const { data, error } = await supabase
        .from('vehicles')
        .insert([vehicleToAdd])
        .select();
        
      if (error) throw error;
      
      if (data) {
        setVehicles([...vehicles, data[0] as Vehicle]);
        setIsVehicleDialogOpen(false);
        setNewVehicle({
          number: '',
          type: 'Truck',
          capacity: '10 Ton'
        });
        
        toast({
          title: "Success",
          description: "Vehicle added successfully."
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
  
  const handleAddIndent = async () => {
    try {
      if (!customer || !newIndent.vehicle_id || !newIndent.fuel_type || 
          !newIndent.quantity || !newIndent.amount) {
        toast({
          title: "Missing information",
          description: "Please fill all required fields for the indent",
          variant: "destructive"
        });
        return;
      }
      
      const indentToAdd: Indent = {
        id: `IND-${Date.now().toString(36).toUpperCase()}`,
        customer_id: customer.id,
        vehicle_id: newIndent.vehicle_id,
        fuel_type: newIndent.fuel_type,
        quantity: newIndent.quantity,
        amount: newIndent.amount,
        status: 'Pending'
      };
      
      const { data, error } = await supabase
        .from('indents')
        .insert([indentToAdd])
        .select();
        
      if (error) throw error;
      
      if (data) {
        setIndents([...indents, data[0] as Indent]);
        setIsIndentDialogOpen(false);
        setNewIndent({
          vehicle_id: '',
          fuel_type: 'Petrol',
          quantity: 100,
          amount: 0
        });
        
        toast({
          title: "Success",
          description: "Fuel indent added successfully."
        });
      }
    } catch (error) {
      console.error('Error adding indent:', error);
      toast({
        title: "Error",
        description: "Failed to add fuel indent. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading customer details...</span>
      </div>
    );
  }
  
  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">Customer not found</p>
        <Button onClick={() => navigate('/customers')}>Back to Customers</Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => navigate('/customers')}
          className="h-8 w-8"
        >
          <ArrowLeft size={16} />
        </Button>
        <h1 className="text-3xl font-bold">{customer.name}</h1>
      </div>
      
      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Customer Details</TabsTrigger>
          <TabsTrigger value="vehicles">Vehicles ({vehicles.length})</TabsTrigger>
          <TabsTrigger value="indents">Fuel Indents ({indents.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Customer Information</CardTitle>
                <Clipboard className="h-5 w-5 text-muted-foreground" />
              </div>
              <CardDescription>View and update customer details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="name">Business Name</Label>
                  <Input 
                    id="name" 
                    value={customer.name} 
                    onChange={e => setCustomer({...customer, name: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="gst">GST Number</Label>
                  <Input 
                    id="gst" 
                    value={customer.gst} 
                    onChange={e => setCustomer({...customer, gst: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={customer.email} 
                    onChange={e => setCustomer({...customer, email: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input 
                    id="phone" 
                    value={customer.phone} 
                    onChange={e => setCustomer({...customer, phone: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="contact">Contact Person</Label>
                  <Input 
                    id="contact" 
                    value={customer.contact} 
                    onChange={e => setCustomer({...customer, contact: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="balance">Balance</Label>
                  <Input 
                    id="balance" 
                    value={customer.balance.toString()} 
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Balance cannot be directly edited</p>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={handleUpdateCustomer}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="vehicles" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Registered Vehicles</h2>
            <Dialog open={isVehicleDialogOpen} onOpenChange={setIsVehicleDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Vehicle
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Vehicle</DialogTitle>
                  <DialogDescription>
                    Register a new vehicle for {customer.name}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="number">Vehicle Number</Label>
                    <Input 
                      id="number" 
                      placeholder="e.g. KA-01-AB-1234" 
                      value={newVehicle.number}
                      onChange={e => setNewVehicle({...newVehicle, number: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="type">Vehicle Type</Label>
                    <Select 
                      value={newVehicle.type} 
                      onValueChange={value => setNewVehicle({...newVehicle, type: value})}
                    >
                      <SelectTrigger id="type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Truck">Truck</SelectItem>
                        <SelectItem value="Tanker">Tanker</SelectItem>
                        <SelectItem value="Bus">Bus</SelectItem>
                        <SelectItem value="Car">Car</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="capacity">Capacity</Label>
                    <Input 
                      id="capacity" 
                      placeholder="e.g. 12 Ton" 
                      value={newVehicle.capacity}
                      onChange={e => setNewVehicle({...newVehicle, capacity: e.target.value})}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsVehicleDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleAddVehicle}>Add Vehicle</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          
          {vehicles.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No vehicles registered yet</p>
                <Button variant="outline" className="mt-4" onClick={() => setIsVehicleDialogOpen(true)}>
                  Add First Vehicle
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {vehicles.map(vehicle => (
                <Card key={vehicle.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl">{vehicle.number}</CardTitle>
                      {vehicle.type === 'Truck' ? (
                        <Truck className="h-5 w-5 text-primary" />
                      ) : vehicle.type === 'Car' ? (
                        <Car className="h-5 w-5 text-primary" />
                      ) : (
                        <Truck className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Type</span>
                      <span className="font-medium">{vehicle.type}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Capacity</span>
                      <span className="font-medium">{vehicle.capacity}</span>
                    </div>
                    {/* Add more vehicle details as needed */}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="indents" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Fuel Indents</h2>
            <Dialog open={isIndentDialogOpen} onOpenChange={setIsIndentDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Indent
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Fuel Indent</DialogTitle>
                  <DialogDescription>
                    Create a new fuel indent for {customer.name}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="vehicle_id">Vehicle</Label>
                    <Select 
                      value={newIndent.vehicle_id} 
                      onValueChange={value => setNewIndent({...newIndent, vehicle_id: value})}
                    >
                      <SelectTrigger id="vehicle_id">
                        <SelectValue placeholder="Select vehicle" />
                      </SelectTrigger>
                      <SelectContent>
                        {vehicles.map(vehicle => (
                          <SelectItem key={vehicle.id} value={vehicle.id || ''}>
                            {vehicle.number} ({vehicle.type})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="fuel_type">Fuel Type</Label>
                    <Select 
                      value={newIndent.fuel_type} 
                      onValueChange={value => setNewIndent({...newIndent, fuel_type: value})}
                    >
                      <SelectTrigger id="fuel_type">
                        <SelectValue placeholder="Select fuel type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Petrol">Petrol</SelectItem>
                        <SelectItem value="Diesel">Diesel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="quantity">Quantity (Litres)</Label>
                    <Input 
                      id="quantity" 
                      type="number"
                      value={newIndent.quantity?.toString()} 
                      onChange={e => {
                        const qty = parseFloat(e.target.value);
                        // Assume rate of 100 per liter for calculation
                        const rate = newIndent.fuel_type === 'Petrol' ? 100 : 90;
                        setNewIndent({
                          ...newIndent, 
                          quantity: qty,
                          amount: qty * rate
                        });
                      }}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="amount">Amount (₹)</Label>
                    <Input 
                      id="amount" 
                      type="number"
                      value={newIndent.amount?.toString()} 
                      onChange={e => setNewIndent({...newIndent, amount: parseFloat(e.target.value)})}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsIndentDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleAddIndent}>Create Indent</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          
          {indents.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No fuel indents created yet</p>
                <Button variant="outline" className="mt-4" onClick={() => setIsIndentDialogOpen(true)}>
                  Create First Indent
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Fuel Indent History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Indent ID</th>
                        <th className="text-left p-2">Date</th>
                        <th className="text-left p-2">Vehicle</th>
                        <th className="text-left p-2">Fuel Type</th>
                        <th className="text-right p-2">Quantity</th>
                        <th className="text-right p-2">Amount</th>
                        <th className="text-center p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {indents.map(indent => {
                        const vehicle = vehicles.find(v => v.id === indent.vehicle_id);
                        return (
                          <tr key={indent.id} className="border-b hover:bg-muted/50">
                            <td className="p-2 font-medium">{indent.id}</td>
                            <td className="p-2">
                              {indent.created_at 
                                ? new Date(indent.created_at).toLocaleDateString() 
                                : 'N/A'}
                            </td>
                            <td className="p-2">{vehicle ? vehicle.number : 'Unknown'}</td>
                            <td className="p-2">{indent.fuel_type}</td>
                            <td className="p-2 text-right">{indent.quantity} L</td>
                            <td className="p-2 text-right">₹{indent.amount.toFixed(2)}</td>
                            <td className="p-2 text-center">
                              <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                                indent.status === 'Completed' 
                                  ? 'bg-green-100 text-green-800' 
                                  : indent.status === 'Processing'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {indent.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CustomerDetails;
