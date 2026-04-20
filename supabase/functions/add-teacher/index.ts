import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, content-type',
      },
    })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), { status: 401 })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Verify caller is admin using anon key (respects RLS)
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401 })
    }

    const { data: callerProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!callerProfile || callerProfile.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden: admin role required' }), { status: 403 })
    }

    // Parse request body
    const { username, email, password, fullName, language } = await req.json()
    if (!username || !password || !fullName) {
      return new Response(JSON.stringify({ error: 'username, password, and fullName are required' }), { status: 400 })
    }

    // Create user with service role key (bypasses RLS)
    const adminClient = createClient(supabaseUrl, supabaseServiceKey)
    const signupEmail = email || `${username}@qurantracker.local`

    const { data: authData, error: authError: createError } = await adminClient.auth.admin.createUser({
      email: signupEmail,
      password,
      email_confirm: true,
      user_metadata: {
        username,
        full_name: fullName,
        role: 'teacher',
        language: language || 'ar',
      },
    })

    if (createError) {
      return new Response(JSON.stringify({ error: createError.message }), { status: 400 })
    }

    // The database trigger (handle_new_user) will create the profile automatically,
    // but it defaults to status='pending'. Update to 'active' since admin created this teacher.
    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .update({ status: 'active', role: 'teacher' })
      .eq('id', authData.user.id)
      .select()
      .single()

    if (profileError) {
      return new Response(JSON.stringify({ error: profileError.message }), { status: 500 })
    }

    return new Response(JSON.stringify({ data: profile }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})
