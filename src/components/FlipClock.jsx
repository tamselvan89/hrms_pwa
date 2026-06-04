import { useRef } from 'react'

// Single digit slot — animates when value changes
function Digit({ value, className = '' }) {
  const prev = useRef(value)
  const changed = prev.current !== value

  // Update ref after render
  const key = value // key change forces remount → re-triggers animation
  prev.current = value

  return (
    <span
      key={key}
      className={`inline-block overflow-hidden ${className} ${changed ? 'animate-flip-digit' : ''}`}
      style={{ minWidth: '0.6em' }}
    >
      {value}
    </span>
  )
}

function Sep({ className = '' }) {
  return <span className={`${className}`}>:</span>
}

export function FlipClock({ date, className = '' }) {
  const d = date instanceof Date ? date : new Date(date)

  // Format in IST
  const parts = d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  })

  // Parse: "12:45:42 pm" → h1 h2 : m1 m2 : s1 s2 ampm
  const [time, ampm] = parts.split(' ')
  const [hh, mm, ss] = time.split(':')

  const h1 = hh[0], h2 = hh[1]
  const m1 = mm[0], m2 = mm[1]
  const s1 = ss[0], s2 = ss[1]

  return (
    <span className={`inline-flex items-baseline tabular-nums ${className}`}>
      {/* Hours */}
      <Digit value={h1} />
      <Digit value={h2} />
      <Sep className="mx-0.5" />
      {/* Minutes */}
      <Digit value={m1} />
      <Digit value={m2} />
      {/* Seconds — small, tucked at baseline */}
      <span className="inline-flex items-baseline ml-1 text-[0.55em] opacity-70 font-semibold self-end mb-[0.15em]">
        <Digit value={s1} />
        <Digit value={s2} />
      </span>
      {/* AM/PM */}
      <span className="text-[0.35em] font-bold ml-1 uppercase opacity-70 tracking-widest self-end mb-[0.2em]">
        {ampm}
      </span>
    </span>
  )
}
