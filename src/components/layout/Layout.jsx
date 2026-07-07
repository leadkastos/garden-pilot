import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../../lib/AuthContext'
import { supabase } from '../../lib/supabase'
import { generateNotifications } from '../../lib/notifications'
import {
  LayoutDashboard, Calendar, Leaf, Grid3x3, Receipt,
  BarChart3, Bell, ChevronDown, LogOut,
  User, X, BookOpen, Users, Menu, Trash2
} from 'lucide-react'

const navItems = [
  { to: '/',          label: 'Dashboard',    icon: LayoutDashboard, end: true },
  { to: '/calendar',  label: 'Calendar',     icon: Calendar },
  { to: '/plants',    label: 'My Plants',    icon: Leaf },
  { to: '/beds',      label: 'My Beds',      icon: Grid3x3 },
  { to: '/journal',   label: 'My Journal',   icon: BookOpen },
  { to: '/expenses',  label: 'Garden Ledger', icon: Receipt },
  { to: '/reports',   label: 'Reports',      icon: BarChart3 },
  { to: '/community', label: 'Community',    icon: Users },
]

export default function Layout() {
  const { profile, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [showNotifs, setShowNotifs] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [notifs, setNotifs] = useState([])

  // Generate + load notifications once when user/profile are ready
  useEffect(() => {
    if (!user) return
    let cancelled = false
    generateNotifications(user.id, profile).then((rows) => {
      if (!cancelled) setNotifs(rows)
    })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, profile?.last_spring_frost, profile?.first_fall_frost])

  useEffect(() => {
    setShowMobileMenu(false)
    setShowNotifs(false)
    setShowProfile(false)
  }, [location.pathname])

  useEffect(() => {
    if (showMobileMenu) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [showMobileMenu])

  const unreadCount = notifs.filter(n => !n.read).length
  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2)
    : user?.email?.[0]?.toUpperCase() ?? 'GP'

  const markAllRead = async () => {
    setNotifs(n => n.map(x => ({ ...x, read: true })))
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false)
  }

  const deleteOne = async (id) => {
    const target = notifs.find(x => x.id === id)
    setNotifs(n => n.filter(x => x.id !== id))
    await supabase.from('notifications').delete().eq('id', id).eq('user_id', user.id)
    if (target?.link) {
      await supabase.from('dismissed_notifications')
        .upsert({ user_id: user.id, notif_key: target.link }, { onConflict: 'user_id,notif_key' })
    }
  }

  const clearAll = async () => {
    const keys = notifs.map(x => x.link).filter(Boolean)
    setNotifs([])
    await supabase.from('notifications').delete().eq('user_id', user.id)
    if (keys.length) {
      await supabase.from('dismissed_notifications')
        .upsert(keys.map(k => ({ user_id: user.id, notif_key: k })), { onConflict: 'user_id,notif_key' })
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const notifIcon = (type) => {
    if (type === 'frost') return '❄️'
    if (type === 'heat')  return '🔥'
    if (type === 'season') return '🍂'
    if (type === 'task')  return '✅'
    return '📋'
  }

  const timeAgo = (iso) => {
    try {
      const d = new Date(iso)
      const diff = Math.floor((Date.now() - d) / 1000)
      if (diff < 60) return 'just now'
      if (diff < 3600) return `${Math.floor(diff/60)}m ago`
      if (diff < 86400) return `${Math.floor(diff/3600)}h ago`
      return `${Math.floor(diff/86400)}d ago`
    } catch { return '' }
  }

  return (
    <div className="min-h-screen bg-parchment">
      {/* Top Nav — Deep Forest Green */}
      <nav className="sticky top-0 z-50 shadow-nav" style={{ backgroundColor: '#1e3d1a' }}>
        <div className="max-w-screen-xl mx-auto px-4 h-14 flex items-center justify-between">

          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
            <img src="/Garden-Navi-Logo.png" alt="Garden Navi" className="h-14 w-auto" />
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-1 flex-1 mx-6">
            {navItems.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'text-white'
                      : 'text-green-300 hover:text-white'
                  }`
                }
                style={({ isActive }) => isActive ? { backgroundColor: 'rgba(255,255,255,0.15)' } : {}}>
                <Icon size={14} />
                {label}
              </NavLink>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => { setShowNotifs(!showNotifs); setShowProfile(false); setShowMobileMenu(false) }}
                className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-white/10"
                style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
                <Bell size={16} className="text-green-200" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifs && (
                <div className="absolute right-0 top-11 w-80 bg-white rounded-2xl shadow-xl border border-garden-100 overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-garden-100 flex items-center justify-between">
                    <span className="text-sm font-medium text-garden-900">Notifications</span>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button onClick={markAllRead} className="text-xs text-garden-500 hover:text-garden-700">Mark all read</button>
                      )}
                      <button onClick={() => setShowNotifs(false)}><X size={14} className="text-garden-400" /></button>
                    </div>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-garden-50">
                    {notifs.length === 0 ? (
                      <div className="px-4 py-10 text-center">
                        <p className="text-sm text-garden-400">You're all caught up 🌱</p>
                      </div>
                    ) : notifs.map(n => (
                      <div key={n.id} className={`px-4 py-3 hover:bg-garden-50 transition-colors group ${!n.read ? 'bg-garden-50/50' : ''}`}>
                        <div className="flex gap-3">
                          <span className="text-base mt-0.5">{notifIcon(n.type)}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-medium text-garden-900 truncate">{n.title}</p>
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                {!n.read && <div className="w-2 h-2 bg-garden-500 rounded-full" />}
                                <button onClick={() => deleteOne(n.id)}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity text-garden-300 hover:text-red-500"
                                  title="Delete">
                                  <X size={13} />
                                </button>
                              </div>
                            </div>
                            <p className="text-xs text-garden-500 mt-0.5 line-clamp-2">{n.body}</p>
                            <p className="text-[11px] text-garden-400 mt-1">{timeAgo(n.created_at)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {notifs.length > 0 && (
                    <div className="px-4 py-3 border-t border-garden-100 text-center">
                      <button onClick={clearAll}
                        className="text-xs text-red-500 hover:text-red-600 font-medium flex items-center gap-1.5 mx-auto">
                        <Trash2 size={12} /> Clear all notifications
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Profile — desktop only */}
            <div className="relative hidden lg:block">
              <button
                onClick={() => { setShowProfile(!showProfile); setShowNotifs(false) }}
                className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl transition-colors hover:bg-white/10"
                style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
                <div className="w-7 h-7 rounded-lg bg-green-700 flex items-center justify-center text-white text-xs font-medium overflow-hidden">
                  {profile?.avatar_url
                    ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                    : initials}
                </div>
                <span className="text-sm text-green-200 max-w-[100px] truncate">
                  {profile?.full_name || user?.email}
                </span>
                <ChevronDown size={12} className="text-green-400" />
              </button>

              {showProfile && (
                <div className="absolute right-0 top-11 w-52 bg-white rounded-2xl shadow-xl border border-garden-100 overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-garden-100">
                    <p className="text-sm font-medium text-garden-900 truncate">{profile?.full_name || 'Gardener'}</p>
                    <p className="text-xs text-garden-500 truncate">{user?.email}</p>
                  </div>
                  <div className="py-1">
                    <button onClick={() => { navigate('/profile'); setShowProfile(false) }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-garden-700 hover:bg-garden-50 transition-colors">
                      <User size={14} /> My Profile
                    </button>
                    <button onClick={() => { navigate('/profile/flowers'); setShowProfile(false) }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-garden-700 hover:bg-garden-50 transition-colors">
                      <Leaf size={14} /> Flower Tracker
                    </button>
                  </div>
                  <div className="border-t border-garden-100 py-1">
                    <button onClick={handleSignOut}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                      <LogOut size={14} /> Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Hamburger — mobile only */}
            <button
              onClick={() => { setShowMobileMenu(!showMobileMenu); setShowNotifs(false); setShowProfile(false) }}
              className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-white/10"
              style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
              {showMobileMenu
                ? <X size={18} className="text-white" />
                : <Menu size={18} className="text-white" />
              }
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileMenu(false)} />
          <div className="relative w-72 max-w-[85vw] flex flex-col h-full shadow-2xl" style={{ backgroundColor: '#162d12' }}>

            {/* Mobile menu header with logo */}
            <div className="px-5 py-4 border-b border-white/10">
              <img src="/Garden-Navi-Logo.png" alt="Garden Navi" className="h-8 w-auto mb-3" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-700 flex items-center justify-center text-white font-medium overflow-hidden">
                  {profile?.avatar_url
                    ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                    : initials}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{profile?.full_name || 'Gardener'}</p>
                  <p className="text-xs text-green-400 truncate">{user?.email}</p>
                </div>
              </div>
            </div>

            {/* Mobile nav links */}
            <div className="flex-1 overflow-y-auto py-3 px-3">
              {navItems.map(({ to, label, icon: Icon, end }) => (
                <NavLink key={to} to={to} end={end}
                  onClick={() => setShowMobileMenu(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl mb-1 text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-white/15 text-white'
                        : 'text-green-300 hover:bg-white/10 hover:text-white'
                    }`
                  }>
                  <Icon size={18} />
                  {label}
                </NavLink>
              ))}
            </div>

            {/* Mobile menu footer */}
            <div className="px-3 py-4 border-t border-white/10 space-y-1">
              <button onClick={() => { navigate('/profile'); setShowMobileMenu(false) }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-green-300 hover:bg-white/10 hover:text-white transition-all">
                <User size={18} /> My Profile
              </button>
              <button onClick={() => { navigate('/profile/flowers'); setShowMobileMenu(false) }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-green-300 hover:bg-white/10 hover:text-white transition-all">
                <Leaf size={18} /> Flower Tracker
              </button>
              <button onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-red-400 hover:bg-red-900/30 transition-all">
                <LogOut size={18} /> Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page Content */}
      <main className="max-w-screen-xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
