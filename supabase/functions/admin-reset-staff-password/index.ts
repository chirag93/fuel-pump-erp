
// Follow CORS headers setup
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.10.0'

// Set up CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Create Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  { global: { headers: { Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` } } }
)

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request
    const { staff_id, auth_id, new_password, new_email, update_email_only } = await req.json()
    
    // Validate required parameters
    if (!auth_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'auth_id is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    if (!update_email_only && !new_password && !new_email) {
      return new Response(
        JSON.stringify({ success: false, error: 'Either new_password or new_email is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Get the staff record to verify details and preserve metadata
    const { data: staffData, error: staffError } = await supabase
      .from('staff')
      .select('name, auth_id')
      .eq('id', staff_id)
      .single()

    if (staffError) {
      return new Response(
        JSON.stringify({ success: false, error: `Staff record not found: ${staffError.message}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    // Get current user metadata to preserve
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(auth_id)
    
    if (userError) {
      return new Response(
        JSON.stringify({ success: false, error: `Auth user not found: ${userError.message}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }
    
    const userMetadata = userData.user?.user_metadata || {}

    // Prepare the update parameters
    const updateParams: any = { data: userMetadata }
    
    // Add password/email to update if provided
    if (new_password && !update_email_only) {
      updateParams.password = new_password
    }
    
    if (new_email) {
      updateParams.email = new_email
    }

    // Update the user with admin rights
    console.log(`Updating ${update_email_only ? 'email' : 'password'} for auth_id: ${auth_id} with preserved metadata`)
    const { data, error } = await supabase.auth.admin.updateUserById(auth_id, updateParams)

    if (error) {
      console.error(`Error updating user: ${error.message}`)
      return new Response(
        JSON.stringify({ success: false, error: `Failed to update user: ${error.message}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Update staff record timestamp if needed (for password changes)
    if (!update_email_only && staff_id) {
      try {
        await supabase
          .from('staff')
          .update({})  // Empty update to trigger the password_updated_at trigger
          .eq('id', staff_id)
      } catch (dbError) {
        console.error(`Could not update staff record with password change timestamp: ${dbError}`)
      }
    }

    console.log(`Password updated successfully for user: ${staffData.name} (${auth_id})`)
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `User ${update_email_only ? 'email' : 'password'} updated successfully`, 
        metadata: userMetadata 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (err) {
    console.error(`Unhandled error: ${err.message}`)
    return new Response(
      JSON.stringify({ success: false, error: `Server error: ${err.message}` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
