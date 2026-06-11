import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { getUTCNow } from '../lib/time'

const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        handleStreakIncrement(session.user.id)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleStreakIncrement = async (userId) => {
    try {
      const loginTimeUTC = getUTCNow()
      // Call the streak_logic.sql function we created in Supabase
      await supabase.rpc('record_user_login', { 
        user_uuid: userId, 
        login_timestamp: loginTimeUTC 
      })
    } catch (err) {
      console.error("Failed to record login/streak:", err)
    }
  }

  const value = {
    signUp: (data) => supabase.auth.signUp(data),
    signIn: (data) => supabase.auth.signInWithPassword(data),
    signInWithOtp: (data) => supabase.auth.signInWithOtp(data),
    signInWithGoogle: () => supabase.auth.signInWithOAuth({ provider: 'google' }),
    signOut: () => supabase.auth.signOut(),
    user,
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  return useContext(AuthContext)
}
