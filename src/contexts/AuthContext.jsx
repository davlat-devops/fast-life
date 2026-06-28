import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // undefined = still resolving, null = no session
  const [session, setSession] = useState(undefined)

  const user      = session?.user ?? null
  const isAdmin   = user?.user_metadata?.role === 'admin'
  const isStudent = user?.user_metadata?.role === 'student'
  const loading   = session === undefined

  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (active) setSession(session ?? null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setSession(session ?? null)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  const signIn = useCallback(
    (email, password) => supabase.auth.signInWithPassword({ email, password }),
    []
  )

  const signOut = useCallback(() => supabase.auth.signOut(), [])

  return (
    <AuthContext.Provider value={{ session, user, isAdmin, isStudent, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
