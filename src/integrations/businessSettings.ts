
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { getFuelPumpId } from './utils';

export interface BusinessSettings {
  id?: string;
  gst_number: string;
  business_name: string;
  address: string | null;
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
    if (!settings.fuel_pump_id) {
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
      
      // Ensure we're setting the correct fuel_pump_id
      settings.fuel_pump_id = fuelPumpId;
    }
    
    console.log('Updating business settings for fuel pump:', settings.fuel_pump_id, 'with data:', settings);
    
    // Check if a record already exists for this fuel pump
    const { data: existingData, error: existingError } = await supabase
      .from('business_settings')
      .select('id')
      .eq('fuel_pump_id', settings.fuel_pump_id)
      .maybeSingle();
      
    if (existingError && existingError.code !== 'PGRST116') {
      // Only throw if it's not a "no rows returned" error
      console.error('Supabase error checking existing settings:', existingError);
      throw existingError;
    }
    
    let result;
    
    // Use upsert to handle both insert and update cases
    result = await supabase
      .from('business_settings')
      .upsert({
        id: existingData?.id || undefined,
        gst_number: settings.gst_number,
        business_name: settings.business_name,
        address: settings.address,
        fuel_pump_id: settings.fuel_pump_id // Explicitly set fuel_pump_id to ensure RLS works
      }, { 
        onConflict: 'fuel_pump_id' 
      });
    
    if (result.error) {
      console.error('Supabase error updating business settings:', result.error);
      
      // Provide more detailed error information for debugging
      if (result.error.message.includes('violates row-level security policy')) {
        console.error('RLS policy violation details:', {
          fuelPumpId: settings.fuel_pump_id,
          errorCode: result.error.code,
          errorDetails: result.error.details,
          userMetadata: await getCurrentUserMetadata()
        });
      }
      
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
    let errorMessage = "Failed to update business settings. Please try again.";
    
    // Add more detailed error message for RLS violations
    if (error instanceof Error && error.message.includes('violates row-level security policy')) {
      errorMessage = "Permission denied: You don't have access to update these settings. Please ensure you're logged in with the correct account.";
      
      // Log additional debug info
      const { data } = await supabase.auth.getSession();
      console.error('User session during RLS violation:', {
        hasSession: !!data.session,
        userId: data.session?.user?.id,
        userMetadata: data.session?.user?.user_metadata
      });
    }
    
    toast({
      title: "Error",
      description: errorMessage,
      variant: "destructive"
    });
    return false;
  }
};

// Helper function to get current user metadata for debugging
const getCurrentUserMetadata = async () => {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.user?.user_metadata || null;
  } catch (error) {
    console.error('Error getting user metadata:', error);
    return null;
  }
};
