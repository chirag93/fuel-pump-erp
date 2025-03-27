
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
  fuel_pump_id?: string; // Adding this field for association
}

// Interface for pump settings
export interface PumpSettingsType {
  id: string;
  pump_number: string;
  nozzle_count: number;
  fuel_types: string[];
  created_at?: string;
  fuel_pump_id?: string; // Adding this field for association
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
 * Fetch a fuel pump by email - improved to handle case insensitive search
 */
export const getFuelPumpByEmail = async (email: string): Promise<FuelPump | null> => {
  if (!email) return null;
  
  try {
    console.log(`Checking if fuel pump exists with email: ${email}`);
    
    // Fix: Using explicit typing to avoid deep type instantiation
    const { data, error } = await supabase
      .from('fuel_pumps')
      .select('*')
      .ilike('email', email)
      .single();
    
    if (error) {
      // If no match is found, return null instead of throwing an error
      if (error.code === 'PGRST116') {
        console.log(`No fuel pump found with email: ${email}`);
        return null;
      }
      console.error('Error checking for fuel pump by email:', error);
      throw error;
    }
    
    if (data) {
      console.log(`Found existing fuel pump with email: ${email}`);
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
    // Fix: Using explicit typing to avoid deep type instantiation
    const { data, error } = await supabase
      .from('fuel_pumps')
      .select('*')
      .eq('id', id)
      .single();
      
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
    // Using the fuel_pump_id column to fetch related settings
    const { data, error } = await supabase
      .from('fuel_settings')
      .select('id, fuel_type, current_price, tank_capacity, current_level, updated_at')
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
    // Using the fuel_pump_id column to fetch related settings
    const { data, error } = await supabase
      .from('pump_settings')
      .select('id, pump_number, nozzle_count, fuel_types, created_at')
      .eq('fuel_pump_id', fuelPumpId);
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching pump settings for fuel pump:', error);
    return [];
  }
};
