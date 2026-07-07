import { useEffect, useState } from 'react'
import { useAuth } from '../lib/AuthContext'

// App-wide upgrade popup.
// - Opens automatically on login when a user is in read-only mode.
// - Also opens when any blocked write fires the 'gn:show-upgrade' event.
const PAY_URL = 'https://realworldbusiness.co/garden-navi-176819'

export default function UpgradeModal() {
  const { isReadOnly, readOnlyReason } = useAuth()
  const [open, setOpen] = useState(false)

  // Auto-open on login for read-only users.
  useEffect(() => {
    if (isReadOnly) setOpen(true)
  }, [isReadOnly])

  // Open when a blocked write fires the event.
  useEffect(() => {
    const handler = () => setOpen(true)
    window.addEventListener('gn:show-upgrade', handler)
    return () => window.removeEventListener('gn:show-upgrade', handler)
  }, [])

  if (!open) return null

  const headline =
    readOnlyReason === 'trial_expired'
      ? 'Your free trial has ended'
      : readOnlyReason === 'canceled_expired'
      ? 'Your subscription has ended'
      : 'Upgrade to keep growing'

  const subtext =
    readOnlyReason === 'canceled_expired'
      ? 'Your account is now read-only. Reactivate to add and edit again.'
      : 'Your account is now read-only. You can still view everything — upgrade to add, edit, and track again.'

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4"
      onClick={() => setOpen(false)}
    >
      <div
        className="bg-parchment rounded-2xl max-w-md w-full p-8 text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-5xl mb-4">🌻</div>
        <h2 className="text-2xl font-bold text-garden-700 mb-2">{headline}</h2>
        <p className="text-garden-600 mb-6">{subtext}</p>

        
          href={PAY_URL}
          className="block w-full bg-garden-500 hover:bg-garden-600 text-white font-semibold py-3 rounded-xl transition-colors mb-3"
        >
          Upgrade Now — $9.95/mo or $99/yr
        </a>

        <button
          onClick={() => setOpen(false)}
          className="text-garden-500 text-sm hover:underline"
        >
          Continue in read-only mode
        </button>
      </div>
    </div>
  )
}
