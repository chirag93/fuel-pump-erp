
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

interface RequestBody {
  fuelPumpId: string;
}

console.log("Delete Fuel Pump Edge Function started");

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  
  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Extract request data
    const { fuelPumpId } = await req.json() as RequestBody;
    
    if (!fuelPumpId) {
      return new Response(
        JSON.stringify({ error: "Fuel Pump ID is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    console.log(`Starting deletion process for fuel pump ID: ${fuelPumpId}`);

    // Get fuel pump data to check if it exists
    const { data: fuelPumpData, error: fuelPumpError } = await supabaseClient
      .from("fuel_pumps")
      .select("id, email")
      .eq("id", fuelPumpId)
      .single();

    if (fuelPumpError || !fuelPumpData) {
      console.error("Error fetching fuel pump:", fuelPumpError);
      return new Response(
        JSON.stringify({ error: "Fuel pump not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    // Get all auth users linked to this fuel pump to delete them later
    const { data: staffData } = await supabaseClient
      .from("staff")
      .select("auth_id")
      .eq("fuel_pump_id", fuelPumpId);

    // Use a transaction to delete all related data
    // Note: This transaction will cascade through relations due to foreign key constraints
    const { error: deletionError } = await supabaseClient.rpc(
      'delete_fuel_pump_data',
      { pump_id: fuelPumpId }
    );
    
    if (deletionError) {
      console.error("Error in database deletion:", deletionError);
      throw deletionError;
    }

    // Delete the auth users associated with this fuel pump
    if (staffData && staffData.length > 0) {
      for (const staff of staffData) {
        if (staff.auth_id) {
          const { error: authUserDeleteError } = await supabaseClient.auth.admin.deleteUser(
            staff.auth_id
          );
          
          if (authUserDeleteError) {
            console.error(`Error deleting auth user ${staff.auth_id}:`, authUserDeleteError);
            // Continue with the process even if one user deletion fails
          } else {
            console.log(`Successfully deleted auth user ${staff.auth_id}`);
          }
        }
      }
    }

    // Finally delete the fuel pump auth user if it exists
    try {
      // Find the auth user by email
      const { data: authUsers } = await supabaseClient.auth.admin.listUsers();
      const fuelPumpUser = authUsers?.users.find(user => user.email === fuelPumpData.email);
      
      if (fuelPumpUser) {
        const { error: authUserDeleteError } = await supabaseClient.auth.admin.deleteUser(
          fuelPumpUser.id
        );
        
        if (authUserDeleteError) {
          console.error(`Error deleting fuel pump auth user:`, authUserDeleteError);
        } else {
          console.log(`Successfully deleted fuel pump auth user`);
        }
      }
    } catch (authError) {
      console.error("Error handling auth user deletion:", authError);
    }

    console.log(`Fuel pump ${fuelPumpId} and all associated data successfully deleted`);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("Error in delete-fuel-pump function:", error);
    
    return new Response(
      JSON.stringify({ error: error.message || "An unknown error occurred" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
