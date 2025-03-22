
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

// Interface for fuel settings
export interface FuelSettingsType {
  id: string;
  fuel_type: string;
  current_price: number;
  tank_capacity: number;
  current_level: number;
  updated_at?: string;
}

// Interface for pump settings
export interface PumpSettingsType {
  id: string;
  pump_number: string;
  nozzle_count: number;
  fuel_types: string[];
  created_at?: string;
  fuel_pump_id?: string;
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
      .maybeSingle();
      
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

/**
 * Fetch a fuel pump by ID
 */
export const getFuelPumpById = async (id: string): Promise<FuelPump | null> => {
  try {
    const { data, error } = await supabase
      .from('fuel_pumps')
      .select('*')
      .eq('id', id)
      .maybeSingle();
      
    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching fuel pump by ID:', error);
    return null;
  }
};

/**
 * Get fuel settings for a specific fuel pump
 */
export const getFuelSettingsForPump = async (fuelPumpId: string): Promise<FuelSettingsType[]> => {
  try {
    const { data, error } = await supabase
      .from('fuel_settings')
      .select('*')
      .eq('fuel_pump_id', fuelPumpId);
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching fuel settings for pump:', error);
    return [];
  }
};

/**
 * Get pump settings for a specific fuel pump
 */
export const getPumpSettingsForFuelPump = async (fuelPumpId: string): Promise<PumpSettingsType[]> => {
  try {
    const { data, error } = await supabase
      .from('pump_settings')
      .select('*')
      .eq('fuel_pump_id', fuelPumpId);
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching pump settings for fuel pump:', error);
    return [];
  }
};
