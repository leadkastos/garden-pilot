import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Sprout, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('login') // login | signup | forgot
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
      else navigate('/')

    } else if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } }
      })
      if (error) {
        setError(error.message)
      } else {
        if (data.user) {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            full_name: name,
            display_name: displayName || name.split(' ')[0],
            email,
            subscription_status: 'trial',
            trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            created_at: new Date().toISOString()
          })
        }
        setSuccess('Account created! Check your email to confirm, then sign in.')
        setMode('login')
      }

    } else if (mode === 'forgot') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })
      if (error) setError(error.message)
      else setSuccess('Password reset email sent! Check your inbox.')
    }

    setLoading(false)
  }

  const switchMode = (newMode) => {
    setMode(newMode)
    setError('')
    setSuccess('')
  }

  const titles = {
    login: 'Welcome back',
    signup: 'Start growing',
    forgot: 'Reset password'
  }

  const subtitles = {
    login: 'Sign in to your garden dashboard',
    signup: 'Create your free 30-day trial account',
    forgot: 'Enter your email and we\'ll send a reset link'
  }

  return (
    <div className="min-h-screen bg-parchment flex">

      {/* Left panel — brand */}
      <div className="hidden lg:flex lg:w-1/2 bg-garden-800 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="absolute rounded-full border border-garden-300"
              style={{
                width: `${(i+1)*120}px`, height: `${(i+1)*120}px`,
                top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                opacity: 1 - i * 0.1
              }} />
          ))}
        </div>
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-garden-500 rounded-xl flex items-center justify-center">
              <Sprout size={20} className="text-white" />
            </div>
            <span className="font-display text-white text-2xl font-semibold">Garden Pilot</span>
          </div>
        </div>
        <div className="relative">
          <blockquote className="font-display text-3xl text-white font-medium leading-snug mb-6">
            "Your smart guide to a better garden."
          </blockquote>
          <p className="text-garden-300 text-sm leading-relaxed max-w-sm">
            Plan your seasons, track every plant, log expenses, and get smart alerts — all in one beautiful dashboard built for serious gardeners.
          </p>
          <div className="flex items-center gap-6 mt-8">
            {['Smart scheduling', 'Weather alerts', 'Harvest tracking'].map(f => (
              <div key={f} className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-garden-400" />
                <span className="text-garden-300 text-xs">{f}</span>
              </div>
            ))}
          </div>
          {/* Trial callout */}
          <div className="mt-8 p-4 bg-garden-700 rounded-2xl border border-garden-600">
            <p className="text-garden-300 text-xs font-medium mb-1">🌱 Free 30-day trial</p>
            <p className="text-white text-sm font-medium">Then just $9.95/month</p>
            <p className="text-garden-400 text-xs mt-1">Cancel anytime · No credit card required to start</p>
          </div>
        </div>
        <div className="relative text-garden-500 text-xs">
          © 2026 Garden Pilot · TheGardenPilot.com
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-garden-600 rounded-xl flex items-center justify-center">
              <Sprout size={14} className="text-white" />
            </div>
            <span className="font-display text-garden-900 text-xl font-semibold">Garden Pilot</span>
          </div>

          <h1 className="font-display text-3xl font-semibold text-garden-900 mb-2">
            {titles[mode]}
          </h1>
          <p className="text-garden-500 text-sm mb-8">
            {subtitles[mode]}
          </p>

          {/* Trial badge — signup only */}
          {mode === 'signup' && (
            <div className="mb-6 p-3 bg-garden-50 border border-garden-200 rounded-xl flex items-center gap-3">
              <span className="text-2xl">🌱</span>
              <div>
                <p className="text-sm font-medium text-garden-800">30-day free trial</p>
                <p className="text-xs text-garden-500">Then $9.95/month · Cancel anytime</p>
              </div>
            </div>
          )}

          {/* Error / Success messages */}
          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 px-4 py-3 bg-garden-50 border border-garden-200 rounded-xl text-garden-700 text-sm">
              ✅ {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Signup fields */}
            {mode === 'signup' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-garden-700 mb-1.5">Full name</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)}
                    placeholder="Sarah Johnson" required className="input-field" autoFocus />
                </div>
                <div>
                  <label className="block text-xs font-medium text-garden-700 mb-1.5">
                    Display name <span className="text-garden-400 font-normal">(shown in Community)</span>
                  </label>
                  <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)}
                    placeholder="e.g. GardenGuru_Sarah, ZinniaQueen" className="input-field" />
                  <p className="text-xs text-garden-400 mt-1">This is how other gardeners will see you</p>
                </div>
              </>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-garden-700 mb-1.5">Email address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" required className="input-field"
                autoFocus={mode !== 'signup'} />
            </div>

            {/* Password — not shown for forgot */}
            {mode !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-garden-700">Password</label>
                  {mode === 'login' && (
                    <button type="button" onClick={() => switchMode('forgot')}
                      className="text-xs text-garden-500 hover:text-garden-700 underline-offset-2 hover:underline">
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••" required className="input-field pr-10"
                    minLength={mode === 'signup' ? 8 : undefined} />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-garden-400 hover:text-garden-600">
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {mode === 'signup' && (
                  <p className="text-xs text-garden-400 mt-1">Minimum 8 characters</p>
                )}
              </div>
            )}

            {/* Submit button */}
            <button type="submit" disabled={loading}
              className="w-full btn-primary justify-center py-3 text-base mt-2 disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : mode === 'login' ? 'Sign in'
                : mode === 'signup' ? 'Start free trial'
                : 'Send reset link'}
            </button>
          </form>

          {/* Mode switcher */}
          <div className="text-center mt-6 space-y-2">
            {mode === 'login' && (
              <p className="text-sm text-garden-500">
                Don't have an account?{' '}
                <button onClick={() => switchMode('signup')}
                  className="text-garden-700 font-medium hover:text-garden-900 underline-offset-2 hover:underline">
                  Start free trial
                </button>
              </p>
            )}
            {mode === 'signup' && (
              <p className="text-sm text-garden-500">
                Already have an account?{' '}
                <button onClick={() => switchMode('login')}
                  className="text-garden-700 font-medium hover:text-garden-900 underline-offset-2 hover:underline">
                  Sign in
                </button>
              </p>
            )}
            {mode === 'forgot' && (
              <p className="text-sm text-garden-500">
                Remember your password?{' '}
                <button onClick={() => switchMode('login')}
                  className="text-garden-700 font-medium hover:text-garden-900 underline-offset-2 hover:underline">
                  Back to sign in
                </button>
              </p>
            )}
          </div>

          {/* Terms */}
          {mode === 'signup' && (
            <p className="text-center text-xs text-garden-400 mt-4">
              By signing up you agree to our Terms of Service and Privacy Policy
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
