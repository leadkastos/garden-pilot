import { useAuth } from './AuthContext'

// Reusable write-guard.
// Usage in any page:
//   const guard = useWriteGuard()
//   const handleSave = () => {
//     if (!guard()) return   // blocked → popup shows, nothing saves
//     ...normal save code...
//   }
export function useWriteGuard() {
  const { isReadOnly } = useAuth()

  return function guard() {
    if (isReadOnly) {
      // Signal the app-wide upgrade popup to open.
      window.dispatchEvent(new CustomEvent('gn:show-upgrade'))
      return false
    }
    return true
  }
}
