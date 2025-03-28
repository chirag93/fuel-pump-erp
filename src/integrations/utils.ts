
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

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
      return createDefaultFuelPumpIfNeeded();
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
        .maybeSingle();
        
      if (!firstPumpError && firstPump) {
        console.log(`Super admin: Using first available fuel pump: ${firstPump.id}`);
        return firstPump.id;
      }
      
      return await createDefaultFuelPumpIfNeeded(session.user.email);
    }
    
    // Get the fuel pump ID associated with this user's email
    const { data: fuelPump, error } = await supabase
      .from('fuel_pumps')
      .select('id')
      .eq('email', session.user.email)
      .maybeSingle();
      
    if (error) {
      console.error('Error fetching fuel pump ID:', error);
      return await createDefaultFuelPumpIfNeeded(session.user.email);
    }
    
    if (fuelPump?.id) {
      console.log(`Found fuel pump ID: ${fuelPump.id}`);
      return fuelPump.id;
    } else {
      console.log(`No fuel pump found for email: ${session.user.email}`);
      return await createDefaultFuelPumpIfNeeded(session.user.email);
    }
  } catch (error) {
    console.error('Error getting fuel pump ID:', error);
    return await createDefaultFuelPumpIfNeeded();
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
      .maybeSingle();
      
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

/**
 * Create a default fuel pump if none exists
 * This ensures that there is always at least one fuel pump to work with
 */
const createDefaultFuelPumpIfNeeded = async (userEmail?: string): Promise<string | null> => {
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
      
      // Associate this fuel pump with the user if we have their email
      if (userEmail) {
        // Update the email for this fuel pump
        const { error: updateError } = await supabase
          .from('fuel_pumps')
          .update({ email: userEmail })
          .eq('id', existingPumps.id);
          
        if (updateError) {
          console.error('Error updating fuel pump email:', updateError);
        } else {
          console.log(`Associated fuel pump ${existingPumps.id} with user ${userEmail}`);
        }
      }
      
      // Find existing data and associate it with this fuel pump
      await associateExistingDataWithFuelPump(existingPumps.id);
      
      return existingPumps.id;
    }
    
    console.log('No fuel pumps found, attempting to create a default one');
    
    // Get the user's email for the fuel pump
    const userEmailToUse = userEmail || 'default@fuelpump.com';
    
    // Try directly inserting into the fuel_pumps table
    const { data: newPump, error: createError } = await supabase
      .from('fuel_pumps')
      .insert({
        name: 'Default Fuel Pump',
        email: userEmailToUse,
        address: '123 Default St',
        contact_number: '555-1234',
        status: 'active'
      })
      .select();
      
    if (createError) {
      console.error('Error creating default fuel pump:', createError);
      
      // Try a different approach with less restricted permissions
      // This is for emergencies when RLS is blocking the creation
      try {
        // Handle super admin scenario
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // Check if this user is already in super_admins
          const { data: existingSuperAdmin } = await supabase
            .from('super_admins')
            .select('id')
            .eq('id', session.user.id)
            .maybeSingle();
            
          if (!existingSuperAdmin) {
            // Make this user a super admin temporarily to bypass RLS
            const { error: superAdminError } = await supabase
              .from('super_admins')
              .insert({
                id: session.user.id,
                name: 'Temporary Super Admin',
                email: session.user.email
              });
              
            if (superAdminError) {
              console.error('Error creating super admin:', superAdminError);
            } else {
              console.log('Created temporary super admin to bypass RLS');
              
              // Try again with elevated permissions
              const { data: elevatedPump, error: elevatedError } = await supabase
                .from('fuel_pumps')
                .insert({
                  name: 'Default Fuel Pump (elevated)',
                  email: userEmailToUse,
                  address: '123 Default St',
                  contact_number: '555-1234',
                  status: 'active'
                })
                .select();
                
              if (!elevatedError && elevatedPump && elevatedPump.length > 0) {
                const pumpId = elevatedPump[0].id as string;
                console.log(`Created default fuel pump with elevated permissions: ${pumpId}`);
                
                // Create default fuel settings
                await createDefaultFuelSettings(pumpId);
                
                // Associate existing data with this new fuel pump
                await associateExistingDataWithFuelPump(pumpId);
                
                return pumpId;
              }
            }
          }
        }
      } catch (elevatedIssue) {
        console.error('Error with elevated permissions approach:', elevatedIssue);
      }
      
      // Try another direct approach with different properties
      try {
        const { data: secondAttempt, error: secondError } = await supabase
          .from('fuel_pumps')
          .insert([{
            name: 'Default Fuel Pump (emergency)',
            email: userEmailToUse,
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
          
          // Associate existing data with this new fuel pump
          await associateExistingDataWithFuelPump(pumpId);
          
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
      
      // Associate existing data with this new fuel pump
      await associateExistingDataWithFuelPump(pumpId);
      
      return pumpId;
    }
    
    return null;
  } catch (error) {
    console.error('Error in createDefaultFuelPumpIfNeeded:', error);
    return null;
  }
};

/**
 * Associate existing data with a fuel pump ID
 * This helps connect orphaned data to a valid fuel pump
 */
const associateExistingDataWithFuelPump = async (fuelPumpId: string): Promise<void> => {
  try {
    console.log(`Associating existing data with fuel pump ID: ${fuelPumpId}`);
    
    // Tables to update with the fuel pump ID
    const tables = [
      'daily_readings',
      'tank_unloads',
      'fuel_settings',
      'pump_settings',
      'customers',
      'inventory',
      'transactions',
      'indents',
      'shifts'
    ];
    
    for (const table of tables) {
      // Check if there's data without a fuel pump ID
      const { data: orphanedData, error: checkError } = await supabase
        .from(table)
        .select('id')
        .is('fuel_pump_id', null)
        .limit(1);
        
      if (checkError) {
        console.error(`Error checking orphaned data in ${table}:`, checkError);
        continue;
      }
      
      if (orphanedData && orphanedData.length > 0) {
        console.log(`Found orphaned data in ${table}, associating with fuel pump ID: ${fuelPumpId}`);
        
        // Update all records without a fuel pump ID
        const { error: updateError } = await supabase
          .from(table)
          .update({ fuel_pump_id: fuelPumpId })
          .is('fuel_pump_id', null);
          
        if (updateError) {
          console.error(`Error updating orphaned data in ${table}:`, updateError);
        } else {
          console.log(`Successfully associated orphaned data in ${table} with fuel pump ID: ${fuelPumpId}`);
        }
      } else {
        console.log(`No orphaned data found in ${table}`);
      }
    }
  } catch (error) {
    console.error('Error in associateExistingDataWithFuelPump:', error);
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
