import { Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { User, MapPin, Mail, Leaf, Flower2, Sprout } from 'lucide-react'

export default function ProfilePage() {
  const { profile, user } = useAuth()
  const initials = profile?.full_name?.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2) || 'GP'

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h1 className="font-display text-3xl font-semibold text-garden-900">My profile</h1>
        <p className="text-garden-500 text-sm mt-1">Manage your account and garden trackers</p>
      </div>
      <div className="card flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-garden-600 flex items-center justify-center text-white text-xl font-display font-semibold flex-shrink-0">
          {initials}
        </div>
        <div>
          <h2 className="font-display text-xl font-semibold text-garden-900">{profile?.full_name || 'Gardener'}</h2>
          <p className="text-garden-500 text-sm flex items-center gap-1 mt-1"><Mail size={13} />{user?.email}</p>
          {profile?.location && <p className="text-garden-500 text-sm flex items-center gap-1 mt-0.5"><MapPin size={13} />{profile.location}</p>}
        </div>
      </div>
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
