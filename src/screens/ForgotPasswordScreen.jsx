import { useState } from 'react'
import { forgotPassword, otpValidation, confirmPassword } from '../api/client.js'

function BackButton({ onClick }) {
  return (
    <button onClick={onClick}
      className="w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-600 active:bg-gray-200 flex-shrink-0">
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
    </button>
  )
}

function StepDots({ current, total }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={`h-1.5 rounded-full transition-all duration-300
          ${i === current ? 'w-6 bg-brand-600' : i < current ? 'w-3 bg-brand-300' : 'w-3 bg-gray-200'}`} />
      ))}
    </div>
  )
}

function InputRow({ icon, error, children }) {
  return (
    <div className="flex flex-col gap-1">
      <div className={`flex items-center bg-gray-50 border rounded-2xl px-4 py-3.5 gap-3 transition-colors
        ${error ? 'border-red-300 bg-red-50' : 'border-gray-200 focus-within:border-brand-500 focus-within:bg-white'}`}>
        <span className="text-gray-400 flex-shrink-0">{icon}</span>
        {children}
      </div>
      {error && <p className="text-xs text-red-500 pl-1">{error}</p>}
    </div>
  )
}

function PasswordRow({ placeholder, value, onChange, error, autoComplete }) {
  const [show, setShow] = useState(false)
  return (
    <InputRow error={error} icon={
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    }>
      <input type={show ? 'text' : 'password'} placeholder={placeholder} value={value}
        onChange={onChange} autoComplete={autoComplete}
        className="flex-1 bg-transparent text-gray-900 text-base outline-none placeholder:text-gray-400" />
      <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => setShow(s => !s)}
        className="text-gray-400 p-1 flex-shrink-0">
        {show
          ? <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.97 9.97 0 012.525-4.046m3.116-2.454A9.956 9.956 0 0112 5c4.477 0 8.268 2.943 9.542 7a9.99 9.99 0 01-4.423 5.366M9.88 9.88a3 3 0 104.24 4.24M3 3l18 18" />
            </svg>
          : <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
        }
      </button>
    </InputRow>
  )
}

function PrimaryButton({ loading, children, ...props }) {
  return (
    <button {...props} disabled={loading || props.disabled}
      className="w-full bg-brand-600 text-white font-bold text-base py-4 rounded-2xl
        flex items-center justify-center gap-2 active:bg-brand-700 disabled:opacity-60
        shadow-lg shadow-brand-200 transition-all active:scale-[0.98]">
      {loading && (
        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      )}
      {children}
    </button>
  )
}

// ── Step 1 — Enter email ────────────────────────────────────────────────────
function StepEmail({ onNext, onBack }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim()) { setError('Email is required'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Enter a valid email address'); return }
    setError('')
    setLoading(true)
    try {
      await forgotPassword({ email: email.trim() })
      onNext(email.trim())
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 flex-1">
      {/* Icon */}
      <div className="w-16 h-16 rounded-3xl bg-brand-50 flex items-center justify-center mb-2">
        <svg className="h-8 w-8 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900">Forgot Password?</h2>
        <p className="text-sm text-gray-400 mt-1">Enter your work email and we'll send a verification code.</p>
      </div>

      <InputRow error={error} icon={
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      }>
        <input type="email" placeholder="you@netkathir.com" autoComplete="email"
          inputMode="email" value={email}
          onChange={e => { setEmail(e.target.value); setError('') }}
          className="flex-1 bg-transparent text-gray-900 text-base outline-none placeholder:text-gray-400" />
      </InputRow>

      <PrimaryButton type="submit" loading={loading}>
        {!loading && (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        )}
        {loading ? 'Sending…' : 'Send Code'}
      </PrimaryButton>
    </form>
  )
}

// ── Step 2 — Verify OTP ─────────────────────────────────────────────────────
function StepOTP({ email, onNext, onBack }) {
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState('')
  const [resent, setResent] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!otp.trim()) { setError('Enter the verification code'); return }
    setError('')
    setLoading(true)
    try {
      await otpValidation({ email, otp: Number(otp) })
      onNext()
    } catch (err) {
      setError(err.message || 'Invalid or expired code. Try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    setResending(true); setResent(false); setError('')
    try {
      await forgotPassword({ email })
      setResent(true)
    } catch {
      setError('Failed to resend. Please try again.')
    } finally {
      setResending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 flex-1">
      <div className="w-16 h-16 rounded-3xl bg-brand-50 flex items-center justify-center mb-2">
        <svg className="h-8 w-8 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900">Verify Email</h2>
        <p className="text-sm text-gray-400 mt-1">
          Code sent to <span className="font-semibold text-gray-600">{email}</span>
        </p>
      </div>

      {/* OTP input */}
      <InputRow error={error} icon={
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
        </svg>
      }>
        <input type="text" inputMode="numeric" placeholder="Enter 6-digit code"
          value={otp} maxLength={8}
          onChange={e => { setOtp(e.target.value.replace(/\D/g, '')); setError('') }}
          className="flex-1 bg-transparent text-gray-900 text-base outline-none placeholder:text-gray-400 tracking-widest font-semibold" />
      </InputRow>

      {resent && (
        <div className="flex items-center gap-2 text-brand-600 text-sm font-medium bg-brand-50 rounded-xl px-3 py-2.5">
          <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          New code sent to your email
        </div>
      )}

      <PrimaryButton type="submit" loading={loading}>
        {!loading && (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )}
        {loading ? 'Verifying…' : 'Verify Code'}
      </PrimaryButton>

      <button type="button" onClick={handleResend} disabled={resending}
        className="text-sm text-center text-brand-600 font-semibold py-1 disabled:opacity-50">
        {resending ? 'Sending…' : "Didn't get a code? Resend"}
      </button>
    </form>
  )
}

// ── Step 3 — Reset password ─────────────────────────────────────────────────
function StepReset({ email, onDone }) {
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  function validatePassword(pwd) {
    if (pwd.length < 8) return 'At least 8 characters required'
    if (!/[A-Z]/.test(pwd)) return 'Include one uppercase letter'
    if (!/[a-z]/.test(pwd)) return 'Include one lowercase letter'
    if (!/\d/.test(pwd)) return 'Include one number'
    if (!/[^a-zA-Z0-9]/.test(pwd)) return 'Include one special character'
    return ''
  }

  function validate() {
    const errors = {}
    const e = validatePassword(newPwd)
    if (e) errors.newPwd = e
    if (!confirmPwd) errors.confirmPwd = 'Please confirm your password'
    else if (newPwd !== confirmPwd) errors.confirmPwd = 'Passwords do not match'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    setError('')
    setLoading(true)
    try {
      await confirmPassword({ email, password: newPwd })
      onDone()
    } catch (err) {
      setError(err.message || 'Failed to reset password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 flex-1">
      <div className="w-16 h-16 rounded-3xl bg-brand-50 flex items-center justify-center mb-2">
        <svg className="h-8 w-8 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900">New Password</h2>
        <p className="text-sm text-gray-400 mt-1">Choose a strong password for your account.</p>
      </div>

      <PasswordRow placeholder="New password" value={newPwd} autoComplete="new-password"
        onChange={e => { setNewPwd(e.target.value); setFieldErrors(p => ({ ...p, newPwd: '' })) }}
        error={fieldErrors.newPwd} />

      <PasswordRow placeholder="Confirm password" value={confirmPwd} autoComplete="new-password"
        onChange={e => { setConfirmPwd(e.target.value); setFieldErrors(p => ({ ...p, confirmPwd: '' })) }}
        error={fieldErrors.confirmPwd} />

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-xl px-3 py-2.5">
          <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      <PrimaryButton type="submit" loading={loading}>
        {!loading && (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        )}
        {loading ? 'Resetting…' : 'Reset Password'}
      </PrimaryButton>
    </form>
  )
}

// ── Root ────────────────────────────────────────────────────────────────────
export function ForgotPasswordScreen({ onBack, onDone }) {
  const [step, setStep] = useState(0)
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)

  function handleDone() {
    setDone(true)
    setTimeout(onDone, 2000)
  }

  return (
    <div className="h-screen-safe flex flex-col bg-white pt-safe pb-safe">

      {/* Nav bar */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2 flex-shrink-0">
        <BackButton onClick={step === 0 ? onBack : () => setStep(s => s - 1)} />
        <StepDots current={step} total={3} />
        <div className="w-10" />
      </div>

      {/* Content */}
      <div className="flex-1 px-6 pt-4 scroll-area">
        {done ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <div className="w-20 h-20 rounded-full bg-brand-50 flex items-center justify-center">
              <svg className="h-10 w-10 text-brand-600 draw-check" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Password Reset!</h2>
            <p className="text-sm text-gray-400">Redirecting you to sign in…</p>
          </div>
        ) : step === 0 ? (
          <StepEmail onNext={e => { setEmail(e); setStep(1) }} onBack={onBack} />
        ) : step === 1 ? (
          <StepOTP email={email} onNext={() => setStep(2)} onBack={() => setStep(0)} />
        ) : (
          <StepReset email={email} onDone={handleDone} />
        )}
      </div>
    </div>
  )
}
