
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
