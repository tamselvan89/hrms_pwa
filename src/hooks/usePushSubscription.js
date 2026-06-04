import { useState, useEffect } from 'react'
import { subscribePush } from '../api/client.js'
import { VAPID_PUBLIC_KEY } from '../config.js'
import { urlBase64ToUint8Array } from '../utils/push.js'

export function usePushSubscription() {
  const [status, setStatus] = useState('idle') // idle | requesting | subscribed | denied | unsupported

  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setStatus('unsupported')
    } else if (Notification.permission === 'granted') {
      setStatus('subscribed')
    } else if (Notification.permission === 'denied') {
      setStatus('denied')
    }
  }, [])

  async function requestPermissionAndSubscribe() {
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported')
      return
    }

    if (!VAPID_PUBLIC_KEY) return // VAPID not configured — skip silently

    setStatus('requesting')

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      setStatus('denied')
      return
    }

    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })
      await subscribePush({ subscription: sub })
      setStatus('subscribed')
    } catch {
      // Subscription failed — silently degrade (push is non-critical)
      setStatus('idle')
    }
  }

  return { status, requestPermissionAndSubscribe }
}
