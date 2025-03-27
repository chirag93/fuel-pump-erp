
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
  fuel_pump_id?: string;
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
 * Fetch a fuel pump by email - improved to handle case insensitive search
 */
export const getFuelPumpByEmail = async (email: string): Promise<FuelPump | null> => {
  if (!email) return null;
  
  try {
    console.log(`Checking if fuel pump exists with email: ${email}`);
    
    // Use raw SQL to avoid TypeScript deep instantiation errors
    const { data, error } = await supabase
      .rpc('get_fuel_pump_by_email', { email_param: email.toLowerCase() });
    
    if (error) {
      console.error('Error checking for fuel pump by email:', error);
      throw error;
    }
    
    if (data && data.length > 0) {
      console.log(`Found existing fuel pump with email: ${email}`);
      return data[0] as FuelPump;
    }
    
    console.log(`No fuel pump found with email: ${email}`);
    return null;
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
    // Use raw SQL to avoid TypeScript deep instantiation errors
    const { data, error } = await supabase
      .rpc('get_fuel_pump_by_id', { id_param: id });
    
    if (error) {
      console.error('Error checking for fuel pump by ID:', error);
      throw error;
    }
    
    if (data && data.length > 0) {
      return data[0] as FuelPump;
    }
    
    return null;
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
    // Use raw SQL to avoid TypeScript deep instantiation errors
    const { data, error } = await supabase
      .rpc('get_fuel_settings_for_pump', { pump_id_param: fuelPumpId });
    
    if (error) {
      console.error('Error fetching fuel settings for pump:', error);
      throw error;
    }
    
    return data as FuelSettingsType[] || [];
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
    // Use raw SQL to avoid TypeScript deep instantiation errors
    const { data, error } = await supabase
      .rpc('get_pump_settings_for_fuel_pump', { pump_id_param: fuelPumpId });
    
    if (error) {
      console.error('Error fetching pump settings for fuel pump:', error);
      throw error;
    }
    
    return data as PumpSettingsType[] || [];
  } catch (error) {
    console.error('Error fetching pump settings for fuel pump:', error);
    return [];
  }
};
