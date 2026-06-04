import { createContext, useContext, useReducer, useEffect, useCallback } from 'react'
import { signIn as apiSignIn, getProfile as apiGetProfile } from '../api/client.js'
import { setUnauthorizedHandler } from '../api/client.js'
import {
  saveToken, getToken, isTokenExpired, saveProfile, getProfile, clearSession,
} from '../utils/storage.js'
import { hashPassword } from '../utils/crypto.js'

const AuthContext = createContext(null)

const initialState = {
  status: 'booting', // booting | authenticated | unauthenticated
  profile: null,
  error: null,
}

function reducer(state, action) {
  switch (action.type) {
    case 'RESTORE':
      return { ...state, status: 'authenticated', profile: action.profile, error: null }
    case 'UNAUTHENTICATED':
      return { ...state, status: 'unauthenticated', profile: null, error: null }
    case 'LOGIN_SUCCESS':
      return { ...state, status: 'authenticated', profile: action.profile, error: null }
    case 'LOGOUT':
      return { ...state, status: 'unauthenticated', profile: null, error: null }
    case 'SET_ERROR':
      return { ...state, error: action.error }
    case 'CLEAR_ERROR':
      return { ...state, error: null }
    default:
      return state
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  // Boot: check stored token + restore profile
  useEffect(() => {
    const token = getToken()
    if (!token || isTokenExpired()) {
      dispatch({ type: 'UNAUTHENTICATED' })
      return
    }
    const profile = getProfile()
    if (profile) {
      dispatch({ type: 'RESTORE', profile })
    } else {
      // Token exists but no cached profile — fetch it
      apiGetProfile()
        .then(res => {
          const p = res.data?.[0] ?? res.data
          if (p) {
            saveProfile(p)
            dispatch({ type: 'RESTORE', profile: p })
          } else {
            dispatch({ type: 'UNAUTHENTICATED' })
          }
        })
        .catch(() => dispatch({ type: 'UNAUTHENTICATED' }))
    }
  }, [])

  // Wire 401 handler so mid-session expiry routes to login
  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearSession()
      dispatch({ type: 'LOGOUT' })
    })
  }, [])

  const login = useCallback(async (username, password) => {
    dispatch({ type: 'CLEAR_ERROR' })
    const hashed = await hashPassword(password)
    const res = await apiSignIn({ username, password: hashed })

    if (import.meta.env.DEV) {
      // Log sign-in response keys so we can confirm the token field name
      console.debug('[sign-in response]', JSON.stringify(res, null, 2))
    }

    // Normalise token field — covers common backend conventions
    const token =
      res.token ??
      res.accessToken ??
      res.access_token ??
      res.data?.token ??
      res.data?.accessToken ??
      res.data?.access_token

    if (!token) {
      throw new Error(
        'Login succeeded but no token was returned. ' +
        'Check the sign-in response shape with the backend team.'
      )
    }

    const expiry = res.expiresAt ?? res.exp ?? res.data?.expiresAt ?? null
    const refreshToken =
      res.refreshToken ?? res.data?.refreshToken ?? null

    saveToken(token, expiry, refreshToken)

    const profileRes = await apiGetProfile()
    const profile = profileRes.data?.[0] ?? profileRes.data
    if (!profile) throw new Error('Could not load profile.')
    saveProfile(profile)

    dispatch({ type: 'LOGIN_SUCCESS', profile })
    return profile
  }, [])

  const logout = useCallback(() => {
    clearSession()
    dispatch({ type: 'LOGOUT' })
  }, [])

  return (
    <AuthContext.Provider value={{ ...state, login, logout, dispatch }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
