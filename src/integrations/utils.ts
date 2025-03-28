
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
      return await getFallbackFuelPumpId();
    }
    
    console.log(`Getting fuel pump ID for user: ${session.user.email}`);
    
    // Check if this user is a super admin
    const { data: superAdmin } = await supabase
      .from('super_admins')
      .select('id')
      .eq('id', session.user.id)
      .maybeSingle();
      
    if (superAdmin) {
      console.log('User is a super admin, bypassing fuel pump filter');
      // For testing purposes, let's get the first fuel pump for super admins
      // This ensures they can see some data
      const { data: firstPump, error: firstPumpError } = await supabase
        .from('fuel_pumps')
        .select('id')
        .limit(1)
        .single();
        
      if (!firstPumpError && firstPump) {
        console.log(`Super admin: Using first available fuel pump: ${firstPump.id}`);
        return firstPump.id;
      }
      
      return await getFallbackFuelPumpId();
    }
    
    // Get the fuel pump ID associated with this user's email
    const { data: fuelPump, error } = await supabase
      .from('fuel_pumps')
      .select('id')
      .eq('email', session.user.email)
      .maybeSingle();
      
    if (error) {
      console.error('Error fetching fuel pump ID:', error);
      return await getFallbackFuelPumpId();
    }
    
    if (fuelPump?.id) {
      console.log(`Found fuel pump ID: ${fuelPump.id}`);
      return fuelPump.id;
    } else {
      console.log(`No fuel pump found for email: ${session.user.email}`);
      return await getFallbackFuelPumpId();
    }
  } catch (error) {
    console.error('Error getting fuel pump ID:', error);
    return await getFallbackFuelPumpId();
  }
};

/**
 * Fallback function to get the first available fuel pump ID
 * This is used when the user doesn't have a fuel pump assigned
 */
const getFallbackFuelPumpId = async (): Promise<string | null> => {
  try {
    console.log('Using fallback method to get a fuel pump ID');
    
    // Try to get the first fuel pump as fallback
    const { data: firstPump, error } = await supabase
      .from('fuel_pumps')
      .select('id')
      .limit(1)
      .single();
      
    if (error) {
      console.error('Error fetching fallback fuel pump ID:', error);
      return null;
    }
    
    if (firstPump?.id) {
      console.log(`Fallback: Using first available fuel pump: ${firstPump.id}`);
      return firstPump.id;
    }
    
    console.log('No fuel pumps found in the database');
    return null;
  } catch (error) {
    console.error('Error in fallback fuel pump ID retrieval:', error);
    return null;
  }
};
