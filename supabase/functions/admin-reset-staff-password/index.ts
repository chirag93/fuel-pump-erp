
// Follow CORS headers setup
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.10.0'
import { corsHeaders } from '../_shared/cors.ts'
import { verifyAdminRequest, createUnauthorizedResponse, logAdminAction } from '../_shared/auth.ts'

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

  // Verify admin authentication
  const authResult = verifyAdminRequest(req, 'admin-reset-staff-password');
  if (!authResult.authorized) {
    return createUnauthorizedResponse(authResult.reason || 'Unauthorized');
  }

  try {
    // Parse request
    const { staff_id, auth_id, new_password, new_email, update_email_only } = await req.json()
    
    // Log the attempt (without exposing the actual password)
    logAdminAction('admin-reset-staff-password', 'attempt', { 
      staff_id,
      auth_id,
      update_email_only: !!update_email_only,
      has_new_password: !!new_password,
      has_new_email: !!new_email
    });
    
    // Validate required parameters
    if (!auth_id) {
      logAdminAction('admin-reset-staff-password', 'validation_error', { error: 'auth_id is required' });
      
      return new Response(
        JSON.stringify({ success: false, error: 'auth_id is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    if (!update_email_only && !new_password && !new_email) {
      logAdminAction('admin-reset-staff-password', 'validation_error', { error: 'Either new_password or new_email is required' });
      
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
      logAdminAction('admin-reset-staff-password', 'staff_not_found', { staff_id, error: staffError.message });
      
      return new Response(
        JSON.stringify({ success: false, error: `Staff record not found: ${staffError.message}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    // Verify the auth_id matches the staff record for extra security
    if (staffData.auth_id && staffData.auth_id !== auth_id) {
      logAdminAction('admin-reset-staff-password', 'auth_mismatch', { 
        staff_id, 
        provided_auth_id: auth_id,
        actual_auth_id: staffData.auth_id
      });
      
      return new Response(
        JSON.stringify({ success: false, error: 'Auth ID does not match the staff record' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    // Get current user metadata to preserve
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(auth_id)
    
    if (userError) {
      logAdminAction('admin-reset-staff-password', 'auth_user_not_found', { auth_id, error: userError.message });
      
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
    logAdminAction('admin-reset-staff-password', 'updating_user', {
      auth_id,
      staff_id,
      staff_name: staffData.name,
      update_type: update_email_only ? 'email' : 'password'
    });
    
    const { data, error } = await supabase.auth.admin.updateUserById(auth_id, updateParams)

    if (error) {
      logAdminAction('admin-reset-staff-password', 'update_failed', { 
        auth_id, 
        staff_id,
        error: error.message 
      });
      
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
          
        logAdminAction('admin-reset-staff-password', 'staff_record_updated', { staff_id });
      } catch (dbError) {
        logAdminAction('admin-reset-staff-password', 'staff_record_update_failed', { 
          staff_id, 
          error: dbError.message 
        });
        
        console.error(`Could not update staff record with password change timestamp: ${dbError}`)
      }
    }

    logAdminAction('admin-reset-staff-password', 'success', {
      auth_id,
      staff_id,
      staff_name: staffData.name,
      update_type: update_email_only ? 'email' : 'password'
    });
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `User ${update_email_only ? 'email' : 'password'} updated successfully`, 
        metadata: userMetadata 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (err) {
    logAdminAction('admin-reset-staff-password', 'error', { error: err.message });
    
    return new Response(
      JSON.stringify({ success: false, error: `Server error: ${err.message}` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
