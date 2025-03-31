
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
    
    if (!fuelPumpId) {
      console.log('No fuel pump ID available for filtering indents');
      toast({
        title: "Authentication Required",
        description: "Please log in with a fuel pump account to view indents",
        variant: "destructive"
      });
      return [];
    }
    
    let query = supabase
      .from('indents')
      .select(`
        *,
        vehicles:vehicle_id (number)
      `)
      .eq('customer_id', customerId);
      
    // Apply fuel pump filter
    console.log(`Filtering indents by fuel_pump_id: ${fuelPumpId}`);
    query = query.eq('fuel_pump_id', fuelPumpId);
      
    const { data, error } = await query;
      
    if (error) throw error;
    
    if (data) {
      console.log(`Found ${data.length} indents`);
      
      // Process data to include vehicle number and ensure status is a valid enum value
      const processedIndents = data.map((indent: any) => ({
        ...indent,
        vehicle_number: indent.vehicles?.number || 'Unknown',
        // Ensure status is one of the allowed values or default to "Pending"
        status: ['Completed', 'Cancelled', 'Pending'].includes(indent.status) 
          ? indent.status 
          : 'Pending'
      })) as Indent[];
      
      // Now fetch transactions separately with consistent ID format
      if (processedIndents.length > 0) {
        const indentIds = processedIndents.map(indent => indent.id);
        
        console.log('Fetching transactions for indent IDs:', indentIds);
        
        let transactionQuery = supabase
          .from('transactions')
          .select('*')
          .in('indent_id', indentIds);
          
        // Apply fuel pump filter  
        transactionQuery = transactionQuery.eq('fuel_pump_id', fuelPumpId);
        
        const { data: transactionsData, error: transactionsError } = await transactionQuery;
          
        if (transactionsError) {
          console.error('Error fetching transactions for indents:', transactionsError);
        } else if (transactionsData) {
          console.log(`Found ${transactionsData.length} transactions for indents`);
          
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
    
    if (!fuelPumpId) {
      console.log('No fuel pump ID available for filtering indents by booklet');
      toast({
        title: "Authentication Required",
        description: "Please log in with a fuel pump account to view booklet indents",
        variant: "destructive"
      });
      return [];
    }
    
    let query = supabase
      .from('indents')
      .select(`
        *,
        vehicles:vehicle_id (number)
      `)
      .eq('booklet_id', bookletId);
      
    // Apply fuel pump filter
    console.log(`Filtering indents by fuel_pump_id: ${fuelPumpId}`);
    query = query.eq('fuel_pump_id', fuelPumpId);
      
    const { data, error } = await query;
      
    if (error) throw error;
    
    if (data && data.length > 0) {
      console.log(`Found ${data.length} indents for booklet ${bookletId}`);
      
      // Get all indent IDs, ensuring correct format matching
      const indentIds = data.map(indent => indent.id);
      
      console.log('Fetching transactions for indent IDs:', indentIds);
      
      // Fetch transactions related to these indents
      let transactionQuery = supabase
        .from('transactions')
        .select('*')
        .in('indent_id', indentIds);
        
      // Apply fuel pump filter
      transactionQuery = transactionQuery.eq('fuel_pump_id', fuelPumpId);
      
      const { data: transactionsData, error: transactionsError } = await transactionQuery;
        
      if (transactionsError) throw transactionsError;
      
      console.log(`Found ${transactionsData?.length || 0} transactions for these indents`);
      
      // Map transactions to the indents and ensure status is properly typed
      const indentsWithTransactions = data.map(indent => {
        const transaction = transactionsData?.find(t => t.indent_id === indent.id);
        
        // Ensure status is one of the allowed values or default to "Pending"
        const typedStatus = ['Completed', 'Cancelled', 'Pending'].includes(indent.status) 
          ? indent.status as 'Completed' | 'Cancelled' | 'Pending'
          : 'Pending';
          
        return {
          ...indent,
          status: typedStatus,
          transaction: transaction ? {
            ...transaction,
            source: transaction.source as 'mobile' | 'web'
          } : null,
          vehicle_number: indent.vehicles?.number || 'Unknown',
        };
      }) as Indent[];
      
      return indentsWithTransactions;
    }
    
    return data ? (data.map(indent => ({
      ...indent,
      // Ensure status is one of the allowed values
      status: ['Completed', 'Cancelled', 'Pending'].includes(indent.status) 
        ? indent.status as 'Completed' | 'Cancelled' | 'Pending'
        : 'Pending'
    })) as Indent[]) : [];
    
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
