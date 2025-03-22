
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface FuelPump {
  id: string;
  name: string;
  email: string;
  address?: string;
  contact_number?: string;
  status: string;
  created_at: string;
  created_by: string | null;
}

/**
 * Fetch all fuel pumps
 */
export const getAllFuelPumps = async (): Promise<FuelPump[]> => {
  try {
    const { data, error } = await supabase
      .from('fuel_pumps')
      .select('*');
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching fuel pumps:', error);
    toast({
      title: "Error",
      description: "Failed to load fuel pumps data",
      variant: "destructive"
    });
    return [];
  }
};

/**
 * Fetch a fuel pump by email
 */
export const getFuelPumpByEmail = async (email: string): Promise<FuelPump | null> => {
  try {
    const { data, error } = await supabase
      .from('fuel_pumps')
      .select('*')
      .eq('email', email)
      .single();
      
    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned - not an error for this function
        return null;
      }
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching fuel pump by email:', error);
    return null;
  }
};
