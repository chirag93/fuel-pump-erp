
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Building, Edit, Loader2, Truck, FileText } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';

interface Customer {
  id: string;
  name: string;
  contact: string;
  phone: string;
  email: string;
  gst: string;
  balance: number;
  created_at?: string;
}

interface Vehicle {
  id: string;
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
  vehicle_number?: string;
}

interface NewIndentData {
  start_number: string;
  end_number: string;
  customer_id: string;
  vehicle_id: string;
  fuel_type: string;
  quantity: number;
  amount: number;
}

const CustomerDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [indents, setIndents] = useState<Indent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newVehicle, setNewVehicle] = useState<Partial<Vehicle>>({
    customer_id: id,
    number: '',
    type: 'Truck',
    capacity: ''
  });
  const [vehicleDialogOpen, setVehicleDialogOpen] = useState(false);
  const [indentDialogOpen, setIndentDialogOpen] = useState(false);
  const [newIndent, setNewIndent] = useState<Partial<NewIndentData>>({
    start_number: '',
    end_number: '',
    customer_id: id,
    vehicle_id: '',
    fuel_type: 'Petrol',
    quantity: 0,
    amount: 0
  });

  useEffect(() => {
    if (id) {
      fetchCustomerData(id);
      fetchVehicles(id);
      fetchIndents(id);
    }
  }, [id]);

  const fetchCustomerData = async (customerId: string) => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single();

      if (error) throw error;
      
      setCustomer(data as Customer);
    } catch (error) {
      console.error('Error fetching customer:', error);
      toast({
        title: "Error",
        description: "Failed to load customer data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVehicles = async (customerId: string) => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('customer_id', customerId);

      if (error) throw error;
      
      setVehicles(data as Vehicle[]);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    }
  };

  const fetchIndents = async (customerId: string) => {
    try {
      const { data, error } = await supabase
        .from('indents')
        .select('*, vehicles(number)')
        .eq('customer_id', customerId);

      if (error) throw error;
      
      // Process data to include vehicle number
      const processedIndents = data.map(indent => ({
        ...indent,
        vehicle_number: indent.vehicles ? indent.vehicles.number : 'Unknown',
      }));
      
      setIndents(processedIndents as Indent[]);
    } catch (error) {
      console.error('Error fetching indents:', error);
    }
  };

  const handleAddVehicle = async () => {
    try {
      if (!newVehicle.number || !newVehicle.capacity) {
        toast({
          title: "Missing information",
          description: "Please fill all required fields",
          variant: "destructive"
        });
        return;
      }

      const { data, error } = await supabase
        .from('vehicles')
        .insert([{
          customer_id: id,
          number: newVehicle.number,
          type: newVehicle.type,
          capacity: newVehicle.capacity
        }])
        .select();

      if (error) throw error;
      
      if (data) {
        setVehicles([...vehicles, data[0] as Vehicle]);
        setVehicleDialogOpen(false);
        setNewVehicle({
          customer_id: id,
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

  const handleAddIndent = async () => {
    try {
      if (!newIndent.vehicle_id || !newIndent.fuel_type || !newIndent.quantity || !newIndent.amount || 
          !newIndent.start_number || !newIndent.end_number) {
        toast({
          title: "Missing information",
          description: "Please fill all required fields",
          variant: "destructive"
        });
        return;
      }

      // Create a unique indent ID using the start and end numbers
      const indentId = `IND-${newIndent.start_number}-${newIndent.end_number}`;

      const { data, error } = await supabase
        .from('indents')
        .insert([{
          id: indentId,
          customer_id: id,
          vehicle_id: newIndent.vehicle_id,
          fuel_type: newIndent.fuel_type,
          quantity: newIndent.quantity,
          amount: newIndent.amount,
          status: 'Pending'
        }])
        .select();

      if (error) throw error;
      
      if (data) {
        // Get the vehicle info for the newly added indent
        const vehicle = vehicles.find(v => v.id === newIndent.vehicle_id);
        const newIndentWithVehicle = {
          ...data[0],
          vehicle_number: vehicle ? vehicle.number : 'Unknown'
        } as Indent;
        
        setIndents([...indents, newIndentWithVehicle]);
        setIndentDialogOpen(false);
        setNewIndent({
          start_number: '',
          end_number: '',
          customer_id: id,
          vehicle_id: '',
          fuel_type: 'Petrol',
          quantity: 0,
          amount: 0
        });
        
        toast({
          title: "Success",
          description: "Fuel indent created successfully"
        });
      }
    } catch (error) {
      console.error('Error adding indent:', error);
      toast({
        title: "Error",
        description: "Failed to create indent. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading customer data...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (!customer) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64">
          <p className="text-muted-foreground mb-4">Customer not found</p>
          <Button asChild>
            <Link to="/customers">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Customers
            </Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center">
          <Link to="/customers">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <h1 className="text-3xl font-bold ml-4">{customer.name}</h1>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Contact Person</CardTitle>
              <CardDescription>Primary contact</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-medium">{customer.contact}</div>
              <div className="text-sm text-muted-foreground">{customer.phone}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Email</CardTitle>
              <CardDescription>Communication channel</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-medium">{customer.email}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Current Balance</CardTitle>
              <CardDescription>Available credit</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">₹{customer.balance?.toLocaleString() || 0}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="details" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Building className="mr-2 h-4 w-4" />
              Customer Details
            </TabsTrigger>
            <TabsTrigger value="vehicles" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Truck className="mr-2 h-4 w-4" />
              Vehicles
            </TabsTrigger>
            <TabsTrigger value="indents" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <FileText className="mr-2 h-4 w-4" />
              Fuel Indents
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="details">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Customer Information</CardTitle>
                  <Button variant="outline" size="sm" className="gap-1">
                    <Edit className="h-4 w-4" />
                    Edit
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-2">Business Name</h3>
                    <p className="font-semibold">{customer.name}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-2">GST Number</h3>
                    <p className="font-semibold">{customer.gst}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-2">Contact Person</h3>
                    <p className="font-semibold">{customer.contact}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-2">Phone Number</h3>
                    <p className="font-semibold">{customer.phone}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-2">Email Address</h3>
                    <p className="font-semibold">{customer.email}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-2">Customer Since</h3>
                    <p className="font-semibold">
                      {customer.created_at 
                        ? new Date(customer.created_at).toLocaleDateString() 
                        : 'Unknown'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="vehicles">
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
          </TabsContent>
          
          <TabsContent value="indents">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Fuel Indents</CardTitle>
                  <Dialog open={indentDialogOpen} onOpenChange={setIndentDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="gap-1">
                        <FileText className="h-4 w-4" />
                        Create Indent
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Fuel Indent</DialogTitle>
                        <DialogDescription>
                          Create a new fuel indent for this customer.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="start_number">Indent Start Number</Label>
                            <Input 
                              id="start_number" 
                              placeholder="e.g. 1001"
                              value={newIndent.start_number}
                              onChange={e => setNewIndent({...newIndent, start_number: e.target.value})}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="end_number">Indent End Number</Label>
                            <Input 
                              id="end_number" 
                              placeholder="e.g. 1010"
                              value={newIndent.end_number}
                              onChange={e => setNewIndent({...newIndent, end_number: e.target.value})}
                            />
                          </div>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="vehicle_id">Vehicle</Label>
                          <select 
                            id="vehicle_id"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={newIndent.vehicle_id as string}
                            onChange={e => setNewIndent({...newIndent, vehicle_id: e.target.value})}
                          >
                            <option value="">Select a vehicle</option>
                            {vehicles.map(vehicle => (
                              <option key={vehicle.id} value={vehicle.id}>
                                {vehicle.number} ({vehicle.type})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="fuel_type">Fuel Type</Label>
                          <select 
                            id="fuel_type"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={newIndent.fuel_type as string}
                            onChange={e => setNewIndent({...newIndent, fuel_type: e.target.value})}
                          >
                            <option value="Petrol">Petrol</option>
                            <option value="Diesel">Diesel</option>
                            <option value="Premium Petrol">Premium Petrol</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="quantity">Quantity (Liters)</Label>
                            <Input 
                              id="quantity" 
                              type="number"
                              placeholder="e.g. 100"
                              value={newIndent.quantity?.toString()}
                              onChange={e => setNewIndent({...newIndent, quantity: parseFloat(e.target.value)})}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="amount">Amount (₹)</Label>
                            <Input 
                              id="amount" 
                              type="number"
                              placeholder="e.g. 9000"
                              value={newIndent.amount?.toString()}
                              onChange={e => setNewIndent({...newIndent, amount: parseFloat(e.target.value)})}
                            />
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIndentDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleAddIndent}>Create Indent</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {indents.length === 0 ? (
                  <div className="py-8 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No fuel indents yet</p>
                    <Button 
                      variant="outline" 
                      className="mt-4" 
                      onClick={() => setIndentDialogOpen(true)}
                    >
                      Create First Indent
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Indent ID</TableHead>
                        <TableHead>Vehicle</TableHead>
                        <TableHead>Fuel Type</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {indents.map((indent) => (
                        <TableRow key={indent.id}>
                          <TableCell className="font-medium">{indent.id}</TableCell>
                          <TableCell>{indent.vehicle_number}</TableCell>
                          <TableCell>{indent.fuel_type}</TableCell>
                          <TableCell>{indent.quantity} L</TableCell>
                          <TableCell>₹{indent.amount.toLocaleString()}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              indent.status === 'Completed' 
                                ? 'bg-green-100 text-green-800' 
                                : indent.status === 'Pending' 
                                ? 'bg-yellow-100 text-yellow-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {indent.status || 'Pending'}
                            </span>
                          </TableCell>
                          <TableCell>
                            {indent.created_at 
                              ? new Date(indent.created_at).toLocaleDateString()
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
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default CustomerDetails;
