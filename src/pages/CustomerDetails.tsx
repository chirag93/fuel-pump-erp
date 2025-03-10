
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { ArrowLeft, Building, Truck, FileText, Plus, CalendarDays, ReceiptText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Customer {
  id: string;
  name: string;
  contact: string;
  phone: string;
  email: string;
  gst: string;
  balance: number;
  created_at: string;
}

interface Vehicle {
  id: string;
  customer_id: string;
  number: string;
  type: string;
  capacity: string;
  created_at: string;
}

interface Indent {
  id: string;
  customer_id: string;
  vehicle_id: string;
  fuel_type: string;
  quantity: number;
  amount: number;
  status: string;
  created_at: string;
  vehicle_number?: string;
}

const CustomerDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [indents, setIndents] = useState<Indent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("details");
  
  // Dialog states
  const [vehicleDialogOpen, setVehicleDialogOpen] = useState(false);
  const [indentDialogOpen, setIndentDialogOpen] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    number: '',
    type: '',
    capacity: ''
  });
  const [newIndent, setNewIndent] = useState({
    vehicle_id: '',
    fuel_type: 'Petrol',
    quantity: '',
    amount: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Fetch customer data
  useEffect(() => {
    const fetchCustomerData = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        // Fetch customer details
        const { data: customerData, error: customerError } = await supabase
          .from('customers')
          .select('*')
          .eq('id', id)
          .single();
        
        if (customerError) throw customerError;
        setCustomer(customerData);
        
        // Fetch vehicles
        const { data: vehicleData, error: vehicleError } = await supabase
          .from('vehicles')
          .select('*')
          .eq('customer_id', id);
        
        if (vehicleError) throw vehicleError;
        setVehicles(vehicleData || []);
        
        // Fetch indents with vehicle info
        const { data: indentData, error: indentError } = await supabase
          .from('indents')
          .select(`
            *,
            vehicles(number)
          `)
          .eq('customer_id', id);
        
        if (indentError) throw indentError;
        
        // Format indent data with vehicle numbers
        const formattedIndents = indentData?.map(indent => ({
          ...indent,
          vehicle_number: indent.vehicles?.number || 'Unknown'
        })) || [];
        
        setIndents(formattedIndents);
      } catch (error) {
        console.error('Error fetching customer data:', error);
        toast({
          title: "Error",
          description: "Failed to load customer data",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCustomerData();
  }, [id]);
  
  // Handle vehicle creation
  const handleVehicleSubmit = async () => {
    // Validate form
    const newErrors: Record<string, string> = {};
    if (!newVehicle.number.trim()) newErrors.number = "Vehicle number is required";
    if (!newVehicle.type.trim()) newErrors.type = "Vehicle type is required";
    if (!newVehicle.capacity.trim()) newErrors.capacity = "Capacity is required";
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    try {
      // Insert new vehicle
      const { data, error } = await supabase
        .from('vehicles')
        .insert({
          customer_id: id,
          number: newVehicle.number,
          type: newVehicle.type,
          capacity: newVehicle.capacity
        })
        .select();
      
      if (error) throw error;
      
      // Add the new vehicle to the list
      if (data && data.length > 0) {
        setVehicles([...vehicles, data[0]]);
      }
      
      // Reset form and close dialog
      setNewVehicle({ number: '', type: '', capacity: '' });
      setVehicleDialogOpen(false);
      
      toast({
        title: "Vehicle added",
        description: "Vehicle has been added successfully"
      });
    } catch (error) {
      console.error('Error adding vehicle:', error);
      toast({
        title: "Error",
        description: "Failed to add vehicle",
        variant: "destructive"
      });
    }
  };
  
  // Handle indent creation
  const handleIndentSubmit = async () => {
    // Validate form
    const newErrors: Record<string, string> = {};
    if (!newIndent.vehicle_id) newErrors.vehicle_id = "Please select a vehicle";
    if (!newIndent.quantity) newErrors.quantity = "Quantity is required";
    if (!newIndent.amount) newErrors.amount = "Amount is required";
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    try {
      // Generate unique indent ID
      const indentId = `IND${new Date().getTime()}`;
      
      // Insert new indent
      const { data, error } = await supabase
        .from('indents')
        .insert({
          id: indentId,
          customer_id: id,
          vehicle_id: newIndent.vehicle_id,
          fuel_type: newIndent.fuel_type,
          quantity: parseFloat(newIndent.quantity.toString()),
          amount: parseFloat(newIndent.amount.toString()),
          status: 'Pending'
        })
        .select(`
          *,
          vehicles(number)
        `);
      
      if (error) throw error;
      
      // Add the new indent to the list
      if (data && data.length > 0) {
        const newIndentWithVehicle = {
          ...data[0],
          vehicle_number: data[0].vehicles?.number || 'Unknown'
        };
        setIndents([...indents, newIndentWithVehicle]);
      }
      
      // Reset form and close dialog
      setNewIndent({ vehicle_id: '', fuel_type: 'Petrol', quantity: '', amount: '' });
      setIndentDialogOpen(false);
      
      toast({
        title: "Indent created",
        description: "Fuel indent has been created successfully"
      });
    } catch (error) {
      console.error('Error creating indent:', error);
      toast({
        title: "Error",
        description: "Failed to create indent",
        variant: "destructive"
      });
    }
  };
  
  // Handle form input changes for vehicle
  const handleVehicleChange = (field: string, value: string) => {
    setNewVehicle({ ...newVehicle, [field]: value });
    if (errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
  };
  
  // Handle form input changes for indent
  const handleIndentChange = (field: string, value: string) => {
    setNewIndent({ ...newIndent, [field]: value });
    if (errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin mb-2 mx-auto w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
          <p>Loading customer data...</p>
        </div>
      </div>
    );
  }
  
  if (!customer) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-bold">Customer not found</h2>
        <p className="mt-2 text-muted-foreground">The customer you're looking for doesn't exist or has been removed.</p>
        <Button className="mt-4" onClick={() => navigate('/customers')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Customers
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center">
          <Button variant="ghost" onClick={() => navigate('/customers')} className="mr-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold flex items-center">
            <Building className="mr-2 h-6 w-6 text-primary" />
            {customer.name}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={() => setVehicleDialogOpen(true)}
            variant="outline"
            className="flex-shrink-0"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Vehicle
          </Button>
          <Button 
            onClick={() => setIndentDialogOpen(true)}
            className="flex-shrink-0"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Indent
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-md mb-4">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
          <TabsTrigger value="indents">Indents</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building className="mr-2 h-5 w-5 text-muted-foreground" />
                Customer Information
              </CardTitle>
              <CardDescription>Details about {customer.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Contact Person</h3>
                  <p className="text-lg font-medium">{customer.contact}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Phone</h3>
                  <p className="text-lg font-medium">{customer.phone}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Email</h3>
                  <p className="text-lg font-medium">{customer.email}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">GST Number</h3>
                  <p className="text-lg font-medium">{customer.gst}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Account Balance</h3>
                  <p className={`text-lg font-medium ${customer.balance < 0 ? 'text-red-500' : ''}`}>
                    ₹{customer.balance?.toLocaleString() || '0'}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Customer Since</h3>
                  <p className="text-lg font-medium">
                    {new Date(customer.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Vehicles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{vehicles.length}</div>
                <p className="text-sm text-muted-foreground mt-1">Registered vehicles</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Indents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{indents.length}</div>
                <p className="text-sm text-muted-foreground mt-1">Total fuel indents</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Pending Amount</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-500">
                  ₹{(customer.balance < 0 ? -customer.balance : 0).toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground mt-1">Outstanding balance</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="vehicles" className="space-y-4">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <Truck className="mr-2 h-5 w-5 text-muted-foreground" />
                    Vehicles
                  </CardTitle>
                  <CardDescription>List of registered vehicles for this customer</CardDescription>
                </div>
                <Button size="sm" onClick={() => setVehicleDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Vehicle
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {vehicles.length === 0 ? (
                <div className="text-center py-6">
                  <Truck className="mx-auto h-10 w-10 text-muted-foreground opacity-50 mb-2" />
                  <p className="text-muted-foreground">No vehicles registered yet.</p>
                  <Button variant="outline" className="mt-4" onClick={() => setVehicleDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add first vehicle
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vehicle Number</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Capacity</TableHead>
                        <TableHead>Added On</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vehicles.map((vehicle) => (
                        <TableRow key={vehicle.id}>
                          <TableCell className="font-medium">{vehicle.number}</TableCell>
                          <TableCell>{vehicle.type}</TableCell>
                          <TableCell>{vehicle.capacity}</TableCell>
                          <TableCell>
                            {new Date(vehicle.created_at).toLocaleDateString('en-IN')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="indents" className="space-y-4">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <FileText className="mr-2 h-5 w-5 text-muted-foreground" />
                    Fuel Indents
                  </CardTitle>
                  <CardDescription>List of fuel indents raised by this customer</CardDescription>
                </div>
                <Button size="sm" onClick={() => setIndentDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Indent
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {indents.length === 0 ? (
                <div className="text-center py-6">
                  <FileText className="mx-auto h-10 w-10 text-muted-foreground opacity-50 mb-2" />
                  <p className="text-muted-foreground">No indents created yet.</p>
                  <Button variant="outline" className="mt-4" onClick={() => setIndentDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create first indent
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Indent ID</TableHead>
                        <TableHead>Vehicle</TableHead>
                        <TableHead>Fuel</TableHead>
                        <TableHead>Quantity (L)</TableHead>
                        <TableHead>Amount (₹)</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {indents.map((indent) => (
                        <TableRow key={indent.id}>
                          <TableCell className="font-medium">{indent.id}</TableCell>
                          <TableCell>{indent.vehicle_number}</TableCell>
                          <TableCell>{indent.fuel_type}</TableCell>
                          <TableCell>{indent.quantity}</TableCell>
                          <TableCell>₹{indent.amount.toLocaleString()}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              indent.status === 'Completed' 
                                ? 'bg-green-100 text-green-800' 
                                : indent.status === 'Cancelled'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {indent.status}
                            </span>
                          </TableCell>
                          <TableCell>
                            {new Date(indent.created_at).toLocaleDateString('en-IN')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Add Vehicle Dialog */}
      <Dialog open={vehicleDialogOpen} onOpenChange={setVehicleDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Vehicle</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="vehicle-number">Vehicle Number</Label>
              <Input
                id="vehicle-number"
                value={newVehicle.number}
                onChange={(e) => handleVehicleChange('number', e.target.value)}
                placeholder="e.g., KA-01-AB-1234"
                className={errors.number ? "border-red-500" : ""}
              />
              {errors.number && <p className="text-sm text-red-500">{errors.number}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="vehicle-type">Vehicle Type</Label>
              <Input
                id="vehicle-type"
                value={newVehicle.type}
                onChange={(e) => handleVehicleChange('type', e.target.value)}
                placeholder="e.g., Truck, Tanker"
                className={errors.type ? "border-red-500" : ""}
              />
              {errors.type && <p className="text-sm text-red-500">{errors.type}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="vehicle-capacity">Capacity</Label>
              <Input
                id="vehicle-capacity"
                value={newVehicle.capacity}
                onChange={(e) => handleVehicleChange('capacity', e.target.value)}
                placeholder="e.g., 12 Ton"
                className={errors.capacity ? "border-red-500" : ""}
              />
              {errors.capacity && <p className="text-sm text-red-500">{errors.capacity}</p>}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setVehicleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleVehicleSubmit}>
              Add Vehicle
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Create Indent Dialog */}
      <Dialog open={indentDialogOpen} onOpenChange={setIndentDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create Fuel Indent</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="indent-vehicle">Select Vehicle</Label>
              <Select
                value={newIndent.vehicle_id}
                onValueChange={(value) => handleIndentChange('vehicle_id', value)}
              >
                <SelectTrigger id="indent-vehicle" className={errors.vehicle_id ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select a vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.number} ({vehicle.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.vehicle_id && <p className="text-sm text-red-500">{errors.vehicle_id}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="indent-fuel">Fuel Type</Label>
              <Select
                value={newIndent.fuel_type}
                onValueChange={(value) => handleIndentChange('fuel_type', value)}
              >
                <SelectTrigger id="indent-fuel">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Petrol">Petrol</SelectItem>
                  <SelectItem value="Diesel">Diesel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="indent-quantity">Quantity (Liters)</Label>
              <Input
                id="indent-quantity"
                type="number"
                value={newIndent.quantity}
                onChange={(e) => handleIndentChange('quantity', e.target.value)}
                placeholder="Enter quantity in liters"
                className={errors.quantity ? "border-red-500" : ""}
              />
              {errors.quantity && <p className="text-sm text-red-500">{errors.quantity}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="indent-amount">Amount (₹)</Label>
              <Input
                id="indent-amount"
                type="number"
                value={newIndent.amount}
                onChange={(e) => handleIndentChange('amount', e.target.value)}
                placeholder="Enter amount in rupees"
                className={errors.amount ? "border-red-500" : ""}
              />
              {errors.amount && <p className="text-sm text-red-500">{errors.amount}</p>}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIndentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleIndentSubmit}>
              Create Indent
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerDetails;
