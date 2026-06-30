import { supabaseAdminAuth } from '@/lib/supabase'

async function callAdminOps(action, params = {}) {
  const { data, error } = await supabaseAdminAuth.functions.invoke('admin-operations', {
    body: { action, ...params },
  })
  if (error) throw error
  if (data?.error) throw new Error(data.error)
  return data
}

export const adminEdge = {
  deleteAuthUser:   (user_id)            => callAdminOps('delete_auth_user',   { user_id }),
  resetPassword:    (user_id, password)  => callAdminOps('reset_password',     { user_id, password }),
  listAdminUsers:   ()                   => callAdminOps('list_admin_users'),
  createAdminUser:  (email, password)    => callAdminOps('create_admin_user',  { email, password }),
  deleteAdminUser:  (user_id)            => callAdminOps('delete_admin_user',  { user_id }),
}
