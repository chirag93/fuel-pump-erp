
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

// Create a Supabase client with the service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the request body
    const requestData = await req.json();
    
    console.log("Edge function called with data:", {
      email: requestData.email,
      name: requestData.name,
      role: requestData.staffRole,
      fuelPumpId: requestData.fuelPumpId,
      mobile_only_access: requestData.mobile_only_access
    });

    // Validate required fields
    if (!requestData.email || !requestData.password || !requestData.fuelPumpId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Missing required fields (email, password, fuelPumpId)" 
        }),
        { 
          status: 400, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    // Check if user with this email already exists
    const { data: existingUser, error: checkError } = await supabase.auth.admin.listUsers();
    
    if (checkError) {
      console.error("Error checking existing users:", checkError);
    } else if (existingUser?.users) {
      const emailExists = existingUser.users.some(user => 
        user.email && user.email.toLowerCase() === requestData.email.toLowerCase()
      );
      
      if (emailExists) {
        console.log("User with this email already exists");
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "A user with this email address has already been registered" 
          }),
          { 
            status: 409, 
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json' 
            } 
          }
        );
      }
    }

    // Create a user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: requestData.email,
      password: requestData.password,
      email_confirm: true,
      user_metadata: {
        name: requestData.name,
        role: 'staff',
        fuelPumpId: requestData.fuelPumpId,
        mobile_only_access: requestData.mobile_only_access || false
      }
    });

    if (authError) {
      console.error("Error creating auth user:", authError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: authError.message 
        }),
        { 
          status: authError.status || 400, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    // Get fuel pump name
    const { data: pumpData } = await supabase
      .from('fuel_pumps')
      .select('name')
      .eq('id', requestData.fuelPumpId)
      .single();

    // Create staff record
    if (authData.user) {
      const staffData = {
        name: requestData.name,
        email: requestData.email,
        role: requestData.staffRole,
        auth_id: authData.user.id,
        fuel_pump_id: requestData.fuelPumpId,
        phone: requestData.phone || '',
        joining_date: requestData.joining_date || new Date().toISOString().split('T')[0],
        salary: requestData.salary || 0,
        is_active: true,
        mobile_only_access: requestData.mobile_only_access || false
      };

      console.log("Creating staff record:", staffData);
      
      const { error: staffError } = await supabase
        .from('staff')
        .insert([staffData]);

      if (staffError) {
        console.error("Error creating staff record:", staffError);
        
        // Try to clean up the auth user since staff creation failed
        await supabase.auth.admin.deleteUser(authData.user.id);
        
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "Failed to create staff record: " + staffError.message 
          }),
          { 
            status: 500, 
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json' 
            } 
          }
        );
      }

      // Update user metadata with fuel pump info
      await supabase.auth.admin.updateUserById(authData.user.id, {
        user_metadata: { 
          name: requestData.name,
          role: 'staff',
          fuelPumpId: requestData.fuelPumpId,
          fuelPumpName: pumpData?.name,
          mobile_only_access: requestData.mobile_only_access || false
        }
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          auth_id: authData.user?.id,
          email: authData.user?.email
        }
      }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error("Unhandled error in create-staff-user function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "An unknown error occurred"
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
