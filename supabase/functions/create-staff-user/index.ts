
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting create-staff-user function");
    
    const requestData = await req.json();
    console.log("Request data:", {
      ...requestData,
      password: requestData.password ? '******' : undefined
    });

    // Initialize Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Verify fuel pump exists
    console.log("Verifying fuel pump ID:", requestData.fuelPumpId);
    const { data: fuelPump, error: fuelPumpError } = await supabase
      .from('fuel_pumps')
      .select('id, name')
      .eq('id', requestData.fuelPumpId)
      .single();

    if (fuelPumpError || !fuelPump) {
      console.error("Fuel pump verification failed:", fuelPumpError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid fuel pump ID or fuel pump not found"
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log("Fuel pump verified:", fuelPump.name);

    // Check if phone number exists
    const { data: existingStaffWithPhone, error: phoneCheckError } = await supabase
      .from('staff')
      .select('id, phone')
      .eq('phone', requestData.phone)
      .maybeSingle();

    if (phoneCheckError) {
      console.error("Error checking existing phone:", phoneCheckError);
      throw new Error("Database error when checking staff phone");
    }

    if (existingStaffWithPhone) {
      console.error("Phone number already exists:", requestData.phone);
      return new Response(
        JSON.stringify({
          success: false,
          error: "This phone number is already registered with another staff member",
          errorType: "DUPLICATE_PHONE"
        }),
        {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Check if email exists
    const { data: existingStaffWithEmail, error: emailCheckError } = await supabase
      .from('staff')
      .select('id, email')
      .eq('email', requestData.email.toLowerCase())
      .maybeSingle();

    if (emailCheckError) {
      console.error("Error checking existing email:", emailCheckError);
      throw new Error("Database error when checking staff email");
    }

    if (existingStaffWithEmail) {
      console.error("Email already exists:", requestData.email);
      return new Response(
        JSON.stringify({
          success: false,
          error: "This email is already registered with another staff member",
          errorType: "DUPLICATE_EMAIL"
        }),
        {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Create auth user with admin API
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

    if (authError || !authData.user) {
      console.error("Error creating auth user:", authError);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Failed to create user account: ${authError?.message || 'Unknown error'}`
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log("Auth user created successfully with ID:", authData.user.id);

    // Format assigned pumps
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

    // Create staff record
    const staffData = {
      name: requestData.name,
      email: requestData.email.toLowerCase(),
      role: requestData.staffRole || 'Staff',
      auth_id: authData.user.id,
      fuel_pump_id: requestData.fuelPumpId,
      phone: requestData.phone,
      joining_date: requestData.joining_date || new Date().toISOString().split('T')[0],
      salary: requestData.salary ? parseFloat(requestData.salary.toString()) : 0,
      is_active: true,
      mobile_only_access: requestData.mobile_only_access || false,
      assigned_pumps: JSON.stringify(assignedPumps)
    };

    console.log("Creating staff record with data:", {
      ...staffData,
      auth_id: '***'
    });

    const { data: insertedStaff, error: staffError } = await supabase
      .from('staff')
      .insert([staffData])
      .select()
      .single();

    if (staffError) {
      console.error("Error creating staff record:", staffError);
      // Clean up auth user since staff creation failed
      await supabase.auth.admin.deleteUser(authData.user.id);
      
      let errorMessage = "Failed to create staff record";
      let errorType = "DATABASE_ERROR";
      
      if (staffError.code === '23505') {
        if (staffError.message.includes('staff_phone_key')) {
          errorMessage = "This phone number is already registered";
          errorType = "DUPLICATE_PHONE";
        } else if (staffError.message.includes('staff_email_key')) {
          errorMessage = "This email is already registered";
          errorType = "DUPLICATE_EMAIL";
        }
      }
      
      return new Response(
        JSON.stringify({
          success: false,
          error: errorMessage,
          errorType: errorType,
          details: staffError.message
        }),
        {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log("Staff record created successfully with ID:", insertedStaff.id);

    // Create staff permissions if provided
    if (requestData.features && requestData.features.length > 0) {
      const staffPermissions = requestData.features.map((feature) => ({
        staff_id: insertedStaff.id,
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

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          auth_id: authData.user.id,
          staff_id: insertedStaff.id,
          email: authData.user.email
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error("Unhandled error in create-staff-user function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "An unexpected error occurred",
        errorType: "UNKNOWN_ERROR"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
