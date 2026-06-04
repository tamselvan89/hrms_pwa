import { useState, useEffect, useCallback, useRef } from 'react'
import logoMark from '../assets/logo-mark.png'
import { FlipClock } from '../components/FlipClock.jsx'
import { useInstallPrompt } from '../hooks/useInstallPrompt.js'
import { usePunchReminder } from '../hooks/usePunchReminder.js'
import { useAuth } from '../context/AuthContext.jsx'
import { getAttendance, postAttendance } from '../api/client.js'
import { computeWorked, findTodayRecord } from '../utils/attendance.js'
import { formatDuration, formatDisplayDate, formatDisplayTime } from '../utils/date.js'
import { Alert } from '../components/ui/Alert.jsx'
import {
  OFFICE_LAT, OFFICE_LNG, GEOFENCE_RADIUS_M, ACCURACY_THRESHOLD_M, distanceMeters,
} from '../config.js'

const STATE = {
  IDLE: 'idle',
  LOCATING: 'locating',
  SUBMITTING: 'submitting',
  SUCCESS: 'success',
}

function SpinnerIcon({ className = 'h-5 w-5' }) {
  return (
    <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  )
}

export function PunchScreen({ onOpenProfile }) {
  const { profile, logout } = useAuth()

  const [events, setEvents] = useState([])
  const [punchState, setPunchState] = useState(STATE.IDLE)
  const [alertMsg, setAlertMsg] = useState(null)
  const [now, setNow] = useState(Date.now())
  const [isLoading, setIsLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)
  // Capture which action was just completed so SUCCESS state shows the right label/color
  const lastPunchedAction = useRef(null)

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    function handler(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const loadAttendance = useCallback(async () => {
    if (!profile?.uid) return
    try {
      const res = await getAttendance(profile.uid)
      const todayRecord = findTodayRecord(res.data || [])
      setEvents(todayRecord?.events || [])
    } catch { /* silent */ }
    finally { setIsLoading(false) }
  }, [profile?.uid])

  useEffect(() => { loadAttendance() }, [loadAttendance])

  const { totalMs, isPunchedIn, nextAction } = computeWorked(events, now)

  async function submitPunch() {
    // Snapshot the action NOW before events update flips nextAction
    const action = nextAction
    lastPunchedAction.current = action
    setPunchState(STATE.SUBMITTING)
    try {
      const res = await postAttendance({ check: action })
      const doc = res.data?._doc || res.data
      // Update events AFTER capturing the action — nextAction will flip here
      if (doc?.events) setEvents(doc.events)
      else await loadAttendance()
      setPunchState(STATE.SUCCESS)
      setTimeout(() => {
        setPunchState(STATE.IDLE)
        setAlertMsg(null)
      }, 3000)
    } catch (err) {
      setPunchState(STATE.IDLE)
      setAlertMsg({ type: 'error', message: err.message || 'Punch failed. Please try again.' })
    }
  }

  async function handlePunch() {
    setAlertMsg(null)
    setPunchState(STATE.LOCATING)

    if (!navigator.geolocation) {
      setAlertMsg({ type: 'error', message: 'Geolocation is not supported by your browser.' })
      setPunchState(STATE.IDLE)
      return
    }

    // Collect positions for up to MAX_WAIT_MS, keep the most accurate one seen.
    // On desktop WiFi/IP location fires once with poor accuracy and never improves —
    // we take the best we have rather than waiting forever.
    const MAX_WAIT_MS = 10000
    let bestPosition = null
    let settled = false

    const position = await new Promise((resolve) => {
      let watchId = null

      function finish(pos) {
        if (settled) return
        settled = true
        if (watchId !== null) { navigator.geolocation.clearWatch(watchId); watchId = null }
        resolve(pos)
      }

      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          // Keep improving if a better fix arrives
          if (!bestPosition || pos.coords.accuracy < bestPosition.coords.accuracy) {
            bestPosition = pos
          }
          // Good enough — stop waiting
          if (pos.coords.accuracy <= ACCURACY_THRESHOLD_M) {
            finish(pos)
          }
        },
        (err) => {
          if (err.code === 1) {
            // Permission denied — no point waiting
            finish(null)
          }
          // For other errors (unavailable/timeout) keep waiting; best effort
        },
        { enableHighAccuracy: true, timeout: MAX_WAIT_MS, maximumAge: 0 }
      )

      // Deadline — use whatever best position we have
      setTimeout(() => {
        if (!settled) finish(bestPosition)
      }, MAX_WAIT_MS)
    })

    // Permission denied
    if (!position && !bestPosition) {
      setPunchState(STATE.IDLE)
      setAlertMsg({ type: 'error', message: 'Location access denied. Enable location in your settings and try again.' })
      return
    }

    const pos = position || bestPosition
    const { latitude, longitude, accuracy } = pos.coords
    const distance = distanceMeters(latitude, longitude, OFFICE_LAT, OFFICE_LNG)

    console.info(`[geofence] lat:${latitude.toFixed(5)} lng:${longitude.toFixed(5)} | accuracy:${Math.round(accuracy)}m | distance:${Math.round(distance)}m | radius:${GEOFENCE_RADIUS_M}m`)

    // Block if outside the geofence radius
    if (distance > GEOFENCE_RADIUS_M) {
      const distLabel = distance >= 1000
        ? `${(distance / 1000).toFixed(1)} km`
        : `${Math.round(distance)} m`
      setPunchState(STATE.IDLE)
      setAlertMsg({
        type: 'error',
        // Show GPS coords in the error so we can verify/fix office coordinates
        message: `${distLabel} from office.\nYour GPS: ${latitude.toFixed(5)}, ${longitude.toFixed(5)} (±${Math.round(accuracy)}m)\nOffice: ${OFFICE_LAT}, ${OFFICE_LNG}`,
      })
      return
    }

    await submitPunch()
  }

  const { deferredPrompt, isStandalone, promptInstall } = useInstallPrompt()

  // Schedule / cancel 9 PM punch-out reminder whenever punch state changes
  usePunchReminder(isPunchedIn)
  const isButtonBusy = punchState === STATE.LOCATING || punchState === STATE.SUBMITTING
  const initials = [profile?.firstname?.[0], profile?.lastname?.[0]].filter(Boolean).join('')
  const sortedEvents = [...events].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))

  const isSuccess = punchState === STATE.SUCCESS
  const isLocating = punchState === STATE.LOCATING
  const isSubmitting = punchState === STATE.SUBMITTING

  // During SUCCESS use the snapshotted action, not the already-flipped nextAction
  const displayAction = isSuccess ? lastPunchedAction.current : nextAction
  const isIn = displayAction === 'in'

  const colors = isSuccess
    ? (lastPunchedAction.current === 'in'
        ? { bg: '#16a34a', ring: '#bbf7d0', label: 'Punched In!' }
        : { bg: '#f43f5e', ring: '#fecdd3', label: 'Punched Out!' })
    : isButtonBusy
      ? { bg: '#94a3b8', ring: '#e2e8f0', label: isLocating ? 'Locating…' : 'Recording…' }
      : nextAction === 'in'
        ? { bg: '#16a34a', ring: '#bbf7d0', label: 'Punch In' }
        : { bg: '#f43f5e', ring: '#fecdd3', label: 'Punch Out' }

  return (
    <div className="h-screen-safe flex flex-col bg-gray-50">

      {/* ── Header — extends into status bar ── */}
      <header className="bg-brand-600 pt-safe flex-shrink-0">
        <div className="px-4 pt-3 pb-4 flex items-center justify-between">

          {/* Left: logo + greeting */}
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-white flex items-center justify-center shadow-sm flex-shrink-0">
              <img
                src={logoMark}
                alt="Netkathir"
                className="h-7 w-7 object-contain"
                draggable="false"
              />
            </div>
            <h1 className="text-white text-[15px] font-bold leading-tight">
              Hi, {profile?.firstname || 'there'} 👋
            </h1>
          </div>

          {/* Right: avatar menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="w-10 h-10 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-white font-bold text-sm tracking-wide"
            >
              {initials || '??'}
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-1 z-50 overflow-hidden">
                <button onClick={() => { setMenuOpen(false); onOpenProfile() }}
                  className="w-full text-left px-4 py-3 text-sm text-gray-700 font-medium active:bg-gray-50">
                  My Profile
                </button>
                {/* Show Install option if prompt available and not already installed */}
                {deferredPrompt && !isStandalone && (
                  <>
                    <div className="h-px bg-gray-100 mx-3" />
                    <button onClick={() => { setMenuOpen(false); promptInstall() }}
                      className="w-full text-left px-4 py-3 text-sm text-brand-600 font-semibold active:bg-brand-50 flex items-center gap-2">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Install App
                    </button>
                  </>
                )}
                <div className="h-px bg-gray-100 mx-3" />
                <button onClick={() => { setMenuOpen(false); logout() }}
                  className="w-full text-left px-4 py-3 text-sm text-rose-500 font-medium active:bg-rose-50">
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Date + animated flip clock */}
        <div className="px-4 pb-5">
          <p className="text-brand-200 text-xs font-medium">{formatDisplayDate()}</p>
          <FlipClock
            date={new Date(now)}
            className="text-white text-4xl font-bold tracking-tight mt-0.5"
          />
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex-1 scroll-area px-4 py-4 flex flex-col gap-3">

        {/* Status + Working hours */}
        <div className="flex gap-3">
          <div className="flex-1 bg-white rounded-2xl px-4 py-3.5 shadow-sm">
            <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider mb-2">Status</p>
            <div className={`inline-flex items-center gap-1.5 text-xs font-semibold rounded-full px-2.5 py-1 ${isPunchedIn ? 'bg-brand-50 text-brand-700' : 'bg-gray-100 text-gray-500'}`}>
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isPunchedIn ? 'bg-brand-500 animate-pulse' : 'bg-gray-300'}`} />
              {isPunchedIn ? 'In Office' : 'Not Clocked In'}
            </div>
          </div>
          <div className="flex-1 bg-white rounded-2xl px-4 py-3.5 shadow-sm">
            <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider mb-1">Working Hours</p>
            {isLoading
              ? <SpinnerIcon className="h-5 w-5 text-brand-400 mt-1" />
              : <p className="text-xl font-bold text-brand-700 tabular-nums">{formatDuration(totalMs)}</p>
            }
          </div>
        </div>

        {/* Success banner */}
        {isSuccess && (
          <div className={`rounded-2xl px-4 py-3.5 flex items-center gap-3 animate-slide-up
            ${lastPunchedAction.current === 'in' ? 'bg-brand-50 border border-brand-200' : 'bg-rose-50 border border-rose-200'}`}>
            <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0
              ${lastPunchedAction.current === 'in' ? 'bg-brand-600' : 'bg-rose-500'}`}>
              <svg className="h-5 w-5 draw-check" viewBox="0 0 24 24" fill="none"
                stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className={`text-sm font-bold ${lastPunchedAction.current === 'in' ? 'text-brand-700' : 'text-rose-600'}`}>
                {lastPunchedAction.current === 'in' ? 'Punched In Successfully' : 'Punched Out Successfully'}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })}
              </p>
            </div>
          </div>
        )}

        {/* Error banner */}
        {alertMsg && alertMsg.type === 'error' && (
          <div className="rounded-2xl px-4 py-3.5 bg-red-50 border border-red-200 animate-slide-up">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-red-700">Unable to Punch</p>
                {alertMsg.message.split('\n').map((line, i) => (
                  <p key={i} className="text-xs text-red-500 mt-0.5 font-mono break-all">{line}</p>
                ))}
              </div>
              <button onClick={() => setAlertMsg(null)} className="text-red-300 flex-shrink-0 mt-0.5">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* ── Animated punch button ── */}
        <div className="flex flex-col items-center gap-3 py-2">
          <div className="relative flex items-center justify-center">

            {/* Sonar rings while locating */}
            {isLocating && (
              <>
                <span className="absolute w-44 h-44 rounded-full animate-sonar"
                  style={{ background: colors.ring }} />
                <span className="absolute w-44 h-44 rounded-full animate-sonar"
                  style={{ background: colors.ring, animationDelay: '0.5s' }} />
              </>
            )}

            {/* Success outer ring pop */}
            {isSuccess && (
              <span className="absolute w-44 h-44 rounded-full animate-ripple"
                style={{ background: colors.ring }} />
            )}

            {/* Main circle button */}
            <button
              key={punchState}
              onClick={handlePunch}
              disabled={isButtonBusy || isLoading}
              className={`relative z-10 w-36 h-36 rounded-full text-white flex flex-col items-center justify-center
                gap-1 shadow-2xl disabled:cursor-not-allowed select-none
                ${isSuccess ? 'animate-pop' : ''}
                ${!isButtonBusy && !isSuccess ? 'active:scale-95' : ''}
                transition-all duration-200`}
              style={{ background: colors.bg, boxShadow: `0 8px 32px ${colors.ring}` }}
            >
              {/* Icon */}
              <span className="transition-all duration-200">
                {isLocating || isSubmitting
                  ? <SpinnerIcon className="h-9 w-9" />
                  : isSuccess
                    ? <svg className="h-10 w-10 draw-check" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    : isIn
                      ? <svg className="h-9 w-9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" />
                        </svg>
                      : <svg className="h-9 w-9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
                        </svg>
                }
              </span>

              {/* Label */}
              <span key={colors.label} className="text-sm font-bold tracking-wide animate-slide-up">
                {colors.label}
              </span>
            </button>
          </div>

          <p className="text-xs text-gray-400 flex items-center gap-1">
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
            Location verified on each punch
          </p>
        </div>

        {/* Today's activity */}
        {sortedEvents.length > 0 && (
          <div className="bg-white rounded-2xl px-4 py-4 shadow-sm">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Today's Activity
            </p>
            <div className="flex flex-col divide-y divide-gray-50">
              {sortedEvents.map((ev, i) => {
                const isIn = ev.check === 'in'
                return (
                  <div key={ev._id || i} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isIn ? 'bg-brand-50' : 'bg-rose-50'}`}>
                      <span className={`w-2.5 h-2.5 rounded-full ${isIn ? 'bg-brand-500' : 'bg-rose-400'}`} />
                    </div>
                    <p className={`flex-1 text-sm font-semibold ${isIn ? 'text-brand-700' : 'text-rose-500'}`}>
                      Punch {isIn ? 'In' : 'Out'}
                    </p>
                    <p className="text-sm font-medium text-gray-500 tabular-nums">
                      {new Date(ev.timestamp).toLocaleTimeString('en-IN', {
                        hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata',
                      })}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
