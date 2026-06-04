import { API_BASE } from '../config.js'
import { getToken, getRefreshToken, saveToken, clearSession } from '../utils/storage.js'

let onUnauthorized = null

export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn
}

async function request(path, options = {}, authenticated = true) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers ?? {}) }

  if (authenticated) {
    const token = getToken()
    if (token) headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })

  if (res.status === 401 && authenticated) {
    const refreshToken = getRefreshToken()
    if (refreshToken) {
      // Attempt silent refresh — extend if backend provides a refresh endpoint
      clearSession()
    }
    onUnauthorized?.()
    const err = new Error('Unauthorized')
    err.status = 401
    throw err
  }

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    const err = new Error(data?.message || data?.error || `HTTP ${res.status}`)
    err.status = res.status
    err.data = data
    throw err
  }

  // Some API responses use HTTP 200 but signal failure via { success: false }
  if (data?.success === false) {
    const err = new Error(data?.message || 'Request failed')
    err.status = data?.statusCode ?? res.status
    err.data = data
    throw err
  }

  return data
}

// Auth
export const signIn = (body) =>
  request('/sign-in', { method: 'POST', body: JSON.stringify(body) }, false)

export const forgotPassword = (body) =>
  request('/forgot-password', { method: 'POST', body: JSON.stringify(body) }, false)

export const otpValidation = (body) =>
  request('/otp-validation', { method: 'POST', body: JSON.stringify(body) }, false)

export const confirmPassword = (body) =>
  request('/confirm-password', { method: 'POST', body: JSON.stringify(body) }, false)

// Profile
export const getProfile = () => request('/profile')

// Attendance
export const getAttendance = (uid) => request(`/attendance?user=${uid}`)

export const postAttendance = (body) =>
  request('/attendance', { method: 'POST', body: JSON.stringify(body) })

// Push
export const subscribePush = (body) =>
  request('/push/subscribe', { method: 'POST', body: JSON.stringify(body) })
