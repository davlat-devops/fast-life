/**
 * Edge Function: create-student
 *
 * Creates a Supabase Auth user + students row in one atomic step.
 * Requires service role key (set automatically in Supabase hosted env).
 *
 * Deploy:  npx supabase functions deploy create-student
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    // ── 1. Verify caller is an admin ────────────────────────
    const authHeader = req.headers.get('Authorization') ?? ''

    const callerClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: userErr } = await callerClient.auth.getUser()
    if (userErr || !user || user.user_metadata?.role !== 'admin') {
      return json({ error: 'Forbidden — admin only' }, 403)
    }

    // ── 2. Parse + validate body ────────────────────────────
    const { full_name, age, level, phone, class_group } = await req.json()

    if (!full_name?.trim() || !age || !level || !phone?.trim() || !class_group?.trim()) {
      return json({ error: 'All fields are required' }, 400)
    }

    const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
    if (!LEVELS.includes(level)) return json({ error: 'Invalid level' }, 400)

    // ── 3. Service-role client for privileged ops ───────────
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // ── 4. Generate unique credentials via DB function ──────
    const { data: creds, error: credsErr } = await admin
      .rpc('generate_student_credentials', { p_full_name: full_name })
    if (credsErr) throw credsErr

    const { username, password } = creds as { username: string; password: string }

    // ── 5. Random clan assignment ───────────────────────────
    const CLANS = ['VIPERON', 'CRODON', 'AVERON', 'WOLFRIN']
    const clan = CLANS[Math.floor(Math.random() * CLANS.length)]

    // ── 6. Create Auth user ─────────────────────────────────
    const { data: authData, error: authErr } = await admin.auth.admin.createUser({
      email: `${username}@fastlife.internal`,
      password,
      email_confirm: true,
      user_metadata: { role: 'student', username },
    })
    if (authErr) throw authErr

    // ── 7. Insert students row ──────────────────────────────
    const { data: student, error: studentErr } = await admin
      .from('students')
      .insert({
        auth_user_id: authData.user.id,
        full_name: full_name.trim(),
        age: Number(age),
        level,
        phone: phone.trim(),
        class_group: class_group.trim(),
        clan,
        username,
      })
      .select()
      .single()

    if (studentErr) {
      // Rollback: remove orphaned auth user
      await admin.auth.admin.deleteUser(authData.user.id)
      throw studentErr
    }

    return json({ student, credentials: { username, password, clan } }, 201)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return json({ error: message }, 500)
  }
})
