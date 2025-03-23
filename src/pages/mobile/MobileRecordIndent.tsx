
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ArrowLeft, Search, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';

const MobileRecordIndent = () => {
  const [searchIndentNumber, setSearchIndentNumber] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string>('');
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [selectedCustomerName, setSelectedCustomerName] = useState<string>('');
  const [selectedBooklet, setSelectedBooklet] = useState<string>('');
  const [indentNumber, setIndentNumber] = useState<string>('');
  const [fuelType, setFuelType] = useState<string>('Petrol');
  const [amount, setAmount] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [staff, setStaff] = useState<{id: string, name: string}[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<string>('');
  const [fuelPrices, setFuelPrices] = useState<{[key: string]: number}>({
    Petrol: 0,
    Diesel: 0
  });

  // Fetch staff list when component mounts
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const { data, error } = await supabase
          .from('staff')
          .select('id, name')
          .order('name', { ascending: true });
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          setStaff(data);
          setSelectedStaff(data[0].id);
        } else {
          toast({
            title: "No staff members found",
            description: "Please add at least one staff member",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Error fetching staff:', error);
        toast({
          title: "Error loading staff",
          description: "Could not load staff list",
          variant: "destructive"
        });
      }
    };
    
    fetchStaff();
  }, []);

  // Fetch fuel prices
  useEffect(() => {
    const fetchFuelPrices = async () => {
      try {
        const { data, error } = await supabase
          .from('fuel_settings')
          .select('fuel_type, current_price');
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          const priceMap: {[key: string]: number} = {};
          data.forEach(item => {
            priceMap[item.fuel_type] = item.current_price;
          });
          setFuelPrices(priceMap);
        }
      } catch (error) {
        console.error('Error fetching fuel prices:', error);
      }
    };
    
    fetchFuelPrices();
  }, []);

  // Auto-calculate amount when quantity changes
  useEffect(() => {
    if (quantity > 0 && fuelPrices[fuelType]) {
      const calculatedAmount = quantity * fuelPrices[fuelType];
      setAmount(calculatedAmount);
    }
  }, [quantity, fuelType, fuelPrices]);

  const searchByIndentNumber = async () => {
    // Clear previous error
    setSearchError('');
    
    if (!searchIndentNumber) {
      setSearchError('Please enter an indent number to search');
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
        .eq('indent_number', searchIndentNumber);

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

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuantity = parseFloat(e.target.value) || 0;
    setQuantity(newQuantity);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(parseFloat(e.target.value) || 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!selectedCustomer || !selectedVehicle || !fuelType || !amount || !quantity || !selectedStaff) {
        toast({
          title: "Missing information",
          description: "Please fill all required fields",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }

      // Generate a UUID for the transaction
      const transactionId = crypto.randomUUID();

      // Important: If using a booklet, we need to create the indent record FIRST
      // before creating the transaction, since transactions has a foreign key to indents
      let createdIndentNumber: string | null = null;
      
      // If indent booklet is used, create an indent record first
      if (selectedBooklet && indentNumber) {
        const indentId = crypto.randomUUID();
        
        console.log("Creating indent with data:", {
          id: indentId,
          customer_id: selectedCustomer,
          vehicle_id: selectedVehicle,
          fuel_type: fuelType,
          amount: amount,
          quantity: quantity,
          discount_amount: 0,
          indent_number: indentNumber,
          booklet_id: selectedBooklet,
          date: new Date().toISOString(),
          status: 'Fulfilled'
        });

        const { error: indentError } = await supabase
          .from('indents')
          .insert({
            id: indentId,
            customer_id: selectedCustomer,
            vehicle_id: selectedVehicle,
            fuel_type: fuelType,
            amount: amount,
            quantity: quantity,
            discount_amount: 0,
            indent_number: indentNumber,
            booklet_id: selectedBooklet,
            date: new Date().toISOString(),
            status: 'Fulfilled'
          });

        if (indentError) {
          console.error("Indent error:", indentError);
          throw indentError;
        }

        createdIndentNumber = indentNumber;

        // Update the booklet used_indents count
        const { data: bookletData, error: bookletFetchError } = await supabase
          .from('indent_booklets')
          .select('used_indents')
          .eq('id', selectedBooklet)
          .single();
          
        if (bookletFetchError) {
          console.error('Error fetching booklet data:', bookletFetchError);
          throw bookletFetchError;
        }
        
        const newUsedIndents = (bookletData?.used_indents || 0) + 1;
        
        console.log("Updating booklet used_indents:", {
          booklet_id: selectedBooklet,
          newUsedIndents: newUsedIndents
        });

        const { error: updateError } = await supabase
          .from('indent_booklets')
          .update({ used_indents: newUsedIndents })
          .eq('id', selectedBooklet);

        if (updateError) {
          console.error('Error updating booklet:', updateError);
          throw updateError;
        }
      }

      console.log("Submitting transaction with data:", {
        id: transactionId,
        customer_id: selectedCustomer,
        vehicle_id: selectedVehicle,
        staff_id: selectedStaff,
        date: new Date().toISOString(),
        fuel_type: fuelType,
        amount: amount,
        quantity: quantity,
        discount_amount: 0,
        payment_method: 'Cash',
        indent_id: createdIndentNumber 
      });

      // Now create the transaction referencing the indent if it was created
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          id: transactionId,
          customer_id: selectedCustomer,
          vehicle_id: selectedVehicle,
          staff_id: selectedStaff,
          date: new Date().toISOString(),
          fuel_type: fuelType,
          amount: amount,
          quantity: quantity,
          discount_amount: 0,
          payment_method: 'Cash', // Default payment method
          indent_id: createdIndentNumber // Using the indent number we just created
        });

      if (transactionError) {
        console.error("Transaction error:", transactionError);
        throw transactionError;
      }

      toast({
        title: "Success",
        description: "Transaction recorded successfully"
      });
      
      // Reset form
      setSelectedVehicle('');
      setFuelType('Petrol');
      setAmount(0);
      setQuantity(0);
      setSearchIndentNumber('');
      setIndentNumber('');
      setSelectedBooklet('');
      setSelectedCustomer('');
      setSelectedCustomerName('');
      
    } catch (error) {
      console.error('Error recording transaction:', error);
      toast({
        title: "Error",
        description: "Failed to record transaction",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Link to="/">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold">Record Indent</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search by Indent Number</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="searchIndentNumber">Enter Indent Number</Label>
            <div className="flex gap-2">
              <Input
                id="searchIndentNumber"
                value={searchIndentNumber}
                onChange={(e) => setSearchIndentNumber(e.target.value)}
                placeholder="Enter indent number"
                className="flex-1"
              />
              <Button onClick={searchByIndentNumber} disabled={isSearching}>
                {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              This will search for the indent number and load customer details
            </p>
          </div>
          
          {searchError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{searchError}</AlertDescription>
            </Alert>
          )}
          
          {selectedCustomerName && (
            <div className="mt-2 p-2 bg-muted rounded">
              <p className="font-medium">Customer: {selectedCustomerName}</p>
              <p className="text-sm text-muted-foreground">Indent Number: {indentNumber}</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {selectedCustomer && selectedVehicle && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Fuel Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="fuelType">Fuel Type</Label>
                <Select value={fuelType} onValueChange={setFuelType}>
                  <SelectTrigger id="fuelType">
                    <SelectValue placeholder="Select fuel type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Petrol">Petrol {fuelPrices.Petrol > 0 ? `(₹${fuelPrices.Petrol}/L)` : ''}</SelectItem>
                    <SelectItem value="Diesel">Diesel {fuelPrices.Diesel > 0 ? `(₹${fuelPrices.Diesel}/L)` : ''}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="staffMember">Staff Member</Label>
                <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                  <SelectTrigger id="staffMember">
                    <SelectValue placeholder="Select staff member" />
                  </SelectTrigger>
                  <SelectContent>
                    {staff.length === 0 ? (
                      <SelectItem value="no-staff" disabled>No staff members found</SelectItem>
                    ) : (
                      staff.map((member) => (
                        <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="quantity">Quantity (L)</Label>
                <Input
                  type="number"
                  id="quantity"
                  value={quantity === 0 ? '' : quantity}
                  onChange={handleQuantityChange}
                  placeholder="Enter quantity"
                />
                {fuelPrices[fuelType] > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">Current price: ₹{fuelPrices[fuelType]}/L</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input
                  type="number"
                  id="amount"
                  value={amount === 0 ? '' : amount}
                  onChange={handleAmountChange}
                  placeholder="Enter amount"
                />
              </div>
              
              <Button disabled={isSubmitting} type="submit" className="w-full">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Recording...
                  </>
                ) : (
                  'Record Transaction'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MobileRecordIndent;
