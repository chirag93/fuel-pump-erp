
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.2";

// CORS headers for browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  try {
    // Get request body
    const { staff_id, auth_id, new_password } = await req.json();
    
    // Validate required fields
    if (!auth_id || !new_password || !staff_id) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Missing required fields: auth_id, new_password, and staff_id are required" 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    if (new_password.length < 6) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Password must be at least 6 characters" 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Create a Supabase client with the service role key for admin actions
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get the auth header for authorization check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Authorization header required" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    // Get the JWT from authorization header
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Invalid authentication",
          details: authError?.message
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    // Get the staff record to verify permissions
    const { data: staffData, error: staffError } = await supabaseAdmin
      .from('staff')
      .select('fuel_pump_id, auth_id')
      .eq('id', staff_id)
      .single();
    
    if (staffError || !staffData) {
      console.error("Error fetching staff:", staffError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Staff member not found",
          details: staffError?.message
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    // Verify the auth_id in the request matches what's in the database
    if (staffData.auth_id !== auth_id) {
      console.error("Auth ID mismatch:", { requestedAuthId: auth_id, actualAuthId: staffData.auth_id });
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Auth ID mismatch - the provided auth_id doesn't match the staff record" 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    // Check if user is a super admin
    const { data: superAdmin } = await supabaseAdmin
      .from('super_admins')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();
      
    // Check if user is a fuel pump admin
    const { data: fuelPump } = await supabaseAdmin
      .from('fuel_pumps')
      .select('id, email')
      .eq('id', staffData.fuel_pump_id)
      .maybeSingle();
    
    const isFuelPumpAdmin = fuelPump && fuelPump.email.toLowerCase() === user.email.toLowerCase();
    
    // If not a super admin or the fuel pump admin, deny access
    if (!superAdmin && !isFuelPumpAdmin) {
      console.error("Permission denied:", { 
        userId: user.id, 
        userEmail: user.email,
        fuelPumpId: staffData.fuel_pump_id,
        fuelPumpEmail: fuelPump?.email 
      });
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "You don't have permission to update this staff member's password"
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Update the password using admin API
    console.log(`Updating password for auth_id: ${auth_id}`);
    const { error: passwordError } = await supabaseAdmin.auth.admin.updateUserById(
      auth_id, 
      { password: new_password }
    );

    if (passwordError) {
      console.error("Error updating password:", passwordError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to update password: ${passwordError.message}` 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // After successful password update, let's verify we can retrieve the user
    const { data: verifyUser, error: verifyError } = await supabaseAdmin.auth.admin.getUserById(auth_id);
    
    if (verifyError || !verifyUser) {
      console.error("Error verifying user after password update:", verifyError);
      return new Response(
        JSON.stringify({ 
          success: true,
          warning: "Password updated but verification failed. The user might need to reset their password again.",
          details: verifyError?.message 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    console.log("Password updated and verified successfully");
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Password updated successfully" 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `An unexpected error occurred: ${error.message}` 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
