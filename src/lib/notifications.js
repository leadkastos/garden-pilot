import { supabase } from './supabase'
import { checkFrostRisk } from './frostCheck'

// Generates "what's relevant now" notifications from live data and syncs them
// to the notifications table. Deduped by a stable `key` so the same frost
// warning doesn't pile up on every login.
//
// Returns the fresh list of notification rows for the bell.

const todayISO = () => new Date().toISOString().slice(0, 10)

async function fetchWeatherAlert() {
  // Uses browser geolocation if available; falls back silently.
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords
          const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&timezone=auto&forecast_days=1`
          )
          const data = await res.json()
          const low = data?.daily?.temperature_2m_min?.[0]
          const high = data?.daily?.temperature_2m_max?.[0]
          if (low <= 32) {
            resolve({ kind: 'frost', title: 'Frost warning tonight', body: `Low around ${Math.round(low)}°F — protect sensitive plants.` })
          } else if (high >= 95) {
            resolve({ kind: 'heat', title: 'Heat warning today', body: `High around ${Math.round(high)}°F — water early morning.` })
          } else {
            resolve(null)
          }
        } catch { resolve(null) }
      },
      () => resolve(null),
      { timeout: 5000 }
    )
  })
}

export async function generateNotifications(userId, profile) {
  if (!userId) return []

  // Pull the data we base notifications on
  const [{ data: plants }, { data: events }] = await Promise.all([
    supabase.from('plants').select('*').eq('user_id', userId),
    supabase.from('calendar_events').select('*').eq('user_id', userId).eq('date', todayISO()),
  ])

  const desired = []

  // 0. Zip nudge — if no zip on file, remind them daily (keyed by date so it re-fires each day)
  const hasZip = profile?.zip_code && /^\d{5}$/.test(profile.zip_code)
  if (!hasZip) {
    desired.push({
      key: `zip-nudge-${todayISO()}`,
      type: 'zip',
      title: 'Add your zip code',
      body: 'Add your zip to unlock local weather and frost warnings. Tap here to add it in your profile.',
    })
  }

  // 0.5 Trial-ending nudge — fires daily from 3 days before trial end through the 3-day grace period.
  // Keyed by date so it re-fires once per day (same pattern as the zip nudge).
  // Uses type 'upgrade' so the bell makes it clickable → checkout page.
  if (profile?.subscription_status === 'trial' && profile?.trial_ends_at) {
    const end = new Date(profile.trial_ends_at)
    if (!isNaN(end)) {
      const msPerDay = 86400000
      const daysLeft = Math.ceil((end.getTime() - Date.now()) / msPerDay)
      // Window: 3 days before trial end (daysLeft <= 3) through 3-day grace (daysLeft >= -3)
      if (daysLeft <= 3 && daysLeft >= -3) {
        let title, body
        if (daysLeft > 1) {
          title = `Your free trial ends in ${daysLeft} days`
          body = 'Subscribe now to keep full access — add plants, log harvests, and keep growing. Tap here to subscribe.'
        } else if (daysLeft === 1) {
          title = 'Your free trial ends tomorrow'
          body = 'Subscribe to keep full access. Tap here to subscribe.'
        } else if (daysLeft === 0) {
          title = 'Your free trial ends today'
          body = 'Subscribe now to avoid losing the ability to add or edit. Tap here to subscribe.'
        } else {
          // grace period (daysLeft -1 to -3)
          title = 'Your trial has ended — grace period active'
          body = 'You still have full access for a few more days. Tap here to subscribe.'
        }
        desired.push({
          key: `trial-ending-${todayISO()}`,
          type: 'upgrade',
          title,
          body,
        })
      }
    }
  }

  // 1. Frost-timing warnings — only for recently-added plants (decision still actionable)
  const now = Date.now()
  const RECENT_MS = 14 * 86400000
  ;(plants || []).forEach((p) => {
    if (p.status === 'Finished' || p.status === 'Unplanted') return
    // Skip plants added more than 14 days ago — the planting decision window has passed
    if (p.created_at && (now - new Date(p.created_at).getTime()) > RECENT_MS) return
    const risk = checkFrostRisk({
      planting: p.planted_date,
      maturityDays: p.days_to_maturity,
      productionWeeks: p.production_weeks,
      springFrost: profile?.last_spring_frost,
      fallFrost: profile?.first_fall_frost,
    })
    if (risk && risk.level === 'warning') {
      const title = risk.kind === 'too-early'
        ? `${p.name}: planted early this season`
        : `${p.name}: may not finish before fall frost`
      desired.push({
        key: `frost-${p.id}`,
        type: 'season',
        title,
        body: risk.message,
      })
    }
  })

  // 2. Today's calendar events (planting, milestones, weather) — keep their real type for the icon
  ;(events || []).forEach((e) => {
    // Map calendar event types to the bell's icon types
    let notifType = 'task'
    if (e.type === 'frost') notifType = 'weather'   // weather events
    else if (e.type === 'plant') notifType = 'plant' // planting + milestones
    else if (e.type === 'harvest') notifType = 'harvest'
    desired.push({
      key: `event-${e.id}`,
      type: notifType,
      title: e.title,
      body: 'On your calendar for today.',
    })
  })

  // 3. Harvest-ready plants
  ;(plants || []).forEach((p) => {
    if (p.status === 'Harvesting') {
      desired.push({
        key: `harvest-${p.id}`,
        type: 'task',
        title: `${p.name} is ready to harvest`,
        body: `Marked as harvesting — check on it.`,
      })
    }
  })

  // 4. Weather alert (one, location-based)
  const weather = await fetchWeatherAlert()
  if (weather) {
    desired.push({
      key: `weather-${todayISO()}-${weather.kind}`,
      type: weather.kind === 'heat' ? 'heat' : 'frost',
      title: weather.title,
      body: weather.body,
    })
  }

  // Dedupe against existing rows by `link` (we store the key in `link`)
  const { data: existing } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)

  // Also skip anything the user previously dismissed/cleared
  const { data: dismissedRows } = await supabase
    .from('dismissed_notifications')
    .select('notif_key')
    .eq('user_id', userId)

  const existingKeys = new Set((existing || []).map((r) => r.link))
  const dismissedKeys = new Set((dismissedRows || []).map((r) => r.notif_key))
  const toInsert = desired
    .filter((d) => !existingKeys.has(d.key) && !dismissedKeys.has(d.key))
    .map((d) => ({
      user_id: userId,
      type: d.type,
      title: d.title,
      body: d.body,
      link: d.key, // reuse link column to store the dedupe key
      read: false,
    }))

  if (toInsert.length) {
    await supabase.from('notifications').insert(toInsert)
  }

  // Return the full fresh list, newest first
  const { data: fresh } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  return fresh || []
}
