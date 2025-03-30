
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get request body
    const { email, newPassword } = await req.json()

    // Create a Supabase client with the service role key (admin privileges)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { 
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get the user by email
    const { data: user, error: getUserError } = await supabaseAdmin.auth.admin.getUserByEmail(email)

    if (getUserError || !user) {
      console.error('Error finding user:', getUserError)
      throw new Error('User not found')
    }

    // Get existing user metadata to preserve it
    const existingMetadata = user.user?.user_metadata || {};

    // Update the user's password while preserving metadata
    const { data, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { 
        password: newPassword,
        user_metadata: existingMetadata
      }
    )

    if (updateError) {
      console.error('Error updating password:', updateError)
      throw new Error(updateError.message)
    }

    // Update the fuel pump status if this is a fuel pump admin
    const { data: fuelPump, error: fuelPumpError } = await supabaseAdmin
      .from('fuel_pumps')
      .select('id')
      .eq('email', email)
      .maybeSingle();
      
    if (!fuelPumpError && fuelPump) {
      await supabaseAdmin
        .from('fuel_pumps')
        .update({ status: 'password_change_required' })
        .eq('id', fuelPump.id);
      
      console.log(`Updated fuel pump ${fuelPump.id} status to password_change_required`);
    } else {
      // Check if this is a staff member
      const { data: staffData, error: staffError } = await supabaseAdmin
        .from('staff')
        .select('id, auth_id')
        .eq('email', email)
        .maybeSingle();
        
      if (!staffError && staffData) {
        // Update the staff auth_id if it's not set
        if (!staffData.auth_id) {
          await supabaseAdmin
            .from('staff')
            .update({ auth_id: user.id })
            .eq('id', staffData.id);
            
          console.log(`Updated staff record ${staffData.id} with auth_id ${user.id}`);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Password reset successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Error in admin-reset-password function:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to reset password'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
