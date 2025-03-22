
import { supabase, Transaction } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface TransactionWithDetails extends Transaction {
  vehicle_number?: string;
}

/**
 * Fetch all transactions for a specific customer
 */
export const getTransactionsByCustomerId = async (customerId: string): Promise<TransactionWithDetails[]> => {
  try {
    console.log('API getTransactionsByCustomerId called for customer ID:', customerId);
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        vehicles:vehicle_id (number)
      `)
      .eq('customer_id', customerId);
      
    if (error) throw error;
    
    if (data) {
      console.log(`Found ${data.length} transactions`);
      
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
    // Generate a UUID for the transaction ID
    const id = crypto.randomUUID();
    
    const { data, error } = await supabase
      .from('transactions')
      .insert([{ id, ...transactionData }])
      .select()
      .single();
      
    if (error) throw error;
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
