
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
        vehicles:vehicle_id (number),
        transactions:id (*)
      `)
      .eq('customer_id', customerId);
      
    if (error) throw error;
    
    if (data) {
      console.log(`Found ${data.length} indents`);
      
      // Process data to include vehicle number if needed
      const processedIndents = data.map((indent: any) => ({
        ...indent,
        vehicle_number: indent.vehicles?.number || 'Unknown',
        transaction: indent.transactions?.[0] || null,
      }));
      
      return processedIndents as Indent[];
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
      });
      
      return indentsWithTransactions as Indent[];
    }
    
    return data || [];
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
