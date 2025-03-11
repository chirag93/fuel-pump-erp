
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Building, Edit, Loader2, Truck, FileText, Book } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

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
  indent_number: string;
  date: string;
}

interface IndentBooklet {
  id: string;
  customer_id: string;
  start_number: string;
  end_number: string;
  issued_date: string;
  total_indents: number;
  used_indents: number;
  status: 'Active' | 'Completed' | 'Cancelled';
  created_at?: string;
}

interface Transaction {
  id: string;
  customer_id: string;
  vehicle_id: string;
  staff_id: string;
  date: string;
  fuel_type: string;
  amount: number;
  quantity: number;
  payment_method: string;
  indent_id: string | null;
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

interface NewBookletData {
  start_number: string;
  end_number: string;
  customer_id: string;
  issued_date: string;
}

const CustomerDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [indents, setIndents] = useState<Indent[]>([]);
  const [indentBooklets, setIndentBooklets] = useState<IndentBooklet[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [newVehicle, setNewVehicle] = useState<Partial<Vehicle>>({
    customer_id: id,
    number: '',
    type: 'Truck',
    capacity: ''
  });

  const [newBooklet, setNewBooklet] = useState<Partial<NewBookletData>>({
    customer_id: id,
    start_number: '',
    end_number: '',
    issued_date: new Date().toISOString().split('T')[0]
  });

  const [newIndent, setNewIndent] = useState<Partial<NewIndentData>>({
    start_number: '',
    end_number: '',
    customer_id: id,
    vehicle_id: '',
    fuel_type: 'Petrol',
    quantity: 0,
    amount: 0
  });

  const [vehicleDialogOpen, setVehicleDialogOpen] = useState(false);
  const [indentDialogOpen, setIndentDialogOpen] = useState(false);
  const [bookletDialogOpen, setBookletDialogOpen] = useState(false);

  useEffect(() => {
    if (id) {
      fetchCustomerData(id);
      fetchVehicles(id);
      fetchIndents(id);
      fetchIndentBooklets(id);
      fetchTransactions(id);
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

  const fetchIndentBooklets = async (customerId: string) => {
    try {
      const { data, error } = await supabase
        .from('indent_booklets')
        .select('*')
        .eq('customer_id', customerId);

      if (error) throw error;
      
      setIndentBooklets(data || []);
    } catch (error) {
      console.error('Error fetching indent booklets:', error);
    }
  };

  const fetchTransactions = async (customerId: string) => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*, vehicles(number)')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      
      // Process data to include vehicle number
      const processedTransactions = data.map(transaction => ({
        ...transaction,
        vehicle_number: transaction.vehicles ? transaction.vehicles.number : 'Unknown',
      }));
      
      setTransactions(processedTransactions as Transaction[]);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
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

      const { data, error } = await supabase
        .from('vehicles')
        .insert([{
          customer_id: id,
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

  const handleAddBooklet = async () => {
    try {
      if (!newBooklet.start_number || !newBooklet.end_number || !newBooklet.issued_date) {
        toast({
          title: "Missing information",
          description: "Please fill all required fields",
          variant: "destructive"
        });
        return;
      }

      const startNum = parseInt(newBooklet.start_number);
      const endNum = parseInt(newBooklet.end_number);

      if (isNaN(startNum) || isNaN(endNum) || startNum >= endNum) {
        toast({
          title: "Invalid range",
          description: "End number must be greater than start number",
          variant: "destructive"
        });
        return;
      }

      const totalIndents = endNum - startNum + 1;

      const { data, error } = await supabase
        .from('indent_booklets')
        .insert([{
          customer_id: id,
          start_number: newBooklet.start_number,
          end_number: newBooklet.end_number,
          issued_date: newBooklet.issued_date,
          total_indents: totalIndents,
          used_indents: 0,
          status: 'Active'
        }])
        .select();

      if (error) throw error;
      
      if (data) {
        setIndentBooklets([...indentBooklets, data[0] as IndentBooklet]);
        setBookletDialogOpen(false);
        setNewBooklet({
          customer_id: id,
          start_number: '',
          end_number: '',
          issued_date: new Date().toISOString().split('T')[0]
        });
        
        toast({
          title: "Success",
          description: "Indent booklet issued successfully"
        });
      }
    } catch (error) {
      console.error('Error adding indent booklet:', error);
      toast({
        title: "Error",
        description: "Failed to issue indent booklet. Please try again.",
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
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading customer data...</span>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-muted-foreground mb-4">Customer not found</p>
        <Button asChild>
          <Link to="/customers">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Customers
          </Link>
        </Button>
      </div>
    );
  }

  return (
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
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="details" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Building className="mr-2 h-4 w-4" />
            Customer Details
          </TabsTrigger>
          <TabsTrigger value="vehicles" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Truck className="mr-2 h-4 w-4" />
            Vehicles
          </TabsTrigger>
          <TabsTrigger value="booklets" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Book className="mr-2 h-4 w-4" />
            Indent Booklets
          </TabsTrigger>
          <TabsTrigger value="transactions" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <FileText className="mr-2 h-4 w-4" />
            Transactions
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
        
        <TabsContent value="booklets">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Indent Booklets</CardTitle>
                <Dialog open={bookletDialogOpen} onOpenChange={setBookletDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-1">
                      <Book className="h-4 w-4" />
                      Issue Booklet
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Issue New Indent Booklet</DialogTitle>
                      <DialogDescription>
                        Issue a new indent booklet to this customer
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="issued_date">Issue Date</Label>
                        <Input 
                          id="issued_date" 
                          type="date"
                          value={newBooklet.issued_date}
                          onChange={e => setNewBooklet({...newBooklet, issued_date: e.target.value})}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="start_number">Start Number</Label>
                          <Input 
                            id="start_number" 
                            placeholder="e.g. 1001"
                            value={newBooklet.start_number}
                            onChange={e => setNewBooklet({...newBooklet, start_number: e.target.value})}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="end_number">End Number</Label>
                          <Input 
                            id="end_number" 
                            placeholder="e.g. 1100"
                            value={newBooklet.end_number}
                            onChange={e => setNewBooklet({...newBooklet, end_number: e.target.value})}
                          />
                        </div>
                      </div>
                      {newBooklet.start_number && newBooklet.end_number && !isNaN(parseInt(newBooklet.start_number)) && !isNaN(parseInt(newBooklet.end_number)) && (
                        <div className="text-sm text-muted-foreground">
                          This booklet will contain {Math.max(0, parseInt(newBooklet.end_number) - parseInt(newBooklet.start_number) + 1)} indent slips.
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setBookletDialogOpen(false)}>Cancel</Button>
                      <Button onClick={handleAddBooklet}>Issue Booklet</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {indentBooklets.length === 0 ? (
                <div className="py-8 text-center">
                  <Book className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No indent booklets issued yet</p>
                  <Button 
                    variant="outline" 
                    className="mt-4" 
                    onClick={() => setBookletDialogOpen(true)}
                  >
                    Issue First Booklet
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Range</TableHead>
                      <TableHead>Issued Date</TableHead>
                      <TableHead>Used</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {indentBooklets.map((booklet) => (
                      <TableRow key={booklet.id}>
                        <TableCell className="font-medium">{booklet.start_number} - {booklet.end_number}</TableCell>
                        <TableCell>{new Date(booklet.issued_date).toLocaleDateString()}</TableCell>
                        <TableCell>{booklet.used_indents} / {booklet.total_indents}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            booklet.status === 'Completed' 
                              ? 'bg-green-100 text-green-800' 
                              : booklet.status === 'Active' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {booklet.status}
                          </span>
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
        
        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Fuel Transactions</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="py-8 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No transactions yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Fuel Type</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Indent ID</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                        <TableCell>{transaction.vehicle_number}</TableCell>
                        <TableCell>{transaction.fuel_type}</TableCell>
                        <TableCell>{transaction.quantity} L</TableCell>
                        <TableCell>₹{transaction.amount.toLocaleString()}</TableCell>
                        <TableCell className="capitalize">{transaction.payment_method}</TableCell>
                        <TableCell>{transaction.indent_id || '-'}</TableCell>
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
  );
};

export default CustomerDetails;
