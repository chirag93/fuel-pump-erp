
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { getFuelPumpId } from '@/integrations/utils';

interface UseSaveIndentProps {
  indentNumber: string;
  selectedCustomer: string;
  selectedCustomerName: string;
  selectedVehicle: string;
  selectedVehicleNumber: string;
  selectedBooklet: string;
  amount: number | '';
  quantity: number | '';
  fuelType: string;
  discountAmount: number;
  date: Date;
  selectedStaff: string;
  validateIndentNumber: (indentNum: string, selectedBooklet: string) => Promise<boolean>;
  setSuccessDetails: React.Dispatch<React.SetStateAction<any>>;
  setSuccessDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  resetForm: () => void;
}

export const useSaveIndent = ({
  indentNumber,
  selectedCustomer,
  selectedCustomerName,
  selectedVehicle,
  selectedVehicleNumber,
  selectedBooklet,
  amount,
  quantity,
  fuelType,
  discountAmount,
  date,
  selectedStaff,
  validateIndentNumber,
  setSuccessDetails,
  setSuccessDialogOpen,
  resetForm
}: UseSaveIndentProps) => {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSaveIndent = async () => {
    // Validation
    if (!indentNumber || !selectedCustomer || !selectedVehicle || !quantity || quantity <= 0) {
      toast({
        title: "Missing information",
        description: "Please complete all required fields"
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Convert amount and quantity from potentially empty string to numbers
      const numericAmount = typeof amount === 'string' ? 0 : amount;
      const numericQuantity = typeof quantity === 'string' ? 0 : quantity;

      // Validate indent number format and availability
      const isValid = await validateIndentNumber(indentNumber, selectedBooklet);
      if (!isValid) return;

      // Get fuel pump ID
      const fuelPumpId = await getFuelPumpId();
      if (!fuelPumpId) {
        toast({
          title: "Error",
          description: "Could not determine fuel pump ID"
        });
        return;
      }

      // Create indent ID
      const indentId = crypto.randomUUID();

      // Create the indent record
      const indentData = {
        id: indentId,
        customer_id: selectedCustomer,
        vehicle_id: selectedVehicle,
        fuel_type: fuelType,
        amount: numericAmount,
        quantity: numericQuantity,
        discount_amount: discountAmount,
        indent_number: indentNumber,
        booklet_id: selectedBooklet || null,
        date: date.toISOString().split('T')[0],
        status: 'Pending',
        approval_status: 'pending',
        source: 'mobile',
        fuel_pump_id: fuelPumpId
      };

      const { error: indentError } = await supabase
        .from('indents')
        .insert(indentData);

      if (indentError) {
        console.error('Error creating indent:', indentError);
        throw new Error('Failed to create indent record');
      }

      // For indents, we should also create a transaction with payment_method "indent"
      const transactionId = crypto.randomUUID();
      const transactionData = {
        id: transactionId,
        customer_id: selectedCustomer,
        vehicle_id: selectedVehicle,
        staff_id: selectedStaff,
        date: date.toISOString().split('T')[0],
        fuel_type: fuelType,
        amount: numericAmount,
        quantity: numericQuantity,
        discount_amount: discountAmount,
        payment_method: 'indent', // Set payment method to 'indent'
        indent_id: indentNumber,
        source: 'mobile',
        fuel_pump_id: fuelPumpId
      };

      const { error: transactionError } = await supabase
        .from('transactions')
        .insert(transactionData);

      if (transactionError) {
        console.error('Error creating transaction:', transactionError);
        // Continue even if transaction creation fails
        toast({
          title: "Warning",
          description: "Indent created but transaction record could not be created"
        });
      }

      // Update customer balance immediately on indent creation
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('balance')
        .eq('id', selectedCustomer)
        .single();
        
      if (customerError) {
        console.error('Error fetching customer data:', customerError);
        // Don't throw here, we can still proceed with the rest
        toast({
          title: "Warning",
          description: "Created indent but couldn't update customer balance"
        });
      } else {
        // Update customer balance
        const currentBalance = customerData?.balance || 0;
        const newBalance = currentBalance + numericAmount;
        
        const { error: balanceError } = await supabase
          .from('customers')
          .update({ balance: newBalance })
          .eq('id', selectedCustomer);
          
        if (balanceError) {
          console.error('Error updating customer balance:', balanceError);
          toast({
            title: "Warning",
            description: "Indent created but customer balance could not be updated"
          });
        }
      }

      // Show success message
      setSuccessDetails({
        indentNumber,
        customerName: selectedCustomerName,
        vehicleNumber: selectedVehicleNumber,
        amount: numericAmount,
        quantity: numericQuantity,
        fuelType,
        date: date.toLocaleDateString()
      });

      setSuccessDialogOpen(true);
      resetForm();

    } catch (error) {
      console.error('Error saving indent:', error);
      toast({
        title: "Error",
        description: "Failed to record indent"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return { isSubmitting, handleSaveIndent };
};
