export function Button({ children, variant = 'primary', className = '', loading = false, ...props }) {
  const base = 'flex items-center justify-center gap-2 w-full rounded-xl font-semibold text-sm py-3.5 px-4 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed'
  const variants = {
    primary: 'bg-brand-600 text-white hover:bg-brand-700 active:scale-[0.98]',
    outline: 'border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 active:scale-[0.98]',
    ghost: 'text-brand-600 hover:underline',
  }

  return (
    <button className={`${base} ${variants[variant]} ${className}`} disabled={loading || props.disabled} {...props}>
      {loading && (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      )}
      {children}
    </button>
  )
}
