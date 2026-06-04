import { useEffect } from 'react'
import { usePushSubscription } from '../hooks/usePushSubscription.js'

// Silently request push permission after install with a small delay.
// Shows a one-time prompt; does not block the UI.
export function PushPrompt({ isInstalled }) {
  const { status, requestPermissionAndSubscribe } = usePushSubscription()

  useEffect(() => {
    if (!isInstalled || status !== 'idle') return
    const timer = setTimeout(() => {
      requestPermissionAndSubscribe()
    }, 3000) // 3s delay after mount — gives the user time to see the app first
    return () => clearTimeout(timer)
  }, [isInstalled, status, requestPermissionAndSubscribe])

  return null
}
