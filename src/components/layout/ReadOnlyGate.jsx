import { useState, useEffect } from 'react'
import { useAuth } from '../../lib/AuthContext'

// Your GHL checkout link — where the "Subscribe" buttons send people to pay.
const CHECKOUT_URL = 'https://realworldbusiness.co/garden-navi-176819'

export default function ReadOnlyGate() {
  const { isReadOnly, readOnlyReason, profile } = useAuth()
  const [showPopup, setShowPopup] = useState(false)

  // Show the popup once per login when a read-only user lands.
  useEffect(() => {
    if (!isReadOnly) return
    const key = `ro-popup-${new Date().toISOString().slice(0, 10)}`
    // Show every login for expired/canceled; once per day is handled by session flag.
    if (!sessionStorage.getItem(key)) {
      setShowPopup(true)
      sessionStorage.setItem(key, '1')
    }
  }, [isReadOnly])

  if (!isReadOnly) return null

  const messages = {
    trial_expired: {
      title: 'Your free trial has ended',
      body: 'Your garden data is safe and waiting. Subscribe to unlock full access again — add plants, log harvests, and keep growing.',
    },
    canceled_expired: {
      title: 'Your subscription has ended',
      body: 'Your account is now read-only. Everything you tracked is still here — reactivate anytime to pick up right where you left off.',
    },
    expired: {
      title: 'Your access is read-only',
      body: 'Subscribe to unlock full access. Your garden data is saved and ready whenever you are.',
    },
  }
  const msg = messages[readOnlyReason] || messages.expired

  return (
    <>
      {/* Persistent top banner */}
      <div className="w-full bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center justify-center gap-3 text-center flex-wrap">
        <span className="text-sm text-amber-800 font-medium">
          🔒 Read-only mode — subscribe to unlock full access to your garden.
        </span>
        <a href={CHECKOUT_URL}
          className="text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white px-4 py-1.5 rounded-full transition-colors">
          Subscribe
        </a>
      </div>

      {/* Subscribe popup */}
      {showPopup && (
        <div className="fixed inset-0 bg-black/50 z-[80] flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden">
            <div className="px-6 pt-7 pb-5 text-center">
              <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🔒</span>
              </div>
              <h3 className="font-display text-xl font-semibold text-garden-900 mb-2">{msg.title}</h3>
              <p className="text-sm text-garden-600 leading-relaxed">{msg.body}</p>
            </div>
            <div className="px-6 pb-6 pt-1 space-y-2">
              <a href={CHECKOUT_URL}
                className="block w-full text-center bg-garden-600 hover:bg-garden-700 text-white font-semibold py-3 rounded-xl transition-colors"
                style={{ backgroundColor: '#1e3d1a' }}>
                Subscribe — $9.95/mo or $99/yr
              </a>
              <button onClick={() => setShowPopup(false)}
                className="block w-full text-center text-garden-500 hover:text-garden-700 text-sm py-2">
                Continue in read-only mode
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
