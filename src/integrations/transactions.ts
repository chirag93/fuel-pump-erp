
import { supabase, Transaction } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { getFuelPumpId } from './utils';

// Update the type definition to make indent_id optional
export interface TransactionWithDetails extends Omit<Transaction, 'indent_id'> {
  vehicle_number?: string;
  indent_id?: string | null; // Make indent_id optional
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
        // Ensure source is properly typed
        source: (transaction.source === 'mobile' ? 'mobile' : 'web') as 'mobile' | 'web'
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
    
    // Make sure the indent_id is consistent with what's stored in the indents table
    // Note: indent_id should now be a string value that matches exactly what's in the indents table
    const formattedData = {
      ...transactionData,
      indent_id: transactionData.indent_id || null
    };
    
    console.log('Creating transaction with data:', {
      id,
      ...formattedData, 
      fuel_pump_id: fuelPumpId
    });
    
    const { data, error } = await supabase
      .from('transactions')
      .insert([{ id, ...formattedData, fuel_pump_id: fuelPumpId }])
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

/**
 * Get all transactions filtered by fuel pump ID with pagination
 */
export const getAllTransactions = async (
  page: number = 1, 
  pageSize: number = 10, 
  startDate?: string, 
  endDate?: string
): Promise<{ transactions: Transaction[], totalCount: number }> => {
  try {
    const fuelPumpId = await getFuelPumpId();
    
    if (!fuelPumpId) {
      console.log('No fuel pump ID available, cannot fetch all transactions');
      toast({
        title: "Authentication Required",
        description: "Please log in to view transactions",
        variant: "destructive"
      });
      return { transactions: [], totalCount: 0 };
    }
    
    // Calculate pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    // Build query
    let query = supabase
      .from('transactions')
      .select(`
        *,
        customers(name),
        vehicles(number)
      `, { count: 'exact' })
      .eq('fuel_pump_id', fuelPumpId);
    
    // Add date filtering
    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);
    
    // Execute query with pagination
    const { data, error, count } = await query
      .order('date', { ascending: false })
      .range(from, to);
      
    if (error) {
      throw error;
    }
    
    // Process and validate the source field to ensure it conforms to the Transaction type
    const processedData = data?.map(item => {
      // Ensure source is either 'mobile' or 'web'
      const processedItem = { 
        ...item,
        // Normalize the source field to ensure it's either 'mobile' or 'web'
        source: (item.source === 'mobile' ? 'mobile' : 'web') as 'mobile' | 'web'
      };
      return processedItem;
    }) || [];
    
    return { 
      transactions: processedData as Transaction[], 
      totalCount: count || 0 
    };
  } catch (error) {
    console.error('Error fetching all transactions:', error);
    return { transactions: [], totalCount: 0 };
  }
};
