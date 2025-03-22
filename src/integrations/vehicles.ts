
import { supabase, Vehicle } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

/**
 * Fetch all vehicles for a specific customer
 */
export const getVehiclesByCustomerId = async (customerId: string): Promise<Vehicle[]> => {
  try {
    console.log('API getVehiclesByCustomerId called for customer ID:', customerId);
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('customer_id', customerId);
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    toast({
      title: "Error",
      description: "Failed to load vehicles data",
      variant: "destructive"
    });
    return [];
  }
};

/**
 * Create a new vehicle
 */
export const createVehicle = async (vehicleData: Omit<Vehicle, 'id' | 'created_at'>): Promise<Vehicle | null> => {
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .insert([vehicleData])
      .select()
      .single();
      
    if (error) throw error;
    
    toast({
      title: "Success",
      description: "Vehicle added successfully"
    });
    
    return data as Vehicle;
  } catch (error) {
    console.error('Error creating vehicle:', error);
    toast({
      title: "Error",
      description: "Failed to add vehicle",
      variant: "destructive"
    });
    return null;
  }
};

/**
 * Update an existing vehicle
 */
export const updateVehicle = async (id: string, vehicleData: Partial<Vehicle>): Promise<Vehicle | null> => {
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .update(vehicleData)
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    
    toast({
      title: "Success",
      description: "Vehicle updated successfully"
    });
    
    return data as Vehicle;
  } catch (error) {
    console.error('Error updating vehicle:', error);
    toast({
      title: "Error",
      description: "Failed to update vehicle",
      variant: "destructive"
    });
    return null;
  }
};
