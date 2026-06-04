import { useState } from 'react'

export function Input({ label, type = 'text', icon, error, className = '', ...props }) {
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'
  const inputType = isPassword ? (show ? 'text' : 'password') : type

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && <label className="text-xs font-medium text-gray-500">{label}</label>}
      <div className={`flex items-center border rounded-xl px-3 py-3 gap-2 bg-white transition-colors ${error ? 'border-red-400' : 'border-gray-200 focus-within:border-brand-500'}`}>
        {icon && <span className="text-gray-400 flex-shrink-0">{icon}</span>}
        <input
          type={inputType}
          className="flex-1 text-sm outline-none bg-transparent text-gray-800 placeholder:text-gray-400"
          {...props}
        />
        {isPassword && (
          <button type="button" onClick={() => setShow(s => !s)} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
            {show ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

function EyeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.97 9.97 0 012.525-4.046m3.116-2.454A9.956 9.956 0 0112 5c4.477 0 8.268 2.943 9.542 7a9.99 9.99 0 01-4.423 5.366M9.88 9.88a3 3 0 104.24 4.24M3 3l18 18" />
    </svg>
  )
}
