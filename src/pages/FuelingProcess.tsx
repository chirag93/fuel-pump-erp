import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, CreditCard, Truck, Camera, FileText } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import TransactionForm from '@/components/fuel/TransactionForm';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

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
  
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [quantity, setQuantity] = useState('');
  const [fuelType, setFuelType] = useState('Petrol');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [indentId, setIndentId] = useState('');
  const [meterReading, setMeterReading] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const handleSelectCustomer = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId) || null;
    setSelectedCustomer(customer);
    setSelectedVehicle(null);
    setSelectedIndent(null);
  };

  const handleSelectVehicle = (vehicleId: string) => {
    if (!selectedCustomer) return;
    
    const vehicle = selectedCustomer.vehicles.find(v => v.id === vehicleId) || null;
    setSelectedVehicle(vehicle);
    
    if (vehicle) {
      setVehicleNumber(vehicle.number);
      setFuelType(vehicle.fuelType);
      
      const indent = indents.find(i => 
        i.customerId === selectedCustomer.id && 
        i.vehicleId === vehicle.id && 
        i.status === 'pending'
      ) || null;
      
      setSelectedIndent(indent);
      if (indent) {
        setIndentId(indent.id);
        setAmount(indent.amount.toString());
        setQuantity(indent.quantity.toString());
      }
    }
  };

  const handleSelectIndent = (id: string) => {
    const indent = indents.find(i => i.id === id) || null;
    setSelectedIndent(indent);
    
    if (indent) {
      setIndentId(indent.id);
      setVehicleNumber(indent.vehicleNumber);
      setAmount(indent.amount.toString());
      setQuantity(indent.quantity.toString());
      setFuelType(indent.fuelType);
      
      const customer = customers.find(c => c.id === indent.customerId) || null;
      setSelectedCustomer(customer);
      
      if (customer) {
        const vehicle = customer.vehicles.find(v => v.id === indent.vehicleId) || null;
        setSelectedVehicle(vehicle);
      }
    }
  };

  const filteredIndents = indents.filter(indent => 
    indent.status === 'pending' && 
    (indent.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
     indent.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
     indent.id.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleRecordTransaction = (transaction: any) => {
    console.log("Recording transaction:", transaction);
    
    const newTransaction: Transaction = {
      id: `T${transactions.length + 1}`.padStart(4, '0'),
      indentId: selectedIndent ? selectedIndent.id : null,
      vehicleNumber: transaction.vehicleNumber,
      customerName: selectedCustomer ? selectedCustomer.name : transaction.customerName || null,
      fuelType: transaction.fuelType,
      amount: parseFloat(transaction.amount.toString()),
      quantity: parseFloat(transaction.quantity.toString()),
      paymentMethod: transaction.paymentMethod as 'cash' | 'card' | 'upi' | 'credit',
      timestamp: transaction.timestamp || new Date().toISOString(),
      meterReading: transaction.meterReading
    };

    setTransactions([newTransaction, ...transactions]);

    toast({
      title: "Transaction recorded",
      description: "The fueling transaction has been successfully recorded",
    });

    if (!selectedCustomer) {
      setVehicleNumber('');
    }
    setAmount('');
    setQuantity('');
    setSelectedIndent(null);
    setIndentId('');
  };

  const handleTakePicture = () => {
    toast({
      title: "Camera access required",
      description: "This would open the camera to take a picture of the meter",
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Fueling Process</h1>

      <Tabs defaultValue="direct">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="direct">Direct Fueling</TabsTrigger>
          <TabsTrigger value="indent">Indent Based</TabsTrigger>
        </TabsList>
        
        <TabsContent value="direct">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Record Fueling Transaction</CardTitle>
                <CardDescription>Enter details to record a direct fueling transaction</CardDescription>
              </CardHeader>
              <CardContent>
                <TransactionForm onSubmit={handleRecordTransaction} />
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
          </div>
        </TabsContent>
        
        <TabsContent value="indent">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Process Indent</CardTitle>
                <CardDescription>Select a customer or indent to process</CardDescription>
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
                          onClick={() => handleSelectIndent(indent.id)}
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
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-muted-foreground">
                      No pending indents found matching your search
                    </div>
                  )}
                </div>
                
                {selectedIndent && (
                  <TransactionForm 
                    onSubmit={handleRecordTransaction}
                    vehicleNumber={vehicleNumber}
                    amount={amount}
                    quantity={quantity}
                    fuelType={fuelType}
                    customerId={selectedIndent.customerId}
                    customerName={selectedIndent.customerName}
                  />
                )}
              </CardContent>
            </Card>
            
            <div className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="space-y-1">
                    <CardTitle>Pending Indents</CardTitle>
                    <CardDescription>Indents waiting to be processed</CardDescription>
                  </div>
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {indents.filter(i => i.status === 'pending').length}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {indents.filter(i => i.status === 'pending').reduce((sum, i) => sum + i.amount, 0).toLocaleString()} ₹ total value
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="space-y-1">
                    <CardTitle>Today's Transactions</CardTitle>
                    <CardDescription>Fuel dispensed today</CardDescription>
                  </div>
                  <Truck className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {transactions.filter(t => 
                      new Date(t.timestamp).toDateString() === new Date().toDateString()
                    ).length}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {transactions
                      .filter(t => new Date(t.timestamp).toDateString() === new Date().toDateString())
                      .reduce((sum, t) => sum + t.quantity, 0)} liters dispensed
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="space-y-1">
                    <CardTitle>Card/UPI Sales</CardTitle>
                    <CardDescription>Digital payments today</CardDescription>
                  </div>
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    ₹{transactions
                      .filter(t => 
                        new Date(t.timestamp).toDateString() === new Date().toDateString() &&
                        (t.paymentMethod === 'card' || t.paymentMethod === 'upi')
                      )
                      .reduce((sum, t) => sum + t.amount, 0)
                      .toLocaleString()}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {(transactions
                      .filter(t => 
                        new Date(t.timestamp).toDateString() === new Date().toDateString() &&
                        (t.paymentMethod === 'card' || t.paymentMethod === 'upi')
                      ).length / Math.max(1, transactions
                      .filter(t => 
                        new Date(t.timestamp).toDateString() === new Date().toDateString()
                      ).length) * 100).toFixed(1)}% of all transactions
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FuelingProcess;
