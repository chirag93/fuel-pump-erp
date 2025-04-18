
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
 * Get a valid staff ID for the current user/fuel pump
 */
const getValidStaffId = async (fuelPumpId: string): Promise<string> => {
  try {
    // First try to get the current authenticated user's staff record
    const { data: authUser } = await supabase.auth.getUser();
    
    if (authUser && authUser.user) {
      const { data: staffData } = await supabase
        .from('staff')
        .select('id')
        .eq('auth_id', authUser.user.id)
        .eq('fuel_pump_id', fuelPumpId)
        .eq('is_active', true)
        .single();
      
      if (staffData) {
        console.log(`Using authenticated user's staff ID: ${staffData.id}`);
        return staffData.id;
      }
    }
    
    // Fallback to any active staff member for this fuel pump
    const { data: anyStaff } = await supabase
      .from('staff')
      .select('id')
      .eq('fuel_pump_id', fuelPumpId)
      .eq('is_active', true)
      .limit(1)
      .single();
    
    if (anyStaff) {
      console.log(`Using fallback staff ID: ${anyStaff.id}`);
      return anyStaff.id;
    }
    
    console.warn('No valid staff ID found, payment may fail due to foreign key constraint');
    throw new Error('No valid staff member found for this fuel pump');
  } catch (error) {
    console.error('Error getting valid staff ID:', error);
    throw new Error('Could not find a valid staff ID');
  }
};

/**
 * Record a payment for a customer
 * When a customer makes a payment, their credit balance INCREASES
 */
export const recordPayment = async (
  payment: Payment,
  currentBalance: number | null = 0
): Promise<boolean> => {
  try {
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
    const { data: paymentData, error: paymentError } = await supabase
      .from('customer_payments')
      .insert({
        customer_id: payment.customer_id,
        amount: payment.amount,
        payment_method: payment.payment_method,
        notes: payment.notes,
        date: payment.date,
        fuel_pump_id: fuelPumpId
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Error recording payment:', paymentError);
      throw paymentError;
    }

    console.log('Payment recorded successfully:', paymentData);

    // Get a valid staff ID to avoid foreign key constraint violation
    let staffId;
    try {
      staffId = await getValidStaffId(fuelPumpId);
    } catch (error) {
      console.error('Failed to get valid staff ID:', error);
      toast({
        title: "Warning",
        description: "Payment recorded but transaction creation failed: No valid staff member found.",
        variant: "destructive"
      });
      
      // Update the customer balance even if transaction creation fails
      // For payments, we INCREASE the balance (adding to available credit)
      await updateCustomerBalance(payment.customer_id, payment.amount, currentBalance);
      return true;
    }

    // Record a transaction with type PAYMENT
    const transactionId = crypto.randomUUID();
    console.log(`Creating transaction with ID: ${transactionId} and staff ID: ${staffId}`);

    const { data: transactionData, error: transactionError } = await supabase
      .from('transactions')
      .insert({
        id: transactionId,
        customer_id: payment.customer_id,
        date: payment.date.split('T')[0],
        fuel_type: 'PAYMENT',
        amount: payment.amount,
        quantity: 0,
        payment_method: payment.payment_method,
        staff_id: staffId,
        fuel_pump_id: fuelPumpId
      })
      .select();

    if (transactionError) {
      console.error('Error creating transaction:', transactionError);
      throw transactionError;
    }

    console.log('Transaction created successfully:', transactionData);

    // Update the customer balance - INCREASE balance when payment is made
    await updateCustomerBalance(payment.customer_id, payment.amount, currentBalance);

    toast({
      title: "Payment Recorded",
      description: `Successfully recorded payment of ₹${payment.amount}`,
    });

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

/**
 * Update customer balance after payment
 * For payments, we INCREASE the balance as the customer has more credit available
 */
const updateCustomerBalance = async (
  customerId: string,
  paymentAmount: number,
  currentBalance: number | null = 0
): Promise<void> => {
  try {
    // Get the latest balance from the database to ensure consistency
    const { data: customer, error: fetchError } = await supabase
      .from('customers')
      .select('balance')
      .eq('id', customerId)
      .single();
      
    if (fetchError) {
      console.error('Error fetching current customer balance:', fetchError);
      throw fetchError;
    }
    
    // Calculate new balance (increase credit when payment is made)
    const latestBalance = customer?.balance || 0;
    const newBalance = latestBalance + paymentAmount;
    
    console.log(`Updating customer balance: Current: ${latestBalance}, Payment: ${paymentAmount}, New: ${newBalance}`);
    
    const { data: balanceData, error: updateError } = await supabase
      .from('customers')
      .update({ balance: newBalance })
      .eq('id', customerId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating customer balance:', updateError);
      throw updateError;
    }

    console.log('Customer balance updated successfully:', balanceData);
  } catch (error) {
    console.error('Error in updateCustomerBalance:', error);
    toast({
      title: "Error",
      description: "Failed to update customer balance. Please try again.",
      variant: "destructive"
    });
  }
};
