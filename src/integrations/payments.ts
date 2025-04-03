
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { getFuelPumpId } from '@/integrations/utils';

interface Payment {
  customer_id: string;
  amount: number;
  payment_method: string;
  notes?: string;
  date: string;
}

/**
 * Record a payment for a customer
 */
export const recordPayment = async (
  payment: Payment,
  currentBalance: number | null = 0
): Promise<boolean> => {
  try {
    // Get the fuel pump ID for the current user
    const fuelPumpId = await getFuelPumpId();
    
    if (!fuelPumpId) {
      console.error('Unable to get fuel pump ID');
      toast({
        title: "Error",
        description: "Unable to determine fuel pump. Please try again.",
        variant: "destructive"
      });
      return false;
    }

    console.log(`Recording payment with fuel_pump_id: ${fuelPumpId}`);
    
    // Create a new payment record
    const { error: paymentError } = await supabase
      .from('customer_payments')
      .insert({
        customer_id: payment.customer_id,
        amount: payment.amount,
        payment_method: payment.payment_method,
        notes: payment.notes,
        date: payment.date,
        fuel_pump_id: fuelPumpId
      });

    if (paymentError) throw paymentError;

    // Record a transaction with type PAYMENT
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        id: crypto.randomUUID(),
        customer_id: payment.customer_id,
        date: payment.date.split('T')[0],
        fuel_type: 'PAYMENT',
        amount: payment.amount,
        quantity: 0,
        payment_method: payment.payment_method,
        staff_id: '00000000-0000-0000-0000-000000000000', // Placeholder staff ID
        fuel_pump_id: fuelPumpId
      });

    if (transactionError) throw transactionError;

    // Update the customer balance
    const newBalance = ((currentBalance || 0) - payment.amount);
    
    const { error: updateError } = await supabase
      .from('customers')
      .update({ balance: newBalance })
      .eq('id', payment.customer_id);

    if (updateError) throw updateError;

    return true;
  } catch (error) {
    console.error('Error recording payment:', error);
    toast({
      title: "Error",
      description: "Failed to record payment. Please try again.",
      variant: "destructive"
    });
    return false;
  }
};
