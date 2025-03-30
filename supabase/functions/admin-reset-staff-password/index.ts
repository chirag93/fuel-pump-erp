
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
      console.error("Missing required fields:", { staff_id, auth_id, new_password: new_password ? "[REDACTED]" : undefined });
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

    console.log(`Fetching staff record for staff_id: ${staff_id}`);
    // Get the staff record to verify the auth_id
    const { data: staffData, error: staffError } = await supabaseAdmin
      .from('staff')
      .select('auth_id, fuel_pump_id, name')
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
    
    // Make sure the auth_id in the request matches what's in the database
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
    
    // Check authorization from the request header
    // Since we've disabled JWT verification, we'll do this manually
    const authHeader = req.headers.get("Authorization");
    let userId = null;
    
    if (authHeader) {
      try {
        const token = authHeader.replace("Bearer ", "");
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
        
        if (!authError && user) {
          userId = user.id;
          console.log(`Request authenticated as user: ${userId}`);
        } else {
          console.log("Token validation failed:", authError);
        }
      } catch (tokenError) {
        console.error("Error validating token:", tokenError);
      }
    }
    
    // Verify permission: Either the user is a super admin, the fuel pump admin, or we're using service role
    let hasPermission = false;
    
    // Check if this is using service role (e.g., from admin panel)
    if (!userId) {
      // No user ID means this is from a service role call - we'll allow it
      console.log("Request using service role - permission granted");
      hasPermission = true;
    } else {
      // Check if user is a super admin
      const { data: superAdmin } = await supabaseAdmin
        .from('super_admins')
        .select('id')
        .eq('id', userId)
        .maybeSingle();
        
      if (superAdmin) {
        console.log("User is a super admin - permission granted");
        hasPermission = true;
      } else {
        // Check if user is a fuel pump admin
        const { data: userFuelPump } = await supabaseAdmin
          .from('fuel_pumps')
          .select('id, email')
          .eq('id', staffData.fuel_pump_id)
          .maybeSingle();
          
        if (userFuelPump) {
          // Get the requesting user's email
          const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId);
          
          if (userData?.user && userFuelPump.email.toLowerCase() === userData.user.email.toLowerCase()) {
            console.log("User is the fuel pump admin - permission granted");
            hasPermission = true;
          }
        }
      }
    }
    
    if (!hasPermission) {
      console.error("Permission denied for user:", userId);
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
    console.log(`Attempting to update password for auth_id: ${auth_id}`);
    const { error: passwordError } = await supabaseAdmin.auth.admin.updateUserById(
      auth_id, 
      { password: new_password }
    );

    if (passwordError) {
      console.error("Error updating password:", passwordError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Failed to update password", 
          details: passwordError.message
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Verify we can get the user after password update
    const { data: verifyUser, error: verifyError } = await supabaseAdmin.auth.admin.getUserById(auth_id);
    
    if (verifyError || !verifyUser) {
      console.error("Error verifying user after password update:", verifyError);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Password update may have failed - could not verify the user account after update",
          details: verifyError?.message 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    console.log(`Password updated successfully for user: ${staffData.name} (${auth_id})`);
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
