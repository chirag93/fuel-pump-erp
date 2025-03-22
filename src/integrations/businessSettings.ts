
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface BusinessSettings {
  id?: string;
  gst_number: string;
  business_name: string;
  address: string;
}

/**
 * Fetch business settings
 */
export const getBusinessSettings = async (): Promise<BusinessSettings | null> => {
  try {
    const { data, error } = await supabase
      .from('business_settings')
      .select('*')
      .maybeSingle();
      
    if (error) throw error;
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
    if (!settings.gst_number) {
      toast({
        title: "Missing information",
        description: "Please enter GST number",
        variant: "destructive"
      });
      return false;
    }
    
    const { data: existingData, error: existingError } = await supabase
      .from('business_settings')
      .select('*');
      
    if (existingError) throw existingError;
    
    if (existingData && existingData.length > 0) {
      const { error } = await supabase
        .from('business_settings')
        .update({
          gst_number: settings.gst_number,
          business_name: settings.business_name,
          address: settings.address
        })
        .eq('id', existingData[0].id);
        
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('business_settings')
        .insert([{
          gst_number: settings.gst_number,
          business_name: settings.business_name,
          address: settings.address
        }]);
        
      if (error) throw error;
    }
    
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
