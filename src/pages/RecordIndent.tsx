
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CustomerVehicleSelection } from '@/components/indent/CustomerVehicleSelection';
import { IndentBookletSelection } from '@/components/indent/IndentBookletSelection';
import { FuelTransactionForm } from '@/components/indent/FuelTransactionForm';
import { RecentTransactionsTable } from '@/components/indent/RecentTransactionsTable';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { getFuelPumpId } from '@/integrations/utils';

const RecordIndent = () => {
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [selectedBooklet, setSelectedBooklet] = useState<string>('');
  const [indentNumber, setIndentNumber] = useState<string>('');
  const [fuelType, setFuelType] = useState<string>('Petrol');
  const [amount, setAmount] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [indentNumberError, setIndentNumberError] = useState<string>('');
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [staff, setStaff] = useState<{id: string, name: string}[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<string>('');

  // Fetch staff list when component mounts
  useEffect(() => {
    const fetchStaff = async () => {
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
          .eq('fuel_pump_id', fuelPumpId) // Add fuel pump ID filter
          .order('name', { ascending: true });
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          setStaff(data);
          setSelectedStaff(data[0].id); // Default to first staff member
        } else {
          toast({
            title: "No staff members found",
            description: "Please add at least one staff member before recording indents",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Error fetching staff:', error);
        toast({
          title: "Error loading staff",
          description: "Could not load staff list. Please try again.",
          variant: "destructive"
        });
      }
    };
    
    fetchStaff();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!selectedCustomer || !selectedVehicle || !fuelType || !amount || !quantity || !date || !selectedStaff) {
        toast({
          title: "Missing information",
          description: "Please fill all required fields",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }

      // Get the fuel pump ID
      const fuelPumpId = await getFuelPumpId();
      
      if (!fuelPumpId) {
        toast({
          title: "Authentication Required",
          description: "Please log in with a fuel pump account to record indents",
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

        if (indentNumberError) {
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
          discount_amount: discountAmount,
          indent_number: indentNumber,
          booklet_id: selectedBooklet,
          date: date.toISOString(),
          status: 'Fulfilled',
          fuel_pump_id: fuelPumpId // Add fuel pump ID
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
            discount_amount: discountAmount,
            indent_number: indentNumber,
            booklet_id: selectedBooklet,
            date: date.toISOString(),
            status: 'Fulfilled',
            fuel_pump_id: fuelPumpId // Add fuel pump ID
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
        date: date.toISOString(),
        fuel_type: fuelType,
        amount: amount,
        quantity: quantity,
        discount_amount: discountAmount,
        payment_method: 'Cash',
        indent_id: createdIndentNumber, // Using the indent number we just created
        fuel_pump_id: fuelPumpId // Add fuel pump ID
      });

      // Now create the transaction referencing the indent if it was created
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          id: transactionId,
          customer_id: selectedCustomer,
          vehicle_id: selectedVehicle,
          staff_id: selectedStaff,
          date: date.toISOString(),
          fuel_type: fuelType,
          amount: amount,
          quantity: quantity,
          discount_amount: discountAmount,
          payment_method: 'Cash', // Default payment method
          indent_id: createdIndentNumber, // Using the indent number we just created
          fuel_pump_id: fuelPumpId // Add fuel pump ID
        });

      if (transactionError) {
        console.error("Transaction error:", transactionError);
        throw transactionError;
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
      setDiscountAmount(0);
      setDate(new Date());
      setIndentNumberError('');
      
      // Trigger a refresh of the transactions table
      setRefreshTrigger(prev => prev + 1);
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
          <CardTitle>Record New Indent</CardTitle>
          <CardDescription>
            Search by indent number or customer to record a fuel indent
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search by indent number or customer first */}
            <IndentBookletSelection
              selectedCustomer={selectedCustomer}
              selectedBooklet={selectedBooklet}
              setSelectedBooklet={setSelectedBooklet}
              indentNumber={indentNumber}
              setIndentNumber={setIndentNumber}
              indentNumberError={indentNumberError}
              setIndentNumberError={setIndentNumberError}
              setSelectedCustomer={setSelectedCustomer}
              setSelectedVehicle={setSelectedVehicle}
            />

            {/* Vehicle selection (only shows if customer is selected) */}
            <CustomerVehicleSelection
              selectedCustomer={selectedCustomer}
              selectedVehicle={selectedVehicle}
              setSelectedVehicle={setSelectedVehicle}
            />

            {/* Only show the fuel transaction form if we have a customer */}
            {selectedCustomer && (
              <FuelTransactionForm
                fuelType={fuelType}
                setFuelType={setFuelType}
                amount={amount}
                setAmount={setAmount}
                quantity={quantity}
                setQuantity={setQuantity}
                discountAmount={discountAmount}
                setDiscountAmount={setDiscountAmount}
                date={date}
                setDate={setDate}
                isSubmitting={isSubmitting}
                onSubmit={handleSubmit}
                staff={staff}
                selectedStaff={selectedStaff}
                setSelectedStaff={setSelectedStaff}
              />
            )}

            {/* Add submit button here directly if we have all required information */}
            {selectedCustomer && selectedVehicle && amount > 0 && quantity > 0 && date && selectedStaff && (
              <Button 
                className="w-full mt-4" 
                onClick={handleSubmit} 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Recording Indent...
                  </>
                ) : 'Record Indent'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <RecentTransactionsTable refreshTrigger={refreshTrigger} />
    </div>
  );
};

export default RecordIndent;
