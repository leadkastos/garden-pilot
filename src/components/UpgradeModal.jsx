import { useEffect, useState } from 'react'
import { useAuth } from '../lib/AuthContext'
const PAY_URL = 'https://realworldbusiness.co/garden-navi-176819'

// Days left until trial end. Positive = trial still active, negative = in grace period.
function trialDaysLeft(profile) {
  if (profile?.subscription_status !== 'trial' || !profile?.trial_ends_at) return null
  const end = new Date(profile.trial_ends_at)
  if (isNaN(end)) return null
  return Math.ceil((end.getTime() - Date.now()) / 86400000)
}

export default function UpgradeModal() {
  const { isReadOnly, readOnlyReason, profile } = useAuth()
  const [open, setOpen] = useState(false)

  const daysLeft = trialDaysLeft(profile)
  // Warning window: 3 days before trial end through 3-day grace period
  const inTrialWarning = daysLeft !== null && daysLeft <= 3 && daysLeft >= -3

  // Open on login when read-only, OR when inside the trial-ending warning window.
  // The warning popup shows once per day (sessionStorage keyed by date).
  useEffect(() => {
    if (isReadOnly) {
      setOpen(true)
      return
    }
    if (inTrialWarning) {
      const key = `trial-warn-${new Date().toISOString().slice(0, 10)}`
      if (!sessionStorage.getItem(key)) {
        setOpen(true)
        sessionStorage.setItem(key, '1')
      }
    }
  }, [isReadOnly, inTrialWarning])

  // Also open when any blocked write fires the upgrade event.
  useEffect(() => {
    const handler = () => setOpen(true)
    window.addEventListener('gn:show-upgrade', handler)
    return () => window.removeEventListener('gn:show-upgrade', handler)
  }, [])

  if (!open) return null

  // Trial-ending warning takes priority when the user is NOT yet read-only.
  let headline, subtext, emoji
  if (!isReadOnly && inTrialWarning) {
    emoji = '⏳'
    if (daysLeft > 1) {
      headline = `Your free trial ends in ${daysLeft} days`
      subtext = 'Subscribe now to keep full access — add plants, log harvests, and keep growing. Your data stays saved either way.'
    } else if (daysLeft === 1) {
      headline = 'Your free trial ends tomorrow'
      subtext = 'Subscribe now to keep full access. After your trial ends, your account becomes read-only.'
    } else if (daysLeft === 0) {
      headline = 'Your free trial ends today'
      subtext = 'Subscribe now to keep adding and editing. Your garden data stays saved either way.'
    } else {
      headline = 'Your trial has ended — grace period active'
      subtext = 'You still have full access for a few more days. Subscribe now to keep it before your account goes read-only.'
    }
  } else {
    emoji = '🌻'
    headline =
      readOnlyReason === 'trial_expired'
        ? 'Your free trial has ended'
        : readOnlyReason === 'canceled_expired'
        ? 'Your subscription has ended'
        : 'Upgrade to keep growing'
    subtext =
      readOnlyReason === 'canceled_expired'
        ? 'Your account is now read-only. Reactivate to add and edit again.'
        : 'Your account is now read-only. You can still view everything — upgrade to add, edit, and track again.'
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
      <div className="bg-parchment rounded-2xl max-w-md w-full p-8 text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="text-5xl mb-4">{emoji}</div>
        <h2 className="text-2xl font-bold text-garden-700 mb-2">{headline}</h2>
        <p className="text-garden-600 mb-6">{subtext}</p>
        <a href={PAY_URL} className="block w-full bg-garden-500 hover:bg-garden-600 text-white font-semibold py-3 rounded-xl transition-colors mb-3">Subscribe Now — $9.95/mo or $99/yr</a>
        <button onClick={() => setOpen(false)} className="text-garden-500 text-sm hover:underline">Maybe later</button>
      </div>
    </div>
  )
}
