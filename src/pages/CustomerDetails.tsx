
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { ArrowLeft, Plus, Edit, Trash, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Customer {
  id: string;
  name: string;
  contact: string;
  phone: string;
  email: string;
  gst: string;
  balance: number;
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
  status: string;
  created_at?: string;
}

const CustomerDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNewCustomer = id === 'new';
  
  const [customer, setCustomer] = useState<Customer>({
    id: '',
    name: '',
    contact: '',
    phone: '',
    email: '',
    gst: '',
    balance: 0
  });
  
  const [isEditing, setIsEditing] = useState(isNewCustomer);
  const [isAddingVehicle, setIsAddingVehicle] = useState(false);
  const [isAddingIndent, setIsAddingIndent] = useState(false);
  const [newVehicle, setNewVehicle] = useState<Partial<Vehicle>>({
    number: '',
    type: 'Truck',
    capacity: ''
  });
  const [newIndent, setNewIndent] = useState<Partial<Indent>>({
    vehicle_id: '',
    fuel_type: 'Diesel',
    quantity: 0,
    amount: 0,
    status: 'Pending'
  });

  // Fetch customer details
  const { data: customerData, isLoading: isLoadingCustomer } = useQuery({
    queryKey: ['customer', id],
    queryFn: async () => {
      if (isNewCustomer) return null;
      
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) throw error;
      return data;
    },
    enabled: !isNewCustomer && !!id
  });

  // Fetch customer vehicles
  const { data: vehicles = [], isLoading: isLoadingVehicles } = useQuery({
    queryKey: ['vehicles', id],
    queryFn: async () => {
      if (isNewCustomer) return [];
      
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('customer_id', id);
        
      if (error) throw error;
      return data || [];
    },
    enabled: !isNewCustomer && !!id
  });

  // Fetch customer indents
  const { data: indents = [], isLoading: isLoadingIndents } = useQuery({
    queryKey: ['indents', id],
    queryFn: async () => {
      if (isNewCustomer) return [];
      
      const { data, error } = await supabase
        .from('indents')
        .select('*')
        .eq('customer_id', id);
        
      if (error) throw error;
      return data || [];
    },
    enabled: !isNewCustomer && !!id
  });

  // Save customer mutation
  const saveCustomerMutation = useMutation({
    mutationFn: async (customerData: Customer) => {
      if (isNewCustomer) {
        const { data, error } = await supabase
          .from('customers')
          .insert([customerData])
          .select();
          
        if (error) throw error;
        return data?.[0];
      } else {
        const { data, error } = await supabase
          .from('customers')
          .update(customerData)
          .eq('id', id)
          .select();
          
        if (error) throw error;
        return data?.[0];
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer', data?.id] });
      toast({
        title: isNewCustomer ? "Customer Created" : "Customer Updated",
        description: `${customer.name} has been ${isNewCustomer ? "created" : "updated"} successfully.`,
      });
      if (isNewCustomer && data) {
        navigate(`/customers/${data.id}`);
      } else {
        setIsEditing(false);
      }
    },
    onError: (error) => {
      console.error('Error saving customer:', error);
      toast({
        title: "Error",
        description: `Failed to ${isNewCustomer ? "create" : "update"} customer. Please try again.`,
        variant: "destructive"
      });
    }
  });

  // Add vehicle mutation
  const addVehicleMutation = useMutation({
    mutationFn: async (vehicleData: Partial<Vehicle>) => {
      const { data, error } = await supabase
        .from('vehicles')
        .insert([{ ...vehicleData, customer_id: id }])
        .select();
        
      if (error) throw error;
      return data?.[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles', id] });
      setIsAddingVehicle(false);
      setNewVehicle({
        number: '',
        type: 'Truck',
        capacity: ''
      });
      toast({
        title: "Vehicle Added",
        description: "The vehicle has been added successfully."
      });
    },
    onError: (error) => {
      console.error('Error adding vehicle:', error);
      toast({
        title: "Error",
        description: "Failed to add vehicle. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Add indent mutation
  const addIndentMutation = useMutation({
    mutationFn: async (indentData: Partial<Indent>) => {
      // Generate a unique ID for the indent (e.g., IND001, IND002, etc.)
      const indentId = `IND${Math.floor(Math.random() * 10000).toString().padStart(3, '0')}`;
      
      const { data, error } = await supabase
        .from('indents')
        .insert([{ 
          ...indentData, 
          id: indentId,
          customer_id: id 
        }])
        .select();
        
      if (error) throw error;
      return data?.[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['indents', id] });
      setIsAddingIndent(false);
      setNewIndent({
        vehicle_id: '',
        fuel_type: 'Diesel',
        quantity: 0,
        amount: 0,
        status: 'Pending'
      });
      toast({
        title: "Indent Created",
        description: "The fuel indent has been created successfully."
      });
    },
    onError: (error) => {
      console.error('Error creating indent:', error);
      toast({
        title: "Error",
        description: "Failed to create indent. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Delete vehicle mutation
  const deleteVehicleMutation = useMutation({
    mutationFn: async (vehicleId: string) => {
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', vehicleId);
        
      if (error) throw error;
      return vehicleId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles', id] });
      toast({
        title: "Vehicle Deleted",
        description: "The vehicle has been deleted successfully."
      });
    },
    onError: (error) => {
      console.error('Error deleting vehicle:', error);
      toast({
        title: "Error",
        description: "Failed to delete vehicle. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Update customer state when data is loaded
  useEffect(() => {
    if (customerData) {
      setCustomer(customerData);
    }
  }, [customerData]);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCustomer(prev => ({
      ...prev,
      [name]: name === 'balance' ? parseFloat(value) || 0 : value
    }));
  };

  // Handle save customer
  const handleSaveCustomer = () => {
    // Validate required fields
    if (!customer.name || !customer.contact || !customer.phone || !customer.gst) {
      toast({
        title: "Missing Information",
        description: "Please fill all required fields.",
        variant: "destructive"
      });
      return;
    }
    
    saveCustomerMutation.mutate(customer);
  };

  // Handle add vehicle
  const handleAddVehicle = () => {
    if (!newVehicle.number || !newVehicle.capacity) {
      toast({
        title: "Missing Information",
        description: "Please fill all required fields for the vehicle.",
        variant: "destructive"
      });
      return;
    }
    
    addVehicleMutation.mutate(newVehicle);
  };

  // Handle add indent
  const handleAddIndent = () => {
    if (!newIndent.vehicle_id || !newIndent.quantity || !newIndent.amount) {
      toast({
        title: "Missing Information",
        description: "Please fill all required fields for the indent.",
        variant: "destructive"
      });
      return;
    }
    
    addIndentMutation.mutate(newIndent);
  };

  // Handle delete vehicle
  const handleDeleteVehicle = (vehicleId: string) => {
    if (confirm("Are you sure you want to delete this vehicle?")) {
      deleteVehicleMutation.mutate(vehicleId);
    }
  };

  if (isLoadingCustomer && !isNewCustomer) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading customer details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigate('/customers')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold md:text-3xl">
            {isNewCustomer ? 'Create New Customer' : customer.name}
          </h1>
        </div>
        
        {!isNewCustomer && !isEditing && (
          <Button onClick={() => setIsEditing(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Details
          </Button>
        )}
      </div>

      {isNewCustomer || isEditing ? (
        <Card>
          <CardHeader>
            <CardTitle>{isNewCustomer ? 'Customer Information' : 'Edit Customer'}</CardTitle>
            <CardDescription>
              {isNewCustomer ? 'Enter details for the new customer' : 'Update customer information'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Company Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={customer.name}
                  onChange={handleChange}
                  placeholder="Enter company name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contact">Contact Person *</Label>
                <Input
                  id="contact"
                  name="contact"
                  value={customer.contact}
                  onChange={handleChange}
                  placeholder="Enter contact person name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={customer.phone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  value={customer.email}
                  onChange={handleChange}
                  placeholder="Enter email address"
                  type="email"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="gst">GST Number *</Label>
                <Input
                  id="gst"
                  name="gst"
                  value={customer.gst}
                  onChange={handleChange}
                  placeholder="Enter GST number"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="balance">Current Balance (₹)</Label>
                <Input
                  id="balance"
                  name="balance"
                  value={customer.balance.toString()}
                  onChange={handleChange}
                  placeholder="Enter current balance"
                  type="number"
                  step="0.01"
                />
              </div>
            </div>
            
            <div className="mt-6 flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  if (isNewCustomer) {
                    navigate('/customers');
                  } else {
                    setIsEditing(false);
                    if (customerData) {
                      setCustomer(customerData);
                    }
                  }
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveCustomer}>
                <Save className="mr-2 h-4 w-4" />
                {isNewCustomer ? 'Create Customer' : 'Save Changes'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="details">
          <TabsList className="mb-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="vehicles">Vehicles ({vehicles.length})</TabsTrigger>
            <TabsTrigger value="indents">Indents ({indents.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details">
            <Card>
              <CardContent className="pt-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Company Name</h3>
                    <p className="text-lg">{customer.name}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Contact Person</h3>
                    <p className="text-lg">{customer.contact}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Phone</h3>
                    <p className="text-lg">{customer.phone}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
                    <p className="text-lg">{customer.email || 'Not provided'}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">GST Number</h3>
                    <p className="text-lg">{customer.gst}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Current Balance</h3>
                    <p className="text-lg font-semibold">₹{customer.balance?.toFixed(2) || '0.00'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="vehicles">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle>Vehicles</CardTitle>
                  <CardDescription>Manage vehicles for this customer</CardDescription>
                </div>
                <Dialog open={isAddingVehicle} onOpenChange={setIsAddingVehicle}>
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
                        Enter the details of the new vehicle for {customer.name}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="number">Vehicle Number *</Label>
                        <Input
                          id="number"
                          value={newVehicle.number}
                          onChange={(e) => setNewVehicle({ ...newVehicle, number: e.target.value })}
                          placeholder="e.g., KA-01-AB-1234"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="type">Vehicle Type *</Label>
                        <select 
                          id="type"
                          className="w-full rounded-md border border-input bg-background px-3 py-2"
                          value={newVehicle.type}
                          onChange={(e) => setNewVehicle({ ...newVehicle, type: e.target.value })}
                        >
                          <option value="Truck">Truck</option>
                          <option value="Pickup">Pickup</option>
                          <option value="Tanker">Tanker</option>
                          <option value="Car">Car</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="capacity">Capacity *</Label>
                        <Input
                          id="capacity"
                          value={newVehicle.capacity}
                          onChange={(e) => setNewVehicle({ ...newVehicle, capacity: e.target.value })}
                          placeholder="e.g., 10 Ton or 5000 L"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddingVehicle(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddVehicle}>
                        Add Vehicle
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {isLoadingVehicles ? (
                  <div className="py-8 text-center">Loading vehicles...</div>
                ) : vehicles.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vehicle Number</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Capacity</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vehicles.map((vehicle) => (
                        <TableRow key={vehicle.id}>
                          <TableCell className="font-medium">{vehicle.number}</TableCell>
                          <TableCell>{vehicle.type}</TableCell>
                          <TableCell>{vehicle.capacity}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button variant="ghost" size="icon">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleDeleteVehicle(vehicle.id)}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    No vehicles found for this customer. Add a vehicle using the button above.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="indents">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle>Fuel Indents</CardTitle>
                  <CardDescription>Manage fuel indents for this customer</CardDescription>
                </div>
                <Dialog open={isAddingIndent} onOpenChange={setIsAddingIndent}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Indent
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Indent</DialogTitle>
                      <DialogDescription>
                        Create a new fuel indent for {customer.name}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="vehicle_id">Vehicle *</Label>
                        <select
                          id="vehicle_id"
                          className="w-full rounded-md border border-input bg-background px-3 py-2"
                          value={newIndent.vehicle_id}
                          onChange={(e) => setNewIndent({ ...newIndent, vehicle_id: e.target.value })}
                        >
                          <option value="">Select vehicle</option>
                          {vehicles.map((vehicle) => (
                            <option key={vehicle.id} value={vehicle.id}>
                              {vehicle.number} ({vehicle.type})
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="fuel_type">Fuel Type *</Label>
                        <select
                          id="fuel_type"
                          className="w-full rounded-md border border-input bg-background px-3 py-2"
                          value={newIndent.fuel_type}
                          onChange={(e) => setNewIndent({ ...newIndent, fuel_type: e.target.value })}
                        >
                          <option value="Petrol">Petrol</option>
                          <option value="Diesel">Diesel</option>
                        </select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="quantity">Quantity (Liters) *</Label>
                        <Input
                          id="quantity"
                          type="number"
                          min="1"
                          value={newIndent.quantity || ''}
                          onChange={(e) => setNewIndent({ 
                            ...newIndent, 
                            quantity: parseInt(e.target.value) || 0,
                            // Auto-calculate amount based on a sample rate of ₹90/liter
                            amount: (parseInt(e.target.value) || 0) * 90
                          })}
                          placeholder="Enter quantity in liters"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="amount">Amount (₹) *</Label>
                        <Input
                          id="amount"
                          type="number"
                          min="1"
                          value={newIndent.amount || ''}
                          onChange={(e) => setNewIndent({ ...newIndent, amount: parseInt(e.target.value) || 0 })}
                          placeholder="Enter amount"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <select
                          id="status"
                          className="w-full rounded-md border border-input bg-background px-3 py-2"
                          value={newIndent.status}
                          onChange={(e) => setNewIndent({ ...newIndent, status: e.target.value })}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Approved">Approved</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddingIndent(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddIndent}>
                        Create Indent
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {isLoadingIndents ? (
                  <div className="py-8 text-center">Loading indents...</div>
                ) : indents.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Indent ID</TableHead>
                        <TableHead>Vehicle</TableHead>
                        <TableHead>Fuel Type</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {indents.map((indent) => {
                        const vehicle = vehicles.find(v => v.id === indent.vehicle_id);
                        return (
                          <TableRow key={indent.id}>
                            <TableCell className="font-medium">{indent.id}</TableCell>
                            <TableCell>{vehicle ? vehicle.number : 'Unknown'}</TableCell>
                            <TableCell>{indent.fuel_type}</TableCell>
                            <TableCell>{indent.quantity} L</TableCell>
                            <TableCell>₹{indent.amount.toFixed(2)}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                indent.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                indent.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                indent.status === 'Approved' ? 'bg-blue-100 text-blue-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {indent.status}
                              </span>
                            </TableCell>
                            <TableCell>
                              {indent.created_at ? new Date(indent.created_at).toLocaleDateString() : 'N/A'}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    No indents found for this customer. Create an indent using the button above.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default CustomerDetails;
