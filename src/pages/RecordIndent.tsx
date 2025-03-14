
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from "@/hooks/use-toast";
import { Loader2, FileText, Calendar as CalendarIcon } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { Customer, Vehicle, Transaction, IndentBooklet } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface RecentTransaction extends Transaction {
  customer_name?: string;
  vehicle_number?: string;
}

const RecordIndent = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [indentBooklets, setIndentBooklets] = useState<IndentBooklet[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [selectedBooklet, setSelectedBooklet] = useState<string>('');
  const [indentNumber, setIndentNumber] = useState<string>('');
  const [fuelType, setFuelType] = useState<string>('Petrol');
  const [amount, setAmount] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isCustomerLoading, setIsCustomerLoading] = useState<boolean>(true);
  const [isVehicleLoading, setIsVehicleLoading] = useState<boolean>(true);
  const [isBookletLoading, setIsBookletLoading] = useState<boolean>(true);
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [isTransactionsLoading, setIsTransactionsLoading] = useState<boolean>(true);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [indentNumberError, setIndentNumberError] = useState<string>('');

  useEffect(() => {
    fetchCustomers();
    fetchVehicles();
    fetchRecentTransactions();
  }, []);

  useEffect(() => {
    if (selectedCustomer) {
      fetchVehicles(selectedCustomer);
      fetchIndentBooklets(selectedCustomer);
    } else {
      setVehicles([]);
      setIndentBooklets([]);
    }
  }, [selectedCustomer]);

  const fetchCustomers = async () => {
    setIsCustomerLoading(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        throw error;
      }

      if (data) {
        setCustomers(data);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast({
        title: "Error",
        description: "Failed to load customers. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCustomerLoading(false);
    }
  };

  const fetchVehicles = async (customerId: string = '') => {
    setIsVehicleLoading(true);
    try {
      let query = supabase
        .from('vehicles')
        .select('*')
        .order('number', { ascending: true });

      if (customerId) {
        query = query.eq('customer_id', customerId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      if (data) {
        setVehicles(data);
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      toast({
        title: "Error",
        description: "Failed to load vehicles. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsVehicleLoading(false);
    }
  };

  const fetchIndentBooklets = async (customerId: string) => {
    setIsBookletLoading(true);
    try {
      const { data, error } = await supabase
        .from('indent_booklets')
        .select('*')
        .eq('customer_id', customerId)
        .eq('status', 'Active')
        .order('issued_date', { ascending: false });

      if (error) {
        throw error;
      }

      if (data) {
        setIndentBooklets(data);
      }
    } catch (error) {
      console.error('Error fetching indent booklets:', error);
      toast({
        title: "Error",
        description: "Failed to load indent booklets. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsBookletLoading(false);
    }
  };

  const fetchRecentTransactions = async () => {
    setIsTransactionsLoading(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          customers(name),
          vehicles(number)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        throw error;
      }

      if (data) {
        const formattedTransactions: RecentTransaction[] = data.map(item => ({
          ...item,
          customer_name: item.customers?.name || 'Walk-in Customer',
          vehicle_number: item.vehicles?.number || 'N/A'
        }));
        setRecentTransactions(formattedTransactions);
      }
    } catch (error) {
      console.error('Error fetching recent transactions:', error);
      toast({
        title: "Error",
        description: "Failed to load recent transactions. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsTransactionsLoading(false);
    }
  };

  const validateIndentNumber = (bookletId: string, indentNum: string) => {
    if (!bookletId || !indentNum) {
      setIndentNumberError('');
      return false;
    }

    const selectedBookletData = indentBooklets.find(booklet => booklet.id === bookletId);
    
    if (!selectedBookletData) {
      setIndentNumberError('Selected booklet not found');
      return false;
    }

    const startNum = parseInt(selectedBookletData.start_number);
    const endNum = parseInt(selectedBookletData.end_number);
    const currentNum = parseInt(indentNum);

    if (isNaN(currentNum)) {
      setIndentNumberError('Please enter a valid number');
      return false;
    }

    if (currentNum < startNum || currentNum > endNum) {
      setIndentNumberError(`Indent number must be between ${startNum} and ${endNum}`);
      return false;
    }

    // Check if this indent number has already been used
    supabase
      .from('indents')
      .select('id')
      .eq('indent_number', indentNum)
      .eq('booklet_id', bookletId)
      .then(({ data, error }) => {
        if (error) {
          console.error('Error checking indent number:', error);
          return;
        }

        if (data && data.length > 0) {
          setIndentNumberError('This indent number has already been used');
          return false;
        } else {
          setIndentNumberError('');
          return true;
        }
      });

    // Initial validation passed
    setIndentNumberError('');
    return true;
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!selectedCustomer || !selectedVehicle || !fuelType || !amount || !quantity || !date) {
        toast({
          title: "Missing information",
          description: "Please fill all required fields",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }

      // Additional validation for the indent number if a booklet is selected
      if (selectedBooklet) {
        if (!indentNumber) {
          toast({
            title: "Missing indent number",
            description: "Please enter an indent number from the selected booklet",
            variant: "destructive"
          });
          setIsSubmitting(false);
          return;
        }

        const isValid = validateIndentNumber(selectedBooklet, indentNumber);
        if (!isValid || indentNumberError) {
          toast({
            title: "Invalid indent number",
            description: indentNumberError || "Please check the indent number",
            variant: "destructive"
          });
          setIsSubmitting(false);
          return;
        }
      }

      // Generate a UUID for the transaction
      const transactionId = crypto.randomUUID();
      
      // Using staff_id as a required field - setting a placeholder value
      const staffId = "00000000-0000-0000-0000-000000000000"; // Default staff ID

      // Create a transaction
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          id: transactionId,
          customer_id: selectedCustomer,
          vehicle_id: selectedVehicle,
          staff_id: staffId,
          date: date.toISOString(),
          fuel_type: fuelType,
          amount: amount,
          quantity: quantity,
          payment_method: 'Cash', // Default payment method
          indent_id: selectedBooklet ? indentNumber : null
        })
        .select();

      if (transactionError) {
        throw transactionError;
      }

      // If indent booklet is used, also create an indent record
      if (selectedBooklet && indentNumber) {
        const indentId = crypto.randomUUID();
        
        const { error: indentError } = await supabase
          .from('indents')
          .insert({
            id: indentId,
            customer_id: selectedCustomer,
            vehicle_id: selectedVehicle,
            fuel_type: fuelType,
            amount: amount,
            quantity: quantity,
            indent_number: indentNumber,
            booklet_id: selectedBooklet,
            date: date.toISOString(),
            status: 'Fulfilled'
          });

        if (indentError) {
          throw indentError;
        }

        // Update the used_indents count in the booklet
        const booklet = indentBooklets.find(b => b.id === selectedBooklet);
        if (booklet) {
          const { error: updateError } = await supabase
            .from('indent_booklets')
            .update({ used_indents: booklet.used_indents + 1 })
            .eq('id', selectedBooklet);

          if (updateError) {
            console.error('Error updating booklet:', updateError);
          }
        }
      }

      toast({
        title: "Success",
        description: "Transaction recorded successfully"
      });
      
      // Reset form fields
      setSelectedCustomer('');
      setSelectedVehicle('');
      setSelectedBooklet('');
      setIndentNumber('');
      setFuelType('Petrol');
      setAmount(0);
      setQuantity(0);
      setDate(new Date());
      setIndentNumberError('');
      fetchRecentTransactions(); // Refresh recent transactions
    } catch (error) {
      console.error('Error recording indent:', error);
      toast({
        title: "Error",
        description: "Failed to record indent. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Record Indent</h1>
      <Card>
        <CardHeader>
          <CardDescription>
            Record fuel indents for customers and vehicles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customer">Customer</Label>
                <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                  <SelectTrigger id="customer">
                    <SelectValue placeholder="Select a customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {isCustomerLoading ? (
                      <SelectItem value="loading" disabled>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </SelectItem>
                    ) : (
                      customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>{customer.name}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="vehicle">Vehicle</Label>
                <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                  <SelectTrigger id="vehicle">
                    <SelectValue placeholder="Select a vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    {isVehicleLoading ? (
                      <SelectItem value="loading" disabled>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </SelectItem>
                    ) : vehicles.length === 0 ? (
                      <SelectItem value="no-vehicles" disabled>
                        No vehicles found
                      </SelectItem>
                    ) : (
                      vehicles.map((vehicle) => (
                        <SelectItem key={vehicle.id} value={vehicle.id}>{vehicle.number}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="booklet">Indent Booklet (Optional)</Label>
                <Select value={selectedBooklet} onValueChange={setSelectedBooklet}>
                  <SelectTrigger id="booklet">
                    <SelectValue placeholder="Select a booklet" />
                  </SelectTrigger>
                  <SelectContent>
                    {isBookletLoading ? (
                      <SelectItem value="loading" disabled>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </SelectItem>
                    ) : indentBooklets.length === 0 ? (
                      <SelectItem value="no-booklets" disabled>
                        No active booklets found
                      </SelectItem>
                    ) : (
                      indentBooklets.map((booklet) => (
                        <SelectItem key={booklet.id} value={booklet.id}>
                          {booklet.start_number} - {booklet.end_number} (Used: {booklet.used_indents}/{booklet.total_indents})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="indentNumber">Indent Number</Label>
                <Input
                  id="indentNumber"
                  value={indentNumber}
                  onChange={(e) => {
                    setIndentNumber(e.target.value);
                    if (selectedBooklet) validateIndentNumber(selectedBooklet, e.target.value);
                  }}
                  placeholder={selectedBooklet ? "Enter indent number" : "Select a booklet first"}
                  disabled={!selectedBooklet}
                  className={indentNumberError ? "border-red-500" : ""}
                />
                {indentNumberError && (
                  <p className="text-red-500 text-sm mt-1">{indentNumberError}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="z-10">
                <Label htmlFor="date">Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start" sideOffset={8}>
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label htmlFor="fuelType">Fuel Type</Label>
                <Select value={fuelType} onValueChange={setFuelType}>
                  <SelectTrigger id="fuelType">
                    <SelectValue placeholder="Select fuel type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Petrol">Petrol</SelectItem>
                    <SelectItem value="Diesel">Diesel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input
                  type="number"
                  id="amount"
                  value={amount === 0 ? '' : amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  placeholder="Enter amount"
                />
              </div>
              <div>
                <Label htmlFor="quantity">Quantity (L)</Label>
                <Input
                  type="number"
                  id="quantity"
                  value={quantity === 0 ? '' : quantity}
                  onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                  placeholder="Enter quantity"
                />
              </div>
            </div>
            <Button disabled={isSubmitting} type="submit">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Recording...
                </>
              ) : (
                'Record Indent'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Transactions</CardTitle>
          </div>
          <CardDescription>
            Last 5 transactions recorded
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isTransactionsLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading transactions...
            </div>
          ) : recentTransactions.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              <FileText className="mr-2 h-4 w-4" />
              No transactions found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Fuel Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Quantity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                    <TableCell>{transaction.customer_name}</TableCell>
                    <TableCell>{transaction.vehicle_number}</TableCell>
                    <TableCell>{transaction.fuel_type}</TableCell>
                    <TableCell>₹{transaction.amount.toLocaleString()}</TableCell>
                    <TableCell>{transaction.quantity} L</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      <div className="flex justify-end mt-2">
        <Button variant="outline" size="sm" asChild>
          <Link to="/all-transactions" className="flex items-center">
            View all transactions 
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default RecordIndent;
