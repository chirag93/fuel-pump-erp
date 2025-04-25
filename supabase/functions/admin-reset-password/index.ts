
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { corsHeaders } from '../_shared/cors.ts'
import { verifyAdminRequest, createUnauthorizedResponse, logAdminAction } from '../_shared/auth.ts'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Verify admin authentication
  const authResult = verifyAdminRequest(req, 'admin-reset-password');
  if (!authResult.authorized) {
    return createUnauthorizedResponse(authResult.reason || 'Unauthorized');
  }

  try {
    // Get request body
    const { email, newPassword } = await req.json()
    
    // Validate input parameters
    if (!email || !newPassword) {
      const errorMessage = 'Missing required fields: email and newPassword are required';
      logAdminAction('admin-reset-password', 'validation_error', { email: email ? '***' : undefined, error: errorMessage });
      
      return new Response(
        JSON.stringify({ success: false, error: errorMessage }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

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

    // Log the password reset attempt (without exposing the actual password)
    logAdminAction('admin-reset-password', 'attempt', { 
      email, 
      timestamp: new Date().toISOString() 
    });

    // Get the user by email
    const { data: user, error: getUserError } = await supabaseAdmin.auth.admin.getUserByEmail(email)

    if (getUserError || !user) {
      const errorMessage = 'User not found';
      logAdminAction('admin-reset-password', 'user_not_found', { email, error: getUserError?.message });
      
      return new Response(
        JSON.stringify({ success: false, error: errorMessage }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404 
        }
      );
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
      logAdminAction('admin-reset-password', 'update_failed', { 
        email, 
        userId: user.id,
        error: updateError.message
      });
      
      return new Response(
        JSON.stringify({ success: false, error: updateError.message }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
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
      
      logAdminAction('admin-reset-password', 'status_updated', {
        email,
        userId: user.id,
        fuelPumpId: fuelPump.id,
        status: 'password_change_required'
      });
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
            
          logAdminAction('admin-reset-password', 'staff_updated', {
            email,
            userId: user.id,
            staffId: staffData.id
          });
        }
      }
    }

    // Log successful password reset
    logAdminAction('admin-reset-password', 'success', { 
      email, 
      userId: user.id,
      timestamp: new Date().toISOString() 
    });

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
    logAdminAction('admin-reset-password', 'error', {
      error: error.message || 'Unknown error'
    });
    
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
