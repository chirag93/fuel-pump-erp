
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

Deno.serve(async (req) => {
  // CORS Preflight handler
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Log start of function
    console.log("Starting create-staff-user function");
    
    // Parse the request body
    let requestData;
    try {
      requestData = await req.json();
      console.log("Request data parsed successfully");
    } catch (parseError) {
      console.error("Failed to parse request JSON:", parseError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Invalid request format: " + parseError.message 
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
    
    // Log received data (excluding password for security)
    const logData = { 
      ...requestData, 
      password: requestData.password ? '******' : undefined 
    };
    console.log("Request data:", logData);

    // Validate required fields
    if (!requestData.email || !requestData.password || !requestData.fuelPumpId) {
      console.error("Missing required fields");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Missing required fields: email, password, and fuelPumpId are required" 
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

    // Normalize data
    requestData.email = requestData.email.toLowerCase().trim();
    
    // Step 1: Verify fuel pump exists
    console.log("Verifying fuel pump ID:", requestData.fuelPumpId);
    const { data: fuelPump, error: fuelPumpError } = await supabase
      .from('fuel_pumps')
      .select('id, name')
      .eq('id', requestData.fuelPumpId)
      .maybeSingle();

    if (fuelPumpError) {
      console.error("Error checking fuel pump:", fuelPumpError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Database error when checking fuel pump: " + fuelPumpError.message 
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
    
    if (!fuelPump) {
      console.error("Fuel pump not found:", requestData.fuelPumpId);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Invalid fuel pump ID: The specified fuel pump does not exist" 
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
    
    console.log("Fuel pump verified:", fuelPump.name);

    // Step 2: Check if email already exists in auth
    console.log("Checking if email already exists in auth system");
    const { data: existingUser, error: userCheckError } = await supabase.auth.admin.getUserByEmail(
      requestData.email
    );
    
    if (userCheckError && userCheckError.message !== "User not found") {
      console.error("Error checking existing user:", userCheckError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Error verifying email uniqueness: " + userCheckError.message 
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
    
    if (existingUser) {
      console.error("Email already exists in auth system:", requestData.email);
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
    
    // Step 3: Check if email exists in staff table
    console.log("Checking if email already exists in staff table");
    const { data: existingStaff, error: staffCheckError } = await supabase
      .from('staff')
      .select('id, email')
      .ilike('email', requestData.email)
      .maybeSingle();
      
    if (staffCheckError) {
      console.error("Error checking existing staff:", staffCheckError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Database error when checking staff email: " + staffCheckError.message 
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
    
    if (existingStaff) {
      console.error("Email already exists in staff table:", requestData.email);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "A staff member with this email already exists" 
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
    
    // Step 4: Check if phone number is unique (if provided)
    if (requestData.phone) {
      console.log("Checking if phone number already exists");
      const { data: existingPhone, error: phoneCheckError } = await supabase
        .from('staff')
        .select('id, phone')
        .eq('phone', requestData.phone)
        .maybeSingle();
        
      if (phoneCheckError) {
        console.error("Error checking existing phone numbers:", phoneCheckError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "Database error when checking phone: " + phoneCheckError.message 
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
      
      if (existingPhone) {
        console.error("Phone number already in use:", requestData.phone);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "A staff member with this phone number already exists" 
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

    // Step 5: Create auth user
    console.log("Creating auth user");
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: requestData.email,
      password: requestData.password,
      email_confirm: true,
      user_metadata: {
        name: requestData.name,
        role: 'staff',
        fuelPumpId: requestData.fuelPumpId,
        fuelPumpName: fuelPump.name,
        mobile_only_access: requestData.mobile_only_access || false
      }
    });

    if (authError) {
      console.error("Error creating auth user:", authError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Failed to create user account: " + authError.message 
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

    if (!authData.user) {
      console.error("Auth user created but user object is missing");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "User account created but user data is missing" 
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

    console.log("Auth user created successfully with ID:", authData.user.id);

    // Step 6: Create staff record
    try {
      // Format assigned_pumps correctly
      let assignedPumps = [];
      if (requestData.assigned_pumps) {
        if (typeof requestData.assigned_pumps === 'string') {
          try {
            assignedPumps = JSON.parse(requestData.assigned_pumps);
          } catch (e) {
            console.warn("Could not parse assigned_pumps string, using empty array", e);
          }
        } else if (Array.isArray(requestData.assigned_pumps)) {
          assignedPumps = requestData.assigned_pumps;
        }
      }
      
      const staffData = {
        name: requestData.name,
        email: requestData.email.toLowerCase(),
        role: requestData.staffRole || 'Staff',
        auth_id: authData.user.id,
        fuel_pump_id: requestData.fuelPumpId,
        phone: requestData.phone || '',
        joining_date: requestData.joining_date || new Date().toISOString().split('T')[0],
        salary: requestData.salary ? parseFloat(requestData.salary.toString()) : 0,
        is_active: true,
        mobile_only_access: requestData.mobile_only_access || false,
        assigned_pumps: JSON.stringify(assignedPumps)
      };

      console.log("Creating staff record with data:", { ...staffData, auth_id: '***' });
      
      const { data: insertedStaff, error: staffError } = await supabase
        .from('staff')
        .insert([staffData])
        .select();

      if (staffError) {
        console.error("Error creating staff record:", staffError);
        
        // Attempt to clean up auth user since staff creation failed
        console.log("Cleaning up auth user due to staff creation failure");
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

      if (!insertedStaff || insertedStaff.length === 0) {
        console.error("Staff creation did not return the inserted record");
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "Staff record was created but no data was returned" 
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

      console.log("Staff record created successfully with ID:", insertedStaff[0].id);

      // Step 7: Create staff permissions if provided
      if (requestData.features && requestData.features.length > 0) {
        const staffPermissions = requestData.features.map((feature) => ({
          staff_id: insertedStaff[0].id,
          feature: feature
        }));

        console.log("Creating staff permissions:", staffPermissions);
        
        const { error: permissionsError } = await supabase
          .from('staff_permissions')
          .insert(staffPermissions);

        if (permissionsError) {
          console.error("Error creating staff permissions:", permissionsError);
          // Non-fatal error, continue
        } else {
          console.log("Staff permissions created successfully");
        }
      }

      // Return success response
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            auth_id: authData.user.id,
            email: authData.user.email,
            staff_id: insertedStaff[0].id
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
    } catch (staffCreationError) {
      console.error("Unexpected error during staff creation:", staffCreationError);
      
      // Try to clean up auth user
      console.log("Cleaning up auth user due to unexpected error");
      try {
        await supabase.auth.admin.deleteUser(authData.user.id);
      } catch (cleanupError) {
        console.error("Error during cleanup:", cleanupError);
      }
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Unexpected error during staff creation: " + staffCreationError.message 
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
        error: "Unhandled server error: " + (error.message || "Unknown error")
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
