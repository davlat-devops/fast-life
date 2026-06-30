import { supabaseAdminAuth } from '@/lib/supabase'

export async function logAudit(action, details = {}) {
  try {
    const { data: { user } } = await supabaseAdminAuth.auth.getUser()
    if (!user) return
    await supabaseAdminAuth.from('audit_log').insert({
      admin_email: user.email,
      action,
      details,
    })
  } catch {
    // audit logging is non-critical; never block the main action
  }
}
