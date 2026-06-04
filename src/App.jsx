import { useState, useEffect } from 'react'
import { useAuth } from './context/AuthContext.jsx'
import { LoginScreen } from './screens/LoginScreen.jsx'
import { ForgotPasswordScreen } from './screens/ForgotPasswordScreen.jsx'
import { PunchScreen } from './screens/PunchScreen.jsx'
import { ProfileScreen } from './screens/ProfileScreen.jsx'
import { InstallBanner } from './components/InstallBanner.jsx'
import { PushPrompt } from './components/PushPrompt.jsx'
import { useInstallPrompt } from './hooks/useInstallPrompt.js'

const VIEW = { LOGIN: 'login', FORGOT: 'forgot', PUNCH: 'punch', PROFILE: 'profile' }

function BootSpinner() {
  return (
    <div className="h-screen-safe flex items-center justify-center bg-brand-600 pt-safe pb-safe">
      <div className="flex flex-col items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <svg className="animate-spin h-5 w-5 text-white/60" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      </div>
    </div>
  )
}

export function App() {
  const { status } = useAuth()
  const [view, setView] = useState(VIEW.PUNCH)
  const { isInstalled, isStandalone, deferredPrompt, promptInstall, isIOS } = useInstallPrompt()
  const [showInstallModal, setShowInstallModal] = useState(false)

  // Auto-trigger install once when prompt is available + user is logged in
  useEffect(() => {
    if (status !== 'authenticated') return
    if (isInstalled || isStandalone) return

    if (deferredPrompt) {
      // Small delay so the punch screen renders first
      const t = setTimeout(() => promptInstall(), 2000)
      return () => clearTimeout(t)
    }
  }, [status, deferredPrompt, isInstalled, isStandalone])

  // iOS modal — show once after login
  useEffect(() => {
    if (status !== 'authenticated') return
    if (isInstalled || isStandalone || !isIOS) return
    const t = setTimeout(() => setShowInstallModal(true), 2000)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  if (status === 'booting') return <BootSpinner />

  if (status === 'unauthenticated') {
    if (view === VIEW.FORGOT) {
      return (
        <ForgotPasswordScreen
          onBack={() => setView(VIEW.LOGIN)}
          onDone={() => setView(VIEW.LOGIN)}
        />
      )
    }
    return <LoginScreen onForgotPassword={() => setView(VIEW.FORGOT)} />
  }

  return (
    <>
      {view === VIEW.PROFILE
        ? <ProfileScreen onBack={() => setView(VIEW.PUNCH)} />
        : <PunchScreen onOpenProfile={() => setView(VIEW.PROFILE)} />
      }

      {/* iOS install modal triggered from App level */}
      {showInstallModal && isIOS && !isStandalone && (
        <IOSInstallModal onDismiss={() => setShowInstallModal(false)} />
      )}

      {/* Persistent bottom banner (Android fallback if auto-prompt was dismissed) */}
      <InstallBanner />
      <PushPrompt isInstalled={isInstalled || isStandalone} />
    </>
  )
}

// Inline iOS install instructions modal
function IOSInstallModal({ onDismiss }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onDismiss} />
      <div className="relative w-full bg-white rounded-t-3xl px-6 pt-4 pb-10 shadow-2xl">
        <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mb-5" />

        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center shadow">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-gray-900">Install Netkathir HRMS</p>
            <p className="text-xs text-gray-400 mt-0.5">Add to your Home Screen</p>
          </div>
          <button onClick={onDismiss} className="ml-auto text-gray-300 p-1">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {[
          { n: 1, text: <>Tap the <strong>Share</strong> button at the bottom of Safari</> },
          { n: 2, text: <>Tap <strong>Add to Home Screen</strong></> },
          { n: 3, text: <>Tap <strong>Add</strong> — done!</> },
        ].map(({ n, text }) => (
          <div key={n} className="flex items-start gap-3 mb-4">
            <span className="w-6 h-6 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
              {n}
            </span>
            <p className="text-sm text-gray-600 leading-relaxed">{text}</p>
          </div>
        ))}

        <button onClick={onDismiss}
          className="w-full mt-2 py-3 text-sm text-gray-400 font-medium">
          Maybe later
        </button>
      </div>
    </div>
  )
}
