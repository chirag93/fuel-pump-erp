
import { supabase, IndentBooklet } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

/**
 * Fetch all indent booklets for a specific customer
 */
export const getIndentBookletsByCustomerId = async (customerId: string): Promise<IndentBooklet[]> => {
  try {
    console.log('API getIndentBookletsByCustomerId called for customer ID:', customerId);
    const { data, error } = await supabase
      .from('indent_booklets')
      .select('*')
      .eq('customer_id', customerId);
      
    if (error) throw error;
    
    // Transform the data to ensure status is one of the allowed types
    const typedBooklets: IndentBooklet[] = (data || []).map((booklet: any) => ({
      ...booklet,
      status: booklet.status as 'Active' | 'Completed' | 'Cancelled'
    }));
    
    return typedBooklets;
  } catch (error) {
    console.error('Error fetching indent booklets:', error);
    toast({
      title: "Error",
      description: "Failed to load indent booklets data",
      variant: "destructive"
    });
    return [];
  }
};

/**
 * Create a new indent booklet
 */
export const createIndentBooklet = async (bookletData: Omit<IndentBooklet, 'id' | 'created_at'>): Promise<IndentBooklet | null> => {
  try {
    const { data, error } = await supabase
      .from('indent_booklets')
      .insert([bookletData])
      .select();
      
    if (error) throw error;
    
    if (data) {
      toast({
        title: "Success",
        description: "Indent booklet issued successfully"
      });
      
      // Transform to ensure status is of the correct type
      const booklet: IndentBooklet = {
        ...data[0],
        status: data[0].status as 'Active' | 'Completed' | 'Cancelled'
      };
      
      return booklet;
    }
    
    return null;
  } catch (error) {
    console.error('Error creating indent booklet:', error);
    toast({
      title: "Error",
      description: "Failed to issue indent booklet",
      variant: "destructive"
    });
    return null;
  }
};
