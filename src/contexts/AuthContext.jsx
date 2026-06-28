import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // undefined = still resolving, null = resolved but no session
  const [session,       setSession]       = useState(undefined)
  const [studentRecord, setStudentRecord] = useState(null)
  const [studentLoading, setStudentLoading] = useState(false)

  const user      = session?.user ?? null
  const isAdmin   = user?.user_metadata?.role === 'admin'
  const isStudent = user?.user_metadata?.role === 'student'
  const loading   = session === undefined

  // Resolve initial session and subscribe to changes
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

  // Fetch the students row for authenticated students
  useEffect(() => {
    if (!user?.id || isAdmin) {
      setStudentRecord(null)
      return
    }

    let active = true
    setStudentLoading(true)

    supabase
      .from('students')
      .select('*')
      .eq('auth_user_id', user.id)
      .single()
      .then(({ data }) => {
        if (active) {
          setStudentRecord(data ?? null)
          setStudentLoading(false)
        }
      })

    return () => { active = false }
  }, [user?.id, isAdmin])

  // Refresh the student record from the DB (call after CP changes etc.)
  const refreshStudentRecord = useCallback(async () => {
    if (!user?.id || isAdmin) return
    const { data } = await supabase
      .from('students')
      .select('*')
      .eq('auth_user_id', user.id)
      .single()
    setStudentRecord(data ?? null)
  }, [user?.id, isAdmin])

  const signIn  = useCallback(
    (email, password) => supabase.auth.signInWithPassword({ email, password }),
    []
  )
  const signOut = useCallback(() => supabase.auth.signOut(), [])

  return (
    <AuthContext.Provider value={{
      session, user,
      isAdmin, isStudent,
      loading,
      studentRecord, studentLoading, refreshStudentRecord,
      signIn, signOut,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
