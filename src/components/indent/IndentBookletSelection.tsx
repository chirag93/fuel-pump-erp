
import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Loader2, Search } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { IndentBooklet } from '@/integrations/supabase/client';
import { toast } from "@/hooks/use-toast";

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
  const [searchMode, setSearchMode] = useState<'customer' | 'number'>('customer');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchIndentNumber, setSearchIndentNumber] = useState<string>('');

  useEffect(() => {
    if (selectedCustomer && searchMode === 'customer') {
      fetchIndentBooklets(selectedCustomer);
    } else {
      setIndentBooklets([]);
    }
  }, [selectedCustomer, searchMode]);

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
    if (!searchIndentNumber) {
      toast({
        title: "Enter indent number",
        description: "Please enter an indent number to search",
        variant: "destructive"
      });
      return;
    }

    setIsSearching(true);
    try {
      // First check if this indent number exists in any booklet
      const { data: bookletData, error: bookletError } = await supabase
        .from('indent_booklets')
        .select('*')
        .or(`start_number.lte.${searchIndentNumber},end_number.gte.${searchIndentNumber}`)
        .order('issued_date', { ascending: false });

      if (bookletError) throw bookletError;

      if (!bookletData || bookletData.length === 0) {
        toast({
          title: "Not found",
          description: "No indent booklet contains this number",
          variant: "destructive"
        });
        setIsSearching(false);
        return;
      }

      // Find the booklet where this number falls within range
      const matchingBooklet = bookletData.find(b => 
        parseInt(b.start_number) <= parseInt(searchIndentNumber) && 
        parseInt(b.end_number) >= parseInt(searchIndentNumber)
      );

      if (!matchingBooklet) {
        toast({
          title: "Not in range",
          description: "The indent number is not in any active booklet range",
          variant: "destructive"
        });
        setIsSearching(false);
        return;
      }

      // Check if this indent number has already been used
      const { data: indentData, error: indentError } = await supabase
        .from('indents')
        .select('id')
        .eq('indent_number', searchIndentNumber);

      if (indentError) throw indentError;

      if (indentData && indentData.length > 0) {
        toast({
          title: "Already used",
          description: "This indent number has already been used",
          variant: "destructive"
        });
        setIsSearching(false);
        return;
      }

      // Fetch vehicles for this customer to help populate the form
      const { data: vehicleData, error: vehicleError } = await supabase
        .from('vehicles')
        .select('id')
        .eq('customer_id', matchingBooklet.customer_id)
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
        description: "Indent booklet found. Customer details loaded."
      });
    } catch (error) {
      console.error('Error searching by indent number:', error);
      toast({
        title: "Error",
        description: "Failed to search by indent number",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-4">
      <Tabs value={searchMode} onValueChange={(value) => setSearchMode(value as 'customer' | 'number')}>
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="customer">Select Customer & Booklet</TabsTrigger>
          <TabsTrigger value="number">Search by Indent Number</TabsTrigger>
        </TabsList>
        
        <TabsContent value="customer" className="mt-4">
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
        </TabsContent>
        
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
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
