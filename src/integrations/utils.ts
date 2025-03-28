
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
            
            // Verify this ID exists in database
            const { data: verifyPump } = await supabase
              .from('fuel_pumps')
              .select('id')
              .eq('id', parsedSession.user.fuelPumpId)
              .maybeSingle();
              
            if (verifyPump) {
              console.log(`getFuelPumpId: Verified local storage fuel pump ID exists: ${parsedSession.user.fuelPumpId}`);
              return parsedSession.user.fuelPumpId;
            }
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
    
    // First try using the RPC function
    const { data: fuelPumpData, error: rpcError } = await supabase
      .rpc('get_fuel_pump_by_email', { email_param: session.user.email.toLowerCase() });
      
    if (!rpcError && fuelPumpData && fuelPumpData.length > 0) {
      console.log(`getFuelPumpId: Found matching fuel pump for email via RPC: ${fuelPumpData[0].id}`);
      
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
      
      // Fallback to direct query if RPC fails
      const { data: directFuelPumpData, error: directError } = await supabase
        .from('fuel_pumps')
        .select('id, name')
        .ilike('email', session.user.email.toLowerCase())
        .maybeSingle();
        
      if (!directError && directFuelPumpData) {
        console.log(`getFuelPumpId: Found matching fuel pump via direct query: ${directFuelPumpData.id}`);
        
        // Update user metadata
        await supabase.auth.updateUser({
          data: { 
            fuelPumpId: directFuelPumpData.id,
            fuelPumpName: directFuelPumpData.name
          }
        });
        
        // Update localStorage
        if (storedSession) {
          try {
            const parsedSession = JSON.parse(storedSession);
            if (parsedSession.user) {
              parsedSession.user.fuelPumpId = directFuelPumpData.id;
              parsedSession.user.fuelPumpName = directFuelPumpData.name;
              localStorage.setItem('fuel_pro_session', JSON.stringify(parsedSession));
            }
          } catch (parseError) {
            console.error('Error updating stored session:', parseError);
          }
        }
        
        return directFuelPumpData.id;
      }
    }
    
    // Check if this user is in the staff table
    const { data: staffData } = await supabase
      .from('staff')
      .select('fuel_pump_id')
      .eq('email', session.user.email)
      .maybeSingle();
      
    if (staffData?.fuel_pump_id) {
      console.log(`getFuelPumpId: Found fuel pump ID via staff record: ${staffData.fuel_pump_id}`);
      
      // Get fuel pump name
      const { data: pumpData } = await supabase
        .from('fuel_pumps')
        .select('name')
        .eq('id', staffData.fuel_pump_id)
        .maybeSingle();
      
      // Update user metadata with this pump ID
      await supabase.auth.updateUser({
        data: { 
          fuelPumpId: staffData.fuel_pump_id,
          fuelPumpName: pumpData?.name
        }
      });
      
      // Update localStorage if needed
      if (storedSession) {
        try {
          const parsedSession = JSON.parse(storedSession);
          if (parsedSession.user) {
            parsedSession.user.fuelPumpId = staffData.fuel_pump_id;
            parsedSession.user.fuelPumpName = pumpData?.name;
            localStorage.setItem('fuel_pro_session', JSON.stringify(parsedSession));
          }
        } catch (parseError) {
          console.error('Error updating stored session:', parseError);
        }
      }
      
      return staffData.fuel_pump_id;
    }
    
    // Attempt to find any matching fuel pump based on email domain
    if (session.user.email) {
      const emailDomain = session.user.email.split('@')[1];
      
      if (emailDomain) {
        console.log(`getFuelPumpId: Trying to match email domain: ${emailDomain}`);
        
        const { data: domainPumps } = await supabase
          .from('fuel_pumps')
          .select('id, name, email')
          .ilike('email', `%@${emailDomain}`);
          
        if (domainPumps && domainPumps.length === 1) {
          console.log(`getFuelPumpId: Found single fuel pump matching domain: ${domainPumps[0].id}`);
          
          // Update user metadata
          await supabase.auth.updateUser({
            data: { 
              fuelPumpId: domainPumps[0].id,
              fuelPumpName: domainPumps[0].name
            }
          });
          
          return domainPumps[0].id;
        } else if (domainPumps && domainPumps.length > 1) {
          console.log(`getFuelPumpId: Found multiple pumps (${domainPumps.length}) matching domain, can't determine which one to use`);
        }
      }
    }
    
    // As a last resort, check if there is only one fuel pump in the system
    const { data: allPumps } = await supabase
      .from('fuel_pumps')
      .select('id, name')
      .limit(2);
      
    if (allPumps && allPumps.length === 1) {
      console.log(`getFuelPumpId: Only one fuel pump exists in the system: ${allPumps[0].id}`);
      
      // Update user metadata
      await supabase.auth.updateUser({
        data: { 
          fuelPumpId: allPumps[0].id,
          fuelPumpName: allPumps[0].name
        }
      });
      
      return allPumps[0].id;
    }
    
    console.log('getFuelPumpId: No fuel pump found for this user, returning null');
    return null;
  } catch (error) {
    console.error('Error getting fuel pump ID:', error);
    return null;
  }
};

/**
 * Force-link the current user to a specific fuel pump ID
 * This can be used for testing or for fixing data association issues
 */
export const forceLinkUserToFuelPump = async (fuelPumpId: string): Promise<boolean> => {
  try {
    console.log(`Forcing link to fuel pump ID: ${fuelPumpId}`);
    
    // Verify this ID exists in database
    const { data: fuelPump, error } = await supabase
      .from('fuel_pumps')
      .select('id, name')
      .eq('id', fuelPumpId)
      .maybeSingle();
      
    if (error || !fuelPump) {
      console.error('Invalid fuel pump ID, cannot link user');
      return false;
    }
    
    // Update user metadata with this pump ID
    const { error: updateError } = await supabase.auth.updateUser({
      data: { 
        fuelPumpId: fuelPumpId,
        fuelPumpName: fuelPump.name
      }
    });
    
    if (updateError) {
      console.error('Error updating user metadata:', updateError);
      return false;
    }
    
    // Update localStorage
    try {
      const storedSession = localStorage.getItem('fuel_pro_session');
      if (storedSession) {
        const parsedSession = JSON.parse(storedSession);
        if (parsedSession.user) {
          parsedSession.user.fuelPumpId = fuelPumpId;
          parsedSession.user.fuelPumpName = fuelPump.name;
          localStorage.setItem('fuel_pro_session', JSON.stringify(parsedSession));
        }
      }
    } catch (parseError) {
      console.error('Error updating stored session:', parseError);
    }
    
    toast({
      title: "Success",
      description: `Your account is now linked to fuel pump: ${fuelPump.name}`,
    });
    
    return true;
  } catch (error) {
    console.error('Error linking user to fuel pump:', error);
    toast({
      title: "Error",
      description: "Failed to link your account to the fuel pump",
      variant: "destructive"
    });
    return false;
  }
};
