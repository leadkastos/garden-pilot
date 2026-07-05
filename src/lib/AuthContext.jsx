import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
const AuthContext = createContext({})
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else { setProfile(null); setLoading(false) }
    })
    return () => subscription.unsubscribe()
  }, [])
  const fetchProfile = async (userId) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    setProfile(data)
    setLoading(false)
  }
  const refreshProfile = async () => {
    if (user?.id) await fetchProfile(user.id)
  }
  return (
    <AuthContext.Provider value={{ user, profile, loading, setProfile, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}
export const useAuth = () => useContext(AuthContext)
