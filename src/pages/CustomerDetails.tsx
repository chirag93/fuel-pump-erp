
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/components/ui/use-toast';
import { 
  ArrowLeft, Car, ClipboardList, CreditCard, User, Plus, File, Loader2 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const CustomerDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<any>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [indents, setIndents] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog states
  const [vehicleDialogOpen, setVehicleDialogOpen] = useState(false);
  const [indentDialogOpen, setIndentDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  
  // Form states
  const [vehicleForm, setVehicleForm] = useState({
    number: '',
    type: '',
    capacity: ''
  });
  
  const [indentForm, setIndentForm] = useState({
    vehicle_id: '',
    fuel_type: 'Petrol',
    quantity: '',
    amount: '',
  });
  
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_method: 'Cash',
  });
  
  // Fetch customer data
  useEffect(() => {
    const fetchCustomerData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        // Fetch customer
        const { data: customerData, error: customerError } = await supabase
          .from('customers')
          .select('*')
          .eq('id', id)
          .single();
        
        if (customerError) throw customerError;
        setCustomer(customerData);
        
        // Fetch vehicles
        const { data: vehiclesData, error: vehiclesError } = await supabase
          .from('vehicles')
          .select('*')
          .eq('customer_id', id);
        
        if (vehiclesError) throw vehiclesError;
        setVehicles(vehiclesData || []);
        
        // Fetch indents
        const { data: indentsData, error: indentsError } = await supabase
          .from('indents')
          .select('*, vehicles(number)')
          .eq('customer_id', id);
        
        if (indentsError) throw indentsError;
        setIndents(indentsData || []);
        
        // Fetch transactions
        const { data: transactionsData, error: transactionsError } = await supabase
          .from('transactions')
          .select('*, vehicles(number)')
          .eq('customer_id', id)
          .order('created_at', { ascending: false });
        
        if (transactionsError) throw transactionsError;
        setTransactions(transactionsData || []);
        
      } catch (error) {
        console.error('Error fetching customer data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load customer data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchCustomerData();
  }, [id]);
  
  // Update indent amount based on quantity
  useEffect(() => {
    if (indentForm.quantity) {
      // Get current fuel price - in a real app this would be fetched from the database
      const fuelPrices = {
        'Petrol': 102.5,
        'Diesel': 89.7,
        'Premium Petrol': 105.8
      };
      
      const price = fuelPrices[indentForm.fuel_type] || 100;
      const amount = Number(indentForm.quantity) * price;
      setIndentForm({
        ...indentForm,
        amount: amount.toFixed(2)
      });
    }
  }, [indentForm.quantity, indentForm.fuel_type]);
  
  const handleAddVehicle = async () => {
    try {
      if (!vehicleForm.number || !vehicleForm.type || !vehicleForm.capacity) {
        toast({
          title: 'Validation Error',
          description: 'Please fill all required fields',
          variant: 'destructive',
        });
        return;
      }
      
      const { data, error } = await supabase
        .from('vehicles')
        .insert([
          {
            customer_id: id,
            number: vehicleForm.number,
            type: vehicleForm.type,
            capacity: vehicleForm.capacity
          }
        ])
        .select();
      
      if (error) throw error;
      
      if (data) {
        setVehicles([...vehicles, data[0]]);
        setVehicleDialogOpen(false);
        setVehicleForm({ number: '', type: '', capacity: '' });
        
        toast({
          title: 'Vehicle Added',
          description: 'Vehicle has been added successfully',
        });
      }
    } catch (error) {
      console.error('Error adding vehicle:', error);
      toast({
        title: 'Error',
        description: 'Failed to add vehicle',
        variant: 'destructive',
      });
    }
  };
  
  const handleCreateIndent = async () => {
    try {
      if (!indentForm.vehicle_id || !indentForm.quantity || !indentForm.amount) {
        toast({
          title: 'Validation Error',
          description: 'Please fill all required fields',
          variant: 'destructive',
        });
        return;
      }
      
      const indentId = `IND${Date.now()}`;
      
      const { data, error } = await supabase
        .from('indents')
        .insert([
          {
            id: indentId,
            customer_id: id,
            vehicle_id: indentForm.vehicle_id,
            fuel_type: indentForm.fuel_type,
            quantity: Number(indentForm.quantity),
            amount: Number(indentForm.amount),
            status: 'Pending'
          }
        ])
        .select('*, vehicles(number)');
      
      if (error) throw error;
      
      if (data) {
        setIndents([...indents, data[0]]);
        setIndentDialogOpen(false);
        setIndentForm({
          vehicle_id: '',
          fuel_type: 'Petrol',
          quantity: '',
          amount: ''
        });
        
        toast({
          title: 'Indent Created',
          description: 'Fuel indent has been created successfully',
        });
      }
    } catch (error) {
      console.error('Error creating indent:', error);
      toast({
        title: 'Error',
        description: 'Failed to create indent',
        variant: 'destructive',
      });
    }
  };
  
  const handleAddPayment = async () => {
    try {
      if (!paymentForm.amount || Number(paymentForm.amount) <= 0) {
        toast({
          title: 'Validation Error',
          description: 'Please enter a valid amount',
          variant: 'destructive',
        });
        return;
      }
      
      const transactionId = `PAY${Date.now()}`;
      const amount = Number(paymentForm.amount);
      
      // Create a payment transaction
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert([
          {
            id: transactionId,
            customer_id: id,
            amount: amount,
            quantity: 0, // Not applicable for payments
            fuel_type: 'Payment', // Indicate this is a payment transaction
            payment_method: paymentForm.payment_method,
            staff_id: '00000000-0000-0000-0000-000000000000', // Placeholder, in a real app this would be the current staff ID
            date: new Date().toISOString().split('T')[0]
          }
        ]);
      
      if (transactionError) throw transactionError;
      
      // Update customer balance
      const newBalance = customer.balance - amount;
      
      const { error: updateError } = await supabase
        .from('customers')
        .update({ balance: newBalance })
        .eq('id', id);
      
      if (updateError) throw updateError;
      
      // Update local state
      setCustomer({
        ...customer,
        balance: newBalance
      });
      
      // Fetch updated transactions
      const { data: updatedTransactions, error: fetchError } = await supabase
        .from('transactions')
        .select('*, vehicles(number)')
        .eq('customer_id', id)
        .order('created_at', { ascending: false });
      
      if (fetchError) throw fetchError;
      setTransactions(updatedTransactions || []);
      
      setPaymentDialogOpen(false);
      setPaymentForm({
        amount: '',
        payment_method: 'Cash'
      });
      
      toast({
        title: 'Payment Added',
        description: `Payment of ₹${amount} has been recorded successfully`,
      });
    } catch (error) {
      console.error('Error adding payment:', error);
      toast({
        title: 'Error',
        description: 'Failed to add payment',
        variant: 'destructive',
      });
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading customer details...</span>
      </div>
    );
  }
  
  if (!customer) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold">Customer not found</h2>
        <Button className="mt-4" onClick={() => navigate('/customers')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Customers
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/customers')}
            className="mr-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Customer Details</h1>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={() => setVehicleDialogOpen(true)}
            variant="outline"
            size="sm"
          >
            <Car className="mr-2 h-4 w-4" />
            Add Vehicle
          </Button>
          
          <Button 
            onClick={() => setIndentDialogOpen(true)}
            variant="outline"
            size="sm"
          >
            <ClipboardList className="mr-2 h-4 w-4" />
            Create Indent
          </Button>
          
          <Button 
            onClick={() => setPaymentDialogOpen(true)}
            size="sm"
          >
            <CreditCard className="mr-2 h-4 w-4" />
            Record Payment
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{customer.name}</CardTitle>
              <CardDescription>Customer Account</CardDescription>
            </div>
            <div className="bg-muted p-2 rounded text-right">
              <div className="text-sm font-medium">Current Balance</div>
              <div className={`text-xl font-bold ${customer.balance > 0 ? 'text-red-500' : 'text-green-500'}`}>
                ₹{customer.balance.toLocaleString()}
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Contact Information</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Contact Person:</span>
                  <span className="font-medium">{customer.contact}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone:</span>
                  <span className="font-medium">{customer.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium">{customer.email}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Business Information</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">GST Number:</span>
                  <span className="font-medium">{customer.gst}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Vehicles:</span>
                  <span className="font-medium">{vehicles.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Active Indents:</span>
                  <span className="font-medium">
                    {indents.filter(i => i.status === 'Pending').length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Tabs defaultValue="vehicles">
        <TabsList className="grid grid-cols-3 w-full md:w-auto">
          <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
          <TabsTrigger value="indents">Indents</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="vehicles" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Registered Vehicles</CardTitle>
                <Button size="sm" onClick={() => setVehicleDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Vehicle
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {vehicles.length === 0 ? (
                <div className="text-center p-4 text-muted-foreground">
                  No vehicles registered yet. Add a vehicle to get started.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vehicle Number</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Capacity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vehicles.map((vehicle) => (
                      <TableRow key={vehicle.id}>
                        <TableCell className="font-medium">{vehicle.number}</TableCell>
                        <TableCell>{vehicle.type}</TableCell>
                        <TableCell>{vehicle.capacity}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="indents" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Fuel Indents</CardTitle>
                <Button size="sm" onClick={() => setIndentDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Create Indent
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {indents.length === 0 ? (
                <div className="text-center p-4 text-muted-foreground">
                  No indents found. Create an indent to get started.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Fuel Type</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {indents.map((indent) => (
                      <TableRow key={indent.id}>
                        <TableCell className="font-medium">{indent.id}</TableCell>
                        <TableCell>{indent.vehicles?.number || 'N/A'}</TableCell>
                        <TableCell>{indent.fuel_type}</TableCell>
                        <TableCell>{indent.quantity} L</TableCell>
                        <TableCell>₹{indent.amount}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs ${
                            indent.status === 'Completed' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {indent.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="transactions" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Transaction History</CardTitle>
                <Button size="sm" onClick={() => setPaymentDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Record Payment
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="text-center p-4 text-muted-foreground">
                  No transactions found.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {transaction.fuel_type === 'Payment' ? 'Payment' : 'Fuel'}
                        </TableCell>
                        <TableCell>
                          {transaction.vehicles?.number || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {transaction.fuel_type === 'Payment' 
                            ? `${transaction.payment_method} Payment` 
                            : `${transaction.quantity} L ${transaction.fuel_type}`}
                        </TableCell>
                        <TableCell className={transaction.fuel_type === 'Payment' ? 'text-green-600' : 'text-red-600'}>
                          {transaction.fuel_type === 'Payment' ? '- ' : '+ '}
                          ₹{transaction.amount}
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
      
      {/* Add Vehicle Dialog */}
      <Dialog open={vehicleDialogOpen} onOpenChange={setVehicleDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Vehicle</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="vehicleNumber">Vehicle Number</Label>
              <Input
                id="vehicleNumber"
                value={vehicleForm.number}
                onChange={(e) => setVehicleForm({...vehicleForm, number: e.target.value})}
                placeholder="e.g. KA-01-AB-1234"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="vehicleType">Vehicle Type</Label>
              <Select
                value={vehicleForm.type}
                onValueChange={(value) => setVehicleForm({...vehicleForm, type: value})}
              >
                <SelectTrigger id="vehicleType">
                  <SelectValue placeholder="Select vehicle type" />
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
              <Label htmlFor="vehicleCapacity">Capacity</Label>
              <Input
                id="vehicleCapacity"
                value={vehicleForm.capacity}
                onChange={(e) => setVehicleForm({...vehicleForm, capacity: e.target.value})}
                placeholder="e.g. 12 Ton or 5000 L"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setVehicleDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleAddVehicle}>
              Add Vehicle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Create Indent Dialog */}
      <Dialog open={indentDialogOpen} onOpenChange={setIndentDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create Fuel Indent</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="indentVehicle">Select Vehicle</Label>
              <Select
                value={indentForm.vehicle_id}
                onValueChange={(value) => setIndentForm({...indentForm, vehicle_id: value})}
              >
                <SelectTrigger id="indentVehicle">
                  <SelectValue placeholder="Select vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.number} ({vehicle.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="fuelType">Fuel Type</Label>
              <Select
                value={indentForm.fuel_type}
                onValueChange={(value) => setIndentForm({...indentForm, fuel_type: value})}
              >
                <SelectTrigger id="fuelType">
                  <SelectValue placeholder="Select fuel type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Petrol">Petrol</SelectItem>
                  <SelectItem value="Diesel">Diesel</SelectItem>
                  <SelectItem value="Premium Petrol">Premium Petrol</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="quantity">Quantity (Litres)</Label>
              <Input
                id="quantity"
                type="number"
                value={indentForm.quantity}
                onChange={(e) => setIndentForm({...indentForm, quantity: e.target.value})}
                placeholder="Enter quantity"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                value={indentForm.amount}
                readOnly
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Amount is calculated based on current fuel price
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIndentDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleCreateIndent}>
              Create Indent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Record Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="paymentAmount">Payment Amount (₹)</Label>
              <Input
                id="paymentAmount"
                type="number"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
                placeholder="Enter payment amount"
              />
              <p className="text-xs text-muted-foreground">
                Current balance: ₹{customer.balance}
              </p>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select
                value={paymentForm.payment_method}
                onValueChange={(value) => setPaymentForm({...paymentForm, payment_method: value})}
              >
                <SelectTrigger id="paymentMethod">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="Cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPaymentDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleAddPayment}>
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerDetails;
