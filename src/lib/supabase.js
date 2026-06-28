import { createClient } from '@supabase/supabase-js'

const supabaseUrl    = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// ── Startup checks ────────────────────────────────────────────
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '[Fast Life] Supabase env vars are missing.\n' +
    'Copy .env.example → .env.local and fill in your project credentials.\n' +
    'Find them at: Supabase Dashboard → Project Settings → API'
  )
}

const PLACEHOLDER_URL = 'your-project-id'
const PLACEHOLDER_KEY = 'your-anon-key-here'

if (supabaseUrl.includes(PLACEHOLDER_URL) || supabaseAnonKey === PLACEHOLDER_KEY) {
  throw new Error(
    '[Fast Life] .env.local still has placeholder values.\n' +
    'Replace VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY with your real project credentials.\n' +
    'Find them at: Supabase Dashboard → Project Settings → API'
  )
}

// Basic URL shape check — catches copy-paste accidents before the first network call
try {
  const parsed = new URL(supabaseUrl)
  if (!parsed.hostname.endsWith('.supabase.co')) {
    console.warn('[Fast Life] VITE_SUPABASE_URL does not look like a Supabase project URL:', supabaseUrl)
  }
} catch {
  throw new Error(`[Fast Life] VITE_SUPABASE_URL is not a valid URL: "${supabaseUrl}"`)
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})
