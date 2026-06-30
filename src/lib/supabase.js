import { createClient } from '@supabase/supabase-js'

const supabaseUrl     = import.meta.env.VITE_SUPABASE_URL     ?? ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

// Student portal auth — session stored under 'fl-student'
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession:   true,
    autoRefreshToken: true,
    storageKey:       'fl-student',
  },
})

// Admin portal auth — completely separate session stored under 'fl-admin'.
// Use this client for all admin DB operations — carries the admin JWT through RLS.
export const supabaseAdminAuth = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession:   true,
    autoRefreshToken: true,
    storageKey:       'fl-admin',
  },
})
