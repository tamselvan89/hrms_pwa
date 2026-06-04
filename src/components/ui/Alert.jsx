export function Alert({ type = 'error', message }) {
  if (!message) return null
  const styles = {
    error: 'bg-red-50 text-red-700 border border-red-200',
    success: 'bg-green-50 text-green-700 border border-green-200',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200',
    info: 'bg-blue-50 text-blue-700 border border-blue-200',
  }
  return (
    <div className={`rounded-xl px-3 py-2.5 text-sm ${styles[type]}`}>
      {message}
    </div>
  )
}
