import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  CheckCircle2, Circle, AlertTriangle, Zap,
  Leaf, Sprout, Flower2, ChevronRight,
  DollarSign, TrendingUp, TrendingDown, Camera,
  CalendarDays, BarChart3, Plus
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
// Weather API using Open-Meteo (free, no API key needed)
const fetchWeather = async (lat, lon) => {
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weathercode,windspeed_10m&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_probability_max&temperature_unit=fahrenheit&timezone=auto&forecast_days=4`
    )
    return await res.json()
  } catch (e) { return null }
}
// Convert a US zip code to { lat, lon, name } using the free Zippopotam API
const geocodeZip = async (zip) => {
  try {
    const res = await fetch(`https://api.zippopotam.us/us/${zip}`)
    if (!res.ok) return null
    const data = await res.json()
    const place = data.places?.[0]
    if (!place) return null
    return {
      lat: parseFloat(place.latitude),
      lon: parseFloat(place.longitude),
      name: `${place['place name']}, ${place['state abbreviation']}`,
    }
  } catch (e) { return null }
}
const getWeatherDesc = (code) => {
  if (code === 0) return 'Clear sky'
  if (code <= 3) return 'Partly cloudy'
  if (code <= 48) return 'Foggy'
  if (code <= 67) return 'Rainy'
  if (code <= 77) return 'Snowy'
  if (code <= 82) return 'Showers'
  if (code <= 99) return 'Thunderstorms'
  return 'Mixed'
}
const getWeatherEmoji = (code) => {
  if (code === 0) return '☀️'
  if (code <= 3) return '⛅'
  if (code <= 48) return '🌫️'
  if (code <= 67) return '🌧️'
  if (code <= 77) return '❄️'
  if (code <= 82) return '🌦️'
  if (code <= 99) return '⛈️'
  return '🌤️'
}
// Save today's weather to the calendar once per day (going forward).
const captureWeatherToCalendar = async (userId, weatherData) => {
  if (!userId || !weatherData?.current) return
  const today = new Date().toISOString().slice(0, 10)
  // Already captured today? skip.
  const { data: existing } = await supabase
    .from('calendar_events')
    .select('id')
    .eq('user_id', userId)
    .eq('date', today)
    .eq('type', 'frost')
    .eq('auto', true)
    .limit(1)
  if (existing && existing.length) return

  const code = weatherData.current.weathercode
  const low = weatherData.daily?.temperature_2m_min?.[0]
  const high = weatherData.daily?.temperature_2m_max?.[0]

  // Decide the label + icon
  let icon = getWeatherEmoji(code)
  let label
  if (low !== undefined && low <= 32) { icon = '🥶'; label = 'Freeze warning' }
  else if (code === 0) label = 'Sunny day'
  else if (code <= 3) label = 'Partly cloudy'
  else if (code <= 48) label = 'Foggy'
  else if (code <= 67) label = 'Rainy day'
  else if (code <= 77) { icon = '❄️'; label = 'Snow' }
  else if (code <= 82) label = 'Showers'
  else if (code <= 99) label = 'Thunderstorms'
  else label = 'Mixed conditions'

  const tempNote = (high !== undefined && low !== undefined)
    ? `High ${Math.round(high)}° / Low ${Math.round(low)}°`
    : ''

  await supabase.from('calendar_events').insert({
    user_id: userId,
    title: `${icon} ${label}`,
    date: today,
    type: 'frost',
    auto: true,
    notes: tempNote,
  })
}
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
export default function DashboardPage() {
  const { user, profile } = useAuth()
  const [userData, setUserData] = useState(null)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelDone, setCancelDone] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [weather, setWeather] = useState(null)
  const [weatherLoading, setWeatherLoading] = useState(true)
  const [location, setLocation] = useState('Your area')
  const [tasks, setTasks] = useState([])
  // Load all data from Supabase
  useEffect(() => {
    if (!user) return
    loadData()
  }, [user])
  const loadData = async () => {
    const [plantsRes, bedsRes, expensesRes, revenueRes, calendarRes, journalRes] = await Promise.all([
      supabase.from('plants').select('*').eq('user_id', user.id),
      supabase.from('beds').select('*').eq('user_id', user.id),
      supabase.from('expenses').select('*').eq('user_id', user.id),
      supabase.from('revenue').select('*').eq('user_id', user.id),
      supabase.from('calendar_events').select('*').eq('user_id', user.id),
      supabase.from('journal_entries').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    ])
    const plants = plantsRes.data || []
    const beds = bedsRes.data || []
    const expenses = expensesRes.data || []
    const revenue = revenueRes.data || []
    const calendarEvents = calendarRes.data || []
    const journalEntries = journalRes.data || []
    // Today's date
    const today = new Date().toISOString().slice(0,10)
    const in3Days = new Date(Date.now() + 3 * 86400000).toISOString().slice(0,10)
    // Today's calendar events as tasks
    const todayEvents = calendarEvents.filter(e => e.date === today)
    // All upcoming events for the next 30 days
    const next30 = new Date(Date.now() + 30 * 86400000).toISOString().slice(0,10)
    const allUpcoming = calendarEvents
      .filter(e => e.date >= today && e.date <= next30)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 6)
    // Plant category counts
    const vegCount = plants.filter(p =>
      p.category === 'Vegetable' ||
      ['Tomato','Pepper','Cucumber','Lettuce','Carrot','Bean','Corn','Squash','Onion','Potato','Eggplant','Broccoli','Spinach','Kale'].some(v =>
        p.name?.toLowerCase().includes(v.toLowerCase())
      )).length
    const flowerCount = plants.filter(p =>
      p.category === 'Flower' || ['Zinnia','Sunflower','Rose','Dahlia','Peony','Marigold'].some(f =>
        p.name?.toLowerCase().includes(f.toLowerCase())
      )).length
    const herbCount = plants.filter(p =>
      p.category === 'Herb' || ['Basil','Rosemary','Mint','Thyme','Sage','Cilantro','Dill'].some(h =>
        p.name?.toLowerCase().includes(h.toLowerCase())
      )).length
    // Financial totals for current year
    const year = new Date().getFullYear().toString()
    const yearExpenses = expenses.filter(e => e.date?.startsWith(year))
    const yearRevenue = revenue.filter(r => r.date?.startsWith(year))
    const totalSpent = yearExpenses.reduce((s, e) => s + (parseFloat(e.cost) || 0), 0)
    const totalRevenue2 = yearRevenue.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0)
    // Plants needing attention
    const needsBed = plants.filter(p => !p.bed_id && p.status !== 'Unplanted')
    const unplanted = plants.filter(p => p.status === 'Unplanted')
    const harvestReady = plants.filter(p => p.status === 'Harvesting')
    // Build tasks from real data
    const generatedTasks = []
    todayEvents.forEach(e => {
      generatedTasks.push({ id: `cal-${e.id}`, text: e.title, done: false, badge: 'Calendar', badgeClass: 'badge-blue', urgent: false })
    })
    harvestReady.forEach(p => {
      generatedTasks.push({ id: `harvest-${p.id}`, text: `Harvest ${p.name}`, done: false, badge: 'Harvest', badgeClass: 'badge-amber', urgent: true })
    })
    needsBed.slice(0,2).forEach(p => {
      generatedTasks.push({ id: `bed-${p.id}`, text: `Assign ${p.name} to a bed`, done: false, badge: 'Setup', badgeClass: 'badge-soil', urgent: false })
    })
    unplanted.slice(0,2).forEach(p => {
      generatedTasks.push({ id: `logged-${p.id}`, text: `${p.name} seeds logged — plant when ready`, done: false, badge: 'Logged', badgeClass: 'badge-soil', urgent: false })
    })
    setTasks(generatedTasks.slice(0, 6))
    // Recent photos from plants
    const photos = plants.filter(p => p.photo_url).map(p => ({
      url: p.photo_url, label: p.name
    }))
    setUserData({
      plants,
      beds,
      vegCount: vegCount || 0,
      flowerCount: flowerCount || 0,
      herbCount: herbCount || 0,
      totalPlants: plants.length,
      totalSpent,
      totalRevenue: totalRevenue2,
      allUpcoming,
      journalCount: journalEntries.length,
      recentJournal: journalEntries.slice(0, 1)[0] || null,
      harvestReady: harvestReady.length,
      photos,
    })
  }
  // Get weather — zip code first (reliable, no permission prompt), geolocation as fallback
  useEffect(() => {
    if (!user) return
    let cancelled = false
    setWeatherLoading(true)

    const loadByCoords = async (lat, lon, name) => {
      const data = await fetchWeather(lat, lon)
      if (cancelled) return
      if (name) setLocation(name)
      setWeather(data)
      setWeatherLoading(false)
      captureWeatherToCalendar(user.id, data)
    }

    const run = async () => {
      // 1. Try the user's saved zip code
      const zip = profile?.zip_code
      if (zip && /^\d{5}$/.test(zip)) {
        const geo = await geocodeZip(zip)
        if (geo && !cancelled) {
          await loadByCoords(geo.lat, geo.lon, geo.name)
          return
        }
      }
      // 2. Fallback: browser geolocation
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const { latitude, longitude } = pos.coords
            let name = 'Your area'
            try {
              const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`)
              const geoData = await geoRes.json()
              const city = geoData.address?.city || geoData.address?.town || geoData.address?.county || 'Your area'
              const state = geoData.address?.state_code || ''
              name = `${city}${state ? ', ' + state : ''}`
            } catch {}
            loadByCoords(latitude, longitude, name)
          },
          () => {
            // 3. Final fallback: Franklin, TN
            loadByCoords(36.1627, -86.7816, 'Franklin, TN')
          },
          { timeout: 8000 }
        )
      } else {
        loadByCoords(36.1627, -86.7816, 'Franklin, TN')
      }
    }

    run()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile?.zip_code])
  const toggleTask = (id) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t))
  }
  const doneTasks = tasks.filter(t => t.done).length
  // Weather data
  const currentTemp = weather?.current?.temperature_2m
  const currentCode = weather?.current?.weathercode
  const isFrost = weather?.daily?.temperature_2m_min?.[0] <= 32
  const isHeat = weather?.daily?.temperature_2m_max?.[0] >= 95
  const today = new Date()
  const formatUpcomingDate = (dateStr) => {
    try {
      const d = new Date(dateStr + 'T12:00:00')
      const diff = Math.floor((d - today) / 86400000)
      if (diff === 0) return 'Today'
      if (diff === 1) return 'Tomorrow'
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    } catch { return dateStr }
  }
  const upcomingDotColor = (type) => {
    if (type === 'plant') return 'bg-garden-500'
    if (type === 'harvest') return 'bg-amber-400'
    if (type === 'task') return 'bg-blue-400'
    return 'bg-purple-400'
  }
  const handleCancelSubscription = async () => {
    setCancelling(true)
    // Give them access through the end of their paid period
    const isAnnual = (profile?.plan || '').toLowerCase().includes('year') || (profile?.plan || '').toLowerCase().includes('annual')
    const periodEnd = new Date(Date.now() + (isAnnual ? 365 : 30) * 86400000).toISOString()
    await supabase.from('profiles').update({
      cancel_at_period_end: true,
      current_period_end: periodEnd,
      canceled_at: new Date().toISOString(),
    }).eq('id', user.id)
    // Notify you to cancel the billing in GHL (non-blocking)
    try {
      await fetch('https://services.leadconnectorhq.com/hooks/l3Lbx1sx2NqTXgcEeQcA/webhook-trigger/26862e97-19d6-4050-bdc4-c8d60e0f9038', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: profile?.email || user?.email,
          full_name: profile?.full_name || '',
          source: 'Garden Navi Cancellation Request',
          period_end: periodEnd,
        }),
      })
    } catch (e) { /* non-blocking */ }
    setCancelling(false)
    setCancelDone(true)
  }
  const firstName = profile?.full_name ? profile.full_name.split(' ')[0] : ''
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="fade-in stagger-1">
        <h1 className="font-display text-3xl font-semibold text-garden-900">
          Welcome back{firstName ? `, ${firstName}` : ''}! 👋
        </h1>
        <p className="text-garden-500 text-sm mt-1">
          Here's what to focus on today — {today.toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' })}
        </p>
      </div>
      {/* Row 1: Tasks + Weather + Upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Today's Tasks */}
        <div className="card fade-in stagger-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title mb-0">Today's tasks</h2>
            <span className="text-xs text-garden-500 bg-garden-50 px-2 py-1 rounded-full">
              {doneTasks}/{tasks.length} done
            </span>
          </div>
          {tasks.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-garden-400 text-sm">No tasks for today!</p>
              <p className="text-garden-300 text-xs mt-1">Add events to your calendar</p>
              <Link to="/calendar" className="btn-primary text-xs mt-3 mx-auto">
                <Plus size={12} /> Add to Calendar
              </Link>
            </div>
          ) : (
            <div className="space-y-1">
              {tasks.map(task => (
                <button key={task.id} onClick={() => toggleTask(task.id)}
                  className={`w-full flex items-center gap-3 py-2.5 px-2 rounded-xl text-left transition-colors hover:bg-garden-50 ${task.done ? 'opacity-60' : ''}`}>
                  {task.done
                    ? <CheckCircle2 size={17} className="text-garden-500 flex-shrink-0" />
                    : <Circle size={17} className={`flex-shrink-0 ${task.urgent ? 'text-red-400' : 'text-garden-300'}`} />
                  }
                  <span className={`text-sm flex-1 ${task.done ? 'line-through text-garden-400' : task.urgent ? 'text-red-700 font-medium' : 'text-garden-800'}`}>
                    {task.text}
                  </span>
                  {task.badge && (
                    <span className={`${task.badgeClass} badge text-[10px]`}>{task.badge}</span>
                  )}
                </button>
              ))}
            </div>
          )}
          <Link to="/calendar" className="mt-3 w-full btn-ghost justify-center text-xs border border-garden-100 rounded-xl py-2">
            View full calendar <ChevronRight size={12} />
          </Link>
        </div>
        {/* Weather */}
        <div className="card fade-in stagger-3 bg-gradient-to-br from-garden-50 to-blue-50 border-garden-200">
          <p className="text-xs text-garden-500 font-medium mb-1">Weather · {location}</p>
          {weatherLoading ? (
            <div className="flex items-center gap-2 py-4">
              <div className="w-5 h-5 border-2 border-garden-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-garden-500">Loading weather...</span>
            </div>
          ) : weather ? (
            <>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-display text-5xl font-medium text-garden-900">
                      {Math.round(currentTemp || 0)}°
                    </span>
                    <span className="text-garden-500 text-sm">F</span>
                  </div>
                  <p className="text-garden-500 text-xs mt-1">
                    {getWeatherEmoji(currentCode)} {getWeatherDesc(currentCode)}
                  </p>
                </div>
                <span className="text-5xl">{getWeatherEmoji(currentCode)}</span>
              </div>
              {/* Frost or Heat Alert */}
              {isFrost && (
                <div className="bg-white border border-blue-200 rounded-xl p-3 mb-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={15} className="text-blue-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">Frost warning tonight</p>
                      <p className="text-xs text-blue-600 mt-0.5">
                        Low: {Math.round(weather.daily.temperature_2m_min[0])}°F · Bring sensitive plants inside
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {isHeat && !isFrost && (
                <div className="bg-white border border-orange-200 rounded-xl p-3 mb-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={15} className="text-orange-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-orange-800">Heat warning</p>
                      <p className="text-xs text-orange-600 mt-0.5">
                        High: {Math.round(weather.daily.temperature_2m_max[0])}°F · Water plants early morning
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {/* 3-day forecast */}
              <div className="grid grid-cols-3 gap-2">
                {[1,2,3].map(i => {
                  const d = new Date(today)
                  d.setDate(d.getDate() + i)
                  const code = weather.daily?.weathercode?.[i] || 0
                  const high = Math.round(weather.daily?.temperature_2m_max?.[i] || 0)
                  const low = Math.round(weather.daily?.temperature_2m_min?.[i] || 0)
                  return (
                    <div key={i} className="bg-white rounded-xl p-2 text-center border border-garden-100">
                      <p className="text-[11px] text-garden-400">{DAYS[d.getDay()]}</p>
                      <p className="text-lg">{getWeatherEmoji(code)}</p>
                      <p className="font-display text-sm font-medium text-garden-900">{high}°</p>
                      <p className="text-[10px] text-garden-400">{low}°</p>
                    </div>
                  )
                })}
              </div>
            </>
          ) : (
            <p className="text-sm text-garden-400">Weather unavailable</p>
          )}
        </div>
        {/* Upcoming */}
        <div className="card fade-in stagger-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title mb-0">Upcoming</h2>
            <Link to="/calendar" className="text-xs text-garden-500 hover:text-garden-700 flex items-center gap-1">
              Calendar <ChevronRight size={11} />
            </Link>
          </div>
          {userData?.allUpcoming?.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-garden-400 text-sm">No upcoming events</p>
              <Link to="/calendar" className="btn-primary text-xs mt-3 mx-auto">
                <Plus size={12} /> Add Event
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {userData?.allUpcoming?.map((event, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-xl hover:bg-garden-50 transition-colors">
                  <div className="text-[11px] font-medium text-garden-500 w-16 flex-shrink-0">
                    {formatUpcomingDate(event.date)}
                  </div>
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${upcomingDotColor(event.type)}`} />
                  <p className="text-xs text-garden-700 leading-snug truncate">{event.title}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Row 2: My Garden Categories */}
      <div className="card fade-in stagger-3">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title mb-0">My garden</h2>
          <Link to="/plants" className="btn-ghost text-xs py-1.5">Manage plants <ChevronRight size={11} /></Link>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: Sprout,  label:'Vegetables', count: userData?.vegCount || 0,     color:'bg-garden-50 border-garden-200',   iconColor:'text-garden-600',  to:'/plants' },
            { icon: Flower2, label:'Flowers',    count: userData?.flowerCount || 0,  color:'bg-pink-50 border-pink-200',       iconColor:'text-pink-500',    to:'/plants' },
            { icon: Leaf,    label:'Herbs',      count: userData?.herbCount || 0,    color:'bg-emerald-50 border-emerald-200', iconColor:'text-emerald-600', to:'/plants' },
          ].map(({ icon: Icon, label, count, color, iconColor, to }) => (
            <Link key={label} to={to}
              className={`border rounded-2xl p-4 text-center hover:shadow-card-hover transition-all duration-200 ${color}`}>
              <div className={`w-10 h-10 rounded-xl bg-white border ${color.split(' ')[1]} flex items-center justify-center mx-auto mb-3`}>
                <Icon size={18} className={iconColor} />
              </div>
              <div className="font-display text-3xl font-semibold text-garden-900">{count}</div>
              <div className="text-xs text-garden-500 mt-0.5">{label}</div>
              <div className="mt-3">
                <span className="text-[11px] font-medium text-garden-600 bg-white px-3 py-1 rounded-full border border-garden-200">
                  View all
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
      {/* Row 3: Beds + Spend */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Garden Beds */}
        <div className="card lg:col-span-2 fade-in stagger-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title mb-0">My beds</h2>
            <Link to="/beds" className="btn-ghost text-xs py-1.5">All beds <ChevronRight size={11} /></Link>
          </div>
          {!userData?.beds?.length ? (
            <div className="text-center py-8">
              <p className="text-garden-400 text-sm">No beds created yet</p>
              <Link to="/beds" className="btn-primary text-xs mt-3 mx-auto">
                <Plus size={12} /> Create a bed
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {userData.beds.slice(0,3).map(bed => {
                const totalPlants = bed.plants?.reduce((s, p) => s + (p.placed?.length || 0), 0) || 0
                return (
                  <div key={bed.id} className="border rounded-xl p-3 bg-garden-50 border-garden-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-garden-900">{bed.name}</span>
                      <span className="text-xs text-garden-400">{bed.length}ft × {bed.width}ft</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {bed.plants?.filter(p => p.placed?.length > 0).map(p => (
                        <span key={p.id} className="text-[11px] bg-white text-garden-700 px-2 py-0.5 rounded-full border border-garden-200 font-medium">
                          {p.emoji} {p.name} ×{p.placed.length}
                        </span>
                      ))}
                      {totalPlants === 0 && <span className="text-xs text-garden-400">No plants placed yet</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
        {/* Garden Spend */}
        <div className="card fade-in stagger-5">
          <div className="flex items-center justify-between mb-1">
            <h2 className="section-title mb-0">{new Date().getFullYear()} spend</h2>
            <Link to="/expenses" className="btn-ghost text-xs py-1.5">Details <ChevronRight size={11} /></Link>
          </div>
          <div className="mb-3">
            <div className="font-display text-3xl font-semibold text-garden-900">
              ${(userData?.totalSpent || 0).toFixed(2)}
            </div>
            <div className="text-xs text-garden-400 mt-0.5">total spent this year</div>
          </div>
          {userData?.totalRevenue > 0 && (
            <div className="p-3 bg-garden-50 rounded-xl border border-garden-100 mb-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-garden-600">Revenue earned</span>
                <span className="text-sm font-medium text-garden-700">+${(userData.totalRevenue).toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-garden-600">Net cost</span>
                <span className="text-sm font-medium text-garden-900">
                  ${Math.abs(userData.totalSpent - userData.totalRevenue).toFixed(2)}
                </span>
              </div>
            </div>
          )}
          <Link to="/expenses" className="w-full btn-secondary text-xs justify-center py-2">
            <Plus size={12} /> Add expense
          </Link>
        </div>
      </div>
      {/* Row 4: Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 fade-in stagger-6">
        {[
          { icon: Leaf,        label:'Total plants',    value: userData?.totalPlants || 0,         sub: userData?.harvestReady > 0 ? `${userData.harvestReady} ready to harvest` : 'across all categories', color:'text-garden-600', bg:'bg-garden-50', to:'/plants' },
          { icon: CalendarDays,label:'Today\'s events', value: tasks.length,                        sub: `${doneTasks} completed`,                color:'text-blue-600',   bg:'bg-blue-50',   to:'/calendar' },
          { icon: BarChart3,   label:'Journal entries', value: userData?.journalCount || 0,          sub: 'this season',                           color:'text-purple-600', bg:'bg-purple-50', to:'/journal' },
          { icon: DollarSign,  label:'Net cost',        value: `$${Math.abs((userData?.totalSpent||0) - (userData?.totalRevenue||0)).toFixed(0)}`, sub: userData?.totalRevenue > 0 ? 'after revenue' : 'this season', color:'text-amber-600', bg:'bg-amber-50', to:'/expenses' },
        ].map(({ icon: Icon, label, value, sub, color, bg, to }) => (
          <Link key={label} to={to} className="card flex items-center gap-4 hover:shadow-card-hover transition-all">
            <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
              <Icon size={18} className={color} />
            </div>
            <div className="min-w-0">
              <div className="font-display text-xl font-semibold text-garden-900">{value}</div>
              <div className="text-xs text-garden-400 leading-tight">{label}</div>
              <div className={`text-[11px] font-medium ${color} truncate`}>{sub}</div>
            </div>
          </Link>
        ))}
      </div>
      {/* Recent Journal Entry */}
      {userData?.recentJournal && (
        <div className="card fade-in bg-garden-50 border-garden-200">
          <div className="flex items-center justify-between mb-2">
            <h2 className="section-title mb-0 text-sm">Latest journal entry</h2>
            <Link to="/journal" className="text-xs text-garden-500 hover:text-garden-700">
              View all <ChevronRight size={11} className="inline" />
            </Link>
          </div>
          <p className="text-xs text-garden-500 mb-1">{userData.recentJournal.date_display} · {userData.recentJournal.time}</p>
          <p className="text-sm text-garden-700 line-clamp-2">{userData.recentJournal.text}</p>
        </div>
      )}
      {/* Cancel subscription — subtle, only for active paid members */}
      {profile?.subscription_status === 'active' && !profile?.cancel_at_period_end && (
        <div className="text-center pt-4 pb-2">
          <button onClick={() => setShowCancelModal(true)}
            className="text-xs text-garden-400 hover:text-garden-600 underline underline-offset-2">
            Cancel subscription
          </button>
        </div>
      )}
      {profile?.cancel_at_period_end && (
        <div className="text-center pt-4 pb-2">
          <p className="text-xs text-garden-500">
            Your subscription is set to cancel. You have full access until your paid period ends.
          </p>
        </div>
      )}

      {/* Cancel confirmation modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden">
            {!cancelDone ? (
              <>
                <div className="px-5 pt-6 pb-4 text-center">
                  <h3 className="font-display text-lg font-semibold text-garden-900 mb-2">Cancel your subscription?</h3>
                  <p className="text-sm text-garden-600 leading-relaxed">
                    You'll keep full access until the end of your current paid period. After that, your account becomes read-only — your garden data stays saved, and you can reactivate anytime.
                  </p>
                </div>
                <div className="px-5 pb-5 pt-1 flex gap-2">
                  <button onClick={() => setShowCancelModal(false)}
                    className="btn-secondary flex-1 justify-center py-2.5 text-sm">Keep my subscription</button>
                  <button onClick={handleCancelSubscription} disabled={cancelling}
                    className="flex-1 justify-center py-2.5 text-sm rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium disabled:opacity-50">
                    {cancelling ? 'Cancelling...' : 'Yes, cancel'}
                  </button>
                </div>
              </>
            ) : (
              <div className="px-5 py-6 text-center">
                <div className="w-12 h-12 bg-garden-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">✓</span>
                </div>
                <h3 className="font-display text-lg font-semibold text-garden-900 mb-2">Subscription cancelled</h3>
                <p className="text-sm text-garden-600 leading-relaxed mb-4">
                  You'll keep full access until your paid period ends. Your data stays safe, and you can reactivate anytime.
                </p>
                <button onClick={() => { setShowCancelModal(false); window.location.reload() }}
                  className="btn-primary w-full justify-center py-2.5 text-sm">Done</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
