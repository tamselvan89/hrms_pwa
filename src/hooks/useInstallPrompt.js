import { useState, useEffect } from 'react'

// Capture the event at module load time — it fires BEFORE React mounts
// so useEffect would miss it if we only listened there
let _deferredPrompt = null
let _listeners = []

function notifyListeners() {
  _listeners.forEach(fn => fn(_deferredPrompt))
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  _deferredPrompt = e
  notifyListeners()
})

window.addEventListener('appinstalled', () => {
  _deferredPrompt = null
  notifyListeners()
})

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(_deferredPrompt)
  const [isInstalled, setIsInstalled] = useState(false)

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true

  useEffect(() => {
    // Already installed
    if (isStandalone) { setIsInstalled(true); return }

    // Subscribe to future prompt events (e.g. after dismissal + re-trigger)
    function onPromptChange(prompt) {
      setDeferredPrompt(prompt)
      if (!prompt) setIsInstalled(true)
    }

    _listeners.push(onPromptChange)

    // Sync with whatever was captured before mount
    if (_deferredPrompt) setDeferredPrompt(_deferredPrompt)

    return () => {
      _listeners = _listeners.filter(fn => fn !== onPromptChange)
    }
  }, [isStandalone])

  async function promptInstall() {
    if (!deferredPrompt) return false
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    _deferredPrompt = null
    setDeferredPrompt(null)
    if (outcome === 'accepted') setIsInstalled(true)
    return outcome === 'accepted'
  }

  return { deferredPrompt, isInstalled, isIOS, isStandalone, promptInstall }
}
