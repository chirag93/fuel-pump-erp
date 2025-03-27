
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Verify that the request is from an authenticated super admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user is a super admin
    const { data: superAdminData, error: superAdminError } = await supabase
      .from('super_admins')
      .select('id')
      .eq('id', user.id)
      .single()

    if (superAdminError || !superAdminData) {
      return new Response(
        JSON.stringify({ error: 'Not authorized as super admin' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get request body
    const { userId, email, newPassword } = await req.json()

    // Validate required fields
    if ((!userId && !email) || !newPassword) {
      return new Response(
        JSON.stringify({ error: 'User ID or email, and new password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate password length
    if (newPassword.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 6 characters long' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let userIdToReset = userId;

    // If email is provided instead of userId, find the user by email
    if (!userIdToReset && email) {
      console.log('Searching for user by email:', email);
      const { data: usersByEmail, error: emailLookupError } = await supabase.auth.admin.listUsers()
      
      if (emailLookupError) {
        return new Response(
          JSON.stringify({ error: `Error finding user by email: ${emailLookupError.message}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      const matchingUser = usersByEmail.users.find(u => 
        u.email && u.email.toLowerCase() === email.toLowerCase()
      );
      
      if (!matchingUser) {
        return new Response(
          JSON.stringify({ error: 'User with this email not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      userIdToReset = matchingUser.id;
      console.log('Found user ID by email:', userIdToReset);
    }

    // Reset the user's password using the admin API
    const { error: resetError } = await supabase.auth.admin.updateUserById(
      userIdToReset,
      { password: newPassword }
    )

    if (resetError) {
      return new Response(
        JSON.stringify({ error: resetError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Password reset successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in reset-password function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
