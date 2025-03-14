
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CustomerVehicleSelection } from '@/components/indent/CustomerVehicleSelection';
import { IndentBookletSelection } from '@/components/indent/IndentBookletSelection';
import { FuelTransactionForm } from '@/components/indent/FuelTransactionForm';
import { RecentTransactionsTable } from '@/components/indent/RecentTransactionsTable';

const RecordIndent = () => {
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [selectedBooklet, setSelectedBooklet] = useState<string>('');
  const [indentNumber, setIndentNumber] = useState<string>('');
  const [fuelType, setFuelType] = useState<string>('Petrol');
  const [amount, setAmount] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [indentNumberError, setIndentNumberError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
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
        const { error: updateError } = await supabase
          .from('indent_booklets')
          .update({ used_indents: (prevUsedIndents) => prevUsedIndents + 1 })
          .eq('id', selectedBooklet);

        if (updateError) {
          console.error('Error updating booklet:', updateError);
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
          <div className="space-y-4">
            <CustomerVehicleSelection
              selectedCustomer={selectedCustomer}
              setSelectedCustomer={setSelectedCustomer}
              selectedVehicle={selectedVehicle}
              setSelectedVehicle={setSelectedVehicle}
            />

            <IndentBookletSelection
              selectedCustomer={selectedCustomer}
              selectedBooklet={selectedBooklet}
              setSelectedBooklet={setSelectedBooklet}
              indentNumber={indentNumber}
              setIndentNumber={setIndentNumber}
              indentNumberError={indentNumberError}
              setIndentNumberError={setIndentNumberError}
            />

            <FuelTransactionForm
              fuelType={fuelType}
              setFuelType={setFuelType}
              amount={amount}
              setAmount={setAmount}
              quantity={quantity}
              setQuantity={setQuantity}
              date={date}
              setDate={setDate}
              isSubmitting={isSubmitting}
              onSubmit={handleSubmit}
            />
          </div>
        </CardContent>
      </Card>

      <RecentTransactionsTable />
    </div>
  );
};

export default RecordIndent;
