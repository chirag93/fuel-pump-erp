
import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from '@/hooks/use-toast';
import { getFuelPumpId } from '@/integrations/utils';
import { SuccessDetails } from './useIndentForm';

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
  setSuccessDetails: (details: SuccessDetails) => void;
  setSuccessDialogOpen: (open: boolean) => void;
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
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSaveIndent = async () => {
    // Basic validation
    if (!indentNumber) {
      toast({
        title: "Error",
        description: "Indent number is required",
        variant: "destructive"
      });
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
    
    // Additional validation for indent number
    const isValid = await validateIndentNumber(indentNumber, selectedBooklet);
    if (!isValid) {
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
      
      // The indentId needs to be persistent and unique
      // Using the indentNumber directly since that's what's referenced in the foreign key
      const indentId = indentNumber;
      
      console.log("Creating indent with data:", {
        id: indentId,
        indent_number: indentNumber,
        customer_id: selectedCustomer,
        vehicle_id: selectedVehicle,
        booklet_id: selectedBooklet,
        fuel_type: fuelType,
        amount: Number(amount),
        quantity: Number(quantity),
        date: date.toISOString().split('T')[0]
      });
      
      // Create indent record
      const { data: indentData, error: indentError } = await supabase
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
        }])
        .select();
        
      if (indentError) {
        console.error('Error creating indent:', indentError);
        
        // Check if the error is a duplicate key error
        if (indentError.message && indentError.message.includes('duplicate key')) {
          toast({
            title: "Error",
            description: "This indent number has already been used",
            variant: "destructive"
          });
          setIsSubmitting(false);
          return;
        }
        
        throw indentError;
      }
      
      console.log("Indent created successfully:", indentData);
      
      // First, wait a moment to ensure the indent is fully saved in the database
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Now create transaction record
      // IMPORTANT: The indent_id in transactions table should match what's in the indents table
      // In this case, we're using the indentId which is set to indentNumber
      const transactionId = crypto.randomUUID();
      console.log("Creating transaction with data:", {
        id: transactionId,
        indent_id: indentId, // Use the indent ID which is the indent number
        customer_id: selectedCustomer
      });
      
      const { data: transactionData, error: transactionError } = await supabase
        .from('transactions')
        .insert([{
          id: transactionId,
          customer_id: selectedCustomer,
          vehicle_id: selectedVehicle,
          indent_id: indentId, // This needs to match the id in indents table
          fuel_type: fuelType,
          amount: Number(amount),
          quantity: Number(quantity),
          discount_amount: discountAmount,
          payment_method: 'INDENT',
          date: date.toISOString().split('T')[0],
          staff_id: selectedStaff,
          source: 'mobile',
          fuel_pump_id: fuelPumpId
        }])
        .select();
        
      if (transactionError) {
        console.error('Error creating transaction:', transactionError);
        
        // If transaction fails, delete the indent to maintain consistency
        try {
          await supabase
            .from('indents')
            .delete()
            .eq('id', indentId);
          
          console.log("Rolled back indent creation due to transaction failure");
        } catch (rollbackError) {
          console.error("Failed to rollback indent:", rollbackError);
        }
        
        throw transactionError;
      }
      
      console.log("Transaction created successfully:", transactionData);
      
      // Update customer balance
      try {
        const { data: currentCustomer } = await supabase
          .from('customers')
          .select('balance')
          .eq('id', selectedCustomer)
          .eq('fuel_pump_id', fuelPumpId)
          .maybeSingle();
          
        if (currentCustomer) {
          const newBalance = (currentCustomer.balance || 0) + Number(amount);
          
          await supabase
            .from('customers')
            .update({ balance: newBalance })
            .eq('id', selectedCustomer)
            .eq('fuel_pump_id', fuelPumpId);
            
          console.log("Updated customer balance to:", newBalance);
        }
      } catch (balanceError) {
        console.error('Error updating customer balance:', balanceError);
        // Continue with success even if balance update fails, but log it
      }
      
      // Update booklet used_indents count
      try {
        const { data: booklet } = await supabase
          .from('indent_booklets')
          .select('used_indents')
          .eq('id', selectedBooklet)
          .eq('fuel_pump_id', fuelPumpId)
          .maybeSingle();
          
        if (booklet) {
          await supabase
            .from('indent_booklets')
            .update({ used_indents: (booklet.used_indents || 0) + 1 })
            .eq('id', selectedBooklet)
            .eq('fuel_pump_id', fuelPumpId);
            
          console.log("Updated booklet used_indents count");
        }
      } catch (bookletError) {
        console.error('Error updating booklet usage count:', bookletError);
        // Continue with success even if booklet update fails, but log it
      }
      
      // All operations succeeded, now show success dialog
      setSuccessDetails({
        indentNumber,
        customerName: selectedCustomerName,
        vehicleNumber: selectedVehicleNumber,
        amount: Number(amount),
        quantity: Number(quantity),
        fuelType
      });
      
      console.log("All operations completed successfully, showing success dialog");
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

  return {
    isSubmitting,
    handleSaveIndent
  };
};
