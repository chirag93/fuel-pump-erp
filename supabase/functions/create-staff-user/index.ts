
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
      console.error("Missing required fields:", { 
        hasEmail: Boolean(requestData.email), 
        hasPassword: Boolean(requestData.password), 
        hasFuelPumpId: Boolean(requestData.fuelPumpId) 
      });
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Missing required fields" 
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

    // Verify fuel pump exists
    const { data: pumpData, error: pumpError } = await supabase
      .from('fuel_pumps')
      .select('id, name')
      .eq('id', requestData.fuelPumpId)
      .single();

    if (pumpError || !pumpData) {
      console.error("Fuel pump not found:", requestData.fuelPumpId, pumpError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Invalid fuel pump ID" 
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

    // Check if user exists
    const { data: existingUsers, error: userListError } = await supabase.auth.admin.listUsers();
    
    if (userListError) {
      console.error("Error checking existing users:", userListError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Failed to verify email uniqueness: " + userListError.message 
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
    
    if (existingUsers?.users?.some(user => user.email?.toLowerCase() === requestData.email.toLowerCase())) {
      console.error("Email already in use:", requestData.email);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "A user with this email already exists" 
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

    // Create auth user
    console.log("Creating auth user with email:", requestData.email);
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: requestData.email,
      password: requestData.password,
      email_confirm: true,
      user_metadata: {
        name: requestData.name,
        role: 'staff',
        fuelPumpId: requestData.fuelPumpId,
        fuelPumpName: pumpData.name,
        mobile_only_access: requestData.mobile_only_access || false
      }
    });

    if (authError) {
      console.error("Error creating auth user:", authError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Failed to create auth user: " + authError.message 
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

    console.log("Auth user created successfully with ID:", authData.user?.id);

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
        mobile_only_access: requestData.mobile_only_access || false,
        // Convert assigned_pumps to a JSON array if provided
        assigned_pumps: requestData.assigned_pumps ? JSON.stringify(requestData.assigned_pumps) : '[]'
      };

      console.log("Creating staff record:", staffData);
      
      const { data: insertedStaff, error: staffError } = await supabase
        .from('staff')
        .insert([staffData])
        .select();

      if (staffError) {
        console.error("Error creating staff record:", staffError);
        
        // Clean up auth user since staff creation failed
        const { error: deleteError } = await supabase.auth.admin.deleteUser(authData.user.id);
        if (deleteError) {
          console.error("Error cleaning up auth user after staff creation failure:", deleteError);
        }
        
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

      console.log("Staff record created successfully:", insertedStaff);

      // Handle staff permissions if provided
      if (requestData.features && requestData.features.length > 0 && insertedStaff && insertedStaff.length > 0) {
        const staffPermissions = requestData.features.map((feature: string) => ({
          staff_id: insertedStaff[0].id,
          feature: feature
        }));

        console.log("Creating staff permissions:", staffPermissions);
        
        const { error: permissionsError } = await supabase
          .from('staff_permissions')
          .insert(staffPermissions);

        if (permissionsError) {
          console.error("Error creating staff permissions:", permissionsError);
          // We don't fail the entire operation if just permissions fail
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            auth_id: authData.user.id,
            email: authData.user.email,
            staff_id: insertedStaff?.[0]?.id
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
    } else {
      console.error("Auth user created but user object is missing");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Auth user created but user object is missing"
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
