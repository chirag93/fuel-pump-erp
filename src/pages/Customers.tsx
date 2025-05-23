
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Users, FileText, Plus, Search, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Customer } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllCustomers, createCustomer } from '@/integrations/customers';
import { getFuelPumpId } from '@/integrations/utils';

const Customers = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [newCustomer, setNewCustomer] = useState<Partial<Customer>>({
    name: '',
    gst: '',
    email: '',
    phone: '',
    contact: '',
    balance: 0
  });

  // Query for fuel pump ID
  const { data: fuelPumpId } = useQuery({
    queryKey: ['fuelPumpId'],
    queryFn: getFuelPumpId,
    staleTime: 1000 * 60 * 60, // 1 hour cache
    retry: 1
  });

  // Query for customers with caching
  const { 
    data: customers = [], 
    isLoading: isLoadingCustomers 
  } = useQuery({
    queryKey: ['customers', fuelPumpId],
    queryFn: getAllCustomers,
    enabled: !!fuelPumpId,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
    refetchOnWindowFocus: false,
    meta: {
      onError: (error: Error) => {
        console.error('Error fetching customers:', error);
        toast({
          title: "Error",
          description: "Failed to load customer data. Please try again.",
          variant: "destructive"
        });
      }
    }
  });

  // Query for booklets with caching
  const { 
    data: booklets = [], 
    isLoading: isLoadingBooklets 
  } = useQuery({
    queryKey: ['indentBooklets', fuelPumpId],
    queryFn: async () => {
      if (!fuelPumpId) return [];
      
      const { data, error } = await supabase
        .from('indent_booklets')
        .select('*')
        .eq('fuel_pump_id', fuelPumpId);
        
      if (error) throw error;
      return data || [];
    },
    enabled: !!fuelPumpId,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
    refetchOnWindowFocus: false,
    meta: {
      onError: (error: Error) => {
        console.error('Error fetching booklets:', error);
      }
    }
  });

  // Create customer mutation
  const createCustomerMutation = useMutation({
    mutationFn: (customerData: Omit<Customer, 'id' | 'created_at' | 'fuel_pump_id'>) => 
      createCustomer(customerData),
    onSuccess: (newCustomer) => {
      if (newCustomer) {
        // Update cache with the new customer
        queryClient.setQueryData(['customers', fuelPumpId], (old: Customer[] = []) => [...old, newCustomer]);
        
        setIsDialogOpen(false);
        setNewCustomer({
          name: '',
          gst: '',
          email: '',
          phone: '',
          contact: '',
          balance: 0
        });
        
        toast({
          title: "Success",
          description: "Customer added successfully"
        });
      }
    },
    onError: (error) => {
      console.error('Error adding customer:', error);
      toast({
        title: "Error",
        description: "Failed to add customer. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleAddCustomer = async () => {
    try {
      if (!newCustomer.name || !newCustomer.gst || !newCustomer.email || 
          !newCustomer.phone || !newCustomer.contact) {
        toast({
          title: "Missing information",
          description: "Please fill all required fields",
          variant: "destructive"
        });
        return;
      }
      
      createCustomerMutation.mutate({
        name: newCustomer.name,
        gst: newCustomer.gst,
        email: newCustomer.email,
        phone: newCustomer.phone,
        contact: newCustomer.contact,
        balance: newCustomer.balance || 0
      });
    } catch (error) {
      console.error('Error in handleAddCustomer:', error);
    }
  };
  
  const filteredCustomers = search 
    ? customers.filter(customer => 
        customer.name.toLowerCase().includes(search.toLowerCase()) ||
        customer.contact.toLowerCase().includes(search.toLowerCase()) ||
        customer.phone.includes(search) ||
        customer.email.toLowerCase().includes(search.toLowerCase()) ||
        customer.gst.toLowerCase().includes(search.toLowerCase())
      )
    : customers;
    
  const handleRowClick = (customerId: string) => {
    navigate(`/customers/${customerId}`);
  };
  
  const exportCustomers = () => {
    // Get booklet ranges for each customer
    const customerBookletMap = new Map<string, string[]>();
    
    booklets.forEach(booklet => {
      if (!customerBookletMap.has(booklet.customer_id)) {
        customerBookletMap.set(booklet.customer_id, []);
      }
      
      const range = `${booklet.start_number}-${booklet.end_number} (${booklet.status})`;
      customerBookletMap.get(booklet.customer_id)?.push(range);
    });
    
    // Define CSV headers
    const headers = [
      'Name', 
      'Contact Person', 
      'Phone', 
      'Email', 
      'GST', 
      'Balance', 
      'Indent Booklet Ranges'
    ];
    
    // Convert customers to CSV rows
    const rows = customers.map(customer => {
      const bookletRanges = customerBookletMap.get(customer.id) || [];
      return [
        customer.name,
        customer.contact,
        customer.phone,
        customer.email,
        customer.gst,
        customer.balance,
        bookletRanges.join('; ')
      ];
    });
    
    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Create a blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `customers_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Combined loading state
  const isLoading = isLoadingCustomers || isLoadingBooklets;
  
  // Calculate total credit (positive balances)
  const totalCredit = customers.reduce((sum, customer) => 
    sum + (customer.balance > 0 ? customer.balance : 0), 0);
  
  // Calculate total owed to us (negative balances)
  const totalOwed = Math.abs(customers.reduce((sum, customer) => 
    sum + (customer.balance < 0 ? customer.balance : 0), 0));
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Customers</h1>
        <div className="flex gap-2">
          {customers.length > 0 && (
            <Button variant="outline" onClick={exportCustomers} className="flex items-center gap-2">
              <Download size={16} />
              Export CSV
            </Button>
          )}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus size={16} />
                Add Customer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add New Customer</DialogTitle>
                <DialogDescription>
                  Enter the details of the new customer.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Business Name*</Label>
                  <Input
                    id="name"
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                    placeholder="e.g. ABC Logistics"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="gst">GST Number*</Label>
                  <Input
                    id="gst"
                    value={newCustomer.gst}
                    onChange={(e) => setNewCustomer({...newCustomer, gst: e.target.value})}
                    placeholder="e.g. 22AAAAA0000A1Z5"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="contact">Contact Person*</Label>
                    <Input
                      id="contact"
                      value={newCustomer.contact}
                      onChange={(e) => setNewCustomer({...newCustomer, contact: e.target.value})}
                      placeholder="e.g. Rajesh Kumar"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Phone Number*</Label>
                    <Input
                      id="phone"
                      value={newCustomer.phone}
                      onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                      placeholder="e.g. 9876543210"
                    />
                  </div>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="email">Email*</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                    placeholder="e.g. info@abclogistics.com"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="balance">Initial Balance</Label>
                  <Input
                    id="balance"
                    type="number"
                    value={newCustomer.balance?.toString()}
                    onChange={(e) => setNewCustomer({...newCustomer, balance: parseFloat(e.target.value)})}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleAddCustomer} disabled={createCustomerMutation.isPending}>
                  {createCustomerMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    'Add Customer'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search customers..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading customers...</span>
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl">Total Customers</CardTitle>
                <CardDescription>Number of registered customers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{customers.length}</div>
                <p className="text-sm text-muted-foreground">registered accounts</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl">Total Credit</CardTitle>
                <CardDescription>Total credit issued to customers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">
                  ₹{totalCredit.toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground">in active credit</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl">Total Owed</CardTitle>
                <CardDescription>Total money owed to you</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-red-600">
                  ₹{totalOwed.toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground">in outstanding debt</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl">Active Customers</CardTitle>
                <CardDescription>Customers with active transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">
                  {customers.filter(c => c.balance !== 0).length}
                </div>
                <p className="text-sm text-muted-foreground">with outstanding balance</p>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Customer List</CardTitle>
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
              <CardDescription>
                Click on a customer row to view details
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredCustomers.length === 0 ? (
                <div className="py-6 text-center text-muted-foreground">
                  {search ? "No customers found matching your search" : "No customers yet. Add your first customer to get started."}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Contact Person</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>GST</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCustomers.map((customer) => (
                        <TableRow 
                          key={customer.id} 
                          className="cursor-pointer hover:bg-secondary/30"
                          onClick={() => handleRowClick(customer.id)}
                        >
                          <TableCell className="font-medium">{customer.name}</TableCell>
                          <TableCell>{customer.contact}</TableCell>
                          <TableCell>{customer.phone}</TableCell>
                          <TableCell>{customer.email}</TableCell>
                          <TableCell>{customer.gst}</TableCell>
                          <TableCell className="text-right">
                            <span className={
                              customer.balance > 0 
                                ? "text-green-600 font-medium" 
                                : customer.balance < 0 
                                  ? "text-red-600 font-medium" 
                                  : ""
                            }>
                              ₹{customer.balance.toLocaleString()}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default Customers;
