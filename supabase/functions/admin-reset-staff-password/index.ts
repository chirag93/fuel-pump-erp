
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

    // Verify the requesting user is an admin by checking the auth header
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
        JSON.stringify({ success: false, error: "Invalid authentication" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    // Check if the user is an admin by checking if they match a fuel pump or are a super admin
    const { data: staffData, error: staffError } = await supabaseAdmin
      .from('staff')
      .select('fuel_pump_id')
      .eq('id', staff_id)
      .single();
    
    if (staffError) {
      console.error("Error fetching staff:", staffError);
      return new Response(
        JSON.stringify({ success: false, error: "Staff member not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    // Check if user is a super admin
    const { data: superAdmin } = await supabaseAdmin
      .from('super_admins')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
      
    // Check if user is a fuel pump admin (has same fuel_pump_id as the staff member)
    const { data: fuelPump } = await supabaseAdmin
      .from('fuel_pumps')
      .select('*')
      .eq('id', staffData.fuel_pump_id)
      .eq('email', user.email)
      .maybeSingle();
    
    // If not a super admin or the fuel pump admin, deny access
    if (!superAdmin && !fuelPump) {
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

    console.log("Password updated successfully");
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
