
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, AlignJustify, FileText, Plus } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase, Customer, Vehicle, Indent, Transaction, IndentBooklet } from '@/integrations/supabase/client';

interface ProcessIndentFormData {
  indentNumber: string;
  date: string;
  customerId: string;
  customerName: string;
  vehicleId: string;
  vehicleNumber: string;
  quantity: number;
  price: number;
  totalAmount: number;
  fuelType: string;
  staffId: string;
  bookletId: string | null;
}

const FuelingProcess = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [customerVehicles, setCustomerVehicles] = useState<Vehicle[]>([]);
  const [staffMembers, setStaffMembers] = useState<{id: string; name: string}[]>([]);
  const [transactions, setTransactions] = useState<(Transaction & { customer_name?: string; vehicle_number?: string })[]>([]);
  
  const [customerIndentBooklets, setCustomerIndentBooklets] = useState<IndentBooklet[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  
  const [processIndentDialogOpen, setProcessIndentDialogOpen] = useState(false);
  const [createIndentDialogOpen, setCreateIndentDialogOpen] = useState(false);
  
  // Default form data
  const [indentFormData, setIndentFormData] = useState<ProcessIndentFormData>({
    indentNumber: '',
    date: new Date().toISOString().split('T')[0],
    customerId: '',
    customerName: '',
    vehicleId: '',
    vehicleNumber: '',
    quantity: 0,
    price: 0,
    totalAmount: 0,
    fuelType: 'Petrol',
    staffId: '',
    bookletId: null
  });

  // Fetch data on component mount
  useEffect(() => {
    fetchTransactions();
    fetchCustomers();
    fetchVehicles();
    fetchStaffMembers();
  }, []);

  // Fetch customer's indent booklets when a customer is selected
  useEffect(() => {
    if (selectedCustomerId) {
      fetchCustomerIndentBooklets(selectedCustomerId);
      fetchCustomerVehicles(selectedCustomerId);
    }
  }, [selectedCustomerId]);

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          customer:customers(name),
          vehicle:vehicles(number)
        `)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      
      if (data) {
        const formattedTransactions = data.map(item => ({
          ...item,
          customer_name: item.customer?.name,
          vehicle_number: item.vehicle?.number
        }));
        setTransactions(formattedTransactions);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast({
        title: "Error",
        description: "Failed to load transactions",
        variant: "destructive"
      });
    }
  };

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*');
      
      if (error) throw error;
      
      if (data) {
        setCustomers(data);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast({
        title: "Error",
        description: "Failed to load customers",
        variant: "destructive"
      });
    }
  };

  const fetchVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*');
      
      if (error) throw error;
      
      if (data) {
        setVehicles(data);
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      toast({
        title: "Error",
        description: "Failed to load vehicles",
        variant: "destructive"
      });
    }
  };

  const fetchCustomerVehicles = async (customerId: string) => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('customer_id', customerId);
      
      if (error) throw error;
      
      if (data) {
        setCustomerVehicles(data);
      }
    } catch (error) {
      console.error('Error fetching customer vehicles:', error);
      toast({
        title: "Error",
        description: "Failed to load customer vehicles",
        variant: "destructive"
      });
    }
  };

  const fetchStaffMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('id, name');
      
      if (error) throw error;
      
      if (data) {
        setStaffMembers(data);
      }
    } catch (error) {
      console.error('Error fetching staff members:', error);
      toast({
        title: "Error",
        description: "Failed to load staff members",
        variant: "destructive"
      });
    }
  };

  const fetchCustomerIndentBooklets = async (customerId: string) => {
    try {
      const { data, error } = await supabase
        .from('indent_booklets')
        .select('*')
        .eq('customer_id', customerId)
        .eq('status', 'Active');
      
      if (error) throw error;
      
      if (data) {
        setCustomerIndentBooklets(data);
      } else {
        setCustomerIndentBooklets([]);
      }
    } catch (error) {
      console.error('Error fetching indent booklets:', error);
      toast({
        title: "Error",
        description: "Failed to load indent booklets",
        variant: "destructive"
      });
    }
  };

  const handleCustomerSelect = (customerId: string) => {
    setSelectedCustomerId(customerId);
    
    const customer = customers.find(c => c.id === customerId);
    
    if (customer) {
      setIndentFormData({
        ...indentFormData,
        customerId: customer.id,
        customerName: customer.name,
        vehicleId: '',
        vehicleNumber: ''
      });
    }
  };

  const handleVehicleSelect = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    
    if (vehicle) {
      setIndentFormData({
        ...indentFormData,
        vehicleId: vehicle.id,
        vehicleNumber: vehicle.number
      });
    }
  };

  const validateIndentNumber = (indentNumber: string, bookletId: string): boolean => {
    const booklet = customerIndentBooklets.find(b => b.id === bookletId);
    
    if (!booklet) return false;
    
    const startNum = parseInt(booklet.start_number);
    const endNum = parseInt(booklet.end_number);
    const indentNum = parseInt(indentNumber);
    
    return indentNum >= startNum && indentNum <= endNum;
  };

  const handleProcessIndent = async () => {
    try {
      if (!indentFormData.staffId) {
        toast({
          title: "Error",
          description: "Please select a staff member",
          variant: "destructive"
        });
        return;
      }

      if (!indentFormData.indentNumber) {
        toast({
          title: "Error",
          description: "Please enter an indent number",
          variant: "destructive"
        });
        return;
      }

      if (!indentFormData.bookletId) {
        toast({
          title: "Error",
          description: "Please select an indent booklet",
          variant: "destructive"
        });
        return;
      }

      // Validate that the indent number is within the range of the selected booklet
      if (!validateIndentNumber(indentFormData.indentNumber, indentFormData.bookletId)) {
        toast({
          title: "Error",
          description: "The indent number is not valid for the selected booklet",
          variant: "destructive"
        });
        return;
      }

      // Check if this indent number has already been used
      const { data: existingIndents, error: checkError } = await supabase
        .from('indents')
        .select('id')
        .eq('indent_number', indentFormData.indentNumber)
        .eq('booklet_id', indentFormData.bookletId);
      
      if (checkError) throw checkError;
      
      if (existingIndents && existingIndents.length > 0) {
        toast({
          title: "Error",
          description: "This indent number has already been used",
          variant: "destructive"
        });
        return;
      }

      // Create a new indent record
      const indentId = `IND-${indentFormData.indentNumber}`;
      const indent = {
        id: indentId,
        customer_id: indentFormData.customerId,
        vehicle_id: indentFormData.vehicleId,
        fuel_type: indentFormData.fuelType,
        amount: indentFormData.totalAmount,
        quantity: indentFormData.quantity,
        status: 'Completed',
        indent_number: indentFormData.indentNumber,
        booklet_id: indentFormData.bookletId,
        date: indentFormData.date
      };
      
      const { error: indentError } = await supabase
        .from('indents')
        .insert(indent);
      
      if (indentError) throw indentError;
      
      // Create transaction record with indent reference
      const transactionId = `TRX${new Date().getTime()}`;
      const transaction = {
        id: transactionId,
        indent_id: indentId,
        customer_id: indentFormData.customerId,
        vehicle_id: indentFormData.vehicleId,
        staff_id: indentFormData.staffId,
        date: indentFormData.date,
        fuel_type: indentFormData.fuelType,
        amount: indentFormData.totalAmount,
        quantity: indentFormData.quantity,
        payment_method: 'credit', // Indents are processed as credit transactions
      };
      
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert(transaction);
      
      if (transactionError) throw transactionError;

      // Update the used_indents count in the booklet
      const booklet = customerIndentBooklets.find(b => b.id === indentFormData.bookletId);
      if (booklet) {
        const newUsedCount = booklet.used_indents + 1;
        const status = newUsedCount >= booklet.total_indents ? 'Completed' : 'Active';
        
        const { error: bookletError } = await supabase
          .from('indent_booklets')
          .update({ 
            used_indents: newUsedCount,
            status: status
          })
          .eq('id', indentFormData.bookletId);
        
        if (bookletError) throw bookletError;
      }
      
      toast({
        title: "Success",
        description: "Indent processed successfully",
      });
      
      // Refresh data
      fetchTransactions();
      if (selectedCustomerId) {
        fetchCustomerIndentBooklets(selectedCustomerId);
      }
      
      setProcessIndentDialogOpen(false);
      // Reset form data
      setIndentFormData({
        indentNumber: '',
        date: new Date().toISOString().split('T')[0],
        customerId: '',
        customerName: '',
        vehicleId: '',
        vehicleNumber: '',
        quantity: 0,
        price: 0,
        totalAmount: 0,
        fuelType: 'Petrol',
        staffId: '',
        bookletId: null
      });
      setSelectedCustomerId(null);
    } catch (error) {
      console.error('Error processing indent:', error);
      toast({
        title: "Error",
        description: "Failed to process indent",
        variant: "destructive"
      });
    }
  };

  const handlePriceOrQuantityChange = (field: 'price' | 'quantity', value: number) => {
    const updates = { ...indentFormData, [field]: value };
    
    // Calculate total amount
    const totalAmount = updates.price * updates.quantity;
    
    setIndentFormData({
      ...updates,
      totalAmount: totalAmount
    });
  };

  const filteredCustomers = searchTerm 
    ? customers.filter(customer => 
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone.includes(searchTerm)
      )
    : customers;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Fueling Process</h1>

      <Card>
        <CardHeader>
          <CardTitle>Process Indent</CardTitle>
          <CardDescription>Record fuel transactions based on customer indent slips</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="searchCustomer">Search Customer</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="searchCustomer"
                placeholder="Search by name, contact person or phone..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="border rounded-md max-h-[300px] overflow-y-auto">
            {filteredCustomers.length > 0 ? (
              <div className="divide-y">
                {filteredCustomers.map((customer) => (
                  <div 
                    key={customer.id}
                    className={`p-3 hover:bg-muted/50 cursor-pointer ${selectedCustomerId === customer.id ? 'bg-muted' : ''}`}
                    onClick={() => handleCustomerSelect(customer.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">
                          {customer.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Contact: {customer.contact} | Phone: {customer.phone}
                        </p>
                      </div>
                      {customer.balance !== null && (
                        <div className="text-right">
                          <p className="font-medium">₹{customer.balance.toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">Current Balance</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-muted-foreground">
                {searchTerm 
                  ? "No customers found matching your search" 
                  : "No customers available"}
              </div>
            )}
          </div>

          {selectedCustomerId && (
            <div className="mt-4">
              <Button onClick={() => setProcessIndentDialogOpen(true)}>
                Process Indent
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Last 5 fuel transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length > 0 ? (
                transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium">{transaction.customer_name || 'Walk-in'}</TableCell>
                    <TableCell>{transaction.vehicle_number || 'N/A'}</TableCell>
                    <TableCell>₹{transaction.amount.toLocaleString()}</TableCell>
                    <TableCell>{transaction.quantity}L</TableCell>
                    <TableCell className="capitalize">{transaction.payment_method}</TableCell>
                    <TableCell>{transaction.indent_id ? 'Indent' : 'Direct'}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">No transactions found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Dialog open={processIndentDialogOpen} onOpenChange={setProcessIndentDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Process Indent Transaction</DialogTitle>
            <DialogDescription>
              Complete this fuel transaction based on an indent slip
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="customerName">Customer</Label>
              <Input
                id="customerName"
                value={indentFormData.customerName}
                readOnly
                className="bg-muted"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="bookletId">Indent Booklet</Label>
              <Select 
                value={indentFormData.bookletId || ""} 
                onValueChange={(value) => setIndentFormData({...indentFormData, bookletId: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select indent booklet" />
                </SelectTrigger>
                <SelectContent>
                  {customerIndentBooklets.map(booklet => (
                    <SelectItem key={booklet.id} value={booklet.id}>
                      {booklet.start_number} - {booklet.end_number} ({booklet.used_indents}/{booklet.total_indents} used)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {customerIndentBooklets.length === 0 && (
                <p className="text-sm text-destructive">No active indent booklets available for this customer</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="indentNumber">Indent Number</Label>
              <Input
                id="indentNumber"
                value={indentFormData.indentNumber}
                onChange={(e) => setIndentFormData({...indentFormData, indentNumber: e.target.value})}
                placeholder="Enter the indent number from the slip"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="date">Transaction Date</Label>
              <Input
                id="date"
                type="date"
                value={indentFormData.date}
                onChange={(e) => setIndentFormData({...indentFormData, date: e.target.value})}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="vehicleId">Vehicle</Label>
              <Select 
                value={indentFormData.vehicleId} 
                onValueChange={handleVehicleSelect}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {customerVehicles.map(vehicle => (
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
                value={indentFormData.fuelType} 
                onValueChange={(value) => setIndentFormData({...indentFormData, fuelType: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select fuel type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Petrol">Petrol</SelectItem>
                  <SelectItem value="Diesel">Diesel</SelectItem>
                  <SelectItem value="Premium Petrol">Premium Petrol</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="quantity">Quantity (Liters)</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={indentFormData.quantity.toString()}
                  onChange={(e) => handlePriceOrQuantityChange('quantity', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="price">Price per liter</Label>
                <Input
                  id="price"
                  type="number"
                  value={indentFormData.price.toString()}
                  onChange={(e) => handlePriceOrQuantityChange('price', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="totalAmount">Total Amount</Label>
              <Input
                id="totalAmount"
                type="number"
                value={indentFormData.totalAmount.toString()}
                readOnly
                className="bg-muted"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="staffId">Staff Member</Label>
              <Select 
                value={indentFormData.staffId} 
                onValueChange={(value) => setIndentFormData({...indentFormData, staffId: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  {staffMembers.map(staff => (
                    <SelectItem key={staff.id} value={staff.id}>{staff.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProcessIndentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleProcessIndent}>
              Process Transaction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FuelingProcess;
