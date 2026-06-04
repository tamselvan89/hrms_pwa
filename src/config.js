export const API_BASE = import.meta.env.VITE_API_BASE ?? 'https://api.hrms.netkathir.com/api/v1'
export const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY ?? ''

export const OFFICE_LAT = parseFloat(import.meta.env.VITE_OFFICE_LAT ?? '0')
export const OFFICE_LNG = parseFloat(import.meta.env.VITE_OFFICE_LNG ?? '0')
export const GEOFENCE_RADIUS_M = parseFloat(import.meta.env.VITE_GEOFENCE_RADIUS_M ?? '200')
export const ACCURACY_THRESHOLD_M = parseFloat(import.meta.env.VITE_ACCURACY_THRESHOLD_M ?? '100')

// Haversine distance in metres between two lat/lng points
export function distanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000
  const toRad = d => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}
