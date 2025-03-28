
import { supabase, Indent } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

/**
 * Fetch all indents for a specific customer
 */
export const getIndentsByCustomerId = async (customerId: string): Promise<Indent[]> => {
  try {
    console.log('API getIndentsByCustomerId called for customer ID:', customerId);
    const { data, error } = await supabase
      .from('indents')
      .select(`
        *,
        vehicles:vehicle_id (number)
      `)
      .eq('customer_id', customerId);
      
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
        
        const { data: transactionsData, error: transactionsError } = await supabase
          .from('transactions')
          .select('*')
          .in('indent_id', indentIds);
          
        if (transactionsError) {
          console.error('Error fetching transactions for indents:', transactionsError);
        } else if (transactionsData) {
          // Map transactions to their respective indents
          processedIndents.forEach(indent => {
            indent.transaction = transactionsData.find(tx => tx.indent_id === indent.id) || null;
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
    const { data, error } = await supabase
      .from('indents')
      .select(`
        *,
        vehicles:vehicle_id (number)
      `)
      .eq('booklet_id', bookletId);
      
    if (error) throw error;
    
    if (data && data.length > 0) {
      console.log(`Found ${data.length} indents for booklet ${bookletId}`);
      
      // Get all indent IDs
      const indentIds = data.map(indent => indent.id);
      
      // Fetch transactions related to these indents
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .in('indent_id', indentIds);
        
      if (transactionsError) throw transactionsError;
      
      // Map transactions to the indents
      const indentsWithTransactions = data.map(indent => {
        const transaction = transactionsData?.find(t => t.indent_id === indent.id);
        return {
          ...indent,
          transaction,
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
