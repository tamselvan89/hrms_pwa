const KEYS = {
  TOKEN: 'pwa_token',
  REFRESH_TOKEN: 'pwa_refresh_token',
  TOKEN_EXPIRY: 'pwa_token_expiry',
  PROFILE: 'pwa_profile',
}

export function saveToken(token, expiry = null, refreshToken = null) {
  localStorage.setItem(KEYS.TOKEN, token)
  if (expiry) localStorage.setItem(KEYS.TOKEN_EXPIRY, String(expiry))
  if (refreshToken) localStorage.setItem(KEYS.REFRESH_TOKEN, refreshToken)
}

export function getToken() {
  return localStorage.getItem(KEYS.TOKEN)
}

export function getRefreshToken() {
  return localStorage.getItem(KEYS.REFRESH_TOKEN)
}

export function getTokenExpiry() {
  const v = localStorage.getItem(KEYS.TOKEN_EXPIRY)
  return v ? parseInt(v, 10) : null
}

export function isTokenExpired() {
  const expiry = getTokenExpiry()
  if (!expiry) return false // no expiry info — treat as valid, rely on 401
  return Date.now() >= expiry * 1000
}

export function saveProfile(profile) {
  // Never store the password field even if the API returns it
  const { password: _omit, ...safe } = profile
  localStorage.setItem(KEYS.PROFILE, JSON.stringify(safe))
}

export function getProfile() {
  const v = localStorage.getItem(KEYS.PROFILE)
  return v ? JSON.parse(v) : null
}

export function clearSession() {
  Object.values(KEYS).forEach(k => localStorage.removeItem(k))
}
