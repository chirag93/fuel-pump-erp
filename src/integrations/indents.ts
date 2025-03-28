
import { supabase, Indent } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { getFuelPumpId } from './utils';

/**
 * Fetch all indents for a specific customer
 */
export const getIndentsByCustomerId = async (customerId: string): Promise<Indent[]> => {
  try {
    console.log('API getIndentsByCustomerId called for customer ID:', customerId);
    const fuelPumpId = await getFuelPumpId();
    
    let query = supabase
      .from('indents')
      .select(`
        *,
        vehicles:vehicle_id (number)
      `)
      .eq('customer_id', customerId);
      
    // Apply fuel pump filter if available
    if (fuelPumpId) {
      console.log(`Filtering indents by fuel_pump_id: ${fuelPumpId}`);
      query = query.eq('fuel_pump_id', fuelPumpId);
    } else {
      console.log('No fuel pump ID available, querying all indents for this customer');
    }
      
    const { data, error } = await query;
      
    if (error) throw error;
    
    if (data) {
      console.log(`Found ${data.length} indents`);
      
      // Process data to include vehicle number if needed
      const processedIndents = data.map((indent: any) => ({
        ...indent,
        vehicle_number: indent.vehicles?.number || 'Unknown',
      })) as Indent[];
      
      // Now fetch transactions separately instead of using a nested join
      if (processedIndents.length > 0) {
        const indentIds = processedIndents.map(indent => indent.id);
        
        let transactionQuery = supabase
          .from('transactions')
          .select('*')
          .in('indent_id', indentIds);
          
        // Apply fuel pump filter if available  
        if (fuelPumpId) {
          transactionQuery = transactionQuery.eq('fuel_pump_id', fuelPumpId);
        }
        
        const { data: transactionsData, error: transactionsError } = await transactionQuery;
          
        if (transactionsError) {
          console.error('Error fetching transactions for indents:', transactionsError);
        } else if (transactionsData) {
          // Map transactions to their respective indents
          processedIndents.forEach(indent => {
            const matchingTransaction = transactionsData.find(tx => tx.indent_id === indent.id);
            if (matchingTransaction) {
              // Ensure source is strictly typed as 'mobile' | 'web'
              indent.transaction = {
                ...matchingTransaction,
                source: matchingTransaction.source as 'mobile' | 'web'
              };
            } else {
              indent.transaction = null;
            }
          });
        }
      }
      
      return processedIndents;
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching indents:', error);
    toast({
      title: "Error",
      description: "Failed to load indents data",
      variant: "destructive"
    });
    return [];
  }
};

/**
 * Fetch indents by booklet ID with transactions
 */
export const getIndentsByBookletId = async (bookletId: string): Promise<Indent[]> => {
  try {
    console.log('Fetching indents for booklet ID:', bookletId);
    const fuelPumpId = await getFuelPumpId();
    
    let query = supabase
      .from('indents')
      .select(`
        *,
        vehicles:vehicle_id (number)
      `)
      .eq('booklet_id', bookletId);
      
    // Apply fuel pump filter if available
    if (fuelPumpId) {
      console.log(`Filtering indents by fuel_pump_id: ${fuelPumpId}`);
      query = query.eq('fuel_pump_id', fuelPumpId);
    } else {
      console.log('No fuel pump ID available, querying all indents for this booklet');
    }
      
    const { data, error } = await query;
      
    if (error) throw error;
    
    if (data && data.length > 0) {
      console.log(`Found ${data.length} indents for booklet ${bookletId}`);
      
      // Get all indent IDs
      const indentIds = data.map(indent => indent.id);
      
      // Fetch transactions related to these indents
      let transactionQuery = supabase
        .from('transactions')
        .select('*')
        .in('indent_id', indentIds);
        
      // Apply fuel pump filter if available
      if (fuelPumpId) {
        transactionQuery = transactionQuery.eq('fuel_pump_id', fuelPumpId);
      }
      
      const { data: transactionsData, error: transactionsError } = await transactionQuery;
        
      if (transactionsError) throw transactionsError;
      
      // Map transactions to the indents
      const indentsWithTransactions = data.map(indent => {
        const transaction = transactionsData?.find(t => t.indent_id === indent.id);
        return {
          ...indent,
          transaction: transaction ? {
            ...transaction,
            source: transaction.source as 'mobile' | 'web'
          } : null,
          vehicle_number: indent.vehicles?.number || 'Unknown',
        };
      }) as Indent[];
      
      return indentsWithTransactions;
    }
    
    return data ? (data as Indent[]) : [];
  } catch (error) {
    console.error('Error fetching indents by booklet ID:', error);
    toast({
      title: "Error",
      description: "Failed to load indents data",
      variant: "destructive"
    });
    return [];
  }
};
