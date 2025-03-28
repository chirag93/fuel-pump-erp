
import { supabase, IndentBooklet } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { getFuelPumpId } from '@/integrations/utils';

/**
 * Fetch all indent booklets for a specific customer
 */
export const getIndentBookletsByCustomerId = async (customerId: string): Promise<IndentBooklet[]> => {
  try {
    console.log('API getIndentBookletsByCustomerId called for customer ID:', customerId);
    
    // Get the fuel pump ID
    const fuelPumpId = await getFuelPumpId();
    console.log('Using fuel pump ID for booklets query:', fuelPumpId || 'none');
    
    if (!fuelPumpId) {
      console.log('No fuel pump ID available for filtering booklets');
      toast({
        title: "Authentication Required",
        description: "Please log in with a fuel pump account to view booklets",
        variant: "destructive"
      });
      return [];
    }
    
    console.log('Starting Supabase query to fetch indent booklets...');
    
    let query = supabase
      .from('indent_booklets')
      .select('*')
      .eq('customer_id', customerId)
      .eq('fuel_pump_id', fuelPumpId);
    
    console.log('Executing query...');
    const { data, error } = await query;
      
    if (error) {
      console.error('Error from Supabase while fetching indent booklets:', error);
      throw error;
    }
    
    console.log('Raw booklets data returned:', data);
    
    // Transform the data to ensure status is one of the allowed types
    const typedBooklets: IndentBooklet[] = (data || []).map((booklet: any) => ({
      ...booklet,
      status: booklet.status as 'Active' | 'Completed' | 'Cancelled'
    }));
    
    console.log(`Found ${typedBooklets.length} indent booklets:`, typedBooklets);
    
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
    // Get the fuel pump ID
    const fuelPumpId = await getFuelPumpId();
    console.log('Using fuel pump ID for creating booklet:', fuelPumpId || 'none');
    
    if (!fuelPumpId) {
      console.log('No fuel pump ID available for creating booklet');
      toast({
        title: "Authentication Required",
        description: "Please log in with a fuel pump account to create booklets",
        variant: "destructive"
      });
      return null;
    }
    
    // Include the fuel pump ID in the data
    const dataWithFuelPumpId = {
      ...bookletData,
      fuel_pump_id: fuelPumpId
    };
    
    console.log('Creating indent booklet with data:', dataWithFuelPumpId);
    
    const { data, error } = await supabase
      .from('indent_booklets')
      .insert([dataWithFuelPumpId])
      .select();
      
    if (error) {
      console.error('Error from Supabase while creating indent booklet:', error);
      throw error;
    }
    
    if (data && data.length > 0) {
      console.log('Booklet created successfully:', data[0]);
      
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
    } else {
      console.error('No data returned when creating indent booklet');
      throw new Error('No data returned from Supabase');
    }
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
