
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { getFuelPumpId } from './utils';

export interface BusinessSettings {
  id?: string;
  gst_number: string;
  business_name: string;
  address: string;
  fuel_pump_id?: string;
}

/**
 * Fetch business settings
 */
export const getBusinessSettings = async (): Promise<BusinessSettings | null> => {
  try {
    const fuelPumpId = await getFuelPumpId();
    
    if (!fuelPumpId) {
      console.log('No fuel pump ID available, cannot fetch business settings');
      toast({
        title: "Authentication Required",
        description: "Please log in with a fuel pump account to view business settings",
        variant: "destructive"
      });
      return null;
    }
    
    console.log('Fetching business settings for fuel pump:', fuelPumpId);
    
    const { data, error } = await supabase
      .from('business_settings')
      .select('*')
      .eq('fuel_pump_id', fuelPumpId)
      .maybeSingle();
      
    if (error) {
      console.error('Supabase error fetching business settings:', error);
      throw error;
    }
    
    console.log('Retrieved business settings:', data);
    return data as BusinessSettings;
  } catch (error) {
    console.error('Error fetching business settings:', error);
    toast({
      title: "Error",
      description: "Failed to load business settings. Please try again.",
      variant: "destructive"
    });
    return null;
  }
};

/**
 * Create or update business settings
 */
export const updateBusinessSettings = async (settings: BusinessSettings): Promise<boolean> => {
  try {
    const fuelPumpId = await getFuelPumpId();
    
    if (!fuelPumpId) {
      console.log('No fuel pump ID available, cannot update business settings');
      toast({
        title: "Authentication Required",
        description: "Please log in with a fuel pump account to update business settings",
        variant: "destructive"
      });
      return false;
    }
    
    console.log('Updating business settings for fuel pump:', fuelPumpId, 'with data:', settings);
    
    // Ensure we're setting the correct fuel_pump_id
    const settingsToUpdate = {
      ...settings,
      fuel_pump_id: fuelPumpId
    };
    
    const { data: existingData, error: existingError } = await supabase
      .from('business_settings')
      .select('*')
      .eq('fuel_pump_id', fuelPumpId)
      .maybeSingle();
      
    if (existingError) {
      console.error('Supabase error checking existing settings:', existingError);
      throw existingError;
    }
    
    let result;
    
    if (existingData) {
      console.log('Updating existing business settings record with ID:', existingData.id);
      result = await supabase
        .from('business_settings')
        .update({
          gst_number: settingsToUpdate.gst_number,
          business_name: settingsToUpdate.business_name,
          address: settingsToUpdate.address
        })
        .eq('id', existingData.id);
    } else {
      console.log('Creating new business settings record');
      result = await supabase
        .from('business_settings')
        .insert([{
          gst_number: settingsToUpdate.gst_number,
          business_name: settingsToUpdate.business_name,
          address: settingsToUpdate.address,
          fuel_pump_id: fuelPumpId
        }]);
    }
    
    if (result.error) {
      console.error('Supabase error updating business settings:', result.error);
      throw result.error;
    }
    
    console.log('Business settings update successful');
    
    toast({
      title: "Success",
      description: "Business settings updated successfully"
    });
    
    return true;
  } catch (error) {
    console.error('Error updating business settings:', error);
    toast({
      title: "Error",
      description: "Failed to update business settings. Please try again.",
      variant: "destructive"
    });
    return false;
  }
};
