import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabaseAdminAuth } from '@/lib/supabase'

const AdminAuthContext = createContext(null)

export function AdminAuthProvider({ children }) {
  // undefined = still resolving, null = resolved but no session
  const [session, setSession] = useState(undefined)

  const user    = session?.user ?? null
  const isAdmin = user?.user_metadata?.role === 'admin'
  const loading = session === undefined

  useEffect(() => {
    let active = true

    supabaseAdminAuth.auth.getSession().then(({ data: { session } }) => {
      if (active) setSession(session ?? null)
    })

    const { data: { subscription } } = supabaseAdminAuth.auth.onAuthStateChange((_, session) => {
      setSession(session ?? null)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  const signIn = useCallback(
    (email, password) => supabaseAdminAuth.auth.signInWithPassword({ email, password }),
    []
  )

  const signOut = useCallback(() => supabaseAdminAuth.auth.signOut(), [])

  return (
    <AdminAuthContext.Provider value={{ session, user, isAdmin, loading, signIn, signOut }}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext)
  if (!ctx) throw new Error('useAdminAuth must be used within <AdminAuthProvider>')
  return ctx
}
