
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { toast } from '@/components/ui/use-toast';

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

interface Customer {
  id: string;
  name: string;
  contact: string;
  phone: string;
  email: string;
  gst: string;
  balance: number;
}

const Customers = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all-customers');

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('customers')
          .select('*');
          
        if (error) {
          throw error;
        }
        
        return data || [];
      } catch (error) {
        console.error('Error fetching customers:', error);
        toast({
          title: "Error",
          description: "Failed to load customer data",
          variant: "destructive"
        });
        return [];
      }
    }
  });

  const filteredCustomers = customers.filter((customer: Customer) => 
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    customer.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm)
  );

  const handleSelectCustomer = (customerId: string) => {
    navigate(`/customers/${customerId}`);
  };

  const customerVehicles = mockVehicles.filter(vehicle => vehicle.customer === activeTab);
  const customerIndents = mockIndents.filter(indent => indent.customer === activeTab);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between space-y-2 md:flex-row md:items-center md:space-y-0">
        <h2 className="text-3xl font-bold tracking-tight">Customers</h2>
        <div className="flex items-center gap-2">
          <Button onClick={() => navigate('/customers/new')}>
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
                  
                  {isLoading ? (
                    <div className="py-8 text-center">Loading customers...</div>
                  ) : (
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
                          filteredCustomers.map((customer: Customer) => (
                            <TableRow 
                              key={customer.id} 
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => handleSelectCustomer(customer.id)}
                            >
                              <TableCell className="font-medium">{customer.name}</TableCell>
                              <TableCell>{customer.contact}</TableCell>
                              <TableCell>{customer.phone}</TableCell>
                              <TableCell>{customer.gst}</TableCell>
                              <TableCell>₹{customer.balance?.toFixed(2) || '0.00'}</TableCell>
                              <TableCell onClick={(e) => e.stopPropagation()}>
                                <div className="flex space-x-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSelectCustomer(customer.id);
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // Delete functionality would go here
                                    }}
                                  >
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
                  )}
                </>
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
                        const owner = customers.find((c: Customer) => c.id === vehicle.customer);
                        return (
                          <TableRow key={vehicle.id}>
                            <TableCell className="font-medium">{vehicle.number}</TableCell>
                            <TableCell>{owner?.name || 'Unknown'}</TableCell>
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
                        const customer = customers.find((c: Customer) => c.id === indent.customer);
                        return (
                          <TableRow key={indent.id}>
                            <TableCell className="font-medium">{indent.id}</TableCell>
                            <TableCell>{customer?.name || 'Unknown'}</TableCell>
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
                              {customers.map((c: Customer) => (
                                <option key={c.id} value={c.id}>{c.name} (Balance: ₹{c.balance?.toFixed(2) || '0.00'})</option>
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
