const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000

// Convert any date to IST calendar date string YYYY-MM-DD
export function toISTDateString(date) {
  const utcMs = new Date(date).getTime()
  const istMs = utcMs + IST_OFFSET_MS
  const d = new Date(istMs)
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function todayIST() {
  return toISTDateString(new Date())
}

// Format ms duration as "X hr Y mins"
export function formatDuration(ms) {
  if (ms <= 0) return '0 hr 0 mins'
  const totalMins = Math.floor(ms / 60000)
  const hrs = Math.floor(totalMins / 60)
  const mins = totalMins % 60
  return `${hrs} hr ${mins} mins`
}

// Format a date as "Wednesday, 4 June 2026"
export function formatDisplayDate(date = new Date()) {
  return date.toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    timeZone: 'Asia/Kolkata',
  })
}

// Format time as "HH:MM:SS AM/PM" in IST
export function formatDisplayTime(date = new Date()) {
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: true, timeZone: 'Asia/Kolkata',
  })
}
