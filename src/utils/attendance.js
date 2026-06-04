import { toISTDateString, todayIST } from './date.js'

// Sort events chronologically and derive punch state.
// nextAction: 'in' | 'out'
// totalMs: accumulated working time in milliseconds
export function computeWorked(events, now = Date.now()) {
  const ev = [...(events || [])].sort(
    (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
  )
  let totalMs = 0
  let openIn = null

  for (const e of ev) {
    if (e.check === 'in') {
      openIn = new Date(e.timestamp).getTime()
    } else if (e.check === 'out' && openIn != null) {
      totalMs += new Date(e.timestamp).getTime() - openIn
      openIn = null
    }
  }

  const isPunchedIn = openIn != null
  if (isPunchedIn) totalMs += now - openIn

  return { totalMs, isPunchedIn, nextAction: isPunchedIn ? 'out' : 'in' }
}

// Find today's attendance record from the data array.
// Handles both UTC-midnight and IST-midnight date strings.
export function findTodayRecord(data) {
  const today = todayIST()
  return (data || []).find(record => toISTDateString(record.date) === today) ?? null
}
