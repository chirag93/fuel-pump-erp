import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';
import { corsHeaders } from '../_shared/cors.ts';
import { verifyAdminRequest, createUnauthorizedResponse, logAdminAction } from '../_shared/auth.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

// Add this type definition at the top
type StaffFeature = 'dashboard' | 'daily_readings' | 'stock_levels' | 'tank_unload' | 
                    'customers' | 'staff_management' | 'record_indent' | 'shift_management' | 
                    'consumables' | 'testing' | 'settings';

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Verify admin authentication
  const authResult = verifyAdminRequest(req, 'create-staff-user');
  if (!authResult.authorized) {
    return createUnauthorizedResponse(authResult.reason || 'Unauthorized');
  }

  try {
    logAdminAction('create-staff-user', 'start', { timestamp: new Date().toISOString() });
    
    const requestData = await req.json();
    
    // Log request (excluding sensitive data)
    const safeRequestData = {
      ...requestData,
      password: requestData.password ? '******' : undefined
    };
    logAdminAction('create-staff-user', 'request_data', safeRequestData);

    // Validate required fields
    const requiredFields = ['name', 'email', 'phone', 'fuelPumpId', 'password', 'staffRole'];
    const missingFields = requiredFields.filter(field => !requestData[field]);
    
    if (missingFields.length > 0) {
      logAdminAction('create-staff-user', 'validation_error', { 
        error: 'Missing required fields',
        fields: missingFields 
      });
      
      return new Response(
        JSON.stringify({
          success: false,
          error: `Missing required fields: ${missingFields.join(', ')}`
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Initialize Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Verify fuel pump exists
    logAdminAction('create-staff-user', 'verifying_fuel_pump', { fuelPumpId: requestData.fuelPumpId });
    
    const { data: fuelPump, error: fuelPumpError } = await supabase
      .from('fuel_pumps')
      .select('id, name')
      .eq('id', requestData.fuelPumpId)
      .single();

    if (fuelPumpError || !fuelPump) {
      logAdminAction('create-staff-user', 'fuel_pump_verification_failed', { 
        fuelPumpId: requestData.fuelPumpId,
        error: fuelPumpError?.message || 'Fuel pump not found'
      });
      
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

    logAdminAction('create-staff-user', 'fuel_pump_verified', { 
      fuelPumpId: requestData.fuelPumpId,
      fuelPumpName: fuelPump.name
    });

    // Check if phone number exists
    const { data: existingStaffWithPhone, error: phoneCheckError } = await supabase
      .from('staff')
      .select('id, phone')
      .eq('phone', requestData.phone)
      .maybeSingle();

    if (phoneCheckError) {
      logAdminAction('create-staff-user', 'phone_check_error', { error: phoneCheckError.message });
      throw new Error("Database error when checking staff phone");
    }

    if (existingStaffWithPhone) {
      logAdminAction('create-staff-user', 'duplicate_phone', { phone: requestData.phone });
      
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
      logAdminAction('create-staff-user', 'email_check_error', { error: emailCheckError.message });
      throw new Error("Database error when checking staff email");
    }

    if (existingStaffWithEmail) {
      logAdminAction('create-staff-user', 'duplicate_email', { email: requestData.email });
      
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
    logAdminAction('create-staff-user', 'creating_auth_user', { email: requestData.email });
    
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
      logAdminAction('create-staff-user', 'auth_user_creation_failed', { 
        email: requestData.email,
        error: authError?.message || 'Unknown error'
      });
      
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

    logAdminAction('create-staff-user', 'auth_user_created', { 
      userId: authData.user.id,
      email: requestData.email
    });

    // Format assigned pumps
    let assignedPumps = [];
    if (requestData.assigned_pumps) {
      if (typeof requestData.assigned_pumps === 'string') {
        try {
          assignedPumps = JSON.parse(requestData.assigned_pumps);
        } catch (e) {
          logAdminAction('create-staff-user', 'assigned_pumps_parse_error', { error: e.message });
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

    logAdminAction('create-staff-user', 'creating_staff_record', {
      name: staffData.name,
      email: staffData.email,
      role: staffData.role
    });

    const { data: insertedStaff, error: staffError } = await supabase
      .from('staff')
      .insert([staffData])
      .select()
      .single();

    if (staffError) {
      logAdminAction('create-staff-user', 'staff_creation_failed', { error: staffError.message });
      
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

    logAdminAction('create-staff-user', 'staff_record_created', { 
      staffId: insertedStaff.id,
      name: insertedStaff.name
    });

    // Add better error handling and validation for features
    if (requestData.features && Array.isArray(requestData.features)) {
      const validFeatures = requestData.features.every((feature: string) => {
        const isValid = [
          'dashboard', 'daily_readings', 'stock_levels', 'tank_unload',
          'customers', 'staff_management', 'record_indent', 'shift_management',
          'consumables', 'testing', 'settings'
        ].includes(feature);
        
        if (!isValid) {
          console.warn(`Invalid feature detected: ${feature}`);
        }
        return isValid;
      });

      if (!validFeatures) {
        throw new Error("Invalid features provided");
      }

      // Create staff permissions with better error handling
      const staffPermissions = requestData.features.map((feature: StaffFeature) => ({
        staff_id: insertedStaff.id,
        feature: feature
      }));

      const { error: permissionsError } = await supabase
        .from('staff_permissions')
        .insert(staffPermissions);

      if (permissionsError) {
        logAdminAction('create-staff-user', 'permissions_creation_error', { 
          error: permissionsError.message,
          staffId: insertedStaff.id
        });
        
        // Make permission errors fatal to ensure data consistency
        throw new Error(`Failed to create staff permissions: ${permissionsError.message}`);
      }

      logAdminAction('create-staff-user', 'permissions_created', { 
        staffId: insertedStaff.id,
        featureCount: staffPermissions.length,
        features: requestData.features
      });
    }

    logAdminAction('create-staff-user', 'success', {
      staffId: insertedStaff.id,
      userId: authData.user.id,
      email: authData.user.email
    });

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
    logAdminAction('create-staff-user', 'unhandled_error', { error: error.message });
    
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
