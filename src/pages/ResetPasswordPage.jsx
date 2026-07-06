import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Check, AlertTriangle } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [status, setStatus] = useState('checking') // checking | ready | invalid | saving | done
  const [error, setError] = useState('')

  // Supabase puts the user into a temporary recovery session when they land
  // here from the email link. Confirm that session exists before showing the form.
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) {
        setStatus('ready')
      }
    })

    // Also check immediately in case the event already fired
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setStatus('ready')
      else {
        // give the recovery event a moment to arrive
        setTimeout(() => {
          setStatus(s => (s === 'checking' ? 'invalid' : s))
        }, 2500)
      }
    })

    return () => sub.subscription.unsubscribe()
  }, [])

  const handleSubmit = async () => {
    setError('')
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setStatus('saving')
    const { error: updateError } = await supabase.auth.updateUser({ password })
    if (updateError) {
      setError(updateError.message)
      setStatus('ready')
      return
    }
    setStatus('done')
    setTimeout(() => navigate('/login'), 2500)
  }

  return (
    <div className="min-h-screen bg-parchment flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <img src="/garden-navi-logo-dark.png" alt="Garden Navi" className="h-16 mb-3" />
          <h1 className="font-display text-2xl font-semibold text-garden-900">Set a new password</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-6">
          {status === 'checking' && (
            <div className="flex items-center justify-center gap-2 py-8">
              <div className="w-5 h-5 border-2 border-garden-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-garden-500">Verifying your link...</span>
            </div>
          )}

          {status === 'invalid' && (
            <div className="text-center py-6">
              <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <AlertTriangle size={22} className="text-amber-500" />
              </div>
              <h2 className="font-display text-lg font-semibold text-garden-900 mb-1">Link expired or invalid</h2>
              <p className="text-sm text-garden-500 mb-5">
                This password reset link is no longer valid. Request a new one from the login page.
              </p>
              <button onClick={() => navigate('/login')} className="btn-primary w-full justify-center py-3">
                Back to login
              </button>
            </div>
          )}

          {status === 'done' && (
            <div className="text-center py-6">
              <div className="w-12 h-12 bg-garden-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Check size={22} className="text-garden-600" />
              </div>
              <h2 className="font-display text-lg font-semibold text-garden-900 mb-1">Password updated</h2>
              <p className="text-sm text-garden-500">Taking you to the login page...</p>
            </div>
          )}

          {(status === 'ready' || status === 'saving') && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-garden-700 mb-1.5">New password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-garden-400" />
                  <input
                    type="password"
                    className="input-field pl-9"
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    disabled={status === 'saving'}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-garden-700 mb-1.5">Confirm password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-garden-400" />
                  <input
                    type="password"
                    className="input-field pl-9"
                    placeholder="Re-enter your password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    disabled={status === 'saving'}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  />
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>
              )}

              <button
                onClick={handleSubmit}
                disabled={status === 'saving'}
                className="btn-primary w-full justify-center py-3 disabled:opacity-50">
                {status === 'saving' ? 'Saving...' : 'Update password'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
