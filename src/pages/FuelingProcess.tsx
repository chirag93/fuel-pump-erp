
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, AlignJustify } from 'lucide-react';
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
} from "@/components/ui/dialog";
import { supabase, Customer, Vehicle, Indent, Transaction } from '@/integrations/supabase/client';

interface ProcessIndentFormData {
  indentId: string;
  date: string;
  customerId: string;
  customerName: string;
  vehicleId: string;
  vehicleNumber: string;
  quantity: number;
  price: number;
  discount: number;
  totalAmount: number;
  fuelType: string;
  staffId: string;
}

const FuelingProcess = () => {
  const [indents, setIndents] = useState<(Indent & { customer_name?: string; vehicle_number?: string })[]>([]);
  const [transactions, setTransactions] = useState<(Transaction & { customer_name?: string; vehicle_number?: string })[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [customerVehicles, setCustomerVehicles] = useState<Vehicle[]>([]);
  const [staffMembers, setStaffMembers] = useState<{id: string; name: string}[]>([]);
  
  const [processIndentDialogOpen, setProcessIndentDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Default form data
  const [indentFormData, setIndentFormData] = useState<ProcessIndentFormData>({
    indentId: '',
    date: new Date().toISOString().split('T')[0],
    customerId: '',
    customerName: '',
    vehicleId: '',
    vehicleNumber: '',
    quantity: 0,
    price: 0,
    discount: 0,
    totalAmount: 0,
    fuelType: 'Petrol',
    staffId: ''
  });

  // Fetch data on component mount
  useEffect(() => {
    fetchIndents();
    fetchTransactions();
    fetchCustomers();
    fetchVehicles();
    fetchStaffMembers();
  }, []);

  const fetchIndents = async () => {
    try {
      const { data, error } = await supabase
        .from('indents')
        .select(`
          *,
          customer:customers(id, name),
          vehicle:vehicles(id, number)
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

  const handleSelectIndent = (indent: Indent & { customer_name?: string; vehicle_number?: string }) => {
    if (indent) {
      setIndentFormData({
        indentId: indent.id,
        date: new Date().toISOString().split('T')[0],
        customerId: indent.customer_id,
        customerName: indent.customer_name || '',
        vehicleId: indent.vehicle_id,
        vehicleNumber: indent.vehicle_number || '',
        quantity: indent.quantity,
        price: indent.amount / indent.quantity,
        discount: 0,
        totalAmount: indent.amount,
        fuelType: indent.fuel_type,
        staffId: staffMembers.length > 0 ? staffMembers[0].id : ''
      });
      
      setProcessIndentDialogOpen(true);
    }
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
      
      // Create transaction record with indent reference
      const transactionId = `TRX${new Date().getTime()}`;
      const transaction = {
        id: transactionId,
        indent_id: indentFormData.indentId,
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
      
      // Update indent status to Completed
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
          <CardTitle>Pending Indents</CardTitle>
          <CardDescription>Process fuel transactions based on pending indent slips</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="searchIndent">Search by Customer, Vehicle or Indent ID</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="searchIndent"
                placeholder="Search indents..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="border rounded-md max-h-[300px] overflow-y-auto">
            {filteredIndents.length > 0 ? (
              <div className="divide-y">
                {filteredIndents.map((indent) => (
                  <div 
                    key={indent.id}
                    className="p-3 hover:bg-muted/50"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">
                          {indent.customer_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Vehicle: {indent.vehicle_number}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          ID: {indent.id}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">₹{indent.amount.toLocaleString()}</p>
                        <p className="text-sm">{indent.quantity}L of {indent.fuel_type}</p>
                      </div>
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
                {searchTerm 
                  ? "No pending indents found matching your search" 
                  : "No pending indents available"}
              </div>
            )}
          </div>
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
                  <TableCell colSpan={6} className="text-center py-4">No transactions found</TableCell>
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
              Complete this fuel transaction based on the indent slip
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
                  className="bg-muted"
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
            </div>
            
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
              <Label htmlFor="vehicleNumber">Vehicle</Label>
              <Input
                id="vehicleNumber"
                value={indentFormData.vehicleNumber}
                readOnly
                className="bg-muted"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="fuelType">Fuel Type</Label>
              <Input
                id="fuelType"
                value={indentFormData.fuelType}
                readOnly
                className="bg-muted"
              />
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
