
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
    const { name, email, address, contact_number, created_by, password } = await req.json()

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

    // First, check if a fuel pump with this email already exists
    const { data: existingPump, error: checkError } = await supabaseAdmin
      .from('fuel_pumps')
      .select('id')
      .ilike('email', email)
      .maybeSingle()

    if (checkError) {
      console.error('Error checking existing fuel pump:', checkError)
      throw new Error('Failed to check for existing fuel pump')
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
      console.error('Error creating fuel pump:', pumpError)
      throw new Error(pumpError.message)
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

      console.error('Error creating user account:', userError)
      throw new Error(userError.message)
    }

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
    console.error('Error in create-fuel-pump function:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to create fuel pump'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
