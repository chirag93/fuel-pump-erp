
import { supabase, Transaction } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { getFuelPumpId } from './utils';

export interface TransactionWithDetails extends Transaction {
  vehicle_number?: string;
}

/**
 * Fetch all transactions for a specific customer
 */
export const getTransactionsByCustomerId = async (customerId: string): Promise<TransactionWithDetails[]> => {
  try {
    console.log('API getTransactionsByCustomerId called for customer ID:', customerId);
    const fuelPumpId = await getFuelPumpId();
    
    if (!fuelPumpId) {
      console.log('No fuel pump ID available, cannot fetch transactions');
      toast({
        title: "Authentication Required",
        description: "Please log in with a fuel pump account to view transactions",
        variant: "destructive"
      });
      return [];
    }
    
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        vehicles:vehicle_id (number)
      `)
      .eq('customer_id', customerId)
      .eq('fuel_pump_id', fuelPumpId);
      
    if (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
    
    if (data) {
      console.log(`Found ${data.length} transactions for customer ${customerId} (fuel pump: ${fuelPumpId})`);
      
      // Process data to include vehicle number
      const processedTransactions = data.map((transaction: any) => ({
        ...transaction,
        vehicle_number: transaction.vehicles?.number || 'Unknown',
      }));
      
      return processedTransactions as TransactionWithDetails[];
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching transactions:', error);
    toast({
      title: "Error",
      description: "Failed to load transactions data",
      variant: "destructive"
    });
    return [];
  }
};

/**
 * Create a new transaction
 */
export const createTransaction = async (transactionData: Omit<Transaction, 'id' | 'created_at'>): Promise<Transaction | null> => {
  try {
    const fuelPumpId = await getFuelPumpId();
    
    if (!fuelPumpId) {
      console.log('No fuel pump ID available, cannot create transaction');
      toast({
        title: "Authentication Required",
        description: "Please log in with a fuel pump account to create transactions",
        variant: "destructive"
      });
      return null;
    }
    
    // Generate a UUID for the transaction ID
    const id = crypto.randomUUID();
    
    const { data, error } = await supabase
      .from('transactions')
      .insert([{ id, ...transactionData, fuel_pump_id: fuelPumpId }])
      .select()
      .single();
      
    if (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
    
    console.log(`Created new transaction with ID ${id} for fuel pump ${fuelPumpId}`);
    return data as Transaction;
  } catch (error) {
    console.error('Error creating transaction:', error);
    toast({
      title: "Error",
      description: "Failed to create transaction",
      variant: "destructive"
    });
    return null;
  }
};
