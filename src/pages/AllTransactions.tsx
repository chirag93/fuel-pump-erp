
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Download, Calendar, Loader2, FileText, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { getFuelPumpId } from '@/integrations/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Transaction {
  id: string;
  date: string;
  customer_name?: string;
  vehicle_number?: string;
  fuel_type: string;
  quantity: number;
  amount: number;
  payment_method: string;
  indent_id?: string;
}

const AllTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [isFiltering, setIsFiltering] = useState(false);
  const { fuelPumpId } = useAuth();
  
  // New filter states
  const [customers, setCustomers] = useState<{id: string, name: string}[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [fuelTypes, setFuelTypes] = useState<string[]>([]);
  const [selectedFuelType, setSelectedFuelType] = useState<string>('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
  
  const PAGE_SIZE = 10;

  // Fetch customer list for filter dropdown
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const fuelPumpId = await getFuelPumpId();
        if (!fuelPumpId) return;
        
        const { data, error } = await supabase
          .from('customers')
          .select('id, name')
          .eq('fuel_pump_id', fuelPumpId)
          .order('name');
          
        if (error) throw error;
        if (data) setCustomers(data);
      } catch (error) {
        console.error('Error fetching customers:', error);
      }
    };
    
    fetchCustomers();
  }, []);
  
  // Fetch available fuel types and payment methods
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const fuelPumpId = await getFuelPumpId();
        if (!fuelPumpId) return;
        
        // Get distinct fuel types
        const { data: fuelTypeData, error: fuelTypeError } = await supabase
          .from('transactions')
          .select('fuel_type')
          .eq('fuel_pump_id', fuelPumpId)
          .not('fuel_type', 'is', null)
          .distinctOn('fuel_type');
          
        if (fuelTypeError) throw fuelTypeError;
        
        if (fuelTypeData) {
          const types = fuelTypeData.map(item => item.fuel_type).filter(Boolean);
          setFuelTypes(types);
        }
        
        // Get distinct payment methods
        const { data: paymentData, error: paymentError } = await supabase
          .from('transactions')
          .select('payment_method')
          .eq('fuel_pump_id', fuelPumpId)
          .not('payment_method', 'is', null)
          .distinctOn('payment_method');
          
        if (paymentError) throw paymentError;
        
        if (paymentData) {
          const methods = paymentData.map(item => item.payment_method).filter(Boolean);
          setPaymentMethods(methods);
        }
      } catch (error) {
        console.error('Error fetching filter options:', error);
      }
    };
    
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    if (fuelPumpId) {
      console.log(`AllTransactions: Using fuel pump ID from auth context: ${fuelPumpId}`);
      fetchTransactions();
    } else {
      console.log('AllTransactions: No fuel pump ID available, fetching from utils');
      // If not in context, try to get it using the utility function
      const initializeFuelPumpId = async () => {
        const pumpId = await getFuelPumpId();
        if (pumpId) {
          console.log(`AllTransactions: Retrieved fuel pump ID: ${pumpId}`);
          fetchTransactions();
        } else {
          console.error('AllTransactions: Failed to get fuel pump ID');
          toast({
            title: "Authentication Required",
            description: "Please sign in to view transactions",
            variant: "destructive"
          });
        }
      };
      
      initializeFuelPumpId();
    }
  }, [currentPage, fuelPumpId]);

  const fetchTransactions = async (start?: string, end?: string, customerId?: string, fuelType?: string, paymentMethod?: string) => {
    setIsLoading(true);
    
    try {
      // Get current fuel pump ID if not provided by context
      const currentFuelPumpId = fuelPumpId || await getFuelPumpId();
      
      if (!currentFuelPumpId) {
        console.error('AllTransactions: No fuel pump ID available for fetching transactions');
        toast({
          title: "Authentication Required",
          description: "Please sign in to view transactions",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      
      console.log(`AllTransactions: Fetching transactions for pump ID: ${currentFuelPumpId}`);
      
      // Calculate pagination range
      const from = (currentPage - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      
      // Start building the query
      let query = supabase
        .from('transactions')
        .select(`
          *,
          customers(name),
          vehicles(number)
        `, { count: 'exact' })
        .eq('fuel_pump_id', currentFuelPumpId); // Add fuel pump filter
      
      // Add date filtering if provided
      if (start && end) {
        query = query.gte('date', start).lte('date', end);
      }
      
      // Add customer filtering if provided
      if (customerId) {
        query = query.eq('customer_id', customerId);
      }
      
      // Add fuel type filtering if provided
      if (fuelType) {
        query = query.eq('fuel_type', fuelType);
      }
      
      // Add payment method filtering if provided
      if (paymentMethod) {
        query = query.eq('payment_method', paymentMethod);
      }
      
      // Add pagination and ordering
      const { data, error, count } = await query
        .order('date', { ascending: false })
        .range(from, to);
      
      if (error) {
        throw error;
      }
      
      if (data) {
        console.log(`AllTransactions: Retrieved ${data.length} transactions for fuel pump ${currentFuelPumpId}`);
        
        // Format the data to include joined fields
        const formattedData = data.map(item => ({
          id: item.id,
          date: item.date,
          customer_name: item.customers?.name || 'Walk-in Customer',
          vehicle_number: item.vehicles?.number || 'N/A',
          fuel_type: item.fuel_type,
          quantity: item.quantity,
          amount: item.amount,
          payment_method: item.payment_method,
          indent_id: item.indent_id
        }));
        
        setTransactions(formattedData);
        
        // Set pagination data
        if (count !== null) {
          setTotalCount(count);
          setTotalPages(Math.ceil(count / PAGE_SIZE));
        }
      } else {
        console.log('AllTransactions: No transactions found');
        setTransactions([]);
        setTotalCount(0);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast({
        title: "Error",
        description: "Failed to load transactions",
        variant: "destructive"
      });
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleFilterByAll = () => {
    const { startDate, endDate } = dateRange;
    const filterActive = startDate || endDate || selectedCustomerId || selectedFuelType || selectedPaymentMethod;
    
    if (!filterActive) {
      toast({
        title: "No filters selected",
        description: "Please select at least one filter option",
        variant: "destructive"
      });
      return;
    }
    
    setIsFiltering(filterActive);
    setCurrentPage(1); // Reset to first page when filtering
    fetchTransactions(
      dateRange.startDate || undefined, 
      dateRange.endDate || undefined,
      selectedCustomerId || undefined,
      selectedFuelType || undefined,
      selectedPaymentMethod || undefined
    );
  };

  const clearFilters = () => {
    setDateRange({ startDate: '', endDate: '' });
    setSelectedCustomerId('');
    setSelectedFuelType('');
    setSelectedPaymentMethod('');
    setIsFiltering(false);
    setCurrentPage(1);
    fetchTransactions();
  };

  const exportTransactionsCSV = async (filtered = false) => {
    try {
      setIsLoading(true);
      
      // Get current fuel pump ID if not provided by context
      const currentFuelPumpId = fuelPumpId || await getFuelPumpId();
      
      if (!currentFuelPumpId) {
        console.error('AllTransactions: No fuel pump ID available for exporting transactions');
        toast({
          title: "Authentication Required",
          description: "Please sign in to export transactions",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      
      // Fetch all data for export (no pagination)
      let query = supabase
        .from('transactions')
        .select(`
          *,
          customers(name),
          vehicles(number)
        `)
        .eq('fuel_pump_id', currentFuelPumpId); // Add fuel pump filter
      
      // Add filters if requested
      if (filtered) {
        if (dateRange.startDate && dateRange.endDate) {
          query = query.gte('date', dateRange.startDate).lte('date', dateRange.endDate);
        }
        
        if (selectedCustomerId) {
          query = query.eq('customer_id', selectedCustomerId);
        }
        
        if (selectedFuelType) {
          query = query.eq('fuel_type', selectedFuelType);
        }
        
        if (selectedPaymentMethod) {
          query = query.eq('payment_method', selectedPaymentMethod);
        }
      }
      
      // Add ordering
      const { data, error } = await query.order('date', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      if (data) {
        console.log(`AllTransactions: Exporting ${data.length} transactions for fuel pump ${currentFuelPumpId}`);
        
        // Format the data
        const csvData = data.map(item => ({
          date: new Date(item.date).toLocaleDateString(),
          customer: item.customers?.name || 'Walk-in Customer',
          vehicle: item.vehicles?.number || 'N/A',
          fuel_type: item.fuel_type,
          quantity: item.quantity.toFixed(2),
          amount: item.amount.toFixed(2).replace(/[₹,]/g, ''), // Remove special characters
          payment_method: item.payment_method,
          indent_id: item.indent_id || '-'
        }));
        
        // Convert to CSV
        const headers = Object.keys(csvData[0]);
        const csvRows = [
          headers.join(','),
          ...csvData.map(row => {
            return headers.map(header => {
              return `"${row[header]}"`;
            }).join(',');
          })
        ];
        
        const csvString = csvRows.join('\n');
        
        // Create download
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        
        // Set filename with filters indication
        const today = new Date().toISOString().split('T')[0];
        let filename = `transactions_${today}.csv`;
        
        if (filtered) {
          const filterParts = [];
          
          if (dateRange.startDate && dateRange.endDate) {
            filterParts.push(`${dateRange.startDate}_to_${dateRange.endDate}`);
          }
          
          if (selectedCustomerId) {
            const customerName = customers.find(c => c.id === selectedCustomerId)?.name;
            if (customerName) filterParts.push(`customer_${customerName.replace(/\s+/g, '_')}`);
          }
          
          if (selectedFuelType) filterParts.push(`fuel_${selectedFuelType}`);
          if (selectedPaymentMethod) filterParts.push(`payment_${selectedPaymentMethod}`);
          
          if (filterParts.length > 0) {
            filename = `transactions_${filterParts.join('_')}_${today}.csv`;
          }
        }
          
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: "Export successful",
          description: "Transaction data has been exported to CSV"
        });
      }
    } catch (error) {
      console.error('Error exporting transactions:', error);
      toast({
        title: "Export failed",
        description: "Could not export transaction data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Generate pagination items
  const renderPaginationItems = () => {
    const items = [];
    
    // Always show first page
    items.push(
      <PaginationItem key="first">
        <PaginationLink 
          isActive={currentPage === 1} 
          onClick={() => handlePageChange(1)}
        >
          1
        </PaginationLink>
      </PaginationItem>
    );
    
    // Show ellipsis if needed
    if (currentPage > 3) {
      items.push(
        <PaginationItem key="ellipsis1">
          <span className="flex h-9 w-9 items-center justify-center">...</span>
        </PaginationItem>
      );
    }
    
    // Show pages around current page
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      if (i <= 1 || i >= totalPages) continue; // Skip first and last as they're always shown
      
      items.push(
        <PaginationItem key={i}>
          <PaginationLink 
            isActive={currentPage === i} 
            onClick={() => handlePageChange(i)}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    // Show ellipsis if needed
    if (currentPage < totalPages - 2) {
      items.push(
        <PaginationItem key="ellipsis2">
          <span className="flex h-9 w-9 items-center justify-center">...</span>
        </PaginationItem>
      );
    }
    
    // Always show last page if there's more than 1 page
    if (totalPages > 1) {
      items.push(
        <PaginationItem key="last">
          <PaginationLink 
            isActive={currentPage === totalPages} 
            onClick={() => handlePageChange(totalPages)}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    return items;
  };

  // Generate filter description text
  const getFilterDescription = () => {
    const parts = [];
    
    if (dateRange.startDate && dateRange.endDate) {
      parts.push(`from ${new Date(dateRange.startDate).toLocaleDateString()} to ${new Date(dateRange.endDate).toLocaleDateString()}`);
    }
    
    if (selectedCustomerId) {
      const customerName = customers.find(c => c.id === selectedCustomerId)?.name;
      if (customerName) parts.push(`for customer: ${customerName}`);
    }
    
    if (selectedFuelType) {
      parts.push(`fuel type: ${selectedFuelType}`);
    }
    
    if (selectedPaymentMethod) {
      parts.push(`payment method: ${selectedPaymentMethod}`);
    }
    
    if (parts.length === 0) {
      return 'Showing all transactions';
    }
    
    return `Showing transactions ${parts.join(', ')}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">All Transactions</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportTransactionsCSV(false)}>
            <Download className="mr-2 h-4 w-4" />
            Export All
          </Button>
          
          {isFiltering && (
            <Button variant="outline" onClick={() => exportTransactionsCSV(true)}>
              <Download className="mr-2 h-4 w-4" />
              Export Filtered
            </Button>
          )}
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Filter Transactions</CardTitle>
          <CardDescription>
            Filter transactions by date, customer, fuel type and payment method
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="grid gap-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                />
              </div>
            </div>
            
            <div className="flex flex-wrap items-end gap-4">
              <div className="grid gap-2 w-[200px]">
                <Label htmlFor="customer">Customer</Label>
                <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                  <SelectTrigger id="customer">
                    <SelectValue placeholder="All customers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All customers</SelectItem>
                    {customers.map(customer => (
                      <SelectItem key={customer.id} value={customer.id}>{customer.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2 w-[200px]">
                <Label htmlFor="fuel-type">Fuel Type</Label>
                <Select value={selectedFuelType} onValueChange={setSelectedFuelType}>
                  <SelectTrigger id="fuel-type">
                    <SelectValue placeholder="All fuel types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All fuel types</SelectItem>
                    {fuelTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2 w-[200px]">
                <Label htmlFor="payment-method">Payment Method</Label>
                <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                  <SelectTrigger id="payment-method">
                    <SelectValue placeholder="All payment methods" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All payment methods</SelectItem>
                    {paymentMethods.map(method => (
                      <SelectItem key={method} value={method}>{method}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex mt-6 gap-2">
                <Button onClick={handleFilterByAll} disabled={isLoading}>
                  <Filter className="mr-2 h-4 w-4" />
                  Apply Filters
                </Button>
                
                {isFiltering && (
                  <Button variant="outline" onClick={clearFilters} disabled={isLoading}>
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Transaction Records</CardTitle>
          <CardDescription>
            {isFiltering ? getFilterDescription() : 'Showing all transactions'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="mr-2 h-6 w-6 animate-spin" />
              <span>Loading transactions...</span>
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-8 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No transactions found</p>
              {isFiltering && (
                <Button variant="link" onClick={clearFilters} className="mt-2">
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Fuel Type</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Indent ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                      <TableCell>{transaction.customer_name}</TableCell>
                      <TableCell>{transaction.vehicle_number}</TableCell>
                      <TableCell>{transaction.fuel_type}</TableCell>
                      <TableCell>{transaction.quantity} L</TableCell>
                      <TableCell>₹{transaction.amount.toLocaleString()}</TableCell>
                      <TableCell>{transaction.payment_method}</TableCell>
                      <TableCell>{transaction.indent_id || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              <div className="mt-4">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => handlePageChange(currentPage - 1)}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                    
                    {renderPaginationItems()}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => handlePageChange(currentPage + 1)}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
                
                <p className="text-sm text-center text-muted-foreground mt-2">
                  Showing {transactions.length} of {totalCount} transactions
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AllTransactions;
