
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { corsHeaders } from '../_shared/cors.ts'
import { verifyAdminRequest, createUnauthorizedResponse, logAdminAction } from '../_shared/auth.ts'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Verify that this request is coming from an authorized source
  const functionName = 'create-fuel-pump';
  const authResult = verifyAdminRequest(req, functionName);
  if (!authResult.authorized) {
    console.error(`[${functionName}] Unauthorized request:`, authResult.reason);
    return createUnauthorizedResponse(authResult.reason || 'Unauthorized request');
  }

  try {
    // Get request body
    const { name, email, address, contact_number, created_by, password } = await req.json()

    // Log the action attempt (without sensitive data)
    logAdminAction(functionName, 'provision_attempt', { 
      name, 
      email, 
      created_by,
      has_password: !!password 
    });

    // Validate required fields
    if (!name || !email || !password) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: name, email, and password are required'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    // Create a Supabase client with the service role key (admin privileges)
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    // Check if environment variables are set
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error(`[${functionName}] Missing environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY`);
      throw new Error('Server configuration error: Missing required environment variables');
    }

    const supabaseAdmin = createClient(
      supabaseUrl,
      supabaseServiceRoleKey,
      { 
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // First, check if a fuel pump with this email already exists
    const { data: existingPump, error: checkError } = await supabaseAdmin
      .from('fuel_pumps')
      .select('id')
      .ilike('email', email)
      .maybeSingle()

    if (checkError) {
      console.error(`[${functionName}] Error checking existing fuel pump:`, checkError);
      throw new Error('Failed to check for existing fuel pump');
    }

    if (existingPump) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'A fuel pump with this email already exists'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    // 1. Create the fuel pump record
    const { data: newPump, error: pumpError } = await supabaseAdmin
      .from('fuel_pumps')
      .insert([{
        name,
        email,
        address,
        contact_number,
        status: 'active',
        created_by
      }])
      .select()
      .single()

    if (pumpError) {
      console.error(`[${functionName}] Error creating fuel pump:`, pumpError);
      throw new Error(pumpError.message);
    }

    // 2. Create the user account
    const { data: newUser, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })

    if (userError) {
      // Rollback the fuel pump creation
      await supabaseAdmin
        .from('fuel_pumps')
        .delete()
        .eq('id', newPump.id)

      console.error(`[${functionName}] Error creating user account:`, userError);
      throw new Error(userError.message);
    }

    logAdminAction(functionName, 'provision_success', { 
      fuel_pump_id: newPump.id,
      email, 
      created_by
    });

    return new Response(
      JSON.stringify({
        success: true,
        fuelPump: newPump
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error(`[${functionName}] Error:`, error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to create fuel pump',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
