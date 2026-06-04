import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { Alert } from '../components/ui/Alert.jsx'
import logoFull from '../assets/logo-full.png'

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider pl-1">{label}</label>
      {children}
    </div>
  )
}

function TextInput({ icon, error, ...props }) {
  return (
    <div className="flex flex-col gap-1">
      <div className={`flex items-center bg-gray-50 border rounded-2xl px-4 py-3.5 gap-3 transition-colors
        ${error ? 'border-red-300 bg-red-50' : 'border-gray-200 focus-within:border-brand-500 focus-within:bg-white'}`}>
        <span className="text-gray-400 flex-shrink-0">{icon}</span>
        <input
          className="flex-1 bg-transparent text-gray-900 text-base outline-none placeholder:text-gray-400"
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-500 pl-1">{error}</p>}
    </div>
  )
}

function PasswordInput({ error, ...props }) {
  const [show, setShow] = useState(false)
  return (
    <div className="flex flex-col gap-1">
      <div className={`flex items-center bg-gray-50 border rounded-2xl px-4 py-3.5 gap-3 transition-colors
        ${error ? 'border-red-300 bg-red-50' : 'border-gray-200 focus-within:border-brand-500 focus-within:bg-white'}`}>
        <span className="text-gray-400 flex-shrink-0">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </span>
        <input
          type={show ? 'text' : 'password'}
          className="flex-1 bg-transparent text-gray-900 text-base outline-none placeholder:text-gray-400"
          {...props}
        />
        <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => setShow(s => !s)}
          className="text-gray-400 flex-shrink-0 p-1">
          {show
            ? <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.97 9.97 0 012.525-4.046m3.116-2.454A9.956 9.956 0 0112 5c4.477 0 8.268 2.943 9.542 7a9.99 9.99 0 01-4.423 5.366M9.88 9.88a3 3 0 104.24 4.24M3 3l18 18" />
              </svg>
            : <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
          }
        </button>
      </div>
      {error && <p className="text-xs text-red-500 pl-1">{error}</p>}
    </div>
  )
}

export function LoginScreen({ onForgotPassword }) {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  function validate() {
    const errors = {}
    if (!username.trim()) errors.username = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username)) errors.username = 'Enter a valid email address'
    if (!password) errors.password = 'Password is required'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    setError('')
    setLoading(true)
    try {
      await login(username.trim(), password)
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen-safe flex flex-col bg-white pt-safe pb-safe">

      {/* Top — logo on white */}
      <div className="flex flex-col items-center justify-center px-8 py-8 flex-shrink-0">
        <img src={logoFull} alt="Netkathir Technologies"
          className="w-52 object-contain" draggable="false" />
        <div className="mt-3 flex items-center gap-2">
          <div className="h-px w-8 bg-gray-200" />
          <p className="text-[11px] text-gray-400 font-semibold tracking-widest uppercase">Attendance</p>
          <div className="h-px w-8 bg-gray-200" />
        </div>
      </div>

      {/* Form — takes remaining space */}
      <div className="flex-1 flex flex-col px-6 scroll-area">

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Sign in</h1>
          <p className="text-sm text-gray-400 mt-1">Enter your credentials to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <Field label="Email Address">
            <TextInput
              type="email"
              placeholder="you@netkathir.com"
              autoComplete="email"
              inputMode="email"
              value={username}
              onChange={e => { setUsername(e.target.value); setFieldErrors(p => ({ ...p, username: '' })) }}
              error={fieldErrors.username}
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              }
            />
          </Field>

          <Field label="Password">
            <PasswordInput
              placeholder="Enter your password"
              autoComplete="current-password"
              value={password}
              onChange={e => { setPassword(e.target.value); setFieldErrors(p => ({ ...p, password: '' })) }}
              error={fieldErrors.password}
            />
          </Field>

          <div className="flex justify-end -mt-2">
            <button type="button" onClick={onForgotPassword}
              className="text-sm font-semibold text-brand-600 py-1">
              Forgot password?
            </button>
          </div>

          {error && <Alert type="error" message={error} />}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-600 text-white font-bold text-base py-4 rounded-2xl
              flex items-center justify-center gap-2 active:bg-brand-700 disabled:opacity-60
              shadow-lg shadow-brand-200 transition-all active:scale-[0.98]"
          >
            {loading
              ? <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              : <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
            }
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-auto pt-6 pb-2 flex items-center justify-center">
          <p className="text-xs text-gray-300 font-medium">© Netkathir Technologies</p>
        </div>
      </div>
    </div>
  )
}
