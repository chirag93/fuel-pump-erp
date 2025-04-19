
import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Loader2, Search } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { IndentBooklet, Customer } from '@/integrations/supabase/client';
import { toast } from "@/hooks/use-toast";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getFuelPumpId } from '@/integrations/utils';

interface IndentBookletSelectionProps {
  selectedCustomer: string;
  selectedBooklet: string;
  setSelectedBooklet: (bookletId: string) => void;
  indentNumber: string;
  setIndentNumber: (indentNumber: string) => void;
  indentNumberError: string;
  setIndentNumberError: (error: string) => void;
  setSelectedCustomer: (customerId: string) => void;
  setSelectedVehicle: (vehicleId: string) => void;
}

export const IndentBookletSelection = ({
  selectedCustomer,
  selectedBooklet,
  setSelectedBooklet,
  indentNumber,
  setIndentNumber,
  indentNumberError,
  setIndentNumberError,
  setSelectedCustomer,
  setSelectedVehicle
}: IndentBookletSelectionProps) => {
  const [indentBooklets, setIndentBooklets] = useState<IndentBooklet[]>([]);
  const [isBookletLoading, setIsBookletLoading] = useState<boolean>(true);
  const [searchMode, setSearchMode] = useState<'customer' | 'number'>('number');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchIndentNumber, setSearchIndentNumber] = useState<string>('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isCustomerLoading, setIsCustomerLoading] = useState<boolean>(true);
  const [searchCustomer, setSearchCustomer] = useState<string>('');
  const [openCustomerSearch, setOpenCustomerSearch] = useState(false);
  const [selectedCustomerName, setSelectedCustomerName] = useState<string>('');
  const [searchError, setSearchError] = useState<string>('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (selectedCustomer && searchMode === 'customer') {
      fetchIndentBooklets(selectedCustomer);
    } else {
      setIndentBooklets([]);
    }
  }, [selectedCustomer, searchMode]);

  // Auto-select the first booklet when they're loaded
  useEffect(() => {
    if (indentBooklets.length > 0 && !selectedBooklet && searchMode === 'customer') {
      setSelectedBooklet(indentBooklets[0].id);
    }
  }, [indentBooklets, selectedBooklet, setSelectedBooklet, searchMode]);

  const fetchCustomers = async () => {
    setIsCustomerLoading(true);
    try {
      const fuelPumpId = await getFuelPumpId();
      
      if (!fuelPumpId) {
        console.error('No fuel pump ID available');
        toast({
          title: "Authentication Required",
          description: "Please log in with a fuel pump account to view customers",
          variant: "destructive"
        });
        setIsCustomerLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('fuel_pump_id', fuelPumpId) // Add fuel pump ID filter
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

  const fetchIndentBooklets = async (customerId: string) => {
    setIsBookletLoading(true);
    try {
      const fuelPumpId = await getFuelPumpId();
      
      if (!fuelPumpId) {
        console.error('No fuel pump ID available');
        toast({
          title: "Authentication Required",
          description: "Please log in with a fuel pump account to view booklets",
          variant: "destructive"
        });
        setIsBookletLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('indent_booklets')
        .select('*')
        .eq('customer_id', customerId)
        .eq('status', 'Active')
        .eq('fuel_pump_id', fuelPumpId) // Add fuel pump ID filter
        .order('issued_date', { ascending: false });

      if (error) {
        throw error;
      }

      if (data) {
        // Transform the data to ensure status is one of the allowed types
        const typedBooklets: IndentBooklet[] = data.map(booklet => ({
          ...booklet,
          status: booklet.status as 'Active' | 'Completed' | 'Cancelled'
        }));
        setIndentBooklets(typedBooklets);
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

  const searchByIndentNumber = async () => {
    // Clear previous error
    setSearchError('');
    
    if (!searchIndentNumber) {
      setSearchError('Please enter an indent number to search');
      return;
    }

    setIsSearching(true);
    try {
      const fuelPumpId = await getFuelPumpId();
      
      if (!fuelPumpId) {
        console.error('No fuel pump ID available');
        toast({
          title: "Authentication Required",
          description: "Please log in with a fuel pump account to search indents",
          variant: "destructive"
        });
        setIsSearching(false);
        return;
      }
      
      // First check if this indent number exists in any booklet for the current fuel pump
      const { data: bookletData, error: bookletError } = await supabase
        .from('indent_booklets')
        .select('*')
        .eq('fuel_pump_id', fuelPumpId) // Add fuel pump ID filter
        .or(`start_number.lte.${searchIndentNumber},end_number.gte.${searchIndentNumber}`)
        .order('issued_date', { ascending: false });

      if (bookletError) throw bookletError;

      if (!bookletData || bookletData.length === 0) {
        setSearchError('No indent booklet contains this number');
        setIsSearching(false);
        return;
      }

      // Find the booklet where this number falls within range
      const matchingBooklet = bookletData.find(b => 
        parseInt(b.start_number) <= parseInt(searchIndentNumber) && 
        parseInt(b.end_number) >= parseInt(searchIndentNumber)
      );

      if (!matchingBooklet) {
        setSearchError('The indent number is not in any active booklet range');
        setIsSearching(false);
        return;
      }

      // Check if this indent number has already been used
      const { data: indentData, error: indentError } = await supabase
        .from('indents')
        .select('id')
        .eq('indent_number', searchIndentNumber)
        .eq('fuel_pump_id', fuelPumpId); // Add fuel pump ID filter

      if (indentError) throw indentError;

      if (indentData && indentData.length > 0) {
        setSearchError('This indent number has already been used');
        setIsSearching(false);
        return;
      }

      // Fetch customer name for display
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('name')
        .eq('id', matchingBooklet.customer_id)
        .eq('fuel_pump_id', fuelPumpId) // Add fuel pump ID filter
        .single();
        
      if (customerError) {
        console.error('Error fetching customer name:', customerError);
        setSearchError('Error fetching customer details');
        setIsSearching(false);
        return;
      } 
      
      if (customerData) {
        setSelectedCustomerName(customerData.name);
      }

      // Fetch vehicles for this customer to help populate the form
      const { data: vehicleData, error: vehicleError } = await supabase
        .from('vehicles')
        .select('id')
        .eq('customer_id', matchingBooklet.customer_id)
        .eq('fuel_pump_id', fuelPumpId) // Add fuel pump ID filter
        .limit(1);

      if (vehicleError) {
        console.error('Error fetching vehicle:', vehicleError);
      }

      // Set the selected customer from the booklet
      setSelectedCustomer(matchingBooklet.customer_id);
      
      // Set the selected booklet
      setSelectedBooklet(matchingBooklet.id);
      
      // Set the indent number
      setIndentNumber(searchIndentNumber);
      
      // Set a vehicle if available
      if (vehicleData && vehicleData.length > 0) {
        setSelectedVehicle(vehicleData[0].id);
      }
      
      // Toast success
      toast({
        title: "Found",
        description: `Indent booklet found for customer: ${customerData?.name}. Customer details loaded.`
      });
    } catch (error) {
      console.error('Error searching by indent number:', error);
      setSearchError('Failed to search by indent number');
    } finally {
      setIsSearching(false);
    }
  };

  const handleCustomerSelect = (customerId: string, customerName: string) => {
    setSelectedCustomer(customerId);
    setSelectedCustomerName(customerName);
    setOpenCustomerSearch(false);
    
    // Reset booklet selection when customer changes
    setSelectedBooklet('');
    setIndentNumber('');
    setIndentNumberError('');
  };

  // Improved filtering logic for customer search
  const filteredCustomers = customers.filter(customer => 
    searchCustomer.trim() === '' || 
    customer.name.toLowerCase().includes(searchCustomer.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <Tabs defaultValue="number" value={searchMode} onValueChange={(value) => setSearchMode(value as 'customer' | 'number')}>
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="number">Search by Indent Number</TabsTrigger>
          <TabsTrigger value="customer">Search by Customer</TabsTrigger>
        </TabsList>
        
        <TabsContent value="number" className="mt-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="searchIndentNumber">Enter Indent Number</Label>
              <div className="flex gap-2">
                <Input
                  id="searchIndentNumber"
                  value={searchIndentNumber}
                  onChange={(e) => setSearchIndentNumber(e.target.value)}
                  placeholder="Enter indent number to search"
                  className="flex-1"
                />
                <Button onClick={searchByIndentNumber} disabled={isSearching} className="w-24">
                  {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                  {isSearching ? "" : "Search"}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                This will search for the indent number and load customer details automatically
              </p>
              
              {searchError && (
                <Alert variant="destructive" className="mt-2">
                  <AlertDescription>{searchError}</AlertDescription>
                </Alert>
              )}
              
              {selectedCustomerName && searchMode === 'number' && (
                <div className="mt-2 p-2 bg-slate-100 rounded">
                  <p className="font-medium">Customer: {selectedCustomerName}</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="customer" className="mt-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="customer">Search Customer</Label>
              <Popover open={openCustomerSearch} onOpenChange={setOpenCustomerSearch}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openCustomerSearch}
                    className="w-full justify-between text-left"
                  >
                    {selectedCustomerName || "Select a customer..."}
                    <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0 bg-white shadow-lg border border-gray-200" align="start">
                  <Command className="bg-white">
                    <CommandInput 
                      placeholder="Search customers..." 
                      value={searchCustomer}
                      onValueChange={setSearchCustomer}
                      className="h-9"
                    />
                    <CommandList className="bg-white max-h-[300px]">
                      <CommandEmpty className="py-2 px-4 text-sm text-gray-500">No customers found.</CommandEmpty>
                      <CommandGroup className="max-h-[300px] overflow-auto">
                        {isCustomerLoading ? (
                          <CommandItem disabled className="py-2 px-4 text-sm text-gray-700">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Loading customers...
                          </CommandItem>
                        ) : (
                          filteredCustomers.map(customer => (
                            <CommandItem
                              key={customer.id}
                              value={customer.name}
                              onSelect={() => handleCustomerSelect(customer.id, customer.name)}
                              className="py-2 px-4 text-sm text-gray-700 hover:bg-slate-100 cursor-pointer"
                            >
                              {customer.name}
                            </CommandItem>
                          ))
                        )}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <p className="text-sm text-muted-foreground mt-1">
                You must select a customer first to view available indent booklets
              </p>
            </div>
            
            {selectedCustomer && (
              <div>
                <Label htmlFor="booklet">Indent Booklet</Label>
                <Select 
                  value={selectedBooklet} 
                  onValueChange={setSelectedBooklet}
                  disabled={isBookletLoading || indentBooklets.length === 0}
                >
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
            )}
            
            {selectedBooklet && (
              <div>
                <Label htmlFor="indentNumber">Indent Number</Label>
                <Input
                  id="indentNumber"
                  value={indentNumber}
                  onChange={(e) => {
                    setIndentNumber(e.target.value);
                    if (selectedBooklet) validateIndentNumber(selectedBooklet, e.target.value);
                  }}
                  placeholder="Enter indent number"
                  className={indentNumberError ? "border-red-500" : ""}
                />
                {indentNumberError && (
                  <p className="text-red-500 text-sm mt-1">{indentNumberError}</p>
                )}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
