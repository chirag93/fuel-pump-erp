
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

/**
 * Get the current user's associated fuel pump ID
 * This is used to filter data by fuel pump
 */
export const getFuelPumpId = async (): Promise<string | null> => {
  try {
    console.log('Starting getFuelPumpId...');
    
    // First check if we have the current user's session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      console.warn('getFuelPumpId: No authenticated user found');
      
      // Try to get from localStorage as fallback
      const storedSession = localStorage.getItem('fuel_pro_session');
      if (storedSession) {
        try {
          const parsedSession = JSON.parse(storedSession);
          if (parsedSession.user && parsedSession.user.fuelPumpId) {
            console.log(`getFuelPumpId: Found fuel pump ID in localStorage: ${parsedSession.user.fuelPumpId}`);
            return parsedSession.user.fuelPumpId;
          }
        } catch (parseError) {
          console.error('Error parsing stored session:', parseError);
        }
      }
      
      console.log('getFuelPumpId: No fuel pump ID available, returning null');
      return null;
    }
    
    console.log(`getFuelPumpId: Session available for user: ${session.user.email}`);
    
    // Check if this user is a super admin
    const { data: superAdmin } = await supabase
      .from('super_admins')
      .select('id')
      .eq('id', session.user.id)
      .maybeSingle();
      
    if (superAdmin) {
      console.log('getFuelPumpId: User is a super admin - they can access any fuel pump data');
      return null; // Super admins can access any fuel pump's data
    }
    
    // Try to get the fuelPumpId from user metadata first (most reliable)
    if (session.user.user_metadata && session.user.user_metadata.fuelPumpId) {
      const metadataFuelPumpId = session.user.user_metadata.fuelPumpId;
      console.log(`getFuelPumpId: Found fuel pump ID in user metadata: ${metadataFuelPumpId}`);
      
      // Verify this ID exists in database
      const { data: verifyPump } = await supabase
        .from('fuel_pumps')
        .select('id')
        .eq('id', metadataFuelPumpId)
        .maybeSingle();
        
      if (verifyPump) {
        console.log(`getFuelPumpId: Verified fuel pump ID exists: ${metadataFuelPumpId}`);
        return metadataFuelPumpId;
      } else {
        console.warn(`getFuelPumpId: Fuel pump ID from metadata not found in database: ${metadataFuelPumpId}`);
      }
    }
    
    // Check localStorage for stored fuel pump ID
    const storedSession = localStorage.getItem('fuel_pro_session');
    if (storedSession) {
      try {
        const parsedSession = JSON.parse(storedSession);
        if (parsedSession.user && parsedSession.user.fuelPumpId) {
          const localId = parsedSession.user.fuelPumpId;
          console.log(`getFuelPumpId: Found fuel pump ID in localStorage: ${localId}`);
          
          // Verify this ID exists in database
          const { data: verifyPump } = await supabase
            .from('fuel_pumps')
            .select('id')
            .eq('id', localId)
            .maybeSingle();
            
          if (verifyPump) {
            console.log(`getFuelPumpId: Verified local storage fuel pump ID exists: ${localId}`);
            return localId;
          }
        }
      } catch (parseError) {
        console.error('Error parsing stored session:', parseError);
      }
    }
    
    // Check if the user email matches a fuel pump email
    console.log(`getFuelPumpId: Checking if user email matches a fuel pump: ${session.user.email}`);
    const { data: fuelPumpData, error: rpcError } = await supabase
      .rpc('get_fuel_pump_by_email', { email_param: session.user.email.toLowerCase() });
      
    if (!rpcError && fuelPumpData && fuelPumpData.length > 0) {
      console.log(`getFuelPumpId: Found matching fuel pump for email: ${fuelPumpData[0].id}`);
      
      // Update user metadata with this pump ID for future use
      await supabase.auth.updateUser({
        data: { 
          fuelPumpId: fuelPumpData[0].id,
          fuelPumpName: fuelPumpData[0].name
        }
      });
      
      // Update localStorage session
      if (storedSession) {
        try {
          const parsedSession = JSON.parse(storedSession);
          if (parsedSession.user) {
            parsedSession.user.fuelPumpId = fuelPumpData[0].id;
            parsedSession.user.fuelPumpName = fuelPumpData[0].name;
            localStorage.setItem('fuel_pro_session', JSON.stringify(parsedSession));
          }
        } catch (parseError) {
          console.error('Error updating stored session:', parseError);
        }
      }
      
      return fuelPumpData[0].id;
    }
    
    if (rpcError) {
      console.error('getFuelPumpId: Error using RPC function:', rpcError);
    }
    
    // Check if this user is in the staff table
    const { data: staffData } = await supabase
      .from('staff')
      .select('fuel_pump_id')
      .eq('email', session.user.email)
      .maybeSingle();
      
    if (staffData?.fuel_pump_id) {
      console.log(`getFuelPumpId: Found fuel pump ID via staff record: ${staffData.fuel_pump_id}`);
      
      // Update user metadata with this pump ID
      await supabase.auth.updateUser({
        data: { 
          fuelPumpId: staffData.fuel_pump_id
        }
      });
      
      return staffData.fuel_pump_id;
    }
    
    console.log('getFuelPumpId: No fuel pump found for this user, returning null');
    return null;
  } catch (error) {
    console.error('Error getting fuel pump ID:', error);
    return null;
  }
};
