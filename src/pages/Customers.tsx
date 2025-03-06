import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Plus, FileText, Car, Edit, Trash, PenSquare, Users } from 'lucide-react';

// Mock data for customers
const mockCustomers = [
  {
    id: '1',
    name: 'Rajesh Enterprises',
    contact: 'Rajesh Kumar',
    phone: '9876543210',
    email: 'rajesh@example.com',
    gst: 'GSTIN12345678901',
    balance: '₹15,000',
    vehicles: 3,
  },
  {
    id: '2',
    name: 'ABC Logistics',
    contact: 'Amit Singh',
    phone: '8765432109',
    email: 'amit@abclogistics.com',
    gst: 'GSTIN23456789012',
    balance: '₹8,500',
    vehicles: 8,
  },
  {
    id: '3',
    name: 'XYZ Transport',
    contact: 'Priya Sharma',
    phone: '7654321098',
    email: 'priya@xyztransport.com',
    gst: 'GSTIN34567890123',
    balance: '₹22,700',
    vehicles: 12,
  },
  {
    id: '4',
    name: 'City Cabs',
    contact: 'Vikram Patel',
    phone: '6543210987',
    email: 'vikram@citycabs.com',
    gst: 'GSTIN45678901234',
    balance: '₹5,200',
    vehicles: 25,
  },
  {
    id: '5',
    name: 'Green Movers',
    contact: 'Sanjay Verma',
    phone: '9876543210',
    email: 'sanjay@greenmovers.com',
    gst: 'GSTIN56789012345',
    balance: '₹12,800',
    vehicles: 6,
  },
];

// Mock data for customer vehicles
const mockVehicles = [
  { id: '1', customer: '1', number: 'KA-01-AB-1234', type: 'Truck', capacity: '12 Ton' },
  { id: '2', customer: '1', number: 'KA-01-CD-5678', type: 'Truck', capacity: '16 Ton' },
  { id: '3', customer: '1', number: 'KA-02-EF-9012', type: 'Pickup', capacity: '2 Ton' },
  { id: '4', customer: '2', number: 'MH-12-GH-3456', type: 'Truck', capacity: '20 Ton' },
  { id: '5', customer: '2', number: 'MH-12-IJ-7890', type: 'Truck', capacity: '10 Ton' },
];

// Mock data for customer indents
const mockIndents = [
  { 
    id: 'IND001', 
    customer: '1', 
    date: '2023-06-01', 
    vehicle: 'KA-01-AB-1234', 
    fuelType: 'Diesel',
    quantity: '100L',
    amount: '₹9,800',
    status: 'Completed'
  },
  { 
    id: 'IND002', 
    customer: '1', 
    date: '2023-06-05', 
    vehicle: 'KA-01-CD-5678', 
    fuelType: 'Diesel',
    quantity: '150L',
    amount: '₹14,700',
    status: 'Completed'
  },
  { 
    id: 'IND003', 
    customer: '2', 
    date: '2023-06-08', 
    vehicle: 'MH-12-GH-3456', 
    fuelType: 'Diesel',
    quantity: '200L',
    amount: '₹19,600',
    status: 'Pending'
  },
];

const Customers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all-customers');
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);

  const filteredCustomers = mockCustomers.filter(customer => 
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    customer.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm)
  );

  const handleSelectCustomer = (customerId: string) => {
    setSelectedCustomer(customerId);
    setActiveTab('customer-details');
  };

  const customerVehicles = mockVehicles.filter(vehicle => vehicle.customer === selectedCustomer);
  const customerIndents = mockIndents.filter(indent => indent.customer === selectedCustomer);
  const selectedCustomerData = mockCustomers.find(c => c.id === selectedCustomer);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between space-y-2 md:flex-row md:items-center md:space-y-0">
        <h2 className="text-3xl font-bold tracking-tight">Customers</h2>
        <div className="flex items-center gap-2">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Customer
          </Button>
        </div>
      </div>

      <div className="flex gap-4 flex-col md:flex-row">
        <div className="md:w-1/4">
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle>Customer Management</CardTitle>
              <CardDescription>
                Manage your customers, vehicles, and indents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={() => setActiveTab('all-customers')}
                >
                  <Users className="mr-2 h-4 w-4" />
                  All Customers
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={() => setActiveTab('vehicles')}
                >
                  <Car className="mr-2 h-4 w-4" />
                  Vehicles
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={() => setActiveTab('indents')}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Indents
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setActiveTab('reminders')}
                >
                  <PenSquare className="mr-2 h-4 w-4" />
                  Payment Reminders
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:w-3/4">
          <Card>
            <CardHeader className="pb-2">
              {activeTab === 'customer-details' && selectedCustomerData ? (
                <div className="flex justify-between">
                  <div>
                    <CardTitle>{selectedCustomerData.name}</CardTitle>
                    <CardDescription>
                      Customer details and management
                    </CardDescription>
                  </div>
                  <Button variant="outline" onClick={() => setActiveTab('all-customers')}>
                    Back to List
                  </Button>
                </div>
              ) : (
                <>
                  <CardTitle>
                    {activeTab === 'all-customers' && 'All Customers'}
                    {activeTab === 'vehicles' && 'Vehicles'}
                    {activeTab === 'indents' && 'Indents'}
                    {activeTab === 'reminders' && 'Payment Reminders'}
                  </CardTitle>
                  <CardDescription>
                    {activeTab === 'all-customers' && 'View and manage all your customers'}
                    {activeTab === 'vehicles' && 'View and manage all customer vehicles'}
                    {activeTab === 'indents' && 'View and manage fuel indents'}
                    {activeTab === 'reminders' && 'Send payment reminders via SMS and WhatsApp'}
                  </CardDescription>
                </>
              )}
            </CardHeader>

            <CardContent>
              {activeTab === 'all-customers' && (
                <>
                  <div className="mb-4 flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search customers..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>GST</TableHead>
                        <TableHead>Balance</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCustomers.length > 0 ? (
                        filteredCustomers.map((customer) => (
                          <TableRow key={customer.id}>
                            <TableCell className="font-medium">{customer.name}</TableCell>
                            <TableCell>{customer.contact}</TableCell>
                            <TableCell>{customer.phone}</TableCell>
                            <TableCell>{customer.gst}</TableCell>
                            <TableCell>{customer.balance}</TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleSelectCustomer(customer.id)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon">
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center">
                            No customers found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </>
              )}

              {activeTab === 'customer-details' && selectedCustomerData && (
                <div className="space-y-6">
                  <Tabs defaultValue="details">
                    <TabsList>
                      <TabsTrigger value="details">Details</TabsTrigger>
                      <TabsTrigger value="vehicles">Vehicles ({customerVehicles.length})</TabsTrigger>
                      <TabsTrigger value="indents">Indents ({customerIndents.length})</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="details" className="space-y-4 pt-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Company Name</label>
                          <p className="text-lg">{selectedCustomerData.name}</p>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Contact Person</label>
                          <p className="text-lg">{selectedCustomerData.contact}</p>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Phone</label>
                          <p className="text-lg">{selectedCustomerData.phone}</p>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Email</label>
                          <p className="text-lg">{selectedCustomerData.email}</p>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">GST Number</label>
                          <p className="text-lg">{selectedCustomerData.gst}</p>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Current Balance</label>
                          <p className="text-lg font-semibold">{selectedCustomerData.balance}</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button>Edit Details</Button>
                        <Button variant="outline">Send Reminder</Button>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="vehicles" className="pt-4">
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
                          {customerVehicles.length > 0 ? (
                            customerVehicles.map((vehicle) => (
                              <TableRow key={vehicle.id}>
                                <TableCell className="font-medium">{vehicle.number}</TableCell>
                                <TableCell>{vehicle.type}</TableCell>
                                <TableCell>{vehicle.capacity}</TableCell>
                                <TableCell>
                                  <div className="flex space-x-2">
                                    <Button variant="ghost" size="icon">
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon">
                                      <Trash className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center">
                                No vehicles found for this customer
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                      <div className="mt-4">
                        <Button>
                          <Plus className="mr-2 h-4 w-4" /> Add Vehicle
                        </Button>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="indents" className="pt-4">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Indent ID</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Vehicle</TableHead>
                            <TableHead>Fuel Type</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {customerIndents.length > 0 ? (
                            customerIndents.map((indent) => (
                              <TableRow key={indent.id}>
                                <TableCell className="font-medium">{indent.id}</TableCell>
                                <TableCell>{indent.date}</TableCell>
                                <TableCell>{indent.vehicle}</TableCell>
                                <TableCell>{indent.fuelType}</TableCell>
                                <TableCell>{indent.quantity}</TableCell>
                                <TableCell>{indent.amount}</TableCell>
                                <TableCell>{indent.status}</TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center">
                                No indents found for this customer
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                      <div className="mt-4">
                        <Button>
                          <Plus className="mr-2 h-4 w-4" /> Create Indent
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              )}

              {activeTab === 'vehicles' && (
                <div className="space-y-4">
                  <div className="mb-4 flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Search vehicles..." className="pl-8" />
                    </div>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" /> Add Vehicle
                    </Button>
                  </div>
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vehicle Number</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Capacity</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockVehicles.map((vehicle) => {
                        const owner = mockCustomers.find(c => c.id === vehicle.customer);
                        return (
                          <TableRow key={vehicle.id}>
                            <TableCell className="font-medium">{vehicle.number}</TableCell>
                            <TableCell>{owner?.name}</TableCell>
                            <TableCell>{vehicle.type}</TableCell>
                            <TableCell>{vehicle.capacity}</TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button variant="ghost" size="icon">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon">
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}

              {activeTab === 'indents' && (
                <div className="space-y-4">
                  <div className="mb-4 flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Search indents..." className="pl-8" />
                    </div>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" /> Create Indent
                    </Button>
                  </div>
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Indent ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Vehicle</TableHead>
                        <TableHead>Fuel Type</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockIndents.map((indent) => {
                        const customer = mockCustomers.find(c => c.id === indent.customer);
                        return (
                          <TableRow key={indent.id}>
                            <TableCell className="font-medium">{indent.id}</TableCell>
                            <TableCell>{customer?.name}</TableCell>
                            <TableCell>{indent.date}</TableCell>
                            <TableCell>{indent.vehicle}</TableCell>
                            <TableCell>{indent.fuelType}</TableCell>
                            <TableCell>{indent.quantity}</TableCell>
                            <TableCell>{indent.amount}</TableCell>
                            <TableCell>{indent.status}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}

              {activeTab === 'reminders' && (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="mb-4 text-center">
                    <h3 className="text-xl font-semibold">Payment Reminders</h3>
                    <p className="text-muted-foreground">
                      Send SMS and WhatsApp reminders to customers about payment due
                    </p>
                  </div>
                  <div className="w-full max-w-md">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Customer</label>
                            <select className="w-full rounded-md border border-input bg-background px-3 py-2">
                              <option value="">Select customer</option>
                              {mockCustomers.map(c => (
                                <option key={c.id} value={c.id}>{c.name} (Balance: {c.balance})</option>
                              ))}
                            </select>
                          </div>
                          
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Message</label>
                            <textarea
                              className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2"
                              placeholder="Enter reminder message..."
                              defaultValue={`Dear Customer,\nThis is a reminder that your payment of ₹X is due. Please make the payment at your earliest convenience.\nThank you,\nFuel Pump Management`}
                            />
                          </div>
                          
                          <div className="flex gap-2">
                            <Button className="flex-1">
                              Send SMS
                            </Button>
                            <Button className="flex-1">
                              Send WhatsApp
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Customers;
