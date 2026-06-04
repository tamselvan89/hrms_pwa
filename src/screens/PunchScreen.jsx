import { useState, useEffect, useCallback, useRef } from 'react'
import logoMark from '../assets/logo-mark.png'
import { FlipClock } from '../components/FlipClock.jsx'
import { useInstallPrompt } from '../hooks/useInstallPrompt.js'
import { usePunchReminder } from '../hooks/usePunchReminder.js'
import { useAuth } from '../context/AuthContext.jsx'
import { getAttendance, postAttendance } from '../api/client.js'
import { computeWorked, findTodayRecord } from '../utils/attendance.js'
import { formatDuration, formatDisplayDate } from '../utils/date.js'
import { getTodaysKural } from '../data/thirukkural.js'
import { useSpeech } from '../hooks/useSpeech.js'
import {
  OFFICE_LAT, OFFICE_LNG, GEOFENCE_RADIUS_M, distanceMeters,
} from '../config.js'

const STATE = { IDLE: 'idle', LOCATING: 'locating', SUBMITTING: 'submitting', SUCCESS: 'success' }
const WORKDAY_MS = 9 * 60 * 60 * 1000

function SpinnerIcon({ className = 'h-5 w-5' }) {
  return (
    <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  )
}

// ── Greeting based on time of day ──────────────────────────────────────────
function getGreeting() {
  const hour = new Date().toLocaleString('en-IN', { hour: 'numeric', hour12: false, timeZone: 'Asia/Kolkata' })
  const h = parseInt(hour)
  if (h < 12) return 'Good Morning'
  if (h < 17) return 'Good Afternoon'
  return 'Good Evening'
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
    } catch { }
    finally { setIsLoading(false) }
  }, [profile?.uid])

  useEffect(() => { loadAttendance() }, [loadAttendance])

  const { totalMs, isPunchedIn, nextAction } = computeWorked(events, now)
  const { deferredPrompt, isStandalone, promptInstall } = useInstallPrompt()
  usePunchReminder(isPunchedIn)

  async function submitPunch() {
    const action = nextAction
    lastPunchedAction.current = action
    setPunchState(STATE.SUBMITTING)
    try {
      const res = await postAttendance({ check: action })
      const doc = res.data?._doc || res.data
      if (doc?.events) setEvents(doc.events)
      else await loadAttendance()
      setPunchState(STATE.SUCCESS)
      setTimeout(() => { setPunchState(STATE.IDLE); setAlertMsg(null) }, 3000)
    } catch (err) {
      setPunchState(STATE.IDLE)
      setAlertMsg({ type: 'error', message: err.message || 'Punch failed. Please try again.' })
    }
  }

  async function handlePunch() {
    setAlertMsg(null)
    setPunchState(STATE.LOCATING)
    if (!navigator.geolocation) {
      setAlertMsg({ type: 'error', message: 'Geolocation not supported.' })
      setPunchState(STATE.IDLE); return
    }
    const MAX_WAIT_MS = 10000
    let bestPosition = null, settled = false
    const position = await new Promise((resolve) => {
      let watchId = null
      function finish(pos) {
        if (settled) return; settled = true
        if (watchId !== null) { navigator.geolocation.clearWatch(watchId); watchId = null }
        resolve(pos)
      }
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          if (!bestPosition || pos.coords.accuracy < bestPosition.coords.accuracy) bestPosition = pos
          if (pos.coords.accuracy <= 200) finish(pos)
        },
        (err) => { if (err.code === 1) finish(null) },
        { enableHighAccuracy: true, timeout: MAX_WAIT_MS, maximumAge: 0 }
      )
      setTimeout(() => { if (!settled) finish(bestPosition) }, MAX_WAIT_MS)
    })
    if (!position && !bestPosition) {
      setPunchState(STATE.IDLE)
      setAlertMsg({ type: 'error', message: 'Location access denied. Enable location and try again.' }); return
    }
    const pos = position || bestPosition
    const { latitude, longitude, accuracy } = pos.coords
    const distance = distanceMeters(latitude, longitude, OFFICE_LAT, OFFICE_LNG)
    console.info(`[geofence] lat:${latitude.toFixed(5)} lng:${longitude.toFixed(5)} | accuracy:${Math.round(accuracy)}m | distance:${Math.round(distance)}m | radius:${GEOFENCE_RADIUS_M}m`)
    if (distance > GEOFENCE_RADIUS_M) {
      const distLabel = distance >= 1000 ? `${(distance / 1000).toFixed(1)} km` : `${Math.round(distance)} m`
      setPunchState(STATE.IDLE)
      setAlertMsg({ type: 'error', message: `You're not at the office. You are ${distLabel} away.\nYour GPS: ${latitude.toFixed(5)}, ${longitude.toFixed(5)} (±${Math.round(accuracy)}m)\nOffice: ${OFFICE_LAT}, ${OFFICE_LNG}` }); return
    }
    await submitPunch()
  }

  const isButtonBusy = punchState === STATE.LOCATING || punchState === STATE.SUBMITTING
  const isSuccess = punchState === STATE.SUCCESS
  const isLocating = punchState === STATE.LOCATING
  const initials = [profile?.firstname?.[0], profile?.lastname?.[0]].filter(Boolean).join('')
  const sortedEvents = [...events].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
  const progressPct = Math.min(100, (totalMs / WORKDAY_MS) * 100)

  // Punch button config
  const punchIsIn = isSuccess ? lastPunchedAction.current === 'in' : nextAction === 'in'
  const punchColor = isSuccess
    ? (lastPunchedAction.current === 'in' ? { from: '#16a34a', to: '#15803d', glow: '#bbf7d0' }
      : { from: '#f43f5e', to: '#e11d48', glow: '#fecdd3' })
    : isButtonBusy
      ? { from: '#94a3b8', to: '#64748b', glow: '#e2e8f0' }
      : nextAction === 'in'
        ? { from: '#16a34a', to: '#15803d', glow: '#bbf7d0' }
        : { from: '#f43f5e', to: '#e11d48', glow: '#fecdd3' }

  const punchLabel = isSuccess
    ? (lastPunchedAction.current === 'in' ? 'Punched In!' : 'Punched Out!')
    : isLocating ? 'Getting Location…'
    : punchState === STATE.SUBMITTING ? 'Recording…'
    : nextAction === 'in' ? 'Punch In' : 'Punch Out'

  return (
    <div className="h-screen-safe flex flex-col bg-gray-50">

      {/* ── Header ── */}
      <header className="bg-brand-600 pt-safe flex-shrink-0">
        <div className="px-4 pt-3 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-white flex items-center justify-center flex-shrink-0">
              <img src={logoMark} alt="NK" className="h-6 w-6 object-contain" draggable="false" />
            </div>
            <div>
              <p className="text-brand-200 text-[10px] font-medium leading-none">{getGreeting()}</p>
              <h1 className="text-white text-sm font-bold leading-tight">{profile?.firstname || 'there'} 👋</h1>
            </div>
          </div>
          <div className="relative" ref={menuRef}>
            <button onClick={() => setMenuOpen(o => !o)}
              className="w-9 h-9 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-white font-bold text-sm">
              {initials || '?'}
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-1 z-50 overflow-hidden">
                <button onClick={() => { setMenuOpen(false); onOpenProfile() }}
                  className="w-full text-left px-4 py-3 text-sm text-gray-700 font-medium active:bg-gray-50">My Profile</button>
                {deferredPrompt && !isStandalone && (
                  <><div className="h-px bg-gray-100 mx-3" />
                    <button onClick={() => { setMenuOpen(false); promptInstall() }}
                      className="w-full text-left px-4 py-3 text-sm text-brand-600 font-semibold active:bg-brand-50 flex items-center gap-2">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>Install App</button>
                  </>
                )}
                <div className="h-px bg-gray-100 mx-3" />
                <button onClick={() => { setMenuOpen(false); logout() }}
                  className="w-full text-left px-4 py-3 text-sm text-rose-500 font-medium active:bg-rose-50">Logout</button>
              </div>
            )}
          </div>
        </div>
        <div className="px-4 pb-4">
          <p className="text-brand-200 text-[10px] font-medium">{formatDisplayDate()}</p>
          <FlipClock date={new Date(now)} className="text-white text-3xl font-bold tracking-tight mt-0.5" />
        </div>
      </header>

      {/* ── Scrollable info area ── */}
      <div className="flex-1 scroll-area px-4 pt-3 flex flex-col gap-3">

        {/* Alert banners */}
        {isSuccess && (
          <div className={`rounded-2xl px-4 py-3 flex items-center gap-3 animate-slide-up flex-shrink-0
            ${lastPunchedAction.current === 'in' ? 'bg-brand-50 border border-brand-200' : 'bg-rose-50 border border-rose-200'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
              ${lastPunchedAction.current === 'in' ? 'bg-brand-600' : 'bg-rose-500'}`}>
              <svg className="h-4 w-4 draw-check" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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

        {alertMsg?.type === 'error' && (
          <div className="rounded-2xl px-4 py-3 bg-red-50 border border-red-200 animate-slide-up flex-shrink-0">
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

        {/* Quick stats */}
        <QuickStats events={sortedEvents} totalMs={totalMs} isPunchedIn={isPunchedIn} />

        {/* Thirukkural */}
        <KuralCard />

        {/* Today's activity */}
        {sortedEvents.length > 0 && (
          <div className="bg-white rounded-2xl px-4 pt-4 pb-2 shadow-sm flex-shrink-0">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Today's Activity</p>
              <span className="text-[11px] font-semibold text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
                {sortedEvents.length} {sortedEvents.length === 1 ? 'entry' : 'entries'}
              </span>
            </div>
            <div className="overflow-y-auto divide-y divide-gray-50" style={{ maxHeight: '10rem' }}>
              {sortedEvents.map((ev, i) => {
                const evIn = ev.check === 'in'
                return (
                  <div key={ev._id || i} className="flex items-center gap-3 py-2.5 first:pt-0">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${evIn ? 'bg-brand-50' : 'bg-rose-50'}`}>
                      <span className={`w-2 h-2 rounded-full ${evIn ? 'bg-brand-500' : 'bg-rose-400'}`} />
                    </div>
                    <p className={`flex-1 text-sm font-semibold ${evIn ? 'text-brand-700' : 'text-rose-500'}`}>
                      Punch {evIn ? 'In' : 'Out'}
                    </p>
                    <p className="text-sm font-medium text-gray-400 tabular-nums">
                      {new Date(ev.timestamp).toLocaleTimeString('en-IN', {
                        hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata',
                      })}
                    </p>
                  </div>
                )
              })}
            </div>
            {sortedEvents.length > 3 && (
              <p className="text-center text-[10px] text-gray-300 py-2">↑ scroll to see all</p>
            )}
          </div>
        )}

        <div className="h-2 flex-shrink-0" />
      </div>

      {/* ── PUNCH PANEL — compact, pinned at bottom ── */}
      <div className="flex-shrink-0 bg-white border-t border-gray-100 px-4 pt-3 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">

        {/* Single row: status + progress bar + hours */}
        <div className="flex items-center gap-2 mb-2">
          <div className={`inline-flex items-center gap-1 text-[11px] font-semibold rounded-full px-2 py-1 flex-shrink-0
            ${isPunchedIn ? 'bg-brand-50 text-brand-700' : 'bg-gray-100 text-gray-500'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isPunchedIn ? 'bg-brand-500 animate-pulse' : 'bg-gray-300'}`} />
            {isPunchedIn ? 'In Office' : 'Not Clocked In'}
          </div>
          {!isLoading && (
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${progressPct.toFixed(1)}%`, background: progressPct >= 100 ? '#16a34a' : '#4ade80' }} />
            </div>
          )}
          <p className="text-sm font-bold text-brand-700 tabular-nums flex-shrink-0">
            {isLoading ? '…' : formatDuration(totalMs)}
          </p>
        </div>

        {/* Punch button */}
        <div className="relative">
          {isLocating && (
            <span className="absolute inset-0 rounded-2xl animate-sonar opacity-30 pointer-events-none"
              style={{ background: punchColor.glow }} />
          )}
          <button
            key={punchState}
            onClick={handlePunch}
            disabled={isButtonBusy || isLoading}
            className={`w-full py-3.5 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-3
              disabled:opacity-60 disabled:cursor-not-allowed select-none transition-all duration-200 relative overflow-hidden
              ${isSuccess ? 'animate-pop' : ''}
              ${!isButtonBusy && !isSuccess ? 'active:scale-[0.98]' : ''}`}
            style={{
              background: `linear-gradient(135deg, ${punchColor.from}, ${punchColor.to})`,
              boxShadow: `0 4px 16px ${punchColor.glow}`,
            }}
          >
            {isLocating || punchState === STATE.SUBMITTING
              ? <SpinnerIcon className="h-5 w-5" />
              : isSuccess
                ? <svg className="h-5 w-5 draw-check" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                : punchIsIn
                  ? <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" />
                    </svg>
                  : <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
                    </svg>
            }
            <span key={punchLabel} className="animate-slide-up">{punchLabel}</span>
            {isSuccess && (
              <span className="absolute inset-0 rounded-2xl animate-ripple pointer-events-none"
                style={{ background: punchColor.glow }} />
            )}
          </button>
        </div>

        <p className="text-center text-[10px] text-gray-300 flex items-center justify-center gap-1 pt-2 pb-1">
          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
          Location verified on each punch
        </p>
      </div>
    </div>
  )
}

// ── Quick stats ───────────────────────────────────────────────────────────
function QuickStats({ events, totalMs, isPunchedIn }) {
  // First punch-in time today
  const firstIn = events.find(e => e.check === 'in')
  const firstInTime = firstIn
    ? new Date(firstIn.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })
    : '--'

  // Number of breaks (out→in pairs after first in)
  const breaks = events.filter(e => e.check === 'out').length

  // On-time status — before 9:30 AM IST = on time
  let onTimeLabel = '--'
  let onTimeColor = 'text-gray-400'
  if (firstIn) {
    const d = new Date(firstIn.timestamp)
    const istHour = parseInt(d.toLocaleString('en-IN', { hour: 'numeric', hour12: false, timeZone: 'Asia/Kolkata' }))
    const istMin = d.toLocaleString('en-IN', { minute: 'numeric', timeZone: 'Asia/Kolkata' })
    const totalMin = istHour * 60 + parseInt(istMin)
    if (totalMin <= 9 * 60) { onTimeLabel = 'On Time'; onTimeColor = 'text-brand-600' }
    else if (totalMin <= 10 * 60 + 30) { onTimeLabel = 'Late'; onTimeColor = 'text-amber-500' }
    else { onTimeLabel = 'Very Late'; onTimeColor = 'text-rose-500' }
  }

  const stats = [
    { label: 'First In', value: firstInTime, icon: '🕘' },
    { label: 'Breaks', value: breaks === 0 ? 'None' : `${breaks}`, icon: '☕' },
    { label: 'Arrival', value: onTimeLabel, icon: '📍', valueClass: onTimeColor },
  ]

  return (
    <div className="flex gap-2">
      {stats.map(s => (
        <div key={s.label} className="flex-1 bg-white rounded-2xl px-3 py-3 shadow-sm text-center">
          <p className="text-base mb-1">{s.icon}</p>
          <p className={`text-xs font-bold tabular-nums ${s.valueClass || 'text-gray-700'}`}>{s.value}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">{s.label}</p>
        </div>
      ))}
    </div>
  )
}

// ── Thirukkural card ──────────────────────────────────────────────────────
function KuralCard() {
  const kural = getTodaysKural()
  const [expanded, setExpanded] = useState(false)
  const [lang, setLang] = useState('tamil')
  const { isSupported, isSpeaking, isPaused, stop, toggle } = useSpeech()

  // Stop speech when card collapses or lang switches
  useEffect(() => { stop() }, [expanded, lang])

  function getSpeechText() {
    if (lang === 'tamil') {
      return `திருக்குறள் ${kural.number}. ${kural.tamil}. பொருள்: ${kural.tamilMeaning}`
    }
    return `Thirukkural number ${kural.number}. ${kural.transliteration.replace('/', '.')}. Meaning: ${kural.english}`
  }

  function handleSpeak() {
    const langCode = lang === 'tamil' ? 'ta-IN' : 'en-IN'
    const rate = lang === 'tamil' ? 0.8 : 0.9
    toggle(getSpeechText(), langCode, rate, 1)
  }

  // Speaker button icon
  function SpeakerIcon() {
    if (isSpeaking && !isPaused) {
      // Animated sound waves — playing
      return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="white" stroke="white" />
          <path d="M15.54 8.46a5 5 0 010 7.07" className="animate-pulse" />
          <path d="M19.07 4.93a10 10 0 010 14.14" className="animate-pulse" style={{ animationDelay: '0.15s' }} />
        </svg>
      )
    }
    if (isPaused) {
      // Paused — play icon
      return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="white" stroke="none">
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
      )
    }
    // Idle — speaker icon
    return (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="white" stroke="white" />
        <path d="M15.54 8.46a5 5 0 010 7.07" />
      </svg>
    )
  }

  return (
    <div className="bg-gradient-to-br from-brand-700 to-brand-900 rounded-2xl px-4 py-4 shadow-md">

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">📖</span>
          <p className="text-brand-200 text-[11px] font-semibold uppercase tracking-widest">
            Thirukkural of the Day
          </p>
        </div>
        <span className="text-brand-300 text-[11px] font-semibold bg-white/10 px-2 py-0.5 rounded-full">
          #{kural.number}
        </span>
      </div>

      {/* Tamil verse — tappable to expand */}
      <button className="w-full text-left" onClick={() => setExpanded(e => !e)}>
        <p className="text-white text-sm font-medium leading-relaxed whitespace-pre-line" style={{ fontFamily: 'serif' }}>
          {kural.tamil}
        </p>
        <p className="text-brand-400 text-[10px] mt-1.5">
          {expanded ? '▲ Hide meaning' : '▼ Show meaning'}
        </p>
      </button>

      {/* Expanded meaning */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-white/10 animate-slide-up">

          {/* Controls: lang toggle + speak button */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex bg-white/10 rounded-xl p-0.5">
              {['tamil', 'english'].map(l => (
                <button key={l} onClick={() => setLang(l)}
                  className={`px-3 py-1 rounded-[10px] text-xs font-semibold transition-all
                    ${lang === l ? 'bg-white text-brand-700 shadow-sm' : 'text-brand-300'}`}>
                  {l === 'tamil' ? 'தமிழ்' : 'English'}
                </button>
              ))}
            </div>

            {/* Speak / Pause / Stop — show if API exists */}
            {'speechSynthesis' in window && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSpeak}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all
                    ${isSpeaking && !isPaused
                      ? 'bg-amber-400 text-amber-900'
                      : isPaused
                        ? 'bg-brand-400 text-white'
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                >
                  <SpeakerIcon />
                  <span>{isSpeaking && !isPaused ? 'Pause' : isPaused ? 'Resume' : 'Listen'}</span>
                </button>
                {(isSpeaking || isPaused) && (
                  <button onClick={stop}
                    className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-brand-300">
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="4" y="4" width="16" height="16" rx="2" />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Meaning text — highlighted word-by-word feel via leading */}
          {lang === 'tamil'
            ? <p className="text-brand-100 text-sm leading-relaxed">{kural.tamilMeaning}</p>
            : <div className="flex flex-col gap-1.5">
                <p className="text-brand-300 text-[11px] tracking-wide italic">{kural.transliteration}</p>
                <p className="text-brand-100 text-sm leading-relaxed">"{kural.english}"</p>
              </div>
          }

          {/* Voice availability note */}
          {!isSupported && (
            <p className="text-brand-500 text-[10px] mt-2">
              🔇 Voice not supported on this browser
            </p>
          )}
        </div>
      )}
    </div>
  )
}
