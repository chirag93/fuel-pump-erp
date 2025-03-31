
import React, { useState, useEffect } from 'react';
import { FileText, Search, Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from "@/integrations/supabase/client";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getFuelPumpId } from '@/integrations/utils';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type BookletData = {
  id: string;
  customer_id: string;
  start_number: string;
  end_number: string;
  status: string;
  total_indents: number;
  used_indents: number;
}

type CustomerData = {
  id: string;
  name: string;
  balance?: number;
}

type VehicleData = {
  id: string;
  number: string;
  type: string;
  customer_id: string;
}

const MobileRecordIndent = () => {
  const { toast } = useToast();
  const [fuelType, setFuelType] = useState('Petrol');
  const [amount, setAmount] = useState<number | ''>('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [date, setDate] = useState(new Date());
  const [selectedStaff, setSelectedStaff] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [staff, setStaff] = useState<Array<{id: string, name: string}>>([]);
  const [indentNumber, setIndentNumber] = useState('');
  const [indentNumberError, setIndentNumberError] = useState('');
  const [searchIndentNumber, setSearchIndentNumber] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedCustomerName, setSelectedCustomerName] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedVehicleNumber, setSelectedVehicleNumber] = useState('');
  const [selectedBooklet, setSelectedBooklet] = useState('');
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [successDetails, setSuccessDetails] = useState({
    indentNumber: '',
    customerName: '',
    vehicleNumber: '',
    amount: 0,
    quantity: 0,
    fuelType: ''
  });
  const [vehicles, setVehicles] = useState<VehicleData[]>([]);
  const [fuelPrice, setFuelPrice] = useState<number>(0);
  
  // Fetch staff data on component mount
  useEffect(() => {
    const fetchStaff = async () => {
      console.info('Fetching staff data...');
      try {
        const fuelPumpId = await getFuelPumpId();
        
        if (!fuelPumpId) {
          console.error('No fuel pump ID available');
          toast({
            title: "Authentication Required",
            description: "Please log in with a fuel pump account to view staff",
            variant: "destructive"
          });
          return;
        }
        
        const { data, error } = await supabase
          .from('staff')
          .select('id, name')
          .eq('fuel_pump_id', fuelPumpId)
          .eq('is_active', true);
          
        if (error) {
          console.error('Error fetching staff:', error);
          return;
        }
        
        if (data) {
          console.info(`Staff data fetched: ${data.length} records`);
          setStaff(data);
          // If staff exists, select the first one by default
          if (data.length > 0) {
            setSelectedStaff(data[0].id);
          }
        }
      } catch (error) {
        console.error('Error fetching staff:', error);
      }
    };
    
    // Fetch current fuel price
    const fetchFuelPrice = async () => {
      try {
        const fuelPumpId = await getFuelPumpId();
        
        if (!fuelPumpId) {
          console.error('No fuel pump ID available');
          toast({
            title: "Authentication Required",
            description: "Please log in with a fuel pump account to fetch fuel price",
            variant: "destructive"
          });
          return;
        }
        
        const { data, error } = await supabase
          .from('fuel_settings')
          .select('current_price')
          .eq('fuel_pump_id', fuelPumpId)
          .eq('fuel_type', fuelType)
          .single();
          
        if (error) {
          console.error('Error fetching fuel price:', error);
          return;
        }
        
        if (data) {
          setFuelPrice(data.current_price);
        }
      } catch (error) {
        console.error('Error fetching fuel price:', error);
      }
    };
    
    fetchStaff();
    fetchFuelPrice();
  }, [fuelType]);
  
  // Update quantity when amount changes
  useEffect(() => {
    if (amount !== '' && fuelPrice > 0) {
      const calculatedQuantity = Number(amount) / fuelPrice;
      setQuantity(parseFloat(calculatedQuantity.toFixed(2)));
    }
  }, [amount, fuelPrice]);
  
  // Update amount when quantity changes
  useEffect(() => {
    if (quantity !== '' && fuelPrice > 0) {
      const calculatedAmount = Number(quantity) * fuelPrice;
      setAmount(parseFloat(calculatedAmount.toFixed(2)));
    }
  }, [quantity, fuelPrice]);
  
  // Fetch vehicles when customer is selected
  useEffect(() => {
    if (selectedCustomer) {
      const fetchVehicles = async () => {
        try {
          const fuelPumpId = await getFuelPumpId();
          
          if (!fuelPumpId) {
            console.error('No fuel pump ID available');
            toast({
              title: "Authentication Required",
              description: "Please log in with a fuel pump account to view vehicles",
              variant: "destructive"
            });
            return;
          }
          
          const { data, error } = await supabase
            .from('vehicles')
            .select('*')
            .eq('fuel_pump_id', fuelPumpId)
            .eq('customer_id', selectedCustomer);
            
          if (error) {
            console.error('Error fetching vehicles:', error);
            return;
          }
          
          if (data) {
            setVehicles(data);
            // Reset selected vehicle
            setSelectedVehicle('');
            setSelectedVehicleNumber('');
          }
        } catch (error) {
          console.error('Error fetching vehicles:', error);
        }
      };
      
      fetchVehicles();
    }
  }, [selectedCustomer]);
  
  const searchByIndentNumber = async () => {
    // Clear previous error
    setSearchError('');
    
    if (!searchIndentNumber) {
      setSearchError('Please enter an indent number to search');
      return;
    }

    setIsSearching(true);
    
    try {
      console.log('Searching for indent number:', searchIndentNumber);
      
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
      
      // First check if this indent number exists in any booklet
      const { data: bookletData, error: bookletError } = await supabase
        .from('indent_booklets')
        .select('*')
        .eq('fuel_pump_id', fuelPumpId)
        .or(`start_number.lte.${searchIndentNumber},end_number.gte.${searchIndentNumber}`)
        .order('issued_date', { ascending: false });

      if (bookletError) {
        console.error('Error searching for booklet:', bookletError);
        throw bookletError;
      }

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
      const { data: existingIndent, error: existingError } = await supabase
        .from('indents')
        .select('*')
        .eq('fuel_pump_id', fuelPumpId)
        .eq('indent_number', searchIndentNumber);

      if (existingError) {
        console.error('Error checking existing indent:', existingError);
        throw existingError;
      }

      if (existingIndent && existingIndent.length > 0) {
        setSearchError('This indent number has already been used');
        setIsSearching(false);
        return;
      }

      // Get customer details
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('id, name')
        .eq('fuel_pump_id', fuelPumpId)
        .eq('id', matchingBooklet.customer_id)
        .single();

      if (customerError) {
        console.error('Error fetching customer:', customerError);
        throw customerError;
      }

      // Set form data from search results
      setIndentNumber(searchIndentNumber);
      setSelectedBooklet(matchingBooklet.id);
      setSelectedCustomer(customerData.id);
      setSelectedCustomerName(customerData.name);
      
      // Reset error
      setIndentNumberError('');
      
    } catch (error) {
      console.error('Error during indent search:', error);
      setSearchError('An error occurred while searching for this indent number');
    } finally {
      setIsSearching(false);
    }
  };
  
  const handleSaveIndent = async () => {
    // Validate form
    if (!indentNumber) {
      setIndentNumberError('Indent number is required');
      return;
    }
    
    if (!selectedCustomer) {
      toast({
        title: "Error",
        description: "Please select a customer",
        variant: "destructive"
      });
      return;
    }
    
    if (!selectedVehicle) {
      toast({
        title: "Error",
        description: "Please select a vehicle",
        variant: "destructive"
      });
      return;
    }
    
    if (!amount || amount === 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive"
      });
      return;
    }
    
    // Proceed with saving
    setIsSubmitting(true);
    
    try {
      const fuelPumpId = await getFuelPumpId();
      
      if (!fuelPumpId) {
        toast({
          title: "Authentication Required",
          description: "Please log in with a fuel pump account to save indent",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }
      
      // Generate an ID for the indent
      const indentId = crypto.randomUUID();
      
      console.log("Creating indent with data:", {
        id: indentId,
        customer_id: selectedCustomer,
        vehicle_id: selectedVehicle,
        booklet_id: selectedBooklet,
        indent_number: indentNumber,
        fuel_type: fuelType,
        amount: Number(amount),
        quantity: Number(quantity),
        date: new Date().toISOString().split('T')[0]
      });
      
      // Create indent record
      const { error: indentError } = await supabase
        .from('indents')
        .insert([{
          id: indentId,
          customer_id: selectedCustomer,
          vehicle_id: selectedVehicle,
          booklet_id: selectedBooklet,
          indent_number: indentNumber,
          fuel_type: fuelType,
          amount: Number(amount),
          quantity: Number(quantity),
          discount_amount: discountAmount,
          date: date.toISOString().split('T')[0],
          source: 'mobile',
          fuel_pump_id: fuelPumpId
        }]);
        
      if (indentError) throw indentError;
      
      // Create transaction record - using the indent ID (not indent_number)
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert([{
          id: crypto.randomUUID(),
          customer_id: selectedCustomer,
          vehicle_id: selectedVehicle,
          indent_id: indentId, // Use the UUID of the indent, not indent_number
          fuel_type: fuelType,
          amount: Number(amount),
          quantity: Number(quantity),
          discount_amount: discountAmount,
          payment_method: 'INDENT',
          date: date.toISOString().split('T')[0],
          staff_id: selectedStaff,
          source: 'mobile',
          fuel_pump_id: fuelPumpId
        }]);
        
      if (transactionError) throw transactionError;
      
      // Update customer balance if needed
      try {
        const { data: currentCustomer } = await supabase
          .from('customers')
          .select('balance')
          .eq('id', selectedCustomer)
          .eq('fuel_pump_id', fuelPumpId)
          .single();
          
        if (currentCustomer) {
          const newBalance = (currentCustomer.balance || 0) + Number(amount);
          
          await supabase
            .from('customers')
            .update({ balance: newBalance })
            .eq('id', selectedCustomer)
            .eq('fuel_pump_id', fuelPumpId);
        }
      } catch (balanceError) {
        console.error('Error updating customer balance:', balanceError);
        // Continue with success even if balance update fails
      }
      
      // Update booklet used_indents count
      try {
        const { data: booklet } = await supabase
          .from('indent_booklets')
          .select('used_indents')
          .eq('id', selectedBooklet)
          .eq('fuel_pump_id', fuelPumpId)
          .single();
          
        if (booklet) {
          await supabase
            .from('indent_booklets')
            .update({ used_indents: (booklet.used_indents || 0) + 1 })
            .eq('id', selectedBooklet)
            .eq('fuel_pump_id', fuelPumpId);
        }
      } catch (bookletError) {
        console.error('Error updating booklet usage count:', bookletError);
        // Continue with success even if booklet update fails
      }
      
      // Show success dialog
      setSuccessDetails({
        indentNumber,
        customerName: selectedCustomerName,
        vehicleNumber: selectedVehicleNumber,
        amount: Number(amount),
        quantity: Number(quantity),
        fuelType
      });
      setSuccessDialogOpen(true);
      
      // Reset form
      resetForm();
      
    } catch (error) {
      console.error('Error saving indent:', error);
      toast({
        title: "Error",
        description: "Failed to save indent. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const resetForm = () => {
    setIndentNumber('');
    setSelectedCustomer('');
    setSelectedCustomerName('');
    setSelectedVehicle('');
    setSelectedVehicleNumber('');
    setSelectedBooklet('');
    setAmount('');
    setQuantity('');
    setDiscountAmount(0);
    setSearchIndentNumber('');
    setIndentNumberError('');
    setSearchError('');
  };
  
  return (
    <div className="container mx-auto py-4 px-3 flex flex-col min-h-screen">
      <MobileHeader title="Record Indent" />
      
      <Card className="mb-4">
        <CardContent className="pt-4">
          <div className="flex items-center mb-4">
            <FileText className="h-5 w-5 text-primary mr-2" />
            <h2 className="text-lg font-medium">Indent Details</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="searchIndentNumber" className="text-sm font-medium mb-1 block">
                  Search Indent Number
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="searchIndentNumber"
                    value={searchIndentNumber}
                    onChange={(e) => setSearchIndentNumber(e.target.value)}
                    className="flex-1"
                    placeholder="Enter indent number"
                  />
                  <Button 
                    onClick={searchByIndentNumber} 
                    disabled={isSearching}
                    size="sm"
                  >
                    {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
                  </Button>
                </div>
                {searchError && <p className="text-red-500 text-xs mt-1">{searchError}</p>}
              </div>
            </div>
            
            <div>
              <Label htmlFor="indentNumber" className="text-sm font-medium mb-1 block">
                Indent Number
              </Label>
              <Input
                id="indentNumber"
                value={indentNumber}
                onChange={(e) => {
                  setIndentNumber(e.target.value);
                  setIndentNumberError('');
                }}
                className={indentNumberError ? "border-red-500" : ""}
                placeholder="Enter indent number"
              />
              {indentNumberError && <p className="text-red-500 text-xs mt-1">{indentNumberError}</p>}
            </div>
            
            <div>
              <Label htmlFor="customerName" className="text-sm font-medium mb-1 block">
                Customer
              </Label>
              <Input
                id="customerName"
                value={selectedCustomerName}
                readOnly
                placeholder="Customer will be selected based on indent number"
              />
            </div>
            
            <div>
              <Label htmlFor="vehicle" className="text-sm font-medium mb-1 block">
                Vehicle
              </Label>
              <Select
                value={selectedVehicle}
                onValueChange={(value) => {
                  setSelectedVehicle(value);
                  const selected = vehicles.find(v => v.id === value);
                  if (selected) {
                    setSelectedVehicleNumber(selected.number);
                  }
                }}
              >
                <SelectTrigger id="vehicle">
                  <SelectValue placeholder="Select vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.length > 0 ? (
                    vehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.number} ({vehicle.type})
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      No vehicles found
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="fuelType" className="text-sm font-medium mb-1 block">
                Fuel Type
              </Label>
              <Select
                value={fuelType}
                onValueChange={(value) => setFuelType(value)}
              >
                <SelectTrigger id="fuelType">
                  <SelectValue placeholder="Select fuel type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Petrol">Petrol</SelectItem>
                  <SelectItem value="Diesel">Diesel</SelectItem>
                  <SelectItem value="Premium">Premium Petrol</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount" className="text-sm font-medium mb-1 block">
                  Amount (₹)
                </Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount.toString()}
                  onChange={(e) => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  placeholder="Enter amount"
                />
              </div>
              <div>
                <Label htmlFor="quantity" className="text-sm font-medium mb-1 block">
                  Quantity (L)
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  value={quantity.toString()}
                  onChange={(e) => setQuantity(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  placeholder="Enter quantity"
                />
              </div>
            </div>
            
            <Button 
              className="w-full mt-4" 
              onClick={handleSaveIndent}
              disabled={isSubmitting || !indentNumber || !selectedCustomer || !selectedVehicle || !amount}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : 'Save Indent'}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Success Dialog */}
      <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center text-green-600">
              <Check className="h-5 w-5 mr-2" />
              Indent Recorded Successfully
            </DialogTitle>
            <DialogDescription>
              The indent has been recorded and the transaction has been created.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Indent Number:</span>
                <span className="font-medium">{successDetails.indentNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Customer:</span>
                <span className="font-medium">{successDetails.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vehicle:</span>
                <span className="font-medium">{successDetails.vehicleNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fuel Type:</span>
                <span className="font-medium">{successDetails.fuelType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-medium">₹{successDetails.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quantity:</span>
                <span className="font-medium">{successDetails.quantity.toLocaleString()} L</span>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setSuccessDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MobileRecordIndent;
