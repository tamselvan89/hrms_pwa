export function ConfirmDialog({ title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', danger = false, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />

      {/* Sheet */}
      <div className="relative w-full bg-white rounded-t-3xl px-6 pt-5 pb-safe shadow-2xl animate-slide-up">
        <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mb-5" />

        {/* Icon */}
        <div className={`w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center
          ${danger ? 'bg-rose-50' : 'bg-amber-50'}`}>
          {danger
            ? <svg className="h-7 w-7 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            : <svg className="h-7 w-7 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
          }
        </div>

        <h2 className="text-lg font-bold text-gray-900 text-center">{title}</h2>
        <p className="text-sm text-gray-400 text-center mt-1.5 mb-6">{message}</p>

        <div className="flex flex-col gap-3 pb-2">
          <button
            onClick={onConfirm}
            className={`w-full py-4 rounded-2xl font-bold text-base transition-all active:scale-[0.98]
              ${danger ? 'bg-rose-500 text-white' : 'bg-brand-600 text-white'}`}
          >
            {confirmLabel}
          </button>
          <button
            onClick={onCancel}
            className="w-full py-3.5 rounded-2xl font-semibold text-sm text-gray-500 bg-gray-100 active:bg-gray-200"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
