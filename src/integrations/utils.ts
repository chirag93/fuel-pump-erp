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

/**
 * Fallback function to get the first available fuel pump ID
 * This is used when the user doesn't have a fuel pump assigned
 */
const getFallbackFuelPumpId = async (): Promise<string | null> => {
  try {
    console.log('Using fallback method to get a fuel pump ID');
    
    // First try the specific ID we're looking for
    const specificId = '2c762f9c-f89b-4084-9ebe-b6902fdf4311';
    
    console.log(`Checking if specific fuel pump exists: ${specificId}`);
    const { data: specificPump, error: specificError } = await supabase
      .from('fuel_pumps')
      .select('id')
      .eq('id', specificId)
      .maybeSingle();
      
    if (!specificError && specificPump) {
      console.log(`Found specific fuel pump: ${specificPump.id}`);
      return specificPump.id;
    }
    
    // Try to get the first fuel pump as fallback
    const { data: firstPump, error } = await supabase
      .from('fuel_pumps')
      .select('id')
      .limit(1)
      .maybeSingle();
      
    if (error) {
      console.error('Error fetching fallback fuel pump ID:', error);
      return specificId; // Return the specific ID even if query fails
    }
    
    if (firstPump?.id) {
      console.log(`Fallback: Using first available fuel pump: ${firstPump.id}`);
      return firstPump.id;
    }
    
    console.log('No fuel pumps found in the database, returning hardcoded ID');
    return specificId;
  } catch (error) {
    console.error('Error in fallback fuel pump ID retrieval:', error);
    return '2c762f9c-f89b-4084-9ebe-b6902fdf4311'; // Return the specific ID as ultimate fallback
  }
};

/**
 * Create a default fuel pump if none exists
 * This ensures that there is always at least one fuel pump to work with
 */
const createDefaultFuelPumpIfNeeded = async (userEmail: string): Promise<string | null> => {
  try {
    // First check if any fuel pumps exist
    const { data: existingPumps, error: checkError } = await supabase
      .from('fuel_pumps')
      .select('id')
      .limit(1)
      .maybeSingle();
      
    if (!checkError && existingPumps?.id) {
      // If a fuel pump exists, return its ID
      console.log(`Using existing fuel pump: ${existingPumps.id}`);
      return existingPumps.id;
    }
    
    console.log('No fuel pumps found, attempting to create a default one');
    
    // Create a default fuel pump
    const { data: newPump, error: createError } = await supabase
      .from('fuel_pumps')
      .insert({
        name: 'Default Fuel Pump',
        email: userEmail,
        address: '123 Default St',
        contact_number: '555-1234',
        status: 'active'
      })
      .select();
      
    if (createError) {
      console.error('Error creating default fuel pump:', createError);
      
      // If we can't create due to RLS, try using direct method without RPC
      // We won't use RPC since the function doesn't exist in the database
      try {
        // Attempt to create directly again with a different approach
        const { data: secondAttempt, error: secondError } = await supabase
          .from('fuel_pumps')
          .insert([{
            name: 'Default Fuel Pump (emergency)',
            email: userEmail,
            address: '123 Default St',
            contact_number: '555-1234',
            status: 'active'
          }])
          .select();
          
        if (secondError) throw secondError;
        
        if (secondAttempt && secondAttempt.length > 0) {
          const pumpId = secondAttempt[0].id as string;
          console.log(`Created default fuel pump via second attempt: ${pumpId}`);
          
          // Create default fuel settings
          await createDefaultFuelSettings(pumpId);
          
          return pumpId;
        }
      } catch (secondIssue) {
        console.error('Failed to create fuel pump via second attempt:', secondIssue);
      }
      
      // If still no success, try one more fallback
      return await getFallbackFuelPumpId();
    }
    
    if (newPump && newPump.length > 0) {
      const pumpId = newPump[0].id as string;
      console.log(`Created default fuel pump with ID: ${pumpId}`);
      
      // Create default fuel settings
      await createDefaultFuelSettings(pumpId);
      
      return pumpId;
    }
    
    return null;
  } catch (error) {
    console.error('Error in createDefaultFuelPumpIfNeeded:', error);
    return null;
  }
};

/**
 * Create default fuel settings for a new fuel pump
 */
const createDefaultFuelSettings = async (fuelPumpId: string): Promise<void> => {
  try {
    const fuelTypes = ['Petrol', 'Diesel'];
    
    for (const type of fuelTypes) {
      const { error } = await supabase
        .from('fuel_settings')
        .insert({
          fuel_pump_id: fuelPumpId,
          fuel_type: type,
          tank_capacity: type === 'Petrol' ? 20000 : 15000,
          current_level: type === 'Petrol' ? 15000 : 10000,
          current_price: type === 'Petrol' ? 102.5 : 89.75
        });
        
      if (error) {
        console.error(`Error creating default fuel settings for ${type}:`, error);
      }
    }
    
    // Create default pump settings
    const { error: pumpError } = await supabase
      .from('pump_settings')
      .insert([
        {
          fuel_pump_id: fuelPumpId,
          pump_number: 'P001',
          fuel_types: ['Petrol'],
          nozzle_count: 1
        },
        {
          fuel_pump_id: fuelPumpId,
          pump_number: 'P002',
          fuel_types: ['Diesel'],
          nozzle_count: 1
        }
      ]);
      
    if (pumpError) {
      console.error('Error creating default pump settings:', pumpError);
    }
  } catch (error) {
    console.error('Error in createDefaultFuelSettings:', error);
  }
};
