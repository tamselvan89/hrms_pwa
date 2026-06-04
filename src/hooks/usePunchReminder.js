import { useEffect } from 'react'

// IST offset
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000

// Returns ms until next 9:00 PM IST from now. Negative if already past.
function msUntil9PMIST() {
  const nowUTC = Date.now()
  const nowIST = nowUTC + IST_OFFSET_MS
  const istDate = new Date(nowIST)

  // Build today's 9 PM IST in UTC
  const target = Date.UTC(
    istDate.getUTCFullYear(),
    istDate.getUTCMonth(),
    istDate.getUTCDate(),
    21 - 5, 60 - 30, 0, 0   // 21:00 IST = 15:30 UTC
  ) - IST_OFFSET_MS + IST_OFFSET_MS  // cancel out — simpler below

  // Simpler: 9PM IST = today 15:30 UTC
  const todayUTC = new Date(nowUTC)
  const target9PM = Date.UTC(
    todayUTC.getUTCFullYear(),
    todayUTC.getUTCMonth(),
    todayUTC.getUTCDate(),
    15, 30, 0, 0   // 21:00 IST = 15:30 UTC
  )

  return target9PM - nowUTC
}

export function usePunchReminder(isPunchedIn) {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    async function schedule() {
      const reg = await navigator.serviceWorker.ready
      if (!reg.active) return

      if (isPunchedIn) {
        const ms = msUntil9PMIST()
        if (ms > 0) {
          reg.active.postMessage({ type: 'SCHEDULE_PUNCHOUT_REMINDER', msUntil9PM: ms })
          console.info(`[reminder] Punch-out reminder scheduled in ${Math.round(ms / 60000)} mins (9 PM IST)`)
        }
      } else {
        // Punched out — cancel any pending reminder
        reg.active.postMessage({ type: 'CANCEL_PUNCHOUT_REMINDER' })
      }
    }

    schedule()
  }, [isPunchedIn])
}
