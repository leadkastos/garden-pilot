import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../../lib/AuthContext'
import { supabase } from '../../lib/supabase'
import {
  LayoutDashboard, Calendar, Leaf, Grid3x3, Receipt,
  BarChart3, ShoppingBag, Bell, ChevronDown, LogOut,
  User, Sprout, X
} from 'lucide-react'

const navItems = [
  { to: '/',          label: 'Dashboard',    icon: LayoutDashboard, end: true },
  { to: '/calendar',  label: 'Calendar',     icon: Calendar },
  { to: '/plants',    label: 'My Plants',    icon: Leaf },
  { to: '/beds',      label: 'Garden Beds',  icon: Grid3x3 },
  { to: '/expenses',  label: 'Garden Ledger', icon: Receipt },
  { to: '/reports',   label: 'Reports',      icon: BarChart3 },
  { to: '/shop',      label: 'Shop',         icon: ShoppingBag },
]

const mockNotifications = [
  { id: 1, type: 'frost', title: 'Frost warning tonight', body: 'Low of 31°F — bring sensitive plants inside', time: '2h ago', unread: true },
  { id: 2, type: 'task',  title: 'Time to water Tomato Bed', body: 'It\'s been 3 days since last watering', time: '5h ago', unread: true },
  { id: 3, type: 'system', title: 'Weekly report ready', body: 'Your week 12 garden report is ready to view', time: '1d ago', unread: false },
]

export default function Layout() {
  const { profile, user } = useAuth()
  const navigate = useNavigate()
  const [showNotifs, setShowNotifs] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [notifs, setNotifs] = useState(mockNotifications)

  const unreadCount = notifs.filter(n => n.unread).length
  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2)
    : user?.email?.[0]?.toUpperCase() ?? 'GP'

  const markAllRead = () => setNotifs(n => n.map(x => ({ ...x, unread: false })))

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const notifIcon = (type) => {
    if (type === 'frost') return '❄️'
    if (type === 'task')  return '✅'
    return '📋'
  }

  return (
    <div className="min-h-screen bg-parchment">
      {/* Top Nav */}
      <nav className="bg-garden-800 shadow-nav sticky top-0 z-50">
        <div className="max-w-screen-xl mx-auto px-4 h-14 flex items-center justify-between">

          {/* Logo */}
          <div className="flex items-center gap-3 mr-6 flex-shrink-0">
            <div className="w-8 h-8 bg-garden-500 rounded-xl flex items-center justify-center">
              <Sprout size={16} className="text-white" />
            </div>
            <span className="font-display text-white text-lg font-semibold tracking-tight">
              Garden Pilot
            </span>
          </div>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-1 flex-1">
            {navItems.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-garden-600 text-white'
                      : 'text-garden-300 hover:bg-garden-700 hover:text-white'
                  }`
                }
              >
                <Icon size={14} />
                {label}
              </NavLink>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 ml-4">

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => { setShowNotifs(!showNotifs); setShowProfile(false) }}
                className="relative w-9 h-9 rounded-xl bg-garden-700 hover:bg-garden-600 flex items-center justify-center transition-colors"
              >
                <Bell size={16} className="text-garden-200" />
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
                    {notifs.map(n => (
                      <div key={n.id} className={`px-4 py-3 hover:bg-garden-50 transition-colors ${n.unread ? 'bg-garden-50/50' : ''}`}>
                        <div className="flex gap-3">
                          <span className="text-base mt-0.5">{notifIcon(n.type)}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-medium text-garden-900 truncate">{n.title}</p>
                              {n.unread && <div className="w-2 h-2 bg-garden-500 rounded-full flex-shrink-0" />}
                            </div>
                            <p className="text-xs text-garden-500 mt-0.5 line-clamp-2">{n.body}</p>
                            <p className="text-[11px] text-garden-400 mt-1">{n.time}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="px-4 py-3 border-t border-garden-100 text-center">
                    <button className="text-xs text-garden-600 hover:text-garden-800 font-medium">View all notifications</button>
                  </div>
                </div>
              )}
            </div>

            {/* Profile */}
            <div className="relative">
              <button
                onClick={() => { setShowProfile(!showProfile); setShowNotifs(false) }}
                className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl bg-garden-700 hover:bg-garden-600 transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-garden-500 flex items-center justify-center text-white text-xs font-medium">
                  {initials}
                </div>
                <span className="text-sm text-garden-200 hidden sm:block max-w-[100px] truncate">
                  {profile?.full_name || user?.email}
                </span>
                <ChevronDown size={12} className="text-garden-400" />
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
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <main className="max-w-screen-xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
