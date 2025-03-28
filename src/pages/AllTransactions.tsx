import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Download, Calendar, Loader2, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { getFuelPumpId } from '@/integrations/utils';
import { useAuth } from '@/contexts/AuthContext';

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
  const { fuelPumpId } = useAuth(); // Use fuel pump ID from auth context
  
  const PAGE_SIZE = 10;

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

  const fetchTransactions = async (start?: string, end?: string) => {
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

  const handleFilterByDate = () => {
    const { startDate, endDate } = dateRange;
    
    if (!startDate || !endDate) {
      toast({
        title: "Missing dates",
        description: "Please select both start and end dates",
        variant: "destructive"
      });
      return;
    }
    
    setIsFiltering(true);
    setCurrentPage(1); // Reset to first page when filtering
    fetchTransactions(startDate, endDate);
  };

  const clearFilters = () => {
    setDateRange({ startDate: '', endDate: '' });
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
      
      // Add date filtering if requested
      if (filtered && dateRange.startDate && dateRange.endDate) {
        query = query.gte('date', dateRange.startDate).lte('date', dateRange.endDate);
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
        
        // Set filename with date range if filtered
        const today = new Date().toISOString().split('T')[0];
        const filename = filtered && dateRange.startDate && dateRange.endDate
          ? `transactions_${dateRange.startDate}_to_${dateRange.endDate}.csv`
          : `all_transactions_${today}.csv`;
          
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
            Filter transactions by date range
          </CardDescription>
        </CardHeader>
        <CardContent>
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
            
            <Button onClick={handleFilterByDate} disabled={isLoading}>
              <Calendar className="mr-2 h-4 w-4" />
              Apply Filter
            </Button>
            
            {isFiltering && (
              <Button variant="outline" onClick={clearFilters} disabled={isLoading}>
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Transaction Records</CardTitle>
          <CardDescription>
            {isFiltering && dateRange.startDate && dateRange.endDate
              ? `Showing transactions from ${new Date(dateRange.startDate).toLocaleDateString()} to ${new Date(dateRange.endDate).toLocaleDateString()}`
              : 'Showing all transactions'
            }
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
