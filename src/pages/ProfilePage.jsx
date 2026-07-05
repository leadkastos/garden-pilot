import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { User, MapPin, Mail, Leaf, Flower2, Sprout, Pencil, Check, X, Loader2, Camera } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { compressImage } from '../lib/imageCompress'
export default function ProfilePage() {
  const { profile, user, refreshProfile } = useAuth()
  const [editing, setEditing] = useState(false)
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [displayName, setDisplayName] = useState(profile?.display_name || '')
  const [location, setLocation] = useState(profile?.location || '')
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '')
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [savedMsg, setSavedMsg] = useState(false)

  const initials = (profile?.display_name || profile?.full_name)?.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2) || 'GP'

  const startEdit = () => {
    setFullName(profile?.full_name || '')
    setDisplayName(profile?.display_name || '')
    setLocation(profile?.location || '')
    setAvatarUrl(profile?.avatar_url || '')
    setError('')
    setEditing(true)
  }

  const handleAvatarSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    if (!file.type.startsWith('image/')) { setError('Please choose an image file.'); return }
    if (file.size > 10 * 1024 * 1024) { setError('Image must be under 10MB.'); return }
    setAvatarUploading(true)
    try {
      const compressed = await compressImage(file, { maxDim: 400, quality: 0.85 })
      const path = `avatars/${user.id}/${Date.now()}.jpg`
      const { error: upErr } = await supabase.storage
        .from('plant-photos')
        .upload(path, compressed, { cacheControl: '3600', upsert: false, contentType: 'image/jpeg' })
      if (upErr) throw upErr
      const { data: { publicUrl } } = supabase.storage.from('plant-photos').getPublicUrl(path)
      setAvatarUrl(publicUrl)
    } catch (err) {
      setError(err.message || 'Upload failed.')
    } finally {
      setAvatarUploading(false)
    }
  }

  const handleSave = async () => {
    setError('')
    if (!fullName.trim()) {
      setError('Please enter your name.')
      return
    }
    setSaving(true)
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim(),
        display_name: displayName.trim() || fullName.trim().split(' ')[0],
        location: location.trim() || null,
        avatar_url: avatarUrl || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
    setSaving(false)
    if (updateError) {
      setError(updateError.message)
      return
    }
    if (typeof refreshProfile === 'function') {
      await refreshProfile()
    }
    setEditing(false)
    setSavedMsg(true)
    setTimeout(() => setSavedMsg(false), 2500)
  }

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h1 className="font-display text-3xl font-semibold text-garden-900">My profile</h1>
        <p className="text-garden-500 text-sm mt-1">Manage your account and garden trackers</p>
      </div>

      {savedMsg && (
        <div className="card bg-garden-50 border-garden-200 flex items-center gap-2 py-3">
          <Check size={16} className="text-garden-600" />
          <span className="text-sm text-garden-700 font-medium">Profile updated</span>
        </div>
      )}

      {/* Profile card */}
      {!editing ? (
        <div className="card">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-garden-600 flex items-center justify-center text-white text-xl font-display font-semibold flex-shrink-0 overflow-hidden">
                {profile?.avatar_url
                  ? <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
                  : initials}
              </div>
              <div>
                <h2 className="font-display text-xl font-semibold text-garden-900">{profile?.full_name || 'Gardener'}</h2>
                {profile?.display_name && (
                  <p className="text-garden-500 text-sm mt-0.5">
                    Community name: <span className="font-medium text-garden-700">{profile.display_name}</span>
                  </p>
                )}
                <p className="text-garden-500 text-sm flex items-center gap-1 mt-1"><Mail size={13} />{user?.email}</p>
                {profile?.location && <p className="text-garden-500 text-sm flex items-center gap-1 mt-0.5"><MapPin size={13} />{profile.location}</p>}
              </div>
            </div>
            <button onClick={startEdit} className="btn-secondary text-sm flex-shrink-0">
              <Pencil size={14} /> Edit
            </button>
          </div>
        </div>
      ) : (
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-garden-900">Edit profile</h2>
            <button onClick={() => setEditing(false)} className="text-garden-400 hover:text-garden-600">
              <X size={18} />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-garden-600 flex items-center justify-center text-white text-2xl font-display font-semibold flex-shrink-0 overflow-hidden">
              {avatarUrl
                ? <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                : initials}
            </div>
            <div className="flex flex-col gap-2">
              <label className={`btn-secondary text-sm cursor-pointer ${avatarUploading ? 'opacity-60' : ''}`}>
                {avatarUploading
                  ? <><Loader2 size={14} className="animate-spin" /> Uploading...</>
                  : <><Camera size={14} /> {avatarUrl ? 'Change photo' : 'Upload photo'}</>}
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarSelect} disabled={avatarUploading} />
              </label>
              {avatarUrl && (
                <button onClick={() => setAvatarUrl('')} className="text-xs text-red-500 hover:text-red-600 text-left">
                  Remove photo
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-garden-700 mb-1.5">Full name</label>
            <input className="input-field" placeholder="Your name"
              value={fullName} onChange={e => setFullName(e.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-medium text-garden-700 mb-1.5">
              Community display name <span className="text-garden-400 font-normal">(shown on your posts)</span>
            </label>
            <input className="input-field" placeholder="e.g. ZinniaQueen, GardenGuru_Sarah"
              value={displayName} onChange={e => setDisplayName(e.target.value)} />
            <p className="text-xs text-garden-400 mt-1">Leave blank to use your first name.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-garden-700 mb-1.5">
              Location <span className="text-garden-400 font-normal">(optional)</span>
            </label>
            <input className="input-field" placeholder="e.g. Franklin, TN"
              value={location} onChange={e => setLocation(e.target.value)} />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>
          )}

          <div className="flex gap-3 pt-1">
            <button onClick={() => setEditing(false)} className="btn-secondary flex-1 justify-center py-2.5 text-sm">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving}
              className="btn-primary flex-1 justify-center py-2.5 text-sm disabled:opacity-50">
              {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><Check size={14} /> Save changes</>}
            </button>
          </div>
        </div>
      )}

      {/* Trackers */}
      <div className="card">
        <h3 className="section-title">My trackers</h3>
        <p className="text-sm text-garden-500 mb-4">Access your detailed plant tracking spreadsheets</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label:'Flower tracker', icon: Flower2, to:'/profile/flowers', color:'bg-pink-50 border-pink-200 text-pink-700', desc:'Track stems & harvest cycles' },
            { label:'Vegetable tracker', icon: Sprout, to:'#', color:'bg-garden-50 border-garden-200 text-garden-700', desc:'Coming soon' },
            { label:'Herb tracker', icon: Leaf, to:'#', color:'bg-emerald-50 border-emerald-200 text-emerald-700', desc:'Coming soon' },
          ].map(({label,icon:Icon,to,color,desc}) => (
            <Link key={label} to={to}
              className={`border rounded-2xl p-4 hover:shadow-card-hover transition-all ${color}`}>
              <Icon size={20} className="mb-2" />
              <div className="font-medium text-sm">{label}</div>
              <div className="text-xs opacity-70 mt-0.5">{desc}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
