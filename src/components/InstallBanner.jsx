import { useState, useEffect } from 'react'

const DISMISSED_KEY = 'pwa_install_dismissed_v3'

function isRunningStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true ||
    document.referrer.includes('android-app://')
  )
}

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
}

function isAndroid() {
  return /Android/.test(navigator.userAgent)
}

// Android Chrome step-by-step modal
function AndroidModal({ onDismiss, onNativeInstall, hasNativePrompt }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/60" onClick={onDismiss} />
      <div className="relative w-full bg-white rounded-t-3xl shadow-2xl animate-slide-up">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        <div className="px-6 pt-4 pb-10">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center shadow-md flex-shrink-0">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-gray-900 text-base">Install Netkathir HRMS</p>
              <p className="text-xs text-gray-400 mt-0.5">Add to your home screen</p>
            </div>
            <button onClick={onDismiss} className="ml-auto text-gray-300 p-1 flex-shrink-0">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Native install button if prompt is available */}
          {hasNativePrompt && (
            <button
              onClick={onNativeInstall}
              className="w-full bg-brand-600 text-white font-bold text-base py-4 rounded-2xl flex items-center justify-center gap-2 mb-5 active:bg-brand-700"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Install Now
            </button>
          )}

          {/* Manual steps — always shown as fallback */}
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            {hasNativePrompt ? 'Or install manually:' : 'How to install:'}
          </p>

          {[
            {
              n: 1,
              icon: '⋮',
              text: 'Tap the 3-dot menu at the top-right of Chrome',
            },
            {
              n: 2,
              icon: '＋',
              text: 'Tap "Add to Home screen"',
            },
            {
              n: 3,
              icon: '✓',
              text: 'Tap "Add" on the confirmation dialog',
            },
          ].map(({ n, icon, text }) => (
            <div key={n} className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-brand-50 border border-brand-200 text-brand-700 font-bold text-sm flex items-center justify-center flex-shrink-0">
                {n}
              </div>
              <div className="flex-1 pt-1">
                <p className="text-sm text-gray-700 leading-relaxed">{text}</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-500 font-bold text-base flex items-center justify-center flex-shrink-0">
                {icon}
              </div>
            </div>
          ))}

          <button
            onClick={onDismiss}
            className="w-full mt-2 py-3 text-sm text-gray-400 font-medium rounded-xl active:bg-gray-50"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  )
}

// iOS Safari step-by-step modal
function IOSModal({ onDismiss }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/60" onClick={onDismiss} />
      <div className="relative w-full bg-white rounded-t-3xl shadow-2xl animate-slide-up">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>
        <div className="px-6 pt-4 pb-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center shadow-md flex-shrink-0">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-gray-900 text-base">Install Netkathir HRMS</p>
              <p className="text-xs text-gray-400 mt-0.5">Add to your Home Screen</p>
            </div>
            <button onClick={onDismiss} className="ml-auto text-gray-300 p-1 flex-shrink-0">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {[
            { n: 1, icon: '⎋', text: 'Tap the Share button at the bottom of Safari' },
            { n: 2, icon: '＋', text: 'Tap "Add to Home Screen"' },
            { n: 3, icon: '✓', text: 'Tap "Add" in the top-right corner' },
          ].map(({ n, icon, text }) => (
            <div key={n} className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-brand-50 border border-brand-200 text-brand-700 font-bold text-sm flex items-center justify-center flex-shrink-0">
                {n}
              </div>
              <p className="text-sm text-gray-700 leading-relaxed flex-1 pt-1">{text}</p>
              <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-500 font-bold text-lg flex items-center justify-center flex-shrink-0">
                {icon}
              </div>
            </div>
          ))}

          <button onClick={onDismiss} className="w-full mt-2 py-3 text-sm text-gray-400 font-medium rounded-xl">
            Maybe later
          </button>
        </div>
      </div>
    </div>
  )
}

export function InstallBanner() {
  const [nativePrompt, setNativePrompt] = useState(null)
  const [standalone, setStandalone] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    setStandalone(isRunningStandalone())
    setDismissed(sessionStorage.getItem(DISMISSED_KEY) === '1')

    // Pick up prompt captured by inline script in index.html
    if (window.__pwaInstallPrompt) setNativePrompt(window.__pwaInstallPrompt)

    function onReady() {
      if (window.__pwaInstallPrompt) setNativePrompt(window.__pwaInstallPrompt)
    }
    function onPrompt(e) {
      e.preventDefault()
      window.__pwaInstallPrompt = e
      setNativePrompt(e)
    }
    function onInstalled() {
      setStandalone(true)
      setNativePrompt(null)
      window.__pwaInstallPrompt = null
    }

    window.addEventListener('pwaPromptReady', onReady)
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)

    return () => {
      window.removeEventListener('pwaPromptReady', onReady)
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  function dismiss() {
    sessionStorage.setItem(DISMISSED_KEY, '1')
    setDismissed(true)
    setShowModal(false)
  }

  async function handleNativeInstall() {
    if (!nativePrompt) return
    setShowModal(false)
    nativePrompt.prompt()
    const { outcome } = await nativePrompt.userChoice
    if (outcome === 'accepted') {
      setStandalone(true)
      setNativePrompt(null)
      window.__pwaInstallPrompt = null
    }
  }

  // Don't show if already installed or dismissed
  if (standalone || dismissed) return null
  // Only show on mobile
  if (!isAndroid() && !isIOS()) return null

  return (
    <>
      {/* Persistent bottom banner */}
      <div className="fixed bottom-0 inset-x-0 z-40 pb-safe">
        <div className="mx-3 mb-3 bg-brand-600 rounded-2xl shadow-2xl flex items-center gap-3 px-4 py-3.5">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white flex-shrink-0">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-bold leading-none">Install App</p>
            <p className="text-brand-200 text-xs mt-0.5">Get quick access from your home screen</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-white text-brand-700 text-xs font-bold px-4 py-2.5 rounded-xl flex-shrink-0 active:bg-brand-50"
          >
            Install
          </button>
          <button onClick={dismiss} className="text-white/40 flex-shrink-0 p-1">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Modal */}
      {showModal && isAndroid() && (
        <AndroidModal
          hasNativePrompt={!!nativePrompt}
          onNativeInstall={handleNativeInstall}
          onDismiss={dismiss}
        />
      )}
      {showModal && isIOS() && (
        <IOSModal onDismiss={dismiss} />
      )}
    </>
  )
}
