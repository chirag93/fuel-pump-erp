
import { supabase, Vehicle } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { getFuelPumpId } from './utils';

/**
 * Fetch all vehicles for a specific customer
 */
export const getVehiclesByCustomerId = async (customerId: string): Promise<Vehicle[]> => {
  try {
    console.log('API getVehiclesByCustomerId called for customer ID:', customerId);
    const fuelPumpId = await getFuelPumpId();
    
    if (!fuelPumpId) {
      console.log('No fuel pump ID available, cannot fetch vehicles');
      toast({
        title: "Authentication Required",
        description: "Please log in with a fuel pump account to view vehicles",
        variant: "destructive"
      });
      return [];
    }
    
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('customer_id', customerId)
      .eq('fuel_pump_id', fuelPumpId);
      
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
    const fuelPumpId = await getFuelPumpId();
    
    if (!fuelPumpId) {
      console.log('No fuel pump ID available, cannot create vehicle');
      toast({
        title: "Authentication Required",
        description: "Please log in with a fuel pump account to add vehicles",
        variant: "destructive"
      });
      return null;
    }
    
    const { data, error } = await supabase
      .from('vehicles')
      .insert([{ ...vehicleData, fuel_pump_id: fuelPumpId }])
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
    const fuelPumpId = await getFuelPumpId();
    
    if (!fuelPumpId) {
      console.log('No fuel pump ID available, cannot update vehicle');
      toast({
        title: "Authentication Required",
        description: "Please log in with a fuel pump account to update vehicles",
        variant: "destructive"
      });
      return null;
    }
    
    // Make sure we're only updating vehicles for the current fuel pump
    const { data, error } = await supabase
      .from('vehicles')
      .update(vehicleData)
      .eq('id', id)
      .eq('fuel_pump_id', fuelPumpId)
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
