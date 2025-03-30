
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

    // Get the staff record to verify the auth_id and retrieve important data
    const { data: staffData, error: staffError } = await supabaseAdmin
      .from('staff')
      .select('auth_id, fuel_pump_id, name, role, email')
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

    // First, get existing user data including metadata to preserve it
    const { data: userData, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(auth_id);
    
    if (getUserError) {
      console.error("Error getting user data:", getUserError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Failed to retrieve user data", 
          details: getUserError.message
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Preserve the user's metadata and add important staff information if missing
    const existingMetadata = userData.user?.user_metadata || {};
    const updatedMetadata = {
      ...existingMetadata,
      fuelPumpId: existingMetadata.fuelPumpId || staffData.fuel_pump_id,
      role: existingMetadata.role || staffData.role || 'staff',
      name: existingMetadata.name || staffData.name
    };

    console.log(`Updating password for auth_id: ${auth_id} with preserved metadata`);
    
    // Update the password using admin API while preserving metadata
    const { error: passwordError } = await supabaseAdmin.auth.admin.updateUserById(
      auth_id, 
      { 
        password: new_password,
        user_metadata: updatedMetadata
      }
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

    // Update the staff record to indicate password has been changed
    const { error: updateStaffError } = await supabaseAdmin
      .from('staff')
      .update({ 
        password_updated_at: new Date().toISOString() 
      })
      .eq('id', staff_id);

    if (updateStaffError) {
      console.warn("Could not update staff record with password change timestamp:", updateStaffError);
    }

    console.log(`Password updated successfully for user: ${staffData.name} (${auth_id})`);
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Password updated successfully",
        metadata: updatedMetadata
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
