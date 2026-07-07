import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

// Computes read-only status from profile subscription flags.
// Returns { isReadOnly, reason } — reason is used to drive popups/messaging.
function computeAccess(profile) {
  if (!profile) return { isReadOnly: false, reason: null }

  const now = new Date()
  const status = profile.subscription_status

  // Active paid members always have full access.
  if (status === 'active') {
    // Canceled but still within paid period → full access until period ends.
    if (profile.cancel_at_period_end && profile.current_period_end) {
      const periodEnd = new Date(profile.current_period_end)
      if (now > periodEnd) {
        return { isReadOnly: true, reason: 'canceled_expired' }
      }
    }
    return { isReadOnly: false, reason: null }
  }

  // Trial users: full access until trial_ends_at + 3-day grace.
  if (status === 'trial') {
    if (profile.trial_ends_at) {
      const trialEnd = new Date(profile.trial_ends_at)
      const graceEnd = new Date(trialEnd.getTime() + 3 * 24 * 60 * 60 * 1000)
      if (now > graceEnd) {
        return { isReadOnly: true, reason: 'trial_expired' }
      }
    }
    return { isReadOnly: false, reason: null }
  }

  // Any explicitly read-only / expired status flagged by the daily check.
  if (status === 'read_only' || status === 'expired') {
    return { isReadOnly: true, reason: 'expired' }
  }

  // Unknown/missing status → default to full access (don't lock people out by accident).
  return { isReadOnly: false, reason: null }
}

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

  const { isReadOnly, reason: readOnlyReason } = computeAccess(profile)

  return (
    <AuthContext.Provider value={{ user, profile, loading, setProfile, refreshProfile, isReadOnly, readOnlyReason }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
