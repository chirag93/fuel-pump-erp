
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, CreditCard, Truck, FileText } from 'lucide-react';
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

interface Vehicle {
  id: string;
  number: string;
  type: string;
  fuelType: string;
  customerId: string;
}

interface Customer {
  id: string;
  name: string;
  company: string;
  gstNumber: string;
  creditLimit: number;
  creditUsed: number;
  vehicles: Vehicle[];
}

interface Indent {
  id: string;
  customerId: string;
  customerName: string;
  vehicleId: string;
  vehicleNumber: string;
  amount: number;
  quantity: number;
  fuelType: string;
  date: string;
  status: 'pending' | 'completed';
}

interface Transaction {
  id: string;
  indentId: string | null;
  vehicleNumber: string;
  customerName: string | null;
  fuelType: string;
  amount: number;
  quantity: number;
  paymentMethod: 'cash' | 'card' | 'upi' | 'credit';
  timestamp: string;
  meterReading: string;
}

interface ProcessIndentFormData {
  indentId: string;
  date: string;
  customerName: string;
  vehicleNumber: string;
  quantity: number;
  price: number;
  discount: number;
  totalAmount: number;
}

const mockCustomers: Customer[] = [
  {
    id: 'C001',
    name: 'Reliance Industries',
    company: 'Reliance Industries Ltd.',
    gstNumber: '27AADCB2580K1ZG',
    creditLimit: 100000,
    creditUsed: 35000,
    vehicles: [
      { id: 'V001', number: 'MH 02 AB 1234', type: 'Truck', fuelType: 'Diesel', customerId: 'C001' },
      { id: 'V002', number: 'MH 02 CD 5678', type: 'Truck', fuelType: 'Diesel', customerId: 'C001' }
    ]
  },
  {
    id: 'C002',
    name: 'Tata Motors',
    company: 'Tata Motors Ltd.',
    gstNumber: '27AAACT2727Q1ZF',
    creditLimit: 75000,
    creditUsed: 15000,
    vehicles: [
      { id: 'V003', number: 'MH 03 EF 9012', type: 'Truck', fuelType: 'Diesel', customerId: 'C002' }
    ]
  },
  {
    id: 'C003',
    name: 'Infosys',
    company: 'Infosys Ltd.',
    gstNumber: '29AAACI4741P1ZA',
    creditLimit: 50000,
    creditUsed: 5000,
    vehicles: [
      { id: 'V004', number: 'KA 01 GH 3456', type: 'Van', fuelType: 'Petrol', customerId: 'C003' },
      { id: 'V005', number: 'KA 01 IJ 7890', type: 'Car', fuelType: 'Petrol', customerId: 'C003' }
    ]
  }
];

const mockIndents: Indent[] = [
  {
    id: 'I001',
    customerId: 'C001',
    customerName: 'Reliance Industries',
    vehicleId: 'V001',
    vehicleNumber: 'MH 02 AB 1234',
    amount: 10000,
    quantity: 100,
    fuelType: 'Diesel',
    date: '2023-05-15',
    status: 'pending'
  },
  {
    id: 'I002',
    customerId: 'C002',
    customerName: 'Tata Motors',
    vehicleId: 'V003',
    vehicleNumber: 'MH 03 EF 9012',
    amount: 5000,
    quantity: 50,
    fuelType: 'Diesel',
    date: '2023-05-14',
    status: 'pending'
  }
];

const mockTransactions: Transaction[] = [
  {
    id: 'T001',
    indentId: 'I001',
    vehicleNumber: 'MH 02 AB 1234',
    customerName: 'Reliance Industries',
    fuelType: 'Diesel',
    amount: 5000,
    quantity: 50,
    paymentMethod: 'credit',
    timestamp: '2023-05-15T10:30:00',
    meterReading: '45678.5'
  },
  {
    id: 'T002',
    indentId: null,
    vehicleNumber: 'KA 05 MM 1234',
    customerName: null,
    fuelType: 'Petrol',
    amount: 1000,
    quantity: 10,
    paymentMethod: 'cash',
    timestamp: '2023-05-15T11:15:00',
    meterReading: '23456.8'
  },
  {
    id: 'T003',
    indentId: null,
    vehicleNumber: 'TN 07 XY 9876',
    customerName: null,
    fuelType: 'Petrol',
    amount: 2000,
    quantity: 20,
    paymentMethod: 'upi',
    timestamp: '2023-05-15T12:05:00',
    meterReading: '34567.2'
  }
];

const FuelingProcess = () => {
  const [customers] = useState<Customer[]>(mockCustomers);
  const [indents] = useState<Indent[]>(mockIndents);
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedIndent, setSelectedIndent] = useState<Indent | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [processIndentDialogOpen, setProcessIndentDialogOpen] = useState(false);
  const [customerNameSearch, setCustomerNameSearch] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  
  const [indentFormData, setIndentFormData] = useState<ProcessIndentFormData>({
    indentId: '',
    date: new Date().toISOString().split('T')[0],
    customerName: '',
    vehicleNumber: '',
    quantity: 0,
    price: 0,
    discount: 0,
    totalAmount: 0
  });

  const handleSelectIndent = (id: string) => {
    const indent = indents.find(i => i.id === id) || null;
    setSelectedIndent(indent);
    
    if (indent) {
      const customer = customers.find(c => c.id === indent.customerId) || null;
      
      setIndentFormData({
        indentId: indent.id,
        date: new Date().toISOString().split('T')[0],
        customerName: indent.customerName,
        vehicleNumber: indent.vehicleNumber,
        quantity: indent.quantity,
        price: indent.amount / indent.quantity,
        discount: 0,
        totalAmount: indent.amount
      });
      
      setSelectedCustomer(customer);
      setProcessIndentDialogOpen(true);
    }
  };

  const handleProcessIndent = () => {
    // Process the indent with the form data
    console.log("Processing indent with data:", indentFormData);
    
    const newTransaction: Transaction = {
      id: `T${transactions.length + 1}`.padStart(4, '0'),
      indentId: indentFormData.indentId,
      vehicleNumber: indentFormData.vehicleNumber,
      customerName: indentFormData.customerName,
      fuelType: selectedIndent?.fuelType || 'Petrol',
      amount: indentFormData.totalAmount,
      quantity: indentFormData.quantity,
      paymentMethod: 'credit', // Default for indents is usually credit
      timestamp: new Date().toISOString(),
      meterReading: "0" // This should be entered by the user in a real implementation
    };

    setTransactions([newTransaction, ...transactions]);

    toast({
      title: "Indent processed",
      description: "The indent has been successfully processed",
    });
    
    setProcessIndentDialogOpen(false);
    setSelectedIndent(null);
  };

  const handleCustomerNameChange = (value: string) => {
    setCustomerNameSearch(value);
    setIndentFormData({...indentFormData, customerName: value});
    
    // Filter customers based on name search
    if (value.trim() !== '') {
      const filtered = customers.filter(c => 
        c.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredCustomers(filtered);
    } else {
      setFilteredCustomers([]);
    }
  };

  const selectCustomerFromSearch = (customer: Customer) => {
    setIndentFormData({...indentFormData, customerName: customer.name});
    setCustomerNameSearch(customer.name);
    setFilteredCustomers([]);
    setSelectedCustomer(customer);
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
    indent.status === 'pending' && 
    (indent.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
     indent.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
     indent.id.toLowerCase().includes(searchTerm.toLowerCase()))
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
                        {indent.id} - {indent.customerName}
                      </p>
                      <p className="text-sm text-muted-foreground">₹{indent.amount.toLocaleString()}</p>
                    </div>
                    <div className="flex justify-between text-sm">
                      <p>Vehicle: {indent.vehicleNumber}</p>
                      <p>Quantity: {indent.quantity}L</p>
                    </div>
                    <div className="mt-2 flex justify-end">
                      <Button 
                        size="sm" 
                        onClick={() => handleSelectIndent(indent.id)}
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
              {transactions.slice(0, 5).map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-medium">{transaction.vehicleNumber}</TableCell>
                  <TableCell>₹{transaction.amount.toLocaleString()}</TableCell>
                  <TableCell>{transaction.quantity}L</TableCell>
                  <TableCell className="capitalize">{transaction.paymentMethod}</TableCell>
                  <TableCell>
                    {new Date(transaction.timestamp).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </TableCell>
                </TableRow>
              ))}
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
              <div className="relative">
                <Input
                  id="customerName"
                  value={customerNameSearch}
                  onChange={(e) => handleCustomerNameChange(e.target.value)}
                  placeholder="Start typing to search customers..."
                />
                {filteredCustomers.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                    {filteredCustomers.map(customer => (
                      <div 
                        key={customer.id}
                        className="p-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => selectCustomerFromSearch(customer)}
                      >
                        {customer.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="vehicleNumber">Vehicle Number</Label>
              <Input
                id="vehicleNumber"
                value={indentFormData.vehicleNumber}
                onChange={(e) => setIndentFormData({...indentFormData, vehicleNumber: e.target.value})}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={indentFormData.quantity.toString()}
                  onChange={(e) => handlePriceOrQuantityChange('quantity', parseFloat(e.target.value))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="price">Price per unit</Label>
                <Input
                  id="price"
                  type="number"
                  value={indentFormData.price.toString()}
                  onChange={(e) => handlePriceOrQuantityChange('price', parseFloat(e.target.value))}
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
                  onChange={(e) => handlePriceOrQuantityChange('discount', parseFloat(e.target.value))}
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
