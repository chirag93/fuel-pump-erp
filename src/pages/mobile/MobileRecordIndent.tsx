import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, FileText, Search, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from "@/integrations/supabase/client";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const MobileRecordIndent = () => {
  const { toast } = useToast();
  const [fuelType, setFuelType] = useState('Petrol');
  const [amount, setAmount] = useState(0);
  const [quantity, setQuantity] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
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
  
  // Fetch staff data on component mount
  useEffect(() => {
    const fetchStaff = async () => {
      console.info('Fetching staff data...');
      const { data, error } = await supabase
        .from('staff')
        .select('id, name')
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
    };
    
    fetchStaff();
  }, []);
  
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
      
      // First check if this indent number exists in any booklet
      const { data: bookletData, error: bookletError } = await supabase
        .from('indent_booklets')
        .select('*')
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
      const { data: indentData, error: indentError } = await supabase
        .from('indents')
        .select('id')
        .eq('indent_number', searchIndentNumber);

      if (indentError) {
        console.error('Error checking if indent exists:', indentError);
        throw indentError;
      }

      if (indentData && indentData.length > 0) {
        setSearchError('This indent number has already been used');
        setIsSearching(false);
        return;
      }

      // Fetch customer details
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('id, name')
        .eq('id', matchingBooklet.customer_id)
        .single();
        
      if (customerError) {
        console.error('Error fetching customer:', customerError);
        throw customerError;
      }
      
      console.log('Found customer:', customerData);
      setSelectedCustomer(customerData.id);
      setSelectedCustomerName(customerData.name);

      // Fetch vehicle data for this customer
      const { data: vehicleData, error: vehicleError } = await supabase
        .from('vehicles')
        .select('id, number')
        .eq('customer_id', customerData.id)
        .order('number', { ascending: true });

      if (vehicleError) {
        console.error('Error fetching vehicles:', vehicleError);
        throw vehicleError;
      }
      
      if (vehicleData && vehicleData.length > 0) {
        setSelectedVehicle(vehicleData[0].id);
        setSelectedVehicleNumber(vehicleData[0].number);
        console.log('Selected vehicle:', vehicleData[0]);
      } else {
        console.log('No vehicles found for customer');
        setSelectedVehicle('');
        setSelectedVehicleNumber('');
      }

      // Set the booklet and indent number
      setSelectedBooklet(matchingBooklet.id);
      setIndentNumber(searchIndentNumber);

      toast({
        title: "Indent found",
        description: `Found indent for customer: ${customerData.name}`
      });
      
    } catch (error) {
      console.error('Error searching for indent:', error);
      setSearchError('Failed to search for indent. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!selectedStaff) {
      toast({
        title: "Error",
        description: "Please select a staff member",
        variant: "destructive"
      });
      return;
    }
    
    if (!indentNumber.trim()) {
      setIndentNumberError('Please enter an indent number');
      return;
    } else {
      setIndentNumberError('');
    }
    
    if (!selectedCustomer) {
      toast({
        title: "Error",
        description: "No customer selected. Please search for a valid indent number.",
        variant: "destructive"
      });
      return;
    }
    
    if (!selectedVehicle) {
      toast({
        title: "Error",
        description: "No vehicle selected. Please make sure the customer has vehicles.",
        variant: "destructive"
      });
      return;
    }
    
    if (amount <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive"
      });
      return;
    }
    
    if (quantity <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid quantity",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Generate a unique ID for the indent
      const indentId = `IND-${Date.now()}`;
      
      console.log("Creating indent with data:", {
        id: indentId,
        indent_number: indentNumber,
        customer_id: selectedCustomer,
        vehicle_id: selectedVehicle,
        fuel_type: fuelType,
        amount,
        quantity,
        discount_amount: discountAmount,
        date: date.toISOString().split('T')[0],
        source: 'mobile',
        approval_status: 'pending',
        booklet_id: selectedBooklet
      });
      
      // Create the indent record
      const { error: indentError } = await supabase
        .from('indents')
        .insert({
          id: indentId,
          indent_number: indentNumber,
          customer_id: selectedCustomer,
          vehicle_id: selectedVehicle,
          fuel_type: fuelType,
          amount: amount,
          quantity: quantity,
          discount_amount: discountAmount,
          date: date.toISOString().split('T')[0],
          source: 'mobile',
          approval_status: 'pending',
          booklet_id: selectedBooklet
        });
        
      if (indentError) {
        console.error('Error creating indent:', indentError);
        throw indentError;
      }
      
      // Update the booklet used_indents count
      if (selectedBooklet) {
        const { data: bookletData, error: bookletFetchError } = await supabase
          .from('indent_booklets')
          .select('used_indents')
          .eq('id', selectedBooklet)
          .single();
          
        if (bookletFetchError) {
          console.error('Error fetching booklet data:', bookletFetchError);
        } else {
          const newUsedIndents = (bookletData?.used_indents || 0) + 1;
          
          const { error: updateError } = await supabase
            .from('indent_booklets')
            .update({ used_indents: newUsedIndents })
            .eq('id', selectedBooklet);

          if (updateError) {
            console.error('Error updating booklet:', updateError);
          }
        }
      }
      
      console.log("Creating transaction with data:", {
        id: `TR-${Date.now()}`,
        customer_id: selectedCustomer,
        vehicle_id: selectedVehicle,
        staff_id: selectedStaff,
        date: date.toISOString().split('T')[0],
        fuel_type: fuelType,
        amount,
        quantity,
        payment_method: 'Cash',
        discount_amount: discountAmount,
        source: 'mobile',
        indent_id: indentId,
        approval_status: 'pending'
      });
      
      // Create the transaction record linked to the indent
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          id: `TR-${Date.now()}`,
          customer_id: selectedCustomer,
          vehicle_id: selectedVehicle,
          staff_id: selectedStaff,
          date: date.toISOString().split('T')[0],
          fuel_type: fuelType,
          amount: amount,
          quantity: quantity,
          payment_method: 'Cash',
          discount_amount: discountAmount,
          source: 'mobile',
          indent_id: indentId,
          approval_status: 'pending'
        });
        
      if (transactionError) {
        console.error('Error creating transaction:', transactionError);
        throw transactionError;
      }
      
      // Set success details and open the success dialog
      setSuccessDetails({
        indentNumber: indentNumber,
        customerName: selectedCustomerName,
        vehicleNumber: selectedVehicleNumber,
        amount: amount,
        quantity: quantity,
        fuelType: fuelType
      });
      setSuccessDialogOpen(true);
      
      // Reset form
      setAmount(0);
      setQuantity(0);
      setDiscountAmount(0);
      setIndentNumber('');
      setSearchIndentNumber('');
      setSelectedCustomer('');
      setSelectedCustomerName('');
      setSelectedVehicle('');
      setSelectedVehicleNumber('');
      setSelectedBooklet('');
      
      // Clear any existing errors
      setIndentNumberError('');
      setSearchError('');
      
    } catch (error) {
      console.error('Error recording transaction:', error);
      toast({
        title: "Error",
        description: "Failed to record transaction. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-4 px-3 flex flex-col min-h-screen">
      <div className="flex items-center mb-4">
        <Link to="/mobile">
          <Button variant="ghost" size="icon" className="mr-2">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-semibold">Record Indent</h1>
      </div>
      
      {/* Search indent number section */}
      <Card className="mb-4">
        <CardContent className="pt-4">
          <div className="flex items-center mb-4">
            <Search className="h-5 w-5 text-primary mr-2" />
            <h2 className="text-lg font-medium">Find Indent</h2>
          </div>
          
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
                  {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
                </Button>
              </div>
            </div>
            
            {searchError && (
              <Alert variant="destructive">
                <AlertDescription>{searchError}</AlertDescription>
              </Alert>
            )}
            
            {selectedCustomerName && (
              <div className="bg-slate-100 p-3 rounded-md space-y-2">
                <div>
                  <span className="font-semibold">Customer:</span> {selectedCustomerName}
                </div>
                {selectedVehicleNumber && (
                  <div>
                    <span className="font-semibold">Vehicle:</span> {selectedVehicleNumber}
                  </div>
                )}
                <div>
                  <span className="font-semibold">Indent Number:</span> {indentNumber}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Transaction form section */}
      <Card className="mb-4">
        <CardContent className="pt-4">
          <div className="flex items-center mb-4">
            <FileText className="h-5 w-5 text-primary mr-2" />
            <h2 className="text-lg font-medium">Transaction Details</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {indentNumberError && (
              <Alert variant="destructive">
                <AlertDescription>{indentNumberError}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="staffMember">Staff Member</Label>
                <select 
                  id="staffMember"
                  value={selectedStaff}
                  onChange={(e) => setSelectedStaff(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                >
                  {staff.length === 0 ? (
                    <option value="" disabled>No staff members found</option>
                  ) : (
                    staff.map((member) => (
                      <option key={member.id} value={member.id}>{member.name}</option>
                    ))
                  )}
                </select>
              </div>
              
              <div>
                <Label htmlFor="fuelType">Fuel Type</Label>
                <select
                  id="fuelType"
                  value={fuelType}
                  onChange={(e) => setFuelType(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                >
                  <option value="Petrol">Petrol</option>
                  <option value="Diesel">Diesel</option>
                </select>
              </div>
              
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  type="date"
                  id="date"
                  value={date.toISOString().split('T')[0]}
                  onChange={(e) => setDate(new Date(e.target.value))}
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
                <Label htmlFor="discountAmount">Discount Amount (₹)</Label>
                <Input
                  type="number"
                  id="discountAmount"
                  value={discountAmount === 0 ? '' : discountAmount}
                  onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                  placeholder="Enter discount amount"
                />
              </div>
            </div>
            
            <Button 
              type="submit" 
              disabled={isSubmitting || !selectedCustomer}
              className="w-full mt-4"
            >
              {isSubmitting ? 'Recording...' : 'Record Indent'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Success Dialog */}
      <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Check className="h-6 w-6 text-green-500 mr-2" /> 
              Indent Recorded Successfully
            </DialogTitle>
            <DialogDescription>
              The transaction has been saved and is pending approval.
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-slate-50 p-4 rounded-md space-y-2 my-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm font-medium text-gray-500">Indent Number:</div>
              <div className="text-sm font-semibold">{successDetails.indentNumber}</div>
              
              <div className="text-sm font-medium text-gray-500">Customer:</div>
              <div className="text-sm font-semibold">{successDetails.customerName}</div>
              
              <div className="text-sm font-medium text-gray-500">Vehicle:</div>
              <div className="text-sm font-semibold">{successDetails.vehicleNumber}</div>
              
              <div className="text-sm font-medium text-gray-500">Fuel Type:</div>
              <div className="text-sm font-semibold">{successDetails.fuelType}</div>
              
              <div className="text-sm font-medium text-gray-500">Quantity:</div>
              <div className="text-sm font-semibold">{successDetails.quantity} L</div>
              
              <div className="text-sm font-medium text-gray-500">Amount:</div>
              <div className="text-sm font-semibold">₹{successDetails.amount}</div>
            </div>
          </div>
          
          <DialogFooter className="sm:justify-center">
            <Button 
              variant="default" 
              onClick={() => setSuccessDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MobileRecordIndent;
