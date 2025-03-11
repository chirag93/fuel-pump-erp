
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import TransactionForm from '@/components/fuel/TransactionForm';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from '@/integrations/supabase/client';

// New interfaces aligned with the database schema
interface Vehicle {
  id: string;
  number: string;
  type: string;
  capacity: string;
  customer_id: string;
}

interface Customer {
  id: string;
  name: string;
  contact: string;
  phone: string;
  email: string;
  gst: string;
  balance: number | null;
}

interface Indent {
  id: string;
  customer_id: string;
  vehicle_id: string;
  fuel_type: string;
  amount: number;
  quantity: number;
  status: string | null;
  created_at: string | null;
  // These fields are from joins
  customer_name?: string;
  vehicle_number?: string;
}

interface Transaction {
  id: string;
  indent_id: string | null;
  customer_id: string | null;
  vehicle_id: string | null;
  staff_id: string;
  date: string;
  fuel_type: string;
  amount: number;
  quantity: number;
  payment_method: string;
  created_at: string | null;
  // Display properties
  vehicle_number?: string;
  customer_name?: string;
}

interface ProcessIndentFormData {
  indentId: string;
  date: string;
  customerName: string;
  customerId: string;
  vehicleNumber: string;
  vehicleId: string;
  quantity: number;
  price: number;
  discount: number;
  totalAmount: number;
  fuelType: string;
}

const FuelingProcess = () => {
  const [indents, setIndents] = useState<Indent[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  
  const [selectedIndent, setSelectedIndent] = useState<Indent | null>(null);
  const [processIndentDialogOpen, setProcessIndentDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [indentFormData, setIndentFormData] = useState<ProcessIndentFormData>({
    indentId: '',
    date: new Date().toISOString().split('T')[0],
    customerName: '',
    customerId: '',
    vehicleNumber: '',
    vehicleId: '',
    quantity: 0,
    price: 0,
    discount: 0,
    totalAmount: 0,
    fuelType: 'Petrol'
  });

  // Fetch data on component mount
  useEffect(() => {
    fetchIndents();
    fetchTransactions();
    fetchCustomers();
    fetchVehicles();
  }, []);

  const fetchIndents = async () => {
    try {
      const { data, error } = await supabase
        .from('indents')
        .select(`
          *,
          customer:customers(name),
          vehicle:vehicles(number)
        `)
        .eq('status', 'Pending');
      
      if (error) throw error;
      
      if (data) {
        const formattedIndents = data.map(item => ({
          ...item,
          customer_name: item.customer?.name,
          vehicle_number: item.vehicle?.number
        }));
        setIndents(formattedIndents);
      }
    } catch (error) {
      console.error('Error fetching indents:', error);
      toast({
        title: "Error",
        description: "Failed to load indents",
        variant: "destructive"
      });
    }
  };

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
    }
  };

  const handleSelectIndent = (indent: Indent) => {
    setSelectedIndent(indent);
    
    if (indent) {
      setIndentFormData({
        indentId: indent.id,
        date: new Date().toISOString().split('T')[0],
        customerName: indent.customer_name || '',
        customerId: indent.customer_id,
        vehicleNumber: indent.vehicle_number || '',
        vehicleId: indent.vehicle_id,
        quantity: indent.quantity,
        price: indent.amount / indent.quantity,
        discount: 0,
        totalAmount: indent.amount,
        fuelType: indent.fuel_type
      });
      
      setProcessIndentDialogOpen(true);
    }
  };

  const handleProcessIndent = async () => {
    try {
      // Get current staff ID (this would be from your auth context in a real app)
      // For now, we'll use a placeholder
      const staffId = "00000000-0000-0000-0000-000000000000"; // Replace with actual logic to get staff ID
      
      // Create transaction record
      const transactionId = `TRX${new Date().getTime()}`;
      const transaction = {
        id: transactionId,
        indent_id: indentFormData.indentId,
        customer_id: indentFormData.customerId,
        vehicle_id: indentFormData.vehicleId,
        staff_id: staffId,
        date: indentFormData.date,
        fuel_type: indentFormData.fuelType,
        amount: indentFormData.totalAmount,
        quantity: indentFormData.quantity,
        payment_method: 'credit', // Indents are typically on credit
      };
      
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert(transaction);
      
      if (transactionError) throw transactionError;
      
      // Update indent status
      const { error: indentError } = await supabase
        .from('indents')
        .update({ status: 'Completed' })
        .eq('id', indentFormData.indentId);
      
      if (indentError) throw indentError;
      
      toast({
        title: "Success",
        description: "Indent processed successfully",
      });
      
      // Refresh data
      fetchIndents();
      fetchTransactions();
      
      setProcessIndentDialogOpen(false);
      setSelectedIndent(null);
    } catch (error) {
      console.error('Error processing indent:', error);
      toast({
        title: "Error",
        description: "Failed to process indent",
        variant: "destructive"
      });
    }
  };

  const handlePriceOrQuantityChange = (field: 'price' | 'quantity' | 'discount', value: number) => {
    const updates = { ...indentFormData, [field]: value };
    
    // Calculate total amount
    const totalBeforeDiscount = updates.price * updates.quantity;
    const totalAfterDiscount = totalBeforeDiscount - updates.discount;
    
    setIndentFormData({
      ...updates,
      totalAmount: totalAfterDiscount
    });
  };

  const filteredIndents = indents.filter(indent => 
    indent.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    indent.vehicle_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    indent.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Fueling Process</h1>

      <Card>
        <CardHeader>
          <CardTitle>Indents</CardTitle>
          <CardDescription>Process pending fuel indents</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="searchIndent">Search Indent/Customer/Vehicle</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="searchIndent"
                placeholder="Search by indent ID, customer or vehicle"
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="border rounded-md max-h-60 overflow-y-auto">
            {filteredIndents.length > 0 ? (
              <div className="divide-y">
                {filteredIndents.map((indent) => (
                  <div 
                    key={indent.id}
                    className={`p-3 cursor-pointer ${selectedIndent?.id === indent.id ? 'bg-muted' : 'hover:bg-muted/50'}`}
                  >
                    <div className="flex justify-between">
                      <p className="font-medium">
                        {indent.id} - {indent.customer_name}
                      </p>
                      <p className="text-sm text-muted-foreground">₹{indent.amount.toLocaleString()}</p>
                    </div>
                    <div className="flex justify-between text-sm">
                      <p>Vehicle: {indent.vehicle_number}</p>
                      <p>Quantity: {indent.quantity}L</p>
                    </div>
                    <div className="mt-2 flex justify-end">
                      <Button 
                        size="sm" 
                        onClick={() => handleSelectIndent(indent)}
                      >
                        Process Indent
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-muted-foreground">
                No pending indents found matching your search
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Last 5 transactions recorded</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length > 0 ? (
                transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">{transaction.vehicle_number || 'N/A'}</TableCell>
                    <TableCell>₹{transaction.amount.toLocaleString()}</TableCell>
                    <TableCell>{transaction.quantity}L</TableCell>
                    <TableCell className="capitalize">{transaction.payment_method}</TableCell>
                    <TableCell>
                      {transaction.created_at 
                        ? new Date(transaction.created_at).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">No transactions found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Dialog open={processIndentDialogOpen} onOpenChange={setProcessIndentDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Process Indent</DialogTitle>
            <DialogDescription>
              Complete the details to process the selected indent
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="indentId">Indent Number</Label>
                <Input
                  id="indentId"
                  value={indentFormData.indentId}
                  readOnly
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={indentFormData.date}
                  onChange={(e) => setIndentFormData({...indentFormData, date: e.target.value})}
                />
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="customerName">Customer Name</Label>
              <Input
                id="customerName"
                value={indentFormData.customerName}
                readOnly
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="vehicleNumber">Vehicle Number</Label>
              <Input
                id="vehicleNumber"
                value={indentFormData.vehicleNumber}
                readOnly
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={indentFormData.quantity.toString()}
                  onChange={(e) => handlePriceOrQuantityChange('quantity', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="price">Price per unit</Label>
                <Input
                  id="price"
                  type="number"
                  value={indentFormData.price.toString()}
                  onChange={(e) => handlePriceOrQuantityChange('price', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="discount">Discount (Optional)</Label>
                <Input
                  id="discount"
                  type="number"
                  value={indentFormData.discount.toString()}
                  onChange={(e) => handlePriceOrQuantityChange('discount', parseFloat(e.target.value) || 0)}
                />
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
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProcessIndentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleProcessIndent}>
              Process Indent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FuelingProcess;
