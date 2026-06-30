/**
 * Edge Function: admin-operations
 *
 * Handles all Supabase Auth admin API calls that require the service role key.
 * The frontend calls this instead of using the service role key directly.
 *
 * Actions: delete_auth_user | reset_password | list_admin_users |
 *          create_admin_user | delete_admin_user | create_event
 *
 * Deploy: npx supabase functions deploy admin-operations
 * Secret: npx supabase secrets set SERVICE_ROLE_KEY=<your-service-role-key>
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

    // ── 2. Service-role client ──────────────────────────────
    const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY')
    if (!serviceRoleKey) {
      return json({ error: 'Server misconfiguration: SERVICE_ROLE_KEY secret is not set' }, 500)
    }

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      serviceRoleKey,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // ── 3. Dispatch action ──────────────────────────────────
    const body = await req.json()
    const { action } = body as { action: string }

    if (action === 'delete_auth_user') {
      const { user_id } = body as { user_id: string }
      if (!user_id) return json({ error: 'user_id is required' }, 400)
      const { error } = await adminClient.auth.admin.deleteUser(user_id)
      if (error) throw error
      return json({ success: true })
    }

    if (action === 'reset_password') {
      const { user_id, password } = body as { user_id: string; password: string }
      if (!user_id || !password) return json({ error: 'user_id and password are required' }, 400)
      const { error } = await adminClient.auth.admin.updateUserById(user_id, { password })
      if (error) throw error
      return json({ success: true })
    }

    if (action === 'list_admin_users') {
      const { data, error } = await adminClient.auth.admin.listUsers({ perPage: 1000 })
      if (error) throw error
      const admins = (data?.users ?? []).filter(u => u.user_metadata?.role === 'admin')
      return json({ users: admins })
    }

    if (action === 'create_admin_user') {
      const { email, password } = body as { email: string; password: string }
      if (!email || !password) return json({ error: 'email and password are required' }, 400)
      const { data, error } = await adminClient.auth.admin.createUser({
        email: email.trim().toLowerCase(),
        password,
        user_metadata: { role: 'admin' },
        email_confirm: true,
      })
      if (error) throw error
      return json({ user: data.user }, 201)
    }

    if (action === 'delete_admin_user') {
      const { user_id } = body as { user_id: string }
      if (!user_id) return json({ error: 'user_id is required' }, 400)
      const { error } = await adminClient.auth.admin.deleteUser(user_id)
      if (error) throw error
      return json({ success: true })
    }

    if (action === 'create_event') {
      const { title, category, event_date, event_time, room, cp_value, created_by } =
        body as {
          title: string; category: string; event_date: string;
          event_time?: string; room?: string; cp_value: number; created_by?: string
        }
      if (!title || !category || !event_date || cp_value == null) {
        return json({ error: 'title, category, event_date, and cp_value are required' }, 400)
      }
      const { data, error } = await adminClient
        .from('events')
        .insert({ title, category, event_date, event_time: event_time || null, room: room || null, cp_value, created_by })
        .select()
        .single()
      if (error) throw error
      return json({ event: data }, 201)
    }

    return json({ error: `Unknown action: ${action}` }, 400)

  } catch (err: unknown) {
    let message = 'Internal server error'
    if (err instanceof Error) {
      message = err.message
    } else if (err && typeof err === 'object') {
      const e = err as Record<string, unknown>
      message = (e.message ?? e.error_description ?? JSON.stringify(err)) as string
    }
    console.error('[admin-operations] error:', JSON.stringify(err))
    return json({ error: message }, 500)
  }
})
