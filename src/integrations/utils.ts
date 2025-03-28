
import { supabase } from '@/integrations/supabase/client';

/**
 * Get the current user's associated fuel pump ID
 * This is used to filter data by fuel pump
 */
export const getFuelPumpId = async (): Promise<string | null> => {
  try {
    // First check if we have the current user's session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      console.error('No authenticated user found');
      return null;
    }
    
    // Check if this user is a super admin
    const { data: superAdmin } = await supabase
      .from('super_admins')
      .select('id')
      .eq('id', session.user.id)
      .maybeSingle();
      
    if (superAdmin) {
      // Super admins can see all data, but we'll return null to bypass
      // the fuel pump filter in queries
      return null;
    }
    
    // Get the fuel pump ID associated with this user's email
    const { data: fuelPump, error } = await supabase
      .from('fuel_pumps')
      .select('id')
      .eq('email', session.user.email)
      .maybeSingle();
      
    if (error) {
      console.error('Error fetching fuel pump ID:', error);
      return null;
    }
    
    return fuelPump?.id || null;
  } catch (error) {
    console.error('Error getting fuel pump ID:', error);
    return null;
  }
};
