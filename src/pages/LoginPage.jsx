import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Sprout, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
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
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) { setError(error.message) }
      else {
        if (data.user) {
          await supabase.from('profiles').insert({
            id: data.user.id,
            full_name: name,
            email,
            created_at: new Date().toISOString()
          })
        }
        setSuccess('Account created! Check your email to confirm, then sign in.')
        setMode('login')
      }
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-parchment flex">
      {/* Left panel - illustration/brand */}
      <div className="hidden lg:flex lg:w-1/2 bg-garden-800 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="absolute rounded-full border border-garden-300"
              style={{
                width: `${(i+1)*120}px`, height: `${(i+1)*120}px`,
                top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                opacity: 1 - i * 0.1
              }}
            />
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
            {['Smart scheduling','Weather alerts','Harvest tracking'].map(f => (
              <div key={f} className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-garden-400" />
                <span className="text-garden-300 text-xs">{f}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="relative text-garden-500 text-xs">
          © 2026 Garden Pilot · TheGardenPilot.com
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-garden-600 rounded-xl flex items-center justify-center">
              <Sprout size={14} className="text-white" />
            </div>
            <span className="font-display text-garden-900 text-xl font-semibold">Garden Pilot</span>
          </div>

          <h1 className="font-display text-3xl font-semibold text-garden-900 mb-2">
            {mode === 'login' ? 'Welcome back' : 'Start growing'}
          </h1>
          <p className="text-garden-500 text-sm mb-8">
            {mode === 'login' ? 'Sign in to your garden dashboard' : 'Create your free Garden Pilot account'}
          </p>

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 px-4 py-3 bg-garden-50 border border-garden-200 rounded-xl text-garden-700 text-sm">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-medium text-garden-700 mb-1.5">Full name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="Sarah Johnson" required className="input-field" />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-garden-700 mb-1.5">Email address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" required className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-medium text-garden-700 mb-1.5">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required className="input-field pr-10" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-garden-400 hover:text-garden-600">
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full btn-primary justify-center py-2.5 text-base mt-2 disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-sm text-garden-500 mt-6">
            {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError('') }}
              className="text-garden-700 font-medium hover:text-garden-900 underline-offset-2 hover:underline">
              {mode === 'login' ? 'Sign up free' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
